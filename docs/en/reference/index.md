---
title: Reference Index
description: Fast lookup index for task commands, configuration parameters, CLI options, ports, environment variables, and source audits.
updated: 2026-10-20
---

# Reference Index

This section serves as a reference index rather than a step-by-step tutorial. Consult corresponding user manuals for conceptual explanations.

| Reference Guide | Contents | Primary Audience |
| --- | --- | --- |
| [Task Command Matrix](/en/reference/tasks) | 102 tasks with identifiers, menus, and parameter groups | Writing scripts, parsing logs |
| [Configuration Reference](/en/reference/config) | 167 parameter groups, schema fields, and persistence rules | Troubleshooting configuration behavior |
| [CLI, Ports & Environment Variables](/en/reference/cli) | CLI flags, port bindings, directories, and environment variables | Deployments, containerization |
| [Source Version Index](/en/reference/versions) | Audited repository commits, branches, and coverage scopes | Verifying documentation currency |

## <DocIcon name="zap" /> Quick Reference

### Port Allocations

| Port | Bound Service |
| --- | --- |
| 25548 | WebUI / WebSocket RPC (Core default) |
| 22267 | Desktop launcher WebUI |
| 22268 | Standalone MCP / Standalone OCR |
| 22302 | Android OCR tensor inference API |
| 22300 / 22400 | Legacy Android host detection probes |

### Directory Locations

| Path | Contents |
| --- | --- |
| `config/<instance>.json` | Instance configuration schemas |
| `config/deploy.yaml` | Daemon server settings |
| `log/<date>_<instance>.txt` | Active execution log |
| `log/error/<instance>/<timestamp>/` | Diagnostic crash dumps and frame captures |
| `AzurPilot_Data_Backup/<date>/` | Automated daily backups |
| `frontend/dist` | Pre-built web frontend assets |
| `.venv/` | Relocatable virtual environment |

### Commands

```bash
uv run python gui.py            # WebUI backend server
uv run python alas.py <instance> # Task scheduler worker
uv run python tui.py            # Terminal user interface
uv run python mcp_server_sse.py # Standalone MCP server
```

### Documentation Verification

```bash
npm run dev        # Local documentation development server
npm run build      # Static production build
npm run check      # Link, coverage, and SEO verification
npm run test:e2e   # Browser test suite
```
