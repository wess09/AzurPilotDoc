---
title: API Overview
description: "Overview of the three external AzurPilot interfaces: WebSocket RPC, Android thin interface, and MCP services."
updated: 2026-10-20
---

# API Overview

The core program exposes three external interfaces. All three share a unified configuration engine and process model, but differ in protocols, authentication schemes, and intended use cases.

| Interface | Endpoint | Protocol | Authentication | Use Case |
| --- | --- | --- | --- | --- |
| WebSocket API | `/api/v1/ws` | JSON RPC over WS | Session token / pairing credentials | Web frontend, mobile host, custom dashboards |
| Android Thin Interface | `/android/*` | HTTP | Loopback origin + header token | Android host management |
| MCP Service | `/mcp/sse` or standalone `:22268` | MCP over SSE | Bearer token (WebUI password) | AI agents and tools |

Additionally, `/healthz` serves as an unauthenticated readiness probe returning no business data.

## <DocIcon name="shield" /> Stability Boundaries

::: warning Only Registered Methods Form Public APIs
The 72 methods defined in `module/api/router.py` represent the stable public contract, exported via `dev_tools.export_api_schema`. Internal Python functions inside feature modules are not APIs; do not invoke them directly from frontends or external integrations.
:::

| Layer | Contract Stability |
| --- | --- |
| `router.py` Methods | Public contract with strictly validated parameter schemas |
| `/android/*` Endpoints | Dedicated host interface evolving alongside the Android host |
| MCP Tools | Public tools whose signatures adapt to core features |
| Internal Services / Functions | Private implementation details subject to unannounced refactoring |

## <DocIcon name="plug" /> Port Allocation

| Port | Purpose | Configuration Key |
| --- | --- | --- |
| `25548` | WebUI dashboard & WebSocket RPC | `WebuiPort` in `deploy.yaml` |
| `22267` | Desktop launcher WebUI | Injected by desktop launcher |
| `22268` | Standalone MCP & OCR services | `OcrServerPort` in `deploy.yaml` |
| `22302` | Android OCR tensor inference | Managed internally by Android `:ocr` |
| `22300` / `22400` | Legacy host process detection probes | Internal Android compatibility checks |

::: tip Port 22268 Collision
Standalone MCP services and standalone OCR services default to port 22268. If hosting both concurrently on the same machine, modify one of the ports.
:::

## <DocIcon name="key" /> Authentication Schemes

| Context | Authentication Mechanism |
| --- | --- |
| Local loopback without password | Unauthenticated direct access |
| Browser / Local Area Network | Submits WebUI password via `auth.login` |
| Android Remote Client | Ephemeral pairing credentials independent of master password |
| Android Local Host | Validates `X-AzurPilot-Android-Token` restricted to loopback |
| MCP Service | Passes `Authorization: Bearer <password>` or query param `?key=` |

Passwords resolve from `--key` flags, `Password` in `config/deploy.yaml`, or auto-generated keys in `password.txt`.

## <DocIcon name="file" /> Minimal Invocation Examples

WebSocket:

```json
{"v":1,"type":"request","id":"1","method":"system.ping","params":{}}
{"v":1,"type":"response","id":"1","ok":true,"result":{"pong":true}}
```

HTTP:

```bash
curl -s http://127.0.0.1:25548/healthz
```

MCP Configuration:

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

## <DocIcon name="map" /> Continue Reading

<ul class="ap-linklist">
<li><a href="/en/api/websocket">WebSocket API<span class="desc">Envelopes, authentication, and all 72 methods</span></a></li>
<li><a href="/en/api/android">Android Thin Interface<span class="desc">Host-to-runtime IPC contracts</span></a></li>
<li><a href="/en/api/mcp">MCP Service<span class="desc">18 tools and agent integrations</span></a></li>
<li><a href="/en/azurpilot/developer/webui-backend">WebUI Backend<span class="desc">Implementation architecture</span></a></li>
</ul>
