---
title: 任务命令总表
description: 102 个任务命令的中文名、菜单分组、参数组与手册链接，由仓库配置在构建期生成。
updated: 2026-10-20
---

# 任务命令总表

下表覆盖 `args.json` 中的全部任务键（不含 Dashboard 资源定义）。**命令**是 `alas.py` 的方法名（驼峰转下划线），也是配置里 `Scheduler.Command` 的值。

共 102 个任务。数据来源：`https://github.com/wess09/AzurPilot` @ `7de6bb9`。

## <DocIcon name="settings" /> 系统（`Alas`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 系统设置 | `Alas` | `Emulator` `EmulatorInfo` `Error` `DailySummary` `Optimization` `DropRecord` `Backup` `EmulatorManagement` | [tools](/azurpilot/user/tasks/tools) |
| 通用设置 | `General` | `Log` `Retirement` `OneClickRetire` `Enhance` `OldRetire` `PublicEmotion` `OilControl` `YukikazeTaskManager` | [tools](/azurpilot/user/tasks/tools) |
| 重启设置 | `Restart` | `Restart` | [tools](/azurpilot/user/tasks/tools) |

## <DocIcon name="target" /> 出击（`Farm`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 主线图-1 | `Main` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 主线图-2 | `Main2` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 主线图-3 | `Main3` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 紧急委托 | `GemsFarming` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 三油低耗 | `ThreeOilLowCost` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 1-1刷伏击(尚不完善) | `Ambush11` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` | [campaign](/azurpilot/user/tasks/campaign) |

## <DocIcon name="star" /> 活动（`Event`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 活动通用设置 | `EventGeneral` | `EventGeneral` `TaskBalancer` | [campaign](/azurpilot/user/tasks/campaign) |
| 活动图-1 | `Event` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 活动图-2 | `Event2` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 活动图-3 | `Event3` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 共斗活动 | `Raid` | `Raid` `Campaign` `StopCondition` `Emotion` | [campaign](/azurpilot/user/tasks/campaign) |
| 共斗沉船 | `RaidScuttle` | `Raid` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` | [campaign](/azurpilot/user/tasks/campaign) |
| 深谷来信 | `Hospital` | `Hospital` `StopCondition` `Emotion` | [campaign](/azurpilot/user/tasks/campaign) |
| 夜勤病栋 | `Coalition` | `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/azurpilot/user/tasks/campaign) |
| 联盟沉船 | `CoalitionScuttle` | `CoalitionScuttle` `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/azurpilot/user/tasks/campaign) |
| 商路护航 | `MaritimeEscort` | `MaritimeEscort` | [campaign](/azurpilot/user/tasks/campaign) |
| 活动商店 | `EventShop` | `EventShop` | [campaign](/azurpilot/user/tasks/campaign) |
| 作战档案 | `WarArchives` | `Campaign` `StopCondition` `WarArchives` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |

## <DocIcon name="calendar" /> 活动-每日任务（`EventDaily`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 每日A图 | `EventA` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 每日B图 | `EventB` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 每日C图 | `EventC` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 每日D图 | `EventD` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 每日SP图 | `EventSp` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/azurpilot/user/tasks/campaign) |
| 共斗活动每日 | `RaidDaily` | `RaidDaily` `Campaign` `StopCondition` `Emotion` | [campaign](/azurpilot/user/tasks/campaign) |
| 怪谈纪实：逃离白夜山庄SP | `CoalitionSp` | `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/azurpilot/user/tasks/campaign) |

