---
title: Tauri 與 Rust 架構
description: Launcher 3.x 的 React 前端、Tauri 2 與 Rust、部署流程、WebSocket v2 及跨平台安全機制。
updated: 2026-10-31
---

# Tauri 與 Rust 架構

Launcher 3.x 使用 **React + Tauri 2 + Rust**，不再是舊版僅靠 Rust 內嵌 HTML 的啟動畫面。「沒有前端專案」及「以 HTTP SSE 與後端通訊」均是過時描述。

## 主要程式入口

| 檔案 | 職責 |
| --- | --- |
| `frontend/src/App.tsx` | 首頁、部署／啟動／更新、取消、錯誤與日誌 |
| `frontend/src/SettingsDialog.tsx` | 更新通道、下載來源、外觀及電源設定 |
| `src/launcher.rs` | 操作狀態機及取消 |
| `src/components.rs` | Git／ADB 下載、驗證與交易回復 |
| `src/setup.rs` | Python、核心與前端部署 |
| `src/settings.rs` | SQLite 設定儲存 |
| `src/backend.rs` | Python 後端生命週期 |
| `src/launcher_control.rs` | 鑑權 WebSocket v2 |
| `src/updater.rs` | 啟動器自更新 |
| `src/power.rs` | 阻止系統閒置睡眠 |

## 部署、啟動與通訊

首次使用先按「部署」，只下載 Git、ADB 和 deploy 引導檔案；再按「啟動」，以內嵌 uv 安裝 Python 3.14.x，更新 AzurPilot 核心、同步依賴、建置 WebUI，最後啟動 `gui.py`（預設埠 `22267`）。

啟動器連到 `ws://127.0.0.1:<WebuiPort>/api/v2/launcher/ws`，使用 `Authorization: Bearer <AP_WEBUI_TRUST_SECRET>` 驗證。專用通道處理通知、開機自啟與一次性登入票據。瀏覽器仍使用**另一套** `/api/v1/ws`（`v:1`）業務協定。有效 60 秒的單次 `launcherTicket` 用於登入 WebUI，毋須把密碼放到網址。舊 HTTP SSE 端點已停用。

Windows 透過 Job Object 管理後端，Unix 使用進程群組。退出時清理後端和 worker，但不應結束已獨立運行的模擬器。

## 驗證

```bash
npm --prefix frontend test
npm --prefix frontend run build
cargo check --locked --all-targets
cargo test --locked --all-targets
cargo test --locked --test launcher_ws
```

參見[首次啟動](/zh-TW/launcher/user/first-run)和[建置與發佈](/zh-TW/launcher/developer/build-release)。
