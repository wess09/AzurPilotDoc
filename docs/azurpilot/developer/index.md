---
title: 开发者入口
description: 搭建 AzurPilot 开发环境、理解仓库结构、找到第一条要改的代码，以及提交 PR 前的检查清单。
updated: 2026-10-20
---

# 开发者入口

这份文档假设你会 Python，但不熟悉这个仓库。目标是让你在半小时内跑起来、找到代码、做出第一个可验证的改动。

## <DocIcon name="laptop" /> 环境

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| Python | **3.14** | 以 `pyproject.toml` 的 `requires-python` 为准 |
| uv | 最新 | 依赖与虚拟环境统一由它管理 |
| Node.js | 见 `frontend/package.json` | 只在前端开发时需要 |
| ADB | 任意可用版本 | 只在真实设备联调时需要 |

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
uv sync --frozen            # 含开发依赖
npm ci --prefix frontend    # 前端锁定依赖
```

### 常用命令

| 用途 | 命令 |
| --- | --- |
| 启动 WebUI | `uv run python gui.py` |
| 启动调度器 | `uv run python alas.py <实例名>` |
| 终端界面 | `uv run python tui.py` |
| 独立 MCP 服务 | `uv run python mcp_server_sse.py` |
| Python 单测 | `uv run python -m unittest discover -s tests` |
| 单个测试模块 | `uv run python -m unittest tests.test_api` |
| pytest 用例 | `uv run pytest tests/shop_event` |
| 基础 lint | `uv run ruff check . --select E9,F63,F7,F82 --ignore F821,F722` |
| 前端类型检查 | `npm run typecheck --prefix frontend` |
| 前端单测 | `npm test --prefix frontend` |
| 端到端 | `npm run test:e2e --prefix frontend` |
| 导入冒烟 | `uv run python -m dev_tools.import_smoke_test` |

## <DocIcon name="map" /> 仓库地图

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

## <DocIcon name="compass" /> 按目标找入口

| 我想…… | 从这里开始 |
| --- | --- |
| 新增一个游戏任务 | [新增一个任务](/azurpilot/developer/module-dev) |
| 改调度行为 | [调度器生命周期](/azurpilot/developer/scheduler) |
| 加一个配置项 | [配置系统](/azurpilot/developer/config) |
| 改前端页面 | [React 前端](/azurpilot/developer/frontend) |
| 加一个 API 方法 | [WebUI 后端](/azurpilot/developer/webui-backend) |
| 调识别准确率 | [设备、识别与战斗](/azurpilot/developer/device-vision) |
| 修活动图 | `campaign/` 下对应关卡文件 + `campaign/Readme.md` |

## <DocIcon name="shield" /> 三条硬规则

### 1. 游戏交互用状态循环，不用 sleep

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

- 退出检测用 `appear()`，不设 `interval`。
- 操作用 `appear_then_click()`，`interval` 通常 2–5 秒，防连击。
- 不在循环内 `sleep()`，不用负面条件控制循环，不嵌套状态循环。
- `handle_*()` 返回 `bool`：`True` 表示已操作、需要新截图。

### 2. 生成文件不要手改

| 生成产物 | 生成命令 |
| --- | --- |
| `module/config/argument/args.json`、`menu.json`、`config_generated.py`、`config/template.json` | `uv run -m module.config.config_updater` |
| `assets/*/assets.py`（按钮资源） | `uv run -m dev_tools.button_extract` |
| `frontend/src/api/generated.ts`、`contract.json` | `uv run python -m dev_tools.export_api_schema` |

CI 会重新生成并检查差异。手改生成文件会在 CI 直接失败。

### 3. 任务方法保持惰性导入

```python
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

启动时只加载调度与配置，任务模块在首次执行时才导入。这既压低首帧延迟，也让单个模块的导入错误只影响该任务。

## <DocIcon name="file" /> 现有模块文档

`docs/modules/` 下有一套 20 节结构的模块文档，覆盖调度器、配置、设备、识别、战斗、大世界、WebUI 等。改动相关模块时先读对应文档，改完同步更新。

| 文档 | 主题 |
| --- | --- |
| `docs/modules/README.md` | 索引与撰写规范 |
| `docs/modules/overview/conventions.md` | 编码规范与横切模式 |
| `docs/modules/overview/directory-map.md` | 目录 → 任务映射 |
| `docs/modules/WRITING-GUIDE.md` | 文档结构标准 |

## <DocIcon name="handshake" /> 提交 PR

1. 从 `master` 拉分支，改动聚焦在单一主题。
2. 跑与改动直接相关的测试；跨三个以上模块的行为变更才需要全量。
3. 生成文件与源文件一起提交。
4. 按 `.github/PULL_REQUEST_TEMPLATE.md` 填写：变更类型、验证结果、相关 Issue。
5. 未执行的检查不要勾选。CI 失败先看日志，不要 `--no-verify`。

## <DocIcon name="wrench" /> 调试技巧

| 场景 | 方法 |
| --- | --- |
| 单模块跑指定任务 | 模块文件的 `__main__` 块（大世界任务常用） |
| 不连设备验证导入 | `uv run python -m dev_tools.import_smoke_test` |
| 看 API 契约 | `frontend/src/api/contract.json` |
| 看配置字段 | WebUI 的开发控件，或 `args.json` |
| 调试服务 | `ALAS_DEBUG_SERVER=1`（仅监听本机） |