## <DocIcon name="gift" /> 自动收获（`Reward`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 委托 | `Commission` | `Commission` | [daily](/azurpilot/user/tasks/daily) |
| 战术学院 | `Tactical` | `Tactical` `ControlExpOverflow` `AddNewStudent` | [daily](/azurpilot/user/tasks/daily) |
| 科研 | `Research` | `Research` | [daily](/azurpilot/user/tasks/daily) |
| 仓库统计 | `StorageStatistics` | `StorageStatistics` | [daily](/azurpilot/user/tasks/daily) |
| 后宅 | `Dorm` | `Dorm` `BuyFurniture` | [daily](/azurpilot/user/tasks/daily) |
| 指挥喵 | `Meowfficer` | `Meowfficer` `MeowfficerTrain` | [daily](/azurpilot/user/tasks/daily) |
| 大舰队 | `Guild` | `GuildLogistics` `GuildOperation` | [daily](/azurpilot/user/tasks/daily) |
| 收获 | `Reward` | `Reward` | [daily](/azurpilot/user/tasks/daily) |
| 认知觉醒 | `Awaken` | `Awaken` | [daily](/azurpilot/user/tasks/daily) |
| 秘书舰 | `Secretary` | `Secretary` | [daily](/azurpilot/user/tasks/daily) |
| 作战委托 | `OperationHandover` | `Campaign` `OperationHandover` | [daily](/azurpilot/user/tasks/daily) |

## <DocIcon name="clock" /> 每日任务（`DailyMission`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 每日任务 | `Daily` | `Daily` | [daily](/azurpilot/user/tasks/daily) |
| 限界挑战 | `LimitChallenge` | `LimitChallenge` | [daily](/azurpilot/user/tasks/daily) |
| 主线-困难图 | `Hard` | `Hard` | [daily](/azurpilot/user/tasks/daily) |
| 演习 | `Exercise` | `Exercise` | [daily](/azurpilot/user/tasks/daily) |
| 军火商商店 | `ShopFrequent` | `GeneralShop` | [daily](/azurpilot/user/tasks/daily) |
| 其他商店 | `ShopOnce` | `GuildShop` `MedalShop2` `MeritShop` `CoreShop` | [daily](/azurpilot/user/tasks/daily) |
| 开发船坞 | `Shipyard` | `ShipyardDr` `Shipyard` | [daily](/azurpilot/user/tasks/daily) |
| 每日抽卡 | `Gacha` | `Gacha` | [daily](/azurpilot/user/tasks/daily) |
| 白嫖奖励 | `Freebies` | `BattlePass` `DataKey` `Mail` `SupplyPack` | [daily](/azurpilot/user/tasks/daily) |
| 小游戏 | `Minigame` | — | [daily](/azurpilot/user/tasks/daily) |
| 宿舍计划 | `PrivateQuarters` | `PrivateQuarters` | [daily](/azurpilot/user/tasks/daily) |

