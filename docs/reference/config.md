---
title: 配置参考
description: AzurPilot 配置的路径语义、调度字段、常用选项组与全部 167 个参数组的字段索引。
updated: 2026-10-20
---

# 配置参考

配置不是一堆散落的开关，而是三层路径：

```text
<Task>.<Group>.<Argument>
例如 Research.Research.UseCube
     └ 任务   └ 选项组  └ 字段
```

运行时绑定后，业务代码用下划线属性访问：`self.config.Research_UseCube`。

当前版本共 **167 个选项组**、**102 个任务**。数据来源：`https://github.com/wess09/AzurPilot` @ `7de6bb9`。

::: tip 完整字段以 WebUI 为准
下表列出字段名与数量，但**不复制每个字段的默认值、取值范围与帮助文案**——那些由 `argument.yaml` 与 `i18n/*.json` 在运行时分发，手抄会过期。需要精确值时看 WebUI 的字段提示，或直接读源码。
:::

## <DocIcon name="clock" /> 调度字段

每个任务都有 `Scheduler` 组：

| 字段 | 类型 | 默认 | 含义 |
| --- | --- | --- | --- |
| `Enable` | checkbox | false | 是否加入调度 |
| `PushNotification` | checkbox | false | 任务结束推送 |
| `NextRun` | datetime | 2020-01-01 | 下一次允许运行的时间 |
| `Command` | text | 任务名 | 内部命令，自动维护 |
| `SuccessInterval` | int | 0 | 成功后推迟分钟数 |
| `FailureInterval` | int | 120 | 失败后推迟分钟数 |
| `ServerUpdate` | time | 00:00 | 每日排期基准 |
| `Sensitive` | checkbox | 视任务 | 出错停止而非重启 |

## <DocIcon name="star" /> 常用选项组

按「被多少任务引用」排序，只列引用数 ≥ 3 的组：

| 选项组 | 字段数 | 被引用任务数 | 字段 |
| --- | --- | --- | --- |
| `Scheduler` | 8 | 81 | `Enable` `PushNotification` `NextRun` `Command` `SuccessInterval` `FailureInterval` `ServerUpdate` `Sensitive` |
| `Campaign` | 10 | 22 | `Name` `Event` `Mode` `UseClearMode` `UseFleetLock` `UseAutoSearch` `Use2xBook` `AmbushEvade` `UseRecommendFleet` `DefeatWithdraw` |
| `Emotion` | 18 | 22 | `Mode` `IgnoreShipwreck` `MinReserve` `RecoveryWait` `Fleet1Value` `Fleet1Record` `Fleet1RecoveryState` `Fleet1Control` `Fleet1Recover` `Fleet1Oath` `Fleet1Onsen` `Fleet2Value` …（共 18 项） |
| `StopCondition` | 8 | 22 | `OilLimit` `OilLimitHardFloor` `CoinLimit` `RunCount` `MapAchievement` `StageIncrease` `GetNewShip` `ReachLevel` |
| `Fleet` | 10 | 16 | `Fleet1` `Fleet1Formation` `Fleet1Mode` `Fleet1Step` `Fleet2` `Fleet2Formation` `Fleet2Mode` `Fleet2Step` `FleetOrder` `SkipPreparation` |
| `Submarine` | 5 | 16 | `Fleet` `Mode` `AutoSearchMode` `DistanceToBoss` `AdvancedConfig` |
| `EnemyPriority` | 1 | 14 | `EnemyScaleBalanceWeight` |
| `HpControl` | 8 | 12 | `UseHpBalance` `UseEmergencyRepair` `UseLowHpRetreat` `HpBalanceThreshold` `HpBalanceWeight` `RepairUseSingleThreshold` `RepairUseMultiThreshold` `LowHpRetreatThreshold` |
| `OpsiFleet` | 2 | 7 | `Fleet` `Submarine` |
| `EventDaily` | 2 | 4 | `StageFilter` `LastStage` |
| `Coalition` | 2 | 3 | `Mode` `Fleet` |
| `GemsFarming` | 18 | 3 | `EventFallbackStage` `ChangeFlagship` `CommonCV` `CommonCVFilter` `ChangeVanguard` `CommonDD` `CommonDDFilter` `EquipmentCode` `UseEmotionFirst` `IgnoreEmotionWarning` `AllowHighFlagshipLevel` `AllowLowVanguardLevel` …（共 18 项） |
| `OpsiFleetFilter` | 1 | 3 | `Filter` |

## <DocIcon name="clipboard" /> 全部选项组

展开查看 167 个组的字段索引。

::: details 全部选项组

