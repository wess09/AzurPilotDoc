---
title: CLI, Ports & Environment Variables
description: Startup arguments for gui.py, alas.py, tui.py, MCP servers, network port allocations, directories, and environment variables.
updated: 2026-10-20
---

# CLI, Ports & Environment Variables

## <DocIcon name="rocket" /> Program Entry Points

| Script | Purpose | Execution Mode |
| --- | --- | --- |
| `gui.py` | WebUI backend server + worker supervisor | Persistent daemon |
| `alas.py` | Single-instance task scheduler | Persistent during instance runs |
| `tui.py` | Terminal User Interface | Interactive console |
| `mcp_server_sse.py` | Standalone MCP Server-Sent Events service | Persistent service |

## <DocIcon name="monitor" /> gui.py CLI Arguments

```bash
uv run python gui.py [options]
```

| Argument | Description | Default Value |
| --- | --- | --- |
| `--host` | Network listening interface | `WebuiHost` in `deploy.yaml`, falling back to `0.0.0.0` |
| `-p, --port` | Listening HTTP port | `WebuiPort` in `deploy.yaml`, falling back to `25548` |
| `-k, --key` | WebUI access password | `Password` in `deploy.yaml` |
| `--ssl-key` | Path to SSL private key for HTTPS | None |
| `--ssl-cert` | Path to SSL certificate for HTTPS | None |
| `--run <instance...>` | Launches specified instance workers on boot | None |
| `--electron` | Flag indicating execution inside an Electron container | False |

Examples:

```bash
uv run python gui.py --host 127.0.0.1 -p 25548 -k "your-password"
uv run python gui.py --ssl-key key.pem --ssl-cert cert.pem
```

::: warning Precedence Hierarchy for Ports
Command-line arguments > `deploy.yaml` > engine hardcoded defaults.
:::

## <DocIcon name="zap" /> alas.py CLI Arguments

```bash
uv run python alas.py [instance]
```

| Property | Rule |
| --- | --- |
| Omitted instance | Defaults to `ap` |
| Non-existent instance | Exits immediately with return code 2; does not fall back |
| Termination | Terminate process tree directly; no lock files are required |
| Working directory | `module/logger.py` changes directory to project root automatically |

For external orchestrator specifications, read the [External Scheduler Contract](/en/azurpilot/developer/scheduler#external-scheduler-contract).

## <DocIcon name="file-pen" /> tui.py

Interactive terminal user interface sharing underlying configuration, persistence, and device abstraction layers. Ideal for headless environments.

## <DocIcon name="plug" /> mcp_server_sse.py

```bash
uv run python mcp_server_sse.py
```

Binds to port `22268` by default. Collides with standalone OCR services; if running both concurrently, adjust one port.

## <DocIcon name="plug" /> Network Ports

| Port | Bound Service | Configurable Key |
| --- | --- | --- |
| `25548` | WebUI / WebSocket RPC | Available via `WebuiPort` |
| `22267` | Desktop launcher WebUI | Injected by launcher |
| `22268` | Standalone MCP / Standalone OCR | Available via `OcrServerPort` |
| `22302` | Android OCR tensor inference API | Internal Android service |
| `22300` / `22400` | Legacy Android host detection probes | Internal check |

## <DocIcon name="key" /> Environment Variables

| Variable | Function | Default |
| --- | --- | --- |
| `ALAS_DEBUG_SERVER` | Starts loopback debug service when set to `1` | Disabled |
| `AZURPILOT_OCR_THREADS` | Intra-op thread pool cap per OCR session (1–16) | Automatic |
| `AZURPILOT_ANDROID` | Registers `/android/*` HTTP routes when set to `1` | Disabled |
| `ALAS_LAUNCHER_PID` | Injected by desktop launcher to mark child process ownership | None |
| `ALAS_LAUNCHER_JOB_BREAKAWAY` | Injected by launcher to signal Job Object breakaway capabilities | None |
| `ALAS_WEBUI_TRUST_SECRET` | Ephemeral single-use login token injected by launcher | None |
| `AZURPILOT_ANDROID_DIST_BASE` | Download base URL for legacy Android prebuilt frontend | None |
| `AZURPILOT_ANDROID_GIT_MIRROR` | Mirror prefix for Android Git repositories | None |
| `AZURPILOT_REPO` / `AZURPILOT_REF` | Upstream repository pointers for building Android rootfs | None |

::: danger Avoid Setting Launcher Variables Manually
`ALAS_LAUNCHER_PID` marks processes for fallback termination scans, and `ALAS_WEBUI_TRUST_SECRET` manages single-use authentication. Setting these manually compromises process isolation.
:::

## <DocIcon name="folder" /> Storage Directories

| Directory Path | Contents | Deletion Safety |
| --- | --- | --- |
| `config/` | Instance settings, `deploy.yaml`, `remote-access.json` | Do not delete |
| `azurpilot.db` | Analytics and persistent history | Do not delete |
| `log/` | Execution logs and crash dumps | Safe to delete post-debugging |
| `cache/` | Runtime template and model caches | Safe to delete |
| `AzurPilot_Data_Backup/` | Automated daily configuration backups | Pruned by retention policies |
| `.venv/` | Virtual environment | Rebuilt via `uv sync` |
| `frontend/dist` | Compiled frontend assets | Rebuilt by `gui.py` |

## <DocIcon name="circle-alert" /> Process Exit Semantics

The process supervisor in `gui.py` categorizes worker exits:

| Exit Classification | Trigger Condition |
| --- | --- |
| Update Exit | Clean termination following `stop_event` signal |
| Configuration / Init Failure | Immediate failure during initialization phase; no restart |
| Sensitive Task Halt | Worker exits with code 1; instance remains halted |
| User Termination | Stop button clicked in WebUI; terminates process tree |
