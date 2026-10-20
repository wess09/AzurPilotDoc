---
title: Android Update, Backup & Maintenance
description: Differences between APK, Runtime, and script hot update channels, validation rules, data backups, and troubleshooting.
updated: 2026-10-20
---

# Android Update, Backup & Maintenance

The Android host maintains three independent update channels:

## <DocIcon name="refresh" /> The Three Update Channels

| Channel | Updated Content | Trigger | Data Retention |
| --- | --- | --- | --- |
| App (APK) | Kotlin host, native bridge, UI | In-app check / APK overwrite | Yes |
| Runtime (Full) | Ubuntu rootfs, Python, dependencies, OCR | Manual toggle in Settings | Yes (preserves config / logs) |
| Script Hot-Update | Upstream AzurPilot source + frontend dist | Automatic (idle) / manual | Yes |

### <DocIcon name="smartphone" /> App Updates

- Lightweight thin APKs target specific ABIs without bundled rootfs payloads, keeping downloads minimal.
- Downloaded packages are verified against SHA-256 hashes before passing to the system package installer.
- **Signing certificates must match**: Debug and Release builds cannot overwrite each other; doing so causes `INSTALL_FAILED_UPDATE_INCOMPATIBLE` requiring full uninstallation.
- Downgrading version codes requires `adb install -r -d`.

### <DocIcon name="package" /> Runtime Full Updates

Evaluation relies on `BUILD_MANIFEST.rootfs_version`:

```text
<upstream-commit-first-12>-<build-input-hash-first-10>
```

- Matching input hash with different commit → Sets `commitOnly`; handled via script hot-update.
- Differing input hash → Requires full rootfs redeployment (Python, system libraries, overlays, or dependencies changed).

Full updates preserve `config/` (SQLite and instance configurations), `password.txt`, and `log/`.

### <DocIcon name="zap" /> Script Hot-Updates

Hot-updates swap source scripts and pre-built frontend assets without altering the underlying Python binary:

1. Evaluates target commit on upstream tracking branch.
2. Shallow-clones the commit into `/opt/azurpilot-update/source` (prioritizing CNB mirrors with GitHub fallback).
3. **Compares `uv.lock`**: If lockfiles differ, sets `requiresRuntimeUpdate=true` and aborts hot-update in favor of full deployment.
4. Executes `npm ci` and `npm run build` in a temporary directory (600s timeout).
5. Writes a transaction record and halts running instances.
6. Backs up previous dist → Swaps source code → Installs new dist → Atomically updates manifest → Restores instances.
7. Reverts to prior source, dist, and manifest on any failure.

::: warning Hot-Updates Do Not Install Python Dependencies
Dependency installations are intentionally blocked during hot-updates to prevent unverified libraries from entering production. Any change to `uv.lock` requires a full Runtime update.
:::

Automatic hot-updates run only when instances are idle. Hot-updates and full deployments share a unified pipeline lock.

## <DocIcon name="compass" /> Selecting the Right Update Channel

| Scenario | Recommended Channel |
| --- | --- |
| Routine upstream automation script updates (no dependency changes) | Script Hot-Update |
| Upstream modifies `uv.lock` or Python dependencies | Full Runtime Update |
| UI enhancements or native bridge bugfixes | App APK Update |
| Device migration or clean reinstallation | Full APK + Restore config backup |
| Crashes following a hot-update | Inspect transaction log; rollback or run full update |

## <DocIcon name="drive" /> Backup Checklist

| Content | Path | Importance |
| --- | --- | --- |
| Instance Configurations | Runtime `config/*.json` | Critical |
| Server Configuration | `config/deploy.yaml` | Contains credentials |
| Analytics Database | `config/azurpilot.db` | Historical records |
| Diagnostic Logs | `log/` and `proot/session.log` | 7-day rotation |
| Remote Pairing Tokens | `config/remote-access.json` | Preserves fixed tunnel endpoints |

Export options:

1. Settings → Logs → Export (generates a zip archive).
2. Command line: `adb pull /sdcard/Android/data/com.azurpilot.ghio/files/`.

::: danger Uninstallation Deletes All Data
Uninstalling the app wipes the Linux Runtime, instance settings, and logs without keeping cloud copies. Export settings before removing the app.
:::

## <DocIcon name="wrench" /> Troubleshooting Common Failures

### <DocIcon name="circle-alert" /> Runtime Fails to Start

| Symptom | Verification Check |
| --- | --- |
| Status `NotInstalled` | Tap "Download Runtime" on Home screen |
| Status `LowDisk` | Ensure device has ≥ 2 GB free internal storage |
| Status `NotBundled` | Verify architecture matches release packages |
| Status `Failed` | Expand error `reason`; switch download mirrors and retry |
| WebUI loading exceeds 90s | First-time bytecode compilation is running; wait for completion |

### <DocIcon name="circle-alert" /> Immediate App Crashes

- Architecture mismatch (e.g. attempting to run an x86 APK on an ARM processor).
- External storage inaccessible on startup.
- Incompatible signature during update installation.

### <DocIcon name="lock" /> Permissions Revoked in Background

Device OEM battery managers may revoke granted permissions:

- Overlay permission revoked → Floating panel disappears.
- Battery optimization reset → Process terminated when display sleeps.
- USB debugging authorization cleared → Privileged service dies; re-pair required.

Solution: Re-grant permissions and ensure the app is added to OEM Autostart whitelists.

### <DocIcon name="circle-alert" /> Task Interruption Causes

| Diagnostic Clue | Root Cause |
| --- | --- |
| Logs abruptly cut off with no stack trace | Process killed by OS low-memory killer (LMK) |
| `EmulatorNotRunningError` | Virtual display or privileged bridge crashed |
| Repeated consecutive `ScriptError` entries | Upstream automation bug; check for updates |
| Crash following hot-update | Inspect `config/android-update-transaction.json` to verify rollback |
| Frontend compilation timeout | Device performance or storage constraints during on-device build |

### <DocIcon name="clipboard" /> Diagnostic Commands

```bash
# Stream app logs
adb logcat -v time --pid=$(adb shell pidof com.azurpilot.ghio)

# Inspect Runtime session logs
adb shell tail -n 200 /sdcard/Android/data/com.azurpilot.ghio/files/log/proot/session.log

# Forward WebUI port to PC browser
adb forward tcp:25548 tcp:25548
```

Windows users can utilize `tools/watch-android-logs.ps1` to track `com.azurpilot.ghio` logs automatically.
