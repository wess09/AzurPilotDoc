---
title: Core Developer Portal
description: Set up the AzurPilot Python development environment, repository layout, codebase navigation, and pull request checklist.
updated: 2026-10-20
---

# Core Developer Portal

This guide provides instructions for developers familiar with Python to get AzurPilot running locally, navigate key modules, and submit verified code changes.

## <DocIcon name="laptop" /> Development Environment

| Dependency | Target Version | Description |
| --- | --- | --- |
| Python | **3.14** | Defined by `requires-python` in `pyproject.toml` |
| uv | Latest | Manages virtual environments and locked dependencies |
| Node.js | See `frontend/package.json` | Required only when modifying the WebUI frontend |
| ADB | Any functional release | Required only for physical hardware debugging |

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
uv sync --frozen            # Installs development dependencies
npm ci --prefix frontend    # Locks frontend dependencies
```

### Common Commands

| Command Purpose | CLI Invocation |
| --- | --- |
| Start WebUI Backend | `uv run python gui.py` |
| Start Scheduler Worker | `uv run python alas.py <instance>` |
| Terminal User Interface | `uv run python tui.py` |
| Standalone MCP Service | `uv run python mcp_server_sse.py` |
| Python Unit Test Suite | `uv run python -m unittest discover -s tests` |
| Specific Test Module | `uv run python -m unittest tests.test_api` |
| Pytest Test Suite | `uv run pytest tests/shop_event` |
| Fast Linter | `uv run ruff check . --select E9,F63,F7,F82 --ignore F821,F722` |
| Frontend Type Check | `npm run typecheck --prefix frontend` |
| Frontend Unit Tests | `npm test --prefix frontend` |
| Frontend End-to-End Tests | `npm run test:e2e --prefix frontend` |
| Import Smoke Tests | `uv run python -m dev_tools.import_smoke_test` |

## <DocIcon name="map" /> Repository Layout

```text
AzurPilot/
├── alas.py                  # Scheduler: task loops, recovery tiers, task entry points
├── gui.py                   # WebUI server (uvicorn + worker supervision)
├── mcp_server_sse.py        # Standalone MCP SSE service
├── tui.py                   # Terminal User Interface
├── module/
│   ├── api/                 # WebSocket router and RPC methods
│   ├── runtime/             # Worker process manager, updater, remote access, vault
│   ├── config/              # Configuration schemas, compiler, and transaction manager
│   ├── device/              # Screenshots, touch injection, emulator supervisors
│   ├── ui/                  # Page state graph and UI navigation
│   ├── ocr/                 # OCR inference abstractions and models
│   ├── map/ map_detection/  # Grid perception and pathfinding algorithms
│   ├── combat/              # Battle detection and post-combat resolution
│   ├── campaign/            # Sortie orchestration
│   ├── os*/                 # Operation Siren logic
│   ├── <feature>/           # research, commission, island, dorm, etc.
│   └── persistence/         # SQLite database management
├── campaign/                # Python map definitions and battle scripts
├── frontend/                # React + TypeScript + Vite web console
├── assets/                  # 4-server UI button templates
├── deploy/                  # Deployment templates and Docker configurations
├── dev_tools/               # Code generators and developer tools
├── docs/modules/            # 20-section architectural module documentation
└── tests/                   # Python unit tests and test fixtures
```

## <DocIcon name="compass" /> Task-Driven Navigation

| Objective | Starting Reference |
| --- | --- |
| Author a new game task | [Adding a New Task](/en/azurpilot/developer/module-dev) |
| Modify scheduling behavior | [Scheduler Lifecycle](/en/azurpilot/developer/scheduler) |
| Add a configuration parameter | [Configuration System](/en/azurpilot/developer/config) |
| Modify the WebUI console | [React Frontend](/en/azurpilot/developer/frontend) |
| Expose a new API endpoint | [WebUI Backend](/en/azurpilot/developer/webui-backend) |
| Tune vision and recognition | [Device, Vision & Combat](/en/azurpilot/developer/device-vision) |
| Update event map logic | `campaign/` stage definitions and `campaign/Readme.md` |

## <DocIcon name="shield" /> Core Engineering Rules

### 1. State Loops Over Sleep

```python
def some_function(self, skip_first_screenshot=True):
    while True:
        if skip_first_screenshot:
            skip_first_screenshot = False
        else:
            self.device.screenshot()

        if self.appear(END_CONDITION):
            break
        if self.appear_then_click(BUTTON_A, interval=2):
            continue
        if self.handle_popup():
            continue
```

- Exit evaluation uses `appear()` without intervals.
- Interactive clicks use `appear_then_click()` with an `interval` of 2–5 seconds to prevent double-clicks.
- Never use `sleep()` inside state loops; never gate loops on negative conditions; do not nest state loops.
- `handle_*()` methods must return a `bool`: `True` indicates an action was performed requiring a fresh screenshot.

### 2. Never Edit Generated Files Manually

| Generated Artifact | Generation Command |
| --- | --- |
| `args.json`, `menu.json`, `config_generated.py`, `template.json` | `uv run -m module.config.config_updater` |
| `assets/*/assets.py` | `uv run -m dev_tools.button_extract` |
| `frontend/src/api/generated.ts`, `contract.json` | `uv run python -m dev_tools.export_api_schema` |

CI regenerates these files and checks for git diffs. Manual changes fail CI checks.

### 3. Keep Task Methods Lazily Imported

```python
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

The engine loads configuration and scheduling modules on startup; business features are imported lazily on execution. This minimizes memory overhead and isolates import failures to specific tasks.

## <DocIcon name="file" /> Module Documentation

The `docs/modules/` folder contains 20-section architectural specifications covering the scheduler, config, device, OCR, combat, Operation Siren, and WebUI. Consult these documents before refactoring.

| Document | Scope |
| --- | --- |
| `docs/modules/README.md` | Index and authoring guidelines |
| `docs/modules/overview/conventions.md` | Coding conventions and cross-cutting patterns |
| `docs/modules/overview/directory-map.md` | Directory to task mapping |
| `docs/modules/WRITING-GUIDE.md` | Structural standards for internal documentation |

## <DocIcon name="handshake" /> Submitting Pull Requests

1. Branch from `master`; keep changes focused on a single topic.
2. Run unit tests directly related to modified modules.
3. Commit generated schema files alongside source changes.
4. Follow `.github/PULL_REQUEST_TEMPLATE.md`: change category, test results, linked issues.
5. Do not check unverified tests. Inspect logs when CI checks fail.

## <DocIcon name="wrench" /> Debugging Tips

| Scenario | Debugging Technique |
| --- | --- |
| Run isolated task module | Execute module directly via its `__main__` block |
| Validate imports offline | `uv run python -m dev_tools.import_smoke_test` |
| Inspect API contracts | `frontend/src/api/contract.json` |
| Inspect configuration keys | Open WebUI Developer view or inspect `args.json` |
| Internal debug server | Launch with `ALAS_DEBUG_SERVER=1` (loopback only) |
