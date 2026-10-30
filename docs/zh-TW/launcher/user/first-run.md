---
title: 首次啟動與環境初始化
description: Launcher 3.x 的 Git／ADB 元件部署、Python 初始化、核心更新、WebUI 建置和一次性登入流程。
updated: 2026-10-31
---

# 首次啟動與環境初始化

Launcher 3.x 將**「部署」及「啟動」分成兩步**。一般使用者毋須預先安裝 Git、ADB、uv 或 Python。

## 先部署

首次開啟後按「部署」。程式讀取 `stable.json.runtime`（schema 2），下載並驗證 Git、ADB 元件，放到 `.azurpilot/tools/`，再取得 `deploy/**` 及平台模板。完成後首頁顯示「啟動」。部署階段**不會**安裝 Python 或建置 WebUI。

## 再啟動

1. 內嵌 uv 安裝 Python 3.14.x，建立 `.venv` 及引導依賴。
2. `deploy.git` 拉取／更新 AzurPilot 原始碼。
3. 根據 `uv.lock` 同步依賴並建置 WebUI；缺少 Node.js 時可能需要額外安裝。
4. 啟動 `gui.py`（預設本機 `22267`），透過受保護的 WebSocket v2 和一次性票據開啟 WebUI。

Git／ADB 與 `.venv` 分開存放。重建 Python 環境不等於重裝全部元件。

## 操作與排障

首頁可部署、啟動、停止、檢查更新、修復環境及匯出日誌 ZIP。進行中的任務按第二次才確認取消。「設定」可選 Stable／Canary、下載鏡像、背景音樂、減弱動態效果和阻止睡眠。

| 現象 | 優先檢查 |
| --- | --- |
| 元件下載失敗 | 網絡、鏡像來源、儲存空間 |
| 缺少 `pyproject.toml` | 核心未部署完整，使用環境修復 |
| 依賴／WebUI 建置失敗 | PyPI、Node.js、建置日誌 |
| 後端逾時 | 埠 `22267` 和錯誤日誌 |
| 回報故障 | 附上日誌 ZIP，不要只傳截圖 |

相關說明：[更新與修復](/zh-TW/launcher/user/maintenance)、[架構](/zh-TW/launcher/developer/architecture)。
