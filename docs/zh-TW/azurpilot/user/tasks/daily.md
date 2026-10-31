---
title: 日常與資源
description: 委託、科研、後宅、指揮喵、大艦隊、每日任務、演習、商店與研發船塢的配置要點與獎勵領取邏輯。
updated: 2026-10-31
---

# 日常與資源

日常類任務的特點是：單個耗時短、失敗代價低、但漏做會持續損失收益。建議全部啟用，並按伺服器刷新時間排期。

## <DocIcon name="gift" /> 一鍵收穫（`Reward`）

把主介面上所有可領的東西點一遍。

| 字段 | 說明 |
| --- | --- |
| `CollectOil` | 領取石油 |
| `CollectCoin` | 領取物資 |
| `CollectExp` | 領取經驗 |
| `CollectMission` | 領取任務獎勵 |
| `CollectWeeklyMission` | 領取周常獎勵 |

推薦全開。它是所有任務裡最安全的一個，適合作為安裝後的第一次驗證。

## <DocIcon name="scroll" /> 委託（`Commission`）

| 項 | 說明 |
| --- | --- |
| 用途 | 自動派遣、收取委託，優先高價值委託 |
| 前置 | 委託欄位已解鎖（隨等級） |
| 關鍵配置 | `PresetFilter`（預設策略）、`DynamicProgramming`（動態規劃選委託）、`DoMajorCommission`（是否做大型委託） |
| 高級 | `TierValueRatio`、`DelayHalfLife`、`DeadlineFutureHorizon` 控制收益/時間權衡 |
| 通知 | `CommissionNotifyReward`、`DetectShipDrop`、`GemNotify` 可推送稀有獎勵與鑽石委託 |
| 驗證 | 委託列表出現新派遣；日誌有「收取 / 派遣」記錄 |

`NoFreeShipPolicy` 與 `AutoPickShip` 控制船塢滿時的處理策略。船塢吃緊時務必配置，否則會因為無法接收艦船而卡住。

## <DocIcon name="flask" /> 科研（`Research`）

| 項 | 說明 |
| --- | --- |
| 用途 | 選擇科研專案、收取、開始下一項 |
| 前置 | 科研系統已解鎖；至少有一個可用佇列 |
| 關鍵配置 | `UseCube`（是否用魔方加速）、`UseCoin`（是否用物資）、`UsePart`（是否用部件） |
| 專案選擇 | `PresetFilter` 選預設（如「艦裝解析優先」），`CustomFilter` 自定義 |
| 延遲 | `AllowDelay` 允許為了等更好的專案而空轉 |
| 驗證 | 科研佇列有進行中的專案；日誌顯示專案名與剩餘時間 |

::: tip 鑽石不要隨便開
`UseCube` 使用魔方（快速完成），不是鑽石。真正花鑽石的加速在遊戲內需要手動確認，腳本不會自動花鑽石。
:::

## <DocIcon name="brain" /> 戰術學院（`Tactical`）

| 字段 | 說明 |
| --- | --- |
| `TacticalFilter` | 選擇要訓練的技能 |
| `RapidTrainingSlot` | 是否使用快速訓練位 |
| `SkillAutoSwitch` | 技能滿級後自動換下一個 |
| `ControlExpOverflow` | 控制經驗溢出（可分別允許 T4/T3/T2/T1 教材） |
| `AddNewStudent` | 自動補充學員，`MinLevel` / `MaxLevel` 限定範圍 |

## <DocIcon name="sparkles" /> 後宅（`Dorm`）

| 字段 | 說明 |
| --- | --- |
| `Collect` | 收取後宅物資與經驗 |
| `Feed` | 補充食物 |
| `FeedFilter` | 選擇食物優先級 |
| `ReserveFood` | 保留食物數量 |
| `BuyFood` | 食物不足時購買 |
| `BuyFurniture.Enable` | 自動購買傢俱（可選） |

食物耗盡會導致後宅經驗停擺，`ReserveFood` 不要設得過高。

### 後宅日常與「換船休息」聯動的職責區分

後宅日常任務（`Dorm`）負責定期的日常喂糧、收取經驗與物資，按獨立排程週期執行；而智能換船聯動中的「換船休息」（`FleetInfo.FleetDorm`）屬於出戰前換船與換裝流程的一部分，**不作為獨立日常任務排期**。

