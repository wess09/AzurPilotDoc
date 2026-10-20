---
title: Core Program Overview
description: Architecture, WebUI layout, task categories, and execution model of the core engine hosted by desktop and Android.
updated: 2026-10-20
---

# Core Program Overview

The core program ([wess09/AzurPilot](https://github.com/wess09/AzurPilot), default branch `master`) is the sole repository implementing game automation logic. The desktop launcher and Android host serve exclusively as execution environments.

<div class="ap-meta">
<span><b>Language</b> Python 3.14</span>
<span><b>Interface</b> React + Vite</span>
<span><b>Default Port</b> 25548</span>
<span><b>Recognition Baseline</b> 1280×720</span>
<span><b>License</b> GPL-3.0</span>
</div>

## <DocIcon name="box" /> Core Subsystems

<CoreArchDiagram />

<Figure caption="Layering indicates dependency flow: higher layers may invoke lower layers, while lower layers remain unaware of callers. Business modules never call each other directly." />

| Subsystem | Key Directories | Responsibilities |
| --- | --- | --- |
| Entry Points | `alas.py`, `gui.py`, `mcp_server_sse.py`, `tui.py` | Scheduler loop, WebUI server, MCP service, terminal interface |
| Runtime | `module/api/`, `module/runtime/` | WebSocket routing, process supervision, updates, remote access, account vault |
| Business | `module/<feature>/`, `campaign/` | Feature modules implementing `run()` and campaign map graphs |
| Foundation | `module/device/`, `ui/`, `ocr/`, `map/`, `combat/` | Screenshots, input injection, UI navigation, OCR, pathfinding, battle logic |
| Data | `config/`, SQLite database, `assets/` | User configs, statistics, persistent states, 4-server recognition assets |

## <DocIcon name="settings" /> Three-Tier Execution Model

1. <DocIcon name="monitor" /> **`gui.py` acts as the parent process**. It serves HTTP/WebSocket endpoints and static web assets without interacting with games directly.
2. <DocIcon name="zap" /> **Each instance runs in an isolated worker process**. Spawned by `ProcessManager` via `multiprocessing.Process`, running `AzurLaneAutoScript.loop()`.
3. <DocIcon name="clock" /> **Tasks execute sequentially on the worker's main thread**. Watchdogs and reporting routines run on secondary threads without executing concurrent game actions.

This architectural model explains several common behaviors:

- <DocIcon name="circle-alert" /> Stopping an instance terminates the worker process tree while leaving the WebUI server running.
- <DocIcon name="circle-alert" /> A single instance cannot execute two tasks concurrently; parallel execution requires multiple instances paired with multiple emulators.
- <DocIcon name="circle-alert" /> Closing `gui.py` shuts down active workers, as workers are supervised children of the backend process.

## <DocIcon name="monitor" /> WebUI Structure

| Section | Route | Content |
| --- | --- | --- |
| Home | `/` | Instance cards, start/stop switches, announcements |
| Instance Overview | `/i/<instance>/overview` | Active task, resource gauges, real-time logs, quick actions |
| Task Configuration | `/i/<instance>/task/<task>` | Forms dynamically rendered from `task.yaml` |
| Statistics | `/i/<instance>/statistics` | Reports for resources, sorties, Operation Siren, commissions, and inventory |
| Scheduler Program | `/i/<instance>/task/SchedulerProgram` | Visual graph-based scheduling orchestration |
| Mind Calculator | `/i/<instance>/task/MindCalculator` | Dock scanning and Cognitive Array cost calculator |
| Fleet Technology | `/i/<instance>/task/FleetTechnology` | Tech point scanning and fleet statistics |
| System Settings | `/settings` | Account vault, remote access, updates, theme settings |
| Configurations | `/configs` | Import, export, duplicate, and delete instances |

For detailed view breakdowns, read the [WebUI Tour](/en/azurpilot/user/webui).

## <DocIcon name="compass" /> Task Categories

The task navigation menu derives from `module/config/argument/task.yaml`, organized into 12 top-level groups:

| Group | Category | Representative Tasks |
| --- | --- | --- |
| `Alas` | System | Emulator setup, error handling, backup, daily summary |
| `Farm` | Sortie | Campaign maps 1/2/3, urgent commissions, 3-oil low-cost farming |
| `Event` | Events | Event stages 1/2/3, raid battles, War Archives |
| `EventDaily` | Event Dailies | Daily A/B/C/D/SP event clears |
| `Reward` | Automated Claims | Commissions, research, dorm, Meowfficer, guild logistics |
| `DailyMission` | Dailies | Daily challenges, limit challenges, hard mode, exercises |
| `Opsi` | Operation Siren | Exploration, obscure sectors, abyssal zones, strongholds, intelligent scheduler |
| `Island` | Cruise & Island Missions | Farmland, ranching, restaurants, manufacturing, daily gathering |
| `FleetManagement` | Fleet Management | Fleet scanning and fleet composition inspector |
| `RunParams` | Execution Parameters | Timing delays and device timeout thresholds |
| `Tool` | Utilities | Semi-automation, performance benchmarks, OCR tests, uncensor tools |
| `Dashboard` | Dashboard | Resource caps and gauge thresholds |

Review the [Task Command Matrix](/en/reference/tasks) for the full 102 task command catalog.

::: tip Dynamic Task Counts
Event releases dynamically add and remove tasks, altering method counts on `alas.py`. Documentation counts reflect current baseline versions.
:::

## <DocIcon name="plug" /> Extending Capabilities

Authoring a new task requires **matching identifiers in three locations plus one `run()` method**:

1. <DocIcon name="file-pen" /> Register the task command and group inside `task.yaml`.
2. <DocIcon name="file-pen" /> Define the corresponding method on `alas.py` (converting CamelCase to snake_case).
3. <DocIcon name="folder" /> Create a module under `module/<feature>/` providing a `run()` entry point.
4. <DocIcon name="refresh" /> Execute `uv run -m module.config.config_updater` to regenerate configuration schemas.

Read [Adding a New Task](/en/azurpilot/developer/module-dev) for full development tutorials.

## <DocIcon name="map" /> Continue Reading

<ul class="ap-linklist">
<li><a href="/en/azurpilot/user/webui">WebUI Tour<span class="desc">Interface layout and form controls</span></a></li>
<li><a href="/en/azurpilot/user/device">Connect Emulator & ADB<span class="desc">Serials, screenshot engines, and input backends</span></a></li>
<li><a href="/en/azurpilot/user/scheduler">Scheduler & Task Orchestration<span class="desc">Priorities, intervals, and error recovery</span></a></li>
<li><a href="/en/azurpilot/user/tasks/">Task Manual<span class="desc">Dedicated guides per gameplay mode</span></a></li>
</ul>
