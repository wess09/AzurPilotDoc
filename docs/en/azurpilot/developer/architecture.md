---
title: System Architecture
description: Layered architecture, process hierarchy, module boundaries, data pipelines, and invariants of the core program.
updated: 2026-10-20
---

# System Architecture

<CoreArchDiagram />

<Figure caption="Higher tiers depend on lower tiers. Business modules never call each other directly; cross-task workflows coordinate via configuration schemas and scheduler primitives." />

## <DocIcon name="box" /> Process Model

```text
gui.py (Parent Process)
├── HTTP / WebSocket Server (uvicorn)
├── Static Frontend Assets (frontend/dist)
├── Instance Workers × N (multiprocessing.Process)
│    └── AzurLaneAutoScript.loop()
└── TaskHandler (Internal WebUI background tasks: update checks, remote keep-alive)
```

| Process | Lifecycle | Responsibility |
| --- | --- | --- |
| `gui.py` | Persistent | Serves UI and APIs; spawns, supervises, and cleans up workers |
| worker | Per-instance execution | Task scheduling loop and all game actions |
| `mcp_server_sse.py` | Optional standalone | MCP tool server authenticated with WebUI password |

Key operational rules:

- **Workers are not detached daemons**. Managed by `ProcessManager`, workers terminate when the parent exits.
- **`TaskHandler` does not manage game tasks**. It runs WebUI background cron routines and never accesses game devices.
- **Each instance owns exactly one worker process**. Running two workers against the same emulator creates undefined race conditions.

## <DocIcon name="settings" /> Layering and Boundaries

### Entry Points

| File | Entry Point | Function |
| --- | --- | --- |
| `alas.py` | `AzurLaneAutoScript.loop()`, `run(command)` | Core task scheduler |
| `gui.py` | `main()` | Argument parsing, frontend build verification, uvicorn host |
| `mcp_server_sse.py` | `main()` | Server-Sent Events MCP server |
| `tui.py` | `main()` | Terminal interface sharing configuration backends |

### Runtime Tier

| Directory | Responsibilities |
| --- | --- |
| `module/api/router.py` | Explicit RPC method registration, parameter validation, dispatch |
| `module/api/socket.py` | WebSocket session management, authentication, topic subscriptions |
| `module/runtime/process_manager.py` | Worker lifecycle, stop signal injection |
| `module/runtime/updater.py` | Upstream commit checking, fetching, and transactional updates |
| `module/runtime/remote_*.py` | Cloudflare Tunnel management and device pairing |
| `module/runtime/account_*.py` | Account vault encryption and key storage |

### Business Tier

Features are packaged into dedicated modules, exposing entry classes that implement `run()`. Inheriting `ModuleBase` provides:

- `self.device`: Screenshots, touch injection, app lifecycle controls
- `self.config`: Configuration parameters bound to the active task
- `self.appear()` / `appear_then_click()`: Core visual recognition primitives
- `self.ui_ensure()` / `ui_goto()`: Deterministic UI graph navigation

### Foundation Tier

| Module | Core Abstractions | Responsibility Boundaries |
| --- | --- | --- |
| `module/base` | `ModuleBase`, `Button`, `Template`, `Timer`, `Filter` | Feature-agnostic base classes |
| `module/device` | `Device`, `Connection`, `Screenshot`, `Control` | I/O only; contains no recovery logic |
| `module/ui` | `UI`, `Page`, page transition graph | Visual state transitions only |
| `module/ocr` | Inference wrappers, model formats, benchmarks | Stateless character recognition |
| `module/map` | `Map`, grid perception, pathfinding | Grid navigation without combat logic |
| `module/combat` | Combat loops, victory detection, formations | Battle sequences without stage selection |

## <DocIcon name="zap" /> Task Execution Data Pipeline

```text
WebUI saves configuration
  → config/<instance>.json
    → Scheduler invalidates config cache at task boundary
      → get_next() selects highest-priority due task
        → bind(task): binds parameters to self.config.<Group>_<Argument>
          → run(command)
            → Feature module captures screenshot / recognizes UI / clicks
              → task_delay() writes updated NextRun timestamp
                → Returns True / 'recoverable' / False
```

