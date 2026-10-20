---
title: WebUI Backend
description: Process supervision, WebSocket RPC protocol, method routing, authentication, and authoring new backend APIs.
updated: 2026-10-20
---

# WebUI Backend

The backend server comprises two subsystems: `gui.py` handles process lifecycles and HTTP serving, while `module/api/` implements protocol routing and RPC methods. It contains no game logic; actions translate into configuration mutations or worker signals.

## <DocIcon name="zap" /> gui.py Lifecycle

Startup sequence:

1. Parse CLI arguments (`--host`, `--port`, `--key`, `--ssl-key`, `--ssl-cert`, `--run`, `--electron`).
2. Run `ensure_frontend()`: confirms `frontend/dist` exists, initiating a build if missing.
3. Initialize `State` (deployment settings, file paths, database handles).
4. Launch uvicorn; optionally start background MCP and OCR workers.
5. Enter process supervision loop to supervise workers and update workflows.

### Process Supervision Loop

- Workers spawn via `ProcessManager`; stop signals inject across processes via `State.manager.Event()`.
- Before updates apply, workers stop cleanly with `stop_event` so `loop()` registers an update termination rather than a crash.
- On boot, the server checks `worker_registry` to terminate orphaned workers left by unclean exits.
- Exit codes carry explicit semantics (e.g. "update exit", "config failure"), allowing the supervisor to decide whether to restart workers.

::: tip Avoid Using SIGKILL in Normal Operation
Terminating workers forcibly via `kill -9` bypasses clean termination, leaving orphaned locks and sub-processes. The WebUI stop button triggers graceful termination signals.
:::

## <DocIcon name="clipboard" /> Method Router

`module/api/router.py` registers RPC methods explicitly without reflection:

```python
self.methods = {
    'system.ping': Method(p.Params, lambda _: {'pong': True}),
    'instances.list': Method(p.Params, lambda _: runtime.instances()),
    'config.patch': Method(p.PatchParams, lambda x: configs.patch(...), True),
}
```

`Method(params, handler, mutates)`:

| Property | Purpose |
| --- | --- |
| `params` | Pydantic schema enforcing strict validation (`extra='forbid'`) |
| `handler` | Invoked business function |
| `mutates` | Flags state mutations so clients know when to refresh |

The router registers **72 methods** covering instances, configuration, scheduling, logs, statistics, mind calculators, fleet technology, stock exchanges, remote pairings, accounts, updates, announcements, and backgrounds.

## <DocIcon name="plug" /> WebSocket RPC Protocol

Endpoint: `/api/v1/ws`.

### Envelope Formats

```json
{ "v": 1, "type": "request", "id": "req-1", "method": "instances.list", "params": {} }
{ "v": 1, "type": "response", "id": "req-1", "ok": true, "result": [] }
{ "v": 1, "type": "response", "id": "req-1", "ok": false,
  "error": { "code": "INVALID_PARAMS", "message": "Invalid request parameters", "details": [] } }
{ "v": 1, "type": "event", "topic": "overview", "data": {} }
```

### Session Handshake

Upon connection, the server pushes an initial `session` handshake:

```json
{ "v": 1, "type": "event", "topic": "session",
  "data": { "authRequired": true, "protocolVersion": 1 } }
```

Connections over local loopback interfaces without configured passwords receive `authRequired: false` and are authenticated immediately.

### Authentication

```json
{ "v": 1, "type": "request", "id": "auth", "method": "auth.login",
  "params": { "password": "<WebUI Password or Pairing Token>" } }
```

- Passwords load from `--key`, `config/deploy.yaml` (`Password`), or auto-generated keys in `password.txt`.
- Remote pairings use independent tokens; revoked tokens fail on subsequent requests or 15s heartbeats.
- Sensitive operations (`accounts.manage`) require TLS when accessed remotely; non-TLS calls return `TLS_REQUIRED`.

### Topic Subscriptions

