---
title: 日常與資源
description: 委託、科研、後宅、指揮喵、大艦隊、每日任務、演習、商店與研發船塢的配置要點與獎勵領取邏輯。
updated: 2026-10-20
---

# 日常與資源

日常類任務的特點是：單個耗時短、失敗代價低、但漏做會持續損失收益。建議全部啟用，並按伺服器刷新時間排期。

## <DocIcon name="gift" /> 一鍵收穫（`Reward`）

把主介面上所有可領的東西點一遍。

| 字段 | 説明 |
| --- | --- |
| `CollectOil` | 領取石油 |
| `CollectCoin` | 領取物資 |
| `CollectExp` | 領取經驗 |
| `CollectMission` | 領取任務獎勵 |
| `CollectWeeklyMission` | 領取周常獎勵 |

推薦全開。它是所有任務裏最安全的一個，適合作為安裝後的第一次驗證。

## <DocIcon name="scroll" /> 委託（`Commission`）

| 項 | 説明 |
| --- | --- |
| 用途 | 自動派遣、收取委託，優先高價值委託 |
| 前置 | 委託欄位已解鎖（隨等級） |
| 關鍵配置 | `PresetFilter`（預設策略）、`DynamicProgramming`（動態規劃選委託）、`DoMajorCommission`（是否做大型委託） |
| 高級 | `TierValueRatio`、`DelayHalfLife`、`DeadlineFutureHorizon` 控制收益/時間權衡 |
| 通知 | `CommissionNotifyReward`、`DetectShipDrop`、`GemNotify` 可推送稀有獎勵與鑽石委託 |
| 驗證 | 委託列表出現新派遣；日誌有「收取 / 派遣」記錄 |

`NoFreeShipPolicy` 與 `AutoPickShip` 控制船塢滿時的處理策略。船塢吃緊時務必配置，否則會因為無法接收艦船而卡住。

## <DocIcon name="flask" /> 科研（`Research`）

| 項 | 説明 |
| --- | --- |
| 用途 | 選擇科研項目、收取、開始下一項 |
| 前置 | 科研系統已解鎖；至少有一個可用隊列 |
| 關鍵配置 | `UseCube`（是否用魔方加速）、`UseCoin`（是否用物資）、`UsePart`（是否用部件） |
| 項目選擇 | `PresetFilter` 選預設（如「艦裝解析優先」），`CustomFilter` 自定義 |
| 延遲 | `AllowDelay` 允許為了等更好的項目而空轉 |
| 驗證 | 科研隊列有進行中的項目；日誌顯示項目名與剩餘時間 |

::: tip 鑽石不要隨便開
`UseCube` 使用魔方（快速完成），不是鑽石。真正花鑽石的加速在遊戲內需要手動確認，腳本不會自動花鑽石。
:::

## <DocIcon name="brain" /> 戰術學院（`Tactical`）

| 字段 | 説明 |
| --- | --- |
| `TacticalFilter` | 選擇要訓練的技能 |
| `RapidTrainingSlot` | 是否使用快速訓練位 |
| `SkillAutoSwitch` | 技能滿級後自動換下一個 |
| `ControlExpOverflow` | 控制經驗溢出（可分別允許 T4/T3/T2/T1 教材） |
| `AddNewStudent` | 自動補充學員，`MinLevel` / `MaxLevel` 限定範圍 |

## <DocIcon name="sparkles" /> 後宅（`Dorm`）

| 字段 | 説明 |
| --- | --- |
| `Collect` | 收取後宅物資與經驗 |
| `Feed` | 補充食物 |
| `FeedFilter` | 選擇食物優先級 |
| `ReserveFood` | 保留食物數量 |
| `BuyFood` | 食物不足時購買 |
| `BuyFurniture.Enable` | 自動購買傢俱（可選） |

食物耗盡會導致後宅經驗停擺，`ReserveFood` 不要設得過高。

## <DocIcon name="crown" /> 指揮喵（`Meowfficer`）

