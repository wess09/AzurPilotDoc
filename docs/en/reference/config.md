---
title: Configuration Reference
description: Structural path semantics, scheduling schemas, common parameter groups, and complete index across all 167 groups.
updated: 2026-10-20
---

# Configuration Reference

Configurations adhere to a strict three-tier hierarchical path:

```text
<Task>.<Group>.<Argument>
Example: Research.Research.UseCube
         └ Task   └ Group   └ Property
```

When bound at runtime, business modules access parameters using snake_case properties: `self.config.Research_UseCube`.

Current baseline: **167 parameter groups** across **102 tasks**. Source baseline: `https://github.com/wess09/AzurPilot` @ `7de6bb9`.

::: tip Verify Field Details in WebUI
The tables below list schema keys and parameter counts. Detailed validation bounds, descriptions, and defaults load dynamically from `argument.yaml` and `i18n/*.json`.
:::

## <DocIcon name="clock" /> Scheduling Schema

Every automated task inherits the `Scheduler` parameter group:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `Enable` | checkbox | false | Admits task into the execution queue |
| `PushNotification` | checkbox | false | Dispatches push alerts upon completion |
| `NextRun` | datetime | 2020-01-01 | Next eligible execution timestamp |
| `Command` | text | Task name | Internal dispatch command |
| `SuccessInterval` | int | 0 | Minutes delayed after successful completion |
| `FailureInterval` | int | 120 | Minutes delayed after failure |
| `ServerUpdate` | time | 00:00 | Daily reset baseline timestamp |
| `Sensitive` | checkbox | Task-defined | Halts instance upon unexpected error |

## <DocIcon name="star" /> Frequently Referenced Parameter Groups

Groups referenced by 3 or more tasks, sorted by task frequency:

| Parameter Group | Option Count | Referenced Tasks | Key Options |
| --- | --- | --- | --- |
| `Scheduler` | 8 | 81 | `Enable` `PushNotification` `NextRun` `Command` `SuccessInterval` `FailureInterval` `ServerUpdate` `Sensitive` |
| `Campaign` | 10 | 22 | `Name` `Event` `Mode` `UseClearMode` `UseFleetLock` `UseAutoSearch` `Use2xBook` `AmbushEvade` `UseRecommendFleet` `DefeatWithdraw` |
| `Emotion` | 18 | 22 | `Mode` `IgnoreShipwreck` `MinReserve` `RecoveryWait` `Fleet1Value` `Fleet1Record` `Fleet1RecoveryState` `Fleet1Control` `Fleet1Recover` `Fleet1Oath` `Fleet1Onsen` `Fleet2Value` …(18 items total) |
| `StopCondition` | 8 | 22 | `OilLimit` `OilLimitHardFloor` `CoinLimit` `RunCount` `MapAchievement` `StageIncrease` `GetNewShip` `ReachLevel` |
| `Fleet` | 10 | 16 | `Fleet1` `Fleet1Formation` `Fleet1Mode` `Fleet1Step` `Fleet2` `Fleet2Formation` `Fleet2Mode` `Fleet2Step` `FleetOrder` `SkipPreparation` |
| `Submarine` | 5 | 16 | `Fleet` `Mode` `AutoSearchMode` `DistanceToBoss` `AdvancedConfig` |
| `EnemyPriority` | 1 | 14 | `EnemyScaleBalanceWeight` |
| `HpControl` | 8 | 12 | `UseHpBalance` `UseEmergencyRepair` `UseLowHpRetreat` `HpBalanceThreshold` `HpBalanceWeight` `RepairUseSingleThreshold` `RepairUseMultiThreshold` `LowHpRetreatThreshold` |
| `OpsiFleet` | 2 | 7 | `Fleet` `Submarine` |
| `EventDaily` | 2 | 4 | `StageFilter` `LastStage` |
| `Coalition` | 2 | 3 | `Mode` `Fleet` |
| `GemsFarming` | 18 | 3 | `EventFallbackStage` `ChangeFlagship` `CommonCV` `CommonCVFilter` `ChangeVanguard` `CommonDD` `CommonDDFilter` `EquipmentCode` `UseEmotionFirst` `IgnoreEmotionWarning` `AllowHighFlagshipLevel` `AllowLowVanguardLevel` …(18 items total) |
| `OpsiFleetFilter` | 1 | 3 | `Filter` |

