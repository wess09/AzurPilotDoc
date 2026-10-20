---
title: First Launch & Android Runtime
description: Runtime provisioning state machine, initial startup latency reasons, required permissions, and first task launch.
updated: 2026-10-20
---

# First Launch & Android Runtime

Initial execution on Android proceeds in two phases: deploying the Linux Runtime to private storage, followed by launching the core AzurPilot engine within that Runtime.

## <DocIcon name="settings" /> Provisioning State Machine

| State | Meaning | Action Required |
| --- | --- | --- |
| `Checking` | Validating existing installation | Automatic transition |
| `NotInstalled` | Not deployed yet | Tap "Download Runtime" on Home screen |
| `NotBundled` | Thin APK used; release lacks matching ABI | Switch to Full APK |
| `LowDisk` | Less than 2 GB free storage | Free up disk space |
| `Downloading` | Transferring payload (compressed bytes) | Wait for download |
| `Extracting` | Unpacking payload | Wait for completion |
| `Ready` | Provisioning complete | Ready to start |
| `Failed` | Provisioning failure | Check `reason` and retry |

Provisioning requires manual initiation: even with the Full APK, you must tap "Download Runtime" to start extraction, preventing silent disk exhaustion.

### <DocIcon name="box" /> Provisioning Phases

1. If an interrupted deployment exists (`rootfs.previous`), it is restored.
2. Compares `.provisioned` markers, `BUILD_MANIFEST`, and device ABI.
3. Unpacks into `rootfs.tmp`, performing an **atomic directory rename** to `rootfs` upon completion to avoid partial corruption.
4. Preserves `config/` (SQLite and instances), `password.txt`, and `log/`.
5. Writes the new version marker and marks state `Ready`.

Downloads utilize 4 parallel connections when payloads exceed 8 MiB with HTTP `Range` support, falling back to a single stream upon network failure. Payloads are verified against SHA-256 hashes.

## <DocIcon name="clock" /> Why First WebUI Boot Takes Time

Pre-compiled `__pycache__` files are stripped from distribution images. On first launch, Python must compile all bytecode on-device, often requiring over 90 seconds. The log reports:

```text
AzurPilot WebUI not ready within 90000ms
```

This is an **expected warning**, not an error. The server becomes ready shortly afterward; subsequent boots load at standard speed.

::: tip Do Not Force-Kill the App During First Boot
Force-killing leaves stale locks and orphaned sessions. Allow initialization to finish, or tap "Stop Runtime" inside the app for graceful termination.
:::

## <DocIcon name="lock-keyhole" /> Essential App Permissions

| Permission | Purpose | Impact if Denied |
| --- | --- | --- |
| Notifications | Foreground service, pairing codes, task alerts | Cannot view pairing codes in notifications |
| Battery Optimization Exemption | Background execution survival | Process terminated when screen turns off |
| Display Over Other Apps | Global floating controller | Cannot display overlay panel |
| Install Unknown Apps | In-app APK updates | Must download and install updates manually |
| All Files Access (Optional) | Export logs to public folders | Logs export to private storage only |

Device OEM settings may include additional toggles for "Autostart", "Background Popups", and battery savers.

## <DocIcon name="lock" /> Privilege Activation

Local execution requires privileged shell access to create virtual displays, capture screens, and inject touch inputs:

| Method | Target Android Version | Configuration Path |
| --- | --- | --- |
| Built-in ADB (Recommended) | Android 11+ | Settings → Operation & Security → Built-in Shizuku |
| Root | Rooted devices | Same screen; select Root |
| External Shizuku / Sui | Existing Shizuku installation | Same screen; select External Service |

Review [Privilege Activation](/en/android/user/activation) for comprehensive setup steps.

## <DocIcon name="rocket" /> Starting Runtime

1. Verify Runtime status displays `Ready` on Home.
2. Tap "Start".
3. Wait for the status indicator to transition to running.
4. Open "Console" to access the embedded WebUI.

The embedded WebUI matches the desktop version, listening on `127.0.0.1:25548` inside the Runtime. The host's `AzurPilotGateway` serves as the exclusive subscriber to `/api/v1/ws`.

## <DocIcon name="circle-plus" /> Creating Your First Instance

<Steps>
<Step title="Create configuration">

Console → Installed Configurations → New. Name it `ap` or choose a custom identifier.

</Step>
<Step title="Select server package">

Select the package name corresponding to your game client.

</Step>
<Step title="Enforce Android backend">

The Android host strictly requires the `azurpilot_android` screenshot and control backend. Standard ADB backends cannot access the virtual display.

</Step>
<Step title="Enable a low-risk task">

Enable "Research" or "Harvest" and set the next execution time to current.

</Step>
<Step title="Start and observe">

Monitor the Automation view for live screen streaming and verify task start/finish messages in logs.

</Step>
</Steps>

## <DocIcon name="circle-check" /> Verification Checklist

| Check | Passing Standard |
| --- | --- |
| Runtime Status | Continuously running without restarts |
| Video Stream | Automation view renders the live game screen |
| Console | Instance list and task settings load successfully |
| Task Execution | Logs output task lifecycle; game state updates |
| Backgrounding | Switching apps for 5 minutes does not interrupt tasks |

## <DocIcon name="map" /> Next Steps

<ul class="ap-linklist">
<li><a href="/en/android/user/activation">Privilege Activation<span class="desc">Wireless pairing, Root, and reconnection</span></a></li>
<li><a href="/en/android/user/console">Console & Overlay Panel<span class="desc">Everyday controls and screensaver</span></a></li>
<li><a href="/en/android/user/maintenance">Maintenance & Repair<span class="desc">Hot updates, full packages, and logs</span></a></li>
</ul>
