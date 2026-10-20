---
title: Operation Siren
description: "19 Operation Siren tasks: Action Point mechanics, intelligent scheduler decision trees, exploration, and monthly resets."
updated: 2026-10-20
---

# Operation Siren

Operation Siren features its own resource economy (Action Points, Yellow Coins, Purple Coins), a monthly reset cycle, specialized sector types, and an **intelligent scheduler** that orchestrates subtasks automatically.

## <DocIcon name="badge-dollar" /> Resource Economy

| Resource | Symbol | Source | Constraints |
| --- | --- | --- | --- |
| Action Points | AP / `P` / `C` | Natural regen (1 AP per ~600s, 200 cap), port shops, AP boxes | Waste occurs when capped at 200 |
| Yellow Coins | `Y` | Combat drops, port missions | Currency for purchasing AP and items |
| Purple Coins | — | Obscure sectors, abyssal coordinates | Port exchange currency |

`P` represents "Total Action Points available for scheduling decisions": when AP box usage is enabled, it includes boxed reserves; when disabled, it counts active AP `C` only.

Threshold variables:

| Symbol | Property | Function |
| --- | --- | --- |
| `K` | `OpsiScheduling.OperationCoinsPreserve` | Yellow Coin reserve floor |
| `R` | `OpsiScheduling.OperationCoinsReturnThreshold` | Coin recovery margin |
| `B` | `OpsiScheduling.ActionPointPreserve` | AP reserve floor during coin recovery |
| `L` | `OpsiHazard1Leveling.MinimumActionPointReserve` | Corrosion 1 leveling AP reserve floor (defaults to 200) |
| `M` | Month-end cleanup reserve | `max(month-end reserve, 200 if cross-month task is active)` |

## <DocIcon name="brain" /> Intelligent Scheduler (`OpsiScheduling`)

The intelligent scheduler is not an isolated task—it is an automated decision loop that orchestrates five subtasks:

- Corrosion 1 Leveling
- Meowfficer Farming
- Obscure Sectors
- Abyssal Coordinates
- Siren Strongholds

Parameters for each subtask are configured on their respective settings pages; the intelligent scheduler determines execution timing and task switching.

### <DocIcon name="scale" /> Operational Modes

| Mode | Trigger Condition | Execution Behavior |
| --- | --- | --- |
| Yellow Coin Recovery | `Y < K`, or continuing prior recovery cycle | Executes coin recovery until `Y ≥ K + R`, then resumes leveling |
| Action Point Management | Coin recovery mode inactive | Manages leveling runs and AP purchases based on `P` and `L` |

### <DocIcon name="compass" /> Decision Flow

```text
Monthly exploration incomplete → Postpone until server reset
  ↓
Sample current Y / P / C values
  ↓
Purchase port AP (if unfulfilled for active month)
  ↓
P ≤ L → Attempt AP box consumption / purchase
  ↓
Month-end cleanup window → Prioritize high-yield zones
  ↓
Intelligent exploration takeover → Process exploration milestones
  ↓
Coin recovery / AP leveling routine
```

::: warning Avoid Enabling Both Intelligent Scheduler and Subtasks
Running both the intelligent scheduler and its constituent subtasks causes tasks to contend for the same map sectors. Either allow the intelligent scheduler to manage subtasks, or schedule subtasks independently.
:::

## <DocIcon name="map" /> Monthly Exploration (`OpsiExplore`)

| Attribute | Details |
| --- | --- |
| Purpose | Clears all sectors to 100% following monthly resets, unlocking ports and auto-search |
| Prerequisites | Operation Siren story campaign completed |
| Key Options | Sector progression route, `ActionPointPreserve` |
| Verification | Sector clear percentages reach 100%; logs record zone transitions |
| Guidance | Avoid manual game interactions while exploration runs |

### <DocIcon name="refresh" /> Exploration Event Sweep (`OpsiExploreCleanup`)

After sectors reach 100%, this routine enters standard sectors (avoiding safe zones), scanning radar nodes to process residual exploration milestones and clear spawned sirens.

Progress checkpoints save per sector; once completed for the month, the task idles until the next reset.

## <DocIcon name="calendar" /> Daily Tasks & Port Shops