## <DocIcon name="compass" /> 大世界（`Opsi`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 通用设置 | `OpsiGeneral` | `OpsiGeneral` | [opsi](/azurpilot/user/tasks/opsi) |
| META作战 | `OpsiAshBeacon` | `OpsiAshBeacon` | [opsi](/azurpilot/user/tasks/opsi) |
| META支援 | `OpsiAshAssist` | `OpsiAshAssist` | [opsi](/azurpilot/user/tasks/opsi) |
| 每月开荒 | `OpsiExplore` | `OpsiExplore` `OpsiFleet` | [opsi](/azurpilot/user/tasks/opsi) |
| 普通海域事件补扫 | `OpsiExploreCleanup` | `OpsiExploreCleanup` `OpsiFleet` | [opsi](/azurpilot/user/tasks/opsi) |
| 大世界商店 | `OpsiShop` | `OpsiShop` | [opsi](/azurpilot/user/tasks/opsi) |
| 白票商店 | `OpsiVoucher` | `OpsiVoucher` | [opsi](/azurpilot/user/tasks/opsi) |
| 大世界每日 | `OpsiDaily` | `OpsiDaily` `OpsiFleet` | [opsi](/azurpilot/user/tasks/opsi) |
| 隐秘海域 | `OpsiObscure` | `OpsiObscure` `OpsiFleet` | [opsi](/azurpilot/user/tasks/opsi) |
| 深渊坐标 | `OpsiAbyssal` | `OpsiAbyssal` `OpsiFleetFilter` | [opsi](/azurpilot/user/tasks/opsi) |
| 档案坐标 | `OpsiArchive` | `OpsiFleet` | [opsi](/azurpilot/user/tasks/opsi) |
| 塞壬要塞 | `OpsiStronghold` | `OpsiStronghold` `OpsiFleetFilter` | [opsi](/azurpilot/user/tasks/opsi) |
| 月度Boss | `OpsiMonthBoss` | `OpsiMonthBoss` `OpsiFleetFilter` | [opsi](/azurpilot/user/tasks/opsi) |
| 耄耋相接 | `OpsiMeowfficerFarming` | `OpsiMeowfficerFarming` `OpsiSirenBug` `OpsiTarget` `OpsiFleet` | [opsi](/azurpilot/user/tasks/opsi) |
| 侵蚀1练级 | `OpsiHazard1Leveling` | `OpsiHazard1Leveling` `OpsiSirenBug` `OpsiFleet` `OpsiCheckLeveling` `OpsiFleetAutoChange` | [opsi](/azurpilot/user/tasks/opsi) |
| 智能调度 | `OpsiScheduling` | `OpsiScheduling` `OpsiSmartExplore` | [opsi](/azurpilot/user/tasks/opsi) |
| 防止行动力溢出 | `OpsiPreventActionPointOverflow` | `OpsiPreventActionPointOverflow` | [opsi](/azurpilot/user/tasks/opsi) |
| 跨月每日 | `OpsiCrossMonth` | — | [opsi](/azurpilot/user/tasks/opsi) |
| 大世界模拟器 Alpha | `OpsiSimulator` | `OpsiSimulatorParameters` | [opsi](/azurpilot/user/tasks/opsi) |

## <DocIcon name="sparkles" /> 赤石计划（`Island`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 全局配置 | `IslandPlan` | `IslandPlan` `IslandWalk` | [island](/azurpilot/user/tasks/island) |
| 经营模块 | `IslandBusiness` | `IslandBusiness` `IslandBusinessShop1` `IslandBusinessShop2` `IslandBusinessShop3` `IslandBusinessShop4` `IslandBusinessShop5` | [island](/azurpilot/user/tasks/island) |
| 农田 | `IslandFarm` | `IslandFarm` `IslandOrchard` `IslandNursery` | [island](/azurpilot/user/tasks/island) |
| 牧场 | `IslandRancher` | `IslandRancher` `IslandFishery` | [island](/azurpilot/user/tasks/island) |
| 矿山林场 | `IslandMineForest` | `IslandMine` `IslandForest` | [island](/azurpilot/user/tasks/island) |
| 有鱼餐馆 | `IslandRestaurant` | `IslandRestaurant` `IslandRestaurantNextTask` | [island](/azurpilot/user/tasks/island) |
| 白熊饮品 | `IslandTeahouse` | `IslandTeahouse` `IslandTeahouseNextTask` | [island](/azurpilot/user/tasks/island) |
| 乌鱼烤肉 | `IslandGrill` | `IslandGrill` `IslandGrillNextTask` | [island](/azurpilot/user/tasks/island) |
| 啾啾简餐 | `IslandJuuEatery` | `IslandJuuEatery` `IslandJuuEateryNextTask` | [island](/azurpilot/user/tasks/island) |
| 啾咖啡 | `IslandJuuCoffee` | `IslandJuuCoffee` `IslandJuuCoffeeNextTask` | [island](/azurpilot/user/tasks/island) |
| 制造业 | `IslandManufacture` | `WoodProcessing` `ElectronicProcessing` `Industrial` `Handmade` | [island](/azurpilot/user/tasks/island) |
| 每日采集 | `IslandDailyGather` | `IslandDailyGather` | [island](/azurpilot/user/tasks/island) |
| 每日补给 | `IslandAirDrop` | `IslandAirDrop` | [island](/azurpilot/user/tasks/island) |
| 货物筹备 | `IslandCargoPreparation` | `IslandCargoPreparation` | [island](/azurpilot/user/tasks/island) |
| 每日订单 | `IslandDailyOrder` | `IslandDailyOrder` | [island](/azurpilot/user/tasks/island) |
| 每日/周任务 | `IslandDailyInteract` | `IslandDailyInteract` | [island](/azurpilot/user/tasks/island) |
| 每周珍珠采购与售卖 | `IslandPearlSell` | `IslandPearlSell` | [island](/azurpilot/user/tasks/island) |

