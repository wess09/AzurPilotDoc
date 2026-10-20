---
title: 輔助工具任務
description: 系統設定、退役與強化、情緒管理、日誌與掉落記錄，以及掃描、基準測試、半自動等工具類任務。
updated: 2026-10-20
---

# 輔助工具任務

「工具」分組裡的任務不產出資源，它們負責掃描、測試、半自動操作，或者修改系統級行為。系統設定（`Alas`、`General`、`Restart`）也放在這一頁，因為它們同樣不屬於某個具體玩法。

## <DocIcon name="settings" /> 系統設定（`Alas`）

### <DocIcon name="monitor" /> 模擬器與錯誤

| 組 | 關鍵字段 | 作用 |
| --- | --- | --- |
| `Emulator` | `Serial`、`PackageName`、`ScreenshotMethod`、`ControlMethod` | 設備連接，詳見[連接模擬器](/zh-TW/azurpilot/user/device) |
| `Error` | `HandleError`、`StrictRestart`、`TaskRestartLimit`、`LowPushMode` | 異常處理與推送 |
| `Optimization` | `OcrDevice`、`ScreenshotInterval`、`TaskHoardingDuration`、`WarmupEnable` | 識別設備、截圖節奏、囤積與預熱 |
| `EmulatorManagement` | `ScheduledEmulatorRestart`、`RestartIntervalHours`、`DeepRestartAfterFailures` | 計劃重新啟動與深度重新啟動 |
| `Backup` | `Enable`、`KeepDays` | 每日備份 |
| `DailySummary` | `Enable`、`TriggerTime` | 每日日報 |
| `DropRecord` | `SaveFolder`、`RetentionDays`、各類記錄開關 | 掉落截圖與記錄 |

`Optimization.OcrDevice` / `OcrBackend` 決定 OCR 用 CPU 還是 GPU。Android 宿主上還有 NPU 選項；桌面端一般保持自動。

### <DocIcon name="gift" /> 掉落記錄（`DropRecord`）

按類別儲存掉落截圖與結構化記錄：科研、委託、戰鬥、大世界各玩法、指揮喵等。`RetentionDays` 控制保留天數，過期按 `BackUpMethod` 刪除或壓縮。

`AzurStatsID` / `API` 是社區統計服務的接入字段。不打算上報就留空。

## <DocIcon name="pencil" /> 通用設定（`General`）

### <DocIcon name="circle-off" /> 退役（`Retirement` / `OneClickRetire` / `OldRetire`）

| 字段 | 說明 |
| --- | --- |
| `Retirement.RetireMode` | 退役模式（一鍵退役 / 舊版逐艘） |
| `OneClickRetire.KeepLimitBreak` | 保留已突破的艦船 |
| `OldRetire.N/R/SR/SSR` | 各稀有度的處理策略 |
| `OldRetire.RetireAmount` | 單次退役數量 |

退役策略必須與遊戲內「一鍵退役設定」配合，否則會出現「腳本選中的船和遊戲過濾的不一致」。

::: danger 退役不可逆
第一次配置時先用小批量驗證。把 `RetireAmount` 設為 1，確認腳本選中的船符合預期後再放開。
:::

### <DocIcon name="zap" /> 強化（`Enhance`）

| 字段 | 說明 |
| --- | --- |
| `ShipToEnhance` | 要強化的艦船 |
| `Filter` | 作為材料的艦船篩選 |
| `CheckPerCategory` | 按類別檢查 |
| `KeepCommonCV` | 保留普通航母（部分玩法需要） |

### <DocIcon name="sparkles" /> 公共情緒（`PublicEmotion`）

跨任務共享心情與艦隊狀態：

| 字段 | 說明 |
| --- | --- |
| `Enable` | 啟用公共情緒管理 |
| `Tasks` | 參與管理的任務 |
| `FleetValue` / `FleetRecord` | 艦隊心情值與記錄 |
| `FleetRecoveryState` / `FleetRecover` | 恢復狀態與恢復策略 |
| `FleetOath` / `FleetOnsen` | 誓約、溫泉恢復 |

心情不足時任務會主動休眠，避免紅臉出擊導致好感下降。

### <DocIcon name="badge-dollar" /> 石油控制與優先級

| 字段 | 說明 |
| --- | --- |
| `OilControl.Enable` / `Target` | 原排程下的石油自動控制，預設關閉，目標 24000 |
| `YukikazeTaskManager.TaskPriorityAdjustment` | 自定義任務優先級（每行一個命令） |

## <DocIcon name="clock" /> 執行參數（`RunParams`）