- **換船休息觸發與樓層**：整輪實際換船及換裝全部完成後，由 `module/dorm/fleet_rotation.py` 從本輪已完成換船的出戰艦隊中按「全隊出擊 > 道中隊 > Boss 隊」的優先級選擇一隊進入後宅。`FleetDorm.Floor` 可選 `floor_1`（一樓訓練）或 `floor_2`（二樓休息）。沒有實際換船或未開啟開關時不會進入後宅。
- **選船與清空機制**：進入後宅後，先逐艘取消所選樓層的原有選中；隨後分別篩選先鋒與主力，按當前實際艦隊編號徽標選齊整隊（包括保留固定艦位的未更換艦船）。
- **逐排拖動與畫面穩定確認**：後宅選船列表每次僅拖動一排。支援按住拖動的控制後端（`minitouch`、`MaaTouch`、`uiautomator2`、`scrcpy`、`nemu_ipc`）在鬆手前保持觸點 0.4 秒以抑制慣性，其餘後端使用慢滑；每次拖動後通過區域像素均值比對確認列表實際發生位移，並等待 0.3 秒畫面穩定後再進行模板識別，避免因捲軸抖動或慣性翻過目標艦船；檢查範圍嚴格限制在前五排（最多三次逐排拖動），前五排未選齊則終止並跳過本次後宅安排，不再深入翻找普通船塢。
- **數量校驗與防重複**：每次點擊艦船卡片均核驗已選數量變化，翻頁重疊區域已選艦船不會重複點擊；選齊後確認並退出後宅，繼續原出擊任務。
- **安全回退保護**：若後宅欄位不足、樓層未解鎖、彈出移出另一樓層的提示或選船狀態無法確認，程序會主動點擊取消、退出後宅並跳過本次後宅安排，保留已生效的換船與換裝結果繼續原出擊任務；不會自動擴建欄位或確認移出提示。

## <DocIcon name="crown" /> 指揮喵（`Meowfficer`）

| 字段 | 說明 |
| --- | --- |
| `BuyAmount` | 購買指揮喵箱子的數量 |
| `FortChoreMeowfficer` | 要塞任務使用的指揮喵 |
| `MeowfficerTrain.Enable` | 自動訓練 |
| `MeowfficerTrain.Mode` | 訓練策略 |
| `ScoreTalents` / `ScoreThreshold` | 按天賦評分，低於閾值不保留 |
| `MaxFeedLevel` | 餵養上限 |

「工具 → 指揮喵評分」可以單獨識別天賦並按公開攻略口徑打分，用於人工核對。

## <DocIcon name="handshake" /> 大艦隊（`Guild`）

| 字段 | 說明 |
| --- | --- |
| `GuildLogistics.Enable` | 自動接取 / 提交後勤任務 |
| `GuildLogistics.SelectNewMission` | 自動選擇新任務 |
| `GuildOperation.Enable` | 參與大艦隊作戰 |
| `GuildOperation.AttackBoss` | 是否攻擊 boss |
| `JoinThreshold` | 加入作戰的最低人數閾值 |

不在大艦隊、或沒有權限時，關掉這兩個子開關。

## <DocIcon name="zap" /> 認知覺醒（`Awaken`）

| 字段 | 說明 |
| --- | --- |
| `LevelCap` | 覺醒的目標等級上限 |
| `Favourite` | 優先覺醒的艦船 |

消耗認知覺醒材料，把滿級艦船繼續提升。材料不足時會跳過。

## <DocIcon name="user-check" /> 秘書艦（`Secretary`）

自動檢測秘書艦好感度，達到設定值後更換。

| 字段 | 說明 |
| --- | --- |
| `CustomFilter` | 候選艦船 |
| `LowFavorabilityPriority` | 優先選擇低好感艦船 |
| `FavouriteOnly` | 只在收藏中選 |
| `CheckInterval` | 檢查間隔 |
| `BackupEnable` | 保留原秘書艦作為備份 |

## <DocIcon name="target" /> 作戰委託（`OperationHandover`）

消耗作戰委託書自動進行作戰委託。除主線關卡（如 `12-4`）外，現已支援活動關卡委託（如 `D3`、`T6`、`SP3`）：當 `Campaign.Name` 為活動關卡時，自動讀取 `Campaign.Event` 對應活動並複用關卡別名與難度確認邏輯；關卡是否支援委託以遊戲內入口為準。

