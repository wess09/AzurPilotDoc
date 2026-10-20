---
title: 配置參考
description: AzurPilot 配置的路徑語義、調度字段、常用選項組與全部 167 個參數組的字段索引。
updated: 2026-10-20
---

# 配置參考

配置不是一堆散落的開關，而是三層路徑：

```text
<Task>.<Group>.<Argument>
例如 Research.Research.UseCube
     └ 任务   └ 选项组  └ 字段
```

運行時綁定後，業務代碼用下劃線屬性訪問：`self.config.Research_UseCube`。

當前版本共 **167 個選項組**、**102 個任務**。數據來源：`https://github.com/wess09/AzurPilot` @ `7de6bb9`。

::: tip 完整字段以 WebUI 為準
下表列出字段名與數量，但**不復制每個字段的預設值、取值範圍與幫助文案**——那些由 `argument.yaml` 與 `i18n/*.json` 在運行時分發，手抄會過期。需要精確值時看 WebUI 的字段提示，或直接讀源碼。
:::

## <DocIcon name="clock" /> 調度字段

每個任務都有 `Scheduler` 組：

| 字段 | 類型 | 預設 | 含義 |
| --- | --- | --- | --- |
| `Enable` | checkbox | false | 是否加入調度 |
| `PushNotification` | checkbox | false | 任務結束推送 |
| `NextRun` | datetime | 2020-01-01 | 下一次允許運行的時間 |
| `Command` | text | 任務名 | 內部命令，自動維護 |
| `SuccessInterval` | int | 0 | 成功後推遲分鐘數 |
| `FailureInterval` | int | 120 | 失敗後推遲分鐘數 |
| `ServerUpdate` | time | 00:00 | 每日排期基準 |
| `Sensitive` | checkbox | 視任務 | 出錯停止而非重新啟動 |

## <DocIcon name="star" /> 常用選項組

按「被多少任務引用」排序，只列引用數 ≥ 3 的組：

| 選項組 | 字段數 | 被引用任務數 | 字段 |
| --- | --- | --- | --- |
| `Scheduler` | 8 | 81 | `Enable` `PushNotification` `NextRun` `Command` `SuccessInterval` `FailureInterval` `ServerUpdate` `Sensitive` |
| `Campaign` | 10 | 22 | `Name` `Event` `Mode` `UseClearMode` `UseFleetLock` `UseAutoSearch` `Use2xBook` `AmbushEvade` `UseRecommendFleet` `DefeatWithdraw` |
| `Emotion` | 18 | 22 | `Mode` `IgnoreShipwreck` `MinReserve` `RecoveryWait` `Fleet1Value` `Fleet1Record` `Fleet1RecoveryState` `Fleet1Control` `Fleet1Recover` `Fleet1Oath` `Fleet1Onsen` `Fleet2Value` …（共 18 項） |
| `StopCondition` | 8 | 22 | `OilLimit` `OilLimitHardFloor` `CoinLimit` `RunCount` `MapAchievement` `StageIncrease` `GetNewShip` `ReachLevel` |
| `Fleet` | 10 | 16 | `Fleet1` `Fleet1Formation` `Fleet1Mode` `Fleet1Step` `Fleet2` `Fleet2Formation` `Fleet2Mode` `Fleet2Step` `FleetOrder` `SkipPreparation` |
| `Submarine` | 5 | 16 | `Fleet` `Mode` `AutoSearchMode` `DistanceToBoss` `AdvancedConfig` |
| `EnemyPriority` | 1 | 14 | `EnemyScaleBalanceWeight` |
| `HpControl` | 8 | 12 | `UseHpBalance` `UseEmergencyRepair` `UseLowHpRetreat` `HpBalanceThreshold` `HpBalanceWeight` `RepairUseSingleThreshold` `RepairUseMultiThreshold` `LowHpRetreatThreshold` |
| `OpsiFleet` | 2 | 7 | `Fleet` `Submarine` |
| `EventDaily` | 2 | 4 | `StageFilter` `LastStage` |
| `Coalition` | 2 | 3 | `Mode` `Fleet` |
| `GemsFarming` | 18 | 3 | `EventFallbackStage` `ChangeFlagship` `CommonCV` `CommonCVFilter` `ChangeVanguard` `CommonDD` `CommonDDFilter` `EquipmentCode` `UseEmotionFirst` `IgnoreEmotionWarning` `AllowHighFlagshipLevel` `AllowLowVanguardLevel` …（共 18 項） |
| `OpsiFleetFilter` | 1 | 3 | `Filter` |

## <DocIcon name="clipboard" /> 全部選項組

展開查看 167 個組的字段索引。

::: details 全部選項組

