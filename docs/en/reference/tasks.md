---
title: Task Command Matrix
description: Catalog of all 102 task command identifiers, menu groupings, parameter groups, and manual references.
updated: 2026-10-20
---

# Task Command Matrix

This table indexes all task keys in `args.json` (excluding Dashboard resource definitions). **Command** corresponds to the dispatch method on `alas.py` (CamelCase converted to snake_case) and the value of `Scheduler.Command`.

Total: 102 tasks. Data baseline: `https://github.com/wess09/AzurPilot` @ `7de6bb9`.

## <DocIcon name="settings" /> System (`Alas`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| System Settings | `Alas` | `Emulator` `EmulatorInfo` `Error` `DailySummary` `Optimization` `DropRecord` `Backup` `EmulatorManagement` | [tools](/en/azurpilot/user/tasks/tools) |
| General Settings | `General` | `Log` `Retirement` `OneClickRetire` `Enhance` `OldRetire` `PublicEmotion` `OilControl` `YukikazeTaskManager` | [tools](/en/azurpilot/user/tasks/tools) |
| Restart Settings | `Restart` | `Restart` | [tools](/en/azurpilot/user/tasks/tools) |

## <DocIcon name="target" /> Sortie (`Farm`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| Main Campaign-1 | `Main` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Main Campaign-2 | `Main2` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Main Campaign-3 | `Main3` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Urgent Commissions | `GemsFarming` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Three-Oil Low-Cost | `ThreeOilLowCost` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| 1-1 Ambush Farming (WIP) | `Ambush11` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` | [campaign](/en/azurpilot/user/tasks/campaign) |

## <DocIcon name="star" /> Events (`Event`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| Event General | `EventGeneral` | `EventGeneral` `TaskBalancer` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Event Stage-1 | `Event` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Event Stage-2 | `Event2` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Event Stage-3 | `Event3` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Raid Battle | `Raid` | `Raid` `Campaign` `StopCondition` `Emotion` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Raid Scuttle | `RaidScuttle` | `Raid` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Letters from Deep Valley | `Hospital` | `Hospital` `StopCondition` `Emotion` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Coalition Operation | `Coalition` | `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Coalition Scuttle | `CoalitionScuttle` | `CoalitionScuttle` `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Maritime Escort | `MaritimeEscort` | `MaritimeEscort` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Event Shop | `EventShop` | `EventShop` | [campaign](/en/azurpilot/user/tasks/campaign) |
| War Archives | `WarArchives` | `Campaign` `StopCondition` `WarArchives` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |

