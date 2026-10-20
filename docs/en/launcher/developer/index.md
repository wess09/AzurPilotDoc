---
title: Launcher Developer Portal
description: Module layout, build commands, compile-time environment variables, and cross-platform rules for the Tauri 2 and Rust desktop launcher.
updated: 2026-10-20
---

# Launcher Developer Portal

The launcher repository contains no dedicated frontend project: all interface views are embedded HTML assets served via custom URI schemes. Modifying the UI involves updating embedded Rust strings rather than working inside a React project.

## <DocIcon name="laptop" /> Development Toolchain

| Tool | Version |
| --- | --- |
| Rust | stable (edition 2021) |
| Node.js | Required only for the Tauri CLI (`cargo tauri`) |
| System Dependencies | Windows: WebView2; Linux: `libwebkit2gtk-4.1`, `libgtk-3`; macOS: Xcode CLI |

```bash
cargo build              # Debug compilation
cargo build --release    # Release build with LTO and binary stripping
cargo tauri dev          # Live development workflow
cargo test               # Execute full test suite
cargo check              # Fast syntax and type verification
```

::: warning Elevated Terminal Required on Windows
The application manifest specifies `requireAdministrator`. Running test binaries without elevation fails with Error 740, which also prevents `cargo test` from executing correctly.
:::

## <DocIcon name="box" /> Core Modules

| Module | Responsibility |
| --- | --- |
| `main.rs` | Tauri entry point: manages splash/main windows, system tray, titlebar injection, error view, command registration, and time bomb |
| `setup.rs` | Environment bootstrapping: installs Python, uv, adb, and git; runs `git pull` with 20 retries; runs `uv sync`; migrates `deploy.yaml` |
| `backend.rs` | Supervises `gui.py` process lifecycle, frees conflicting ports, and enforces cleanup via environment tags |
| `backend_process.rs` | Manages Windows Job Objects and Unix process groups |
| `nodejs.rs` | **Windows only**: Detects system Node.js; downloads and installs standalone runtime with SHA-256 validation if missing |
| `notify.rs` | Consumes SSE notification streams (`/api/notify_stream`) and triggers OS-native notifications |
| `launcher_control.rs` | Consumes reverse control streams (`/api/launcher/stream`) to handle quit, restart, and autostart directives |
| `autostart.rs` | Manages system startup entries (writes Windows registry Run key with `--start-minimized`) |
| `i18n.rs` | Resolves localization: evaluates `--lang` > system locale > fallback to `en` |
| `window_util.rs` | Applies Windows `CREATE_NO_WINDOW` flags to suppress console popups from child processes |

## <DocIcon name="settings" /> Compile-Time Environment Variables

Read by `build.rs` during compilation:

| Variable | Purpose | Default / Fallback |
| --- | --- | --- |
| `ALAS_BOOTSTRAP_UV` | Embedded uv binary path | Empty placeholder; falls back to PATH at runtime |
| `ALAS_LAUNCHER_MTLS_IDENTITY_PEM_B64` | Client certificate for mTLS self-updates | Reads uncommitted `证书.txt` at repository root |
| `LAUNCHER_UPDATE_URL` | Overrides default self-update endpoint | `https://launcher-api.azurpilot.com/updata/stable.json` |

::: danger Keep Certificates Out of Source Control
Never commit `证书.txt` or base64-encoded PEM materials. CI injects credentials via GitHub Actions Secrets.
:::

## <DocIcon name="key" /> Key Constants

| Constant | Value |
| --- | --- |
| WebUI Port | `22267` |
| Python Version | `3.14.6` |
| Backend Readiness Timeout | 60 seconds |
| SSE Reconnect Interval | 3 seconds |
| Tauri Identifier | `moe.taiho.alas-launcher` |
| Product Name | `AzurPilot` |

The time bomb configuration lives under `[package.metadata.alas-launcher.time-bomb]` in `Cargo.toml` (currently `enabled = false`).

## <DocIcon name="shield" /> Engineering Conventions

| Rule | Description |
| --- | --- |
| Localization | Maintained across four files in `locales/{zh-CN,zh-TW,ja,en}.yml` with `zh-CN.yml` as baseline; new keys must exist in all four |
| Platform Branching | Process, window, notification, and path code must account for all three platforms via `#[cfg(target_os)]` |
| Child Processes | Always apply `CreateNoWindow` on Windows to suppress console windows |
| Structured Logging | Use `tracing` outputting to `log/{date}_launcher.txt`; avoid unformatted `println!` |
| Versioning | Synchronize version strings across `Cargo.toml`, `tauri.conf.json`, and `CHANGELOG.md` before tagging |
| Deployment Profiles | Six `deploy.*.yaml` files serve as runtime configurations; setup changes must preserve `-cn` variants |

## <DocIcon name="flask" /> Testing

```bash
cargo check --locked --all-targets
cargo test --locked --all-targets
cargo test --locked backend_process::tests
```

The `test.yml` workflow runs across Linux, macOS, and Windows x64/ARM64 without requiring release secrets.

## <DocIcon name="map" /> Documentation Map

<ul class="ap-linklist">
<li><a href="/en/launcher/developer/architecture">Tauri & Rust Architecture<span class="desc">Windows, URI protocols, and system tray</span></a></li>
<li><a href="/en/launcher/developer/backend-lifecycle">Backend Process Lifecycle<span class="desc">Job Objects and orphan process cleanup</span></a></li>
<li><a href="/en/launcher/developer/update">Update Pipelines & Mirrors<span class="desc">Git, uv, and mTLS update architectures</span></a></li>
<li><a href="/en/launcher/developer/build-release">Build & Release<span class="desc">Cross-platform CI matrix</span></a></li>
</ul>
