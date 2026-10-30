---
title: 更新鏈路與鏡像
description: Launcher 3.x 的元件部署、核心同步、Stable／Canary 清單、mTLS 載荷與多來源回退機制。
updated: 2026-10-31
---

# 更新鏈路與鏡像

現行流程有**三個獨立部分**：部署 Git／ADB 元件、更新 AzurPilot 核心、更新啟動器本身。

## 元件及核心

公開 `stable.json.runtime`（schema 2）包含 Git／ADB ZIP、雜湊、大小和 `deploy/**` 腳本。元件存於 `.azurpilot/tools/`；「部署」只處理上述引導檔案。

「啟動」才由內嵌 uv 安裝 Python 3.14.x，再以 deploy 腳本拉取核心、同步依賴、建置 WebUI。實作使用 `uv sync --no-dev --no-install-project` 及下載鏡像回退；舊文檔稱永遠執行 `uv sync --frozen` 已不準確。明確選擇「環境修復」會重新下載元件並重建 `.venv`，但保留使用者設定。

## 正式版、Canary 及鏡像

`LAUNCHER_UPDATE_URL` 在建置時決定**公開更新清單**的網址；備用清單為 `https://ap.launcher-update.nanoda.work/updata/stable.json`。讀取清單毋須 mTLS，GitHub 以外的更新載荷可使用內嵌客戶端證書，並核驗 SHA-256。

`updateChannel` 為 `stable`（預設）或 `canary`；`updateSource` 為 `auto`、`official`、`github`、`cloudflare`，只改變**載荷的下載優先順序**。自動模式在系統原始語言是簡體中文且使用北京時間時優先官方來源，其他環境優先 GitHub、Cloudflare、官方來源。HTTP 429 可觸發降低併發數和 Retry-After 等候。

啟動器約每 10 分鐘檢查新版本。runtime、正式版及 Canary 清單欄位獨立更新。

參見[首次啟動](/zh-TW/launcher/user/first-run)和[建置發佈](/zh-TW/launcher/developer/build-release)。
