---
title: 原始碼版本索引
description: 說明文件審計所依據的倉庫、分支與 commit、審計範圍與時間、尚未驗證的事項，以及站點素材的來源與許可。
updated: 2026-10-20
---

# 原始碼版本索引

本站內容基於對三個倉庫當前原始碼的只讀審計，不是從 README 轉寫。這一頁記錄「依據哪一版、審計了什麼、沒驗證什麼」。

## <DocIcon name="clipboard" /> 審計基線

| 專案 | 倉庫 | 預設分支 | 審計 commit | 提交時間 |
| --- | --- | --- | --- | --- |
| 核心程式 | `wess09/AzurPilot` | `master` | `7de6bb914da5798e76ef34a85a75648a526d319f` | 2026-10-20 |
| Android 宿主 | `wess09/AzurPilot-for-Android` | `main` | `1235c0a6d2d1f1bc334545e246eee2d93db756fa` | 2026-10-20 |
| 桌面啟動器 | `wess09/AzurPilotLauncher` | `main` | `44a8715afef5c5be02184d9c7a08bf10a7b6c89f` | 2026-10-19 |

::: warning 預設分支不統一
核心用 `master`，另外兩個用 `main`。舊文章裡的 `/blob/main/` 連結指向核心倉庫會 404。
:::

## <DocIcon name="search" /> 審計方法

- 以 `--depth 1` 克隆三個倉庫，記錄 HEAD。
- 讀取 `AGENTS.md` / `CLAUDE.md` / README 各語言版本。
- 枚舉目錄結構，掃描 `module/`、`frontend/`、`app/`、`rootfs/`、`server/`、`src/`。
- 讀取 `docs/modules/`（54 篇模組說明文件）、`doc/`（Android 31 篇、啟動器 1 篇）。
- 解析 `task.yaml`、`argument.yaml`、`args.json`、`i18n/zh-CN.json`、`contract.json`。
- 讀取 `.github/workflows/` 與 `.cnb/` 的 CI 配置。
- 用腳本生成任務表（102 項）與 API 表（72 項），避免手抄錯誤。

## <DocIcon name="badge-dollar" /> 覆蓋統計

| 維度 | 數量 | 來源 |
| --- | --- | --- |
| 任務命令 | 102 | `args.json` |
| 選項組 | 167 | `argument.yaml` |
| WebSocket 方法 | 72 | `frontend/src/api/contract.json` |
| MCP 工具 | 18 | `mcp_server_sse.py` |
| 核心模組說明文件 | 54 篇 | `docs/modules/` |
| Python 測試檔案 | 209 | `tests/` |

## <DocIcon name="circle-check" /> 已驗證與未驗證

### 已做（靜態驗證）

- 原始碼結構、配置字段、介面契約、CI 工作流的一致性核對。
- 說明文件內所有程式碼命令均來自倉庫腳本或 `AGENTS.md`。
- 本站自身的構建、類型檢查、連結、SEO、響應式與交互測試：31 項瀏覽器用例、112 個斷點組合、5 頁無障礙掃描。明細見站點倉庫的 `docs-audit/validation-report.md`。

### 未做（需要真實環境）

| 事項 | 原因 |
| --- | --- |
| 真實遊戲任務執行 | 需要帳號、模擬器與遊戲客戶端，且會消耗資源 |
| 模擬器兼容性矩陣 | 需要逐款模擬器實測，倉庫只提供預設 Serial |
| Android 真機全量回歸 | 需要多臺設備覆蓋 OEM 差異；倉庫只記錄了 Redmi Note 10 Pro 的驗證 |
| NPU 加速效果 | 依賴具體 SoC 與驅動，倉庫說明文件明確「以實際初始化結果為準」 |
| 遠端 Tunnel 連通性 | 依賴 Cloudflare 與網路環境 |
| 啟動器三平臺實機 | 倉庫 CI 覆蓋構建與單測，不覆蓋真實桌面環境 |

::: warning 說明文件不把推測寫成事實
涉及上述內容時，頁面會標註「待核實」或直接說明未驗證，而不是給出看似確定的結論。
:::

## <DocIcon name="scale" /> 事實衝突的處理

| 衝突 | 採用 |
| --- | --- |
| 原始碼 vs README | 原始碼優先 |
| 配置 schema / 測試 vs 說明文件 | schema 與測試優先 |
| 兩個倉庫說明文件互相矛盾 | 標註差異並以程式碼為準（例如 Android 版本號基線） |

## <DocIcon name="folder" /> 素材來源

| 素材 | 來源 | 許可 |
| --- | --- | --- |
| Android 截圖 | `AzurPilot-for-Android/docs/screenshots/` | AGPL-3.0 |
| 啟動器截圖 | `AzurPilotLauncher/screenshots/` | GPL-3.0 |
| WebUI 截圖 | `AzurPilot/doc/GUI.png` | GPL-3.0 |
| 專案 Logo | `AzurPilot/doc/logo.webp` | GPL-3.0 |
| 架構圖 | 本站原創 SVG | Apache-2.0 |
| 圖標 | 本站原創 SVG / Lucide | ISC |

未使用任何遊戲內美術素材。介面截圖中出現的遊戲畫面屬於原權利方。

## <DocIcon name="refresh" /> 說明文件更新策略

1. 三個倉庫更新後，重新跑 `scripts/extract-tasks.py`、`scripts/extract-api.py`、`scripts/extract-config.py`。
2. 對比生成數據的 diff，人工判斷哪些行為變化需要改文案。
3. 更新本頁的 commit 與日期。
4. 不在未讀原始碼的情況下根據 Issue 或群聊補說明文件。

## <DocIcon name="file" /> 審計記錄

站點倉庫的 `docs-audit/` 下儲存：

| 檔案 | 內容 |
| --- | --- |
| `source-inventory.md` | 三倉庫目錄與關鍵檔案清單 |
| `coverage-matrix.md` | 功能 → 原始碼 → 說明文件 → 驗證狀態 |
| `source-versions.json` | 機器可讀的版本記錄 |
| `unresolved-items.md` | 待核實清單 |
| `validation-report.md` | 構建、瀏覽器、SEO 驗收結果 |
