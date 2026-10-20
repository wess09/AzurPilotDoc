---
title: 調度器與任務編排
description: 任務何時運行、按什麼順序運行、失敗後如何恢復；優先級、間隔、囤積、預熱與敏感任務的配置方法。
updated: 2026-10-20
---

# 調度器與任務編排

調度器只回答一個問題：**現在該跑哪個任務**。它不實現任何遊戲邏輯，也不併發執行任務——同一實例內，任務永遠是一個接一個串行跑的。

<SchedulerFlow />

<Figure caption="每輪循環都會重新讀一次磁盤配置。配置熱重載發生在任務邊界，而不是任務執行中途。" />

## <DocIcon name="clipboard" /> 任務的狀態

每個任務只有三個真正重要的字段：

| 字段 | 含義 |
| --- | --- |
| `Scheduler.Enable` | 是否加入調度 |
| `Scheduler.NextRun` | 下一次允許運行的時間戳（持久化在設定檔裏） |
| `Scheduler.Command` | 內部任務名，與 `alas.py` 方法對應 |

當 `NextRun` 早於當前時間且任務已啟用，它就進入待執行集合。調度器從待執行集合裏按優先級挑一個；如果沒有待執行任務，就取最近到期的那個並等待。

::: tip 清空 NextRun = 立即運行
把「下一次運行時間」清空，等價於把它設為過去時間。這是手動觸發任務最直接的方式。
:::

## <DocIcon name="crown" /> 優先級怎麼定

預設優先級在 `module/config/config_manual.py` 的 `_DEFAULT_SCHEDULER_PRIORITY` 中定義。用戶可以覆蓋：

> 系統設定 → 通用設定 → **自定義任務優先級**

格式是每行一個任務命令，越靠前越優先：

```text
Restart
Commission
Research
Reward
OpsiScheduling
Main
```

沒有列出的任務排在後面，按預設順序。

::: warning 優先級不是萬能的
優先級只在「多個任務同時到期」時決定誰先跑。一個任務跑多久由它自己決定，調度器不會中途搶佔。想讓某任務快點結束，調它自己的停止條件，而不是調優先級。
:::

## <DocIcon name="clock" /> 時間安排

| 配置 | 作用 |
| --- | --- |
| `SuccessInterval` | 成功後推遲多少分鐘再跑（0 表示任務自己安排） |
| `FailureInterval` | 失敗後推遲多少分鐘（預設 120） |
| `ServerUpdate` | 伺服器刷新時間，每日任務的排期基準 |

任務內部通常調用 `task_delay(success=True/False)` 來寫入下一次時間。不同玩法的間隔差異很大：委託可能十幾分鍾，科研幾小時，每日任務固定到伺服器刷新後。

### <DocIcon name="package" /> 囤積

`Optimization.TaskHoardingDuration` 大於 0 時，等待中的任務會在計劃時間上再加一段「囤積時長」。比如 12:00 到期、囤積 10 分鐘，實際最早 12:10 運行。

用途是把多個零散任務聚到一起跑，減少喚醒次數。代價是時間精度下降，不適合對時間敏感的活動。

### <DocIcon name="zap" /> 預熱

`Optimization.WarmupEnable` 開啟後，調度器會在任務開始前提前啟動模擬器與遊戲，登入到主介面等着。提前量取自上次實測耗時 + 2 分鐘；沒有實測時用 `WarmupMinutes`（預設 15 分鐘）。

這對冷啟動很慢的機器意義很大：任務到點時遊戲已經就緒，不用再等兩分鐘。

## <DocIcon name="circle" /> 空閒時做什麼

沒有到期任務時，按 `Optimization.WhenTaskQueueEmpty` 處理：

| 值 | 行為 |
| --- | --- |
| `goto_main` | 停在主介面（預設） |
| `close_game` | 關閉遊戲，省記憶體 |
| `stay_there` | 保持當前畫面不動 |

如果等待超過 3 小時且 `CloseEmulatorDuringLongWait` 開啟，會直接關閉模擬器；醒來後重新拉起並走登入流程。無線 ADB / SSH 遠程設備會跳過這個優化。

## <DocIcon name="wrench" /> 失敗與恢復

調度器把失敗當作常態。異常按「恢復力度」分級：