```json
{ "v": 1, "type": "request", "id": "sub", "method": "events.subscribe",
  "params": { "instance": "ap", "topics": ["overview", "logs", "statistics"] } }
```

| Topic | Data Streamed | Sampling Cadence |
| --- | --- | --- |
| `instances` | Instance lists and execution states | 2 seconds |
| `overview` | Active tasks and resource gauges | 1 second |
| `logs` | Incremental log streams | On write |
| `preview` | Live screen previews | On write |
| `statistics` | Aggregated metrics | 1 second |
| `notifications` | Event notification alerts | Event-driven |
| `stock` | Trade ledger updates | Event-driven |

Subscriptions follow **replacement semantics**: subscribing to new topics discards previous topic registrations.

### Protocol Rate Limits & Constraints

| Constraint | Limit |
| --- | --- |
| Single Message Ceiling | 8 MiB |
| Standard Request Payload Cap | 1 MiB (exemptions apply to mind imports/calculations) |
| Request Rate Limit | 30 requests per window; excess calls return `RATE_LIMITED` |
| Duplicate Request IDs | Returns `DUPLICATE_REQUEST` |
| Unauthenticated Read Timeout | 30 seconds |

## <DocIcon name="circle-alert" /> Error Codes

| Code | Meaning |
| --- | --- |
| `INVALID_REQUEST` | Corrupted JSON payload or envelope violation |
| `INVALID_PARAMS` | Parameter schema validation failure |
| `UNAUTHORIZED` | Missing authentication or revoked token |
| `TLS_REQUIRED` | Sensitive remote account operation attempted over plaintext |
| `RATE_LIMITED` | Request threshold exceeded |
| `DUPLICATE_REQUEST` | Request ID reused |
| `INTERNAL_ERROR` | Internal unhandled server exception |

Validation error details include parameter paths and expected types only, scrubbing input values to prevent credential leakage.

## <DocIcon name="cloud" /> HTTP Endpoints

Auxiliary HTTP routes:

| Route | Purpose |
| --- | --- |
| `/healthz` | Health check probe (used by Android host) |
| `/android/*` | Android host thin interface (requires `X-AzurPilot-Android-Token`) |
| `/api/v1/pairings/*` | Remote pairing discovery endpoints |
| Static Files | Serves `frontend/dist` directly from disk |

Endpoints under `/android/*` restrict access to loopback origins. See [Android Thin Interface](/en/api/android).

## <DocIcon name="circle-plus" /> Authoring a New API Method

<Steps>
<Step title="Define Pydantic schema">

Add a schema to `module/api/protocol.py` inheriting `Params` with `extra='forbid'` and `strict=True`.

</Step>
<Step title="Implement business service">

Implement service logic in `module/api/<domain>_service.py`; keep routing layers minimal.

</Step>
<Step title="Register route">

Register the method inside `router.py`'s `self.methods` table, specifying the `mutates` flag.

</Step>
<Step title="Export TypeScript contracts">

```bash
uv run python -m dev_tools.export_api_schema
```

Updates `frontend/src/api/generated.ts` and `contract.json`.

</Step>
<Step title="Integrate in frontend">

Invoke via `api.request('your.method', params)`; TypeScript types resolve automatically from generated contracts.

</Step>
<Step title="Write unit tests">

```bash
uv run python -m unittest tests.test_api
```

Verify valid responses, schema rejections, unauthorized handling, and concurrent requests.

</Step>
</Steps>

::: warning Do Not Expose Internal Methods
Only routes registered in `router.py` form stable public contracts. Avoid exposing internal module functions to the frontend.
:::

## <DocIcon name="map" /> Related Documentation

<ul class="ap-linklist">
<li><a href="/en/api/websocket">WebSocket API Reference<span class="desc">Complete catalog of methods and parameters</span></a></li>
<li><a href="/en/azurpilot/developer/frontend">React Frontend<span class="desc">Client-side contract consumption</span></a></li>
<li><a href="/en/api/android">Android Thin Interface<span class="desc">Inter-process communication protocols</span></a></li>
</ul>
