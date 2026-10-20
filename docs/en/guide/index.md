---
title: Choose Your Runtime
description: Comparison of AzurPilot runtime modes, prerequisites, and reading paths to help you pick the right setup before installing.
updated: 2026-10-20
---

# Choose Your Runtime

AzurPilot offers three operational paths. All three run the **exact same core program**; the only differences are who provisions the Python environment, who manages the backend process, and where the game executes.

| Runtime Mode | Where Game Runs | Requires Always-On PC | Best For |
| --- | --- | --- | --- |
| Desktop Launcher | Emulator on Windows / macOS / Linux | Yes | Long running sessions, multi-instance, highest performance |
| Android Local Host | Mobile game client on device | No | No always-on PC, or dedicating an old phone to automation |
| Source Installation | Any environment supporting Python 3.14 | Yes | Development, debugging, custom modifications |
| Remote Client | Instance running on another machine | No (client side) | Monitor and control home PC instances from a phone |

## <DocIcon name="info" /> Three Questions to Answer First

<DocIcon name="smartphone" /> **1. Where will the game run?**
Emulators (MuMu, LDPlayer, BlueStacks, Nox) suit desktop workflows. Running locally on a phone requires Android 9.0+, ARM64 or x86_64, at least 4 GB RAM, and 2.5 GB free storage.

<DocIcon name="clock" /> **2. Can this machine stay powered on continuously?**
The scheduler is built for 24/7 continuous operation. Shutting down the computer every night does not corrupt tasks—they resume on next boot—but time-dependent rewards like Operation Siren and commissions will yield less.

<DocIcon name="wrench" /> **3. Do you want to use the command line?**
If no: choose the desktop launcher or Android APK. If yes, or if you plan to modify code: choose source execution, covered in the [Developer Portal](/en/azurpilot/developer/).

## <DocIcon name="compass" /> Entry Points for Each Path

<div class="ap-grid ap-grid--3">
<div>

#### Desktop Launcher
Download the archive, extract, and launch. The launcher automatically creates a `.venv`, clones the repository, syncs dependencies, and launches the WebUI.
[Install Launcher →](/en/launcher/user/install)
</div>
<div>

#### Android Host
Install the APK, wait for the Runtime to unpack, activate ADB or Root privileges, and configure instances in-app.
[Install Android Version →](/en/android/user/install)
</div>
<div>

#### Source Installation
Requires Python 3.14 and uv. Run `uv sync --frozen` followed by `gui.py`. Ideal for development and debugging.
[Source Installation →](/en/guide/install#source-installation)
</div>
</div>

## <DocIcon name="clipboard" /> Three Universal Prerequisites

1. <DocIcon name="settings" /> **In-game settings** must match recommended values, or recognition fails. Review the checklist in [Environment & Compatibility](/en/guide/requirements#in-game-settings).
2. <DocIcon name="monitor" /> **Screenshot resolution is fixed at 1280×720**. Recognition assets are built against this baseline; this is not a UI display size.
3. <DocIcon name="cloud" /> **Initial launch requires an active internet connection**. The launcher downloads Python and dependencies, the Android thin package downloads the Runtime, and the core program clones source code.

::: warning Account Risk Disclaimer
Game automation violates official terms of service and carries the risk of account suspension. AzurPilot provides no detection evasion features and accepts no liability for account consequences. Avoid high-risk unverified actions on primary accounts.
:::

## <DocIcon name="map" /> Next Steps

<ul class="ap-linklist">
<li><a href="/en/guide/what-is-azurpilot">What is AzurPilot<span class="desc">Capabilities, boundaries, and mechanics</span></a></li>
<li><a href="/en/guide/ecosystem">The Three Projects<span class="desc">Distinguish repositories before downloading</span></a></li>
<li><a href="/en/guide/requirements">Environment & Compatibility<span class="desc">Emulators, OS, and game settings</span></a></li>
<li><a href="/en/guide/install">Installation<span class="desc">Complete steps for all three paths</span></a></li>
</ul>
