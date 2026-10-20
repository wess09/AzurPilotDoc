---
title: Troubleshooting Core Program
description: Resolve device connection drops, vision recognition mismatches, scheduler stalls, and remote access issues.
updated: 2026-10-20
---

# Troubleshooting Core Program

## <DocIcon name="smartphone" /> Device Connectivity & ADB

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| `adb devices` is empty | ADB debugging disabled or adb server stopped | Enable ADB debugging in emulator; run `adb start-server` |
| Device reports `offline` | ADB version conflicts across installed emulators | Standardize ADB versions or use emulator's bundled adb |
| Connected to wrong emulator | Incorrect serial or misjudged `auto` detection | Specify target serial explicitly (`host:port`) |
| Frequent disconnections | Power saving mode or USB selective suspend | Disable power saving; switch capture backend to `ADB_nc` |
| Emulator restart fails | Missing emulator executable path | Configure `EmulatorInfo.name` and `EmulatorInfo.path` |

## <DocIcon name="eye" /> Screenshot Capture

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| Frame renders completely black | Dedicated graphics renderer blocking standard ADB capture | Switch to `DroidCast_raw`, `nemu_ipc` (MuMu), or `ldopengl` (LDPlayer) |
| Capture timeouts | Backend process hung | Switch backends; enable "Restart ADB when no device detected" |
| Screen tearing / artifacting | Scaling or color compression errors | Disable "Screenshot Dedithering" in settings |
| Frame dimensions not 1280×720 | Custom DPI or resolution applied in emulator | Reset emulator display to exactly 1280×720 |
| Frame valid but clicks offset | Display scaling mismatch | Reset resolution and DPI to standard values; disable OS-level DPI scaling |

## <DocIcon name="brain" /> Visual Recognition

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| Cannot locate buttons | Character skins or gear overlays obstructing UI | Revert to default character skins; update core recognition assets |
| OCR reads incorrect numbers | Color threshold mismatch or non-standard font sizes | Confirm 1280×720 resolution; evaluate alternative OCR models |
| Stalled on unknown page | Unhandled event popup dialog | Review error snapshots; dismiss dialog manually and restart task |
| Recognition works on phone but fails on emulator | Sub-pixel font rendering differences | Adjust capture backend rather than modifying template assets |

::: tip Review Crash Snapshots
Images inside `log/error/<instance>/<timestamp>/` represent the exact frames processed by the engine during failure.
:::

## <DocIcon name="zap" /> Scheduler Execution

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| Tasks never execute | Task disabled, `NextRun` in the future, or queue empty | Verify `Enable` toggle and scheduled execution time |
| Single task dominates execution | Higher priority task is permanently due | Adjust priority ordering or task delay intervals |
| Continual game restarts | `GameStuckError` or unhandled screen | Inspect error snapshots and server maintenance status |
| Instance worker halts unexpectedly | Sensitive task failure or 3 consecutive `ScriptError` exceptions | Inspect the trailing 100 log lines |
| Stalled in task for hours | Logic loop while log stream continues | Enable watchdog monitoring (`Watchdog*`) |
| Task postponed to next reset | Exceeded `TaskRestartLimit` threshold | Resolve root cause or increase restart limits |
| Multi-instance cross-talk | Instances share ADB serial or instance name | Ensure each instance maps to a unique serial and emulator |

### Diagnostic Log Markers

| Log Marker | Significance |
| --- | --- |
| `Consecutive failures` | Failure counter incremented; may escalate to emulator reboot |
| `Restart` | Recovery task injected into queue |
| `EmulatorOpBusy` | Previous lifecycle operation pending; iteration skipped |
| `ScriptError` | Unhandled code exception |
| `RequestHumanTakeover` | Ambiguous game state; automatic recovery initiated |
| `[Server Check]` | Server maintenance probe running |

## <DocIcon name="settings" /> Configuration Management

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| Settings do not apply | In-flight task is executing | Wait for active task to conclude or restart instance |
| Settings revert upon save | Property is locked in `override.yaml` | Verify if setting is user-modifiable |
| Save conflict alert | Concurrent modifications across tabs | Reload page and re-apply changes |
| Missing properties post-import | Version migration schema upgrade | Review task configuration forms manually |
| UI displays raw schema keys | Missing translation in `i18n/*.json` | Update core repository or add missing strings |

## <DocIcon name="cloud" /> Remote Access

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| LAN dashboard unreachable | Bound to `127.0.0.1` or firewall blockage | Set `WebuiHost` to `0.0.0.0`; open port 25548 in firewall |
| Persistent URL returns 302 to `/error` | Host offline, lease expired, or Tunnel dropped | Inspect Remote Access status in WebUI |
| Infinite connection spinner | WebSocket blocked by upstream network | Switch network; verify outbound access to port 7844 |
| Pairing code expired alert | Code exceeded 5-minute validity window | Generate a new code |
| Revoked device still connects | Entry removed locally on phone only | Revoke client token on the host machine |
| MCP returns HTTP 401 | Missing credentials or password changed | Supply Bearer token; restart WebUI |

## <DocIcon name="refresh" /> Post-Update Failures

1. Inspect previous commit history via `git log`.
2. Confirm `frontend/dist` compiled successfully.
3. Verify dependencies are synchronized via `uv sync --frozen`.
4. Roll back code and re-sync dependencies if needed:

```bash
git log --oneline -5
git checkout <previous-stable-commit>
uv sync --frozen
```

## <DocIcon name="compass" /> Recommended Validation Flow

```text
1. Screenshot Test → Confirms video frame capture
2. Manual Test Click → Confirms touch input injection
3. Single Task Run Now → Confirms task logic execution
4. Start Scheduler → Confirms queue dispatch
5. Enable Secondary Task → Confirms task transitions
6. Launch Secondary Instance → Confirms resource limits
```
