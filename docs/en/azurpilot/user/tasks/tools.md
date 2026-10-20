---
title: Utility Tasks
description: System configuration, ship retirement, enhancement, mood management, drop logs, fleet scanning, and benchmarks.
updated: 2026-10-20
---

# Utility Tasks

Utility tasks perform diagnostic scans, performance benchmarks, semi-automated assists, and system maintenance rather than gathering game rewards. System parameters (`Alas`, `General`, `Restart`) are documented here as foundational settings.

## <DocIcon name="settings" /> System Settings (`Alas`)

### <DocIcon name="monitor" /> Emulator & Error Recovery

| Group | Key Options | Purpose |
| --- | --- | --- |
| `Emulator` | `Serial`, `PackageName`, `ScreenshotMethod`, `ControlMethod` | Device connection settings; see [Connect Emulator](/en/azurpilot/user/device) |
| `Error` | `HandleError`, `StrictRestart`, `TaskRestartLimit`, `LowPushMode` | Error handling and alert suppression |
| `Optimization` | `OcrDevice`, `ScreenshotInterval`, `TaskHoardingDuration`, `WarmupEnable` | OCR backend, capture cadence, hoarding, and warmup |
| `EmulatorManagement` | `ScheduledEmulatorRestart`, `RestartIntervalHours`, `DeepRestartAfterFailures` | Scheduled restarts and deep process cleanup |
| `Backup` | `Enable`, `KeepDays` | Automated daily backup settings |
| `DailySummary` | `Enable`, `TriggerTime` | Daily summary notification digests |
| `DropRecord` | `SaveFolder`, `RetentionDays`, category capture toggles | Screenshot and structured drop logging |

`Optimization.OcrDevice` / `OcrBackend` selects CPU or GPU inference. The Android host adds NPU options; desktop installations typically remain on automatic.

### <DocIcon name="gift" /> Drop Logging (`DropRecord`)

Saves drop screenshots and structured JSON records categorized by gameplay mode: research, commissions, sorties, Operation Siren, and Meowfficers. `RetentionDays` controls pruning schedules.

`AzurStatsID` and `API` configure community crowdsourced drop aggregation. Leave blank if not participating in statistical submission.

## <DocIcon name="pencil" /> General Settings (`General`)

### <DocIcon name="circle-off" /> Ship Retirement (`Retirement` / `OneClickRetire` / `OldRetire`)

| Option | Description |
| --- | --- |
| `Retirement.RetireMode` | Retirement workflow (One-Click Retire vs. Legacy Single Ship) |
| `OneClickRetire.KeepLimitBreak` | Preserves ships required for limit breaks |
| `OldRetire.N/R/SR/SSR` | Rarity-specific retirement rules |
| `OldRetire.RetireAmount` | Batch retirement size |

Retirement rules must align with in-game One-Click Retirement preferences to prevent filter mismatches.

::: danger Ship Retirement is Irreversible
Verify retirement rules with small test batches first. Set `RetireAmount` to 1 and verify selected ships before automating mass retirements.
:::

### <DocIcon name="zap" /> Ship Enhancement (`Enhance`)

| Option | Description |
| --- | --- |
| `ShipToEnhance` | Target ship for stat enhancement |
| `Filter` | Filter criteria for consumable fodder ships |
| `CheckPerCategory` | Validates stats category by category |
| `KeepCommonCV` | Retains common aircraft carriers for specialized tasks |

### <DocIcon name="sparkles" /> Shared Mood Management (`PublicEmotion`)

Shares fleet morale states across multiple tasks:

| Option | Description |
| --- | --- |
| `Enable` | Enables shared mood tracking |
| `Tasks` | Participating task routines |
| `FleetValue` / `FleetRecord` | Tracked morale levels and history |
| `FleetRecoveryState` / `FleetRecover` | Recovery status and sleep behaviors |
| `FleetOath` / `FleetOnsen` | Morale recovery bonuses from oaths and hot springs |

When ship morale drops below safe thresholds, tasks enter idle states to prevent affection loss from low-morale sorties.

### <DocIcon name="badge-dollar" /> Oil Thresholds & Priorities

