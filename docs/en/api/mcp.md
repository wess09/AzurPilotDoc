---
title: MCP Server
description: 18 Model Context Protocol tools, endpoint mounting, authentication, and client integration with AI agents.
updated: 2026-10-20
---

# MCP Server

The Model Context Protocol (MCP) server allows compatible AI clients (editors, agent tools) to query and control AzurPilot programmatically. It operates as an **alternative integration channel** rather than replacing the WebSocket API.

## <DocIcon name="rocket" /> Mounting Modes

| Mode | Endpoint | Description |
| --- | --- | --- |
| Embedded in WebUI | `http://<host>:25548/mcp/sse` | Default; reuses WebUI process |
| Standalone Service | `python mcp_server_sse.py` (port `22268`) | Debugging and isolated setups |

::: warning Port 22268 Collision
Standalone MCP services and standalone OCR services default to port 22268. If hosting both concurrently on the same machine, modify one of the ports.
:::

## <DocIcon name="key" /> Authentication

The MCP service authenticates using the WebUI password (`--key` or `deploy.yaml`):

| Header | Format |
| --- | --- |
| Standard (Recommended) | `Authorization: Bearer <password>` |
| Compatibility Header | `X-API-Key: <password>` |
| Query Parameter | `?key=<password>` (only for clients that cannot set headers) |

Unauthenticated requests receive HTTP `401`. Modifying passwords requires restarting the server.

::: danger Query Parameters Expose Credentials
Query parameters appear in server logs, history, and screenshots. Use HTTP headers whenever supported.
:::

## <DocIcon name="settings" /> Client Configuration

Local connection:

```json
{
  "mcpServers": {
    "azurpilot": {
      "url": "http://127.0.0.1:25548/mcp/sse",
      "headers": { "Authorization": "Bearer <WebUI-Password>" }
    }
  }
}
```

Remote or local network:

```json
{
  "mcpServers": {
    "azurpilot": {
      "url": "http://<IP_ADDRESS>:25548/mcp/sse",
      "headers": { "Authorization": "Bearer <WebUI-Password>" }
    }
  }
}
```

## <DocIcon name="clipboard" /> Available Tools

18 tools are currently registered:

| Category | Tool | Function |
| --- | --- | --- |
| Instance | `list_instances` | Lists all instances |
| Instance | `get_status` | Returns instance status |
| Instance | `start_instance` | Starts an instance worker |
| Instance | `stop_instance` | Stops an instance worker |
| Tasks | `list_tasks` | Lists all available tasks |
| Tasks | `get_task_help` | Retrieves task documentation |
| Tasks | `trigger_task` | Triggers immediate task execution |
| Tasks | `get_scheduler_queue` | Inspects scheduler queue |
| Tasks | `clear_scheduler_queue` | Purges scheduler queue |
| Telemetry | `get_current_running_task` | Returns active task |
| Telemetry | `get_resources` | Returns resource gauges |
| Telemetry | `get_config` | Reads instance settings |
| Telemetry | `get_recent_logs` | Retrieves recent logs |
| Telemetry | `get_screenshot` | Returns current frame capture |
| Config | `update_config` | Writes configuration values |
| Maintenance | `restart_emulator` | Reboots emulator |
| Maintenance | `restart_adb` | Restarts ADB daemon |
| Maintenance | `update_alas` | Updates AzurPilot core code |

::: tip Schemas Provided Dynamically
MCP clients fetch JSON Schemas dynamically via `tools/list`.
:::

## <DocIcon name="lightbulb" /> Common Use Cases

### Health Checks

```text
1. list_instances           → Check active instances
2. get_status(instance)     → Inspect worker state and active task
3. get_recent_logs(...)     → Check for error traces
4. get_resources(...)       → Evaluate oil and coin levels
```

### Interventions

```text
trigger_task(instance, task)   → Run task on demand
clear_scheduler_queue(...)     → Reset backlog during troubleshooting
restart_adb(...)               → Recover dropped ADB connections
```

### Destructive Operations

`update_alas`, `restart_emulator`, and `clear_scheduler_queue` disrupt running tasks. Ensure agents understand the consequences before delegating access.

::: danger Supervise Configuration Changes
`update_config` writes directly to disk, altering subsequent schedules. External edits lack optimistic revision locks and may overwrite concurrent user adjustments.
:::

## <DocIcon name="scale" /> Comparison with WebSocket API

| Feature | MCP Server | WebSocket API |
| --- | --- | --- |
| List / Start / Stop Instances | ✅ | ✅ |
| Detailed Configuration Edits | Basic (`update_config`) | ✅ Comprehensive |
| Real-time Event Streaming | ❌ | ✅ |
| Scheduler Canvas Orchestration | ❌ | ✅ |
| Agent Integration Out-of-the-Box | ✅ | Requires custom client |
