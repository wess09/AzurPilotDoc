---
title: Cruise & Island Missions
description: "17 island routines: season settings, 5 automated storefronts, farming, ranching, daily gathering, and pearl trade."
updated: 2026-10-20
---

# Cruise & Island Missions

Island automation (Cruise / Island Missions, task group `Island`) manages an independent simulation mode: agriculture, animal husbandry, mining, storefront management, daily commissions, and weekly milestones. It consumes zero oil but operates across distinct UI screens with independent recognition assets.

## <DocIcon name="clipboard" /> Prerequisites

- Island gameplay unlocked in-game.
- Active season matches `IslandPlan.Season`. Changing seasons introduces new storefront recipes and path coordinates.
- Touch control backend set to `minitouch`, `MaaTouch`, `uiautomator2`, or `azurpilot_android`. Generic `ADB` cannot perform drag and drop gestures.

::: tip Run Global Configuration First
`IslandPlan` is a calibration task rather than standard automation: it traverses all checked path routes across your island to **verify path coordinates are reachable**. Once finished (or if no routes are selected), it delays itself until the following day.
:::

## <DocIcon name="settings" /> Global Configuration (`IslandPlan`)

| Option | Description |
| --- | --- |
| `Season` | Current active season; determines recipes and coordinates |
| `IslandWalk.*` | Waypoint toggles for characters: airdrop, gathering nodes, pearl assembly, pearl harbor |
| `IslandWalk.*Enable` | Validates specific waypoints |

Run global configuration following seasonal updates to verify all waypoints remain reachable.

## <DocIcon name="box" /> Storefront Management (`IslandBusiness`)

Automates management across 5 storefronts: Fish Diner, Polar Drinks, Cuttlefish BBQ, Juu Snacks, and Juu Coffee.

| Option | Description |
| --- | --- |
| `BatchEnabled` | Divides storefronts into batches to reduce session duration |
| `Batch1Shops` / `Batch2Shops` | Storefront batch assignments |
| `SeasonalReplaceEnabled` / `SeasonalThreshold` | Replaces recipes based on seasonal availability |
| `IslandBusinessShop1..5` | Assigned workers (`Char1/2`) and dishes (`Product1..5`) per shop |
| `BoostReplaceFilter` | Bonus item replacement strategy |

Storefronts process dishes sequentially (1 through 8), advancing only after preceding quota requirements are fulfilled.

## <DocIcon name="sparkles" /> Agriculture & Orchards (`IslandFarm`)

Manages three agricultural zones: Farmland, Orchard, and Nursery.

| Section | Key Options | Description |
| --- | --- | --- |
| `IslandFarm` | `Positions`, `WorkerFilter`, `MinFarm`, `PlantPotatoes` | Farmland plots and assigned workers |
| `IslandOrchard` | `MinOrchard`, `IgnoreAvocado`, `PlantRubber`, `AmagiChanRubber` | Orchard crops and rubber harvesting |
| `IslandNursery` | `MinNursery`, `IgnorePineapple`, `PlantLavender` | Nursery plots and lavender crops |

`Min*` options define minimum inventory reserve floors; crops replant only when reserves dip below this threshold.

## <DocIcon name="circle-check" /> Ranching (`IslandRancher`)

Restocks feed and gathers animal products automatically. Requires unlocked ranching slots and sufficient fodder supplies.

## <DocIcon name="drive" /> Mining & Logging (`IslandMineForest`)

Automates mineral mining and lumber harvesting. Halts when tool durability is exhausted.

## <DocIcon name="wrench" /> Manufacturing (`IslandManufacture`)

| Attribute | Details |
| --- | --- |
| Purpose | Crafts intermediate and advanced materials using gathered raw resources |
| Prerequisites | Recipes unlocked with sufficient ingredients |
| Key Options | Crafting queues and target production quantities |
| Verification | Work orders appear in crafting queue; warehouse material counts increase |
| Recommendation | Pair with farming and mining tasks to ensure continuous resource flows |

## <DocIcon name="calendar" /> Daily Gathering (`IslandDailyGather`)

Dispatches daily gathering tasks through the management UI:

- Execution Windows: **03:10 AM** and **06:00 PM** local server time.
- Workflow: Selects target materials → toggles filters → assigns characters → dispatches expeditions.
- Requires non-ADB touch control backends for waypoint navigation.

## <DocIcon name="gift" /> Aerial Supply Crates (`IslandAirDrop`)

Gathers daily island air supply crates and visits friend islands to claim guest crates:

- Character navigation requires `minitouch` / `MaaTouch` / `uiautomator2` / `azurpilot_android`.
- Friend visits are bounded by friend list counts and daily attempt limits.

## <DocIcon name="package" /> Cargo Preparation (`IslandCargoPreparation`)

Handles island freight deliveries:

1. Claims completed delivery rewards.
2. Skips blacklisted cargo items (such as milk).
3. Enters order change interface and confirms default selection.
4. Loads deliverable cargo items.

## <DocIcon name="scroll" /> Daily Orders (`IslandDailyOrder`)

Navigates to daily orders via the island phone interface, identifying order tiers (Urgent / Challenge / Relaxed) to deliver or reject orders matching material rules.

::: warning Standard Tier Orders Ignored
Standard-tier orders are not processed. If all daily orders roll as Standard, the task skips execution for the day.
:::

## <DocIcon name="clipboard" /> Daily Interactions (`IslandDailyInteract`)

Executes four interaction types:

- Petting cats
- JUU express delivery
- Commercial district delivery runs
- Weekly photography assignments

Character navigation requires non-ADB touch backends.

## <DocIcon name="badge-dollar" /> Weekly Pearl Trade (`IslandPearlSell`)

Automates pearl trading on Tuesdays at **01:00 AM**: purchases weekly pearl allowances, followed by selling stored pearls.

| Option | Function |
| --- | --- |
| `BuyPrice` / `SellPrice` | Pricing thresholds |
| `BuyNextRun` / `NextPearlTradeTime` | Scheduled transaction timestamps |
| `DailyPriceRefresh` | Daily market price evaluation |

::: danger Coin Balance Floor Requirement
Purchasing pearls requires sufficient gold to buy at least 200×220 pearls. Insufficient coin reserves cause task failures. Ensure balances are adequate before Tuesday.
:::

## <DocIcon name="lightbulb" /> Recommended Activation Flow

```text
1. IslandPlan              (Validate waypoints once)
2. IslandFarm              (Agriculture, orchards, nursery)
3. IslandRancher           (Animal husbandry)
4. IslandMineForest        (Mining and logging)
5. IslandManufacture       (Material crafting)
6. IslandBusiness          (Storefront management)
7. Daily Expeditions       (Gathering, airdrops, orders, interactions)
8. Freight & Commerce      (Cargo preparation and pearl trading)
```
