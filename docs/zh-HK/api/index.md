---
title: 介面總覽
description: AzurPilot 對外暴露的三類介面：WebSocket RPC、Android 薄介面與 MCP 服務，以及鑑權與穩定性邊界。
updated: 2026-10-31
---

# 介面總覽

核心程序對外只有三類介面。它們共享同一套配置與進程模型，但協議、鑑權與適用場景不同。

| 介面 | 端點 | 協議 | 鑑權 | 用途 |
| --- | --- | --- | --- | --- |
| WebSocket API | `/api/v1/ws` | JSON RPC over WS | 會話密碼 / 配對憑據 | 前端、Android、自建看板 |
| Android 薄介面 | `/android/*` | HTTP | 本機迴環 + Header Token | Android 宿主 |
| MCP 服務 | `/mcp/sse` 或獨立 `:22268` | MCP SSE | Bearer（WebUI 密碼） | AI 客戶端 |

另有 `/healthz` 用於就緒探測，無鑑權、無業務數據。

## <DocIcon name="shield" /> 穩定性邊界

::: warning 只有註冊的方法才是公開介面
`module/api/router.py` 裏的 72 個方法是公開契約，由 `dev_tools.export_api_schema` 生成類型。業務模組內部的 Python 函數不是 API，不要在前端或外部工具裏直接調用。
:::

| 層 | 穩定性 |
| --- | --- |
| `router.py` 註冊方法 | 公開，參數模型受嚴格校驗 |
| `/android/*` | App 專用，隨宿主版本演進 |
| MCP 工具 | 公開，數量與語義隨版本變化 |
| 內部 service / 模組函數 | 私有，隨時可改 |

## <DocIcon name="plug" /> 連接埠

| 連接埠 | 用途 | 來源 |
| --- | --- | --- |
| `25548` | WebUI + WebSocket | `deploy.yaml` 的 `WebuiPort` |
| `22267` | 啟動器打開的 WebUI | 啟動器指定 |
| `22268` | 獨立 MCP / OCR 服務 | `OcrServerPort` |
| `22302` | Android OCR 張量 API | Android `:ocr` |
| `22300` / `22400` | 舊版宿主進程探測 | Android 兼容檢查 |

::: tip 22268 是共用連接埠
MCP 獨立服務與 OCR 服務預設都用 22268。同機運行兩者會衝突，先改其中一個。
:::

## <DocIcon name="key" /> 鑑權

| 場景 | 方式 |
| --- | --- |
| 本機迴環、未設密碼 | 免密 |
| 瀏覽器 / 區域網絡 | `auth.login` 提交 WebUI 密碼 |
| Android 遠程客戶端 | 配對憑據（獨立於主密碼） |
| Android 本地宿主 | `X-AzurPilot-Android-Token`，且必須來自迴環 |
| MCP | `Authorization: Bearer <WebUI 密码>` 或 `?key=` |

密碼來源：`--key` 參數、`config/deploy.yaml` 的 `Password`，或自動生成的 `password.txt`。

## <DocIcon name="file" /> 最小示例

WebSocket：

```json
{"v":1,"type":"request","id":"1","method":"system.ping","params":{}}
{"v":1,"type":"response","id":"1","ok":true,"result":{"pong":true}}
```

HTTP：

```bash
curl -s http://127.0.0.1:25548/healthz
```

MCP：

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

## 雲端統計與模板服務（與本機 WebSocket 不同）

委託、科研統計的新版雲端協議在客戶端完成獎勵解析：主服務 `https://api.azurpilot.com` 的 `POST /api/v3/post/drops` 收取結構化掉落；未知物品的 **49×49 圖標**提交到獨立 `https://templates-api.azurpilot.com/api/v3/post/templates/unknown`。客戶端從 `https://templates.azurpilot.com/latest.json` 獲取簽名模板指針、校驗清單和圖片哈希；不會把完整截圖作為主統計 API 的請求載荷。

雲端提交須啟用對應記錄方式；失敗數據進入本地持久化隊列，限流、斷網和進程重新啟動後可繼續處理。`record_id` 用於冪等，伺服端回執分別處理成功、重複、拒絕和重試。此協議**不是**瀏覽器的 `/api/v1/ws` 或啟動器專用 `/api/v2/launcher/ws`。詳細數據結構、端點及安全約束見[核心倉庫雲 API 文檔](https://github.com/wess09/AzurPilot/blob/master/docs/modules/cloud-api.md)，本地統計見[通知、日誌與統計](/zh-HK/azurpilot/user/observability)。


## <DocIcon name="map" /> 繼續閲讀

<ul class="ap-linklist">
<li><a href="/zh-HK/api/websocket">WebSocket API<span class="desc">信封、鑑權、72 個方法</span></a></li>
<li><a href="/zh-HK/api/android">Android 薄介面<span class="desc">宿主與 Runtime 的約定</span></a></li>
<li><a href="/zh-HK/api/mcp">MCP 服務<span class="desc">18 個工具與接入方式</span></a></li>
<li><a href="/zh-HK/azurpilot/developer/webui-backend">WebUI 後端<span class="desc">實現側</span></a></li>
</ul>
