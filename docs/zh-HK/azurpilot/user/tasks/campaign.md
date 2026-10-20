---
title: 出擊與活動
description: 主線圖、緊急委託、三油低耗、活動圖、共鬥、作戰檔案與每日圖的配置方法、前置條件與驗證方式。
updated: 2026-10-20
---

# 出擊與活動

出擊類任務消耗石油，也是收益波動最大的一類。配置前先明確三件事：**打哪張圖、打到什麼條件停、用哪支艦隊**。

## <DocIcon name="clipboard" /> 通用結構

所有出擊任務共享三個參數組：

| 組 | 關鍵字段 | 作用 |
| --- | --- | --- |
| `Campaign` | `Name`、`Mode`、`UseAutoSearch`、`Use2xBook`、`AmbushEvade` | 關卡、難度、自律、雙倍書、避伏擊 |
| `StopCondition` | `OilLimit`、`CoinLimit`、`RunCount`、`MapAchievement` | 什麼時候停 |
| `Fleet` | `Fleet1`、`Fleet1Formation`、`FleetOrder` | 艦隊與陣型 |

停止條件的實際語義：石油低於 `max(OilLimitHardFloor, OilLimit)` 時停止，硬下限預設 500，防止把油打空後無法做日常。

::: tip 先手動打一遍
新圖、活動圖第一次跑之前，先手動通關並解鎖自律尋敵。腳本的「開荒」能力依賴地圖識別，遇到新機制（傳送門、機關、特殊 boss）經常需要人工先走一遍。
:::

## <DocIcon name="target" /> 主線圖 1 / 2 / 3

同一條主線可以配置三套獨立任務，用於「不同圖、不同艦隊、不同停止條件」的組合。

| 項 | 説明 |
| --- | --- |
| 用途 | 刷經驗、刷裝備圖紙、刷物資、練船 |
| 前置 | 關卡已解鎖；任務提示需要至少 4 支編隊（可開「跳過編隊檢測」臨時繞過） |
| 關鍵配置 | `Campaign.Name` 填關卡（如 `12-4`）、`Mode` 選 `normal`、`UseAutoSearch` 開 |
| 推薦 | 12-4 練級：`UseAutoSearch=true`、`AmbushEvade=true`、`StopCondition.OilLimit=1000` |
| 驗證 | 日誌出現「進入關卡 → 自律尋敵 → 結算」，物資/經驗增長 |
| 常見問題 | 卡在「尋找敵人」多為地圖未識別，換 `UseClearMode` 或手動清一次 |

`DefeatWithdraw` 控制戰敗後的行為：`withdraw_stop`（撤退並停止）、`switch_fleet`（換隊繼續）、`withdraw_continue`（撤退後繼續打）。

## <DocIcon name="zap" /> 緊急委託（`GemsFarming`）

| 項 | 説明 |
| --- | --- |
| 用途 | 在特定圖上刷緊急委託（鑽石委託），兼顧練級 |
| 前置 | 關卡已解鎖，艦隊滿足油耗要求 |
| 關鍵配置 | `GemsFarming.Fleet1`、`Campaign.Name`、`StopCondition` |
| 限制 | **與三油低耗互斥**，只能開一個 |
| 驗證 | 日誌出現委託檢測與撤退；委託列表出現緊急委託 |

## <DocIcon name="badge-dollar" /> 三油低耗（`ThreeOilLowCost`）

用 3 油陣容反覆刷低耗圖，旗艦達到 32 級後自動更換旗艦並退役。

