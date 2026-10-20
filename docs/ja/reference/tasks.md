---
title: タスクコマンド一覧
description: 102 個のタスクコマンドの名称、メニュー分類、引数グループ、対応マニュアル一覧を網羅したリファレンス。
updated: 2026-10-20
---

# タスクコマンド一覧

以下の表は `args.json` に定義されたすべてのタスクキー（Dashboard 資源定義を除く）を網羅しています。**コマンド**は `alas.py` のメソッド名（キャメルケースからスネークケースへ変換）であり、設定内の `Scheduler.Command` の値に対応します。

合計 102 個のタスク。データ取得元：`https://github.com/wess09/AzurPilot` @ `7de6bb9`。

## <DocIcon name="settings" /> システム（`Alas`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 系统设置 | `Alas` | `Emulator` `EmulatorInfo` `Error` `DailySummary` `Optimization` `DropRecord` `Backup` `EmulatorManagement` | [tools](/ja/azurpilot/user/tasks/tools) |
| 通用设置 | `General` | `Log` `Retirement` `OneClickRetire` `Enhance` `OldRetire` `PublicEmotion` `OilControl` `YukikazeTaskManager` | [tools](/ja/azurpilot/user/tasks/tools) |
| 重启设置 | `Restart` | `Restart` | [tools](/ja/azurpilot/user/tasks/tools) |

## <DocIcon name="target" /> 出撃（`Farm`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 主线图-1 | `Main` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 主线图-2 | `Main2` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 主线图-3 | `Main3` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 紧急委托 | `GemsFarming` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 三油低耗 | `ThreeOilLowCost` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 1-1刷伏击(尚不完善) | `Ambush11` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` | [campaign](/ja/azurpilot/user/tasks/campaign) |

## <DocIcon name="star" /> 活动（`Event`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 活动通用设置 | `EventGeneral` | `EventGeneral` `TaskBalancer` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 活动图-1 | `Event` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 活动图-2 | `Event2` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 活动图-3 | `Event3` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 共斗活动 | `Raid` | `Raid` `Campaign` `StopCondition` `Emotion` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 共斗沉船 | `RaidScuttle` | `Raid` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 深谷来信 | `Hospital` | `Hospital` `StopCondition` `Emotion` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 夜勤病栋 | `Coalition` | `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 联盟沉船 | `CoalitionScuttle` | `CoalitionScuttle` `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 商路护航 | `MaritimeEscort` | `MaritimeEscort` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 活动商店 | `EventShop` | `EventShop` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 作战档案 | `WarArchives` | `Campaign` `StopCondition` `WarArchives` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |

