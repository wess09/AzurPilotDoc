---
title: 遠端訪問與設備配對
description: 通過區域網路或 Cloudflare Quick Tunnel 遠端訪問 WebUI，使用配對碼與 Android 客戶端安全連接。
updated: 2026-10-20
---

# 遠端訪問與設備配對

遠端訪問解決的是「人不在機器旁邊」的問題。它有兩種形態，安全模型完全不同：

| 形態 | 暴露面 | 適用 |
| --- | --- | --- |
| 區域網路直連 | 內網 IP + 連接埠 | 同一路由器下，最省事 |
| Cloudflare Quick Tunnel | 公網域名（臨時） | 外網臨時訪問、手機遠端 |

## <DocIcon name="laptop" /> 區域網路直連

1. <DocIcon name="file-pen" /> 把 `config/deploy.yaml` 的 `WebuiHost` 改為 `0.0.0.0`（或保留預設值）。
2. <DocIcon name="lock" /> 設定 `WebuiPassword`，或使用啟動參數 `-k`。
3. <DocIcon name="refresh" /> 重新啟動後端。
4. <DocIcon name="monitor" /> 在同一區域網路的設備訪問 `http://<内网IP>:25548`。

::: danger 沒有密碼就不要監聽 0.0.0.0
WebUI 可以啟停任務、讀取截圖、改配置。程序在未設定密碼且監聽公網時會自動生成密碼並寫入 `password.txt`，但這隻防「完全裸奔」，不防弱口令。請自己設定強密碼。
:::

## <DocIcon name="cloud" /> Cloudflare Quick Tunnel

「設定 → 遠端訪問」把模式設為 `cloudflare`，設定 WebUI 密碼，開啟遠端訪問並重新啟動。程序會：

1. <DocIcon name="rocket" /> 在本地啟動 `cloudflared` Quick Tunnel，得到一個 `*.trycloudflare.com` 地址。
2. <DocIcon name="key" /> 用設備密鑰把地址註冊到註冊服務（預設 `https://remote.azurpilot.com`）。
3. <DocIcon name="clock" /> 每 60 秒續約；異常退出後伺服端租約 180 秒失效。
4. <DocIcon name="plug" /> 提供固定入口 `<registry>/d/<device_id>/`，以 301 跳轉到當前 Tunnel。

設備身份儲存在 `config/remote-access.json`：安裝 ID 與註冊密鑰持久化，配對憑據只存 SHA-256 摘要。**備份這個檔案**才能在遷移後保留固定入口；**不要提交它**。

::: warning Quick Tunnel 不是生產級服務
Cloudflare 不保證 Quick Tunnel 的可用性，並限制併發請求與 SSE 等能力。它適合測試與臨時使用。業務通道是 WebSocket，固定入口不會消除這些限制。網路需允許訪問 Cloudflare 邊緣的 7844 連接埠。
:::

## <DocIcon name="handshake" /> 配對流程

<RemotePairing />

<Figure caption="配對碼與二維碼共享同一次「領取」狀態。任一方式成功後，另一種不能重放。" />

<Steps>
<Step title="在主機側生成配對">

遠端訪問就緒後點擊「配對」。程序請求註冊服務生成六位數字碼（保留前導零）、128 位掃描密鑰和五分鐘有效期。

</Step>
<Step title="在客戶端領取">

- 掃碼：解析 `azurpilot://pair?secret=<secret>` 二維碼。
- 手輸：輸入六位驗證碼。

領取在伺服端 SQLite 事務內執行，只能成功一次。

</Step>
<Step title="客戶端儲存憑據">

Android 客戶端用 Android Keystore AES-GCM 儲存固定入口與獨立憑據。之後連接時以 WSS 調用 `auth.login`，認證完成才發佈就緒狀態。

</Step>
<Step title="驗證與撤銷">

主機側「已授權的配對」可以單獨撤銷某個客戶端。已連接的客戶端在下一次請求（含 15 秒心跳）時停止授權，**不需要修改 WebUI 主密碼**。

</Step>
</Steps>

## <DocIcon name="shield" /> 安全邊界

| 項 | 設計 |
| --- | --- |
| 配對碼 | 五位/六位數字 + 128 位密鑰，五分鐘過期，單次領取 |
| 存儲 | 伺服端只存摘要；客戶端存於 Keystore |
| 撤銷 | 按客戶端粒度，不影響其他設備 |
| 主密碼 | 註冊服務不儲存 WebUI 主密碼 |
| 流量 | 註冊服務不代理 WebSocket、截圖或業務數據 |

## <DocIcon name="smartphone" /> 客戶端形態

- <DocIcon name="monitor" /> **瀏覽器**：直接訪問 Tunnel 地址，輸入 WebUI 密碼。
- <DocIcon name="smartphone" /> **Android 宿主**：作為遠端客戶端連接其他實例，不需要本機 Runtime，也不需要 Shizuku。詳見 [作為遠端客戶端](/zh-TW/android/user/remote-client)。
- <DocIcon name="plug" /> **MCP 客戶端**：使用 `/mcp/sse`，攜帶 WebUI 密碼作為 Bearer Token。見 [MCP 服務](/zh-TW/api/mcp)。

## <DocIcon name="wrench" /> 疑難排解

| 現象 | 檢查 |
| --- | --- |
| 固定入口 302 到 `/error` | 設備離線、租約過期或 Tunnel 失效 |
| 二維碼掃不出來 | 螢幕亮度、縮放；二維碼為標準 M 級糾錯 |
| 配對碼提示過期 | 超過五分鐘，重新生成 |
| 連上但一直轉圈 | WebSocket 被中間網路阻斷，或密碼錯誤 |
| 更新後 Tunnel 起不來 | Runtime 中缺少新版 `pyflared`，見 Android 熱更說明 |

更多網路問題見[疑難排解 · 核心程式](/zh-TW/troubleshooting/azurpilot)。