| 項 | 説明 |
| --- | --- |
| 用途 | 極限省油刷圖，適合長期積累 |
| 前置 | 有可用的低耗陣容；退役設定已按[一鍵退役](/zh-HK/guide/requirements#一鍵退役)配好 |
| 關鍵配置 | `Campaign.Name`（通常 1-1 或低耗圖）、`StopCondition.RunCount` |
| 限制 | 與緊急委託互斥；需要正確的退役策略，否則會誤退 |
| 驗證 | 油耗增長極慢；退役記錄出現 32 級旗艦 |

## <DocIcon name="shield" /> 1-1 刷伏擊（`Ambush11`）

在 1-1 不打 boss，反覆觸發伏擊獲取物資，支援按緊急委託流程自動換船。

::: warning 實驗性
任務名帶「尚不完善」標記。收益依賴伏擊觸發概率，行為可能隨版本變化。不要作為主力收益手段。
:::

## <DocIcon name="star" /> 活動圖 1 / 2 / 3

| 項 | 説明 |
| --- | --- |
| 用途 | 刷活動圖（PT、活動裝備、限定掉落） |
| 前置 | 活動已開啟；普通難度通常需要先通關 |
| 關鍵配置 | `Campaign.Event` 選活動、`Campaign.Name` 選關卡、`StopCondition` 設 PT 或次數 |
| 推薦 | 先 `RunCount=1` 驗證能進圖，再放開次數 |
| 驗證 | 活動 PT 增長；日誌顯示正確的關卡名 |
| 限制 | 共鬥類活動有獨立頁面（`Raid`），不要用活動圖任務硬跑 |

三個槽位的意義是「同時安排三張不同的圖」，例如：活動圖刷 PT、主線圖練級、另一張活動圖刷掉落。它們各自獨立調度。

## <DocIcon name="megaphone" /> 共鬥活動（`Raid` / `RaidScuttle`）

| 任務 | 用途 | 注意 |
| --- | --- | --- |
| `Raid` | 共鬥活動正常出擊 | 需要活動已解鎖，boss 血量共享 |
| `RaidScuttle` | 共鬥沉船（送船） | 通過沉船刷好感/次數，配置更激進 |

共斗的「沉船」不是失敗，而是一種策略：讓低價值艦隊被擊沉以快速結束戰鬥。使用前確認你理解活動規則。

## <DocIcon name="sparkles" /> 活動專屬任務

| 任務 | 活動 | 説明 |
| --- | --- | --- |
| `Hospital` | 深谷來信 | 活動專屬流程，機制與其他活動不同 |
| `Coalition` | 夜勤病棟 | 聯盟活動 |
| `CoalitionScuttle` | 聯盟沉船 | 艦隊被擊沉後刷好感，建議多隊出擊、第一隊就沉 |
| `MaritimeEscort` | 商路護航 | 護送類活動，節奏與普通出擊不同 |
| `EventShop` | 活動商店 | 按優先級兑換活動商店 |
| `CoalitionSp` | 怪談紀實：逃離白夜山莊 SP | 特定活動的 SP 圖 |

這些任務只在對應活動期間有意義。活動結束後即使啟用也不會運行（找不到入口會報錯或跳過）。是否保留取決於版本，以 `task.yaml` 為準。

## <DocIcon name="file" /> 作戰檔案（`WarArchives`）

| 項 | 説明 |
| --- | --- |
| 用途 | 刷已歸檔活動的每日次數與掉落 |
| 前置 | 檔案已解鎖 |
| 關鍵配置 | `WarArchives.DailyRunCount`、`AutoClear`、`AutoClearTarget` |
| 限制 | **缺少維護**，開荒功能不一定可用。建議手動完成開荒後再用自律尋敵 |
| 驗證 | 檔案每日次數減少；掉落進入統計 |

## <DocIcon name="calendar" /> 每日圖 A / B / C / D / SP

| 任務 | 對應 | 説明 |
| --- | --- | --- |
| `EventA` ~ `EventD` | 每日 A/B/C/D 圖 | 通常只打一次拿每日獎勵 |
| `EventSp` | 每日 SP 圖 | 需要通關前置，油耗較高 |
| `RaidDaily` | 共鬥每日 | 共鬥活動的每日次數 |

這些任務的 `Scheduler.ServerUpdate` 很重要：每日次數在伺服器刷新點重置，任務應排在刷新後運行。預設 `00:00`，跨時區時按伺服器時間調整。

## <DocIcon name="refresh" /> 活動適配的季節性

活動圖的地圖與機制每月變化，`campaign/` 下是 Python 地圖定義，不是通用 YAML。新活動適配需要開發者提交地圖與戰鬥邏輯。因此：

- 活動剛開時，腳本可能還不支援，關注倉庫更新。
- 支援後也可能因機制變化失效，優先看日誌裏的頁面識別失敗。
- 不要用舊活動的配置硬套新活動。

## <DocIcon name="hand" /> 停止條件怎麼選

| 目標 | 配置 |
| --- | --- |
| 刷夠次數就停 | `RunCount = N` |
| 油低於閾值停 | `OilLimit`（配合硬下限 500） |
| 物資達到目標停 | `CoinLimit` |
| 刷到 100% 通關 | `MapAchievement = 100_percent_clear` |
| 刷到三星 | `MapAchievement = map_3_stars` |
| 練到指定等級 | `ReachLevel` |
| 撈到新船就停 | `GetNewShip = true` |

`StageIncrease` 開啟後，達成條件會自動推進到下一關，用於連續推圖。

## <DocIcon name="wrench" /> 驗證與疑難排解

跑完一輪後檢查：

1. 日誌是否出現完整的「進圖 → 戰鬥 → 結算 → 撤退/繼續」。
2. 統計頁的出擊次數與油耗是否增加。
3. 遊戲內關卡進度、PT、物資是否符合預期。

常見失敗：

| 現象 | 原因 |
| --- | --- |
| 一直停在關卡選擇 | 關卡名不在當前活動/主線列表 |
| 進圖後不動 | 自律未解鎖，或 `UseAutoSearch` 關了但腳本不會手動尋路 |
| 反覆撤退 | 艦隊強度不足，`DefeatWithdraw` 觸發 |
| 油耗異常高 | 艦隊配置與預期不符，檢查 `Fleet1` 與潛艇設定 |
| 活動圖識別失敗 | 活動資源未更新，更新核心程序 |