| Task | Purpose |
| --- | --- |
| `OpsiDaily` | Daily port missions, scheduled after server resets |
| `OpsiShop` | Exchanges Yellow and Purple Coins for port shop materials |
| `OpsiVoucher` | Spends monthly reset vouchers |
| `OpsiAshBeacon` | Hosts and clears daily META Showdown beacons |
| `OpsiAshAssist` | Assists friends and guild members with META Showdown battles |

Configure shop purchase priorities inside `Filter`. Purple Coins are scarce; prioritize classified research materials.

## <DocIcon name="target" /> Obscure, Abyssal & Stronghold Sectors

| Task | Purpose | Reset Frequency |
| --- | --- | --- |
| `OpsiObscure` | Obscure coordinate sectors (purple coins and gear design plans) | Monthly |
| `OpsiAbyssal` | Abyssal coordinate sectors (UR gear lab materials) | Monthly |
| `OpsiStronghold` | Siren Strongholds (multi-phase fortress clears) | Monthly |
| `OpsiArchive` | Archived coordinate logs (costs zero AP) | Monthly |
| `OpsiMonthBoss` | Arbiter monthly boss battles | Monthly |

::: danger Sensitive Task Designations
`OpsiObscure`, `OpsiAbyssal`, and `OpsiCrossMonth` enable `Scheduler.Sensitive` by default. Unexpected errors halt the instance rather than rebooting the game, preventing lost coordinates or state corruption.
:::

`OpsiArchive` requires:

- Story campaign cleared, with simulation trials completed;
- Monthly exploration cleared, or use of the 5,000 oil Strategic Data Log device.

## <DocIcon name="circle-alert" /> Meowfficer Farming & Corrosion 1 Leveling

| Task | Function | Key Options |
| --- | --- | --- |
| `OpsiMeowfficerFarming` | Meowfficer node farming in safe sectors | `ActionPointPreserve`, fleet assignments |
| `OpsiHazard1Leveling` | Low-AP continuous ship leveling in Corrosion 1 sectors | `MinimumActionPointReserve`, leveling fleet, stop limits |

Corrosion 1 leveling provides steady, repeatable ship experience and coin generation under the intelligent scheduler. Default values suit most accounts; review AP economics before adjusting thresholds.

::: warning Corrosion 1 Configuration Caution
The task description notes: "Ensure you understand Corrosion 1 mechanics before adjusting configurations; proceed at your own risk."
:::

## <DocIcon name="refresh" /> Month-End Transition (`OpsiCrossMonth`)

Enters Operation Siren 10 minutes prior to monthly reset, idling until reset passes without exiting the game mode, and clears new daily missions, obscure sectors, and abyssal zones to acquire bonus materials.

- **Do not interact with the game** during cross-month execution.
- Sensitive task by default; halts immediately upon unexpected errors.
- Inherits parameters configured under standard daily tasks.

## <DocIcon name="circle-dollar" /> Prevent AP Overflow (`OpsiPreventActionPointOverflow`)

Initiates sector clears to consume Action Points whenever active AP reaches cap.

- Enable only when needed.
- Suitable when stockpiling commissions or idling outside Operation Siren.
- Triggers a single intelligent scheduler pass without requiring the master scheduler toggle.

## <DocIcon name="video" /> Operation Siren Monte Carlo Simulator (`OpsiSimulator`)

Evaluates continuous corrosion cycle yields using Monte Carlo statistical simulations.

- **Runs independently of core automation** as an analytical tool.
- Parameters derive from configuration and statistical records.
- Experimental Alpha feature.

## <DocIcon name="lightbulb" /> Recommended Baseline Configuration

```text
OpsiDaily           Enabled
OpsiShop            Enabled
OpsiExplore         Enabled at month start; disable once 100% is reached
OpsiScheduling      Enabled after exploration reaches 100%
OpsiHazard1Leveling Managed by intelligent scheduler
OpsiCrossMonth      Verified before month-end
```

Verify navigation mechanics via `OpsiDaily` before enabling exploration and intelligent scheduling.

For deeper architectural implementation details, read [Operation Siren Navigation](/en/azurpilot/developer/device-vision#operation-siren-navigation) and [Layering and Boundaries](/en/azurpilot/developer/architecture#layering-and-boundaries).
