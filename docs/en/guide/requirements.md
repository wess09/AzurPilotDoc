---
title: Environment & Compatibility
description: Operating system, emulator, resolution, network, and in-game settings required to run AzurPilot successfully.
updated: 2026-10-20
---

# Environment & Compatibility

This page lists conditions that cause **immediate operational failure**. Performance suggestions follow the hard prerequisites.

## <DocIcon name="clipboard" /> Hard Requirements

<table>
<thead>
<tr><th>Dimension</th><th>Desktop (Launcher / Source)</th><th>Android Host</th></tr>
</thead>
<tbody>
<tr><td>Operating System</td><td>Windows 10+, macOS, Linux (recent glibc)</td><td>Android 9.0+ (API 28)</td></tr>
<tr><td>Architecture</td><td>x64 / ARM64</td><td>ARM64-v8a or x86_64; 32-bit unsupported</td></tr>
<tr><td>Runtime</td><td>Launcher embeds Python 3.14.6; Source requires Python 3.14 + uv</td><td>Embedded Ubuntu 24.04 + Python 3.14</td></tr>
<tr><td>Memory</td><td>8 GB+ recommended (emulator + backend)</td><td>4 GB minimum, 6 GB+ recommended</td></tr>
<tr><td>Storage</td><td>~5 GB (dependencies + assets + logs)</td><td>2.5 GB minimum, 5 GB recommended</td></tr>
<tr><td>Display</td><td>WebUI requires a modern browser</td><td>—</td></tr>
<tr><td>Game Resolution</td><td colspan="2"><strong>1280×720</strong> (rigid recognition baseline, non-negotiable)</td></tr>
</tbody>
</table>

::: warning Linux Launcher Dependencies
The launcher requires `libwebkit2gtk-4.1` and recent glibc libraries (CI builds on Ubuntu 22.04). If an older distribution cannot run the launcher binary, the core program can still run via command line.
:::

## <DocIcon name="monitor" /> Emulators

The core program connects to emulators via ADB. Built-in default serial values can be pasted directly into "Emulator Serial":

| Emulator | Default Serial | Notes |
| --- | --- | --- |
| MuMu Player 12 | `127.0.0.1:16384` | Increments by port for multi-instance |
| MuMu Player / MuMu X | `127.0.0.1:7555` | — |
| MuMu Pro (macOS) | `127.0.0.1:16384` | Multi-instance uses 16416, 16448... |
| LDPlayer | `emulator-5554` or `127.0.0.1:5555` | Supports dedicated `ldopengl` screenshot backend |
| NoxPlayer | `127.0.0.1:62001` | 64-bit instances use `127.0.0.1:59865` |
| BlueStacks | `127.0.0.1:5555` | Hyper-V instances require `bluestacks5-hyperv` |
| MEmu Play | `127.0.0.1:21503` | — |

If you do not know the serial, run `adb devices` inside the emulator installation folder, or enter `auto` in settings for automatic detection. Note that **`auto` does not work when running multiple emulators simultaneously**.

::: tip Screenshot and Control Backends
"Auto select" runs a quick benchmark on startup to pick the fastest screenshot backend. General speed ranking: `DroidCast_raw` > `aScreenCap_nc` > `ADB_nc` > `aScreenCap` ≈ `uiautomator2`. MuMu and LDPlayer provide dedicated backends (`nemu_ipc`, `ldopengl`). For touch control, `MaaTouch` is recommended.
:::

## <DocIcon name="cloud" /> Network Requirements

| Scenario | Accessible Endpoints |
| --- | --- |
| Launcher initial launch | GitHub (clone core repo), PyPI or mirrors, npmmirror (Python standalone) |
| Android full package | Unpacks Runtime offline; updates require GitHub or CNB |
| Android thin package | GitHub Releases or CNB (downloads ~1 GB Runtime) |
| Runtime execution | Game servers, update checks, optional remote access endpoints |

Mainland China users can use the launcher `-cn` mirror distribution or configure the CNB download mirror in Android settings. The launcher bypasses system proxies when pulling code, installing dependencies, and accessing local WebUI loops to avoid proxy routing conflicts.

## <DocIcon name="settings" /> In-Game Settings

The following settings directly dictate recognition accuracy and workflow advancement. **You must configure them before starting tasks**.

Navigation: Main Screen → Bottom-right Settings Gear → Left sidebar.

| Setting | Recommended Value | Impact |
| --- | --- | --- |
| Frame Rate | 60 FPS | Low frame rates capture screenshots before transition animations finish |
| Operation Siren · Reduce TB Guidance | On | Suppresses tutorial popups upon entering Operation Siren |
| Operation Siren · Auto-submit Items | On | Prevents bag overflow from pausing auto-search |
| Operation Siren · Auto-search in Safe Waters | Off | The scheduler must manage auto-search activation dynamically |
| Story Auto-play | On | Prevents dialogue sequences from blocking execution |
| Story Auto-play Speed | Fast | Minimizes wait times |
| Standby Mode | Off | Screensavers break visual recognition |
| Duplicate Ship Notification | Off | Popups interrupt acquisition sequences |
| Quick Retiring Confirmation | Off | Eliminates redundant confirmation taps |
| Display Post-battle Ships | Off | Prevents ship art from obstructing victory screens |

### Operation Siren: Submarine Support

Navigation: Operation Siren → Top-right Radar → Command Module → Submarine Support. **Uncheck "Sortie submarines when spending AP"**.

### One-Click Retirement

Navigation: Main Screen → Build → Retire → Gear Icon → One-Click Retirement Settings.

| Option | Recommended Value |
| --- | --- |
| Priority 1 / 2 / 3 | R / SR / N |
| Keep duplicates when max limit break achieved | Do not keep |
| Keep duplicates without max limit break | Keep required for limit break or Do not keep |

## <DocIcon name="eye" /> Visual Recognition Caveats

The following items alter character art boundaries and distort template matching. Remove them on automated accounts:

- <DocIcon name="circle-alert" /> Character gear and weapon skins (changes art bounding boxes)
- <DocIcon name="circle-alert" /> Character live2D / dynamic skins
- <DocIcon name="circle-alert" /> Custom UI overlays that obstruct game elements

If recognition repeatedly fails, revert to default skins and standard equipment before troubleshooting resolution and DPI scaling.

## <DocIcon name="lock" /> Security & Account Safety

- <DocIcon name="lock" /> The WebUI binds to localhost by default. Set a strong password before exposing it to LAN or WAN interfaces; an unprotected dashboard grants full control over your game account.
- <DocIcon name="key" /> Remote access uses independent pairing tokens, never exposing the primary WebUI password. Revoking a paired device leaves your primary credentials unaffected.
- <DocIcon name="ban" /> Never commit `config/remote-access.json`, `config/deploy.yaml`, or `password.txt` to Git or share them publicly.
- <DocIcon name="lock-keyhole" /> The account vault encrypts secrets using OS-level security APIs (Windows DPAPI / TPM), binding data to hardware. Migrating machines requires re-entering account credentials.

## <DocIcon name="rocket" /> Next Steps

<ul class="ap-linklist">
<li><a href="/en/guide/install">Installation<span class="desc">Platform-specific setup instructions</span></a></li>
<li><a href="/en/guide/first-run">First Run<span class="desc">From device connection to your first task</span></a></li>
<li><a href="/en/troubleshooting/">Troubleshooting<span class="desc">Setup errors, connection drops, and recognition failures</span></a></li>
</ul>
