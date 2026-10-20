---
title: Tauri & Rust Architecture
description: Dual window model, custom URI protocols, launch state machine, tray, native notifications, and WebView boundaries.
updated: 2026-10-20
---

# Tauri & Rust Architecture

The launcher functions as a visual installer and process supervisor. It contains no standalone web frontend project; the WebView renders embedded HTML assets served via custom URI schemes outside the default `tauri://` handler.

## <DocIcon name="monitor" /> Window Management

| Window | Dimensions | Behavior |
| --- | --- | --- |
| `main` | 1280×880 | Resizable; initially hidden until backend signals ready |
| `splash` | 800×450 | Frameless, non-resizable; spawned first to report progress |

Custom browser arguments applied to the WebView:

```text
--enable-features=msWebView2EnableDraggableRegions
--disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection
--no-proxy-server
```

- `--no-proxy-server`: Ensures requests to the local WebUI bypass system proxies, avoiding `127.0.0.1` routing issues.
- SmartScreen disabled: Internal embedded HTML requires no external verification.

::: tip macOS WKWebView Differences
The `additionalBrowserArgs` configuration is ignored by WKWebView on macOS. Handle platform divergences using `#[cfg]` attributes.
:::

## <DocIcon name="plug" /> Custom URI Schemes

| Scheme | Contents |
| --- | --- |
| `alas-splash://` | Displays initialization stages and download progress |
| `alas-error://` | Displays crash diagnostics and log inspection tools |

Views are driven by embedded HTML strings coupled with `splash-progress.js`. State transitions push from Rust to the WebView via Tauri events; JavaScript handles presentation only.

Workflow for modifying views:

1. Update HTML templates in `main.rs` or modify `splash-progress.js`.
2. Add corresponding localization keys across all four `locales/*.yml` files.
3. Test layout rendering using `--preview-crash`.
4. Validate visual presentation across Windows, macOS, and Linux.

## <DocIcon name="rocket" /> Startup State Machine

```text
Idle
 → Splash (spawn frameless window)
   → Provisioning (bootstrap environment)
     → Updating (git pull + uv sync)
       → StartingBackend (free ports, spawn gui.py)
         → Waiting (poll up to 60 seconds)
           → Ready (reveal main window, inject auth session)
             → Running (system tray residency)
```

Failures at any stage transition to the `Error` state, loading `alas-error://` with error details and retry actions.

## <DocIcon name="handshake" /> WebView and Rust Communication

| Direction | Mechanism | Purpose |
| --- | --- | --- |
| Rust → WebView | Tauri event | Pushes progress, error states, and theme changes |
| WebView → Rust | `#[tauri::command]` | Triggers retries, opens logs, and quits app |
| Backend → Launcher | HTTP SSE `/api/notify_stream` | Streams task notifications |
| Backend → Launcher | HTTP `/api/launcher/stream` | Issues quit, restart, and autostart directives |

The backend never invokes launcher functions directly; it sends commands over HTTP streams for the launcher to validate and execute. This boundary prevents the backend from terminating unintended host processes.

## <DocIcon name="box" /> System Tray & Desktop Integration

| Feature | Implementation |
| --- | --- |
| System Tray | `tauri` tray-icon feature |
| Context Menu | Show main window, restart backend, open logs directory, quit |
| Notifications | Windows Toast / macOS / Linux native notification daemons |
| Single-Instance Lock | Focuses existing window when a second executable runs |
| Autostart on Boot | Windows registry Run key configured with `--start-minimized` |

Notification content arrives via SSE streams, localized to the launcher's active locale.

## <DocIcon name="message-text" /> Localization Architecture

```text
locales/zh-CN.yml   # Baseline reference
locales/zh-TW.yml
locales/ja.yml
locales/en.yml
```

Access translations via `t!("module.key")`, or with parameters via `t!("k", p = v)` referenced as `%{p}` in YAML files. Every added key must be populated across all four files; missing keys fall back to displaying the raw string path.

## <DocIcon name="shield" /> Security Boundaries

| Vector | Protection Mechanism |
| --- | --- |
| Administrative Rights | Windows manifest enforces `requireAdministrator` |
| Self-Updates | Authenticated over mTLS client certificates; secrets excluded from repository |
| Local WebUI Access | Enforces `--no-proxy-server` and injects single-use login tokens |
| Process Isolation | `CREATE_NO_WINDOW` prevents rogue console popups |
| Process Cleanup | Combines environment tags with Windows Job Objects to clean process trees on exit |
| Logging Hygiene | Authentication tokens and credentials are scrubbed from log outputs |

## <DocIcon name="shield" /> Implementation Pitfalls

| Anti-Pattern | Reason |
| --- | --- |
| Relying on `additionalBrowserArgs` on macOS | Unsupported by WKWebView |
| Logging via `println!` | Invisible in windowed builds and omitted from log files |
| Forcibly killing the backend directly | Bypasses Job Object and process group cleanup, creating orphan workers |
| Updating only one localization YAML | Other locales will display raw translation keys |
| Hardcoding the uv path | Must fall back to system PATH if internal uv binary is missing |

## <DocIcon name="map" /> Related Documentation

<ul class="ap-linklist">
<li><a href="/en/launcher/developer/backend-lifecycle">Backend Process Lifecycle<span class="desc">Job Objects, breakaway rules, and process cleanup</span></a></li>
<li><a href="/en/launcher/developer/update">Update Pipelines & Mirrors<span class="desc">Git pull retries, uv sync, and mTLS verification</span></a></li>
<li><a href="/en/launcher/developer/build-release">Build & Release<span class="desc">Cross-platform packaging matrix</span></a></li>
</ul>