| 選項組 | 字段數 | 被引用任務數 | 字段 |
| --- | --- | --- | --- |
| `Scheduler` | 8 | 81 | `Enable` `PushNotification` `NextRun` `Command` `SuccessInterval` `FailureInterval` `ServerUpdate` `Sensitive` |
| `Campaign` | 10 | 22 | `Name` `Event` `Mode` `UseClearMode` `UseFleetLock` `UseAutoSearch` `Use2xBook` `AmbushEvade` `UseRecommendFleet` `DefeatWithdraw` |
| `Emotion` | 18 | 22 | `Mode` `IgnoreShipwreck` `MinReserve` `RecoveryWait` `Fleet1Value` `Fleet1Record` `Fleet1RecoveryState` `Fleet1Control` `Fleet1Recover` `Fleet1Oath` `Fleet1Onsen` `Fleet2Value` …（共 18 項） |
| `StopCondition` | 8 | 22 | `OilLimit` `OilLimitHardFloor` `CoinLimit` `RunCount` `MapAchievement` `StageIncrease` `GetNewShip` `ReachLevel` |
| `Fleet` | 10 | 16 | `Fleet1` `Fleet1Formation` `Fleet1Mode` `Fleet1Step` `Fleet2` `Fleet2Formation` `Fleet2Mode` `Fleet2Step` `FleetOrder` `SkipPreparation` |
| `Submarine` | 5 | 16 | `Fleet` `Mode` `AutoSearchMode` `DistanceToBoss` `AdvancedConfig` |
| `EnemyPriority` | 1 | 14 | `EnemyScaleBalanceWeight` |
| `HpControl` | 8 | 12 | `UseHpBalance` `UseEmergencyRepair` `UseLowHpRetreat` `HpBalanceThreshold` `HpBalanceWeight` `RepairUseSingleThreshold` `RepairUseMultiThreshold` `LowHpRetreatThreshold` |
| `OpsiFleet` | 2 | 7 | `Fleet` `Submarine` |
| `EventDaily` | 2 | 4 | `StageFilter` `LastStage` |
| `Coalition` | 2 | 3 | `Mode` `Fleet` |
| `GemsFarming` | 18 | 3 | `EventFallbackStage` `ChangeFlagship` `CommonCV` `CommonCVFilter` `ChangeVanguard` `CommonDD` `CommonDDFilter` `EquipmentCode` `UseEmotionFirst` `IgnoreEmotionWarning` `AllowHighFlagshipLevel` `AllowLowVanguardLevel` …（共 18 項） |
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
| `Commission` | 20 | 1 | `PresetFilter` `DynamicProgramming` `TierValueRatio` `DelayHalfLife` `DeadlineFutureHorizon` `FilterValueFloor` `FilterValueHalfLife` `CustomFilter` `Blacklist` `DoMajorCommission` `CommissionNotifyReward` `CommissionNotifyRewardStatistics` …（共 20 項） |
| `ControlExpOverflow` | 5 | 1 | `Enable` `T4Allow` `T3Allow` `T2Allow` `T1Allow` |
| `Core` | 3 | 1 | `Value` `Color` `Record` |
| `CoreShop` | 2 | 1 | `Enable` `Filter` |
| `Cube` | 3 | 1 | `Value` `Color` `Record` |
| `Daemon` | 1 | 1 | `EnterMap` |
| `Daily` | 14 | 1 | `UseDailySkip` `EscortMission` `EscortMissionFleet` `AdvanceMission` `AdvanceMissionFleet` `FierceAssault` `FierceAssaultFleet` `TacticalTraining` `TacticalTrainingFleet` `SupplyLineDisruption` `ModuleDevelopment` `ModuleDevelopmentFleet` …（共 14 項） |
| `DailySummary` | 2 | 1 | `Enable` `TriggerTime` |
| `DataKey` | 2 | 1 | `Collect` `ForceCollect` |
| `Device` | 5 | 1 | `EmulatorStartProgressInterval` `EmulatorStartDialogCheckInterval` `Mumu12StatePollInterval` `Mumu12StopWaitTimeout` `Mumu12DeepWaitTimeout` |
| `Dorm` | 6 | 1 | `Collect` `Feed` `FeedFilter` `ReserveFood` `FeedReserveState` `BuyFood` |
| `DropRecord` | 22 | 1 | `SaveFolder` `RetentionDays` `BackUpMethod` `ZipMethod` `AzurStatsID` `API` `ResearchRecord` `CommissionRecord` `CommissionIncomeScreenshot` `CombatRecord` `OpsiHazard1Leveling` `OpsiMeowfficerFarming` …（共 22 項） |
| `ElectronicProcessing` | 1 | 1 | `Positions` |
| `Emulator` | 8 | 1 | `Serial` `PackageName` `ServerName` `ScreenshotMethod` `ControlMethod` `GameSettings` `ScreenshotDedithering` `AdbRestart` |
| `EmulatorInfo` | 10 | 1 | `Emulator` `name` `path` `EnableRemoteSSH` `RemoteSSHHost` `RemoteSSHPort` `RemoteSSHUser` `RemoteSSHPublicKey` `RemoteStartCommand` `RemoteStopCommand` |
| `EmulatorManagement` | 4 | 1 | `ScheduledEmulatorRestart` `ForceScheduledRestart` `RestartIntervalHours` `DeepRestartAfterFailures` |
| `EmulatorManager` | 7 | 1 | `EnableRemoteSSH` `RemoteSSHHost` `RemoteSSHPort` `RemoteSSHUser` `RemoteSSHPublicKey` `RemoteStartCommand` `RemoteStopCommand` |
| `Enhance` | 4 | 1 | `ShipToEnhance` `Filter` `CheckPerCategory` `KeepCommonCV` |
| `Error` | 23 | 1 | `HandleError` `SaveError` `StrictRestart` `TaskRestartLimit` `SaveErrorRetentionDays` `SaveErrorBackUpMethod` `SaveErrorZipMethod` `OnePushConfig` `LowPushMode` `ScreenshotLength` `GameStuckRestart` `GameStuckThreshold` …（共 23 項） |
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
| `GuildShop` | 15 | 1 | `Enable` `Refresh` `Filter` `BOX_T3` `BOX_T4` `BOOK_T2` `BOOK_T3` `RETROFIT_T2` `RETROFIT_T3` `PLATE_T2` `PLATE_T3` `PLATE_T4` …（共 15 項） |
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
| `IslandGrill` | 18 | 1 | `PostNumber` `ChefFilter` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` `MealNumber5` …（共 18 項） |
| `IslandGrillNextTask` | 1 | 1 | `AwayCook` |
| `IslandJuuCoffee` | 19 | 1 | `PostNumber` `ChefFilter` `Friedrich` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` …（共 19 項） |
| `IslandJuuCoffeeNextTask` | 1 | 1 | `AwayCook` |
| `IslandJuuEatery` | 18 | 1 | `PostNumber` `ChefFilter` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` `MealNumber5` …（共 18 項） |
| `IslandJuuEateryNextTask` | 1 | 1 | `AwayCook` |
| `IslandMine` | 8 | 1 | `Positions` `MineSilver` `WorkerFilter` `MinCopper` `MinAluminium` `MinIron` `MinSulphur` `MinSilver` |
| `IslandNursery` | 5 | 1 | `Positions` `WorkerFilter` `MinNursery` `IgnorePineapple` `PlantLavender` |
| `IslandOrchard` | 6 | 1 | `Positions` `WorkerFilter` `MinOrchard` `IgnoreAvocado` `PlantRubber` `AmagiChanRubber` |
| `IslandPearlSell` | 5 | 1 | `BuyPrice` `SellPrice` `BuyNextRun` `DailyPriceRefresh` `NextPearlTradeTime` |
| `IslandPlan` | 1 | 1 | `Season` |
| `IslandRancher` | 8 | 1 | `MinChicken` `ChickenFilter` `MinPork` `PigFilter` `Milk` `RancherFilter` `Wool` `WoolWorkerFilter` |
| `IslandRestaurant` | 19 | 1 | `PostNumber` `ChefFilter` `DoubleBambooShoots` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` …（共 19 項） |
| `IslandRestaurantNextTask` | 1 | 1 | `AwayCook` |
| `IslandTeahouse` | 19 | 1 | `PostNumber` `ChefFilter` `Seasonal` `Meal1` `MealNumber1` `Meal2` `MealNumber2` `Meal3` `MealNumber3` `Meal4` `MealNumber4` `Meal5` …（共 19 項） |
| `IslandTeahouseNextTask` | 1 | 1 | `AwayCook` |
| `IslandWalk` | 34 | 1 | `AirDrop` `AirDropEnable` `AirDropRetry` `AirDropRetryEnable` `AirDropSelf` `AirDropSelfEnable` `DailyLakeniya` `DailyLakeniyaEnable` `DailyLuxi` `DailyLuxiEnable` `DailyAobulaien` `DailyAobulaienEnable` …（共 34 項） |
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
| `OpsiGeneral` | 15 | 1 | `UseLogger` `BuyActionPointLimit` `OilLimit` `RepairThreshold` `UseRepairPack` `RepairPackThreshold` `RepairPackThresholdHazard1` `DoRandomMapEvent` `AkashiShopFilter` `DebugClipRetentionDays` `NotifyOpsiMail` `LauncherPush` …（共 15 項） |
| `OpsiHazard1Leveling` | 13 | 1 | `TargetZone` `OperationCoinsPreserve` `MinimumActionPointReserve` `ExecuteFixedPatrolScan` `SkipHpCheck` `ActionPointCheckInterval` `SkipStrategicSearchCheck` `Cl1Filter` `RecordNonCL1AP` `RecordSeaMiles` `SeaMilesLastRecord` `PendingMapEvent` …（共 13 項） |
| `OpsiMeowfficerFarming` | 6 | 1 | `ActionPointPreserve` `HazardLevel` `TargetZone` `StayInZone` `ExecuteFixedPatrolScan` `DebugClip` |
| `OpsiMonthBoss` | 3 | 1 | `Mode` `CheckAdaptability` `ForceRun` |
| `OpsiObscure` | 2 | 1 | `SkipHazard2Obscure` `ForceRun` |
| `OpsiPreventActionPointOverflow` | 3 | 1 | `Task` `ActionPointUpperbound` `ActionPointLowerbound` |
| `OpsiScheduling` | 16 | 1 | `BuyActionPoint` `UseSmartSchedulingOperationCoinsPreserve` `OperationCoinsPreserve` `ActionPointPreserve` `OperationCoinsReturnThreshold` `EnableMeowfficerFarming` `EnableObscure` `EnableAbyssal` `EnableStronghold` `TaskPriority` `ObscureAbyssalCheckDelayDays` `MonthEndActionPointCleanupEnable` …（共 16 項） |
| `OpsiShop` | 3 | 1 | `PresetFilter` `CustomFilter` `DisableBeforeDate` |
| `OpsiSimulatorParameters` | 17 | 1 | `Samples` `Draw` `TotalTime` `TimeUseRatio` `InitialAp` `InitialCoin` `MeowHazardLevel` `CrossWeek` `BuyAp` `Cl1Coin` `Meow3Coin` `Meow5Coin` …（共 17 項） |
| `OpsiSmartExplore` | 4 | 1 | `Enable` `EventCleanup` `ForceRun` `Progress` |
| `OpsiStronghold` | 3 | 1 | `SubmarineEveryCombat` `ForceRun` `HasStronghold` |
| `OpsiTarget` | 3 | 1 | `TargetFarming` `TargetZone` `LastRun` |
| `OpsiVoucher` | 1 | 1 | `Filter` |
| `Optimization` | 15 | 1 | `OcrDevice` `OcrBackend` `OcrWindowsMlVendorEp` `OcrModelVersionEnglish` `OcrModelVersionChinese` `OcrModelVersionJapanese` `OcrModelVersionTraditionalChinese` `ScreenshotInterval` `CombatScreenshotInterval` `TaskHoardingDuration` `CloseEmulatorDuringLongWait` `WhenTaskQueueEmpty` …（共 15 項） |
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
| `UiWait` | 20 | 1 | `IslandMapConfirmWait` `IslandMapDestinationWait` `IslandMapConfirmRetryWait` `IslandCharacterConfirmRetryWait` `IslandEntryRetryWait` `PqInteractButtonTimeout` `PqInteractClickWait` `PqInteractStartTimeout` `PqInteractEndTimeout` `PqInteractExitTimeout` `GachaPrepSubmitWait` `GachaPrepTimeout` …（共 20 項） |
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

