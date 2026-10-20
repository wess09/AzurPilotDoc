---
title: 發佈與版本
description: 三個倉庫各自的版本策略與發佈節奏、發佈前的檢查清單，以及文檔站如何跟隨源碼版本更新。
updated: 2026-10-20
---

# 發佈與版本

三個倉庫獨立發佈，沒有統一的版本號。這一頁説明各自的規則，避免「升級了啟動器卻以為核心也更新了」。

## <DocIcon name="medal" /> 版本策略

| 項目 | 版本方式 | 發佈載體 |
| --- | --- | --- |
| 核心 | 滾動 `master`，無嚴格語義化版本 | git 提交 / Docker 鏡像 |
| 啟動器 | 語義化版本（如 `2.2.5`） | 壓縮包 + 自更新清單 |
| Android | `versionCode` 時間戳 + `versionName` 提交計數 | 固定 Release + `latest.json` |
| 文檔 | 跟隨審計 commit | 靜態站點 |

## <DocIcon name="zap" /> 核心程序

- 更新即 `master` 最新提交；沒有「穩定版 tag」的承諾。
- Docker 鏡像按 tag / master 構建。
- WebUI 的更新頁按提交粒度展示。

發佈前的最小檢查：

- [ ] `ruff` 通過
- [ ] 相關單測通過
- [ ] `config_updater` / `button_extract` / `export_api_schema` 無 diff
- [ ] 匯入冒煙通過
- [ ] 前端構建與 Vitest 通過

## <DocIcon name="rocket" /> 啟動器

| 項 | 規則 |
| --- | --- |
| 版本號 | `Cargo.toml`、`tauri.conf.json`、`CHANGELOG.md` 三處同步 |
| tag | `2.2.5`，不接受 `v` 前綴 |
| 產物 | 三平台 tar.xz，國際版 + `-cn` |
| 自更新 | `stable.json` + mTLS 載荷 |

檢查清單見[構建與發佈](/zh-HK/launcher/developer/build-release#發佈檢查清單)。

## <DocIcon name="smartphone" /> Android

| 項 | 規則 |
| --- | --- |
| `versionCode` | HEAD 時間戳（CI 取 `max(旧值+1, 时间戳)`） |
| `versionName` | `1.<series>.<X>`，基線在 `GitVersion.kt` 與 CI 同步 |
| App 產物 | 按 ABI 完整包 + 雙 ABI 輕量包 |
| Runtime | `rootfs-<abi>.tar.xz` + `BUILD_MANIFEST` |
| 清單 | 固定 Release 的 `latest.json` |

::: warning 基線以代碼為準
倉庫文檔歷史上有過不同基線記錄。發佈前讀當前 `GitVersion.kt`，不要照抄舊數字。
:::

## <DocIcon name="file" /> 文檔站

本站不發佈 npm 包，只產出靜態目錄。版本跟隨審計 commit：

1. 源碼更新後重跑生成腳本。
2. 更新 `reference/versions.md` 的 commit 與日期。
3. 重跑 `npm run check` 與 `npm run test:e2e`。
4. 構建並檢查產物（meta、canonical、sitemap）。

## <DocIcon name="shield" /> 兼容性聲明

| 組合 | 承諾 |
| --- | --- |
| 新啟動器 + 舊核心 | 盡力兼容，可能提示更新 |
| 舊啟動器 + 新核心 | 不保證，缺少新協議時可能失敗 |
| 新 APK + 舊 Runtime | 通常可用；依賴變化時提示整包 |
| 舊 APK + 新 Runtime | 不保證，宿主協議可能不匹配 |

「盡力兼容」不是「保證可用」。跨版本組合出問題時，先統一到同一天發佈的版本再疑難排解。

## <DocIcon name="megaphone" /> 發佈後

| 動作 | 負責 |
| --- | --- |
| 更新 CHANGELOG | 各倉庫 |
| 上傳產物與清單 | 各倉庫 CI |
| 更新文檔版本頁 | 文檔維護者 |
| 觀察首日 Issue | 維護者 |
| 必要時回滾 | 維護者 |
