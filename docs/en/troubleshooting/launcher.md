---
title: Desktop Launcher Troubleshooting
description: Resolve environment bootstrap failures, port conflicts, proxy issues, macOS/Linux dependency errors, and orphan processes.
updated: 2026-10-20
---

# Desktop Launcher Troubleshooting

Launcher errors fall into two categories: **bootstrap failures** (environment setup stalled) and **runtime failures** (backend launched but unreachable). Inspect the diagnostic error screen to identify the active phase.

## <DocIcon name="rocket" /> Bootstrapping Phases

| Phase | Symptom | Root Cause | Remediation |
| --- | --- | --- | --- |
| Create `.venv` | Stalled or permission error | Read-only path or illegal characters | Move installation to user directory |
| Download Python | Timeout or checksum failure | Unreachable mirror | Switch to `-cn` edition or change network |
| Update repository | Git execution failure | Proxy misconfigured, missing branch, disk full | Inspect `deploy.yaml`; test with `--skip-update` |
| Sync dependencies | `uv sync` failed | PyPI unreachable or lockfile mismatch | Change PyPI mirror; verify code and lockfile versions |
| Launch backend | Immediate process exit | Port collision or Python crash | Inspect backend output and port bindings |
| Render window | Blank white view | Missing WebView2 runtime | Install WebView2 Runtime / WebKitGTK |

### Common Recovery Commands

```bash
# Launch without pulling repository updates
./alas-launcher --skip-update

# Re-synchronize dependencies
uv sync --frozen

# Rebuild virtual environment from scratch
rm -rf .venv
```

::: danger Deleting .venv Preserves Configurations
User settings reside in `config/` and logs reside in `log/`. Rebuilding `.venv` requires active internet connectivity.
:::

## <DocIcon name="plug" /> Port Conflicts

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| Port occupied alert | Another launcher or backend is using port 22267 | Terminate older process |
| Backend fails but port is free | Mismatch between launcher and backend port settings | Inspect `WebuiPort` in `deploy.yaml` |
| Port altered but UI fails to load | WebView cached previous address | Restart desktop launcher |

The launcher frees conflicting processes on its target port on launch. Running alongside standalone source installations (port 25548) causes no conflict.

## <DocIcon name="cloud" /> Network & Proxy Issues

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| Repository update timeout | GitHub unreachable | Use CN edition or configure `GitProxy` |
| Slow Python downloads | Default mirror stalled | Switch networks or configure regional mirrors |
| Dependency install 403 | Corporate firewall block | Configure PyPI mirrors or proxy whitelists |
| Backend running but UI unreachable | System proxy intercepting loopback | Launcher applies `--no-proxy-server`; verify local proxy rules |

## <DocIcon name="laptop" /> macOS

| Symptom | Remediation |
| --- | --- |
| "App is damaged" alert | Run `xattr -dr com.apple.quarantine /Applications/AzurPilot.app` |
| Launches without window | Inspect crash reports in Console.app; confirm CPU architecture match |
| System tray icon missing | Menu bar crowded; remove unused status items |

## <DocIcon name="wrench" /> Linux

| Symptom | Remediation |
| --- | --- |
| Missing `libwebkit2gtk-4.1` | Run `sudo apt install libwebkit2gtk-4.1-0` |
| `GLIBC_2.xx not found` | Operating system glibc too old; run core program via source CLI |
| System tray icon missing | Install AppIndicator desktop extension |
| Sandbox permission errors | Avoid running inside Flatpak or Snap sandboxes; execute binary directly |

## <DocIcon name="monitor" /> Windows

| Symptom | Remediation |
| --- | --- |
| UAC prompt denied | Must be executed with Administrator privileges |
| SmartScreen block | Click "More info" followed by "Run anyway" |
| Missing WebView2 | Install Microsoft Edge WebView2 Evergreen Runtime |
| Antivirus quarantines `git.exe` | Whitelist the `.venv/` folder in antivirus software |
| Path contains non-ASCII characters | Move installation to a simple ASCII directory path |

## <DocIcon name="circle-alert" /> Residual Processes

| Symptom | Root Cause | Remediation |
| --- | --- | --- |
| `python.exe` persists after exit | Process cleanup fault | Inspect launcher logs for process scanning records; reboot |
| Emulator closed when launcher exits | Inherited Job Object | Confirm backend and launcher both support Job breakaway |
| Launching app spawns dual backends | Single-instance lock failed | Terminate all active processes before restarting |

Read [Backend Process Lifecycle](/en/launcher/developer/backend-lifecycle) for complete supervision details.