**Scheduling state is persisted exclusively inside `Scheduler.NextRun` in configuration files**. In-memory failure counters assist recovery decisions, but the queue itself survives process restarts.

## <DocIcon name="pencil" /> Task Registration Mechanics

The scheduler resolves tasks via command identifiers:

1. `task.yaml` defines task identifiers, parameter groups, and navigation menus.
2. `alas.py` implements matching dispatch methods (CamelCase converted to snake_case).
3. The method lazily imports the target feature class and executes `run()`.

```python
# alas.py
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

Tasks require no registration lists; `run()` dispatches via `getattr(self, command)()`. Note that **typos in method names are not caught on startup**; they raise an `AttributeError` when the task executes.

## <DocIcon name="drive" /> Persistence & Storage

| Data Asset | Storage Path | Access Scope |
| --- | --- | --- |
| Instance Configurations | `config/<instance>.json` | User-editable, exportable |
| Server Settings | `config/deploy.yaml` | Host-level daemon configuration |
| Analytics & History | Global SQLite Database | Statistics, loot drops, custom programs |
| Drop Archives | `log/drop/`, etc. | Categorized loot snapshots |
| Crash Dumps | `log/error/<instance>/<timestamp>/` | Frame snapshots + sanitized logs |

Database operations are managed by `module/persistence`. Database schemas migrate before engine startup; **importing modules never creates database files**.

## <DocIcon name="handshake" /> Cross-Cutting Conventions

### Exceptions

`module/exception.py` defines all engine exceptions. The scheduler determines recovery actions based on exception types; modules must never swallow exceptions:

| Exception | Meaning |
| --- | --- |
| `GameStuckError` | UI failed to advance over sustained duration |
| `GameTooManyClickError` | Same button clicked repeatedly without state change |
| `GameNotRunningError` | Target game process does not exist |
| `EmulatorNotRunningError` | Device connection lost over ADB |
| `RequestHumanTakeover` | Ambiguous game state requiring user decision |
| `ScriptError` | Code regression or unhandled software bug |
| `TaskEnd` | Explicit, normal task termination |

### Logging Standards

- `logger.hr()` outputs section breaks; `logger.attr()` formats property states.
- Output appends to `log/<date>_<instance>.txt`.
- Never print user passwords, tokens, or local path usernames to logs.

### Asset Templates

- Assets are authored at 1280×720 across `assets/{cn,en,jp,tw}/`.
- Template objects follow the `TEMPLATE_` prefix convention.
- After modifying button assets, run `uv run -m dev_tools.button_extract` and commit the generated `assets.py`.

### Configurations

- Modify `module/config/argument/*.yaml` first, then run the generator.
- Property paths follow `<Task>.<Group>.<Argument>`, accessed via `self.config.Group_Argument`.
- Add corresponding entries to `i18n/*.json` for new parameters.

## <DocIcon name="circle-alert" /> Known Technical Debt

| Component | Technical Debt Context |
| --- | --- |
| `run()` / `loop()` | Long methods with nested exception handlers; adding branches requires careful symmetry |
| Return Types | `True / False / 'recoverable'` is a weakly typed protocol |
| `failure_record` | Held in memory; process restarts reset consecutive failure counters |
| `EmulatorManager` | Inlines SSH command logic; sole task not delegating to a dedicated module |
| `GameManager` | Work in progress; not for production use |

## <DocIcon name="map" /> Related Documentation

<ul class="ap-linklist">
<li><a href="/en/azurpilot/developer/scheduler">Scheduler Lifecycle<span class="desc">loop, run, and the recovery matrix</span></a></li>
<li><a href="/en/azurpilot/developer/config">Configuration System<span class="desc">From YAML definitions to runtime bindings</span></a></li>
<li><a href="/en/azurpilot/developer/webui-backend">WebUI Backend<span class="desc">RPC router and worker process supervision</span></a></li>
<li><a href="/en/azurpilot/developer/module-dev">Adding a New Task<span class="desc">Step-by-step implementation guide</span></a></li>
</ul>
