---
title: Update, Repair & Uninstall
description: Two independent update tracks, environment repair steps, log locations, machine migration, and clean uninstallation.
updated: 2026-10-20
---

# Update, Repair & Uninstall

The launcher manages two distinct software layers: **the launcher binary** and **the core program**.

## <DocIcon name="refresh" /> Dual Update Tracks

| Dimension | Core Program | Desktop Launcher |
| --- | --- | --- |
| Update Trigger | `git pull` + `uv sync --frozen` at startup | Self-updater (mTLS + multi-mirror distribution) |
| Cadence | Follows `master` branch with daily commits | Versioned semantic releases |
| Impact Scope | In-game automation, WebUI, and API features | Application shell, startup flow, and process supervisors |
| Rollback Flow | Run `git checkout <sha>` | Replace executable with previous release archive |

### What Occurs During Core Updates

1. On startup, the launcher pulls the latest commits via `git pull`.
2. `uv sync --frozen` reconciles dependencies matching the updated `uv.lock`.
3. `gui.py` calls `ensure_frontend()` to verify `frontend/dist`, triggering a rebuild if needed (requires Node.js).
4. Refreshing the WebUI activates new assets; active instance workers restart automatically.

::: warning Frontend Builds Require Node.js
On Windows, the launcher detects system Node.js installations and automatically downloads a verified portable runtime if absent. Linux and macOS require manual Node.js installation; otherwise, frontend builds will fail following core updates.
:::

### What Occurs During Launcher Updates

- The launcher replaces its executable binary while preserving `.venv/`, `config/`, and `log/`.
- If a new version mandates a newer Python release or toolchain, it re-bootstraps `.venv` automatically without altering configuration files.
- Upstream core program code remains unchanged.

### Version Compatibility Matrix

| Combination | Behavior |
| --- | --- |
| New Launcher + Old Core | Functional; prompts to update core if new IPC contracts are required |
| Old Launcher + New Core | Functional, but may lack support for newer protocols (token auth, process tags) |
| Both Outdated | Functional, but missing upstream bug fixes and engine improvements |

Consult repository release notes and `CHANGELOG.md` rather than guessing compatibility from version strings.

## <DocIcon name="wrench" /> Environment Repair Procedures

### Corrupted Dependencies

Symptoms: Startup fails with `ModuleNotFoundError`, `ImportError`, or `uv sync` errors.

```bash
# Run in installation root
uv sync --frozen
```

If failures persist, wipe and rebuild the virtual environment:

```bash
# Delete virtual environment to force a clean bootstrap
rm -rf .venv          # Windows: rmdir /s /q .venv
```

::: danger Deleting .venv Preserves User Settings
The `.venv` folder houses runtime binaries only; `config/` and logs are located elsewhere. Rebuilding requires active internet connectivity.
:::

### Corrupted Git Repositories

Symptoms: `fatal: not a git repository`, merge conflicts, or failed updates.

```bash
git status
git stash            # Preserve local modifications
git pull --rebase
```

Never use `git reset --hard` blindly, as it wipes local configuration templates and unstaged tweaks.

### Port Conflicts

The default port is `22267`. The launcher automatically terminates conflicting processes bound to this port. Running alongside a standalone source instance (default port `25548`) causes no conflicts, but two simultaneous launcher instances will collide.

### Cache Directories

| Directory | Contents | Deletion Impact |
| --- | --- | --- |
| `cache/` | OCR runtime buffers, template cache | Safe to delete; regenerates automatically |
| `frontend/node_modules` | Frontend build dependencies | Safe to delete; reinstalled during builds |
| `frontend/dist` | Compiled frontend assets | Safe to delete; rebuilt by `gui.py` |
| `log/` | Diagnostic execution logs | Safe to delete, but preserve when troubleshooting |

### Diagnostic Log Locations

| Log Type | Path |
| --- | --- |
| Launcher Tracer | `log/<date>_launcher.txt` |
| Core Engine | `log/<date>_<instance>.txt` |
| Crash Snapshots | `log/error/<instance>/<timestamp>/` |

## <DocIcon name="laptop" /> Migrating to a New Machine

<Steps>
<Step title="Stop active instances on source machine">

Halt all workers to prevent in-flight writes to configuration files.

</Step>
<Step title="Copy config directory">

Copy `config/` including `deploy.yaml`. The account vault is tied to hardware keys and must be re-configured on the new machine.

</Step>
<Step title="Install and launch on target machine">

Launch the launcher on the target system once to let it complete environment bootstrapping, then close it.

</Step>
<Step title="Paste configuration">

Overwrite the target `config/` folder with your backup, then launch the application to verify instance lists and task states.

</Step>
<Step title="Reconfigure device bindings">

Adjust emulator serials, ADB binaries, and screenshot backends to match the new hardware environment.

</Step>
</Steps>

## <DocIcon name="circle-off" /> Clean Uninstallation

1. Quit the launcher via the system tray context menu, verifying that no orphan `gui.py` processes remain.
2. Back up `config/` and `AzurPilot_Data_Backup/`.
3. Delete the root directory.
4. If startup with Windows was enabled, remove the entry in Startup Apps.

## <DocIcon name="circle-alert" /> Quick Troubleshooting Matrix

| Symptom | Verification Check |
| --- | --- |
| Stalled at "Downloading Python" | Check network connectivity; switch to `-cn` mirror edition or edit `deploy.yaml` |
| Stalled at "Updating repository" | Verify proxy, branch name, and GitHub connectivity; test with `--skip-update` |
| Stalled at "Syncing dependencies" | Check PyPI mirror status and `uv.lock` integrity |
| Blank window on launch | Check WebView2 (Windows) or WebKitGTK (Linux) |
| Port conflict notification | Check if a secondary launcher instance is already active |
| Workers continue after closing window | Expected behavior: application is minimized to the system tray |
| Python process persists after tray exit | Process cleanup fault; inspect launcher logs for process scanning records |
| WebUI fails to load post-update | Frontend build failure; inspect Node.js availability and `frontend/dist` |
| macOS alerts application is damaged | Run `xattr -dr com.apple.quarantine /Applications/AzurPilot.app` |

For deep-dive process debugging, read [Backend Process Lifecycle](/en/launcher/developer/backend-lifecycle).
