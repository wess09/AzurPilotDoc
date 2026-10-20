---
title: 參考索引
description: 任務命令表、配置字段索引、命令行與環境變數、源碼版本索引的入口，內容全部由腳本從源碼生成後校對。
updated: 2026-10-20
---

# 參考索引

這一欄是「查表」用的，不是教程。需要理解行為時回到對應的手冊頁。

| 文檔 | 內容 | 適合 |
| --- | --- | --- |
| [任務命令總表](/zh-HK/reference/tasks) | 102 個任務的中文名、命令、參數組 | 找命令、對日誌、寫腳本 |
| [配置參考](/zh-HK/reference/config) | 167 個選項組的字段索引、生效時機 | 查字段、排「改了沒生效」 |
| [命令行、連接埠與環境變數](/zh-HK/reference/cli) | 所有入口參數、連接埠、路徑、環境變數 | 部署、疑難排解、集成 |
| [源碼版本索引](/zh-HK/reference/versions) | 審計時的 commit、分支、覆蓋範圍 | 核對文檔時效 |

## <DocIcon name="zap" /> 常用速查

### 連接埠

| 連接埠 | 服務 |
| --- | --- |
| `25548` | WebUI / WebSocket（核心預設） |
| `22267` | 啟動器打開的 WebUI |
| `22268` | 獨立 MCP / OCR |
| `22302` | Android OCR 張量 API |
| `22300` / `22400` | 舊版宿主進程探測 |

### 路徑

| 路徑 | 內容 |
| --- | --- |
| `config/<实例>.json` | 實例配置 |
| `config/deploy.yaml` | 後端設定 |
| `log/<日期>_<实例>.txt` | 運行日誌 |
| `log/error/<实例>/<时间戳>/` | 錯誤現場 |
| `AzurPilot_Data_Backup/<日期>/` | 每日備份 |
| `frontend/dist` | 前端產物 |
| `.venv/` | Python 環境（啟動器） |

### 命令

```bash
uv run python gui.py            # WebUI
uv run python alas.py <实例>    # 调度器
uv run python tui.py            # 终端界面
uv run python mcp_server_sse.py # 独立 MCP
```

### 文檔工具

```bash
npm run dev        # 本站开发
npm run build      # 构建静态产物
npm run check      # 链接 / 导航 / SEO 检查
npm run test:e2e   # 浏览器验收
```
