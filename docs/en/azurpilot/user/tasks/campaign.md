---
title: Campaign & Events
description: Setup and parameters for main campaign, urgent commissions, 3-oil low-cost farming, events, raids, and War Archives.
updated: 2026-10-20
---

# Campaign & Events

Sortie tasks consume oil and exhibit wide variance in returns. Before enabling, define three core requirements: **target stage, stop conditions, and fleet composition**.

## <DocIcon name="clipboard" /> Shared Parameter Structure

Sortie tasks share three primary parameter groups:

| Group | Key Options | Purpose |
| --- | --- | --- |
| `Campaign` | `Name`, `Mode`, `UseAutoSearch`, `Use2xBook`, `AmbushEvade` | Stage selection, difficulty, auto-search, double books, ambush evasion |
| `StopCondition` | `OilLimit`, `CoinLimit`, `RunCount`, `MapAchievement` | Stopping conditions |
| `Fleet` | `Fleet1`, `Fleet1Formation`, `FleetOrder` | Fleet indexing and battle formations |

Stop condition semantics: Sorties halt when remaining oil drops below `max(OilLimitHardFloor, OilLimit)`. The hard floor defaults to 500 oil to preserve reserves for daily routines.

::: tip Clear Maps Manually on First Attempt
Clear new stages and event maps manually once to unlock auto-search. The engine's pathfinding relies on map layouts; novel mechanics (teleport portals, switches, special boss mechanics) often require manual first clears.
:::

## <DocIcon name="target" /> Main Campaign 1 / 2 / 3

Three independent main campaign slots allow configuring different stages, fleets, and stopping rules:

| Attribute | Details |
| --- | --- |
| Purpose | Leveling, equipment blueprint farming, coins, ship experience |
| Prerequisites | Stage unlocked in-game; requires 4 available fleet formations (can bypass via skip check) |
| Key Options | `Campaign.Name` (e.g. `12-4`), `Mode=normal`, `UseAutoSearch=true` |
| Recommended | 12-4 Leveling: `UseAutoSearch=true`, `AmbushEvade=true`, `StopCondition.OilLimit=1000` |
| Verification | Log records enter stage → auto-search → battle victory → retreat; coins/exp increase |
| Troubleshooting | If stalled at "Searching for enemies", enable `UseClearMode` or clear manually once |

`DefeatWithdraw` governs response to combat defeat: `withdraw_stop` (retreat and stop), `switch_fleet` (switch fleet and continue), `withdraw_continue` (retreat and restart).

## <DocIcon name="zap" /> Urgent Commissions (`GemsFarming`)

| Attribute | Details |
| --- | --- |
| Purpose | Farms urgent commissions (gem commissions) on specific stages alongside ship leveling |
| Prerequisites | Stage unlocked; fleet complies with oil consumption targets |
| Key Options | `GemsFarming.Fleet1`, `Campaign.Name`, `StopCondition` |
| Mutual Exclusion | **Mutually exclusive with 3-oil low-cost farming**; enable only one |
| Verification | Log records commission detection and retreats; urgent commissions appear in dock |

## <DocIcon name="badge-dollar" /> Three-Oil Low-Cost Farming (`ThreeOilLowCost`)

Executes low-cost farming with 3-oil fleets, automatically rotating and retiring the flagship once it reaches level 32.