| Option | Description |
| --- | --- |
| `OilControl.Enable` / `Target` | Automated oil clearing under Legacy Scheduling (defaults to disabled, target 24000) |
| `YukikazeTaskManager.TaskPriorityAdjustment` | Custom priority overrides (one task command per line) |

## <DocIcon name="clock" /> Execution Parameters (`RunParams`)

Controls timeout thresholds and polling intervals; standard installations should retain defaults:

| Subgroup | Key Option | Default | Description |
| --- | --- | --- | --- |
| `Watchdog` | `CheckInterval` | 30s | Task watchdog poll interval |
| `Watchdog` | `DailySummaryCheckInterval` | 1s | Daily summary evaluation interval |
| `Reboot` | `Tries` | 3 | Game restart retry limit |
| `Reboot` | `FirstTryWaitSeconds` / `SubsequentTryWaitSeconds` | 30s / 20s | Startup wait times |
| `Reboot` | `ObserveSeconds` / `ObserveInterval` | 180s / 15s | Post-boot observation window |
| `Device` | `Mumu12StopWaitTimeout` | 60s | MuMu 12 shutdown confirmation timeout |
| `UiWait` | Interface timeouts | Varies | Timeouts for island, dorm, and gacha screens |
| `Handover` | `MaintainLeadMinutes` | Varies | Advance preparation time for commissions |

Adjust these options if operating on underpowered machines where emulators require over 2 minutes to boot.

## <DocIcon name="search" /> Scanning Utilities

### Fleet Scanning (`FleetScan`)

Scans deployed fleet compositions and populates the "Fleet Information" view. Read-only; makes no modifications.

### <DocIcon name="brain" /> Cognitive Array Dock Scan (`MindCalculatorScan`)

Scans ship docks at 1280×720 on the CN server to feed the Mind Calculator:

- Preserves previous scan data until full completion;
- **Resets dock filter settings** in-game;
- Throws `MindCalculatorScanError` if recognition is uncertain, preventing corrupted partial updates.

### <DocIcon name="medal" /> Fleet Technology Scan (`FleetTechScan`)

Scans ship identities and level milestones to compile tech points for the Fleet Technology view.

### <DocIcon name="crown" /> Meowfficer Scoring (`MeowfficerScore`)

| Option | Description |
| --- | --- |
| `Source` / `Folder` | Image source (live device captures or directory of images) |
| `MaxImages` / `ScanLimit` / `ScanPasses` | Scan limits and evaluation passes |
| `DeviceShots` / `DeviceInterval` | Capture counts and intervals |
| `ReportPath` | Output report file path |

Identifies Meowfficer talents and calculates scores matching community guides without altering game states.

## <DocIcon name="hand" /> Semi-Automated Utilities

| Task | Purpose | Notes |
| --- | --- | --- |
| `Daemon` | Semi-automated clicking: you select maps, the script handles repetitive taps | Ideal for unsupported new events |
| `OpsiDaemon` | Operation Siren semi-auto: handles repairs and combat while you guide pathing | Requires supervision |
| `EventStory` | Automatically skips event story sequences | `SkipBattle` toggles skipping story combat |
| `BoxDisassemble` | Mass disassembles equipment boxes | Set limits for purple, blue, and white boxes |
| `AutoEquip` | Automated equipment assignment | Equipment strategies are experimental |
| `EmulatorManager` | Manual emulator restart entry point | Supports remote SSH command dispatch |
| `GameManager` | Game client management | **Incomplete**; do not rely on this task |

### <DocIcon name="shield" /> Uncensor Patch (`AzurLaneUncensored`)

Replaces assets according to `Repository` configurations. This modifies game client files, carrying account risks unrelated to image recognition. Evaluate risks before use.

## <DocIcon name="flask" /> Performance Benchmarks

| Task | Purpose |
| --- | --- |
| `Benchmark` | Evaluates device performance: `DeviceType`, `TestScene` |
| `OcrBenchmark` | Benchmarks OCR inference speeds to help choose CPU vs. GPU |

Close all other instances before running benchmarks to ensure accurate timing.
