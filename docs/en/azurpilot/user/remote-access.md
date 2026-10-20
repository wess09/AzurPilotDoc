---
title: Remote Access & Device Pairing
description: Securely access WebUI dashboards over LAN or Cloudflare Quick Tunnels using pairing codes and mobile clients.
updated: 2026-10-20
---

# Remote Access & Device Pairing

Remote access enables managing automation away from your host machine. Two primary approaches are supported:

| Method | Exposure Profile | Recommended For |
| --- | --- | --- |
| LAN Direct Connection | Internal IP + Port | Devices connected to the same local router |
| Cloudflare Quick Tunnel | Ephemeral Public Domain | Remote mobile management outside local networks |

## <DocIcon name="laptop" /> LAN Direct Connection

1. <DocIcon name="file-pen" /> Set `WebuiHost` to `0.0.0.0` in `config/deploy.yaml` (or keep default settings).
2. <DocIcon name="lock" /> Configure a strong password in `WebuiPassword`, or supply `-k` on the command line.
3. <DocIcon name="refresh" /> Restart the backend server.
4. <DocIcon name="monitor" /> Open `http://<Local-IP>:25548` from another device on the same subnet.

::: danger Never Bind to 0.0.0.0 Without Passwords
The WebUI can start/stop tasks, read screenshots, and alter configurations. If bound to public interfaces without credentials, AzurPilot generates an ephemeral key in `password.txt`, but you should always configure a strong password manually.
:::

## <DocIcon name="cloud" /> Cloudflare Quick Tunnel

Navigate to "Settings → Remote Access", set the mode to `cloudflare`, configure a WebUI password, toggle Remote Access on, and restart. The engine will:

1. <DocIcon name="rocket" /> Launch an internal `cloudflared` Quick Tunnel to obtain an ephemeral `*.trycloudflare.com` domain.
2. <DocIcon name="key" /> Register the tunnel endpoint with the registry service (default: `https://remote.azurpilot.com`) using its hardware-bound key.
3. <DocIcon name="clock" /> Renew the lease every 60 seconds; orphaned leases expire on the server after 180 seconds.
4. <DocIcon name="plug" /> Expose a persistent URL at `<registry>/d/<device_id>/` that returns HTTP 301 redirects to the active tunnel.

Device identities are stored in `config/remote-access.json`: installation IDs and registration keys persist locally, while pairing credentials store SHA-256 hashes only. **Back up this file** to retain persistent URLs across migrations, but **never commit it to source control**.

::: warning Quick Tunnel Limitations
Cloudflare offers Quick Tunnels on a best-effort basis, imposing limits on concurrent streams and long-lived connections. They are suited for mobile management and testing. Because the underlying protocol is WebSocket, persistent URLs cannot bypass Cloudflare edge limits. Outbound access to port 7844 is required.
:::

## <DocIcon name="handshake" /> Device Pairing Workflow

<RemotePairing />

<Figure caption="Pairing codes and QR codes share a single-use token pool; once claimed by either method, the token cannot be reused." />

<Steps>
<Step title="Generate pairing token on host">

Click "Pair" in Remote Access settings. The server requests a 6-digit verification code, a 128-bit scan secret, and a 5-minute validity window from the registry.

</Step>
<Step title="Claim token on client">

- QR Code: Scan the `azurpilot://pair?secret=<secret>` QR code.
- Manual Entry: Submit the 6-digit pairing code (preserving leading zeros).

Claims are resolved inside an atomic server-side transaction and can only succeed once.

</Step>
<Step title="Persist credentials on client">

The Android client encrypts the endpoint and token via AES-GCM in the Android Keystore. The client connects over WSS, calling `auth.login` before signaling readiness.

</Step>
<Step title="Inspect and revoke authorizations">

The host displays active clients under "Authorized Devices", allowing individual client revocations. Revoked devices drop on the next request or 15s heartbeat **without modifying the host's WebUI password**.

</Step>
</Steps>

## <DocIcon name="shield" /> Security Architecture

| Boundary | Design Guarantee |
| --- | --- |
| Pairing Tokens | 6-digit code + 128-bit secret; expires in 5 minutes; single-use |
| Storage | Registries store token hashes only; clients encrypt secrets in Keystore |
| Revocation | Revocations operate per client without altering main passwords |
| Master Password | The registry never receives or persists the WebUI master password |
| Payload Traffic | The registry does not proxy WebSockets, screenshots, or game data |

## <DocIcon name="smartphone" /> Client Access Methods

- <DocIcon name="monitor" /> **Web Browser**: Navigate to the tunnel URL directly and authenticate with your WebUI password.
- <DocIcon name="smartphone" /> **Android Host App**: Connects in Remote Client mode without running local runtimes or requiring Shizuku; see [Using as Remote Client](/en/android/user/remote-client).
- <DocIcon name="plug" /> **MCP Clients**: Connects to `/mcp/sse` supplying your WebUI password as a Bearer Token; see [MCP Server](/en/api/mcp).

## <DocIcon name="wrench" /> Troubleshooting Connectivity

| Symptom | Cause / Remediation |
| --- | --- |
| Persistent URL returns 302 to `/error` | Host offline, lease expired, or Tunnel dropped |
| QR code scan fails | Check screen contrast; codes use standard Level M error correction |
| Pairing code expired alert | Code exceeded 5-minute window; generate a new code |
| Infinite connection spinner | WebSocket blocked by upstream network; confirm port 7844 outbound access |
| Tunnel fails after core update | Missing or outdated `pyflared` dependency inside Runtime |
