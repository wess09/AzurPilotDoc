---
title: WebSocket API v1 Reference
description: "WebSocket API v1 specification: protocol envelopes, session handshake, topic subscriptions, error codes, and 72 methods."
updated: 2026-10-20
---

# WebSocket API v1

Endpoints:

```text
ws://127.0.0.1:25548/api/v1/ws
wss://<remote-endpoint>/api/v1/ws
```

Protocol version `v=1`. All communication occurs over JSON text frames.

## <DocIcon name="file" /> Protocol Envelopes

### Request

```json
{
  "v": 1,
  "type": "request",
  "id": "req-001",
  "method": "instances.list",
  "params": {}
}
```

| Field | Constraint |
| --- | --- |
| `v` | Must equal `1` |
| `type` | `request` |
| `id` | 1–100 characters; must be unique within the active session |
| `method` | Registered method name |
| `params` | Strictly validated parameter object |

### Successful Response

```json
{ "v": 1, "type": "response", "id": "req-001", "ok": true, "result": [] }
```

### Error Response

```json
{
  "v": 1,
  "type": "response",
  "id": "req-001",
  "ok": false,
  "error": { "code": "INVALID_PARAMS", "message": "Invalid request parameters", "details": [] }
}
```

### Event Broadcast

```json
{ "v": 1, "type": "event", "topic": "overview", "data": {} }
```

## <DocIcon name="handshake" /> Session Lifecycle

Upon connection, the server pushes an initial session descriptor:

```json
{
  "v": 1,
  "type": "event",
  "topic": "session",
  "data": { "authRequired": true, "protocolVersion": 1 }
}
```

- `authRequired: false` indicates connection over loopback without a configured password; calls are permitted immediately.
- Unauthenticated sessions time out after 30 seconds; authenticated sessions time out after 60 seconds of silence.

### Authentication

```json
{
  "v": 1, "type": "request", "id": "a1", "method": "auth.login",
  "params": { "password": "<WebUI Password>" }
}
```

Remote pairing clients supply pairing tokens instead of the master password. Revoked tokens immediately return `UNAUTHORIZED` on subsequent calls or 15s heartbeats.

## <DocIcon name="megaphone" /> Subscriptions

```json
{
  "v": 1, "type": "request", "id": "s1", "method": "events.subscribe",
  "params": { "instance": "ap", "topics": ["overview", "logs", "statistics"] }
}
```

| Topic | Data Streamed | Sampling Cadence |
| --- | --- | --- |
| `instances` | Instance lists and status | 2 seconds |
| `overview` | Active tasks and resources | 1 second |
| `logs` | Incremental log streams | On write |
| `preview` | Live screen capture | On write |
| `statistics` | Aggregated telemetry | 1 second |
| `notifications` | System notification alerts | Event-driven |
| `stock` | Stock exchange ledger | Event-driven |

::: warning Subscriptions Follow Replacement Semantics
Subscribing replaces all existing topics for that session. The Android host enforces a single global subscriber; custom integrations must avoid conflicting subscriptions with active frontends.
:::

## <DocIcon name="circle-alert" /> Rate Limits & Error Codes

| Property | Constraint |
| --- | --- |
| Message Size Cap | ≤ 8 MiB |
| Standard Request Cap | ≤ 1 MiB |
| Request Cap Exemptions | `mind.import`, `mind.recognize`, `mind.save`, `mind.calculate` |
| Request Rate Limit | 30 requests per second |

| Error Code | Meaning |
| --- | --- |
| `INVALID_REQUEST` | Corrupted envelope or size limit exceeded |
| `INVALID_PARAMS` | Parameter validation failure |
| `UNAUTHORIZED` | Missing authentication or revoked token |
| `TLS_REQUIRED` | Remote account operation attempted over unencrypted connection |
| `RATE_LIMITED` | Request limit exceeded |
| `DUPLICATE_REQUEST` | Request ID reused |
| `INTERNAL_ERROR` | Internal unhandled server exception |

Validation errors report property paths and expected types only, scrubbing input values to prevent credential leakage.

## <DocIcon name="zap" /> Common Workflows

### List Instances & Fetch Overview

```json
{"v":1,"type":"request","id":"1","method":"instances.list","params":{}}
{"v":1,"type":"request","id":"2","method":"overview.get","params":{"instance":"ap"}}
```

### Start & Stop Schedulers

```json
{"v":1,"type":"request","id":"3","method":"scheduler.start","params":{"instance":"ap"}}
{"v":1,"type":"request","id":"4","method":"scheduler.stop","params":{"instance":"ap"}}
```

### Modify Configuration

```json
{
  "v": 1, "type": "request", "id": "5", "method": "config.patch",
  "params": {
    "instance": "ap",
    "revision": "<revision-from-last-read>",
    "changes": [{ "path": "Research.Scheduler.Enable", "value": true }]
  }
}
```

### Trigger Immediate Task

```json
{"v":1,"type":"request","id":"6","method":"tasks.run","params":{"instance":"ap","task":"Research"}}
```

### Stream Logs

```json
{"v":1,"type":"request","id":"7","method":"logs.get","params":{"instance":"ap","after":128}}
```

## <DocIcon name="clipboard" /> Method Catalog

The interactive table below is generated from `contract.json`. Expand rows to view parameter schemas and constraints:

<ApiTable />

## <DocIcon name="lightbulb" /> Client Implementation Guidelines

1. Wait for the `session` handshake event before issuing authentication calls.
2. Use monotonically increasing integers or UUIDs for request IDs.
3. Reconnect with exponential backoff and re-subscribe following disconnections.
4. Issue an initial `overview.get` call before subscribing to event topics.
5. Verify mutation results by reading back state rather than assuming success.
6. Avoid appending credentials to query parameters.