| 異常 | 恢復動作 |
| --- | --- |
| 遊戲未運行 | 重新啟動遊戲 |
| 遊戲卡死 / 連點 | 重新啟動遊戲；連續達到閾值後重新啟動模擬器 |
| 頁面無法識別 | 先查伺服器狀態；可用則重新啟動遊戲，維護中則等待 |
| 模擬器離線 | 重新啟動模擬器（永不放棄，只拉長間隔） |
| 代碼異常（`ScriptError`） | 連續 3 次後退出進程 |
| 敏感任務失敗 | 立即停止實例，儲存現場並推送 |

只有四種情況會真正停止調度：

1. <DocIcon name="circle-x" /> `ScriptError` 連續 3 次（代碼缺陷，重試無意義）。
2. <DocIcon name="warning" /> 敏感任務失敗（避免在錯誤狀態上繼續寫入）。
3. <DocIcon name="hand" /> 收到停止 / 更新信號。
4. <DocIcon name="circle-alert" /> 配置或設備初始化就失敗。

其餘故障都會自動恢復，最外層還有指數退避兜底（20 秒起步，300 秒封頂）。

### <DocIcon name="warning" /> 敏感任務

`Scheduler.Sensitive` 預設對以下任務開啟：

- <DocIcon name="warning" /> `OpsiCrossMonth`（跨月每日）
- <DocIcon name="warning" /> `OpsiObscure`（隱秘海域）
- <DocIcon name="warning" /> `OpsiAbyssal`（深淵座標）

這些環節出錯時重新啟動遊戲可能造成獎勵丟失或狀態錯亂，所以選擇「停下來等人」。是否敏感是運行時讀配置判斷的，你可以按自己的風險偏好調整。

### <DocIcon name="refresh" /> 同一任務連續重新啟動上限

`Error.TaskRestartLimit`（預設 3，0 = 不限制）限制同一任務連續恢復的次數。超過後：

1. <DocIcon name="clock" /> 把該任務的 `NextRun` 推到伺服器次日零點。
2. <DocIcon name="megaphone" /> 發送錯誤推送與 WebUI 提醒（低推送量模式也保留）。
3. <DocIcon name="refresh" /> 其他任務繼續調度。

任務成功一次即清零。`Restart` 本身豁免此限制，避免遊戲沒起來時整個隊列連環失敗。

## <DocIcon name="eye" /> 運行監護

長時間卡在一個任務裏（劇情跳不過、尋路死循環）時，調度器自己發現不了，因為日誌還在動。運行監護補上這一環：

| 配置 | 預設 | 作用 |
| --- | --- | --- |
| `Error.WatchdogEnable` | 關 | 總開關 |
| `Error.WatchdogTaskEnable` | 關 | 任務超時檢測 |
| `Error.WatchdogTaskTimeout` | 120 分鐘 | 超過即重新啟動模擬器打斷任務 |

監護執行緒每 30 秒檢查一次，且只在任務執行期間啟用——空閒等待不會被誤判。

## <DocIcon name="badge-dollar" /> 石油自動控制

`General.OilControl.Enable` 預設關閉，`Target` 預設 24000（可設 1000–24999）。

開啟後，在**原調度**模式下，石油超過控制線會臨時插入清油流程：

- <DocIcon name="rocket" /> 先跑已到期的出擊圖；
- <DocIcon name="badge-dollar" /> 沒有可跑的圖時，調用後宅購糧；
- <DocIcon name="circle-check" /> 清理完成後恢復原本的業務順序。

它不改寫你的優先級配置，也不適用於「增強調度」與「完全接管」模式——那兩種模式下由調度程序自己決定。

## <DocIcon name="refresh" /> 每日重新啟動

`Alas.Restart.RandomDelay` 控制每日重新啟動在伺服器刷新後的隨機延後，格式為單個數字或區間（如 `5, 50` 分鐘），用於錯開多客戶端登入。填 `0` 關閉。

`Restart.ClearCache` 會在重新啟動時刪除遊戲的外部快取目錄（`/sdcard/Android/data/<包名>/cache/`）。部分渠道服需要它來清理登入態。

## <DocIcon name="rocket" /> 下一步

<ul class="ap-linklist">
<li><a href="/zh-HK/azurpilot/user/tasks/">任務手冊<span class="desc">每個玩法怎麼配</span></a></li>
<li><a href="/zh-HK/azurpilot/user/multi-instance">多實例與配置管理<span class="desc">多開時的隔離</span></a></li>
<li><a href="/zh-HK/azurpilot/developer/scheduler">調度器生命週期<span class="desc">源碼級細節</span></a></li>
</ul>
