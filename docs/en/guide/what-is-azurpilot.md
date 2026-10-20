---
title: What is AzurPilot
description: Overview of AzurPilot design, tech stack, supported platforms and servers, and explicit architectural boundaries.
updated: 2026-10-20
---

# What is AzurPilot

<DocIcon name="bot" /> AzurPilot is an automation framework for *Azur Lane*. It connects to Android emulators or devices over ADB and runs a continuous loop of "screenshot → recognition → tap", handling repetitive routines such as dailies, sorties, and Operation Siren.

It is neither an in-game plugin nor a client modification: all actions occur at the screen display level, using the same input pipeline as manual player taps.

## <DocIcon name="settings" /> Technical Stack

| Layer | Implementation | Details |
| --- | --- | --- |
| Scheduler | `alas.py` | One process per instance, runs tasks sequentially, features tiered recovery upon failure |
| Recognition | OpenCV template matching + OCR + grid map detection | Assets authored at 1280×720 across CN / EN / JP / TW sets |
| Control | uiautomator2 / ADB / minitouch / MaaTouch | Switchable screenshot and control backends in settings |
| Interface | React + TypeScript + Vite | Accessed via browser, default port 25548 |
| Communication | WebSocket RPC (`/api/v1/ws`) | Shared by frontend, Android host, and external tools |
| Extension | MCP SSE service | 18 tools callable by MCP-compliant clients |

## <DocIcon name="compass" /> Supported Scope

- <DocIcon name="cloud" /> **Servers**: CN (official Bilibili and various channel servers), EN (Global), JP, and TW. Channel servers are differentiated by package name; see [Connect Emulator & ADB](/en/azurpilot/user/device#game-servers).
- <DocIcon name="laptop" /> **Platforms**: Windows, macOS, Linux (launcher); Android 9.0+ (host); any environment supporting Python 3.14 (source).
- <DocIcon name="monitor" /> **Resolution**: 1280×720. This is a rigid requirement, not a suggestion.
- <DocIcon name="ban" /> **Direct physical phone connections are unsupported** on the core program side. The Android app turns the phone into a controlled target via a virtual display, which operates over a distinct pipeline.

## <DocIcon name="shield" /> Explicit Boundaries

- <DocIcon name="ban" /> No game client cracking, memory injection, or asset modification.
- <DocIcon name="ban" /> No account leveling services, trading, or account sharing.
- <DocIcon name="ban" /> No bypassing of anti-cheat or risk control mechanisms. Automation inherently carries ban risks.
- <DocIcon name="ban" /> No guarantee that all new event stages support day-one automation. Event mechanics change frequently; some require manual completion of prerequisites.

## <DocIcon name="zap" /> What Happens During a Task Run

Taking the "Research" task as an example:

1. The WebUI writes `Research.Scheduler.NextRun` into `config/<instance>.json`.
2. The scheduler selects the due task and binds its parameters to `self.config.Research_*`.
3. `run('research')` invokes the corresponding method on `alas.py`, which lazily imports `module/research/research.py`.
4. The module captures a screenshot with `device.screenshot()`, checks the current UI using template matching and OCR, and advances the workflow with `device.click()`.
5. Upon completion, it calls `task_delay()` to record the next execution timestamp, and the scheduler proceeds to the next iteration.

Read [Scheduler Lifecycle](/en/azurpilot/developer/scheduler) for the complete execution and failure recovery flow.

## <DocIcon name="rocket" /> Next Steps

<ul class="ap-linklist">
<li><a href="/en/guide/ecosystem">The Three Projects<span class="desc">Which repository to download</span></a></li>
<li><a href="/en/guide/requirements">Environment & Compatibility<span class="desc">Prerequisites checklist</span></a></li>
<li><a href="/en/azurpilot/user/webui">WebUI Tour<span class="desc">Interface overview after setup</span></a></li>
</ul>
