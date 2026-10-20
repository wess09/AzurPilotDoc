---
title: 命令行、連接埠與環境變數
description: gui.py、alas.py、tui.py、MCP 服務的啟動參數，連接埠佔用，路徑約定與影響行為的環境變數。
updated: 2026-10-20
---

# 命令行、連接埠與環境變數

## <DocIcon name="rocket" /> 入口

| 入口 | 作用 | 是否常駐 |
| --- | --- | --- |
| `gui.py` | WebUI 後端 + 進程監督 | 是 |
| `alas.py` | 單實例調度器 | 是（實例運行期間） |
| `tui.py` | 終端介面 | 交互式 |
| `mcp_server_sse.py` | 獨立 MCP SSE 服務 | 是 |

## <DocIcon name="monitor" /> gui.py

```bash
uv run python gui.py [options]
```

| 參數 | 作用 | 預設 |
| --- | --- | --- |
| `--host` | 監聽地址 | `deploy.yaml` 的 `WebuiHost`，再回退 `0.0.0.0` |
| `-p, --port` | 監聽連接埠 | `WebuiPort`，再回退 `25548` |
| `-k, --key` | 訪問密碼 | `deploy.yaml` 的 `Password` |
| `--ssl-key` | HTTPS 私鑰 | 無 |
| `--ssl-cert` | HTTPS 證書 | 無 |
| `--run <实例...>` | 啟動時運行指定實例 | 無 |
| `--electron` | 由 Electron 客戶端運行 | 關閉 |
| `--cdn` | 已廢棄 | — |

示例：

```bash
uv run python gui.py --host 127.0.0.1 -p 25548 -k "your-password"
uv run python gui.py --ssl-key key.pem --ssl-cert cert.pem
```

::: warning 連接埠來自三處
命令行 > `deploy.yaml` > 代碼預設值。改不動連接埠時，先確認是不是被部署配置覆蓋了。
:::

## <DocIcon name="zap" /> alas.py

```bash
uv run python alas.py [实例名]
```

| 行為 | 説明 |
| --- | --- |
| 不傳實例名 | 使用預設 `ap` |
| 實例名不存在 | 退出碼 2，**不會**回退到預設實例 |
| 停止 | 終止進程；沒有停止檔案或信號介面 |
| 工作目錄 | `module/logger.py` 匯入時會切到項目根 |

外部調度器集成契約見[調度器生命週期](/zh-HK/azurpilot/developer/scheduler#外部調度器契約)。

## <DocIcon name="file-pen" /> tui.py

終端介面，複用同一套配置與設備層。適合無瀏覽器環境或快速查看狀態。

## <DocIcon name="plug" /> mcp_server_sse.py

```bash
uv run python mcp_server_sse.py
```

預設獨立連接埠 `22268`。與 OCR 服務同連接埠，同機運行需改其一。

## <DocIcon name="plug" /> 連接埠

| 連接埠 | 用途 | 可配置 |
| --- | --- | --- |
| `25548` | WebUI / WS | ✅ `WebuiPort` |
| `22267` | 啟動器 WebUI | 啟動器內部 |
| `22268` | 獨立 MCP / OCR | ✅ `OcrServerPort` |
| `22302` | Android OCR | Android 內部 |
| `22300` / `22400` | 舊版宿主進程探測 | ❌ |

## <DocIcon name="key" /> 環境變數

| 變數 | 作用 | 預設 |
| --- | --- | --- |
| `ALAS_DEBUG_SERVER` | 設為 `1` 時啟動僅本機的調試服務 | 關閉 |
| `AZURPILOT_OCR_THREADS` | OCR 會話 intra-op 執行緒上限（1–16） | 自動 |
| `AZURPILOT_ANDROID` | 設為 `1` 時註冊 `/android/*` 路由 | 關閉 |
| `ALAS_LAUNCHER_PID` | 啟動器注入，標記子進程歸屬 | 無 |
| `ALAS_LAUNCHER_JOB_BREAKAWAY` | 啟動器注入，聲明支援 Job 脱離 | 無 |
| `ALAS_WEBUI_TRUST_SECRET` | 啟動器注入的一次性登入令牌 | 無 |
| `AZURPILOT_ANDROID_DIST_BASE` | 舊版 Android 預構建前端下載基址 | 無 |
| `AZURPILOT_ANDROID_GIT_MIRROR` | Android GitHub 回退鏡像前綴 | 無 |
| `AZURPILOT_REPO` / `AZURPILOT_REF` | 構建 Android Runtime 時的源碼指向 | 無 |

::: danger 不要手動設定啟動器的內部變數
`ALAS_LAUNCHER_PID` 會讓進程被啟動器的兜底清理掃到；`ALAS_WEBUI_TRUST_SECRET` 是免密登入憑據。手動設定會破壞安全邊界。
:::

## <DocIcon name="folder" /> 路徑

| 路徑 | 內容 | 是否可刪 |
| --- | --- | --- |
| `config/` | 實例配置、`deploy.yaml`、`remote-access.json` | ❌ |
| `azurpilot.db` | 統計與持久化 | ❌ |
| `log/` | 日誌與錯誤現場 | 疑難排解後再刪 |
| `cache/` | 運行時快取 | ✅ |
| `AzurPilot_Data_Backup/` | 每日備份 | 按保留策略 |
| `.venv/` | Python 環境 | 可重建 |
| `frontend/dist` | 前端產物 | 可重建 |

數據目錄的實際位置由運行入口決定；Android Runtime 中位於 rootfs 的 `/opt/azurpilot`。

## <DocIcon name="circle-alert" /> 退出語義

`gui.py` 的監督循環區分幾類退出：

| 退出類型 | 觸發 |
| --- | --- |
| 更新退出 | `stop_event` 置位後 worker 正常收尾 |
| 配置/初始化失敗 | 啟動階段即失敗，不重新啟動 |
| 敏感任務停止 | 調度器 `exit(1)`，父進程感知 |
| 用戶停止 | WebUI 停止按鈕，終止進程樹 |

具體退出碼映射見 `module/runtime/process_manager.py` 與 `gui.py` 的監督循環，文檔不復制容易變化的數字。

## <DocIcon name="wrench" /> 文檔站命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地開發 |
| `npm run build` | 構建到 `docs/.vitepress/dist` |
| `npm run preview` | 預覽構建產物 |
| `npm run check` | 連結 + 導航 + SEO 檢查 |
| `npm run test:e2e` | Playwright 驗收 |
| `npm run shots` | 多解像度截圖 |