## <DocIcon name="calendar" /> 活动-每日任务（`EventDaily`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 每日A图 | `EventA` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 每日B图 | `EventB` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 每日C图 | `EventC` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 每日D图 | `EventD` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 每日SP图 | `EventSp` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 共斗活动每日 | `RaidDaily` | `RaidDaily` `Campaign` `StopCondition` `Emotion` | [campaign](/ja/azurpilot/user/tasks/campaign) |
| 怪谈纪实：逃离白夜山庄SP | `CoalitionSp` | `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/ja/azurpilot/user/tasks/campaign) |

## <DocIcon name="gift" /> 自动收获（`Reward`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 委托 | `Commission` | `Commission` | [daily](/ja/azurpilot/user/tasks/daily) |
| 战术学院 | `Tactical` | `Tactical` `ControlExpOverflow` `AddNewStudent` | [daily](/ja/azurpilot/user/tasks/daily) |
| 科研 | `Research` | `Research` | [daily](/ja/azurpilot/user/tasks/daily) |
| 仓库统计 | `StorageStatistics` | `StorageStatistics` | [daily](/ja/azurpilot/user/tasks/daily) |
| 后宅 | `Dorm` | `Dorm` `BuyFurniture` | [daily](/ja/azurpilot/user/tasks/daily) |
| 指挥喵 | `Meowfficer` | `Meowfficer` `MeowfficerTrain` | [daily](/ja/azurpilot/user/tasks/daily) |
| 大舰队 | `Guild` | `GuildLogistics` `GuildOperation` | [daily](/ja/azurpilot/user/tasks/daily) |
| 收获 | `Reward` | `Reward` | [daily](/ja/azurpilot/user/tasks/daily) |
| 认知觉醒 | `Awaken` | `Awaken` | [daily](/ja/azurpilot/user/tasks/daily) |
| 秘书舰 | `Secretary` | `Secretary` | [daily](/ja/azurpilot/user/tasks/daily) |
| 作战委托 | `OperationHandover` | `Campaign` `OperationHandover` | [daily](/ja/azurpilot/user/tasks/daily) |

## <DocIcon name="clock" /> 每日任务（`DailyMission`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 每日任务 | `Daily` | `Daily` | [daily](/ja/azurpilot/user/tasks/daily) |
| 限界挑战 | `LimitChallenge` | `LimitChallenge` | [daily](/ja/azurpilot/user/tasks/daily) |
| 主线-困难图 | `Hard` | `Hard` | [daily](/ja/azurpilot/user/tasks/daily) |
| 演习 | `Exercise` | `Exercise` | [daily](/ja/azurpilot/user/tasks/daily) |
| 军火商商店 | `ShopFrequent` | `GeneralShop` | [daily](/ja/azurpilot/user/tasks/daily) |
| 其他商店 | `ShopOnce` | `GuildShop` `MedalShop2` `MeritShop` `CoreShop` | [daily](/ja/azurpilot/user/tasks/daily) |
| 开发船坞 | `Shipyard` | `ShipyardDr` `Shipyard` | [daily](/ja/azurpilot/user/tasks/daily) |
| 每日抽卡 | `Gacha` | `Gacha` | [daily](/ja/azurpilot/user/tasks/daily) |
| 白嫖奖励 | `Freebies` | `BattlePass` `DataKey` `Mail` `SupplyPack` | [daily](/ja/azurpilot/user/tasks/daily) |
| 小游戏 | `Minigame` | — | [daily](/ja/azurpilot/user/tasks/daily) |
| 宿舍计划 | `PrivateQuarters` | `PrivateQuarters` | [daily](/ja/azurpilot/user/tasks/daily) |

## <DocIcon name="compass" /> 大世界（`Opsi`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 通用设置 | `OpsiGeneral` | `OpsiGeneral` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| META作战 | `OpsiAshBeacon` | `OpsiAshBeacon` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| META支援 | `OpsiAshAssist` | `OpsiAshAssist` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 每月开荒 | `OpsiExplore` | `OpsiExplore` `OpsiFleet` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 普通海域事件补扫 | `OpsiExploreCleanup` | `OpsiExploreCleanup` `OpsiFleet` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 大世界商店 | `OpsiShop` | `OpsiShop` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 白票商店 | `OpsiVoucher` | `OpsiVoucher` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 大世界每日 | `OpsiDaily` | `OpsiDaily` `OpsiFleet` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 隐秘海域 | `OpsiObscure` | `OpsiObscure` `OpsiFleet` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 深渊坐标 | `OpsiAbyssal` | `OpsiAbyssal` `OpsiFleetFilter` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 档案坐标 | `OpsiArchive` | `OpsiFleet` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 塞壬要塞 | `OpsiStronghold` | `OpsiStronghold` `OpsiFleetFilter` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 月度Boss | `OpsiMonthBoss` | `OpsiMonthBoss` `OpsiFleetFilter` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 耄耋相接 | `OpsiMeowfficerFarming` | `OpsiMeowfficerFarming` `OpsiSirenBug` `OpsiTarget` `OpsiFleet` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 侵蚀1练级 | `OpsiHazard1Leveling` | `OpsiHazard1Leveling` `OpsiSirenBug` `OpsiFleet` `OpsiCheckLeveling` `OpsiFleetAutoChange` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 智能调度 | `OpsiScheduling` | `OpsiScheduling` `OpsiSmartExplore` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 防止行动力溢出 | `OpsiPreventActionPointOverflow` | `OpsiPreventActionPointOverflow` | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 跨月每日 | `OpsiCrossMonth` | — | [opsi](/ja/azurpilot/user/tasks/opsi) |
| 大世界模拟器 Alpha | `OpsiSimulator` | `OpsiSimulatorParameters` | [opsi](/ja/azurpilot/user/tasks/opsi) |

## <DocIcon name="sparkles" /> 赤石计划（`Island`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 全局配置 | `IslandPlan` | `IslandPlan` `IslandWalk` | [island](/ja/azurpilot/user/tasks/island) |
| 经营模块 | `IslandBusiness` | `IslandBusiness` `IslandBusinessShop1` `IslandBusinessShop2` `IslandBusinessShop3` `IslandBusinessShop4` `IslandBusinessShop5` | [island](/ja/azurpilot/user/tasks/island) |
| 农田 | `IslandFarm` | `IslandFarm` `IslandOrchard` `IslandNursery` | [island](/ja/azurpilot/user/tasks/island) |
| 牧场 | `IslandRancher` | `IslandRancher` `IslandFishery` | [island](/ja/azurpilot/user/tasks/island) |
| 矿山林场 | `IslandMineForest` | `IslandMine` `IslandForest` | [island](/ja/azurpilot/user/tasks/island) |
| 有鱼餐馆 | `IslandRestaurant` | `IslandRestaurant` `IslandRestaurantNextTask` | [island](/ja/azurpilot/user/tasks/island) |
| 白熊饮品 | `IslandTeahouse` | `IslandTeahouse` `IslandTeahouseNextTask` | [island](/ja/azurpilot/user/tasks/island) |
| 乌鱼烤肉 | `IslandGrill` | `IslandGrill` `IslandGrillNextTask` | [island](/ja/azurpilot/user/tasks/island) |
| 啾啾简餐 | `IslandJuuEatery` | `IslandJuuEatery` `IslandJuuEateryNextTask` | [island](/ja/azurpilot/user/tasks/island) |
| 啾咖啡 | `IslandJuuCoffee` | `IslandJuuCoffee` `IslandJuuCoffeeNextTask` | [island](/ja/azurpilot/user/tasks/island) |
| 制造业 | `IslandManufacture` | `WoodProcessing` `ElectronicProcessing` `Industrial` `Handmade` | [island](/ja/azurpilot/user/tasks/island) |
| 每日采集 | `IslandDailyGather` | `IslandDailyGather` | [island](/ja/azurpilot/user/tasks/island) |
| 每日补给 | `IslandAirDrop` | `IslandAirDrop` | [island](/ja/azurpilot/user/tasks/island) |
| 货物筹备 | `IslandCargoPreparation` | `IslandCargoPreparation` | [island](/ja/azurpilot/user/tasks/island) |
| 每日订单 | `IslandDailyOrder` | `IslandDailyOrder` | [island](/ja/azurpilot/user/tasks/island) |
| 每日/周任务 | `IslandDailyInteract` | `IslandDailyInteract` | [island](/ja/azurpilot/user/tasks/island) |
| 每周珍珠采购与售卖 | `IslandPearlSell` | `IslandPearlSell` | [island](/ja/azurpilot/user/tasks/island) |

## <DocIcon name="handshake" /> 舰队管理（`FleetManagement`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 舰队信息 | `FleetInfo` | `FleetInfo` | [tools](/ja/azurpilot/user/tasks/tools) |

## <DocIcon name="clock" /> 运行参数（`RunParams`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 运行参数 | `RunParams` | `Watchdog` `Reboot` `Device` `ScreenRecord` `UiWait` `Handover` | [tools](/ja/azurpilot/user/tasks/tools) |

## 工具（`Tool`）

| タスク | コマンド | 引数グループ | マニュアル |
| --- | --- | --- | --- |
| 心智单元船坞扫描 | `MindCalculatorScan` | `MindCalculator` | [tools](/ja/azurpilot/user/tasks/tools) |
| 舰船科技扫描 | `FleetTechScan` | `FleetTech` | [tools](/ja/azurpilot/user/tasks/tools) |
| 半自动点击 | `Daemon` | `Daemon` | [tools](/ja/azurpilot/user/tasks/tools) |
| 大世界半自动 | `OpsiDaemon` | `OpsiDaemon` | [tools](/ja/azurpilot/user/tasks/tools) |
| 活动剧情 | `EventStory` | `EventStory` | [tools](/ja/azurpilot/user/tasks/tools) |
| 拆装备箱 | `BoxDisassemble` | `BoxDisassemble` | [tools](/ja/azurpilot/user/tasks/tools) |
| 自动装备 | `AutoEquip` | `AutoEquip` | [tools](/ja/azurpilot/user/tasks/tools) |
| 性能测试 | `Benchmark` | `Benchmark` | [tools](/ja/azurpilot/user/tasks/tools) |
| OCR性能测试 | `OcrBenchmark` | `OcrBenchmark` | [tools](/ja/azurpilot/user/tasks/tools) |
| 反和谐 | `AzurLaneUncensored` | `AzurLaneUncensored` | [tools](/ja/azurpilot/user/tasks/tools) |
| 游戏管理器(未完成) | `GameManager` | `GameManager` | [tools](/ja/azurpilot/user/tasks/tools) |
| 模拟器管理器 | `EmulatorManager` | `EmulatorManager` | [tools](/ja/azurpilot/user/tasks/tools) |
| 指挥喵评分 | `MeowfficerScore` | `MeowfficerScore` | [tools](/ja/azurpilot/user/tasks/tools) |

## 設定ファイルに存在しメニューに未登録のタスク

以下のタスクは `args.json` に定義されていますが、`task.yaml` のメニューには表示されません。これらは API や内部処理からトリガーされる可能性があり、現在の WebUI には直接露出していません。

| タスク | コマンド | 引数グループ | 状態 |
| --- | --- | --- | --- |
| 舰队扫描 | `FleetScan` | — | メニュー非表示（要確認） |

## 補足説明

### 引数グループ

各タスクの「引数グループ」は、`task.yaml` において参照されているオプション設定グループです。`Scheduler`（有効化・時刻・間隔）および `Storage`（統計テーブルの保存先）はほぼ全タスクに共通するため、表内では省略しています。

### メニュー名とコマンド名の違い

メニュー名（例：「主線図-1」）は UI 上の表示名にすぎません。コマンド（例：`Main`）がスケジューラーや API で実際に使用される識別子です。`tasks.run` や `trigger_task` ではコマンド名を指定します。

### イベント系タスクの有効期限

`Hospital`、`Coalition`、`CoalitionSp` 等は特定イベント専用の処理フローです。イベント期間終了後は、有効化されていても処理はスキップされます。イベント仕様の変更に伴いタスクは追加・削除されるため、お使いのバージョンの `task.yaml` に準拠します。

