---
title: Using as Remote Client
description: Use an Android phone as a remote console connecting to instances on other machines without deploying a local runtime.
updated: 2026-10-20
---

# Using as Remote Client

Remote Client mode turns your phone into an **external management console**: the game runs on a desktop PC or server, while your phone pairs with that instance to monitor status and adjust settings.

Remote mode does not:

- Download or deploy the local Linux Runtime
- Require Shizuku or Root privileges
- Modify local autostart, permissions, or deployment files

## <DocIcon name="scale" /> Comparison: Local Host vs. Remote Client

| Dimension | Local Host | Remote Client |
| --- | --- | --- |
| Runtime Requirement | Mandatory | None |
| Game Execution Location | On phone | On target host |
| Privilege Activation | Mandatory | None |
| Configuration Source | Local Runtime | Target instance |
| Impact of Network Drop | Automation continues | Mobile connection drops; target automation continues |

::: tip Remote Tasks Continue During Disconnections
Your phone functions solely as a client. Closing the app, losing cellular signal, or uninstalling does not interrupt execution on the target machine.
:::

## <DocIcon name="clipboard" /> Prerequisites on the Target Machine

On your host PC or server:

1. Open WebUI → Settings → Remote Access.
2. Select `cloudflare` mode, configure a strong WebUI password, toggle Remote Access on, and restart.
3. Confirm status displays Ready (Quick Tunnel established).
4. Click "Pair" to generate a 6-digit code and QR code.

::: warning Password Required for Remote Tunnels
AzurPilot blocks Quick Tunnel activation when the WebUI lacks password authentication. Configure a password first.
:::

## <DocIcon name="handshake" /> Pairing Flow

<Steps>
<Step title="Open pairing wizard on phone">

Tap "Connect Remote AP" on the Welcome screen or Home view. You do not need to install the Runtime.

</Step>
<Step title="Scan QR code or enter code">

- Scan: Scan the `azurpilot://pair?secret=<secret>` QR code.
- Manual: Enter the 6-digit pairing code (including leading zeros).

Both pathways consume the same single-use token; once claimed, the token cannot be replayed.

</Step>
<Step title="Store credentials securely">

The client stores tunnel endpoints and pairing credentials encrypted with AES-GCM via the Android Keystore. Tokens are excluded from log outputs.

</Step>
<Step title="Connect">

The client resolves the tunnel endpoint and invokes `auth.login` over WSS. The native console renders once authentication completes.

</Step>
</Steps>

Pairing codes expire in 5 minutes. Regenerating a code invalidates previously unclaimed tokens for that device on the server.

## <DocIcon name="monitor" /> Operations

Once connected, the native interface streams data from the remote server:

- Instance switching
- Overview dashboard and active task monitoring
- Configuration editor (persisted directly to remote instance)
- Live logs and drop analytics

Switching sources saves pending edits, closes active sockets, and flushes local caches. Returning to Local mode re-binds to the local loopback server.

## <DocIcon name="ban" /> Revoking Access

| Action | Location | Outcome |
| --- | --- | --- |
| Revoke specific client | Target Host → Remote Access → Authorized Devices | Drops client on next request (or 15s heartbeat) |
| Remove entry locally | Phone → Remove Entry | Deletes stored credentials locally; **does not revoke server authorization** |

::: danger Removing Local Entries Does Not Unpair
Deleting an entry from the phone removes local state only; the server retains authorization. To disconnect a lost device permanently, revoke access on the target machine.
:::

Revoking an individual client does not change the primary WebUI password or disrupt other paired clients.

## <DocIcon name="refresh" /> Connection Troubleshooting

| Symptom | Root Cause | Solution |
| --- | --- | --- |
| Registry endpoint redirects 302 to `/error` | Host offline, lease expired, or Tunnel down | Verify Remote Access status on target machine |
| Infinite connection spinner | WebSocket traffic blocked | Switch network; verify outbound port 7844 is open |
| `UNAUTHORIZED` error | Client authorization was revoked | Re-pair with target host |
| Frequent disconnections | Heartbeat timeout | Check target host resource load and network stability |
| Disconnects when app backgrounds | System restricted background network | Exempt app from background data restrictions |

Quick Tunnels renew leases every 60 seconds. Following an abnormal server exit, leases expire in 180 seconds. When the host reconnects, it receives a new `*.trycloudflare.com` domain, but the fixed entry URL (`<registry>/d/<device_id>/`) remains constant.

## <DocIcon name="refresh" /> Switching Between Local and Remote

- Switching to Remote: Leaves the local Runtime active while routing UI management to the remote target.
- Switching to Local: Re-subscribes UI components to the local loopback daemon.
- Local PRoot instances and overlay panels are unaffected by remote gateway routing.
- Remote deployment configurations do not overwrite local app preferences.

## <DocIcon name="shield" /> Security Guidelines

1. Use a strong WebUI password distinct from game account credentials.
2. Regularly prune inactive pairing tokens on the host.
3. Treat pairing QR codes as single-use secrets; avoid transmitting screenshots over public chats.
4. Quick Tunnels are designed for temporary remote access; consider Cloudflare Tunnel with Access for permanent public setups.
5. If your phone is misplaced, revoke the client token immediately on the host machine.
