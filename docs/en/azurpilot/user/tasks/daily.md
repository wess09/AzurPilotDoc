---
title: Dailies & Resources
description: Setup and rewards for commissions, research, dorm, Meowfficers, guilds, daily challenges, exercises, and shops.
updated: 2026-10-20
---

# Dailies & Resources

Daily routines execute quickly, carry minimal failure penalties, and yield steady rewards. Enable all applicable routines aligned with daily server reset schedules.

## <DocIcon name="gift" /> Automated Claims (`Reward`)

Collects all ready rewards from the primary game interface in a single pass:

| Option | Function |
| --- | --- |
| `CollectOil` | Claims canteen oil |
| `CollectCoin` | Claims merchant coins |
| `CollectExp` | Claims lecture hall experience |
| `CollectMission` | Claims completed daily/weekly mission rewards |
| `CollectWeeklyMission` | Claims weekly reward chests |

Enabling all options is safe and serves as a baseline verification test following initial setup.

## <DocIcon name="scroll" /> Commissions (`Commission`)

| Attribute | Details |
| --- | --- |
| Purpose | Automatically claims completed commissions and dispatches optimal new missions |
| Prerequisites | Commission slots unlocked |
| Key Options | `PresetFilter`, `DynamicProgramming` (dynamic programming selection), `DoMajorCommission` |
| Advanced | `TierValueRatio`, `DelayHalfLife`, `DeadlineFutureHorizon` control time/value trade-offs |
| Alerts | `CommissionNotifyReward`, `DetectShipDrop`, `GemNotify` dispatch notifications for rare drops |
| Verification | New dispatches appear in the game dock; logs record claim and dispatch events |

Configure `NoFreeShipPolicy` and `AutoPickShip` to handle dock capacity limits when commissions award ships.

## <DocIcon name="flask" /> Research (`Research`)

| Attribute | Details |
| --- | --- |
| Purpose | Selects scientific research projects, claims finished blueprints, and queues new tasks |
| Prerequisites | Research lab unlocked; available research queue |
| Key Options | `UseCube` (spends cubes on high-yield research), `UseCoin`, `UsePart` |
| Project Filtering | `PresetFilter` (e.g. focus equipment analysis), `CustomFilter` |
| Delay Strategy | `AllowDelay` pauses execution briefly to wait for better project rolls |
| Verification | Active research project displayed; logs output project title and remaining duration |

::: tip Cube Usage vs. Gems
`UseCube` spends Wisdom Cubes for rapid research. AzurPilot never spends paid gems automatically without explicit user intervention.
:::

## <DocIcon name="brain" /> Tactical Class (`Tactical`)

| Option | Function |
| --- | --- |
| `TacticalFilter` | Priority filters for target skills |
| `RapidTrainingSlot` | Utilizes rapid training slots |
| `SkillAutoSwitch` | Automatically rotates to the next skill once level 10 is reached |
| `ControlExpOverflow` | Restricts textbook tiers to prevent exp waste (T4/T3/T2/T1) |
| `AddNewStudent` | Automatically assigns new students within `MinLevel` and `MaxLevel` |

## <DocIcon name="sparkles" /> Dormitory (`Dorm`)

| Option | Function |
| --- | --- |
| `Collect` | Gathers dorm coins and heart affection |
| `Feed` | Restocks snacks |
| `FeedFilter` | Snack consumption priority |
| `ReserveFood` | Food reserve floor |
| `BuyFood` | Purchases snacks with coins when depleted |
| `BuyFurniture.Enable` | Automatically purchases furniture sets (optional) |

## <DocIcon name="crown" /> Meowfficer (`Meowfficer`)

| Option | Function |
| --- | --- |
| `BuyAmount` | Number of daily Meowfficer boxes purchased |
| `FortChoreMeowfficer` | Assigns Meowfficers to fortress chores |
| `MeowfficerTrain.Enable` | Automated Meowfficer training |
| `MeowfficerTrain.Mode` | Training routine strategy |
| `ScoreTalents` / `ScoreThreshold` | Evaluates talents against scoring baselines |
| `MaxFeedLevel` | Maximum feeding level cap |

Use the "Tool → Meowfficer Scoring" utility to benchmark talent tiers against community guides.

## <DocIcon name="handshake" /> Guild Logistics (`Guild`)

| Option | Function |
| --- | --- |
| `GuildLogistics.Enable` | Accepts and submits guild logistics orders |
| `GuildLogistics.SelectNewMission` | Automatically selects new missions |
| `GuildOperation.Enable` | Participates in guild boss operations |
| `GuildOperation.AttackBoss` | Automatically attacks active boss |
| `JoinThreshold` | Minimum participant threshold required to engage |

## <DocIcon name="zap" /> Cognitive Awakening (`Awaken`)

