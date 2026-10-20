---
title: 大型作戰
description: 大世界 19 個任務的用途、行動力與黃幣機制、智能調度的決策邏輯、每月開荒與跨月注意事項。
updated: 2026-10-20
---

# 大型作戰

大世界（Operation Siren）是配置複雜度最高的模組：它有自己的資源系統（行動力、黃幣、紫幣）、每月重置週期、特殊海域類型，以及一個會**代理其他任務**的智能調度器。

## <DocIcon name="badge-dollar" /> 先理解資源

| 資源 | 符號 | 來源 | 約束 |
| --- | --- | --- | --- |
| 行動力 | AP / `P` / `C` | 自然恢復（約 600 秒 1 點，上限 200）、港口購買、箱子 | 溢出即浪費 |
| 黃幣 | `Y` | 海域掉落、任務 | 補幣任務的目標 |
| 紫幣 | — | 隱秘海域、深淵 | 商店兑換 |

`P` 是「可用於決策的總行動力」：開箱開啟時包含箱內行動力，關閉時只算當前行動力 `C`。儀表盤顯示的總量始終包含箱子，兩者的口徑不同。

保留值：

| 符號 | 配置 | 含義 |
| --- | --- | --- |
| `K` | `OpsiScheduling.OperationCoinsPreserve` | 黃幣保留線 |
| `R` | `OpsiScheduling.OperationCoinsReturnThreshold` | 補幣回補增量（負數按 0） |
| `B` | `OpsiScheduling.ActionPointPreserve` | 補幣時的行動力保留線，0 時回退到耄耋相接的配置 |
| `L` | `OpsiHazard1Leveling.MinimumActionPointReserve` | 侵蝕 1 練級的保留線（預設 200） |
| `M` | 月末清理保留線 | `max(月末保留, 跨月任务启用时的 200)` |

## <DocIcon name="brain" /> 智能調度（`OpsiScheduling`）

智能調度不是「一個任務」，而是一個決策循環。它接管以下子任務：

- 侵蝕 1 練級
- 耄耋相接
- 隱秘海域
- 深淵座標
- 塞壬要塞

接管後，子任務的**具體設定仍來自各自頁面**，智能調度只決定「什麼時候跑哪個」。

### <DocIcon name="scale" /> 兩種模式

| 模式 | 觸發 | 行為 |
| --- | --- | --- |
| 黃幣目標 | `Y < K`，或上一輪已在補幣 | 代理補幣任務直到 `Y ≥ K + R`，然後回侵蝕 1 |
| 行動力調度 | 未開啟黃幣目標 | 按 `P` 與 `L` 決定是否練級、是否購買行動力 |

### <DocIcon name="compass" /> 決策順序

```text
每月开荒未完成 → 延后到服务器刷新
  ↓
读取 Y / P / C
  ↓
港口行动力续购（本月未完成时）
  ↓
P ≤ L → 尝试购买
  ↓
月末清理窗口 → 优先清理
  ↓
智能开荒接管 → 执行开荒节点
  ↓
黄币 / 行动力调度
```

::: warning 不要同時開智能調度和子任務
同時啟用智能調度與它接管的子任務，會出現兩個任務搶同一個海域的情況。要麼讓智能調度接管，要麼單獨跑子任務。
:::

## <DocIcon name="map" /> 每月開荒（`OpsiExplore`）

| 項 | 説明 |
| --- | --- |
| 用途 | 每月重置後推進海域到 100%，解鎖港口與後續玩法 |
| 前置 | 大世界主線已通關 |
| 關鍵配置 | `OpsiExplore` 的路線與海域順序、`ActionPointPreserve` |
| 驗證 | 海域完成度上升；日誌出現逐海域進入與事件處理 |
| 限制 | 開荒期間不要手動操作遊戲 |

### <DocIcon name="refresh" /> 事件補掃（`OpsiExploreCleanup`）

達到 100% 後，按原順序重新進入普通海域（不進安全海域），全圖識別並逐隊掃描雷達，處理遺漏事件與事件生成的敵人。

它使用獨立的月度斷點，每張圖退出成功後儲存，本月完成後不重複。開荒未完成時會提示先跑開荒。

## <DocIcon name="calendar" /> 每日與商店

| 任務 | 説明 |
| --- | --- |
| `OpsiDaily` | 大世界每日任務，按伺服器刷新排期 |
| `OpsiShop` | 大世界商店（黃幣/紫幣兑換） |
| `OpsiVoucher` | 白票商店 |
| `OpsiAshBeacon` | META 作戰（餘燼信標） |
| `OpsiAshAssist` | META 支援 |

