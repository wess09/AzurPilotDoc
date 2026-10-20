---
title: 通知、日誌與統計
description: 日誌檔案與錯誤現場的位置、OnePush 推送配置、LLM 錯誤分析、每日日報與統計報表。
updated: 2026-10-20
---

# 通知、日誌與統計

無人值守的前提是「出問題能知道」。核心程式提供三層可觀測性：日誌落盤、錯誤現場、主動推送。

## <DocIcon name="scroll" /> 日誌

| 內容 | 位置 |
| --- | --- |
| 實例執行日誌 | `log/<日期>_<实例名>.txt` |
| 啟動器日誌 | `log/<日期>_launcher.txt`（Launcher 倉庫） |
| 錯誤現場 | `log/error/<实例名>/<时间戳>/` |
| 調試服務 | 環境變數 `ALAS_DEBUG_SERVER=1` 時啟用，僅監聽本機 |

日誌按天追加，任務邊界用分隔線標出：

```text
2026-10-20 09:00:12.345 | INFO | [AzurPilot] 调度器: 开始任务
2026-10-20 09:00:12.346 | INFO | ──────────────── 科研 ────────────────
2026-10-20 09:02:41.002 | INFO | [AzurPilot] 调度器: 结束任务
```

### <DocIcon name="circle-alert" /> 錯誤現場

發生異常時，程序會儲存最近若干張截圖與截斷後的 `log.txt`，並對帳號資訊做遮罩。相關配置：

| 配置 | 預設 | 說明 |
| --- | --- | --- |
| `Error.SaveError` | 開 | 是否儲存現場 |
| `Error.ScreenshotLength` | — | 保留最後 X 張截圖 |
| `Error.SaveErrorRetentionDays` | — | 過期天數，0 = 不清理 |
| `Error.SaveErrorBackUpMethod` | — | 過期後刪除 / 拷貝 / 壓縮 |
| `Error.SaveErrorZipMethod` | `zip` | 壓縮格式（bz2 / gzip / xz / zip） |

::: tip 提 Issue 時附什麼
`log/error/<实例名>/<时间戳>/` 裡的 `log.txt` 與截圖，加上你的模擬器類型、截圖方案、控制方案。不要附 `config/deploy.yaml` 或 `remote-access.json`。
:::

## <DocIcon name="megaphone" /> 通知

### <DocIcon name="send" /> OnePush

`Error.OnePushConfig` 使用 OnePush 的配置格式，把任務結果與錯誤推送到多種渠道（Telegram、Server 醬、企業微信等，具體支援以 OnePush 說明文件為準）。

兩條推送路徑：

| 路徑 | 觸發 |
| --- | --- |
| 任務結束推送 | 任務開啟 `Scheduler.PushNotification` |
| 錯誤推送 | 無法自動處理的異常 |

### <DocIcon name="clock" /> 低推送量模式

`Error.LowPushMode` 開啟後，能自動恢復的錯誤（遊戲未執行、模擬器離線、卡死）只記日誌不推送；需要人工介入的錯誤仍然推送。適合 7×24 長期執行，避免被自動重試刷屏。

### <DocIcon name="monitor" /> WebUI 通知

即使不配 OnePush，WebUI 也會收到實時通知流（SSE）。啟動器的原生通知與 Android 的前臺通知都基於這條流。

## <DocIcon name="brain" /> LLM 錯誤分析

`Error.LlmAnalysis` 預設開啟時會調用 OpenAI 兼容介面分析異常，給出可能原因。相關字段：

| 字段 | 說明 |
| --- | --- |
| `LlmApiKey` | 服務商 API Key |
| `LlmApiBase` | OpenAI 兼容 Base URL |
| `LlmModel` | 模型名 |

分析結果寫入日誌，不會自動執行修復動作。

::: warning 會把日誌發出去
分析需要把錯誤日誌片段發送到你配置的模型服務。如果你不接受，關閉 `LlmAnalysis`。
:::

## <DocIcon name="calendar" /> 每日日報

`Alas.DailySummary.Enable` 預設關閉。開啟後按 `TriggerTime`（預設 20:00）彙總當天的任務、資源與掉落，通過推送渠道發送。

日報執行緒獨立於排程主執行緒，只讀設定檔的只讀快照，不訪問正在執行任務的 `config` 對象。

## <DocIcon name="eye" /> 統計

統計頁的數據來自 SQLite 總庫，按類別組織：

| 分類 | 內容 |
| --- | --- |
| 資源 | 石油、物資、鑽石、魔方、行動力等曲線 |
| 出擊 | 關卡、次數、油耗、掉落 |
| 大世界 | 侵蝕循環、海域、行動力收支 |
| 委託 | 委託類型與完成數 |
| 科研 | 專案、耗時、產出 |
| 艦船 | 掉落與獲取記錄 |
| 倉庫 | 材料庫存與消耗 |

「資源管理」視圖額外提供桑基圖（資源流向）與庫存對賬，並把石油控制線接到 `General.OilControl`。

::: tip 統計不是實時截圖
資源值來自任務執行時的截圖讀取與掉落後計算，不是持續輪詢。長時間不跑任務時，曲線會停在那裡，這是正常的。
:::

## <DocIcon name="plug" /> 外部監控

- <DocIcon name="plug" /> **MCP**：`get_status`、`get_resources`、`get_recent_logs` 可以讓支援 MCP 的客戶端讀取狀態。見 [MCP 服務](/zh-TW/api/mcp)。
- <DocIcon name="zap" /> **WebSocket**：訂閱 `overview`、`logs`、`statistics` 主題，自建看板。見 [WebSocket API](/zh-TW/api/websocket)。
- <DocIcon name="scroll" /> **日誌檔案**：直接 tail `log/<日期>_<实例>.txt`，適合接入現有的日誌系統。

## <DocIcon name="clipboard" /> 遠端診斷清單

出問題時按這個順序收集資訊，能省掉大部分來回：

1. WebUI 總覽的當前任務與最後 100 行日誌。
2. `log/error/` 下最新目錄的 `log.txt` 與截圖。
3. 模擬器類型、解析度、截圖/控制方案。
4. 實例配置匯出（刪除敏感字段後）。
5. 是否剛更新過核心 / 啟動器 / Runtime。
