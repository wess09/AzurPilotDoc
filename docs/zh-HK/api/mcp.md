
---
title: MCP 服務
description: 25 個 azurpilot_ 工具、SSE 接入、驗證、裝置控制租約與相容入口邊界。
updated: 2026-11-08
---

# MCP 服務

MCP（Model Context Protocol）讓支援該協定的用戶端與 Agent 直接查詢、管理及操作 AzurPilot。它是面向 AI 用戶端的語義介面，不是 WebSocket API 的替代品。

## 端點與驗證

| 方式 | 端點 | 說明 |
| --- | --- | --- |
| 隨 WebUI 掛載 | `http://<host>:25548/mcp/sse` | 預設方式，與 WebUI 共用 Runtime 和實例 |
| 獨立服務 | `uv run python mcp_server_sse.py`，預設連接埠 22268 | 獨立部署或除錯 |

獨立 MCP 與 OCR 服務預設都使用 22268 連接埠；同機執行時必須修改其中一個。MCP 使用 WebUI 密碼，建議使用 `Authorization: Bearer <WebUI 密碼>`，相容方式為 `X-API-Key: <WebUI 密碼>`；只有無法設定 Header 時才使用 `?key=<WebUI 密碼>`。修改密碼後需要重新啟動 WebUI。

::: danger 不要把密碼放進 URL
查詢參數可能出現在存取日誌、歷史紀錄或截圖中。優先使用 Authorization Header。
:::

## 預設工具目錄：25 個工具

預設端點只公開以下 25 個 **azurpilot_** 工具。舊名稱只會在明確建立的相容入口中提供。

| 分組 | 工具 | 用途 |
| --- | --- | --- |
| 實例 | **azurpilot_list_instances**、**azurpilot_get_context**、**azurpilot_start_instance**、**azurpilot_stop_instance** | 實例列表、上下文、啟動和停止 |
| 任務 | **azurpilot_search_tasks**、**azurpilot_get_task_schema**、**azurpilot_set_task_schedule** | 搜尋任務、讀取 Schema、設定啟用狀態與下次執行 |
| 設定 | **azurpilot_get_config**、**azurpilot_patch_config** | 讀取設定與 revision；驗證 revision 後原子修改，支援 dry_run |
| 日誌 / 統計 | **azurpilot_get_logs**、**azurpilot_get_statistics**、**azurpilot_get_statistics_schema** | 日誌、概覽 / 資源 / 大世界 / 委託 / 科研統計及指標定義 |
| 裝置 | **azurpilot_observe_device**、**azurpilot_acquire_device_control**、**azurpilot_release_device_control** | 截圖、取得和釋放裝置控制租約 |
| 裝置輸入 | **azurpilot_click**、**azurpilot_swipe**、**azurpilot_long_press**、**azurpilot_input_text**、**azurpilot_press_key**、**azurpilot_adb_shell** | 點擊、滑動、長按、文字、按鍵及受控 ADB Shell |
| 操作查詢 | **azurpilot_get_operation** | 查詢寫入操作狀態和最終結果 |
| 維護 / 更新 | **azurpilot_restart_emulator**、**azurpilot_restart_adb**、**azurpilot_update_application** | 重新啟動模擬器、ADB 或要求更新核心程式 |

## 裝置控制與寫入操作語義

- 直接控制裝置前，先用 **azurpilot_acquire_device_control** 取得租約；完成後用 **azurpilot_release_device_control** 釋放。
- 先用 **azurpilot_observe_device** 取得畫面與 frame_id。座標操作可攜帶 frame_id，避免畫面尺寸或方向改變後使用過期座標。
- 輸入工具會區分命令已下發與畫面是否變化。**命令已下發不代表介面已回應，更不代表任務完成。**
- 寫入操作支援 request_id 去重並回傳 operation_id。逾時且結果不確定時，先用 **azurpilot_get_operation** 查詢，不要盲目重試。
- **azurpilot_patch_config** 使用 revision 防止覆蓋並行修改；修改前先讀取設定，必要時使用 dry_run。
- **azurpilot_set_task_schedule** 只表示排程已修改，不代表遊戲內操作成功。

預設目錄不包含 get_status、get_resources、get_recent_logs、trigger_task 和 clear_scheduler_queue 等舊名稱。舊名稱只在明確建立的相容入口中提供。

典型順序：使用 **azurpilot_list_instances** 選擇實例，再以 **azurpilot_get_context** 檢查狀態；修改設定前先讀取；直接控制裝置前先觀測畫面並取得租約；結果不確定的寫操作使用 **azurpilot_get_operation** 核實。

MCP 是面向 Agent 的精簡介面；WebSocket 是面向 WebUI、Android 宿主及自建用戶端的完整介面。完整方法見 [WebSocket API](/zh-TW/api/websocket)。
