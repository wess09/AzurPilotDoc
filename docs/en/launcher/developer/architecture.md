---
title: Tauri & Rust Architecture
description: Launcher 3.x React frontend, Rust/Tauri services, deploy lifecycle, authenticated WebSocket v2, and platform security.
updated: 2026-11-12
---

# Tauri & Rust Architecture

Launcher 3.x combines **React, Tauri 2, and Rust**. The previous documentation's assertion that it has no frontend project or that it relies on legacy HTTP SSE is obsolete.

## Source layout

| Path | Responsibility |
| --- | --- |
| `frontend/src/App.tsx` | Home, deploy/start/update/repair, cancellation, error reporting |
| `frontend/src/SettingsDialog.tsx` | Language, update channel, mirrors, display and power preferences |
| `src/launcher.rs` | Operation state machine |
| `src/components.rs` | Git/ADB packages, checksums and recovery journal |
| `src/setup.rs` | Python bootstrap, repository and dependency setup |
| `src/settings.rs` | SQLite settings |
| `src/backend.rs` | Python backend lifecycle |
| `src/launcher_control.rs` | Authenticated launcher-to-backend WebSocket |
| `src/updater.rs` | Launcher self-update |
| `src/power.rs` | Sleep prevention on three platforms |

## Deployment, startup and communication

The **Deploy** operation installs the Git/ADB runtime components and deploy scripts. **Start** then initializes Python 3.14.x, updates core code, synchronizes dependencies, builds the WebUI and launches `gui.py`. The local backend normally listens on port `22267`.

The launcher connects to `ws://127.0.0.1:<WebuiPort>/api/v2/launcher/ws` with `Authorization: Bearer <AP_WEBUI_TRUST_SECRET>`. It handles notifications, autostart commands and one-time login tickets. The browser continues to use the separate business WebSocket `/api/v1/ws` (protocol `v:1`). A 60-second, single-use `launcherTicket` allows the embedded page to sign in without exposing the WebUI password. Legacy HTTP SSE endpoints are no longer available.

The frontend uses Tauri IPC for privileged commands. Windows processes are managed with a Job Object; Unix uses process groups. On launcher exit, backend workers should stop without terminating independent emulators.

## Tray and context menu implementation

| Module | Source entry points | Responsibility |
| --- | --- | --- |
| Tray events | `src/main.rs`, `src/launcher.rs` | Register tray events, platform branches, menu actions and IPC commands |
| Windows tray popup | `src/tray_menu.rs`, `frontend/src/TrayMenu.tsx` | Pre-create a transparent WebView window, position it by DPI and pointer coordinates, and expose Home / Show-Hide / Quit |
| In-app context menu | `frontend/src/ContextMenu.tsx`, `frontend/src/contextMenu.module.css` | Replace the WebView default menu with refresh, copy, paste and select-all actions gated by selection and input focus |
| Permissions and tests | `capabilities/tray-menu.json`, `frontend/src/menus.test.tsx`, `frontend/src/focusRing.css` | Limit tray-window IPC access, test menu interactions and render visible keyboard focus |

Windows uses a custom Fluent tray popup; macOS retains the native NSMenu; Linux currently creates no tray icon. The Windows popup is pre-created and hidden at startup, then positioned beside the pointer. Focus loss, Esc or a quick second right-click closes it. Both platforms reuse `handle_tray_menu_action`.

The in-app context menu replaces the browser menu in WebView2 / WKWebView. Copy is enabled only when text is selected; paste and select-all require a focused input or text area. Clicking outside, losing window focus or pressing Esc closes the menu.

See [Update, Repair & Uninstall](/en/launcher/user/maintenance) for current main-branch status and user interactions.

## Verification

```bash
npm --prefix frontend test
npm --prefix frontend run build
cargo check --locked --all-targets
cargo test --locked --all-targets
cargo test --locked --test launcher_ws
```

Read [First Run](/en/launcher/user/first-run) and [Build & Release](/en/launcher/developer/build-release).