| 选项组 | 字段数 | 被引用任务数 | 字段 |
| --- | --- | --- | --- |
| `Scheduler` | 8 | 81 | `Enable` `PushNotification` `NextRun` `Command` `SuccessInterval` `FailureInterval` `ServerUpdate` `Sensitive` |
| `Campaign` | 10 | 22 | `Name` `Event` `Mode` `UseClearMode` `UseFleetLock` `UseAutoSearch` `Use2xBook` `AmbushEvade` `UseRecommendFleet` `DefeatWithdraw` |
| `Emotion` | 18 | 22 | `Mode` `IgnoreShipwreck` `MinReserve` `RecoveryWait` `Fleet1Value` `Fleet1Record` `Fleet1RecoveryState` `Fleet1Control` `Fleet1Recover` `Fleet1Oath` `Fleet1Onsen` `Fleet2Value` …（共 18 项） |
| `StopCondition` | 8 | 22 | `OilLimit` `OilLimitHardFloor` `CoinLimit` `RunCount` `MapAchievement` `StageIncrease` `GetNewShip` `ReachLevel` |
| `Fleet` | 10 | 16 | `Fleet1` `Fleet1Formation` `Fleet1Mode` `Fleet1Step` `Fleet2` `Fleet2Formation` `Fleet2Mode` `Fleet2Step` `FleetOrder` `SkipPreparation` |
| `Submarine` | 5 | 16 | `Fleet` `Mode` `AutoSearchMode` `DistanceToBoss` `AdvancedConfig` |
| `EnemyPriority` | 1 | 14 | `EnemyScaleBalanceWeight` |
| `HpControl` | 8 | 12 | `UseHpBalance` `UseEmergencyRepair` `UseLowHpRetreat` `HpBalanceThreshold` `HpBalanceWeight` `RepairUseSingleThreshold` `RepairUseMultiThreshold` `LowHpRetreatThreshold` |
| `OpsiFleet` | 2 | 7 | `Fleet` `Submarine` |
| `EventDaily` | 2 | 4 | `StageFilter` `LastStage` |
| `Coalition` | 2 | 3 | `Mode` `Fleet` |
| `GemsFarming` | 18 | 3 | `EventFallbackStage` `ChangeFlagship` `CommonCV` `CommonCVFilter` `ChangeVanguard` `CommonDD` `CommonDDFilter` `EquipmentCode` `UseEmotionFirst` `IgnoreEmotionWarning` `AllowHighFlagshipLevel` `AllowLowVanguardLevel` …（共 18 项） |
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
| `Commission` | 20 | 1 | `PresetFilter` `DynamicProgramming` `TierValueRatio` `DelayHalfLife` `DeadlineFutureHorizon` `FilterValueFloor` `FilterValueHalfLife` `CustomFilter` `Blacklist` `DoMajorCommission` `CommissionNotifyReward` `CommissionNotifyRewardStatistics` …（共 20 项） |
| `ControlExpOverflow` | 5 | 1 | `Enable` `T4Allow` `T3Allow` `T2Allow` `T1Allow` |
| `Core` | 3 | 1 | `Value` `Color` `Record` |
| `CoreShop` | 2 | 1 | `Enable` `Filter` |
| `Cube` | 3 | 1 | `Value` `Color` `Record` |
| `Daemon` | 1 | 1 | `EnterMap` |
| `Daily` | 14 | 1 | `UseDailySkip` `EscortMission` `EscortMissionFleet` `AdvanceMission` `AdvanceMissionFleet` `FierceAssault` `FierceAssaultFleet` `TacticalTraining` `TacticalTrainingFleet` `SupplyLineDisruption` `ModuleDevelopment` `ModuleDevelopmentFleet` …（共 14 项） |
| `DailySummary` | 2 | 1 | `Enable` `TriggerTime` |
| `DataKey` | 2 | 1 | `Collect` `ForceCollect` |
| `Device` | 5 | 1 | `EmulatorStartProgressInterval` `EmulatorStartDialogCheckInterval` `Mumu12StatePollInterval` `Mumu12StopWaitTimeout` `Mumu12DeepWaitTimeout` |
| `Dorm` | 6 | 1 | `Collect` `Feed` `FeedFilter` `ReserveFood` `FeedReserveState` `BuyFood` |
| `DropRecord` | 22 | 1 | `SaveFolder` `RetentionDays` `BackUpMethod` `ZipMethod` `AzurStatsID` `API` `ResearchRecord` `CommissionRecord` `CommissionIncomeScreenshot` `CombatRecord` `OpsiHazard1Leveling` `OpsiMeowfficerFarming` …（共 22 项） |
| `ElectronicProcessing` | 1 | 1 | `Positions` |
| `Emulator` | 8 | 1 | `Serial` `PackageName` `ServerName` `ScreenshotMethod` `ControlMethod` `GameSettings` `ScreenshotDedithering` `AdbRestart` |
| `EmulatorInfo` | 10 | 1 | `Emulator` `name` `path` `EnableRemoteSSH` `RemoteSSHHost` `RemoteSSHPort` `RemoteSSHUser` `RemoteSSHPublicKey` `RemoteStartCommand` `RemoteStopCommand` |
| `EmulatorManagement` | 4 | 1 | `ScheduledEmulatorRestart` `ForceScheduledRestart` `RestartIntervalHours` `DeepRestartAfterFailures` |
| `EmulatorManager` | 7 | 1 | `EnableRemoteSSH` `RemoteSSHHost` `RemoteSSHPort` `RemoteSSHUser` `RemoteSSHPublicKey` `RemoteStartCommand` `RemoteStopCommand` |
| `Enhance` | 4 | 1 | `ShipToEnhance` `Filter` `CheckPerCategory` `KeepCommonCV` |
| `Error` | 23 | 1 | `HandleError` `SaveError` `StrictRestart` `TaskRestartLimit` `SaveErrorRetentionDays` `SaveErrorBackUpMethod` `SaveErrorZipMethod` `OnePushConfig` `LowPushMode` `ScreenshotLength` `GameStuckRestart` `GameStuckThreshold` …（共 23 项） |
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
| `GuildShop` | 15 | 1 | `Enable` `Refresh` `Filter` `BOX_T3` `BOX_T4` `BOOK_T2` `BOOK_T3` `RETROFIT_T2` `RETROFIT_T3` `PLATE_T2` `PLATE_T3` `PLATE_T4` …（共 15 项） |
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
| `IslandGrill` | 18 | 1 | `PostNumber` `ChefFilter` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` `MealNumber5` …（共 18 项） |
| `IslandGrillNextTask` | 1 | 1 | `AwayCook` |
| `IslandJuuCoffee` | 19 | 1 | `PostNumber` `ChefFilter` `Friedrich` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` …（共 19 项） |
| `IslandJuuCoffeeNextTask` | 1 | 1 | `AwayCook` |
| `IslandJuuEatery` | 18 | 1 | `PostNumber` `ChefFilter` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` `MealNumber5` …（共 18 项） |
| `IslandJuuEateryNextTask` | 1 | 1 | `AwayCook` |
| `IslandMine` | 8 | 1 | `Positions` `MineSilver` `WorkerFilter` `MinCopper` `MinAluminium` `MinIron` `MinSulphur` `MinSilver` |
| `IslandNursery` | 5 | 1 | `Positions` `WorkerFilter` `MinNursery` `IgnorePineapple` `PlantLavender` |
| `IslandOrchard` | 6 | 1 | `Positions` `WorkerFilter` `MinOrchard` `IgnoreAvocado` `PlantRubber` `AmagiChanRubber` |
| `IslandPearlSell` | 5 | 1 | `BuyPrice` `SellPrice` `BuyNextRun` `DailyPriceRefresh` `NextPearlTradeTime` |
| `IslandPlan` | 1 | 1 | `Season` |
| `IslandRancher` | 8 | 1 | `MinChicken` `ChickenFilter` `MinPork` `PigFilter` `Milk` `RancherFilter` `Wool` `WoolWorkerFilter` |
| `IslandRestaurant` | 19 | 1 | `PostNumber` `ChefFilter` `DoubleBambooShoots` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` …（共 19 项） |
| `IslandRestaurantNextTask` | 1 | 1 | `AwayCook` |
| `IslandTeahouse` | 19 | 1 | `PostNumber` `ChefFilter` `Seasonal` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` …（共 19 项） |
| `IslandTeahouseNextTask` | 1 | 1 | `AwayCook` |
| `IslandWalk` | 34 | 1 | `AirDrop` `AirDropEnable` `AirDropRetry` `AirDropRetryEnable` `AirDropSelf` `AirDropSelfEnable` `DailyLakeniya` `DailyLakeniyaEnable` `DailyLuxi` `DailyLuxiEnable` `DailyAobulaien` `DailyAobulaienEnable` …（共 34 项） |
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
| `OpsiGeneral` | 15 | 1 | `UseLogger` `BuyActionPointLimit` `OilLimit` `RepairThreshold` `UseRepairPack` `RepairPackThreshold` `RepairPackThresholdHazard1` `DoRandomMapEvent` `AkashiShopFilter` `DebugClipRetentionDays` `NotifyOpsiMail` `LauncherPush` …（共 15 项） |
| `OpsiHazard1Leveling` | 13 | 1 | `TargetZone` `OperationCoinsPreserve` `MinimumActionPointReserve` `ExecuteFixedPatrolScan` `SkipHpCheck` `ActionPointCheckInterval` `SkipStrategicSearchCheck` `Cl1Filter` `RecordNonCL1AP` `RecordSeaMiles` `SeaMilesLastRecord` `PendingMapEvent` …（共 13 项） |
| `OpsiMeowfficerFarming` | 6 | 1 | `ActionPointPreserve` `HazardLevel` `TargetZone` `StayInZone` `ExecuteFixedPatrolScan` `DebugClip` |
| `OpsiMonthBoss` | 3 | 1 | `Mode` `CheckAdaptability` `ForceRun` |
| `OpsiObscure` | 2 | 1 | `SkipHazard2Obscure` `ForceRun` |
| `OpsiPreventActionPointOverflow` | 3 | 1 | `Task` `ActionPointUpperbound` `ActionPointLowerbound` |
| `OpsiScheduling` | 16 | 1 | `BuyActionPoint` `UseSmartSchedulingOperationCoinsPreserve` `OperationCoinsPreserve` `ActionPointPreserve` `OperationCoinsReturnThreshold` `EnableMeowfficerFarming` `EnableObscure` `EnableAbyssal` `EnableStronghold` `TaskPriority` `ObscureAbyssalCheckDelayDays` `MonthEndActionPointCleanupEnable` …（共 16 项） |
| `OpsiShop` | 3 | 1 | `PresetFilter` `CustomFilter` `DisableBeforeDate` |
| `OpsiSimulatorParameters` | 17 | 1 | `Samples` `Draw` `TotalTime` `TimeUseRatio` `InitialAp` `InitialCoin` `MeowHazardLevel` `CrossWeek` `BuyAp` `Cl1Coin` `Meow3Coin` `Meow5Coin` …（共 17 项） |
| `OpsiSmartExplore` | 4 | 1 | `Enable` `EventCleanup` `ForceRun` `Progress` |
| `OpsiStronghold` | 3 | 1 | `SubmarineEveryCombat` `ForceRun` `HasStronghold` |
| `OpsiTarget` | 3 | 1 | `TargetFarming` `TargetZone` `LastRun` |
| `OpsiVoucher` | 1 | 1 | `Filter` |
| `Optimization` | 15 | 1 | `OcrDevice` `OcrBackend` `OcrWindowsMlVendorEp` `OcrModelVersionEnglish` `OcrModelVersionChinese` `OcrModelVersionJapanese` `OcrModelVersionTraditionalChinese` `ScreenshotInterval` `CombatScreenshotInterval` `TaskHoardingDuration` `CloseEmulatorDuringLongWait` `WhenTaskQueueEmpty` …（共 15 项） |
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
| `UiWait` | 20 | 1 | `IslandMapConfirmWait` `IslandMapDestinationWait` `IslandMapConfirmRetryWait` `IslandCharacterConfirmRetryWait` `IslandEntryRetryWait` `PqInteractButtonTimeout` `PqInteractClickWait` `PqInteractStartTimeout` `PqInteractEndTimeout` `PqInteractExitTimeout` `GachaPrepSubmitWait` `GachaPrepTimeout` …（共 20 项） |
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

## <DocIcon name="box" /> 字段语义的分类

### 用户可改 vs 强制覆盖

| 来源 | 行为 |
| --- | --- |
| `argument.yaml` | 定义类型与默认值 |
| `default.yaml` | 任务特定的可修改默认值 |
| `override.yaml` | 强制覆盖，用户改不了（包括 `display: hide`） |

在 WebUI 改了值又变回去，先查 `override.yaml`。

### 可见 vs 内部状态

标记 `display: hide` 的字段（如 `Campaign.Name` 之外的大量 `*Record`、`*State`）是内部状态，用于跨运行记忆。不要手动改，除非你明确知道它的状态机。

### 需要重启 vs 立即生效

| 类型 | 生效时机 |
| --- | --- |
| 任务参数 | 任务边界（下一个任务开始时） |
| 调度开关与时间 | 下一轮调度 |
| `deploy.yaml`（端口、密码、语言） | 重启后端 |
| Android Runtime 部署字段 | 重启 Runtime |

## <DocIcon name="circle-alert" /> 常见错误

| 现象 | 原因 |
| --- | --- |
| 字段不存在 | 该任务没有挂这个选项组 |
| 保存后回退 | 被 `override.yaml` 覆盖 |
| 中文显示为键名 | `i18n` 缺翻译 |
| 改了没生效 | 还在任务执行中，等下个任务边界 |
| 导入后丢字段 | 跨版本迁移，字段被重命名或删除 |

## <DocIcon name="map" /> 相关

- [配置系统（开发者）](/azurpilot/developer/config)
- [任务命令总表](/reference/tasks)
- [命令行、端口与环境变量](/reference/cli)
