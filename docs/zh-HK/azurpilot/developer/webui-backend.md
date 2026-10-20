---
title: WebUI 後端
description: gui.py 的進程監督、WebSocket RPC 協議、方法註冊、鑑權與限流，以及新增 API 方法的完整流程。
updated: 2026-10-20
---

# WebUI 後端

後端由兩部分組成：`gui.py` 負責進程與生命週期，`module/api/` 負責協議與業務方法。它不包含任何遊戲邏輯，所有操作都轉化為配置寫入或 worker 指令。

## <DocIcon name="zap" /> gui.py

啟動順序：

1. 解析參數（`--host`、`--port`、`--key`、`--ssl-key`、`--ssl-cert`、`--run`、`--electron`）。
2. `ensure_frontend()`：檢查 `frontend/dist`，缺失時安裝依賴並構建。
3. 初始化 `State`（部署配置、路徑、資料庫）。
4. 啟動 uvicorn；可選啟動 MCP 與 OCR 服務。
5. 進入監督循環，管理 worker 與更新事務。

### 監督循環

- worker 由 `ProcessManager` 建立，停止事件通過 `State.manager.Event()` 跨進程注入。
- 更新時先停 worker，置位 `stop_event`，讓 `loop()` 走「更新退出」而不是報錯。
- 啟動時掃描 `worker_registry`，回收上次異常退出留下的孤兒進程。
- 退出碼有明確語義（例如「更新退出」「配置失敗」），父進程據此決定是否重新啟動。

::: tip 不要用 `kill -9` 當常規停止方式
強殺 worker 會跳過收尾，留下鎖檔案與孤兒進程。WebUI 的停止按鈕走的是正常信號鏈。
:::

## <DocIcon name="clipboard" /> 方法註冊表

`module/api/router.py` 用顯式表註冊方法，不做反射調用：

```python
self.methods = {
    'system.ping': Method(p.Params, lambda _: {'pong': True}),
    'instances.list': Method(p.Params, lambda _: runtime.instances()),
    'config.patch': Method(p.PatchParams, lambda x: configs.patch(...), True),
}
```

`Method(params, handler, mutates)`：

| 字段 | 作用 |
| --- | --- |
| `params` | Pydantic 模型，嚴格校驗、禁止額外字段 |
| `handler` | 處理函數 |
| `mutates` | 是否修改狀態；前端據此決定是否刷新 |

當前註冊 **72 個方法**，覆蓋實例、配置、調度、日誌、統計、心智計算器、艦隊科技、交易所、遠程配對、帳號、更新、公告、背景圖庫。

## <DocIcon name="plug" /> WebSocket 協議

端點：`/api/v1/ws`。

### 信封

```json
{ "v": 1, "type": "request", "id": "req-1", "method": "instances.list", "params": {} }
{ "v": 1, "type": "response", "id": "req-1", "ok": true, "result": [] }
{ "v": 1, "type": "response", "id": "req-1", "ok": false,
  "error": { "code": "INVALID_PARAMS", "message": "请求格式或参数不正确", "details": [] } }
{ "v": 1, "type": "event", "topic": "overview", "data": {} }
```

### 會話建立

連接後伺服器先推一條 `session` 事件：

```json
{ "v": 1, "type": "event", "topic": "session",
  "data": { "authRequired": true, "protocolVersion": 1 } }
```

本機迴環連接且未設定密碼時 `authRequired` 為 `false`，直接可用。

### 鑑權

```json
{ "v": 1, "type": "request", "id": "auth", "method": "auth.login",
  "params": { "password": "<WebUI 密码或配对凭据>" } }
```

- 密碼來自 `--key`、`config/deploy.yaml` 的 `Password`，或自動生成的 `password.txt`。
- 遠程配對使用獨立憑據，撤銷後下一次請求（含 15 秒心跳）即失效。
- 帳號操作（`accounts.manage`）在非本機連接時必須走 WSS，否則返回 `TLS_REQUIRED`。

### 訂閲

```json
{ "v": 1, "type": "request", "id": "sub", "method": "events.subscribe",
  "params": { "instance": "ap", "topics": ["overview", "logs", "statistics"] } }
```

| 主題 | 內容 | 採樣 |
| --- | --- | --- |
| `instances` | 實例列表與狀態 | 2 秒 |
| `overview` | 當前任務、資源 | 1 秒 |
| `logs` | 增量日誌 | 變更即推 |
| `preview` | 截圖預覽 | 變更即推 |
| `statistics` | 統計 | 1 秒 |
| `notifications` | 通知流 | 事件 |
| `stock` | 交易所數據 | 事件 |

