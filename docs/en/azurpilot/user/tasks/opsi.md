---
title: Operation Siren
description: Complete guide to 16 schedulable tasks, resources, intelligent scheduling, monthly cycles and unlock requirements.
updated: 2026-11-08
---

# Operation Siren

::: danger Clear the main story first
**Clear the in-game Operation Siren main story before using any automation on this page.** Unlocking the mode, entering it once or clearing only some sectors is not enough. This is a gameplay prerequisite; AzurPilot cannot clear the story for you and does not guarantee automatic detection of account progress.
:::

## Scope

The WebUI group contains **16 independently schedulable tasks**, plus shared settings and a standalone simulator. Similar configuration groups may be sub-features rather than separate tasks.

| Type | Group | Purpose |
| --- | --- | --- |
| Shared settings | **OpsiGeneral** | AP purchases, oil limits, repairs, random events, logs and notifications |
| Standalone simulator | **OpsiSimulator** | Estimates outcomes; not scheduled and does not control the game |
| Sub-configurations | **OpsiAshAssist, OpsiSmartExplore, OpsiTarget, OpsiCheckLeveling, OpsiFleetAutoChange, OpsiSirenBug, OpsiFleet, OpsiFleetFilter** | Used by beacon, scheduling, Meowfficer and Corrosion 1 workflows |

## Before you start

1. **Clear the Operation Siren main story** and confirm normal sectors are unlocked.
2. Set resolution to **1280×720** and frame rate to **60 FPS**.
3. Enable **Reduce TB Guidance** and **Auto-submit items during auto-search**; disable **Auto-search by default in Safe Sectors**.
4. Enable story auto-play at Fastest speed. Disable standby mode, duplicate-ship prompts, fast equipment-change confirmation and result-character display.
5. Check fleets, submarine support, repair thresholds and supplies. Do not operate the game manually while a task is running.

::: warning Submarine support
Open **Operation Siren → radar → Command Module → Submarine Support** and clear **Launch submarine when X is consumed**.
:::

## Resources

| Resource | Meaning |
| --- | --- |
| AP | Naturally regenerates about 1 point per 600 seconds; natural cap is 200 |
| C | Current AP shown in-game |
| P | AP value used by intelligent scheduling; may include boxed AP when box usage is enabled |
| Y | Yellow Coins from Operation Siren sectors and tasks |
| Purple Coins | Currency from Obscure / Abyssal content, used in the Operation Siren shop |

Common reserves: **K** = Yellow Coin reserve (OperationCoinsPreserve); **R** = recovery margin after coin farming (OperationCoinsReturnThreshold; negative becomes 0); **B** = AP reserve during coin recovery (ActionPointPreserve; 0 falls back to the Meowfficer reserve); **L** = Corrosion 1 AP reserve (MinimumActionPointReserve); **M** = month-end cleanup floor. Dashboard AP totals always include AP boxes.

## The 16 schedulable tasks

| Task | Purpose and main settings |
| --- | --- |
| **OpsiDaily** | Completes daily missions and rewards; can skip Siren Research and retain mission sectors |
| **OpsiExplore** | Monthly sector exploration to 100%; route, sector order and AP reserve; requires the main story |
| **OpsiExploreCleanup** | Extra event sweep of normal sectors after 100% exploration; separate monthly checkpoint |
| **OpsiShop** | Visits allied ports to buy supplies; presets, custom list and stop-before date |
| **OpsiVoucher** | Voucher-shop exchanges; Filter priorities for archive coordinates and materials |
| **OpsiObscure** | Clears Obscure coordinates; hazard filter, force-run, full-map / radar scans and resume state |
| **OpsiAbyssal** | Clears Abyssal coordinates floor by floor; fleet filter, submarine cooldown and resume after restart |
| **OpsiStronghold** | Multi-round Siren Stronghold attacks; fleet rotation, submarine support, repairs and supplies |
| **OpsiArchive** | Processes held archive coordinates, then buys the next one from the voucher shop; see extra prerequisites below |
| **OpsiMonthBoss** | Monthly Arbiter / boss; Normal or Normal + Hard, adaptability check and fleet filter |
| **OpsiAshBeacon** | META beacon battles and assistance; OpsiAshAssist is a sub-configuration, not a separate task |
| **OpsiMeowfficerFarming** | Farms Meowfficer rewards in selected hazard sectors; AP reserve, hazard level and target sectors |
| **OpsiHazard1Leveling** | Repeated leveling in Corrosion 1; AP / Yellow Coin reserves, fleet and stop conditions |
| **OpsiScheduling** | Delegates Meowfficer, Obscure, Abyssal, Stronghold and Corrosion 1 subtasks based on AP, coins and monthly state |
| **OpsiPreventActionPointOverflow** | Temporarily runs a selected task near the AP cap; upper / lower thresholds and target task |
| **OpsiCrossMonth** | Enters before monthly reset, waits, then handles new-cycle daily missions and coordinates; default window is 10 minutes before reset |

