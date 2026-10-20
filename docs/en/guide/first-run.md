---
title: First Run
description: "Go from opening the WebUI to running your first automated task: create instances, pair emulators, and verify results."
updated: 2026-10-20
---

# First Run

This guide assumes you have completed [Installation](/en/guide/install), installed the game inside your emulator, and configured [In-Game Settings](/en/guide/requirements#in-game-settings).

## <DocIcon name="monitor" /> 1. Open WebUI

The desktop launcher opens the interface automatically. For source or Docker deployments, navigate to:

```text
http://127.0.0.1:25548
```

If prompted for credentials on first load, either a `Password` was configured in `deploy.yaml` or the server bound to a non-loopback IP, prompting automatic password generation. Inspect the generated password in `password.txt` at the project root.

::: danger Never Expose Unprotected Dashboards to WAN
The WebUI can start/stop tasks, stream screenshots, and modify settings. Binding to `0.0.0.0` without credentials exposes your game account to the open network. Set a strong password in [Deployment Settings](#deployment-settings) before opening ports.
:::

## <DocIcon name="circle-plus" /> 2. Create an Instance

An "instance" couples an isolated configuration file with a dedicated scheduler worker process. The default instance is named `ap`; additional instances such as `ap-2` and `ap-3` enable multi-client automation.

<Steps>
<Step title="Create configuration">

Click New in the instance list, choosing a blank template or cloning an existing instance. Cloning copies all task states and scheduled timestamps.

</Step>
<Step title="Confirm instance path">

Settings are saved to `config/<instance>.json`. Instance names permit only alphanumeric characters, underscores, and hyphens. Rename instances via WebUI export/import rather than renaming files manually.

</Step>
<Step title="Select language and server">

WebUI language and game server package names are distinct settings. The former controls interface localization (`zh-CN` / `en-US` / `ja-JP` / `zh-TW`), while the latter is selected under "System Settings → Emulator Settings → Game Server".

</Step>
</Steps>

## <DocIcon name="smartphone" /> 3. Connect Emulator

Navigate to "System → Emulator Settings":

| Field | Value |
| --- | --- |
| Emulator Serial | Emulator ADB address, e.g. `127.0.0.1:16384`; use `auto` if unsure |
| Game Server | Usually `auto`; manually select package name when using multiple clients |
| In-game Server | Used for maintenance detection; select "Do not use detection" if unsure |
| Screenshot Method | Default to "Auto select fastest" |
| Control Method | Recommended: `MaaTouch` |

Save and return to the Overview tab, then click **Screenshot Test**. If the game screen displays properly, ADB connectivity, screenshot backend, and resolution are correctly configured.

::: tip Limitations of `auto` Detection
When running multiple emulators simultaneously, `auto` cannot determine which window to control. You must enter the serial manually. Locate the serial by executing `adb devices` inside the emulator directory.
:::

### Black Screen or Screenshot Timeouts

Follow these troubleshooting checks in order:

1. <DocIcon name="monitor" /> Confirm the emulator is rendering the active game screen rather than the launcher desktop.
2. <DocIcon name="smartphone" /> Run `adb devices` and ensure the device state reports `device` rather than `offline` or `unauthorized`.
3. <DocIcon name="eye" /> Switch screenshot methods (e.g. from `DroidCast_raw` to `ADB_nc`).
4. <DocIcon name="settings" /> Verify the emulator resolution is strictly 1280×720. Tablet modes or custom DPI values cause scaling mismatches.

## <DocIcon name="zap" /> 4. Run Your First Task

Do not start with Operation Siren. Begin with a short, low-risk task to validate the entire execution loop:

<Steps>
<Step title="Enable Research or Commission">

Locate "Research" in the task list and toggle "Enable Task". Both tasks consume zero oil and carry minimal failure penalties.

</Step>
<Step title="Set next run time to now">

A task's `Scheduler.NextRun` defaults to 2020-01-01 (immediately due). If it displays a future timestamp after toggling, clear the field to trigger immediate execution.

</Step>
<Step title="Start the scheduler">

Return to Overview and click Start. The log stream should output: Load configuration → Connect device → Screenshot → Navigate to Research → Claim/Start project → Schedule next run.

</Step>
<Step title="Verify outcome">

Verify the in-game research queue updated, the WebUI displays the active task, the log stream concludes with "Task finished", and the next run time updates to several hours later.

</Step>
</Steps>

### Log Stalled at "Connecting to device"

The worker process failed to acquire an ADB handle. Confirm no third-party software (such as another automation script or Android Studio) is monopolizing ADB, and verify the serial. If needed, enable "Restart ADB when no device detected" in Emulator Settings.

## <DocIcon name="settings" /> 5. Deployment Settings

`config/deploy.yaml` controls backend process behavior. Modifying these options requires restarting the application:

| Field | Default | Description |
| --- | --- | --- |
| `WebuiHost` | `0.0.0.0` | Listen interface; use `127.0.0.1` for localhost only |
| `WebuiPort` | `25548` | WebUI HTTP port |
| `WebuiPassword` | Empty | Authentication key; auto-generated if empty and bound to public IPs |
| `Language` | `zh-CN` | WebUI display language |
| `Theme` | `default` | Light / dark theme |
| `OcrServerPort` | `22268` | Standalone OCR server port |

## <DocIcon name="rocket" /> 6. What's Next

- <DocIcon name="map" /> Optimize execution schedules: [Scheduler & Task Orchestration](/en/azurpilot/user/scheduler)
- <DocIcon name="map" /> Configure parallel instances: [Multi-Instance & Config Management](/en/azurpilot/user/multi-instance)
- <DocIcon name="map" /> Monitor via smartphone: [Remote Access & Device Pairing](/en/azurpilot/user/remote-access)
- <DocIcon name="wrench" /> Resolve failures: [Troubleshooting Core Program](/en/troubleshooting/azurpilot)
