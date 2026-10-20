---
title: Privilege Activation
description: Built-in ADB wireless pairing, Root, and external Shizuku setup, network reconnection, and security boundaries.
updated: 2026-10-20
---

# Privilege Activation

Creating virtual displays, capturing frame buffers, and injecting touch events require shell-level privileges. The Android host supports three activation paths, with **built-in ADB recommended** as it requires no PC, no Root, and no external manager app.

| Method | Prerequisites | Post-Reboot Behavior | Security Model |
| --- | --- | --- | --- |
| Built-in ADB | Android 11+ (Android 9–10 requires initial `adb tcpip 5555`) | Requires re-pairing | Loopback only, RSA authenticated |
| Root | Rooted device (Magisk, KernelSU) | Automatically available | Root-level permissions |
| External Shizuku | Shizuku / Sui installed and running | Managed by external app | Reuses external token |

## <DocIcon name="smartphone" /> Built-in ADB Pairing

The internal implementation ports [shizuku-m](https://github.com/wess09/shizuku-m) (Apache-2.0), incorporating wireless pairing, offline reconnection, and encrypted key management.

### <DocIcon name="refresh" /> Android 11 and Higher

<Steps>
<Step title="Enable Developer Options">

Settings → About Phone → Tap "Build Number" 7 times. Then navigate to System → Developer Options and enable **Wireless debugging**.

</Step>
<Step title="Open pairing wizard">

In-app: Settings → Operation & Security → Built-in Shizuku → Start Pairing.

</Step>
<Step title="Retrieve pairing code">

In Android's "Pair device with pairing code" view, note the 6-digit code and pairing port.

- Notifications available: Enter the pairing code directly in the system notification prompt.
- Split-screen mode: Place the system pairing screen and app side by side, expand "Manual Pairing Entry", and submit port and code.

</Step>
<Step title="Confirm debugging authorization">

When the system displays "Allow USB debugging?", check "Always allow from this computer" and confirm. Missing this step causes pairing to succeed while service startup fails.

</Step>
<Step title="Await activation">

Once verified, the setup screen marks status Ready. The pairing code is discarded immediately.

</Step>
</Steps>

### <DocIcon name="settings" /> Android 9–10

Android 9 and 10 lack the wireless pairing UI. You must switch adbd to TCP mode once via a computer:

```bash
adb devices            # Confirm device connection
adb tcpip 5555         # Instruct adbd to listen on port 5555
```

Then connect to `127.0.0.1:5555` in the app. The USB cable can be detached, but this command must be re-run following device reboots.

### <DocIcon name="cloud" /> Reconnection & Offline Behavior

Once activated, connection persists throughout the **current boot session**, surviving network switches and airplane mode. Re-activation is required if:

- The device restarts
- USB debugging authorizations are revoked
- Developer Options or Wireless Debugging is disabled
- Application data is cleared

::: danger Port 5555 Security Caveat
When adbd listens on 5555, it may bind to LAN interfaces. While adbd enforces RSA key authentication and the app only connects to `127.0.0.1`, avoid leaving wireless debugging enabled indefinitely on public Wi-Fi networks.
:::

### <DocIcon name="key" /> Key Storage Security

RSA private keys are encrypted via AES-GCM using keys stored in the Android Keystore and saved to private preferences, excluded from cloud backups and device migration. Pairing codes are held in memory only.

## <DocIcon name="lock-keyhole" /> Root Activation

Rooted devices can utilize the Root backend:

1. Select Root on the activation view.
2. Grant Superuser access in your root manager (Magisk, KernelSU, APatch).
3. The app spawns privileged services via `app_process`, validating root/shell UIDs and single-use tokens upon Binder callback.

The Root and ADB pipelines are isolated: the privileged context exists solely within the spawned worker process, never leaking into standard application processes.

::: warning Root vs. ADB
Root represents a distinct process spawning pathway rather than an "upgraded ADB". Switching to Root may bypass specific ADB-level issues, but fundamental game compatibility requirements remain identical.
:::

## <DocIcon name="plug" /> External Shizuku

For setups with an existing Shizuku / Sui installation:

1. Select External Service on the activation view.
2. Ensure Shizuku is running and authorization is granted to AzurPilot.
3. The app reuses the external user service channel.

If built-in pairing credentials exist simultaneously, the `SHIZUKU` backend **prioritizes built-in connections**, falling back to external managers only if internal credentials are absent.

## <DocIcon name="compass" /> Backend Selection Logic

```text
Backend Selection
├── Built-in ADB activated → Use built-in
├── External Shizuku authorized → Use external
└── Root available → Use Root
```

Priority transitions are governed by the `PermissionManager` state machine, safely discarding dead Binder connections.

## <DocIcon name="circle-check" /> Activation Verification

| Check | Expected Result |
| --- | --- |
| Activation Screen | Status reports Ready |
| Automation View | Successfully initializes Virtual Display |
| Task Launch | Screen capture and touch injection advance workflows |
| Log Output | Free from `Binder` timeouts or `SecurityException` errors |

## <DocIcon name="wrench" /> Troubleshooting Activation

| Symptom | Root Cause | Solution |
| --- | --- | --- |
| No response after entering code | USB debugging dialog was not confirmed | Re-pair and confirm prompt |
| "Pairing succeeded but service not running" | Port 5555 closed or stopped by OS | Toggle Wireless Debugging; re-run `adb tcpip 5555` on Android 9–10 |
| Binder timeout | Privileged process killed by battery saver | Disable battery optimization; retry |
| Instant crash on MediaTek hardware | `LoadedApk.makeApplication` injection | App uses Context-only initialization; submit log if failure persists |
| Activation lost after reboot | Expected operating system behavior | Re-pair using wireless debugging |
| External Shizuku unreachable | Shizuku stopped or permission revoked | Open Shizuku manager and re-authorize |

Detailed startup traces can be inspected in private storage at:

```text
debug/embedded_adb_launch.log
```

## <DocIcon name="shield" /> Security Architecture

| Vector | Design Safeguard |
| --- | --- |
| Service Exposure | Built-in provider publishes no generic Shizuku interface; authorizes no other apps |
| Callback Validation | Rejects any connection not matching root/shell UID with matching single-use token |
| Process Termination | Termination of parent app immediately destroys privileged child processes |
| Local Binding | Client connects strictly to loopback interfaces |
| Credentials | Pairing codes are never persisted or logged |