這一組控制「等待多久算異常」，普通使用保持預設。

| 子組 | 關鍵字段 | 預設 | 說明 |
| --- | --- | --- | --- |
| `Watchdog` | `CheckInterval` | 30 秒 | 執行監護檢查間隔 |
| `Watchdog` | `DailySummaryCheckInterval` | 1 秒 | 日報檢查間隔 |
| `Reboot` | `Tries` | 3 | 遊戲啟動重試次數 |
| `Reboot` | `FirstTryWaitSeconds` / `SubsequentTryWaitSeconds` | 30 / 20 秒 | 重試等待 |
| `Reboot` | `ObserveSeconds` / `ObserveInterval` | 180 / 15 秒 | 觀察階段 |
| `Device` | `Mumu12StopWaitTimeout` | 60 秒 | MuMu12 關閉確認等待 |
| `UiWait` | 各介面等待 | — | 島嶼、宿舍、抽卡等介面的超時 |
| `Handover` | `MaintainLeadMinutes` | — | 作戰委託的維護提前量 |

改這些值的典型場景：機器很慢、模擬器啟動要兩分鐘以上，適當調大 `Reboot` 的等待；而不是關掉異常處理。

## <DocIcon name="search" /> 掃描類工具

### 艦隊掃描（`FleetScan`）

掃描當前編入艦隊的艦娘資訊，結果在「艦隊資訊」頁查看。用於核對艦隊配置，不修改遊戲狀態。

### <DocIcon name="brain" /> 心智單元船塢掃描（`MindCalculatorScan`）

掃描國服 1280×720 船塢，結果供心智單元計算器核對。

- 完成前保留舊數據；
- **會重置船塢篩選**；
- 識別不確定時會報 `MindCalculatorScanError`，不會寫入半成品。

### <DocIcon name="medal" /> 艦船科技掃描（`FleetTechScan`）

獨立記錄艦船身份與等級，不按心智計費條件排除。用於「艦隊科技」頁的科技點統計。

### <DocIcon name="crown" /> 指揮喵評分（`MeowfficerScore`）

| 字段 | 說明 |
| --- | --- |
| `Source` / `Folder` | 圖片來源（設備截圖或指定目錄） |
| `MaxImages` / `ScanLimit` / `ScanPasses` | 掃描數量與次數 |
| `DeviceShots` / `DeviceInterval` | 設備截圖與間隔 |
| `ReportPath` | 報告輸出路徑 |

識別指揮喵天賦，按公開攻略口徑評分。適合批量篩選，不改變遊戲內任何狀態。

## <DocIcon name="hand" /> 輔助類工具

| 任務 | 用途 | 注意 |
| --- | --- | --- |
| `Daemon` | 半自動點擊：進入地圖後由你手動操作，腳本只處理重複點擊 | 適合活動機制腳本不支援時 |
| `OpsiDaemon` | 大世界半自動：修理、選敵由腳本做 | 需要人在旁邊 |
| `EventStory` | 活動劇情自動跳過 | `SkipBattle` 控制是否跳過戰鬥 |
| `BoxDisassemble` | 批量拆裝備箱 | 可分別設定紫/藍/白箱上限 |
| `AutoEquip` | 自動裝備（快速更換 + 按艦船遍歷） | 換裝策略尚在完善 |
| `EmulatorManager` | 手動重新啟動模擬器入口 | 支援 SSH 遠端命令 |
| `GameManager` | 遊戲管理器 | **未完成**，不要依賴 |

### <DocIcon name="shield" /> 反和諧（`AzurLaneUncensored`）

按 `Repository` 配置替換資源。這屬於修改客戶端檔案，存在帳號風險，且與自動化識別無關。是否使用由你自行判斷。

## <DocIcon name="flask" /> 基準與測試

| 任務 | 用途 |
| --- | --- |
| `Benchmark` | 性能測試：`DeviceType`、`TestScene` |
| `OcrBenchmark` | OCR 性能測試，輔助選擇推理設備 |

跑基準前關閉其他實例，否則測出來的耗時沒有參考價值。

## <DocIcon name="folder" /> 系統級配置放在哪

| 想改什麼 | 位置 |
| --- | --- |
| WebUI 連接埠、密碼、語言 | `config/deploy.yaml` |
| 實例任務開關與參數 | `config/<实例>.json` |
| 模擬器 Serial 與截圖方案 | 系統 → 模擬器設定 |
| 異常處理與推送 | 系統 → 調試設定 |
| 備份與日報 | 系統 → 備份 / 日報 |
| 私有部署的遠端服務地址 | `config/remote-access.json` 與註冊服務配置 |
