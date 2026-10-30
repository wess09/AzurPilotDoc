---
title: 更新、修復與移除
description: Launcher 3.x 的 Stable／Canary 設定、元件與 Python 修復、日誌匯出、資料保留和常見問題。
updated: 2026-10-31
---

# 更新、修復與移除

**啟動器、Git／ADB 元件及 AzurPilot 核心分開更新。** 啟動器自更新不會自動重新安裝整個核心。

## 版本及設定

在「設定」選正式版 **stable**（預設）或測試版 **canary**，並選自動、官方、GitHub、Cloudflare CDN 作為優先下載源。失敗會回退其他來源，下載後檢查完整性。可分別選擇元件、Python、PyPI 鏡像，亦可控制背景音樂（預設關閉）、減弱動態效果、阻止電腦自動睡眠與開機自啟。視窗隱藏時背景影片會暫停。

## 各種操作的差別

| 操作 | 影響 |
| --- | --- |
| 部署 | 下載 Git／ADB 及 deploy 引導檔案 |
| 啟動 | 初始化 Python、核心和 WebUI，再啟動後端 |
| 環境修復 | 重下元件、重建 `.venv`，保留原始碼、`config/`、`log/` |
| 啟動器更新 | 更新啟動器程式，不刪除使用者設定 |

下載失敗時不要直接刪除整個程式目錄或執行破壞性的 Git 指令。先停止服務，再使用「環境修復」。首頁可匯出日誌 ZIP，回報故障時附上重現方式與日誌；分享前請檢查敏感數據。

macOS 新版數據目錄為 `AzurPilot.app/Contents/AzurPilot`，會嘗試遷移舊目錄。換機與解除安裝之前請備份 `config/`、統計數據。

另見[首次啟動](/zh-HK/launcher/user/first-run)及[更新鏈路](/zh-HK/launcher/developer/update)。
