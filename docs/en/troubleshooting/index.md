---
title: Troubleshooting Methodology
description: "Step-by-step diagnostic workflow: isolate layers from device to vision to scheduler, collect logs and snapshots, and verify changes."
updated: 2026-10-20
---

# Troubleshooting Methodology

Failures in automation pipelines rarely indicate total software breakdown; more often, a specific intermediate step failed to advance. Diagnosing issues layer by layer is faster than randomly testing configuration toggles.

## <DocIcon name="box" /> Layer-by-Layer Diagnostics

```text
Layer 0: Host Bootstrap (Does the Launcher or Android APK launch successfully?)
Layer 1: Backend Daemon (Is the WebUI listening? Port conflicts? Passwords?)
Layer 2: Device I/O (Is ADB connected? Are screenshots valid? Can inputs inject?)
Layer 3: Visual Recognition (Are pages recognized? Are button templates matching?)
Layer 4: Scheduler Logic (Are tasks prioritized, delayed, and recovering properly?)
Layer 5: In-Game Mechanics (Did game mechanics or seasonal events shift?)
```

Always troubleshoot from bottom to top. If Layer 2 fails to capture screens, modifying Layer 4 task parameters is useless.

## <DocIcon name="clipboard" /> Diagnostic Checklist

| Diagnostic Artifact | Source Location |
| --- | --- |
| Active Task & Status | WebUI Overview dashboard |
| Execution Output | `log/<date>_<instance>.txt` |
| Crash Snapshots | `log/error/<instance>/<timestamp>/` (screenshot + log.txt) |
| Desktop Launcher Traces | `log/<date>_launcher.txt` |
| Android Host Logs | `log/app.log`, `log/proot/session.log` |
| Device State | `adb devices` output; test screenshot button |
| Software Versions | Core commit hash, Launcher version, Android runtime version |

::: danger Sanitize Credentials Before Sharing Logs
Configuration exports contain emulator serials, private SSH keys, WebUI passwords, and remote pairing tokens. Scrub these fields before submitting bug reports.
:::

## <DocIcon name="search" /> Symptoms & Primary Inspection Points

| Symptom | Primary Diagnostic Point |
| --- | --- |
| WebUI unreachable | Check backend process status, port conflicts, and bind IP |
| Screenshot renders black | Switch capture method, verify emulator graphics renderer and resolution |
| Clicks have no effect | Check control backend, virtual display state, or privileged services |
| Misaligned recognition | Verify resolution is strictly 1280×720; check for character skins or gear overlays |
| Tasks fail repeatedly | Inspect the specific exception type in logs rather than treating it as a generic failure |
| Tasks do not execute | Check `Enable`, `NextRun` timestamp, task priorities, and sensitive mode halts |
| Settings do not take effect | Wait for task boundary reloads; check if values are locked in `override.yaml` |
| Crashes following an update | Roll back commits, check schema diffs, and verify dependency synchronization |

## <DocIcon name="scale" /> Isolate One Variable at a Time

Modify one setting at a time, recording behavior before and after:

1. Changing screenshot backends → Change capture method only; leave control method untouched.
2. Changing control backends → Change input method only.
3. Changing stage or fleet rules → Modify task parameters only.
4. Testing new instances → Create an isolated instance to determine if the issue is environmental.

Modifying multiple parameters at once obscures the root cause.

## <DocIcon name="hand" /> When to Halt Automation

| Operational Scenario | Action |
| --- | --- |
| Failure during sensitive tasks (cross-month, obscure, abyssal) | Do not retry repeatedly; preserve diagnostic dumps |
| Account triggers unusual login or anti-cheat warnings | Immediately stop all automation |
| Logs leak private credentials | Stop sharing immediately and scrub sensitive strings |
| Emulator restart thresholds exceeded | Inspect emulator installation rather than increasing retry limits |

## <DocIcon name="send" /> Submitting Actionable Bug Reports

Include:

- Complete version information (Core commit SHA, Launcher release, or Android runtime version)
- Operating system, emulator brand, and display resolution
- Step-by-step reproduction sequence
- Expected behavior vs. actual behavior
- Relevant log snippets and error snapshots
- Troubleshooting steps already attempted

Do not include:

- Plaintext `deploy.yaml`, `password.txt`, or `remote-access.json` files
- Unredacted account screenshots
- Generic "does not work" statements

## <DocIcon name="map" /> Platform Guides

<ul class="ap-linklist">
<li><a href="/en/troubleshooting/azurpilot">Core Program<span class="desc">Device connectivity, vision, scheduler, remote access</span></a></li>
<li><a href="/en/troubleshooting/android">Android Host<span class="desc">Runtime, privileges, hot-updates, keep-alive</span></a></li>
<li><a href="/en/troubleshooting/launcher">Desktop Launcher<span class="desc">Bootstrapping, ports, cross-platform dependencies</span></a></li>
</ul>