| 字段 | 説明 |
| --- | --- |
| `BuyAmount` | 購買指揮喵箱子的數量 |
| `FortChoreMeowfficer` | 要塞任務使用的指揮喵 |
| `MeowfficerTrain.Enable` | 自動訓練 |
| `MeowfficerTrain.Mode` | 訓練策略 |
| `ScoreTalents` / `ScoreThreshold` | 按天賦評分，低於閾值不保留 |
| `MaxFeedLevel` | 餵養上限 |

「工具 → 指揮喵評分」可以單獨識別天賦並按公開攻略口徑打分，用於人工核對。

## <DocIcon name="handshake" /> 大艦隊（`Guild`）

| 字段 | 説明 |
| --- | --- |
| `GuildLogistics.Enable` | 自動接取 / 提交後勤任務 |
| `GuildLogistics.SelectNewMission` | 自動選擇新任務 |
| `GuildOperation.Enable` | 參與大艦隊作戰 |
| `GuildOperation.AttackBoss` | 是否攻擊 boss |
| `JoinThreshold` | 加入作戰的最低人數閾值 |

不在大艦隊、或沒有權限時，關掉這兩個子開關。

## <DocIcon name="zap" /> 認知覺醒（`Awaken`）

| 字段 | 説明 |
| --- | --- |
| `LevelCap` | 覺醒的目標等級上限 |
| `Favourite` | 優先覺醒的艦船 |

消耗認知覺醒材料，把滿級艦船繼續提升。材料不足時會跳過。

## <DocIcon name="user-check" /> 秘書艦（`Secretary`）

自動檢測秘書艦好感度，達到設定值後更換。

| 字段 | 説明 |
| --- | --- |
| `CustomFilter` | 候選艦船 |
| `LowFavorabilityPriority` | 優先選擇低好感艦船 |
| `FavouriteOnly` | 只在收藏中選 |
| `CheckInterval` | 檢查間隔 |
| `BackupEnable` | 保留原秘書艦作為備份 |

## <DocIcon name="target" /> 作戰委託（`OperationHandover`）

消耗作戰委託書自動進行作戰委託。

| 字段 | 説明 |
| --- | --- |
| `Count` | 每次執行的數量 |
| `UseHandoverBook` | 是否使用委託書 |
| `ConsumeAllBook` | 一鍵消耗全部，`ConsumeAllBookWeekday` / `Time` 控制時點 |
| `OilLimit` | 石油下限 |

## <DocIcon name="package" /> 倉庫統計（`StorageStatistics`）

讀取材料倉庫中的金色/彩色指定物品，完整單遍掃描並同頁核對後更新統計。

- 預設關閉，啟用後預設每 7 天執行一次，也可手動運行。
- **不消耗物品**，只讀取。
- 僅支援已驗證的國服模板。

## <DocIcon name="calendar" /> 每日任務（`Daily`）

| 字段 | 説明 |
| --- | --- |
| `UseDailySkip` | 使用每日任務跳過券 |
| `EscortMission` / `EscortMissionFleet` | 商路護航及艦隊 |
| `AdvanceMission` / `AdvanceMissionFleet` | 前進任務及艦隊 |
| `FierceAssault` / `FierceAssaultFleet` | 猛攻任務及艦隊 |
| `TacticalTraining` / `TacticalTrainingFleet` | 戰術訓練及艦隊 |
| `SupplyLineDisruption` | 破交任務 |
| `ModuleDevelopment` / `EmergencyModuleDevelopment` | 模組開發及緊急開發 |

每日任務的子項與遊戲內「每日任務」列表對應。某個子項反覆失敗時，先手動完成該類型，確認艦隊與關卡可用。

## <DocIcon name="circle-alert" /> 困難圖（`Hard`）

| 字段 | 説明 |
| --- | --- |
| `HardStage` | 困難關卡 |
| `HardFleet` | 出擊艦隊 |

每天有次數限制，通常在伺服器刷新後運行。航母/戰列限制隨關卡變化，配置前確認艦隊符合要求。