## <DocIcon name="handshake" /> 舰队管理（`FleetManagement`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 舰队信息 | `FleetInfo` | `FleetInfo` | [tools](/azurpilot/user/tasks/tools) |

## <DocIcon name="clock" /> 运行参数（`RunParams`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 运行参数 | `RunParams` | `Watchdog` `Reboot` `Device` `ScreenRecord` `UiWait` `Handover` | [tools](/azurpilot/user/tasks/tools) |

## 工具（`Tool`）

| 任务 | 命令 | 参数组 | 手册 |
| --- | --- | --- | --- |
| 心智单元船坞扫描 | `MindCalculatorScan` | `MindCalculator` | [tools](/azurpilot/user/tasks/tools) |
| 舰船科技扫描 | `FleetTechScan` | `FleetTech` | [tools](/azurpilot/user/tasks/tools) |
| 半自动点击 | `Daemon` | `Daemon` | [tools](/azurpilot/user/tasks/tools) |
| 大世界半自动 | `OpsiDaemon` | `OpsiDaemon` | [tools](/azurpilot/user/tasks/tools) |
| 活动剧情 | `EventStory` | `EventStory` | [tools](/azurpilot/user/tasks/tools) |
| 拆装备箱 | `BoxDisassemble` | `BoxDisassemble` | [tools](/azurpilot/user/tasks/tools) |
| 自动装备 | `AutoEquip` | `AutoEquip` | [tools](/azurpilot/user/tasks/tools) |
| 性能测试 | `Benchmark` | `Benchmark` | [tools](/azurpilot/user/tasks/tools) |
| OCR性能测试 | `OcrBenchmark` | `OcrBenchmark` | [tools](/azurpilot/user/tasks/tools) |
| 反和谐 | `AzurLaneUncensored` | `AzurLaneUncensored` | [tools](/azurpilot/user/tasks/tools) |
| 游戏管理器(未完成) | `GameManager` | `GameManager` | [tools](/azurpilot/user/tasks/tools) |
| 模拟器管理器 | `EmulatorManager` | `EmulatorManager` | [tools](/azurpilot/user/tasks/tools) |
| 指挥喵评分 | `MeowfficerScore` | `MeowfficerScore` | [tools](/azurpilot/user/tasks/tools) |

## 配置中存在、菜单未登记的任务

以下任务在 `args.json` 中有定义，但没有出现在 `task.yaml` 的菜单里。它们可能由 API 或内部调用触发，当前 WebUI 不直接暴露。文档不为其编造操作步骤。

| 任务 | 命令 | 参数组 | 状态 |
| --- | --- | --- | --- |
| 舰队扫描 | `FleetScan` | — | 未在菜单暴露（待核实） |

## 说明

### 参数组

每个任务的「其他参数组」是它在 `task.yaml` 中引用的选项组。`Scheduler` 提供启用、时间与间隔，`Storage` 决定统计写入哪张表，表里省略了这两组。

### 菜单名与命令不是一回事

菜单名（如「主线图-1」）只用于显示；命令（如 `Main`）是调度器与 API 使用的标识。`tasks.run`、`trigger_task` 都传命令。

### 活动任务的时效

`Hospital`、`Coalition`、`CoalitionSp` 等是特定活动的专用流程。活动结束后即使启用也不会运行。活动适配会增删任务，以你当前版本的 `task.yaml` 为准。

