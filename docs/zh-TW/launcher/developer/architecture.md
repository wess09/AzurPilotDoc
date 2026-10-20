---
title: Tauri 與 Rust 架構
description: 雙視窗、自定義 URI 協議、啟動狀態機、系統匣與通知，以及 WebView 與 Rust 的通信邊界。
updated: 2026-10-20
---

# Tauri 與 Rust 架構

啟動器是一個「有視窗的安裝器 + 處理程序監督器」。它沒有前端工程，WebView 加載的是 Rust 內嵌的 HTML，通過 `tauri://` 之外的自定義協議提供。

## <DocIcon name="monitor" /> 視窗

| 視窗 | 尺寸 | 特性 |
| --- | --- | --- |
| `main` | 1280×880 | 可縮放，初始不可見，等後端就緒後顯示 |
| `splash` | 800×450 | 無邊框、不可縮放，先於主視窗建立 |

WebView 參數刻意關掉了一些預設行為：

```text
--enable-features=msWebView2EnableDraggableRegions
--disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection
--no-proxy-server
```

- `--no-proxy-server`：連接本地 WebUI 不走系統代理，避免代理攔截 `127.0.0.1`。
- 關閉 SmartScreen 保護：內嵌頁面不是外部站點，不需要該攔截。

::: tip macOS 的 WKWebView
Windows 的 `additionalBrowserArgs` 在 macOS 上無效。平臺差異用 `#[cfg]` 處理，不要假設參數通用。
:::

## <DocIcon name="plug" /> 自定義協議

| 協議 | 內容 |
| --- | --- |
| `alas-splash://` | 啟動畫面（進度、階段文案） |
| `alas-error://` | 錯誤頁（原因、日誌路徑、重試） |

頁面由 Rust 內嵌字符串 + `splash-progress.js` 驅動。進度通過 Tauri 事件從 Rust 推到 WebView，JS 只負責渲染。

改介面的正確方式：

1. 改 `main.rs` 裡的 HTML 模板或 `splash-progress.js`。
2. 補 4 個語言的 `locales/*.yml`。
3. 用 `--preview-crash` 預覽錯誤頁。
4. 三平臺各截一次圖確認。

## <DocIcon name="rocket" /> 啟動狀態機

```text
Idle
 → Splash（显示窗口）
   → Provisioning（环境自举）
     → Updating（git pull + uv sync）
       → StartingBackend（清理端口、起 gui.py）
         → Waiting（最多 60 秒）
           → Ready（显示主窗口、注入登录态）
             → Running（托盘常驻）
```

任一步失敗 → `Error` 狀態 → `alas-error://` 頁面，保留日誌路徑與重試按鈕。

## <DocIcon name="handshake" /> WebView 與 Rust 的通信

| 方向 | 機制 | 用途 |
| --- | --- | --- |
| Rust → WebView | Tauri event | 啟動進度、錯誤、主題 |
| WebView → Rust | `#[tauri::command]` | 重試、打開日誌、退出 |
| 後端 → 啟動器 | HTTP SSE `/api/notify_stream` | 任務通知 |
| 後端 → 啟動器 | HTTP `/api/launcher/stream` | 退出、重新啟動、開機自啟指令 |

後端不能直接調用啟動器函數：它只能通過 HTTP 流發指令，啟動器解析後執行。這條邊界避免了「後端拿到啟動器句柄亂結束處理程序」。

## <DocIcon name="box" /> 系統匣與通知

| 能力 | 實現 |
| --- | --- |
| 系統匣 | `tauri` tray-icon feature |
| 菜單 | 顯示主視窗、重新啟動後端、打開日誌、退出 |
| 通知 | Windows Toast / macOS / Linux 原生通知 |
| 單實例 | 重複啟動聚焦已有視窗 |
| 開機自啟 | Windows 註冊表 Run 鍵 + `--start-minimized` |

通知內容來自 SSE 流，語言跟隨啟動器當前 locale。

## <DocIcon name="message-text" /> 國際化

```text
locales/zh-CN.yml   # 基准
locales/zh-TW.yml
locales/ja.yml
locales/en.yml
```

程式碼中用 `t!("module.key")`，帶參數用 `t!("k", p = v)` 並在 YAML 裡寫 `%{p}`。新增文案必須同時補四份；缺鍵會回退到 key 本身，介面上會直接露出來。

## <DocIcon name="shield" /> 安全邊界

| 面 | 措施 |
| --- | --- |
| 管理員權限 | Windows manifest `requireAdministrator` |
| 自更新 | mTLS 客戶端證書，證書不打進倉庫 |
| 本地 WebUI | `--no-proxy-server`，一次性登入令牌 |
| 子處理程序 | `CREATE_NO_WINDOW`，不彈控制台 |
| 處理程序回收 | 環境標記 + Job Object，退出時全表掃描 |
| 日誌 | 不輸出令牌與密碼 |

## <DocIcon name="shield" /> 修改時的注意

| 不要 | 因為 |
| --- | --- |
| 在 macOS 上依賴 `additionalBrowserArgs` | WKWebView 不支援 |
| 用 `println!` 記日誌 | 無視窗程序看不到，且不進日誌檔案 |
| 直接 `kill` 後端處理程序 | 跳過 Job/處理程序組回收，會留孤兒 |
| 只改一個語言的 yml | 其他語言會顯示鍵名 |
| 把 uv 路徑寫死 | 內嵌 uv 缺失時要回退 PATH |

## <DocIcon name="map" /> 相關說明文件

<ul class="ap-linklist">
<li><a href="/zh-TW/launcher/developer/backend-lifecycle">後端處理程序生命週期<span class="desc">最容易被改壞的部分</span></a></li>
<li><a href="/zh-TW/launcher/developer/update">更新鏈路<span class="desc">git、uv、mTLS</span></a></li>
<li><a href="/zh-TW/launcher/developer/build-release">構建與發佈<span class="desc">三平臺產物</span></a></li>
</ul>