## <DocIcon name="medal" /> 演習（`Exercise`）

| 字段 | 説明 |
| --- | --- |
| `OpponentChooseMode` | 對手選擇策略 |
| `OpponentTrial` | 是否先試打 |
| `ExerciseStrategy` | 進攻策略 |
| `DelayUntilHoursBeforeNextUpdate` | 在刷新前若干小時再打，避開強敵 |
| `LowHpThreshold` | 低血量判定 |

演習失敗也會消耗次數，策略保守一點更穩。

## <DocIcon name="trophy" /> 限界挑戰（`LimitChallenge`）

每月依次挑戰至目標難度，每個難度最多出擊一次；戰敗後等待下月。

| 字段 | 説明 |
| --- | --- |
| `TargetLevel` | 目標難度 |
| `Month` / `CompletedLevel` / `AttemptedLevel` / `Failed` | 進度狀態（自動維護） |

需要先在遊戲內配置限界挑戰艦隊。當前使用國服識別資源。

## <DocIcon name="badge-dollar" /> 商店

### <DocIcon name="badge-dollar" /> 軍火商商店（`ShopFrequent`）

| 字段 | 説明 |
| --- | --- |
| `Enable` | 啟用 |
| `UseGems` | 是否用鑽石購買 |
| `Refresh` | 是否刷新 |
| `BuySkinBox` | 購買皮膚箱 |
| `ConsumeCoins` | 消耗物資 |
| `Filter` | 購買優先級 |

### <DocIcon name="box" /> 其他商店（`ShopOnce`）

包含大艦隊商店、勳章商店、功勳商店、核心商店等，分別有獨立開關與過濾：

```text
GuildShop / MedalShop2 / MeritShop / CoreShop
```

`BuyUnobtainedShip` 只買未獲得的艦船，適合補齊圖鑑。

### <DocIcon name="wrench" /> 研發船塢（`Shipyard`）

| 字段 | 説明 |
| --- | --- |
| `ResearchSeries` | 研發系列（PR1–PR3 等） |
| `ShipIndex` | 目標艦船 |
| `BuyAmount` | 購買數量 |

## <DocIcon name="circle-plus" /> 每日抽卡（`Gacha`）

| 字段 | 説明 |
| --- | --- |
| `Pool` | 卡池 |
| `Amount` | 抽數 |
| `UseTicket` / `TicketAmount` | 使用抽卡券 |
| `ClearTicket` / `ClearTicketTime` | 清空券的時點 |
| `UseDrill` | 使用演習相關道具 |

每日一發通常只花 1 個魔方，適合做任務。

## <DocIcon name="circle-dollar" /> 白嫖獎勵（`Freebies`）

| 子項 | 內容 |
| --- | --- |
| `BattlePass.Collect` | 通行證獎勵 |
| `DataKey.Collect` | 數據鑰匙 |
| `Mail.*` | 郵件領取與清理（`ClaimMerit`、`ClaimMaintenance`、`ClaimTradeLicense`、`DeleteCollected`） |
| `SupplyPack.Collect` / `DayOfWeek` | 補給包 |

## <DocIcon name="video" /> 小遊戲（`Minigame`）

遊戲幣不會溢出時自動領取；有遊戲幣且獎勵沒滿時自動玩小遊戲。沒有額外配置。

## <DocIcon name="sparkles" /> 宿舍計劃（`PrivateQuarters`）

| 字段 | 説明 |
| --- | --- |
| `BuyRoses` / `BuyCake` | 購買玫瑰 / 蛋糕 |
| `TargetInteract` / `TargetShip` | 互動目標與艦船 |

## <DocIcon name="lightbulb" /> 推薦組合

```text
Reward → Commission → Research → Dorm → Meowfficer → Guild
      → Daily → Hard → Exercise → ShopFrequent → ShopOnce → Freebies
```

順序不是硬性的，但把「收取類」放在前面能減少重複進入介面的次數。所有任務都受 `Scheduler.ServerUpdate` 影響，跨時區部署時改成伺服器刷新時間。
