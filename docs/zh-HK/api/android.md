---
title: Android 薄介面
description: Android 宿主與 Runtime 之間的 HTTP 約定：狀態、實例控制、日誌、工具任務與熱更掛起。
updated: 2026-10-20
---

# Android 薄介面

Android 宿主不通過 WebSocket 做所有事。啟停實例、讀狀態、掛起更新這些操作走一組更薄的 HTTP 介面，前綴 `/android/`。

## <DocIcon name="clipboard" /> 啟用條件

只有在設定環境變數後才會註冊路由：

```bash
AZURPILOT_ANDROID=1
```

桌面版沒有這些路由。

## <DocIcon name="key" /> 鑑權

```http
GET /android/status HTTP/1.1
X-AzurPilot-Android-Token: <token>
```

要求同時滿足：

1. 請求來自迴環地址（`127.0.0.1` / `::1`）。
2. Header 與 Runtime 持有的 token 常量時間比較一致。

否則返回 `403 {"error": "loopback only"}`。

::: danger 不要把 25548 暴露到區域網絡後指望這層保護
薄介面的安全模型是「只允許本機」。一旦連接埠被轉發出去，其他防護只剩 WebSocket 密碼。
:::

## <DocIcon name="settings" /> 實例參數

所有涉及實例的介面接受查詢參數：

```text
?config=<实例名>
```

省略時：

- 若有正在運行的實例，取第一個；
- 否則用 `alas`。

實例名必須存在，否則返回 400。

## <DocIcon name="plug" /> 端點

| 方法 | 路徑 | 用途 |
| --- | --- | --- |
| GET | `/android/status` | 運行狀態 |
| GET | `/android/configs` | 實例名列表 |
| GET | `/android/logs?tail=N` | 純文本日誌（N ≤ 2000） |
| POST | `/android/start` | 啟動實例 |
| POST | `/android/stop` | 停止實例 |
| POST | `/android/tool/start?name=<tool>` | 啟動工具任務 |
| POST | `/android/tool/stop` | 停止工具任務 |
| GET | `/android/update/status` | 熱更狀態 |
| POST | `/android/update/apply` | 應用熱更 |
| POST | `/android/update/suspend` | 為整包更新掛起所有實例 |

### status

```json
{
  "runner_alive": true,
  "pid": 12345,
  "config": "ap",
  "gui_alive": true,
  "tool_alive": false,
  "tool_name": null,
  "log_lines": 128
}
```

| 字段 | 含義 |
| --- | --- |
| `runner_alive` | 實例在跑且當前不是工具任務 |
| `pid` | 調度器進程號 |
| `config` | 當前實例名 |
| `gui_alive` | 後端存活（當前實現恆為 true） |
| `tool_alive` / `tool_name` | 是否在跑工具任務 |
| `log_lines` | 日誌條目數 |

### start / stop

- `start`：先停掉其他運行中的實例，再啟動目標實例。若目標已經在跑同一個任務，直接返回狀態。
- `stop`：只停目標實例。
- 兩者都會先檢查舊版宿主進程是否佔用設備（探測 `22300` 與 `22400`）。佔用時返回 `DEVICE_BUSY`，提示先停止舊版任務。

### tool/start

支援的工具：

| `name` | 任務 |
| --- | --- |
| `daemon` | `Daemon`（半自動點擊） |
| `event_story` | `EventStory`（活動劇情） |

未知名稱返回 400。工具任務同一時間只能有一個。

### logs

返回 `text/plain`，每行一條，預設 80 行：

```text
GET /android/logs?config=ap&tail=200
```

### update/suspend

整包更新前調用。行為：

1. 枚舉所有運行中的調度器與工具任務。
2. 把實例名寫入 `config/reloadalas`。
3. 逐個優雅停止。
4. 返回 `{"ok": true, "suspended": ["ap", "ap-2"]}`。

下次 WebUI 啟動時 `restart_processes()` 讀取該清單，自動復活被掛起的實例。

::: warning 不要把 suspend 當成普通停止
它寫恢復清單。手動調用後如果不再啟動 WebUI，實例會一直停着。
:::

## <DocIcon name="circle-alert" /> 錯誤

| 狀態碼 | 場景 |
| --- | --- |
| 400 | 實例不存在、未知工具、參數非法 |
| 403 | 非迴環請求或 token 不匹配 |
| 404 | 路徑不存在 |

錯誤體：

```json
{ "error": "DEVICE_BUSY" }
```

錯誤資訊會説明具體原因（如已有實例在運行、舊版任務未停止），按提示處理即可。

## <DocIcon name="scale" /> 與 WebSocket 的分工

| 操作 | 走哪條 |
| --- | --- |
| 配置讀寫、任務參數 | WebSocket |
| 日誌與統計訂閲 | WebSocket |
| 啟停、狀態輪詢 | HTTP 薄介面 |
| 熱更 | HTTP 薄介面 |

Android 宿主用 HTTP 做「開關」，用 WebSocket 做「數據面」。這樣即使 WebSocket 斷線，宿主仍能安全地停止實例。
