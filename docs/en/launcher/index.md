---
title: AzurPilot Launcher Overview
description: Cross-platform desktop launcher powered by Tauri 2 and Rust, featuring embedded Python, repository management, and process supervision.
updated: 2026-10-20
---

# AzurPilot Launcher

The launcher automates four foundational steps: installing Python, configuring dependencies, cloning source code, and launching the backend. It contains no in-game logic; its role is bootstrapping the core program and wrapping it into a standard desktop application.

<div class="ap-meta">
<span><b>Repository</b> wess09/AzurPilotLauncher</span>
<span><b>Branch</b> main</span>
<span><b>Framework</b> Tauri 2 + Rust</span>
<span><b>Runtime</b> Python 3.14.6 (embedded)</span>
<span><b>License</b> GPL-3.0</span>
</div>

![Launcher updating AzurPilot](/img/launcher-update.jpg)

<Figure caption="Launcher update screen displaying target version, deployment configuration, and progress before entering the primary dashboard." />

## <DocIcon name="wrench" /> What the Launcher Does

```text
Extract → Launcher process → Splash screen → Environment bootstrap (uv/Python/git/adb)
     → Git pull core repo → uv sync --frozen
       → Launch gui.py → Open WebUI (authenticated) → System tray residency
```

| Feature | Implementation |
| --- | --- |
| Environment Bootstrapping | Embeds uv, downloads Python 3.14.6, and creates a relocatable `.venv` |
| Toolchain Management | Packages git and adb into `.venv` without altering system paths |
| Code Updates | Runs `git pull` with up to 20 retries upon network failure |
| Dependency Synchronization | Runs `uv sync --frozen` locked strictly to `uv.lock` |
| Backend Supervision | Frees conflicting ports, injects tracking markers, and cleans process trees on exit |
| Self-Updater | Validates payload integrity via mTLS with multi-mirror fallback |
| OS Integration | System tray, native notifications, single-instance lock, auto-start on boot |
| Localization | English, Simplified Chinese, Traditional Chinese, and Japanese matching system locale |

## <DocIcon name="handshake" /> Relationship with Core Program

| Dimension | Launcher | Core Program |
| --- | --- | --- |
| Repository | AzurPilotLauncher | AzurPilot |
| Tech Stack | Rust / Tauri 2 | Python / React |
| Versioning | Independent semantic releases | Rolling updates following `master` |
| Update Channel | Self-updating binary (mTLS) | `git pull` + `uv sync` |
| Contains Game Logic | No | Yes |

::: tip Independent Version Cycles
Launcher 1.x works alongside any core program commit. Updating the launcher does not revert core scripts, nor does updating core code modify the launcher binary.
:::

## <DocIcon name="clipboard" /> Prerequisites

| Dimension | Requirement |
| --- | --- |
| Operating System | Windows 10+, macOS, Linux (recent glibc) |
| WebView Runtime | Windows requires WebView2; macOS uses system WKWebView; Linux requires `libwebkit2gtk-4.1` |
| Privileges | Windows requires Administrator privileges (for ADB provisioning and system directory writes) |
| Network | Initial boot requires internet access to download Python and dependencies |
| Storage | ~3–5 GB (including `.venv` and repository assets) |

## <DocIcon name="folder" /> Directory Structure

```text
AzurLaneAutoScript/                         # Windows / Linux root
AzurPilot.app/Contents/AzurLaneAutoScript/   # macOS

├── alas-launcher.exe / alas-launcher
├── .venv/                          # Python + uv + git + adb
├── config/                         # Instance settings and deploy.yaml
├── frontend/                       # Pre-built frontend from core repo
├── log/                            # Execution logs
└── AzurPilot_Data_Backup/          # Automated daily backups
```

The launcher injects paths into child processes:

| Platform | PATH Additions |
| --- | --- |
| Unix | `.venv/bin` |
| Windows | `.venv/Scripts`, `.venv/Scripts/git/cmd` |

## <DocIcon name="scale" /> Key Differences from Legacy Launcher

| Aspect | AzurPilot Launcher |
| --- | --- |
| Supported Platforms | Windows / macOS / Linux |
| Update Strategy | Updates Git repo only; synchronizes dependencies via internal `.venv` uv |
| Dependency Locking | Strict pinning to `uv.lock` with automatic sync |
| ADB Lifecycle | Never forcibly restarts or overwrites running daemons |
| Tool Bundling | All tools are strictly encapsulated within `.venv` |
| Node.js Support | Windows: probes system Node and auto-installs verified runtime if absent |

## <DocIcon name="map" /> Continue Reading

<ul class="ap-linklist">
<li><a href="/en/launcher/user/install">Installation<span class="desc">Platform instructions and prerequisites</span></a></li>
<li><a href="/en/launcher/user/first-run">First Launch<span class="desc">Detailed environment initialization phases</span></a></li>
<li><a href="/en/launcher/user/maintenance">Maintenance & Repair<span class="desc">Troubleshooting corrupted environments</span></a></li>
<li><a href="/en/launcher/developer/architecture">Tauri & Rust Architecture<span class="desc">Source code architecture guide</span></a></li>
</ul>