| Option | Function |
| --- | --- |
| `LevelCap` | Target awakening level cap |
| `Favourite` | Prioritizes favorited ships |

Consumes Cognitive Chips to uncap max-level ships; skips execution when materials are depleted.

## <DocIcon name="user-check" /> Secretary Rotation (`Secretary`)

Rotates secretary ships once target affection thresholds are reached:

| Option | Function |
| --- | --- |
| `CustomFilter` | Candidate ship criteria |
| `LowFavorabilityPriority` | Prioritizes ships with lower affection |
| `FavouriteOnly` | Restricts candidates to favorited ships |
| `CheckInterval` | Rotation check frequency |
| `BackupEnable` | Retains original secretary as a fallback |

## <DocIcon name="target" /> Combat Handover (`OperationHandover`)

Automates combat handover vouchers:

| Option | Function |
| --- | --- |
| `Count` | Batches submitted per run |
| `UseHandoverBook` | Spends handover vouchers |
| `ConsumeAllBook` | Consumes all vouchers; timing set by `ConsumeAllBookWeekday` / `Time` |
| `OilLimit` | Oil reserve threshold |

## <DocIcon name="package" /> Warehouse Inventory Statistics (`StorageStatistics`)

Scans material inventories for designated SSR/UR items, verifying items across pagination passes before updating statistics:

- Disabled by default; runs every 7 days once enabled, or on demand.
- **Purely observational**; consumes zero items.
- Configured for verified CN server templates.

## <DocIcon name="calendar" /> Daily Challenges (`Daily`)

| Option | Target Mission |
| --- | --- |
| `UseDailySkip` | Uses quick challenge tickets |
| `EscortMission` / `EscortMissionFleet` | Escort missions and fleet assignment |
| `AdvanceMission` / `AdvanceMissionFleet` | Advance operations and fleet assignment |
| `FierceAssault` / `FierceAssaultFleet` | Assault missions and fleet assignment |
| `TacticalTraining` / `TacticalTrainingFleet` | Tactical training and fleet assignment |
| `SupplyLineDisruption` | Submarine supply disruption |
| `ModuleDevelopment` / `EmergencyModuleDevelopment` | Augment module development |

## <DocIcon name="circle-alert" /> Hard Mode (`Hard`)

| Option | Function |
| --- | --- |
| `HardStage` | Target Hard mode stage |
| `HardFleet` | Fleet assignment |

Runs daily attempts following server resets. Ensure fleet compositions meet stage-specific hull restrictions (CV/BB).

## <DocIcon name="medal" /> Exercise (`Exercise`)

| Option | Function |
| --- | --- |
| `OpponentChooseMode` | Opponent selection strategy |
| `OpponentTrial` | Runs pre-battle evaluation |
| `ExerciseStrategy` | Attack strategy |
| `DelayUntilHoursBeforeNextUpdate` | Delays attacks until shortly before reset to find easier matches |
| `LowHpThreshold` | Emergency retreat HP threshold |

## <DocIcon name="trophy" /> Challenge Mode (`LimitChallenge`)

Attempts monthly challenges up to target difficulties, with a single sortie per tier. Halts on defeat until next month.

| Option | Function |
| --- | --- |
| `TargetLevel` | Target challenge difficulty tier |
| `Month` / `CompletedLevel` / `AttemptedLevel` / `Failed` | Internal progress state tracker |

Requires pre-configuring challenge fleets inside the game.

## <DocIcon name="badge-dollar" /> In-Game Shops

### General Merchant (`ShopFrequent`)

| Option | Function |
| --- | --- |
| `Enable` | Enables merchant shopping |
| `UseGems` | Allows spending gems (defaults to disabled) |
| `Refresh` | Refreshes free shop stocks |
| `BuySkinBox` | Purchases skin boxes |
| `ConsumeCoins` | Allows spending coins |
| `Filter` | Purchase priority filter |

### Milestone Shops (`ShopOnce`)

Manages Guild, Medal, Merit, and Core Data shops:

```text
GuildShop / MedalShop2 / MeritShop / CoreShop
```

Toggle `BuyUnobtainedShip` to purchase ships missing from your collection archives.

### Shipyard Development (`Shipyard`)

| Option | Function |
| --- | --- |
| `ResearchSeries` | Target PR series (PR1–PR7) |
| `ShipIndex` | Target developmental ship |
| `BuyAmount` | Number of blueprints purchased daily |

## <DocIcon name="circle-dollar" /> Freebies Collection (`Freebies`)

| Group | Claim Targets |
| --- | --- |
| `BattlePass.Collect` | Cruise Pass progression rewards |
| `DataKey.Collect` | Daily War Archives data keys |
| `Mail.*` | Claims mail attachments and cleans mailbox (`ClaimMerit`, `ClaimMaintenance`, `DeleteCollected`) |
| `SupplyPack.Collect` | Weekly free supply packs |
