---
title: 核心程式概覽
description: AzurPilot 核心倉庫提供的能力、WebUI 結構、任務分類與執行模型，是 Android 版與啟動器共同代管的本體。
updated: 2026-10-20
---

# 核心程式概覽

核心程式（[wess09/AzurPilot](https://github.com/wess09/AzurPilot)，預設分支 `master`）是唯一包含遊戲行為的倉庫。啟動器和 Android 宿主都只是它的執行外殼。

<div class="ap-meta">
<span><b>語言</b> Python 3.14</span>
<span><b>介面</b> React + Vite</span>
<span><b>連接埠</b> 25548</span>
<span><b>識別基準</b> 1280×720</span>
<span><b>許可證</b> GPL-3.0</span>
</div>

## <DocIcon name="box" /> 它由哪幾塊組成

<CoreArchDiagram />

<Figure caption="分層只表達依賴方向：上層可以調用下層，下層不知道上層的存在。業務模組之間不直接互相調用。" />

| 層 | 關鍵路徑 | 職責 |
| --- | --- | --- |
| 入口 | `alas.py`、`gui.py`、`mcp_server_sse.py`、`tui.py` | 排程循環、WebUI 後端、MCP 服務、終端介面 |
| 執行時 | `module/api/`、`module/runtime/` | WebSocket 路由、處理程序管理、更新、遠端訪問、帳號保險庫 |
| 業務 | `module/<功能>/`、`campaign/` | 每類玩法一個模組，實現 `run()` 與地圖定義 |
| 基礎 | `module/device/`、`ui/`、`ocr/`、`map/`、`combat/` | 截圖、點擊、頁面導航、識別、尋路、戰鬥 |
| 數據 | `config/`、SQLite 總庫、`assets/` | 用戶配置、統計與持久化、四服識別資源 |

## <DocIcon name="settings" /> 三層執行模型

1. <DocIcon name="monitor" /> **`gui.py` 是父處理程序**。它提供 HTTP/WebSocket 服務與靜態前端，不直接操作遊戲。
2. <DocIcon name="zap" /> **每個實例一個 worker 處理程序**。由 `ProcessManager` 用 `multiprocessing.Process` 建立，處理程序內跑 `AzurLaneAutoScript.loop()`。
3. <DocIcon name="clock" /> **worker 內主執行緒串行執行任務**。執行監護、日報執行緒是輔助執行緒，不併發執行遊戲任務。

這解釋了幾個常見現象：

- <DocIcon name="circle-alert" /> 停止實例 = 終止 worker 處理程序樹，WebUI 本身還在。
- <DocIcon name="circle-alert" /> 同一實例不可能同時跑兩個任務；想並行只能多開實例 + 多開模擬器。
- <DocIcon name="circle-alert" /> WebUI 關掉不影響已啟動的 worker 嗎？——**會**，worker 由 `gui.py` 建立並代管，後端退出會一起收尾。

## <DocIcon name="monitor" /> WebUI 結構

| 區域 | 路徑 | 內容 |
| --- | --- | --- |
| 首頁 | `/` | 實例卡片、啟動/停止、公告 |
| 實例總覽 | `/i/<实例>/overview` | 當前任務、資源、日誌尾、快捷操作 |
| 任務配置 | `/i/<实例>/task/<任务>` | 按 `task.yaml` 分組渲染的表單 |
| 統計 | `/i/<实例>/statistics` | 資源、出擊、大世界、委託等報表 |
| 排程程序 | `/i/<实例>/task/SchedulerProgram` | 圖形化排程編排 |
| 心智計算器 | `/i/<实例>/task/MindCalculator` | 船塢掃描與心智單元費用 |
| 艦隊科技 | `/i/<实例>/task/FleetTechnology` | 科技點掃描與統計 |
| 系統設定 | `/settings` | 賬戶、遠端訪問、更新、介面 |
| 配置管理 | `/configs` | 匯入、匯出、複製、刪除實例 |

逐頁說明見 [WebUI 介面導覽](/zh-TW/azurpilot/user/webui)。

## <DocIcon name="compass" /> 任務分類

WebUI 的任務菜單來自 `module/config/argument/task.yaml`，共 12 個頂級分組：

| 分組 | 中文名 | 典型任務 |
| --- | --- | --- |
| `Alas` | 系統 | 模擬器、錯誤處理、備份、日報 |
| `Farm` | 出擊 | 主線圖 1/2/3、緊急委託、三油低耗 |
| `Event` | 活動 | 活動圖 1/2/3、共鬥、作戰檔案 |
| `EventDaily` | 活動-每日任務 | 每日 A/B/C/D/SP 圖 |
| `Reward` | 自動收穫 | 委託、科研、後宅、指揮喵、大艦隊 |
| `DailyMission` | 每日任務 | 每日任務、限界挑戰、困難圖、演習 |
| `Opsi` | 大世界 | 開荒、隱秘、深淵、要塞、智能排程 |
| `Island` | 赤石計劃 | 農田、牧場、餐廳、製造、每日採集 |
| `FleetManagement` | 艦隊管理 | 艦隊掃描、艦隊資訊 |
| `RunParams` | 執行參數 | 排程器與設備節奏 |
| `Tool` | 工具 | 半自動、性能測試、OCR 基準、反和諧 |
| `Dashboard` | 儀表盤 | 資源上限與顏色 |

完整的 102 個任務命令見[任務命令總表](/zh-TW/reference/tasks)。

::: tip 任務數量會變
活動適配會增刪任務，`alas.py` 上的任務方法數量也隨版本變化。說明文件用「約」表述，具體以你當前版本的 WebUI 為準。
:::

## <DocIcon name="plug" /> 擴展方式

新增能力的最小閉環是**三處同名 + 一個 `run()`**：

1. <DocIcon name="file-pen" /> `task.yaml` 註冊任務與菜單組。
2. <DocIcon name="file-pen" /> `alas.py` 添加同名方法（駝峰轉下劃線）。
3. <DocIcon name="folder" /> `module/<功能>/` 實現類並提供 `run()`。
4. <DocIcon name="refresh" /> 執行 `uv run -m module.config.config_updater` 生成配置產物。

詳細步驟與常見陷阱見[新增一個任務](/zh-TW/azurpilot/developer/module-dev)。

## <DocIcon name="map" /> 繼續閱讀

<ul class="ap-linklist">
<li><a href="/zh-TW/azurpilot/user/webui">WebUI 介面導覽<span class="desc">每個頁面是幹什麼的</span></a></li>
<li><a href="/zh-TW/azurpilot/user/device">連接模擬器與 ADB<span class="desc">Serial、截圖與控制</span></a></li>
<li><a href="/zh-TW/azurpilot/user/scheduler">排程器與任務編排<span class="desc">優先級、間隔與失敗恢復</span></a></li>
<li><a href="/zh-TW/azurpilot/user/tasks/">任務手冊<span class="desc">按玩法逐個說明</span></a></li>
</ul>
