---
title: Console, Statistics, Floating Window & Screensaver
description: Android console, native statistics, resource management, floating overlay, screensaver, widgets, keep-alive and log management.
updated: 2026-11-12
---

# Console, Statistics, Floating Window & Screensaver

The Android host decouples management from display: the Console configures automation, the Floating Overlay allows quick adjustments, and the Screensaver conserves battery while preventing display burn-in.

## <DocIcon name="map" /> Core Views

![Android Settings View (Dark Theme)](/img/android-settings-dark.jpg)

<Figure caption="Settings view: Appearance, download mirrors, privileges, keep-alive, and screensaver options." />

| View | Purpose |
| --- | --- |
| Home | Runtime health, provisioning progress, start/stop toggle, remote pairing button |
| Automation | Virtual display stream, active instance switcher, task start/stop controls |
| Console | Embedded WebUI (identical frontend to desktop edition) |
| Statistics | Eight native reports, resource management and CSV export |
| Logs | Three-way logs covering Host, Runtime, and Privileged services |
| Settings | Appearance, download mirrors, privileges, keep-alive, screensaver, about info |

The remote pairing shortcut in the top right of the Home view connects directly to remote instances without requiring local Runtime deployment.

## Native statistics and resource management

From **Overview** in the AzurPilot page, open **Statistics**. Reports are scoped to the currently selected Runtime instance; a category may remain empty until its corresponding task has run.

### Eight report categories

| Category | Contents |
| --- | --- |
| Resource trends | Resource totals and changes over time |
| Operation Siren trends | Trends for Operation Siren activity |
| Operation Siren summary | Operation Siren task and resource summary |
| Commission rewards | Rewards collected from commissions |
| Ship EXP | Ship experience gains |
| Operation Siren drops | Items dropped in Operation Siren; filterable by task |
| Research drops | Research rewards, grouped by series or chips and coins |
| Inventory | Warehouse item statistics; can launch an explicit inventory scan |

Reports provide metric cards, trend charts, tables and notes. Trend ranges include 1, 7, 30, 90 and 365 days; Operation Siren reports can be viewed by month, research can switch between series and chips/coins, and loot can be filtered by task. **Recount** re-aggregates locally recorded claim data; it does not operate the game again. Reports can be exported as CSV.

### Resource management

Choose a 1-, 7- or 30-day range, or a custom date range up to 366 days. Filter by resource and task. The page provides an inventory overview, a resource-flow diagram and transaction details. Inventory separates current stock, interval income, expenses and adjustments; adjustments are listed separately rather than counted as task income or expenses. Each transaction identifies its evidence as confirmed, observed, recognition or adjustment. CSV export is available.

Oil control can be enabled independently with a target from 1,000 to 24,999. Current stock comes from the latest valid inventory snapshot; if no snapshot exists, the value remains blank rather than being treated as zero.

The **Run inventory scan** action in the Inventory category starts the explicit `StorageStatistics` task. Refreshing the report only reads the latest completed snapshot; it does not start another scan.

::: warning Release status
The native statistics module entered Android `main` in commit `7b468fb7`. As of 2026-11-12, the latest published rolling APK is still `1.3.196` (2026-11-08), which predates that commit. Do not assume these screens are present in APK `1.3.196`.
:::

## <DocIcon name="monitor" /> Global Floating Overlay

Powered by FloatingX, the global overlay operates above all applications and launcher screens:

| Action | Function |
| --- | --- |
| Tap Icon | Expands / collapses control panel |
| Start / Stop | Toggles task execution on active instance |
| Queue | Views scheduled tasks and active operation |
| Switch Instance | Changes target instance worker |
| Log Feed | Streams recent execution output in real time |

The overlay runs in an isolated Window independent of Activity `Configuration` or `ViewModelStore`. It receives theme and state updates via `AppThemeState` and `OverlayController`.

::: tip Overlay Missing
Confirm the "Display over other apps" permission is granted. Certain vendor skins require an additional "Background popup windows" permission.
:::

## <DocIcon name="eye" /> Screensaver (Burn-In Prevention)

Long automated sessions on OLED screens risk permanent display burn-in. The screensaver mitigates this:

