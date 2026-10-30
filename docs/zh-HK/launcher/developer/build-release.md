---
title: 構建與發佈
description: Launcher 3.0.4 的單次 React 前端構建、元件清單 schema 2、跨平台打包、簽名與 Canary 發佈。
updated: 2026-10-31
---

# 構建與發佈

目前正式版基線為 **3.0.4**。啟動器包含 Tauri／Rust 程式、React 前端及引導用 uv，**不會**在安裝包內放入全部 AzurPilot 原始碼及 Python 環境。

## 本機檢查

```bash
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run build
cargo check --locked --all-targets
cargo test --locked --all-targets
```

## CI 與發佈

`.github/workflows/package.yml` 建立並檢驗 Git／ADB ZIP 元件，在 `stable.json.runtime`（schema 2）發佈版本與雜湊資訊。與平台無關的 `frontend/dist` **只構建一次**，由 Windows、macOS、Linux 的打包工作共用。Windows 亦提供 Inno Setup 安裝器與代碼簽名。

正式版由 Git tag 觸發。符合條件的 `main` 構建使用下一個 patch 版本，加上 `-canary.<短 SHA>.<UTC 時間戳>`，寫到獨立的 `canary` 欄位。發佈時須核對 `url`、`github_url`、`cloudflare_url`、SHA-256、取消及回退流程。

更新清單公開讀取；GitHub 以外的載荷來源可使用 mTLS 客戶端身份。憑據及簽名私鑰不得提交到原始碼倉庫。

另見[更新鏈路](/zh-HK/launcher/developer/update)與[架構](/zh-HK/launcher/developer/architecture)。
