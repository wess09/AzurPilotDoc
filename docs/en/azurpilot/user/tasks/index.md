---
title: Task Manual Overview
description: Command reference, category index, and reading guide for all 102 AzurPilot task routines.
updated: 2026-10-20
---

# Task Manual Overview

Every schedulable automation feature corresponds to an internal **task command identifier** (e.g. `OpsiHazard1Leveling`), displayed in the WebUI with localized user-friendly titles (e.g. "Corrosion 1 Leveling").

The interactive table below is generated from `args.json`, `zh-CN.json`, and `task.yaml` at documentation build time:

<TaskTable />

## <DocIcon name="map" /> Categories and Manuals

| Category | Task Count | Manual Reference | Description |
| --- | --- | --- | --- |
| System | 4 | [Utility Tasks](/en/azurpilot/user/tasks/tools) | Emulator lifecycle, error recovery, backups, summaries |
| Sortie | 6 | [Campaign & Events](/en/azurpilot/user/tasks/campaign) | Main campaign, urgent commissions, 3-oil low cost |
| Events | 12 | [Campaign & Events](/en/azurpilot/user/tasks/campaign) | Event stages, raid battles, War Archives |
| Event Dailies | 7 | [Campaign & Events](/en/azurpilot/user/tasks/campaign) | Daily A/B/C/D/SP stage clears |
| Dailies | 11 | [Dailies & Resources](/en/azurpilot/user/tasks/daily) | Commissions, research, dorm, Meowfficers |
| Daily Missions | 11 | [Dailies & Resources](/en/azurpilot/user/tasks/daily) | Daily challenges, hard mode, exercises, shops |
| Operation Siren | 19 | [Operation Siren](/en/azurpilot/user/tasks/opsi) | Exploration, obscure sectors, abyssal zones, intelligent scheduler |
| Island Missions | 17 | [Cruise & Island Missions](/en/azurpilot/user/tasks/island) | Farmland, ranching, restaurants, manufacturing |
| Fleet / Timing / Tools | 15 | [Utility Tasks](/en/azurpilot/user/tasks/tools) | Scanning, benchmarks, semi-automation |

Counts reflect the current baseline release across 102 task keys. Active events introduce or retire tasks dynamically.

## <DocIcon name="clipboard" /> Universal Task Schema

Every task inherits a shared scheduling schema rendered under "Scheduling Settings":

| Option | Function | Default |
| --- | --- | --- |
| Enable Task | Admits task into the scheduler queue | Disabled |
| Push Notifications | Sends push notification upon completion | Disabled |
| Next Run Time | Execution timestamp (runs immediately if past) | 2020-01-01 (Immediately due) |
| Delay After Success | Minutes delayed upon success | Task-defined |
| Delay After Failure | Minutes delayed upon failure | 120 minutes |
| Server Reset Time | Daily synchronization baseline | 00:00 |
| Sensitive Task | Halts worker process upon error instead of rebooting | Enabled on select Operation Siren tasks |

Beyond scheduling properties, tasks provide specialized parameter groups. Manuals focus on parameters that directly affect execution behavior; other settings may remain at defaults.

## <DocIcon name="eye" /> Reading Task Documentation

Each task section covers:

1. **Purpose**: Specific UI actions performed and expected yields.
2. **Prerequisites**: Required account levels, fleet unlocks, and oil costs.
3. **Key Options**: Primary selection filters and acceleration flags.
4. **Recommended Values**: Tested baseline configurations.
5. **Verification**: In-game indicators and log signatures confirming success.
6. **Known Limitations**: Version boundaries and unsupported servers.

## <DocIcon name="lightbulb" /> Conservative Setup Recommendations

For new installations or freshly leveled accounts, begin by enabling low-risk daily tasks only:

```text
Restart           # Reboots emulator daily to flush memory
Reward            # One-click harvest of ready materials
Commission        # Automated commission dispatches
Research          # Scientific research queue
Dorm              # Dormitory snack restocking
Daily             # Standard daily challenges
```

Run these tasks for several days to confirm stability before configuring resource-intensive campaign sorties and Operation Siren.
