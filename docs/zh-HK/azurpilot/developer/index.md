---
title: 開發者入口
description: 搭建 AzurPilot 開發環境、理解倉庫結構、找到第一條要改的代碼，以及提交 PR 前的檢查清單。
updated: 2026-10-20
---

# 開發者入口

這份文檔假設你會 Python，但不熟悉這個倉庫。目標是讓你在半小時內跑起來、找到代碼、做出第一個可驗證的改動。

## <DocIcon name="laptop" /> 環境

| 依賴 | 版本 | 説明 |
| --- | --- | --- |
| Python | **3.14** | 以 `pyproject.toml` 的 `requires-python` 為準 |
| uv | 最新 | 依賴與虛擬環境統一由它管理 |
| Node.js | 見 `frontend/package.json` | 只在前端開發時需要 |
| ADB | 任意可用版本 | 只在真實設備聯調時需要 |

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
uv sync --frozen            # 含开发依赖
npm ci --prefix frontend    # 前端锁定依赖
```

### 常用命令

| 用途 | 命令 |
| --- | --- |
| 啟動 WebUI | `uv run python gui.py` |
| 啟動調度器 | `uv run python alas.py <实例名>` |
| 終端介面 | `uv run python tui.py` |
| 獨立 MCP 服務 | `uv run python mcp_server_sse.py` |
| Python 單測 | `uv run python -m unittest discover -s tests` |
| 單個測試模組 | `uv run python -m unittest tests.test_api` |
| pytest 用例 | `uv run pytest tests/shop_event` |
| 基礎 lint | `uv run ruff check . --select E9,F63,F7,F82 --ignore F821,F722` |
| 前端類型檢查 | `npm run typecheck --prefix frontend` |
| 前端單測 | `npm test --prefix frontend` |
| 端到端 | `npm run test:e2e --prefix frontend` |
| 匯入冒煙 | `uv run python -m dev_tools.import_smoke_test` |

## <DocIcon name="map" /> 倉庫地圖

```text
AzurPilot/
├── alas.py                  # 调度器：任务循环、恢复、任务方法
├── gui.py                   # WebUI 后端（uvicorn + 进程监督）
├── mcp_server_sse.py        # 独立 MCP SSE 服务
├── tui.py                   # 终端界面
├── module/
│   ├── api/                 # WebSocket 路由与方法
│   ├── runtime/             # 进程、更新、远程、账号
│   ├── config/              # 配置定义与生成器
│   ├── device/              # 截图、点击、模拟器管理
│   ├── ui/                  # 页面图与控件
│   ├── ocr/                 # OCR 模型与封装
│   ├── map/ map_detection/  # 网格感知与寻路
│   ├── combat/              # 战斗循环
│   ├── campaign/            # 战役入口
│   ├── os*/                 # 大世界
│   ├── <玩法>/              # research、commission、island…
│   └── persistence/         # SQLite 总库
├── campaign/                # 关卡地图与战斗定义（Python）
├── frontend/                # React + TypeScript + Vite
├── assets/                  # 四服识别资源（生成产物为主）
├── deploy/                  # 安装、启动、构建辅助
├── dev_tools/               # 代码生成与调试工具
├── docs/modules/            # 模块文档（20 节结构）
└── tests/                   # Python 单元测试
```

## <DocIcon name="compass" /> 按目標找入口

| 我想…… | 從這裏開始 |
| --- | --- |
| 新增一個遊戲任務 | [新增一個任務](/zh-HK/azurpilot/developer/module-dev) |
| 改調度行為 | [調度器生命週期](/zh-HK/azurpilot/developer/scheduler) |
| 加一個配置項 | [配置系統](/zh-HK/azurpilot/developer/config) |
| 改前端頁面 | [React 前端](/zh-HK/azurpilot/developer/frontend) |
| 加一個 API 方法 | [WebUI 後端](/zh-HK/azurpilot/developer/webui-backend) |
| 調識別準確率 | [設備、識別與戰鬥](/zh-HK/azurpilot/developer/device-vision) |
| 修活動圖 | `campaign/` 下對應關卡檔案 + `campaign/Readme.md` |

## <DocIcon name="shield" /> 三條硬規則

### 1. 遊戲交互用狀態循環，不用 sleep

```python
def some_function(self, skip_first_screenshot=True):
    while True:
        if skip_first_screenshot:
            skip_first_screenshot = False
        else:
            self.device.screenshot()

        if self.appear(END_CONDITION):
            break
        if self.appear_then_click(BUTTON_A, interval=2):
            continue
        if self.handle_popup():
            continue
```

- 退出檢測用 `appear()`，不設 `interval`。
- 操作用 `appear_then_click()`，`interval` 通常 2–5 秒，防連擊。
- 不在循環內 `sleep()`，不用負面條件控制循環，不嵌套狀態循環。
- `handle_*()` 返回 `bool`：`True` 表示已操作、需要新截圖。

### 2. 生成檔案不要手改

| 生成產物 | 生成命令 |
| --- | --- |
| `module/config/argument/args.json`、`menu.json`、`config_generated.py`、`config/template.json` | `uv run -m module.config.config_updater` |
| `assets/*/assets.py`（按鈕資源） | `uv run -m dev_tools.button_extract` |
| `frontend/src/api/generated.ts`、`contract.json` | `uv run python -m dev_tools.export_api_schema` |

CI 會重新生成並檢查差異。手改生成檔案會在 CI 直接失敗。

### 3. 任務方法保持惰性匯入

```python
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

啟動時只加載調度與配置，任務模組在首次執行時才匯入。這既壓低首幀延遲，也讓單個模組的匯入錯誤隻影響該任務。

## <DocIcon name="file" /> 現有模組文檔

`docs/modules/` 下有一套 20 節結構的模組文檔，覆蓋調度器、配置、設備、識別、戰鬥、大世界、WebUI 等。改動相關模組時先讀對應文檔，改完同步更新。

| 文檔 | 主題 |
| --- | --- |
| `docs/modules/README.md` | 索引與撰寫規範 |
| `docs/modules/overview/conventions.md` | 編碼規範與橫切模式 |
| `docs/modules/overview/directory-map.md` | 目錄 → 任務映射 |
| `docs/modules/WRITING-GUIDE.md` | 文檔結構標準 |

## <DocIcon name="handshake" /> 提交 PR

1. 從 `master` 拉分支，改動聚焦在單一主題。
2. 跑與改動直接相關的測試；跨三個以上模組的行為變更才需要全量。
3. 生成檔案與源檔案一起提交。
4. 按 `.github/PULL_REQUEST_TEMPLATE.md` 填寫：變更類型、驗證結果、相關 Issue。
5. 未執行的檢查不要勾選。CI 失敗先看日誌，不要 `--no-verify`。

## <DocIcon name="wrench" /> 調試技巧

| 場景 | 方法 |
| --- | --- |
| 單模組跑指定任務 | 模組檔案的 `__main__` 塊（大世界任務常用） |
| 不連設備驗證匯入 | `uv run python -m dev_tools.import_smoke_test` |
| 看 API 契約 | `frontend/src/api/contract.json` |
| 看配置字段 | WebUI 的開發控件，或 `args.json` |
| 調試服務 | `ALAS_DEBUG_SERVER=1`（僅監聽本機） |
