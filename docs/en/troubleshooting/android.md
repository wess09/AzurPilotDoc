---
title: Android Troubleshooting
description: Diagnose and resolve Runtime deployment failures, Shizuku privilege drops, black screens, background termination, and hot-updates.
updated: 2026-10-20
---

# Android Troubleshooting

## <DocIcon name="compass" /> Diagnostic Phases

| Phase | Manifestation | Primary Inspection |
| --- | --- | --- |
| Installation | Parse error, app crash on open | CPU architecture, signing keys |
| Deployment | Stalled on Checking / Downloading / Extracting | Network, storage capacity, ABI matching |
| Startup | Runtime fails to boot | Logcat traces, WebUI readiness |
| Activation | Paired successfully but service not running | USB debugging confirmation, port 5555 |
| Execution | Virtual display renders black, clicks fail | Privileged service status, screenshot backend |
| Backgrounding | Tasks stop when display sleeps | Battery optimization exemptions, keep-alive settings |
| Updates | Hot-update fails, crash on boot | Transaction logs, rollback recovery |

## <DocIcon name="package" /> Installation & Deployment

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| Parse error on install | Corrupted APK or mismatched architecture | Re-download package matching device ABI |
| Instant crash on launch | 32-bit device or incompatible ABI | Requires 64-bit ARM or x86_64 hardware |
| Status `NotBundled` | Thin APK used without release support | Switch to Full APK |
| Status `LowDisk` | Free storage is below 2 GB | Free internal disk space |
| Download stalled | Mirror returned challenge page or proxy block | Switch download mirror |
| Checksum validation failed | Corrupted download or mirror divergence | Delete partial file and retry |
| Extraction failed | Storage exhausted or interrupted | Retry; switch to Full APK if failures persist |

::: tip Initial WebUI Startup Delays
Pre-compiled `__pycache__` is stripped from distribution packages. Initial bytecode compilation can take upwards of 90 seconds. The warning `WebUI not ready within 90000ms` is expected behavior.
:::

## <DocIcon name="lock" /> Permissions & Activation

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| Paired but service not running | USB debugging dialog was not confirmed | Re-pair and check "Always allow from this computer" |
| Activation lost after reboot | adbd permissions reset on boot | Re-pair via wireless debugging (expected OS behavior) |
| Binder timeout | Privileged process terminated by battery saver | Disable battery optimization; retry |
| External Shizuku unreachable | Manager app stopped or permission revoked | Open manager app and re-grant permissions |
| Crash on MediaTek devices | Custom OEM ROM class injection | Context-only initialization is active; submit logs if issue persists |
| Reconnection fails after network change | Debugging session cleared by OS | Re-activate wireless debugging |

## <DocIcon name="monitor" /> Virtual Displays & Screen Streaming

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| Automation view renders black | Privileged service inactive | Verify activation status |
| Video renders but clicks fail | Control backend not set to `azurpilot_android` | Set control method to Android host backend |
| Frozen frame capture | Game application hung | Restart game / instance |
| Game appears on physical screen | Virtual display creation failed | Verify virtual display allocation in logs |
| Login dialog appears on main screen | OEM redirect behavior | Handled by `SdkTaskRepatriator`; dismiss manually if needed |

## <DocIcon name="zap" /> Background Termination

| Clue | Root Cause | Remediation |
| --- | --- | --- |
| Logs abruptly truncate | Process killed by OS low-memory killer | Set Battery Optimization to Unrestricted |
| Halts minutes after display sleeps | Vendor battery saver | Add app to vendor Autostart and Background whitelists |
| Occurs only on specific vendor ROM | Proprietary vendor task killer | Configure vendor-specific background policies |
| Foreground notification disappears | Foreground service killed | Restart Runtime |

## <DocIcon name="refresh" /> Hot-Updates & Full Updates

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| Hot-update prompts that full update is required | `uv.lock` modified upstream | Execute full Runtime update |
| Crash following hot-update | Rollback failed | Inspect `config/android-update-transaction.json` |
| Frontend compilation timeout | Hardware or storage constraints | Retain existing release and retry later |
| Configurations missing after full update | Interrupted deployment | Restore `config/` from backup |
| App update fails to install | Signature mismatch | Uninstall old version (export settings first) |

## <DocIcon name="scroll" /> Collecting Logs

```bash
adb logcat -v time --pid=$(adb shell pidof com.azurpilot.ghio)
adb shell tail -n 200 /sdcard/Android/data/com.azurpilot.ghio/files/log/proot/session.log
adb forward tcp:25548 tcp:25548
```

Export logs via "Settings → Logs → Export" to generate a diagnostic zip archive.