| 字段 | 說明 |
| --- | --- |
| `Count` | 每次執行的數量 |
| `UseHandoverBook` | 是否使用委託書 |
| `ConsumeAllBook` | 一鍵消耗全部，`ConsumeAllBookWeekday` / `Time` 控制時點 |
| `OilLimit` | 石油下限 |

## <DocIcon name="package" /> 倉庫統計（`StorageStatistics`）

讀取材料倉庫中的金色/彩色指定物品，完整單遍掃描並同頁核對後更新統計。

- 預設關閉，啟用後預設每 7 天執行一次，也可手動執行。
- **不消耗物品**，只讀取。
- 僅支援已驗證的國服模板。

## <DocIcon name="calendar" /> 每日任務（`Daily`）

| 字段 | 說明 |
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

| 字段 | 說明 |
| --- | --- |
| `HardStage` | 困難關卡 |
| `HardFleet` | 出擊艦隊 |

每天有次數限制，通常在伺服器刷新後執行。航母/戰列限制隨關卡變化，配置前確認艦隊符合要求。

## <DocIcon name="medal" /> 演習（`Exercise`）

| 字段 | 說明 |
| --- | --- |
| `OpponentChooseMode` | 對手選擇策略 |
| `OpponentTrial` | 是否先試打 |
| `ExerciseStrategy` | 進攻策略 |
| `DelayUntilHoursBeforeNextUpdate` | 在刷新前若干小時再打，避開強敵 |
| `LowHpThreshold` | 低血量判定 |

演習失敗也會消耗次數，策略保守一點更穩。

### 演習戰前／戰後裝備方案

演習任務新增 `Equipment.Enable`、`Equipment.ClearBeforeApply` 與 YAML 文本 `Equipment.Config`，可按 `flagship`、`up`、`down`、`head`、`middle`、`tail` 六個站位分別配置 `before`（首次出擊前）和 `after`（任務結束後）的裝備碼。預設**關閉**；僅支援可輸入裝備碼的控制方式。

`ClearBeforeApply` 開啟時會先卸下目標艦船裝備再應用配裝碼。**設定了 `before` 但 `after` 留空的站位，任務結束時會被卸裝，而不是自動恢復原裝備**。如果換裝失敗、恢復入口不可用或處理程序中斷，仍可能需要人工恢復；建議先用非關鍵編隊驗證。此功能不適用於 META 檔案的獨立編隊，META 信標和支援的處理見[大型作戰](/zh-TW/azurpilot/user/tasks/opsi)。


## <DocIcon name="trophy" /> 限界挑戰（`LimitChallenge`）

每月依次挑戰至目標難度，每個難度最多出擊一次；戰敗後等待下月。

| 字段 | 說明 |
| --- | --- |
| `TargetLevel` | 目標難度 |
| `Month` / `CompletedLevel` / `AttemptedLevel` / `Failed` | 進度狀態（自動維護） |

需要先在遊戲內配置限界挑戰艦隊。當前使用國服識別資源。

## <DocIcon name="badge-dollar" /> 商店

### <DocIcon name="badge-dollar" /> 軍火商商店（`ShopFrequent`）

| 字段 | 說明 |
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

| 字段 | 說明 |
| --- | --- |
| `ResearchSeries` | 研發系列（PR1–PR3 等） |
| `ShipIndex` | 目標艦船 |
| `BuyAmount` | 購買數量 |

## <DocIcon name="circle-plus" /> 每日抽卡（`Gacha`）

| 字段 | 說明 |
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

| 字段 | 說明 |
| --- | --- |
| `BuyRoses` / `BuyCake` | 購買玫瑰 / 蛋糕 |
| `TargetInteract` / `TargetShip` | 互動目標與艦船 |

## <DocIcon name="lightbulb" /> 推薦組合

```text
Reward → Commission → Research → Dorm → Meowfficer → Guild
      → Daily → Hard → Exercise → ShopFrequent → ShopOnce → Freebies
```

順序不是硬性的，但把「收取類」放在前面能減少重複進入介面的次數。所有任務都受 `Scheduler.ServerUpdate` 影響，跨時區部署時改成伺服器刷新時間。
