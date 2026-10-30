---
title: Build & Release
description: Launcher 3.0.4 release workflow, shared frontend build, runtime component schema 2, multi-platform packages, and Canary channel.
updated: 2026-10-31
---

# Build & Release

The current stable release baseline is **3.0.4**. Launcher releases contain a Tauri/Rust application with a React UI and bootstrap uv; they do not bundle the entire AzurPilot source tree and Python environment.

## Local checks

```bash
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run build
cargo check --locked --all-targets
cargo test --locked --all-targets
```

## CI and publishing

`.github/workflows/package.yml` builds Git/ADB component ZIPs, checks their hashes and publishes the `runtime` manifest (schema 2). It builds platform-independent `frontend/dist` **once** and reuses the artifact for supported Windows, macOS and Linux packages. Windows also has an Inno Setup installer and code-signing workflow.

Stable tags publish stable binaries and manifest entries. Eligible `main` builds publish Canary versions with the next patch number and `-canary.<short SHA>.<UTC timestamp>`, updating the separate `canary` entry. The payload manifest can include `url`, `github_url`, and `cloudflare_url`. Verify SHA-256 and check mirrors, version metadata, cancellation and rollback before release.

The update manifest is public; non-GitHub payload hosts can require an embedded mTLS client identity. Keep signing credentials outside source control.

See [Update Pipeline](/en/launcher/developer/update) and [Architecture](/en/launcher/developer/architecture).