| Attribute | Details |
| --- | --- |
| Purpose | Maximizes coin and blueprint yields with minimal oil expenditure |
| Prerequisites | Valid 3-oil fleet; retirement rules configured per [One-Click Retirement](/en/guide/requirements#one-click-retirement) |
| Key Options | `Campaign.Name` (typically 1-1 or low-level stage), `StopCondition.RunCount` |
| Mutual Exclusion | Mutually exclusive with urgent commission farming; requires correct retirement filters |
| Verification | Oil drains slowly; retirement history lists retired level 32 flagships |

## <DocIcon name="shield" /> 1-1 Ambush Farming (`Ambush11`)

Repeatedly triggers ambush battles on stage 1-1 without attacking the boss to gather coins and trigger emergency commissions.

::: warning Experimental Feature
Marked as work-in-progress. Returns depend on ambush RNG and mechanics may shift across updates. Do not rely on it as a primary progression routine.
:::

## <DocIcon name="star" /> Event Stages 1 / 2 / 3

| Attribute | Details |
| --- | --- |
| Purpose | Farms event stages for event points (PT), event gear, and limited drops |
| Prerequisites | Event is currently active in-game; normal mode stages cleared |
| Key Options | `Campaign.Event`, `Campaign.Name`, `StopCondition` (PT target or run count) |
| Recommended | Set `RunCount=1` initially to verify stage entry, then expand run limits |
| Verification | Event PT increments; logs confirm stage title matches active event |
| Caveat | Raid events use the dedicated `Raid` task; do not run them via event campaign slots |

Three slots allow concurrent scheduling across distinct stages (e.g. Stage 1 farms PT, Stage 2 levels ships, Stage 3 farms blueprints).

## <DocIcon name="megaphone" /> Raid Battles (`Raid` / `RaidScuttle`)

| Task | Purpose | Notes |
| --- | --- | --- |
| `Raid` | Standard raid battle clears | Requires raid unlock; boss health is shared globally |
| `RaidScuttle` | Intentional raid scuttle (fleet wipe) | Fast-tracks clears and affinity gain through rapid defeat |

Raid scuttling is a legitimate strategy rather than failure: sacrificing low-cost fleets concludes battles rapidly. Ensure you understand event scoring mechanics before enabling.

## <DocIcon name="sparkles" /> Event-Specific Tasks

| Task | Event Context | Description |
| --- | --- | --- |
| `Hospital` | Letters from the Deep Valley | Unique event workflow with non-standard stages |
| `Coalition` | Night Duty Hospital | Coalition raid mechanics |
| `CoalitionScuttle` | Coalition Scuttling | Intentional defeat to cycle affinity rapidly |
| `MaritimeEscort` | Maritime Escort | Escort mission logic with unique step timing |
| `EventShop` | Event Shop | Automatically redeems items by priority |
| `CoalitionSp` | Haunted Chronicles SP | Specialized SP stage clear for specific events |

These tasks operate exclusively while their corresponding events are active in-game.

## <DocIcon name="file" /> War Archives (`WarArchives`)

| Attribute | Details |
| --- | --- |
| Purpose | Spends daily War Archives attempts to farm archived drops |
| Prerequisites | Target War Archive record unlocked |
| Key Options | `WarArchives.DailyRunCount`, `AutoClear`, `AutoClearTarget` |
| Limitation | Map clearing logic is unmaintained; clear maps manually once to unlock auto-search |
| Verification | Daily entry count decrements; loot registers in statistics |

## <DocIcon name="calendar" /> Daily Event Clears (A / B / C / D / SP)

| Task | Target | Function |
| --- | --- | --- |
| `EventA` ~ `EventD` | Daily A/B/C/D stages | Runs single daily clear for first-clear rewards |
| `EventSp` | Daily SP stage | Requires clearing prerequisites; high oil cost |
| `RaidDaily` | Daily raid attempts | Consumes daily raid attempt tokens |

Ensure `Scheduler.ServerUpdate` is configured accurately: daily attempts reset at server midnight.

## <DocIcon name="hand" /> Configuring Stopping Conditions

| Objective | Configuration |
| --- | --- |
| Run exact number of times | `RunCount = N` |
| Stop when oil falls below threshold | `OilLimit = X` (combined with 500 oil floor) |
| Stop when coins reach cap | `CoinLimit = Y` |
| Farm until 100% map clear | `MapAchievement = 100_percent_clear` |
| Farm until 3-star map achievement | `MapAchievement = map_3_stars` |
| Farm until flagship reaches level | `ReachLevel = L` |
| Stop when acquiring new ship drop | `GetNewShip = true` |

Toggling `StageIncrease` advances to subsequent stages automatically upon meeting clearing criteria.