| Attribute | Behavior |
| --- | --- |
| Background | Pure black with minimized display brightness |
| Activation | Manual toggle, or automatic activation when tasks start |
| Pixel Drift | Shifts elements 16dp vertically every 10 seconds after 30 seconds of inactivity |
| Dismissal | Drag the unlock slider fully to the right |

Pixel drift operates independently of the virtual display, ensuring background game execution is undisturbed.

## <DocIcon name="box" /> Home Screen Widgets

Glance and RemoteViews widgets display execution status and provide quick toggle controls from the launcher.

To prevent rendering errors across customized vendor ROMs that misinterpret `?attr` vector tints, widgets utilize explicit drawable assets rather than dynamic theme attributes.

## <DocIcon name="zap" /> Process Keep-Alive

Aggressive system power managers are the primary cause of background task termination. The host implements three defense tiers:

1. **Foreground Service**: Keeps process priorities elevated while Runtime or virtual displays are active, backed by a persistent notification.
2. **Multi-Path Keep-Alive**: `KeepAliveManager` dynamically adjusts execution pathways according to settings toggles.
3. **Battery Optimization Exemption**: Requires manual user approval.

Recommended system configuration:

- Settings → Apps → AzurPilot → Battery → Unrestricted.
- Whitelist the app under device Autostart and Background Execution settings.
- Disable aggressive battery saver modes during automation.

::: warning Keep-Alive Limits
Under extreme RAM starvation or aggressive manufacturer battery management, the OS may terminate background processes regardless of keep-alive hooks. Export logs to determine whether termination was caused by a crash or an OS signal.
:::

## <DocIcon name="scroll" /> Log Management

Three distinct log outputs are archived separately:

| Log Type | Storage Location | Content |
| --- | --- | --- |
| Host Log | Private App Storage | Compose UI, gateway, provisioning, update logs |
| Runtime Log | `proot/session.log` + upstream `log/` | Task scheduler and game logic output |
| Privileged Log | Isolated timeline | ADB startup, Binder handshake, virtual display |

Features:

- Automatically saves display frame snapshots upon task errors.
- Enforces a 7-day retention rotation policy.
- Single-tap export to zip archives.

::: danger Verify Credentials Before Sharing Archives
Ensure logs do not contain `config/deploy.yaml`, `password.txt`, or `remote-access.json`. These credential files reside under the Runtime's `config/` directory and are excluded from standard log exports.
:::

## Submit a device compatibility report

Go to **Settings → Submit your device**, review locally collected hardware and OS details, explicitly select **Working** or **Not working**, and consent to GitHub publication before submitting. A comment is added to [Android device support issue #1](https://github.com/wess09/AzurPilot-for-Android/issues/1); duplicates link to the existing comment. A result is never preselected.

The report does not collect IMEI, serial numbers, Android ID, MAC addresses, logs or screenshots; review the displayed information yourself. The release build needs valid reporting credentials and an available backend; local builds without credentials may disable submissions. See the [reporting protocol](https://github.com/wess09/AzurPilot-for-Android/blob/main/doc/device-reporting.md) and [Runtime internals](/en/android/developer/runtime).


## <DocIcon name="settings" /> Settings Reference

| Category | Options |
| --- | --- |
| Appearance | Material / Miuix style, dark/light themes, dynamic wallpaper coloring |
| Downloads | CNB / direct GitHub / mirror selection / custom endpoint prefixes |
| Operation & Security | Built-in Shizuku, Root, external services, activation status |
| Keep-Alive | Foreground service, battery optimization prompts |
| Screensaver | Auto-engage, brightness levels, drift frequency |
| OCR | Hardware acceleration backend, thread concurrency, CPU fallback |
| About | Version strings, commit hashes, open-source licenses |

## <DocIcon name="message" /> Common Troubleshooting

| Issue | Root Cause |
| --- | --- |
| Overlay taps do nothing | Overlay permission revoked or restricted by battery saver |
| Screensaver does not drift | System animation scales set to 0 in Developer Options |
| Widget displays stale status | System launcher cached widget; remove and re-add widget |
| Tasks stop when screen turns off | Battery optimization not set to Unrestricted |
| Exported log archive is empty | Logs were pruned by 7-day rotation, or storage permissions are missing |
