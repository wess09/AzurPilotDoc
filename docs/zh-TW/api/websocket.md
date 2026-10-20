---
title: WebSocket API v1
description: 核心程式的 WebSocket API v1：協議信封、會話建立、訂閱主題、錯誤語義，以及 72 個方法的完整清單與可執行調用示例。
updated: 2026-10-20
---

# WebSocket API v1

端點：

```text
ws://127.0.0.1:25548/api/v1/ws
wss://<远程入口>/api/v1/ws
```

協議版本 `v=1`。所有消息都是 JSON 文本幀。

## <DocIcon name="file" /> 信封

### 請求

```json
{
  "v": 1,
  "type": "request",
  "id": "req-001",
  "method": "instances.list",
  "params": {}
}
```

| 字段 | 約束 |
| --- | --- |
| `v` | 必須為 `1` |
| `type` | `request` |
| `id` | 1–100 字符，同一會話內不能重複 |
| `method` | 已註冊方法名 |
| `params` | 嚴格模型，禁止額外字段 |

### 成功響應

```json
{ "v": 1, "type": "response", "id": "req-001", "ok": true, "result": [] }
```

### 失敗響應

```json
{
  "v": 1,
  "type": "response",
  "id": "req-001",
  "ok": false,
  "error": { "code": "INVALID_PARAMS", "message": "请求格式或参数不正确", "details": [] }
}
```

### 事件

```json
{ "v": 1, "type": "event", "topic": "overview", "data": {} }
```

## <DocIcon name="handshake" /> 會話

連接後伺服器主動推送：

```json
{
  "v": 1,
  "type": "event",
  "topic": "session",
  "data": { "authRequired": true, "protocolVersion": 1 }
}
```

- `authRequired: false` 表示本機迴環且未設密碼，直接可調用。
- 未鑑權時讀超時 30 秒，已鑑權 60 秒。

### 登入

```json
{
  "v": 1, "type": "request", "id": "a1", "method": "auth.login",
  "params": { "password": "<WebUI 密码>" }
}
```

遠端配對客戶端提交的是配對憑據，不是主密碼。撤銷配對後，下一次請求（含 15 秒心跳）會返回 `UNAUTHORIZED`。

## <DocIcon name="megaphone" /> 訂閱

```json
{
  "v": 1, "type": "request", "id": "s1", "method": "events.subscribe",
  "params": { "instance": "ap", "topics": ["overview", "logs", "statistics"] }
}
```

| 主題 | 數據 | 採樣 |
| --- | --- | --- |
| `instances` | 實例列表與執行狀態 | 2 秒 |
| `overview` | 當前任務、資源 | 1 秒 |
| `logs` | 增量日誌 | 變更即推 |
| `preview` | 截圖預覽 | 變更即推 |
| `statistics` | 統計報表 | 1 秒 |
| `notifications` | 通知流 | 事件 |
| `stock` | 交易所 | 事件 |

::: warning 訂閱是整體替換
再次訂閱會清空舊主題。Android 宿主因此只允許一個全局訂閱者；外部工具不要和前端同時訂閱同一實例後互相覆蓋。
:::

## <DocIcon name="circle-alert" /> 限制與錯誤碼

| 項 | 值 |
| --- | --- |
| 單條消息 | ≤ 8 MiB |
| 普通請求 | ≤ 1 MiB |
| 大請求例外 | `mind.import`、`mind.recognize`、`mind.save`、`mind.calculate` |
| 頻率 | 30 請求 / 秒 |

| 錯誤碼 | 含義 |
| --- | --- |
| `INVALID_REQUEST` | 信封/大小不合法 |
| `INVALID_PARAMS` | 參數校驗失敗 |
| `UNAUTHORIZED` | 未登入或配對撤銷 |
| `TLS_REQUIRED` | 遠端帳號操作未走 WSS |
| `RATE_LIMITED` | 請求過頻 |
| `DUPLICATE_REQUEST` | 請求 ID 複用 |
| `INTERNAL_ERROR` | 伺服端異常，詳情不返回 |

參數錯誤只回字段路徑與類型，不回顯輸入值。

## <DocIcon name="zap" /> 常用流程

### 列出實例並讀取總覽

```json
{"v":1,"type":"request","id":"1","method":"instances.list","params":{}}
{"v":1,"type":"request","id":"2","method":"overview.get","params":{"instance":"ap"}}
```

### 啟動與停止排程器

```json
{"v":1,"type":"request","id":"3","method":"scheduler.start","params":{"instance":"ap"}}
{"v":1,"type":"request","id":"4","method":"scheduler.stop","params":{"instance":"ap"}}
```

### 修改配置

```json
{
  "v": 1, "type": "request", "id": "5", "method": "config.patch",
  "params": {
    "instance": "ap",
    "revision": "<上次读取的 revision>",
    "changes": [{ "path": "Research.Scheduler.Enable", "value": true }]
  }
}
```

`revision` 是樂觀併發控制：與當前不一致會返回衝突，需要重新 `config.get` 後再提交。

### 立即執行任務

```json
{"v":1,"type":"request","id":"6","method":"tasks.run","params":{"instance":"ap","task":"Research"}}
```

這是「跳過排程直接執行」，不會修改 `NextRun`。

### 讀取日誌

```json
{"v":1,"type":"request","id":"7","method":"logs.get","params":{"instance":"ap","after":128}}
```

`after` 是遊標，返回此後的增量條目。

## <DocIcon name="clipboard" /> 方法清單

下表由 `frontend/src/api/contract.json` 生成。展開任一行可看參數類型與約束。

<ApiTable />

## <DocIcon name="lightbulb" /> 客戶端實現建議

1. 連接後先等 `session` 事件，再決定是否登入。
2. `id` 用單調遞增或 UUID，不要複用。
3. 斷線後用指數退避重連，並重新訂閱。
4. 訂閱前先 `overview.get` 拿一次全量，再靠事件增量。
5. 寫操作後不要假設成功，讀回狀態確認。
6. 不要把密碼寫進 URL（MCP 的 `?key=` 是例外，且僅限無法設 Header 的客戶端）。

## <DocIcon name="shield" /> 安全

- 遠端訪問必須走 WSS；帳號操作在非本機連接下強制 TLS。
- 不要把 WebSocket 地址與密碼一起截圖分享。
- 自建看板應使用只讀方法，避免誤觸 `scheduler.stop` 之類的寫操作。