## <DocIcon name="box" /> 字段語義的分類

### 用戶可改 vs 強制覆蓋

| 來源 | 行為 |
| --- | --- |
| `argument.yaml` | 定義類型與預設值 |
| `default.yaml` | 任務特定的可修改預設值 |
| `override.yaml` | 強制覆蓋，用戶改不了（包括 `display: hide`） |

在 WebUI 改了值又變回去，先查 `override.yaml`。

### 可見 vs 內部狀態

標記 `display: hide` 的字段（如 `Campaign.Name` 之外的大量 `*Record`、`*State`）是內部狀態，用於跨運行記憶。不要手動改，除非你明確知道它的狀態機。

### 需要重新啟動 vs 立即生效

| 類型 | 生效時機 |
| --- | --- |
| 任務參數 | 任務邊界（下一個任務開始時） |
| 調度開關與時間 | 下一輪調度 |
| `deploy.yaml`（連接埠、密碼、語言） | 重新啟動後端 |
| Android Runtime 部署字段 | 重新啟動 Runtime |

## <DocIcon name="circle-alert" /> 常見錯誤

| 現象 | 原因 |
| --- | --- |
| 字段不存在 | 該任務沒有掛這個選項組 |
| 儲存後回退 | 被 `override.yaml` 覆蓋 |
| 中文顯示為鍵名 | `i18n` 缺翻譯 |
| 改了沒生效 | 還在任務執行中，等下個任務邊界 |
| 匯入後丟字段 | 跨版本遷移，字段被重命名或刪除 |

## <DocIcon name="map" /> 相關

- [配置系統（開發者）](/zh-HK/azurpilot/developer/config)
- [任務命令總表](/zh-HK/reference/tasks)
- [命令行、連接埠與環境變數](/zh-HK/reference/cli)
