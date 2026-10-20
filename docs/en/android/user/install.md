---
title: Android Installation & Architecture
description: Select matching APK architectures and package types, download from GitHub or CNB, and resolve signature conflicts.
updated: 2026-10-20
---

# Android Installation & Architecture

Installing the Android host requires choosing the correct **CPU architecture** and **package type (Full vs. Thin)**. Selecting incorrectly causes runtime boot failures or unnecessary 1 GB downloads.

## <DocIcon name="clipboard" /> 1. Confirm Architecture

| Architecture | Typical Devices | Notes |
| --- | --- | --- |
| `arm64-v8a` | Nearly all modern phones and tablets | Primary choice |
| `x86_64` | Android emulators, select x86 tablets | Use for PC emulators like MuMu |

How to verify:

- Settings → About Phone → Processor (commonly lists `arm64-v8a`).
- Install a device hardware inspector application to inspect the `ABI` field.
- For emulators, confirm the instance ABI is configured as x86_64.

::: danger 32-Bit Devices Unsupported
The Linux Runtime relies on 64-bit binaries. Devices running `armeabi-v7a` cannot execute the environment; no fallback exists.
:::

## <DocIcon name="package" /> 2. Choose Package Type

| Package | Approximate Size | Initial Setup | Use Case |
| --- | --- | --- | --- |
| Full APK | Large (bundled rootfs) | Unpacks in 1–3 min, **no internet needed** | First-time installation |
| Thin APK | Small (no rootfs) | Downloads ~1 GB Runtime | Updating host app on existing setups |

Choose the Full APK for initial installation. The Thin APK is designed for subsequent app updates: installing it over an existing installation preserves the rootfs, configuration files, and instances.

## <DocIcon name="download" /> 3. Download Channels

| Channel | URL | Target Network |
| --- | --- | --- |
| GitHub Releases | `github.com/wess09/AzurPilot-for-Android/releases/latest` | International networks |
| CNB Releases | `cnb.cool/azurpilot/AzurPilot-for-Android/-/releases` | Mainland China networks (default) |

Both channels host identical binaries with matching SHA-256 hashes. You can also switch download mirrors inside app settings:

| Mirror | Description |
| --- | --- |
| `cnb` | Direct regional connection (default) |
| `direct` | Direct GitHub access |
| Built-in Mirrors | Five ghproxy mirror endpoints |
| Custom | User-defined ghproxy endpoint; invalid inputs fall back to direct |

::: tip Incompatible Mirror Endpoints
The endpoint `gh-proxy.net` presents Cloudflare challenges to client downloaders and **cannot be used for downloads**. Reliable mirrors include `gh.ddlc.top` and `ghfast.top`.
:::

## <DocIcon name="smartphone" /> 4. Installation Steps

<Steps>
<Step title="Allow unknown app installations">

Android prompts that unknown apps are blocked. Enable "Install unknown apps" for your browser or file manager in system settings.

</Step>
<Step title="Resolve signature conflicts">

If an existing installation uses a different signing key (such as a local debug build), installing over it yields `INSTALL_FAILED_UPDATE_INCOMPATIBLE`. You must uninstall the previous version—**uninstallation wipes private data including the Runtime and configurations**, so export your settings first.

</Step>
<Step title="Install and open application">

Install the APK and launch the app. The initial run guides permission setup before entering Runtime provisioning.

</Step>
<Step title="Wait for Runtime deployment">

Full APK: Unpacks locally in 1–3 minutes.
Thin APK: Downloads ~1 GB before unpacking. Wi-Fi connection recommended.

</Step>
</Steps>

## <DocIcon name="circle-check" /> 5. Verification

| Check | Expected State |
| --- | --- |
| Home view Runtime status | `Ready` |
| Storage usage | Increases by ~1.5–2.5 GB |
| Automation view | Displays video stream (after activating privileges) |
| Console | Embedded WebUI opens cleanly |

If status reports `Failed`, tap error details to view the `reason`:

| State Code | Cause | Remediation |
| --- | --- | --- |
| `NotBundled` | Thin APK used but release lacks architecture | Switch to Full APK |
| `LowDisk` | Free storage is below 2 GB | Free storage space |
| Stalled at `Downloading` | Mirror unreachable | Switch mirror source in settings |
| `Failed` | Hash mismatch or extraction error | Retry; re-download if issue persists |

## <DocIcon name="circle-off" /> 6. Uninstallation and Data

Uninstalling the app permanently purges:

- Linux Runtime (`rootfs` directory)
- All instance settings and SQLite databases
- Logs and screenshots

No cloud backups are retained. Export configurations in-app before uninstalling.

## <DocIcon name="message" /> Common Questions

| Symptom | Cause |
| --- | --- |
| "Parse error" on installation | Corrupted APK download or mismatched architecture |
| Immediate crash on launch | Mismatched architecture (e.g. x86 APK on ARM phone) |
| Runtime stuck on `Downloading` | Mirror challenge page or proxy interference |
| First WebUI load takes over 90 seconds | Expected: bytecode compilation occurs on first launch |
| Settings wiped after update | Signature mismatch forced reinstallation |
