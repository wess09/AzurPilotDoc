---
title: Install Launcher
description: Download, extraction, permissions, and runtime setup for Windows, macOS, and Linux desktop launcher installations.
updated: 2026-10-20
---

# Install Launcher

The launcher is distributed as a portable archive without an installer wizard. Actual setup occurs on first execution: it initializes `.venv`, downloads Python, and clones the core repository.

## <DocIcon name="download" /> Download Channels

| Channel | URL |
| --- | --- |
| GitHub Releases | `github.com/wess09/AzurPilotLauncher/releases/latest` |
| Official Portal | `azurpilot.com/download.html` |
| CNB Mirror | Regional mirror for mainland China |

Download the archive matching your **operating system and architecture**:

| Filename Suffix | Target Platform |
| --- | --- |
| `windows-x64` | Standard 64-bit Windows |
| `windows-arm64` | Windows on ARM |
| `macos` | Apple Silicon / Intel macOS |
| `linux-x64` / `linux-arm64` | Linux per CPU architecture |
| `-cn` | Uses mainland China mirrors |

::: tip International vs. CN Mirror Editions
Both editions share identical launcher binaries. The distinction lies in deployment configuration: `-cn` routes repository downloads via `git://git.pull/AzurPilot` and connects to regional PyPI mirrors.
:::

## <DocIcon name="folder" /> Destination Directory

Extract into a **permanent, writable directory with a simple path**:

- ✅ `D:\AzurPilot\`
- ✅ `~/Applications/AzurPilot/`
- ❌ `C:\Program Files\` (requires elevated write privileges for regular updates)
- ❌ Paths containing spaces or non-ASCII characters
- ❌ Cloud sync directories (OneDrive / iCloud lock active `.venv` files)

::: danger Never Run from Temporary Folders
The launcher stores repositories, `.venv`, settings, and logs within its root directory. Temporary directories risk automatic purge by OS cleanup utilities.
:::

## <DocIcon name="monitor" /> Windows

<Steps>
<Step title="Extract archive">

Extract using 7-Zip or Windows Explorer. Do not run the executable from inside the compressed zip view.

</Step>
<Step title="Grant Administrator privileges">

The `alas-launcher.exe` manifest declares `requireAdministrator` to handle ADB drivers and system networking. Confirm the UAC prompt.

</Step>
<Step title="Handle SmartScreen warnings">

Unsigned binaries may trigger Windows SmartScreen. Click "More info" followed by "Run anyway".

</Step>
<Step title="Verify WebView2">

Windows 11 includes WebView2 by default. On Windows 10, install the [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) if prompted.

</Step>
</Steps>

## <DocIcon name="laptop" /> macOS

```bash
# Extract and move to Applications
xattr -dr com.apple.quarantine /Applications/AzurPilot.app
open /Applications/AzurPilot.app
```

The application lacks Apple developer code signing. Double-clicking directly causes Gatekeeper blocks. Strip quarantine flags with `xattr` before opening.

::: warning Avoid Repeated System Dialog Retries
Certain macOS versions cache rejection states. Removing the quarantine attribute via terminal is the cleanest fix.
:::

## <DocIcon name="wrench" /> Linux

```bash
tar -xf azurpilot-launcher-linux-x64.tar.xz
cd AzurPilot
chmod +x alas-launcher
./alas-launcher
```

System dependencies:

| Dependency | Purpose |
| --- | --- |
| `libwebkit2gtk-4.1` | WebView rendering |
| Recent glibc | CI builds against Ubuntu 22.04 |
| `libgtk-3` | Window management |

Debian / Ubuntu installation:

```bash
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0
```

If your distribution lacks modern WebKitGTK packages, you can run the core program directly via terminal: `uv run python gui.py` (requires system Python 3.14 and uv).

## <DocIcon name="circle-check" /> First-Run Verification

Initial startup executes a complete environment bootstrap. Verify successful completion against this checklist:

| Checkpoint | Expected Behavior |
| --- | --- |
| Splash Screen | Displays progress through `.venv` creation, Python download, Git clone, and dependency sync |
| Application Window | Renders WebUI directly without login prompts |
| Listening Port | Defaults to `22267` |
| Directory State | Creates `.venv/`, `config/`, `frontend/`, and `log/` |

## <DocIcon name="file-pen" /> Command Line Flags

| Flag | Purpose |
| --- | --- |
| `--lang <zh-CN|zh-TW|ja|en>` | Forces UI display language |
| `--skip-update` | Skips Git repository updates (useful offline or during debugging) |
| `--preview-crash` | Renders crash diagnostics UI |
| `--start-minimized` | Launches directly to system tray (used for OS startup) |

## <DocIcon name="circle-off" /> Uninstallation

Delete the installation directory. The launcher writes no registry entries (except optional autostart) and leaves no system library artifacts.

**Backup `config/` before deletion** to prevent permanent loss of instance settings, statistics, and vault keys:

```text
Preserve: config/, AzurPilot_Data_Backup/
Safe to delete: .venv/, frontend/, log/, cache/
```

## <DocIcon name="message" /> Common Installation Issues

| Symptom | Cause | Solution |
| --- | --- | --- |
| Double-click produces no window | UAC denied or antivirus blockage | Check security logs; grant admin privileges |
| Prompt reports missing WebView2 | Runtime not installed | Install Edge WebView2 Runtime |
| macOS alerts "App is damaged" | Quarantine attribute present | Run `xattr -dr com.apple.quarantine` |
| Linux reports missing `libwebkit2gtk` | Missing 4.1 package | Install `libwebkit2gtk-4.1-0` |
| Path contains whitespace | Toolchain path parsing error | Move installation to path without spaces |
| Continuous launcher restart loop | Initialization crashed | Review [Initialization Failures](/en/launcher/user/first-run#initialization-failures) |
