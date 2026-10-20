---
title: MCP 服務
description: 18 個 MCP 工具的用途、掛載方式、鑑權與客戶端接入配置，以及和 WebSocket API 的邊界。
updated: 2026-10-20
---

# MCP 服務

MCP（Model Context Protocol）讓支援該協議的客戶端（編輯器、Agent 工具）直接查詢和控制 AzurPilot。它是**另一條入口**，不是 WebSocket API 的替代品。

## <DocIcon name="rocket" /> 兩種運行方式

| 方式 | 端點 | 説明 |
| --- | --- | --- |
| 隨 WebUI 掛載 | `http://<host>:25548/mcp/sse` | 預設，複用 WebUI 進程 |
| 獨立服務 | `python mcp_server_sse.py`，連接埠 `22268` | 調試或分離部署 |

::: warning 22268 與 OCR 衝突
獨立 MCP 與 OCR 服務預設都用 22268。同機運行兩者時，先改其中一個連接埠。
:::

## <DocIcon name="key" /> 鑑權

MCP 複用 WebUI 密碼（`--key` 或 `deploy.yaml` 的 `Password`）：

| 方式 | 寫法 |
| --- | --- |
| 請求頭（推薦） | `Authorization: Bearer <密码>` |
| 兼容頭 | `X-API-Key: <密码>` |
| 查詢參數 | `?key=<密码>`（僅限無法自定義 Header 的客戶端） |

不帶憑據返回 `401`。修改密碼後需要重新啟動 WebUI，MCP 才會使用新密碼。

::: danger 查詢參數就是憑據
`?key=` 會出現在日誌、歷史記錄與截圖中。有條件就改用 Header。
:::

## <DocIcon name="settings" /> 客戶端配置

本地：

```json
{
  "mcpServers": {
    "azurpilot": {
      "url": "http://127.0.0.1:25548/mcp/sse",
      "headers": { "Authorization": "Bearer <WebUI 密码>" }
    }
  }
}
```

遠程或內網：

```json
{
  "mcpServers": {
    "azurpilot": {
      "url": "http://<IP_ADDRESS>:25548/mcp/sse",
      "headers": { "Authorization": "Bearer <WebUI 密码>" }
    }
  }
}
```

連接埠被改過時同步替換。

## <DocIcon name="clipboard" /> 工具清單

共 18 個工具。

| 類別 | 工具 | 作用 |
| --- | --- | --- |
| 實例 | `list_instances` | 列出所有實例 |
| 實例 | `get_status` | 獲取實例狀態 |
| 實例 | `start_instance` | 啟動實例 |
| 實例 | `stop_instance` | 停止實例 |
| 任務 | `list_tasks` | 列出所有任務 |
| 任務 | `get_task_help` | 獲取任務幫助 |
| 任務 | `trigger_task` | 觸發任務 |
| 任務 | `get_scheduler_queue` | 獲取調度隊列 |
| 任務 | `clear_scheduler_queue` | 清空調度隊列 |
| 監控 | `get_current_running_task` | 當前運行任務 |
| 監控 | `get_resources` | 資源狀態 |
| 監控 | `get_config` | 實例配置 |
| 監控 | `get_recent_logs` | 最近日誌 |
| 監控 | `get_screenshot` | 當前截圖 |
| 配置 | `update_config` | 更新配置 |
| 維護 | `restart_emulator` | 重新啟動模擬器 |
| 維護 | `restart_adb` | 重新啟動 ADB |
| 維護 | `update_alas` | 更新 AzurPilot |

::: tip 參數以伺服端聲明為準
MCP 客戶端會通過 `tools/list` 拿到每個工具的 JSON Schema。這裏只説明用途，不復制容易過期的參數定義。
:::

## <DocIcon name="lightbulb" /> 典型用法

### 讓 Agent 巡檢

```text
1. list_instances           → 有哪些实例
2. get_status(instance)     → 哪个在跑、当前任务
3. get_recent_logs(...)     → 有没有异常
4. get_resources(...)       → 石油/物资是否异常
```

### 手動干預

```text
trigger_task(instance, task)   → 立即执行某任务
clear_scheduler_queue(...)     → 清掉排错时堆积的队列
restart_adb(...)               → ADB 掉线
```

### 危險操作

`update_alas`、`restart_emulator`、`clear_scheduler_queue` 都會中斷正在運行的任務。讓 Agent 自動調用前，先確認它理解後果。

::: danger 不要讓 Agent 無人監督地改配置
`update_config` 是寫操作，會直接落盤並影響後續調度。沒有 revision 衝突保護的外部寫入可能覆蓋用戶手動修改。
:::

## <DocIcon name="scale" /> 與 WebSocket 的分工

| 能力 | MCP | WebSocket |
| --- | --- | --- |
| 列出/啟停實例 | ✅ | ✅ |
| 精細配置讀寫 | 有限（`update_config`） | ✅ 完整 |
| 實時訂閲 | ❌ | ✅ |
| 調度程序編輯 | ❌ | ✅ |
| 面向 AI 客戶端 | ✅ | 需自建 |

MCP 是「給 Agent 的窄介面」，WebSocket 是「給前端的完整介面」。

## <DocIcon name="shield" /> 安全建議

1. 只在需要時開啟，不要長期暴露到公網。
2. 密碼要強，且與遊戲帳號不同。
3. 遠程訪問優先走 WSS / Tunnel，不要把 25548 直接映射到公網。
4. 查看 Agent 的工具調用記錄，尤其是寫操作。
5. 不用時重新啟動 WebUI 並更換密碼。

## <DocIcon name="wrench" /> 疑難排解

| 現象 | 原因 |
| --- | --- |
| 401 | 未帶憑據、密碼錯誤、改密碼後未重新啟動 |
| 連接被拒 | 連接埠不對，或 MCP 未隨 WebUI 啟動 |
| 工具調用超時 | 實例正在執行長任務，後端繁忙 |
| 返回舊配置 | 配置快取，重新 `get_config` |
| 獨立服務起不來 | 22268 被 OCR 佔用 |
