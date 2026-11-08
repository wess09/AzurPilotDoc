---
title: MCP Service
description: The 25 azurpilot_ tools, SSE connection, authentication, device-control leases and compatibility boundary.
updated: 2026-11-08
---

# MCP Service

MCP (Model Context Protocol) lets compatible clients and agents query, manage and operate AzurPilot. It is a semantic interface for AI clients, not a replacement for the WebSocket API.

## Endpoint and authentication

| Mode | Endpoint | Notes |
| --- | --- | --- |
| Mounted with WebUI | `http://<host>:25548/mcp/sse` | Default; shares the WebUI runtime and instances |
| Standalone service | `uv run python mcp_server_sse.py`, port 22268 by default | Separate deployment or debugging |

The standalone MCP and OCR services both use port 22268 by default. Change one if both run on the same machine. MCP uses the WebUI password: preferably `Authorization: Bearer <WebUI password>`, alternatively `X-API-Key: <WebUI password>`; use `?key=<WebUI password>` only when headers cannot be set. Restart the WebUI after changing the password.

::: danger Do not put passwords in URLs
Query parameters may appear in access logs, history or screenshots. Prefer the Authorization header.
:::

## Default tool directory: 25 tools

The default endpoint exposes only these 25 **azurpilot_** tools. Legacy names require an explicitly created compatibility endpoint.

| Group | Tools | Purpose |
| --- | --- | --- |
| Instances | **azurpilot_list_instances**, **azurpilot_get_context**, **azurpilot_start_instance**, **azurpilot_stop_instance** | List instances, inspect context, start and stop |
| Tasks | **azurpilot_search_tasks**, **azurpilot_get_task_schema**, **azurpilot_set_task_schedule** | Search tasks, inspect schemas and set enablement / next run |
| Configuration | **azurpilot_get_config**, **azurpilot_patch_config** | Read configuration and revision; atomically patch after revision check, with dry_run |
| Logs / statistics | **azurpilot_get_logs**, **azurpilot_get_statistics**, **azurpilot_get_statistics_schema** | Logs, overview / resources / Operation Siren / commissions / research statistics and metric definitions |
| Device | **azurpilot_observe_device**, **azurpilot_acquire_device_control**, **azurpilot_release_device_control** | Capture the screen and acquire / release a control lease |
| Device input | **azurpilot_click**, **azurpilot_swipe**, **azurpilot_long_press**, **azurpilot_input_text**, **azurpilot_press_key**, **azurpilot_adb_shell** | Click, swipe, long-press, text, keys and controlled ADB shell |
| Operation lookup | **azurpilot_get_operation** | Query a write operation's status and final result |
| Maintenance / updates | **azurpilot_restart_emulator**, **azurpilot_restart_adb**, **azurpilot_update_application** | Restart emulator / ADB or request a core update |

## Device-control and write-operation semantics

- Acquire a lease with **azurpilot_acquire_device_control** before direct control, then release it with **azurpilot_release_device_control**.
- Call **azurpilot_observe_device** first to obtain the current screen and frame_id. Coordinate actions can include frame_id so stale coordinates are rejected after a size or orientation change.
- Input tools distinguish between a command being dispatched and the screen changing. **A dispatched command does not prove that the UI responded or that a task completed.**
- Write operations support request_id deduplication and return operation_id. If a timeout leaves the outcome uncertain, query **azurpilot_get_operation** instead of blindly retrying.
- **azurpilot_patch_config** uses revisions to prevent overwriting concurrent edits. Read the current configuration first and use dry_run when appropriate.
- **azurpilot_set_task_schedule** confirms a scheduling change, not successful in-game execution.

The default directory excludes legacy names such as get_status, get_resources, get_recent_logs, trigger_task and clear_scheduler_queue. They are mapped only through an explicitly created compatibility endpoint.

Typical sequence: choose an instance with **azurpilot_list_instances**, inspect it with **azurpilot_get_context**, read configuration before patching, acquire a device lease before direct input, and verify uncertain writes with **azurpilot_get_operation**.

MCP is a narrow interface for agents; WebSocket is the complete interface for WebUI, Android hosts and custom clients. See the [WebSocket API](/en/api/websocket).
