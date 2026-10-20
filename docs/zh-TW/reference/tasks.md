---
title: 任務命令總表
description: 102 個任務命令的中文名、菜單分組、參陣列與手冊連結，由倉庫配置在構建期生成。
updated: 2026-10-20
---

# 任務命令總表

下表覆蓋 `args.json` 中的全部任務鍵（不含 Dashboard 資源定義）。**命令**是 `alas.py` 的方法名（駝峰轉下劃線），也是配置裡 `Scheduler.Command` 的值。

共 102 個任務。數據來源：`https://github.com/wess09/AzurPilot` @ `7de6bb9`。

## <DocIcon name="settings" /> 系統（`Alas`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 系統設定 | `Alas` | `Emulator` `EmulatorInfo` `Error` `DailySummary` `Optimization` `DropRecord` `Backup` `EmulatorManagement` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 通用設定 | `General` | `Log` `Retirement` `OneClickRetire` `Enhance` `OldRetire` `PublicEmotion` `OilControl` `YukikazeTaskManager` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 重新啟動設定 | `Restart` | `Restart` | [tools](/zh-TW/azurpilot/user/tasks/tools) |

## <DocIcon name="target" /> 出擊（`Farm`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 主線圖-1 | `Main` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 主線圖-2 | `Main2` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 主線圖-3 | `Main3` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 緊急委託 | `GemsFarming` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 三油低耗 | `ThreeOilLowCost` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 1-1刷伏擊(尚不完善) | `Ambush11` | `GemsFarming` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |

## <DocIcon name="star" /> 活動（`Event`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 活動通用設定 | `EventGeneral` | `EventGeneral` `TaskBalancer` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 活動圖-1 | `Event` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 活動圖-2 | `Event2` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 活動圖-3 | `Event3` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 共鬥活動 | `Raid` | `Raid` `Campaign` `StopCondition` `Emotion` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 共鬥沉船 | `RaidScuttle` | `Raid` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 深谷來信 | `Hospital` | `Hospital` `StopCondition` `Emotion` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 夜勤病棟 | `Coalition` | `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 聯盟沉船 | `CoalitionScuttle` | `CoalitionScuttle` `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 商路護航 | `MaritimeEscort` | `MaritimeEscort` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 活動商店 | `EventShop` | `EventShop` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 作戰檔案 | `WarArchives` | `Campaign` `StopCondition` `WarArchives` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |

## <DocIcon name="calendar" /> 活動-每日任務（`EventDaily`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 每日A圖 | `EventA` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 每日B圖 | `EventB` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 每日C圖 | `EventC` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 每日D圖 | `EventD` | `EventDaily` `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 每日SP圖 | `EventSp` | `Campaign` `StopCondition` `Fleet` `Submarine` `Emotion` `HpControl` `EnemyPriority` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 共鬥活動每日 | `RaidDaily` | `RaidDaily` `Campaign` `StopCondition` `Emotion` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |
| 怪談紀實：逃離白夜山莊SP | `CoalitionSp` | `Campaign` `Coalition` `StopCondition` `Emotion` | [campaign](/zh-TW/azurpilot/user/tasks/campaign) |

## <DocIcon name="gift" /> 自動收穫（`Reward`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 委託 | `Commission` | `Commission` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 戰術學院 | `Tactical` | `Tactical` `ControlExpOverflow` `AddNewStudent` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 科研 | `Research` | `Research` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 倉庫統計 | `StorageStatistics` | `StorageStatistics` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 後宅 | `Dorm` | `Dorm` `BuyFurniture` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 指揮喵 | `Meowfficer` | `Meowfficer` `MeowfficerTrain` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 大艦隊 | `Guild` | `GuildLogistics` `GuildOperation` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 收穫 | `Reward` | `Reward` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 認知覺醒 | `Awaken` | `Awaken` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 秘書艦 | `Secretary` | `Secretary` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 作戰委託 | `OperationHandover` | `Campaign` `OperationHandover` | [daily](/zh-TW/azurpilot/user/tasks/daily) |