訂閲是**整體替換**語義：再次訂閲會清空舊主題。Android 宿主因此只允許一個全局訂閲者。

### 限制

| 項 | 值 |
| --- | --- |
| 單條消息上限 | 8 MiB |
| 普通請求上限 | 1 MiB（心智匯入/識別/儲存/計算例外） |
| 頻率 | 每窗口 30 個請求，超出 `RATE_LIMITED` |
| 重複 ID | `DUPLICATE_REQUEST` |
| 未鑑權讀超時 | 30 秒 |

## <DocIcon name="circle-alert" /> 錯誤碼

| 碼 | 含義 |
| --- | --- |
| `INVALID_REQUEST` | 信封或大小不合法 |
| `INVALID_PARAMS` | 參數校驗失敗 |
| `UNAUTHORIZED` | 未登入或配對已撤銷 |
| `TLS_REQUIRED` | 遠程帳號操作未走 WSS |
| `RATE_LIMITED` | 請求過頻 |
| `DUPLICATE_REQUEST` | 請求 ID 複用 |
| `INTERNAL_ERROR` | 伺服端異常（詳情不返回給客戶端） |

參數校驗的錯誤詳情只包含字段路徑與類型，不回顯輸入值——避免密碼與私有配置泄露。

## <DocIcon name="cloud" /> HTTP 介面

除 WebSocket 外，還有少量 HTTP 路由：

| 路徑 | 用途 |
| --- | --- |
| `/healthz` | 健康檢查（Android 就緒探測） |
| `/android/*` | Android 宿主專用薄介面，需 `X-AzurPilot-Android-Token` |
| `/api/v1/pairings/*` | 遠程配對註冊（由註冊服務提供） |
| 靜態資源 | `frontend/dist`，本地提供，不走 CDN |

`/android/*` 的鑑權額外要求客戶端來自迴環地址。詳見 [Android 薄介面](/zh-HK/api/android)。

## <DocIcon name="drive" /> 運行時與持久化

| 模組 | 職責 |
| --- | --- |
| `module/runtime/process_manager.py` | worker 建立、停止、回收 |
| `module/runtime/updater.py` | 更新檢查與應用 |
| `module/runtime/remote_access.py` | Tunnel 生命週期 |
| `module/runtime/account_vault.py` | 帳號保險庫 |
| `module/persistence/` | SQLite 總庫、遷移、恢復 |

業務數據表由 `module/persistence` 統一管理。API 層不直接拼 SQL，走 service 層。

## <DocIcon name="circle-plus" /> 新增一個 API 方法

<Steps>
<Step title="定義參數模型">

在 `module/api/protocol.py` 加 Pydantic 模型，繼承 `Params`（`extra='forbid'`、`strict=True`）。

</Step>
<Step title="實現服務">

業務邏輯放在 `module/api/<domain>_service.py`，不要在 router 裏寫長邏輯。

</Step>
<Step title="註冊方法">

在 `router.py` 的 `self.methods` 中登記，標明 `mutates`。

</Step>
<Step title="匯出契約">

```bash
uv run python -m dev_tools.export_api_schema
```

會更新 `frontend/src/api/generated.ts` 與 `contract.json`。

</Step>
<Step title="接前端">

在 `frontend/src` 用 `api.request('your.method', params)` 調用，類型自動來自契約。

</Step>
<Step title="測試">

```bash
uv run python -m unittest tests.test_api
```

需要覆蓋：正常返回、參數校驗失敗、未鑑權、併發/重複請求。

</Step>
</Steps>

::: warning 不要暴露內部方法
只有註冊在 router 裏的方法才是公開契約。業務模組的內部函數不是 API，不要在前端直接調用，也不要在文檔裏宣傳成穩定介面。
:::

## <DocIcon name="map" /> 相關文檔

<ul class="ap-linklist">
<li><a href="/zh-HK/api/websocket">WebSocket API 參考<span class="desc">全部方法與參數</span></a></li>
<li><a href="/zh-HK/azurpilot/developer/frontend">React 前端<span class="desc">契約如何被消費</span></a></li>
<li><a href="/zh-HK/api/android">Android 薄介面<span class="desc">跨進程通信</span></a></li>
</ul>
