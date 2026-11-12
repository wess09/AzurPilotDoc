---
title: Update, Repair & Uninstall
description: Launcher updates, environment repair, log export, uninstall, and the current main-branch tray and in-app context menus.
updated: 2026-11-12
---

# Update, Repair & Uninstall

**Launcher binaries, Git/ADB components and the AzurPilot core update independently.** A launcher self-update does not reinstall the core.

## Updates and settings

Select the **Stable** (default) or **Canary** update channel in Settings. Download source priority can be Auto, Official, GitHub or Cloudflare CDN, with fallback and integrity verification. Settings also control component/Python/PyPI mirrors, background music (off by default), reduced motion, sleep prevention and autostart. The background video pauses when the window is hidden; preventing system sleep does not require keeping the screen on.

## Repair versus deploy

| Action | Effect |
| --- | --- |
| Deploy | Installs Git/ADB and deploy scripts |
| Start | Sets up Python, core and WebUI, then starts the backend |
| Repair | Redownloads runtime tools and rebuilds `.venv`; retains source, `config/` and `log/` |
| Launcher update | Replaces the launcher executable, not user configuration |

Do not wipe the installation directory or run destructive Git commands just to recover from a failed download. Stop the backend first and use **Repair**. The launcher can export a ZIP of diagnostic logs in the background. Include the log ZIP and reproduction details in bug reports instead of screenshots alone; review logs for sensitive information before sharing.

On macOS, newer builds use `AzurPilot.app/Contents/AzurPilot` for application data and attempt to migrate older layouts. Back up `config/` and statistics before moving machines or uninstalling.

See [First Run](/en/launcher/user/first-run) and [Update Pipeline](/en/launcher/developer/update).

## Node.js runtime sources (stable 3.0.6)

Stable **3.0.6** restores automatic Node.js installation when the required runtime is missing. Node.js has an **independent download-source setting**, separate from Git, Python and PyPI mirrors: Auto, Taobao mirror, Nanjing University mirror or official source. On failure, alternative sources can be tried; packages are checked against official SHA-256 values. For a failed first run, change the Node.js source in Settings and retry **Start** or **Repair** without deleting `config/` or logs. The source template version `0.0.0` is not the published release version.


## 3.0.7: standalone connection-error window and tray recovery

Launcher **3.0.7 (2026-11-08)** moves backend connection failures to a separate system window:

- When the backend cannot be reached, the window shows the reason and offers **Quit** and **Retry connection**.
- After a successful retry, the launcher returns to the WebUI automatically.
- If the backend is still unavailable when the error window closes, the main window moves to the system tray. An unexpected backend exit also triggers a system notification.
- On Windows, use the notification or double-click the tray icon to restore the main window.
- Confirmation, error and settings dialogs now share the WinUI 3 style.

Read the reported reason and try **Retry connection** first. Do not delete the workspace or reinstall the environment just because the WebUI is not visible.

## Current `main`: tray and in-app context menus

These interactions are present in the current `main` source, but their commits landed after stable **3.0.7 (2026-11-08)**. They are not included in the 3.0.7 installer; wait for a later release.

### System tray

- **Windows**: right-click the tray icon to open a Fluent custom menu with **Launcher Home**, **Show / Hide** and **Quit**. It opens beside the pointer and closes on focus loss, Esc or a quick second right-click.
- **macOS**: keeps the native system menu, opened by clicking the menu-bar icon.
- **Linux**: the current source does not create a tray icon.
- **Windows left-click / double-click**: opens WebUI while the backend is running; otherwise returns to the launcher home.

### In-app context menu

The launcher main window replaces the WebView's default browser menu with a theme-aware Fluent menu:

- Refresh is always available.
- Copy is enabled only when text is selected.
- Paste and Select All are enabled only when an input or text area is focused.
- Esc, clicking outside the menu or window focus loss closes it.
- Paste requires WebView clipboard-read permission. If permission is denied or reading fails, the action is skipped.

Keyboard focus has a visible rainbow outline. Reduced-motion settings disable the menu entrance animation.