## <DocIcon name="clock" /> 每日任務（`DailyMission`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 每日任務 | `Daily` | `Daily` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 限界挑戰 | `LimitChallenge` | `LimitChallenge` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 主線-困難圖 | `Hard` | `Hard` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 演習 | `Exercise` | `Exercise` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 軍火商商店 | `ShopFrequent` | `GeneralShop` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 其他商店 | `ShopOnce` | `GuildShop` `MedalShop2` `MeritShop` `CoreShop` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 開發船塢 | `Shipyard` | `ShipyardDr` `Shipyard` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 每日抽卡 | `Gacha` | `Gacha` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 白嫖獎勵 | `Freebies` | `BattlePass` `DataKey` `Mail` `SupplyPack` | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 小遊戲 | `Minigame` | — | [daily](/zh-TW/azurpilot/user/tasks/daily) |
| 宿舍計劃 | `PrivateQuarters` | `PrivateQuarters` | [daily](/zh-TW/azurpilot/user/tasks/daily) |

## <DocIcon name="compass" /> 大世界（`Opsi`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 通用設定 | `OpsiGeneral` | `OpsiGeneral` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| META作戰 | `OpsiAshBeacon` | `OpsiAshBeacon` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| META支援 | `OpsiAshAssist` | `OpsiAshAssist` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 每月開荒 | `OpsiExplore` | `OpsiExplore` `OpsiFleet` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 普通海域事件補掃 | `OpsiExploreCleanup` | `OpsiExploreCleanup` `OpsiFleet` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 大世界商店 | `OpsiShop` | `OpsiShop` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 白票商店 | `OpsiVoucher` | `OpsiVoucher` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 大世界每日 | `OpsiDaily` | `OpsiDaily` `OpsiFleet` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 隱秘海域 | `OpsiObscure` | `OpsiObscure` `OpsiFleet` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 深淵座標 | `OpsiAbyssal` | `OpsiAbyssal` `OpsiFleetFilter` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 檔案座標 | `OpsiArchive` | `OpsiFleet` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 塞壬要塞 | `OpsiStronghold` | `OpsiStronghold` `OpsiFleetFilter` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 月度Boss | `OpsiMonthBoss` | `OpsiMonthBoss` `OpsiFleetFilter` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 耄耋相接 | `OpsiMeowfficerFarming` | `OpsiMeowfficerFarming` `OpsiSirenBug` `OpsiTarget` `OpsiFleet` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 侵蝕1練級 | `OpsiHazard1Leveling` | `OpsiHazard1Leveling` `OpsiSirenBug` `OpsiFleet` `OpsiCheckLeveling` `OpsiFleetAutoChange` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 智能排程 | `OpsiScheduling` | `OpsiScheduling` `OpsiSmartExplore` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 防止行動力溢出 | `OpsiPreventActionPointOverflow` | `OpsiPreventActionPointOverflow` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 跨月每日 | `OpsiCrossMonth` | — | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |
| 大世界模擬器 Alpha | `OpsiSimulator` | `OpsiSimulatorParameters` | [opsi](/zh-TW/azurpilot/user/tasks/opsi) |