商店類任務的兑換優先級在 `Filter` 中配置。紫幣有限，優先換限定物品。

## <DocIcon name="target" /> 隱秘、深淵、要塞

| 任務 | 用途 | 重置 |
| --- | --- | --- |
| `OpsiObscure` | 隱秘海域，產出紫幣與裝備 | 每月 |
| `OpsiAbyssal` | 深淵座標，高價值掉落 | 每月 |
| `OpsiStronghold` | 塞壬要塞，需要多次進攻 | 每月 |
| `OpsiArchive` | 檔案座標，不消耗行動力 | 每月 |
| `OpsiMonthBoss` | 月度 Boss | 每月 |

::: danger 三個敏感任務
`OpsiObscure`、`OpsiAbyssal`、`OpsiCrossMonth` 預設開啟 `Scheduler.Sensitive`。出錯時實例會停止而不是重新啟動遊戲，避免獎勵丟失或座標錯亂。除非你確認風險，不要關閉。
:::

`OpsiArchive` 的前置條件較硬：

- 通關大世界主線並完成模擬戰 + 塞壬試驗場；
- 啟用每月開荒，或使用戰役資訊記錄儀（5000 油道具）。

## <DocIcon name="circle-alert" /> 耄耋相接與侵蝕 1

| 任務 | 用途 | 關鍵配置 |
| --- | --- | --- |
| `OpsiMeowfficerFarming` | 耄耋相接（貓 farming） | `ActionPointPreserve`、海域與隊伍 |
| `OpsiHazard1Leveling` | 侵蝕 1 練級 | `MinimumActionPointReserve`、練級隊伍、停止條件 |

侵蝕 1 是長期練級的核心：低消耗、可循環、可被智能調度代理。它的配置項較多，預設值適用於大多數情況；不理解機制時不要隨意改。

::: warning 侵蝕 1 的配置風險
任務説明原文是「配置前請確保你已瞭解侵蝕 1 的基礎原理，後果自負」。改保留線與隊伍前，先跑一輪觀察行動力收支。
:::

## <DocIcon name="refresh" /> 跨月每日（`OpsiCrossMonth`）

在大世界跨月重置前 10 分鐘進入，等待重置但不退出，然後完成新一天的每日、隱秘、深淵與耄耋相接，以獲取額外金菜。

- 運行期間**不要操作遊戲**。
- 預設敏感任務，出錯即停。
- 按「大世界每日」等同名任務的設定執行。

## <DocIcon name="circle-dollar" /> 防止行動力溢出（`OpsiPreventActionPointOverflow`）

當前行動力達到上限時執行大世界任務消耗行動力。

- 非必要不開啟。
- 適合「大世界墜機」或長期刷委託、不常進大世界的情況。
- 它可以直接代理一輪智能調度，不要求智能調度自身開關開啟。

## <DocIcon name="video" /> 大世界模擬器（`OpsiSimulator`）

用蒙特卡洛方法估算當前狀態下持續侵蝕循環一段時間後的結果。

- **不影響 AzurPilot 正常運行**，是獨立工具。
- 參數取自配置與統計，配置不準結果就沒意義。
- 目前為 Alpha，結果參考價值有限。

## <DocIcon name="lightbulb" /> 推薦起步配置

```text
OpsiDaily           启用
OpsiShop            启用
OpsiExplore         月初启用，100% 后关闭
OpsiScheduling      开荒完成后启用
OpsiHazard1Leveling 交给智能调度接管
OpsiCrossMonth      月末前确认已配置
```

先跑「大世界每日」驗證基礎導航，再跑開荒，最後才開智能調度。

## <DocIcon name="message" /> 常見問題

| 現象 | 原因 |
| --- | --- |
| 卡在球面圖 | 區域名與資源不匹配，更新核心程序 |
| 行動力見底後不動 | `P ≤ L` 且無法購買，屬預期行為 |
| 黃幣一直補不滿 | 補幣任務失敗或保留值 `K + R` 設得過高 |
| 開荒進度不儲存 | 海域未正常退出，斷點只在成功退出後寫入 |
| 智能調度不接管 | 任務開關未開，或每月開荒尚未完成 |
| 跨月任務中斷 | 敏感任務觸發停止，檢查日誌中的具體異常 |

源碼級細節見[大世界導航](/zh-HK/azurpilot/developer/device-vision#大世界導航)與 [OSMap 結構](/zh-HK/azurpilot/developer/architecture#分層與邊界)。
