---
title: Android Thin Interface
description: "HTTP contract between the Android host and runtime: status probes, instance lifecycles, and hot update suspension."
updated: 2026-10-20
---

# Android Thin Interface

The Android host uses a dedicated set of lightweight HTTP endpoints prefixed with `/android/` for process lifecycle management and status polling.

## <DocIcon name="clipboard" /> Activation Condition

Routes register only when the environment variable is set:

```bash
AZURPILOT_ANDROID=1
```

These routes are absent in standard desktop installations.

## <DocIcon name="key" /> Authentication

```http
GET /android/status HTTP/1.1
X-AzurPilot-Android-Token: <token>
```

Requests must satisfy two conditions simultaneously:

1. Request originates from loopback interfaces (`127.0.0.1` or `::1`).
2. Header matches the Runtime token using constant-time comparison.

Failing either condition returns `403 {"error": "loopback only"}`.

::: danger Port Exposure Caveat
The thin interface assumes a local-only security perimeter. Forwarding port 25548 to external networks leaves WebSocket passwords as the only remaining security boundary.
:::

## <DocIcon name="settings" /> Instance Parameters

Endpoints accept an optional query parameter:

```text
?config=<instance>
```

When omitted:

- Defaults to the active running instance;
- Falls back to `alas` if no instances are active.

Requests specifying non-existent instances return HTTP 400.

## <DocIcon name="plug" /> Endpoints

| Method | Path | Function |
| --- | --- | --- |
| GET | `/android/status` | Execution state |
| GET | `/android/configs` | List of instance names |
| GET | `/android/logs?tail=N` | Plaintext log stream (N ≤ 2000) |
| POST | `/android/start` | Launch instance |
| POST | `/android/stop` | Terminate instance |
| POST | `/android/tool/start?name=<tool>` | Launch utility task |
| POST | `/android/tool/stop` | Stop utility task |
| GET | `/android/update/status` | Hot-update status |
| POST | `/android/update/apply` | Commit hot-update |
| POST | `/android/update/suspend` | Suspend instances for full update |

### `/android/status`

```json
{
  "runner_alive": true,
  "pid": 12345,
  "config": "ap",
  "gui_alive": true,
  "tool_alive": false,
  "tool_name": null,
  "log_lines": 128
}
```

### `/android/start` and `/android/stop`

- `start`: Halts conflicting running instances before starting the target instance.
- `stop`: Halts the specified instance.
- Both verify whether legacy host processes are occupying devices (probing ports `22300` and `22400`). If occupied, returns `DEVICE_BUSY`.

### `/android/tool/start`

Supported tools:

| `name` | Invoked Task |
| --- | --- |
| `daemon` | `Daemon` (semi-automated clicking) |
| `event_story` | `EventStory` (story skip) |

### `/android/logs`

Returns `text/plain` logs (defaults to 80 lines):

```text
GET /android/logs?config=ap&tail=200
```

### `/android/update/suspend`

Invoked before full rootfs updates:

1. Enumerates running schedulers and utility tasks.
2. Writes instance names into `config/reloadalas`.
3. Stops instances cleanly.
4. Returns `{"ok": true, "suspended": ["ap", "ap-2"]}`.

When the WebUI launches post-update, `restart_processes()` reads the manifest and automatically revives suspended workers.

## <DocIcon name="scale" /> Division of Responsibilities

| Operation | Protocol Channel |
| --- | --- |
| Configuration editing, parameter tuning | WebSocket |
| Log and telemetry streaming | WebSocket |
| Start/stop controls, status polling | HTTP Thin Interface |
| Hot updates | HTTP Thin Interface |

Using HTTP for lifecycle controls ensures the host can terminate instances reliably even if WebSocket connections drop.