## <DocIcon name="sparkles" /> 赤石計劃（`Island`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 全局配置 | `IslandPlan` | `IslandPlan` `IslandWalk` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 經營模組 | `IslandBusiness` | `IslandBusiness` `IslandBusinessShop1` `IslandBusinessShop2` `IslandBusinessShop3` `IslandBusinessShop4` `IslandBusinessShop5` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 農田 | `IslandFarm` | `IslandFarm` `IslandOrchard` `IslandNursery` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 牧場 | `IslandRancher` | `IslandRancher` `IslandFishery` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 礦山林場 | `IslandMineForest` | `IslandMine` `IslandForest` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 有魚餐館 | `IslandRestaurant` | `IslandRestaurant` `IslandRestaurantNextTask` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 白熊飲品 | `IslandTeahouse` | `IslandTeahouse` `IslandTeahouseNextTask` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 烏魚烤肉 | `IslandGrill` | `IslandGrill` `IslandGrillNextTask` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 啾啾簡餐 | `IslandJuuEatery` | `IslandJuuEatery` `IslandJuuEateryNextTask` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 啾咖啡 | `IslandJuuCoffee` | `IslandJuuCoffee` `IslandJuuCoffeeNextTask` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 製造業 | `IslandManufacture` | `WoodProcessing` `ElectronicProcessing` `Industrial` `Handmade` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 每日採集 | `IslandDailyGather` | `IslandDailyGather` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 每日補給 | `IslandAirDrop` | `IslandAirDrop` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 貨物籌備 | `IslandCargoPreparation` | `IslandCargoPreparation` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 每日訂單 | `IslandDailyOrder` | `IslandDailyOrder` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 每日/周任務 | `IslandDailyInteract` | `IslandDailyInteract` | [island](/zh-TW/azurpilot/user/tasks/island) |
| 每週珍珠採購與售賣 | `IslandPearlSell` | `IslandPearlSell` | [island](/zh-TW/azurpilot/user/tasks/island) |

## <DocIcon name="handshake" /> 艦隊管理（`FleetManagement`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 艦隊資訊 | `FleetInfo` | `FleetInfo` | [tools](/zh-TW/azurpilot/user/tasks/tools) |

## <DocIcon name="clock" /> 執行參數（`RunParams`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 執行參數 | `RunParams` | `Watchdog` `Reboot` `Device` `ScreenRecord` `UiWait` `Handover` | [tools](/zh-TW/azurpilot/user/tasks/tools) |

## 工具（`Tool`）

| 任務 | 命令 | 參陣列 | 手冊 |
| --- | --- | --- | --- |
| 心智單元船塢掃描 | `MindCalculatorScan` | `MindCalculator` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 艦船科技掃描 | `FleetTechScan` | `FleetTech` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 半自動點擊 | `Daemon` | `Daemon` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 大世界半自動 | `OpsiDaemon` | `OpsiDaemon` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 活動劇情 | `EventStory` | `EventStory` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 拆裝備箱 | `BoxDisassemble` | `BoxDisassemble` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 自動裝備 | `AutoEquip` | `AutoEquip` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 性能測試 | `Benchmark` | `Benchmark` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| OCR性能測試 | `OcrBenchmark` | `OcrBenchmark` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 反和諧 | `AzurLaneUncensored` | `AzurLaneUncensored` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 遊戲管理器(未完成) | `GameManager` | `GameManager` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 模擬器管理器 | `EmulatorManager` | `EmulatorManager` | [tools](/zh-TW/azurpilot/user/tasks/tools) |
| 指揮喵評分 | `MeowfficerScore` | `MeowfficerScore` | [tools](/zh-TW/azurpilot/user/tasks/tools) |

## 配置中存在、菜單未登記的任務

以下任務在 `args.json` 中有定義，但沒有出現在 `task.yaml` 的菜單裡。它們可能由 API 或內部調用觸發，當前 WebUI 不直接暴露。說明文件不為其編造操作步驟。

| 任務 | 命令 | 參陣列 | 狀態 |
| --- | --- | --- | --- |
| 艦隊掃描 | `FleetScan` | — | 未在菜單暴露（待核實） |

## 說明

### 參陣列

每個任務的「其他參陣列」是它在 `task.yaml` 中引用的選項組。`Scheduler` 提供啟用、時間與間隔，`Storage` 決定統計寫入哪張表，表裡省略了這兩組。

### 菜單名與命令不是一回事

菜單名（如「主線圖-1」）只用於顯示；命令（如 `Main`）是排程器與 API 使用的標識。`tasks.run`、`trigger_task` 都傳命令。

### 活動任務的時效

`Hospital`、`Coalition`、`CoalitionSp` 等是特定活動的專用流程。活動結束後即使啟用也不會執行。活動適配會增刪任務，以你當前版本的 `task.yaml` 為準。

