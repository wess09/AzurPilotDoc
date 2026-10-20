---
title: 島嶼計劃
description: 赤石計劃（島嶼）17 個任務：季節設定、五家商店經營、農田牧場、製造、每日採集與珍珠交易。
updated: 2026-10-20
---

# 島嶼計劃

島嶼（遊戲內「赤石計劃」，任務分組 `Island`）是一套獨立的經營玩法：種田、養殖、採礦、開店、完成每日訂單與周常。它與主線/大世界互不消耗石油，但操作介面完全不同，識別資源也是單獨一套。

## <DocIcon name="clipboard" /> 前置條件

- 遊戲內已解鎖島嶼玩法。
- 當前賽季與 `IslandPlan.Season` 一致。賽季切換後，商店菜品與走位點可能變化。
- 部分任務要求控制方式為 `minitouch`、`MaaTouch`、`uiautomator2` 或 `azurpilot_android`，`ADB` 注入不支援拖拽類操作。

::: tip 先跑「全局配置」
`IslandPlan` 不是普通的掛機任務：它會把你勾選的走位路線在島上各走一遍，用於**校驗角色能否走到目標位置**。跑完（或沒有勾選任何路線）後任務自動推遲到第二天。
:::

## <DocIcon name="settings" /> 全局配置（`IslandPlan`）

| 字段 | 說明 |
| --- | --- |
| `Season` | 當前賽季，影響商品與地圖 |
| `IslandWalk.*` | 各角色的走位路線開關：空投、每日採集點、珍珠組裝、珍珠港等 |
| `IslandWalk.*Enable` | 是否校驗該路線 |

賽季更新後第一件事是重跑一次全局配置，確認所有勾選路線可達。

## <DocIcon name="box" /> 經營模組（`IslandBusiness`）

自動經營 5 家商店：有魚餐館、白熊飲品、烏魚烤肉、啾啾簡餐、啾咖啡。

| 字段 | 說明 |
| --- | --- |
| `BatchEnabled` | 分批經營（降低單次時長） |
| `Batch1Shops` / `Batch2Shops` | 兩批各包含哪些商店 |
| `SeasonalReplaceEnabled` / `SeasonalThreshold` | 賽季菜品替換 |
| `IslandBusinessShop1..5` | 每家店的店員（`Char1/2`）與菜品（`Product1..5`） |
| `BoostReplaceFilter` | 加成替換策略 |

每家店的菜品按 1→8 的順序生產，前一項滿足後才執行下一項；執行後一項不會影響之前幾項已達成的目標。這條規則對 `IslandGrill`、`IslandJuuEatery`、`IslandJuuCoffee` 同樣適用。

## <DocIcon name="sparkles" /> 農田與果園（`IslandFarm`）

包含三塊地：農田、果園、苗圃。

| 子組 | 關鍵字段 | 說明 |
| --- | --- | --- |
| `IslandFarm` | `Positions`、`WorkerFilter`、`MinFarm`、`PlantPotatoes` | 農田與工人 |
| `IslandOrchard` | `MinOrchard`、`IgnoreAvocado`、`PlantRubber`、`AmagiChanRubber` | 果園與橡膠 |
| `IslandNursery` | `MinNursery`、`IgnorePineapple`、`PlantLavender` | 苗圃與薰衣草 |

`Min*` 是保留數量下限，低於它才補種。`Positions` 決定走位點，通常保持預設。

## <DocIcon name="circle-check" /> 牧場（`IslandRancher`）

自動餵養與收取畜產品。需要先解鎖對應欄位，並保證飼料充足。

## <DocIcon name="drive" /> 礦山林場（`IslandMineForest`）

自動採礦與伐木。工具耐久耗盡時會停止，需在遊戲內補充。

## <DocIcon name="wrench" /> 製造業（`IslandManufacture`）

| 項 | 說明 |
| --- | --- |
| 用途 | 按配方生產中級/高級材料 |
| 前置 | 配方已解鎖，原料充足 |
| 關鍵配置 | 生產佇列與目標數量 |
| 驗證 | 製造佇列出現任務；倉庫材料增加 |
| 限制 | 原料不足會空轉，建議與農田/牧場一起跑 |

## <DocIcon name="calendar" /> 每日採集（`IslandDailyGather`）

通過管理介面的採集頁籤，用 UI 模擬完成每日採集。

- 執行時間：**凌晨 3:10** 與 **下午 18:00**。
- 流程：選擇採集目標 → 切換開關 → 分配角色 → 出發。
- 走位相關操作要求非 ADB 控制方式。

## <DocIcon name="gift" /> 每日補給（`IslandAirDrop`）

收取本島空中補給，並可拜訪其他玩家島嶼拿補給。

- 移動僅支援 `minitouch` / `MaaTouch` / `uiautomator2` / `azurpilot_android`。
- 拜訪他人島嶼會受好友列表與次數限制。

## <DocIcon name="package" /> 貨物籌備（`IslandCargoPreparation`）

自動處理島嶼貨運委託：

1. 領取已完成的貨運獎勵。
2. 避開牛奶等黑名單貨物。
3. 進入更換頁面，確認預設選中的第一個委託。
4. 裝載可提交的貨物。

## <DocIcon name="scroll" /> 每日訂單（`IslandDailyOrder`）

從島嶼手機頁面進入每日訂單，自動檢測訂單類型（緊急 / 挑戰 / 輕鬆），按物品條件交付或駁回。

::: warning 不支援「標準」訂單
「標準」類型訂單不會被處理。若當天全是標準訂單，任務會跳過。
:::

## <DocIcon name="clipboard" /> 每日/周任務（`IslandDailyInteract`）

處理四類交互：

- 摸貓
- JUU 速運
- 商區外送服務
- 每週照相任務

移動同樣要求非 ADB 控制方式。相關按鈕資源生成後才能啟用。

## <DocIcon name="badge-dollar" /> 每週珍珠採購與售賣（`IslandPearlSell`）

每週二 **01:00** 自動處理珍珠：先採購本週珍珠，再售賣已有珍珠。

| 字段 | 說明 |
| --- | --- |
| `BuyPrice` / `SellPrice` | 價格閾值 |
| `BuyNextRun` / `NextPearlTradeTime` | 下次交易時間（自動維護） |
| `DailyPriceRefresh` | 每日價格刷新 |

::: danger 金幣下限
採購前金幣必須足夠買 200×220 個珍珠，這是最低要求。金幣不足時任務可能報錯。跑之前確認金幣充足。
:::

## <DocIcon name="lightbulb" /> 推薦啟用順序

```text
1. IslandPlan        （校验走位，跑一次）
2. IslandFarm        （农田/果园/苗圃）
3. IslandRancher     （牧场）
4. IslandMineForest  （矿山林场）
5. IslandManufacture （制造）
6. IslandBusiness    （五家店）
7. IslandDailyGather / IslandAirDrop / IslandDailyOrder / IslandDailyInteract
8. IslandCargoPreparation / IslandPearlSell
```

先解決原料，再跑製造與商店，最後才是每日交互類任務。

## <DocIcon name="message" /> 常見問題

| 現象 | 原因 |
| --- | --- |
| 角色走不到目標點 | 走位點過期，重跑 `IslandPlan` 校驗 |
| 商店不開門 | 當前賽季與 `Season` 不匹配 |
| 採集任務不動 | 控制方式是 `ADB`，不支援拖拽 |
| 珍珠任務報錯 | 金幣不足 200×220 |
| 訂單全部跳過 | 當天只有「標準」類型訂單 |
| 作物不補種 | `Min*` 設得過高，或工人未分配 |
