---
title: Installation
description: Install AzurPilot via desktop launcher, Android APK, Docker, or source code, and verify setup health.
updated: 2026-10-20
---

# Installation

Verify [Environment & Compatibility](/en/guide/requirements) before installing. The four installation paths below are ordered by recommendation; desktop users should use the launcher.

## <DocIcon name="download" /> Desktop Launcher (Recommended)

### Download

Download the archive matching your operating system and CPU architecture from the [Official Download Page](https://azurpilot.com/download.html) or [GitHub Releases](https://github.com/wess09/AzurPilotLauncher/releases/latest). Mainland China users should select the `-cn` mirror edition.

### Extract and Launch

<Steps>
<Step title="Extract to a permanent directory">

The launcher initializes `.venv`, clones the core repository, and saves configurations inside its directory. Do not place it in temporary folders, read-only locations, or sync drives with poor multibyte character handling.

</Step>
<Step title="Launch the executable">

- <DocIcon name="monitor" /> **Windows**: Double-click `alas-launcher.exe`. Administrator privileges are requested (for ADB installation and system directory writes) via UAC.
- <DocIcon name="laptop" /> **macOS**: Open `AzurPilot.app`. Unsigned binaries may trigger Gatekeeper blocks; see instructions below.
- <DocIcon name="wrench" /> **Linux**: Run `chmod +x alas-launcher && ./alas-launcher`.

</Step>
<Step title="Wait for environment initialization">

The splash screen displays: Create `.venv` → Download Python 3.14.6 → Update repository → `uv sync --frozen`. Initial setup requires internet access and takes several minutes depending on network bandwidth.

</Step>
<Step title="Enter WebUI">

The window opens authenticated directly into the AzurPilot WebUI. The launcher binds to port `22267` by default (the core program standalone default port is `25548`).

</Step>
</Steps>

::: warning macOS Gatekeeper Warnings
The binary lacks Apple developer signatures. If macOS reports that the developer cannot be verified, run:

```bash
xattr -dr com.apple.quarantine /Applications/AzurPilot.app
```

Then reopen the app. Avoid repeatedly clicking "Open Anyway" inside System Settings.
:::

::: tip Missing Windows WebView2
Tauri relies on WebView2. Windows 11 includes it out of the box; on Windows 10, install the [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) if prompted.
:::

## <DocIcon name="smartphone" /> Android Host

Review [Android Installation & Architecture](/en/android/user/install) for full details. Brief workflow:

1. <DocIcon name="clipboard" /> Verify your device runs Android 9.0+ on ARM64 or x86_64.
2. <DocIcon name="download" /> Download the **Full APK** (bundles Runtime) or **Thin APK** (downloads ~1 GB Runtime on first boot) matching your architecture.
3. <DocIcon name="clock" /> Install and launch; wait 1–3 minutes for the rootfs to unpack.
4. <DocIcon name="lock" /> Activate ADB via built-in wireless pairing or Root.
5. <DocIcon name="settings" /> Open the in-app console to configure instances.

## <DocIcon name="box" /> Docker

Best suited for NAS appliances, home servers, and headless machines. The container runs the WebUI and scheduler while the emulator runs on the host:

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
docker compose up -d --build
```

`docker-compose.yml` specifies `network_mode: host`, running `.venv/bin/python gui.py` inside the container. For mainland China networks, switch the Dockerfile to `deploy/docker/Dockerfile.cn` and configure `UV_INDEX_URL`.

::: tip Long Initial Build Times
The multi-stage build downloads Node 24 for frontend assets and Python 3.14 for runtime dependencies. First-time `--build` takes time; subsequent rebuilds reuse cache layers.
:::

## <DocIcon name="laptop" /> Source Installation

Recommended for developers, debugging, and custom enhancements.

### Prerequisites

- <DocIcon name="circle-check" /> Python **3.14** (refer to `pyproject.toml` for precise bounds)
- <DocIcon name="circle-check" /> [uv](https://github.com/astral-sh/uv)
- <DocIcon name="circle-check" /> Node.js (for frontend builds; `gui.py` automatically builds assets when `frontend/dist` is missing)

### Execution Steps

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
uv sync --frozen --no-dev
uv run python gui.py
```

Access `http://127.0.0.1:25548` in your browser. The server listens on `0.0.0.0` by default; host and port settings are loaded from `WebuiHost` and `WebuiPort` in `config/deploy.yaml`.

Common CLI flags:

```bash
uv run python gui.py --port 25548 --host 127.0.0.1 --key "your-password"
```

| Flag | Description |
| --- | --- |
| `--host` | Overrides `WebuiHost` |
| `-p, --port` | Overrides `WebuiPort` |
| `-k, --key` | Sets dashboard password |
| `--ssl-key` / `--ssl-cert` | Enables HTTPS |
| `--run <instance>` | Starts specified instance worker immediately on launch |

### Verification

```bash
# Import smoke test: validates module resolution without connecting devices
uv run python -m dev_tools.import_smoke_test

# Python unit test suite
uv run python -m unittest discover -s tests
```

If the WebUI loads, task lists render, and logs contain no tracebacks, the backend is sound. Device configuration is the next step.

## <DocIcon name="circle-check" /> Post-Installation Navigation

<ul class="ap-linklist">
<li><a href="/en/guide/first-run">First Run<span class="desc">Connect emulator and execute your first task</span></a></li>
<li><a href="/en/azurpilot/user/device">Connect Emulator & ADB<span class="desc">Serials, screenshot backends, and control pipelines</span></a></li>
<li><a href="/en/troubleshooting/">Troubleshooting<span class="desc">Initialization failures and corrupted environments</span></a></li>
</ul>