### Extra archive prerequisites

Besides clearing the main story, **OpsiArchive** requires the relevant Simulation Battle and Siren Trial Grounds content to be completed. It processes held coordinates before buying the next one. It postpones itself while monthly exploration is running.

## Shared settings and sub-features

- **OpsiGeneral**: AP purchase count, oil limit, repair thresholds, repair packs, random map events, logs and notifications.
- **OpsiFleet / OpsiFleetFilter**: task fleets, submarine support and multi-fleet priority.
- **OpsiSirenBug**: Siren Research enablement, Resource / Enemy mode and execution fleet.
- **OpsiTarget**: Meowfficer target sectors; multi-sector lists require cycling. Invalid, duplicate or port sectors trigger a protective stop.
- **OpsiCheckLeveling / OpsiFleetAutoChange**: leveling checks and Corrosion 1 fleet rotation helpers, not independent scheduled tasks.
- **OpsiAshAssist**: META beacon assistance sub-configuration.
- **OpsiSmartExplore**: belongs to OpsiScheduling, is mutually exclusive with standalone OpsiExplore and supports only the default Yellow Coin target mode.
- **OpsiSimulator**: Monte Carlo estimates from settings and statistics; it does not execute battles.

## Intelligent scheduling

**OpsiScheduling is a decision loop, not just a timer.** It reads AP, Yellow Coins, monthly progress and subtask state:

1. Prioritizes or waits for monthly exploration if it is incomplete.
2. Checks the current month's port AP purchase state.
3. Below the AP reserve, may use AP boxes or attempt an AP purchase.
4. During month-end cleanup, delegates Stronghold, Obscure, Abyssal and Meowfficer tasks while respecting the AP floor.
5. Below the Yellow Coin target, delegates available coin-farming tasks until the recovery margin is reached.
6. Otherwise schedules leveling and resource tasks according to subtask switches and AP conditions.

::: warning Avoid competing schedulers
For a subtask managed by **OpsiScheduling**, enable it in the intelligent-scheduler page and configure its parameters on the subtask page. Do not also enable its independent Scheduler.
:::

## Recommended activation order

1. Clear the main story and finish game / fleet setup.
2. Run **OpsiDaily** alone to verify navigation and mission handling.
3. At month start, run **OpsiExplore** to 100%; use **OpsiExploreCleanup** if needed.
4. Configure shops, Obscure, Abyssal, Stronghold, month boss and Meowfficer farming.
5. Verify subtask parameters and fleet filters, then enable **OpsiScheduling**.
6. Add **OpsiPreventActionPointOverflow** and **OpsiCrossMonth** only when needed.

Do not enable everything at once. Test tasks individually, inspect logs and sector state, then hand them over to intelligent scheduling.

## Safety and troubleshooting

- **OpsiObscure, OpsiAbyssal and OpsiCrossMonth** are sensitive by default. On error, the instance stops instead of automatically restarting the game and continuing.
- Do not manually operate the game during exploration, cross-month or coordinate tasks. Do not let another tool control the same emulator.
- Corrosion 1 leveling continuously consumes AP. Observe resource usage before changing reserves, fleets or stop conditions.
- Waiting because AP is insufficient, purchases are unavailable or no coordinates can run may be expected. Do not disable safeguards just to force continuation.

| Symptom | Check |
| --- | --- |
| Cannot enter sectors / exploration stalls | Confirm the main story is cleared, then check sector unlocks, core version and recognition assets |
| Stops at low AP | Check P / C, AP boxes, L / B reserves and purchase permissions |
| Yellow Coin target is not reached | Check K + R, coin-task switches, fleets and coordinates |
| Exploration progress is not saved | Confirm the sector exited normally |
| Scheduler does not take over | Check OpsiScheduling, subtask switches and monthly exploration state |
| Archive task does not run | Check main story, Simulation Battle, Siren Trial Grounds and coordinates / vouchers |
| Instance stops after a sensitive-task error | Review logs and screenshots, verify state and recover manually |

See [Environment and compatibility](/en/guide/requirements) and [Scheduler and task orchestration](/en/azurpilot/user/scheduler).