## <DocIcon name="clipboard" /> Complete Parameter Group Index

Expand to view the complete index across all 167 parameter groups.

::: details All Parameter Groups

| Parameter Group | Option Count | Referenced Tasks | Key Options |
| --- | --- | --- | --- |
| `Scheduler` | 8 | 81 | `Enable` `PushNotification` `NextRun` `Command` `SuccessInterval` `FailureInterval` `ServerUpdate` `Sensitive` |
| `Campaign` | 10 | 22 | `Name` `Event` `Mode` `UseClearMode` `UseFleetLock` `UseAutoSearch` `Use2xBook` `AmbushEvade` `UseRecommendFleet` `DefeatWithdraw` |
| `Emotion` | 18 | 22 | `Mode` `IgnoreShipwreck` `MinReserve` `RecoveryWait` `Fleet1Value` `Fleet1Record` `Fleet1RecoveryState` `Fleet1Control` `Fleet1Recover` `Fleet1Oath` `Fleet1Onsen` `Fleet2Value` …(18 items total) |
| `StopCondition` | 8 | 22 | `OilLimit` `OilLimitHardFloor` `CoinLimit` `RunCount` `MapAchievement` `StageIncrease` `GetNewShip` `ReachLevel` |
| `Fleet` | 10 | 16 | `Fleet1` `Fleet1Formation` `Fleet1Mode` `Fleet1Step` `Fleet2` `Fleet2Formation` `Fleet2Mode` `Fleet2Step` `FleetOrder` `SkipPreparation` |
| `Submarine` | 5 | 16 | `Fleet` `Mode` `AutoSearchMode` `DistanceToBoss` `AdvancedConfig` |
| `EnemyPriority` | 1 | 14 | `EnemyScaleBalanceWeight` |
| `HpControl` | 8 | 12 | `UseHpBalance` `UseEmergencyRepair` `UseLowHpRetreat` `HpBalanceThreshold` `HpBalanceWeight` `RepairUseSingleThreshold` `RepairUseMultiThreshold` `LowHpRetreatThreshold` |
| `OpsiFleet` | 2 | 7 | `Fleet` `Submarine` |
| `EventDaily` | 2 | 4 | `StageFilter` `LastStage` |
| `Coalition` | 2 | 3 | `Mode` `Fleet` |
| `GemsFarming` | 18 | 3 | `EventFallbackStage` `ChangeFlagship` `CommonCV` `CommonCVFilter` `ChangeVanguard` `CommonDD` `CommonDDFilter` `EquipmentCode` `UseEmotionFirst` `IgnoreEmotionWarning` `AllowHighFlagshipLevel` `AllowLowVanguardLevel` …(18 items total) |
| `OpsiFleetFilter` | 1 | 3 | `Filter` |
| `OpsiSirenBug` | 3 | 2 | `SirenResearch_Enable` `Siren_Mode` `Siren_Fleet` |
| `Raid` | 2 | 2 | `Mode` `UseTicket` |
| `ActionPoint` | 4 | 1 | `Value` `Total` `Color` `Record` |
| `AddNewStudent` | 4 | 1 | `Enable` `Favorite` `MinLevel` `MaxLevel` |
| `AutoEquip` | 6 | 1 | `ShipLimit` `EnableSlot1` `EnableSlot2` `EnableSlot3` `EnableSlot4` `EnableSlot5` |
| `Awaken` | 2 | 1 | `LevelCap` `Favourite` |
| `AzurLaneUncensored` | 1 | 1 | `Repository` |
| `Backup` | 2 | 1 | `Enable` `KeepDays` |
| `BattlePass` | 1 | 1 | `Collect` |
| `Benchmark` | 2 | 1 | `DeviceType` `TestScene` |
| `BoxDisassemble` | 6 | 1 | `UsePurpleBox` `PurpleBoxLimit` `UseBlueBox` `BlueBoxLimit` `UseWhiteBox` `WhiteBoxLimit` |
| `BuyFurniture` | 3 | 1 | `Enable` `BuyOption` `LastRun` |
| `CoalitionScuttle` | 1 | 1 | `Sacrifice` |
| `Coin` | 4 | 1 | `Value` `Limit` `Color` `Record` |
| `Commission` | 20 | 1 | `PresetFilter` `DynamicProgramming` `TierValueRatio` `DelayHalfLife` `DeadlineFutureHorizon` `FilterValueFloor` `FilterValueHalfLife` `CustomFilter` `Blacklist` `DoMajorCommission` `CommissionNotifyReward` `CommissionNotifyRewardStatistics` …(20 items total) |
| `ControlExpOverflow` | 5 | 1 | `Enable` `T4Allow` `T3Allow` `T2Allow` `T1Allow` |
| `Core` | 3 | 1 | `Value` `Color` `Record` |
| `CoreShop` | 2 | 1 | `Enable` `Filter` |
| `Cube` | 3 | 1 | `Value` `Color` `Record` |
| `Daemon` | 1 | 1 | `EnterMap` |
| `Daily` | 14 | 1 | `UseDailySkip` `EscortMission` `EscortMissionFleet` `AdvanceMission` `AdvanceMissionFleet` `FierceAssault` `FierceAssaultFleet` `TacticalTraining` `TacticalTrainingFleet` `SupplyLineDisruption` `ModuleDevelopment` `ModuleDevelopmentFleet` …(14 items total) |
| `DailySummary` | 2 | 1 | `Enable` `TriggerTime` |
| `DataKey` | 2 | 1 | `Collect` `ForceCollect` |
| `Device` | 5 | 1 | `EmulatorStartProgressInterval` `EmulatorStartDialogCheckInterval` `Mumu12StatePollInterval` `Mumu12StopWaitTimeout` `Mumu12DeepWaitTimeout` |
| `Dorm` | 6 | 1 | `Collect` `Feed` `FeedFilter` `ReserveFood` `FeedReserveState` `BuyFood` |
| `DropRecord` | 22 | 1 | `SaveFolder` `RetentionDays` `BackUpMethod` `ZipMethod` `AzurStatsID` `API` `ResearchRecord` `CommissionRecord` `CommissionIncomeScreenshot` `CombatRecord` `OpsiHazard1Leveling` `OpsiMeowfficerFarming` …(22 items total) |
| `ElectronicProcessing` | 1 | 1 | `Positions` |
| `Emulator` | 8 | 1 | `Serial` `PackageName` `ServerName` `ScreenshotMethod` `ControlMethod` `GameSettings` `ScreenshotDedithering` `AdbRestart` |
| `EmulatorInfo` | 10 | 1 | `Emulator` `name` `path` `EnableRemoteSSH` `RemoteSSHHost` `RemoteSSHPort` `RemoteSSHUser` `RemoteSSHPublicKey` `RemoteStartCommand` `RemoteStopCommand` |
| `EmulatorManagement` | 4 | 1 | `ScheduledEmulatorRestart` `ForceScheduledRestart` `RestartIntervalHours` `DeepRestartAfterFailures` |
| `EmulatorManager` | 7 | 1 | `EnableRemoteSSH` `RemoteSSHHost` `RemoteSSHPort` `RemoteSSHUser` `RemoteSSHPublicKey` `RemoteStartCommand` `RemoteStopCommand` |
| `Enhance` | 4 | 1 | `ShipToEnhance` `Filter` `CheckPerCategory` `KeepCommonCV` |
| `Error` | 23 | 1 | `HandleError` `SaveError` `StrictRestart` `TaskRestartLimit` `SaveErrorRetentionDays` `SaveErrorBackUpMethod` `SaveErrorZipMethod` `OnePushConfig` `LowPushMode` `ScreenshotLength` `GameStuckRestart` `GameStuckThreshold` …(23 items total) |
| `EventGeneral` | 2 | 1 | `PtLimit` `TimeLimit` |
| `EventShop` | 4 | 1 | `UnlockSSRShip` `BuyURShip` `PresetFilter` `CustomFilter` |
| `EventStory` | 1 | 1 | `SkipBattle` |
| `Exercise` | 8 | 1 | `DelayUntilHoursBeforeNextUpdate` `OpponentChooseMode` `OpponentTrial` `ExerciseStrategy` `LowHpThreshold` `LowHpConfirmWait` `OpponentRefreshValue` `OpponentRefreshRecord` |
| `FleetInfo` | 2 | 1 | `Result` `Record` |
| `FleetTech` | 3 | 1 | `MinLevel` `MaxLevel` `Record` |
| `Gacha` | 7 | 1 | `Pool` `Amount` `UseTicket` `TicketAmount` `ClearTicket` `ClearTicketTime` `UseDrill` |
| `GameManager` | 1 | 1 | `AutoRestart` |
| `Gem` | 3 | 1 | `Value` `Color` `Record` |
| `GeneralShop` | 7 | 1 | `Enable` `UseGems` `Refresh` `BuySkinBox` `ConsumeCoins` `OverflowCoins` `Filter` |
| `GuildCoin` | 3 | 1 | `Value` `Color` `Record` |
| `GuildLogistics` | 3 | 1 | `Enable` `SelectNewMission` `ExchangeFilter` |
| `GuildOperation` | 6 | 1 | `Enable` `SelectNewOperation` `NewOperationMaxDate` `JoinThreshold` `AttackBoss` `BossFleetRecommend` |
| `GuildShop` | 15 | 1 | `Enable` `Refresh` `Filter` `BOX_T3` `BOX_T4` `BOOK_T2` `BOOK_T3` `RETROFIT_T2` `RETROFIT_T3` `PLATE_T2` `PLATE_T3` `PLATE_T4` …(15 items total) |
| `Handmade` | 1 | 1 | `Positions` |
| `Handover` | 4 | 1 | `ConsumeRetryMinutes` `MaintainLeadMinutes` `MaintainCheckMinutes` `ConflictRetryMinutes` |
| `Hard` | 2 | 1 | `HardStage` `HardFleet` |
| `Hospital` | 1 | 1 | `UseRecommendFleet` |
| `Industrial` | 1 | 1 | `Positions` |
| `IslandAirDrop` | 2 | 1 | `LastSteal` `VisitOtherIsland` |
| `IslandBusiness` | 5 | 1 | `BatchEnabled` `Batch1Shops` `Batch2Shops` `SeasonalReplaceEnabled` `SeasonalThreshold` |
| `IslandBusinessShop1` | 9 | 1 | `Char1` `Char2` `Product1` `Product2` `Product3` `Product4` `Product5` `SeasonalFallback` `BoostReplaceFilter` |
| `IslandBusinessShop2` | 9 | 1 | `Char1` `Char2` `Product1` `Product2` `Product3` `Product4` `Product5` `SeasonalFallback` `BoostReplaceFilter` |
| `IslandBusinessShop3` | 8 | 1 | `Char1` `Char2` `Product1` `Product2` `Product3` `Product4` `Product5` `BoostReplaceFilter` |
| `IslandBusinessShop4` | 8 | 1 | `Char1` `Char2` `Product1` `Product2` `Product3` `Product4` `Product5` `BoostReplaceFilter` |
| `IslandBusinessShop5` | 8 | 1 | `Char1` `Char2` `Product1` `Product2` `Product3` `Product4` `Product5` `BoostReplaceFilter` |
| `IslandCargoPreparation` | 1 | 1 | `Blacklist` |
| `IslandDailyGather` | 1 | 1 | `WorkerFilter` |
| `IslandDailyInteract` | 1 | 1 | `WeeklyPhoto` |
| `IslandDailyOrder` | 3 | 1 | `RejectCount` `RejectFilter` `UrgentDetectRefreshTime` |
| `IslandFarm` | 4 | 1 | `Positions` `WorkerFilter` `MinFarm` `PlantPotatoes` |
| `IslandFishery` | 11 | 1 | `Positions` `MinBass` `MinYellowfinTuna` `MinShell` `MinShrimp` `MinCrayfish` `MinCrab` `MinSquid` `MinSeaCucumber` `PlantYellowfinTuna` `RancherFilter` |
| `IslandForest` | 6 | 1 | `Positions` `CutElegant` `WorkerFilter` `MinElegant` `MinPractical` `MinSelected` |
| `IslandGrill` | 18 | 1 | `PostNumber` `ChefFilter` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` `MealNumber5` …(18 items total) |
| `IslandGrillNextTask` | 1 | 1 | `AwayCook` |
| `IslandJuuCoffee` | 19 | 1 | `PostNumber` `ChefFilter` `Friedrich` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` …(19 items total) |
| `IslandJuuCoffeeNextTask` | 1 | 1 | `AwayCook` |
| `IslandJuuEatery` | 18 | 1 | `PostNumber` `ChefFilter` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` `MealNumber5` …(18 items total) |
| `IslandJuuEateryNextTask` | 1 | 1 | `AwayCook` |
| `IslandMine` | 8 | 1 | `Positions` `MineSilver` `WorkerFilter` `MinCopper` `MinAluminium` `MinIron` `MinSulphur` `MinSilver` |
| `IslandNursery` | 5 | 1 | `Positions` `WorkerFilter` `MinNursery` `IgnorePineapple` `PlantLavender` |
| `IslandOrchard` | 6 | 1 | `Positions` `WorkerFilter` `MinOrchard` `IgnoreAvocado` `PlantRubber` `AmagiChanRubber` |
| `IslandPearlSell` | 5 | 1 | `BuyPrice` `SellPrice` `BuyNextRun` `DailyPriceRefresh` `NextPearlTradeTime` |
| `IslandPlan` | 1 | 1 | `Season` |
| `IslandRancher` | 8 | 1 | `MinChicken` `ChickenFilter` `MinPork` `PigFilter` `Milk` `RancherFilter` `Wool` `WoolWorkerFilter` |
| `IslandRestaurant` | 19 | 1 | `PostNumber` `ChefFilter` `DoubleBambooShoots` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` …(19 items total) |
| `IslandRestaurantNextTask` | 1 | 1 | `AwayCook` |
| `IslandTeahouse` | 19 | 1 | `PostNumber` `ChefFilter` `Seasonal` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` …(19 items total) |
| `IslandTeahouseNextTask` | 1 | 1 | `AwayCook` |
| `IslandWalk` | 34 | 1 | `AirDrop` `AirDropEnable` `AirDropRetry` `AirDropRetryEnable` `AirDropSelf` `AirDropSelfEnable` `DailyLakeniya` `DailyLakeniyaEnable` `DailyLuxi` `DailyLuxiEnable` `DailyAobulaien` `DailyAobulaienEnable` …(34 items total) |
| `LimitChallenge` | 5 | 1 | `TargetLevel` `Month` `CompletedLevel` `AttemptedLevel` `Failed` |
| `Log` | 3 | 1 | `LogKeepCount` `LogBackUpMethod` `ZipMethod` |
| `Mail` | 4 | 1 | `ClaimMerit` `ClaimMaintenance` `ClaimTradeLicense` `DeleteCollected` |
| `MaritimeEscort` | 1 | 1 | `Enable` |
| `Medal` | 3 | 1 | `Value` `Color` `Record` |
| `MedalShop2` | 8 | 1 | `Enable` `Filter` `RETROFIT_T1` `RETROFIT_T2` `RETROFIT_T3` `PLATE_T1` `PLATE_T2` `PLATE_T3` |
| `Meowfficer` | 2 | 1 | `BuyAmount` `FortChoreMeowfficer` |
| `MeowfficerScore` | 8 | 1 | `Source` `Folder` `MaxImages` `ReportPath` `DeviceShots` `DeviceInterval` `ScanLimit` `ScanPasses` |
| `MeowfficerTrain` | 8 | 1 | `Enable` `Mode` `RetainTalentedGold` `RetainTalentedPurple` `ScoreTalents` `ScoreThreshold` `EnhanceIndex` `MaxFeedLevel` |
| `Merit` | 3 | 1 | `Value` `Color` `Record` |
| `MeritShop` | 4 | 1 | `Enable` `Refresh` `BuyUnobtainedShip` `Filter` |
| `MindCalculator` | 4 | 1 | `MinLevel` `MaxLevel` `Result` `FleetTechRecord` |
| `Oil` | 4 | 1 | `Value` `Limit` `Color` `Record` |
| `OilControl` | 2 | 1 | `Enable` `Target` |
| `OldRetire` | 5 | 1 | `N` `R` `SR` `SSR` `RetireAmount` |
| `OneClickRetire` | 1 | 1 | `KeepLimitBreak` |
| `OperationHandover` | 10 | 1 | `Count` `AutoSupplementTime` `UseHandoverBook` `ConsumeAllBook` `ConsumeAllBookWeekday` `ConsumeAllBookTime` `MaintainOverride` `OilLimit` `ConsumeAllBookRecord` `CommissionEnd` |
| `OpsiAbyssal` | 1 | 1 | `ForceRun` |
| `OpsiAshAssist` | 1 | 1 | `Tier` |
| `OpsiAshBeacon` | 7 | 1 | `AttackMode` `AssistRequestLimit` `AssistRequestState` `DossierAutoAttackMode` `RequestAssist` `EnsureFullyCollected` `AutoCollectShip` |
| `OpsiCheckLeveling` | 6 | 1 | `TargetLevel` `LastRun` `CheckInterval` `EnableCustomCheck` `CustomCheckPositions` `DelayAfterFull` |
| `OpsiDaemon` | 2 | 1 | `RepairShip` `SelectEnemy` |
| `OpsiDaily` | 7 | 1 | `DoMission` `UseTuningSample` `SkipSirenResearchMission` `KeepMissionZone` `MissionZones` `DeferredMissions` `CollectTargetReward` |
| `OpsiExplore` | 7 | 1 | `SpecialRadar` `ForceRun` `LastZone` `AllowHazard1Leveling` `MeowfficerCleanup` `MeowfficerCleanupState` `ExploreProgress` |
| `OpsiExploreCleanup` | 2 | 1 | `Progress` `State` |
| `OpsiFleetAutoChange` | 3 | 1 | `Enable` `CooldownHours` `LastRun` |
| `OpsiGeneral` | 15 | 1 | `UseLogger` `BuyActionPointLimit` `OilLimit` `RepairThreshold` `UseRepairPack` `RepairPackThreshold` `RepairPackThresholdHazard1` `DoRandomMapEvent` `AkashiShopFilter` `DebugClipRetentionDays` `NotifyOpsiMail` `LauncherPush` …(15 items total) |
| `OpsiHazard1Leveling` | 13 | 1 | `TargetZone` `OperationCoinsPreserve` `MinimumActionPointReserve` `ExecuteFixedPatrolScan` `SkipHpCheck` `ActionPointCheckInterval` `SkipStrategicSearchCheck` `Cl1Filter` `RecordNonCL1AP` `RecordSeaMiles` `SeaMilesLastRecord` `PendingMapEvent` …(13 items total) |
| `OpsiMeowfficerFarming` | 6 | 1 | `ActionPointPreserve` `HazardLevel` `TargetZone` `StayInZone` `ExecuteFixedPatrolScan` `DebugClip` |
| `OpsiMonthBoss` | 3 | 1 | `Mode` `CheckAdaptability` `ForceRun` |
| `OpsiObscure` | 2 | 1 | `SkipHazard2Obscure` `ForceRun` |
| `OpsiPreventActionPointOverflow` | 3 | 1 | `Task` `ActionPointUpperbound` `ActionPointLowerbound` |
| `OpsiScheduling` | 16 | 1 | `BuyActionPoint` `UseSmartSchedulingOperationCoinsPreserve` `OperationCoinsPreserve` `ActionPointPreserve` `OperationCoinsReturnThreshold` `EnableMeowfficerFarming` `EnableObscure` `EnableAbyssal` `EnableStronghold` `TaskPriority` `ObscureAbyssalCheckDelayDays` `MonthEndActionPointCleanupEnable` …(16 items total) |
| `OpsiShop` | 3 | 1 | `PresetFilter` `CustomFilter` `DisableBeforeDate` |
| `OpsiSimulatorParameters` | 17 | 1 | `Samples` `Draw` `TotalTime` `TimeUseRatio` `InitialAp` `InitialCoin` `MeowHazardLevel` `CrossWeek` `BuyAp` `Cl1Coin` `Meow3Coin` `Meow5Coin` …(17 items total) |
| `OpsiSmartExplore` | 4 | 1 | `Enable` `EventCleanup` `ForceRun` `Progress` |
| `OpsiStronghold` | 3 | 1 | `SubmarineEveryCombat` `ForceRun` `HasStronghold` |
| `OpsiTarget` | 3 | 1 | `TargetFarming` `TargetZone` `LastRun` |
| `OpsiVoucher` | 1 | 1 | `Filter` |
| `Optimization` | 15 | 1 | `OcrDevice` `OcrBackend` `OcrWindowsMlVendorEp` `OcrModelVersionEnglish` `OcrModelVersionChinese` `OcrModelVersionJapanese` `OcrModelVersionTraditionalChinese` `ScreenshotInterval` `CombatScreenshotInterval` `TaskHoardingDuration` `CloseEmulatorDuringLongWait` `WhenTaskQueueEmpty` …(15 items total) |
| `PrivateQuarters` | 0 | 1 |  |
| `Pt` | 3 | 1 | `Value` `Color` `Record` |
| `PublicEmotion` | 9 | 1 | `Enable` `Tasks` `FleetValue` `FleetRecord` `FleetRecoveryState` `FleetControl` `FleetRecover` `FleetOath` `FleetOnsen` |
| `PurpleCoin` | 3 | 1 | `Value` `Color` `Record` |
| `RaidDaily` | 1 | 1 | `StageFilter` |
| `Reboot` | 5 | 1 | `Tries` `FirstTryWaitSeconds` `SubsequentTryWaitSeconds` `ObserveSeconds` `ObserveInterval` |
| `Research` | 8 | 1 | `UseCube` `UseCoin` `UsePart` `AllowDelay` `AllowGenreT` `RemainingCommissions` `PresetFilter` `CustomFilter` |
| `Restart` | 4 | 1 | `RandomDelay` `ClearCache` `LoginWaitTimeout` `MoveChannelFloat` |
| `Retirement` | 1 | 1 | `RetireMode` |
| `Reward` | 5 | 1 | `CollectOil` `CollectCoin` `CollectExp` `CollectMission` `CollectWeeklyMission` |
| `ScreenRecord` | 5 | 1 | `StartTimeout` `StopTimeout` `PollInterval` `TranscodeBaseTimeout` `TranscodeMaxTimeout` |
| `Secretary` | 7 | 1 | `CustomFilter` `LowFavorabilityPriority` `FavouriteOnly` `BackupEnable` `CheckInterval` `Notify` `OnePushConfig` |
| `Shipyard` | 4 | 1 | `ResearchSeries` `ShipIndex` `BuyAmount` `LastRun` |
| `ShipyardDr` | 4 | 1 | `ResearchSeries` `ShipIndex` `BuyAmount` `LastRun` |
| `StorageStatistics` | 1 | 1 | `RunIntervalDays` |
| `SupplyPack` | 2 | 1 | `Collect` `DayOfWeek` |
| `Tactical` | 3 | 1 | `TacticalFilter` `RapidTrainingSlot` `SkillAutoSwitch` |
| `TaskBalancer` | 3 | 1 | `Enable` `CoinLimit` `TaskCall` |
| `UiWait` | 20 | 1 | `IslandMapConfirmWait` `IslandMapDestinationWait` `IslandMapConfirmRetryWait` `IslandCharacterConfirmRetryWait` `IslandEntryRetryWait` `PqInteractButtonTimeout` `PqInteractClickWait` `PqInteractStartTimeout` `PqInteractEndTimeout` `PqInteractExitTimeout` `GachaPrepSubmitWait` `GachaPrepTimeout` …(20 items total) |
| `WarArchives` | 8 | 1 | `DailyRunCount` `AutoClear` `AutoSelectEvent` `AutoClearTarget` `AutoClearProgress` `DailyRunCountRemain` `DailyRunCountRecord` `DailyRunCountLimit` |
| `Watchdog` | 2 | 1 | `CheckInterval` `DailySummaryCheckInterval` |
| `WoodProcessing` | 1 | 1 | `Positions` |
| `YellowCoin` | 3 | 1 | `Value` `Color` `Record` |
| `YukikazeTaskManager` | 1 | 1 | `TaskPriorityAdjustment` |
| `C11AffinityFarming` | 1 | 0 | `RunCount` |
| `C122MediumLeveling` | 1 | 0 | `LargeEnemyTolerance` |
| `C124LargeLeveling` | 3 | 0 | `NonLargeEnterTolerance` `NonLargeRetreatTolerance` `PickupAmmo` |
| `C72MysteryFarming` | 1 | 0 | `StepOnA3` |
| `HospitalEvent` | 2 | 0 | `Mode` `Stage` |
| `Minigame` | 1 | 0 | `Collect` |
| `Sos` | 1 | 0 | `Chapter` |

:::

## <DocIcon name="box" /> Scope and Persistence Semantics

### User-Modifiable vs. Enforced Values

| Definition Source | Behavior |
| --- | --- |
| `argument.yaml` | Declares parameter types and default baseline values |
| `default.yaml` | Task-specific default values (modifiable in WebUI) |
| `override.yaml` | Enforced overrides (locked; unmodifiable in WebUI) |

If an adjusted value reverts immediately upon saving in the WebUI, inspect `override.yaml`.

### Visibility vs. Internal State

Properties flagged with `display: hide` (such as `*Record` and `*State` properties) track internal state across execution sessions. Avoid editing these properties manually.

### Effective Timing

| Setting Category | Effective Timing |
| --- | --- |
| Task Parameters | Next task boundary (when the next task starts) |
| Scheduler Queues & Intervals | Next scheduling evaluation loop |
| `deploy.yaml` (Ports, passwords, languages) | Server restart required |
| Android Runtime Settings | Runtime reboot required |

## <DocIcon name="circle-alert" /> Common Configuration Pitfalls

| Issue | Root Cause |
| --- | --- |
| Field missing from WebUI | Group not assigned in `task.yaml`, or configured with `display: hide` |
| Value reverts after editing | Value is locked in `override.yaml` |
| UI renders raw schema keys | Missing translations in `i18n/*.json` |
| Setting does not take effect | In-flight task is still executing; wait for next task boundary |
| Values lost after import | Deprecated keys or major schema version migration |

## <DocIcon name="map" /> Related References

- [Configuration System (Developer)](/en/azurpilot/developer/config)
- [Task Command Matrix](/en/reference/tasks)
- [CLI, Ports & Environment Variables](/en/reference/cli)
