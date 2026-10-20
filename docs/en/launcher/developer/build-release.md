---
title: Build & Release
description: Build commands, compile-time environment variables, CI packaging matrix, version synchronization, and release deliverables.
updated: 2026-10-20
---

# Build & Release

Launcher distribution packages bundle Python, uv, git, and adb into a portable archive for true out-of-the-box execution.

## <DocIcon name="laptop" /> Local Compilation

```bash
cargo build              # Debug compilation
cargo build --release    # Release build with LTO and binary stripping
cargo tauri dev          # Live development server
cargo check --locked --all-targets
cargo test --locked --all-targets
```

### Compile-Time Injections

| Variable | Purpose | Result if Omitted |
| --- | --- | --- |
| `ALAS_BOOTSTRAP_UV` | Embedded uv binary path | Falls back to system PATH at runtime |
| `ALAS_LAUNCHER_MTLS_IDENTITY_PEM_B64` | Self-update mTLS certificate | Falls back to `证书.txt`; self-update disabled if missing |
| `LAUNCHER_UPDATE_URL` | Overrides update manifest endpoint | Uses default `launcher-api.azurpilot.com` |

Local development typically sets `ALAS_BOOTSTRAP_UV` and leaves mTLS self-updates unconfigured.

::: danger Windows Local Builds Require UAC Elevation
The application manifest embeds `requireAdministrator` inside `build.rs`. Testing process supervisors requires running an elevated terminal.
:::

## <DocIcon name="cloud" /> CI Packaging Pipeline

Configured in `.github/workflows/package.yml`, triggered on Git tag pushes or manual workflow runs:

| Step | Action |
| --- | --- |
| Version Parsing | Tags must follow semantic notation such as `2.0.6` (rejects `v2.0.6`) |
| Dependency Caching | Pre-caches platform binaries for Python, git, adb, and uv |
| Compilation | Runs `cargo build --release` across distinct runner caches |
| Packaging | Compresses archives to `tar.xz` using preset 9 + extreme compression |
| Publishing | Uploads GitHub Releases and publishes update manifests and payloads |

The CI matrix covers all three platforms, producing standard and `-cn` mirror packages:

```text
AP-<OS>-<arch>.tar.xz
AP-CN-<OS>-<arch>.tar.xz
```

Windows builds also generate an Inno Setup installer (`install.iss`).

## <DocIcon name="flask" /> Testing Workflows

The `.github/workflows/test.yml` workflow runs on pushes to `main`, PRs, and manual triggers:

| Runner Target | Verification Commands |
| --- | --- |
| Linux / macOS / Windows x64 / ARM64 | `cargo check --locked --all-targets` |
| Linux / macOS / Windows x64 / ARM64 | `cargo test --locked --all-targets` |

Tests execute without release signing keys, allowing forks to run CI checks cleanly.

## <DocIcon name="refresh" /> Version Synchronization

Before tagging a release, synchronize version strings across three locations:

```text
Cargo.toml           version = "2.2.5"
tauri.conf.json      "version": "2.2.5"
CHANGELOG.md         Matching release entry
```

::: warning Consequences of Version Desynchronization
The version in `tauri.conf.json` is embedded into application metadata and parsed during self-updates. Modifying only `Cargo.toml` causes the updater to continually prompt that a newer version is available.
:::

Tags must use clean semantic versions without prefixes: `2.2.5` rather than `v2.2.5`.

## <DocIcon name="package" /> Release Deliverables

| Deliverable | Purpose |
| --- | --- |
| `AP-*.tar.xz` | Global standalone portable distribution |
| `AP-CN-*.tar.xz` | Mainland China mirror distribution |
| Windows Installer | Optional installer creating Start Menu entries and uninstaller |
| `stable.json` | Self-update manifest |
| Binary Payloads | Uploaded to Cloudflare R2 and CNB Releases |

Manifests are hosted on Cloudflare static storage; download endpoints use HTTP 302 redirects to point to storage buckets.

## <DocIcon name="circle-check" /> Release Checklist

- [ ] Version numbers match across `Cargo.toml`, `tauri.conf.json`, and `CHANGELOG.md`
- [ ] `cargo check --locked --all-targets` passes
- [ ] `cargo test --locked --all-targets` passes (in elevated terminal)
- [ ] Clean boot test verified across Windows, macOS, and Linux
- [ ] Windows UAC prompts and system tray functionality verified
- [ ] macOS initial launch verified after `xattr` quarantine removal
- [ ] Linux system package dependencies (`libwebkit2gtk-4.1`) verified
- [ ] Download mirrors validated for both Global and CN editions
- [ ] Self-updater tested: older version detects and installs update successfully
- [ ] Rollback tested: overwriting with older binary launches cleanly
- [ ] Verified running emulator processes survive launcher exit (backend lifecycle)
- [ ] Verified uninstallation leaves no orphaned registry keys

## <DocIcon name="megaphone" /> Post-Release Procedures

| Task | Purpose |
| --- | --- |
| Update `stable.json` | Notifies existing installations of the new release |
| Upload to R2 and CNB | Ensures both download mirrors are populated |
| Verify HTTP 302 Redirects | Ensures `launcher-download` routes to valid URLs |
| Monitor Issue Tracker | Watch for first-day bootstrap crash reports |

## <DocIcon name="monitor" /> Multi-Platform Considerations

| Platform | Specific Requirements |
| --- | --- |
| Windows | WebView2, UAC elevation, Toast notifications, `CREATE_NO_WINDOW` |
| macOS | Gatekeeper quarantine, WKWebView, lacks `additionalBrowserArgs` |
| Linux | glibc compatibility, WebKitGTK 4.1, desktop tray differences |

Process, window, and notification branches must be verified on physical hardware or dedicated CI runners.