## <DocIcon name="calendar" /> Event Dailies (`EventDaily`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| Daily Event A | `EventA` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Daily Event B | `EventB` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Daily Event C | `EventC` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Daily Event D | `EventD` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Daily Event SP | `EventSp` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Daily Raid | `RaidDaily` | `RaidDaily` `Campaign` `StopCondition` `Emotion` | [campaign](/en/azurpilot/user/tasks/campaign) |
| Haunted Chronicles SP | `CoalitionSp` | `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/en/azurpilot/user/tasks/campaign) |

## <DocIcon name="gift" /> Automated Claims (`Reward`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| Commissions | `Commission` | `Commission` | [daily](/en/azurpilot/user/tasks/daily) |
| Tactical Class | `Tactical` | `Tactical` `ControlExpOverflow` `AddNewStudent` | [daily](/en/azurpilot/user/tasks/daily) |
| Research | `Research` | `Research` | [daily](/en/azurpilot/user/tasks/daily) |
| Storage Statistics | `StorageStatistics` | `StorageStatistics` | [daily](/en/azurpilot/user/tasks/daily) |
| Dormitory | `Dorm` | `Dorm` `BuyFurniture` | [daily](/en/azurpilot/user/tasks/daily) |
| Meowfficer | `Meowfficer` | `Meowfficer` `MeowfficerTrain` | [daily](/en/azurpilot/user/tasks/daily) |
| Guild Logistics | `Guild` | `GuildLogistics` `GuildOperation` | [daily](/en/azurpilot/user/tasks/daily) |
| Automated Claims | `Reward` | `Reward` | [daily](/en/azurpilot/user/tasks/daily) |
| Cognitive Awakening | `Awaken` | `Awaken` | [daily](/en/azurpilot/user/tasks/daily) |
| Secretary Rotation | `Secretary` | `Secretary` | [daily](/en/azurpilot/user/tasks/daily) |
| Combat Handover | `OperationHandover` | `Campaign` `OperationHandover` | [daily](/en/azurpilot/user/tasks/daily) |

## <DocIcon name="clock" /> Daily Missions (`DailyMission`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| Daily Missions | `Daily` | `Daily` | [daily](/en/azurpilot/user/tasks/daily) |
| Challenge Mode | `LimitChallenge` | `LimitChallenge` | [daily](/en/azurpilot/user/tasks/daily) |
| Hard Mode | `Hard` | `Hard` | [daily](/en/azurpilot/user/tasks/daily) |
| Exercises | `Exercise` | `Exercise` | [daily](/en/azurpilot/user/tasks/daily) |
| General Merchant | `ShopFrequent` | `GeneralShop` | [daily](/en/azurpilot/user/tasks/daily) |
| Milestone Shops | `ShopOnce` | `GuildShop` `MedalShop2` `MeritShop` `CoreShop` | [daily](/en/azurpilot/user/tasks/daily) |
| Development Shipyard | `Shipyard` | `ShipyardDr` `Shipyard` | [daily](/en/azurpilot/user/tasks/daily) |
| Daily Gacha | `Gacha` | `Gacha` | [daily](/en/azurpilot/user/tasks/daily) |
| Freebies Collection | `Freebies` | `BattlePass` `DataKey` `Mail` `SupplyPack` | [daily](/en/azurpilot/user/tasks/daily) |
| Minigames | `Minigame` | — | [daily](/en/azurpilot/user/tasks/daily) |
| Private Quarters | `PrivateQuarters` | `PrivateQuarters` | [daily](/en/azurpilot/user/tasks/daily) |

## <DocIcon name="compass" /> Operation Siren (`Opsi`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| General Settings | `OpsiGeneral` | `OpsiGeneral` | [opsi](/en/azurpilot/user/tasks/opsi) |
| META Showdown | `OpsiAshBeacon` | `OpsiAshBeacon` | [opsi](/en/azurpilot/user/tasks/opsi) |
| META Assist | `OpsiAshAssist` | `OpsiAshAssist` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Monthly Exploration | `OpsiExplore` | `OpsiExplore` `OpsiFleet` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Exploration Event Sweep | `OpsiExploreCleanup` | `OpsiExploreCleanup` `OpsiFleet` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Port Shops | `OpsiShop` | `OpsiShop` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Voucher Exchange | `OpsiVoucher` | `OpsiVoucher` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Operation Siren Dailies | `OpsiDaily` | `OpsiDaily` `OpsiFleet` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Obscure Sectors | `OpsiObscure` | `OpsiObscure` `OpsiFleet` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Abyssal Coordinates | `OpsiAbyssal` | `OpsiAbyssal` `OpsiFleetFilter` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Archive Coordinates | `OpsiArchive` | `OpsiFleet` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Siren Strongholds | `OpsiStronghold` | `OpsiStronghold` `OpsiFleetFilter` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Monthly Arbiter Boss | `OpsiMonthBoss` | `OpsiMonthBoss` `OpsiFleetFilter` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Meowfficer Farming | `OpsiMeowfficerFarming` | `OpsiMeowfficerFarming` `OpsiSirenBug` `OpsiTarget` `OpsiFleet` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Corrosion 1 Leveling | `OpsiHazard1Leveling` | `OpsiHazard1Leveling` `OpsiSirenBug` `OpsiFleet` `OpsiCheckLeveling` `OpsiFleetAutoChange` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Intelligent Scheduler | `OpsiScheduling` | `OpsiScheduling` `OpsiSmartExplore` | [opsi](/en/azurpilot/user/tasks/opsi) |
| AP Overflow Defense | `OpsiPreventActionPointOverflow` | `OpsiPreventActionPointOverflow` | [opsi](/en/azurpilot/user/tasks/opsi) |
| Month-End Transition | `OpsiCrossMonth` | — | [opsi](/en/azurpilot/user/tasks/opsi) |
| Operation Siren Simulator Alpha | `OpsiSimulator` | `OpsiSimulatorParameters` | [opsi](/en/azurpilot/user/tasks/opsi) |

## <DocIcon name="sparkles" /> Cruise & Island Missions (`Island`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| Global Configuration | `IslandPlan` | `IslandPlan` `IslandWalk` | [island](/en/azurpilot/user/tasks/island) |
| Business Operations | `IslandBusiness` | `IslandBusiness` `IslandBusinessShop1` `IslandBusinessShop2` `IslandBusinessShop3` `IslandBusinessShop4` `IslandBusinessShop5` | [island](/en/azurpilot/user/tasks/island) |
| Farmland | `IslandFarm` | `IslandFarm` `IslandOrchard` `IslandNursery` | [island](/en/azurpilot/user/tasks/island) |
| Ranching | `IslandRancher` | `IslandRancher` `IslandFishery` | [island](/en/azurpilot/user/tasks/island) |
| Mining & Forestry | `IslandMineForest` | `IslandMine` `IslandForest` | [island](/en/azurpilot/user/tasks/island) |
| Fish Diner | `IslandRestaurant` | `IslandRestaurant` `IslandRestaurantNextTask` | [island](/en/azurpilot/user/tasks/island) |
| Polar Drinks | `IslandTeahouse` | `IslandTeahouse` `IslandTeahouseNextTask` | [island](/en/azurpilot/user/tasks/island) |
| Cuttlefish BBQ | `IslandGrill` | `IslandGrill` `IslandGrillNextTask` | [island](/en/azurpilot/user/tasks/island) |
| Juu Snacks | `IslandJuuEatery` | `IslandJuuEatery` `IslandJuuEateryNextTask` | [island](/en/azurpilot/user/tasks/island) |
| Juu Coffee | `IslandJuuCoffee` | `IslandJuuCoffee` `IslandJuuCoffeeNextTask` | [island](/en/azurpilot/user/tasks/island) |
| Manufacturing | `IslandManufacture` | `WoodProcessing` `ElectronicProcessing` `Industrial` `Handmade` | [island](/en/azurpilot/user/tasks/island) |
| Daily Gathering | `IslandDailyGather` | `IslandDailyGather` | [island](/en/azurpilot/user/tasks/island) |
| Aerial Supplies | `IslandAirDrop` | `IslandAirDrop` | [island](/en/azurpilot/user/tasks/island) |
| Cargo Preparation | `IslandCargoPreparation` | `IslandCargoPreparation` | [island](/en/azurpilot/user/tasks/island) |
| Daily Orders | `IslandDailyOrder` | `IslandDailyOrder` | [island](/en/azurpilot/user/tasks/island) |
| Daily Interactions | `IslandDailyInteract` | `IslandDailyInteract` | [island](/en/azurpilot/user/tasks/island) |
| Weekly Pearl Trade | `IslandPearlSell` | `IslandPearlSell` | [island](/en/azurpilot/user/tasks/island) |

## <DocIcon name="handshake" /> Fleet Management (`FleetManagement`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| Fleet Information | `FleetInfo` | `FleetInfo` | [tools](/en/azurpilot/user/tasks/tools) |

## <DocIcon name="clock" /> Execution Parameters (`RunParams`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| Execution Parameters | `RunParams` | `Watchdog` `Reboot` `Device` `ScreenRecord` `UiWait` `Handover` | [tools](/en/azurpilot/user/tasks/tools) |

## Utilities (`Tool`)

| Task Name | Command | Parameter Groups | Manual |
| --- | --- | --- | --- |
| Mind Calculator Scan | `MindCalculatorScan` | `MindCalculator` | [tools](/en/azurpilot/user/tasks/tools) |
| Fleet Tech Scan | `FleetTechScan` | `FleetTech` | [tools](/en/azurpilot/user/tasks/tools) |
| Semi-Automated Clicking | `Daemon` | `Daemon` | [tools](/en/azurpilot/user/tasks/tools) |
| Operation Siren Semi-Auto | `OpsiDaemon` | `OpsiDaemon` | [tools](/en/azurpilot/user/tasks/tools) |
| Event Story Skip | `EventStory` | `EventStory` | [tools](/en/azurpilot/user/tasks/tools) |
| Disassemble Gear Boxes | `BoxDisassemble` | `BoxDisassemble` | [tools](/en/azurpilot/user/tasks/tools) |
| Automated Equipment | `AutoEquip` | `AutoEquip` | [tools](/en/azurpilot/user/tasks/tools) |
| Performance Benchmark | `Benchmark` | `Benchmark` | [tools](/en/azurpilot/user/tasks/tools) |
| OCR Benchmark | `OcrBenchmark` | `OcrBenchmark` | [tools](/en/azurpilot/user/tasks/tools) |
| Uncensor Mod | `AzurLaneUncensored` | `AzurLaneUncensored` | [tools](/en/azurpilot/user/tasks/tools) |
| Game Manager (Incomplete) | `GameManager` | `GameManager` | [tools](/en/azurpilot/user/tasks/tools) |
| Emulator Manager | `EmulatorManager` | `EmulatorManager` | [tools](/en/azurpilot/user/tasks/tools) |
| Meowfficer Scoring | `MeowfficerScore` | `MeowfficerScore` | [tools](/en/azurpilot/user/tasks/tools) |

## Unregistered Schema Tasks

The following tasks are defined in `args.json` but do not appear in `task.yaml` menus. They may be invoked internally or via APIs and are not exposed in the current WebUI.

| Task Name | Command | Parameter Groups | Status |
| --- | --- | --- | --- |
| Fleet Scan | `FleetScan` | — | Unexposed in menu (Pending verification) |

## Notes

### Parameter Groups

Each task's "Parameter Groups" lists the option schemas bound inside `task.yaml`. The `Scheduler` and `Storage` groups are included across all tasks and omitted from the table for clarity.

### Menu Labels vs. Command Identifiers

Menu labels are user-facing strings; command identifiers (such as `Main`) are immutable program tokens consumed by the scheduler, configuration engine, and APIs (`tasks.run`, `trigger_task`).

### Event Task Seasonality

Tasks like `Hospital`, `Coalition`, and `CoalitionSp` target seasonal events. They idle when events conclude. Active tasks evolve across releases according to `task.yaml`.
