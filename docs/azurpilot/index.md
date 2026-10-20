---
title: 核心程序概览
description: AzurPilot 核心仓库提供的能力、WebUI 结构、任务分类与运行模型，是 Android 版与启动器共同托管的本体。
updated: 2026-10-20
---

# 核心程序概览

核心程序（[wess09/AzurPilot](https://github.com/wess09/AzurPilot)，默认分支 `master`）是唯一包含游戏行为的仓库。启动器和 Android 宿主都只是它的运行外壳。

<div class="ap-meta">
<span><b>语言</b> Python 3.14</span>
<span><b>界面</b> React + Vite</span>
<span><b>端口</b> 25548</span>
<span><b>识别基准</b> 1280×720</span>
<span><b>许可证</b> GPL-3.0</span>
</div>

## <DocIcon name="box" /> 它由哪几块组成

<CoreArchDiagram />

<Figure caption="分层只表达依赖方向：上层可以调用下层，下层不知道上层的存在。业务模块之间不直接互相调用。" />

| 层 | 关键路径 | 职责 |
| --- | --- | --- |
| 入口 | `alas.py`、`gui.py`、`mcp_server_sse.py`、`tui.py` | 调度循环、WebUI 后端、MCP 服务、终端界面 |
| 运行时 | `module/api/`、`module/runtime/` | WebSocket 路由、进程管理、更新、远程访问、账号保险库 |
| 业务 | `module/<功能>/`、`campaign/` | 每类玩法一个模块，实现 `run()` 与地图定义 |
| 基础 | `module/device/`、`ui/`、`ocr/`、`map/`、`combat/` | 截图、点击、页面导航、识别、寻路、战斗 |
| 数据 | `config/`、SQLite 总库、`assets/` | 用户配置、统计与持久化、四服识别资源 |

## <DocIcon name="settings" /> 三层运行模型

1. <DocIcon name="monitor" /> **`gui.py` 是父进程**。它提供 HTTP/WebSocket 服务与静态前端，不直接操作游戏。
2. <DocIcon name="zap" /> **每个实例一个 worker 进程**。由 `ProcessManager` 用 `multiprocessing.Process` 创建，进程内跑 `AzurLaneAutoScript.loop()`。
3. <DocIcon name="clock" /> **worker 内主线程串行执行任务**。运行监护、日报线程是辅助线程，不并发执行游戏任务。

这解释了几个常见现象：

- <DocIcon name="circle-alert" /> 停止实例 = 终止 worker 进程树，WebUI 本身还在。
- <DocIcon name="circle-alert" /> 同一实例不可能同时跑两个任务；想并行只能多开实例 + 多开模拟器。
- <DocIcon name="circle-alert" /> WebUI 关掉不影响已启动的 worker 吗？——**会**，worker 由 `gui.py` 创建并托管，后端退出会一起收尾。

## <DocIcon name="monitor" /> WebUI 结构

| 区域 | 路径 | 内容 |
| --- | --- | --- |
| 首页 | `/` | 实例卡片、启动/停止、公告 |
| 实例总览 | `/i/<实例>/overview` | 当前任务、资源、日志尾、快捷操作 |
| 任务配置 | `/i/<实例>/task/<任务>` | 按 `task.yaml` 分组渲染的表单 |
| 统计 | `/i/<实例>/statistics` | 资源、出击、大世界、委托等报表 |
| 调度程序 | `/i/<实例>/task/SchedulerProgram` | 图形化调度编排 |
| 心智计算器 | `/i/<实例>/task/MindCalculator` | 船坞扫描与心智单元费用 |
| 舰队科技 | `/i/<实例>/task/FleetTechnology` | 科技点扫描与统计 |
| 系统设置 | `/settings` | 账户、远程访问、更新、界面 |
| 配置管理 | `/configs` | 导入、导出、复制、删除实例 |

逐页说明见 [WebUI 界面导览](/azurpilot/user/webui)。

## <DocIcon name="compass" /> 任务分类

WebUI 的任务菜单来自 `module/config/argument/task.yaml`，共 12 个顶级分组：

| 分组 | 中文名 | 典型任务 |
| --- | --- | --- |
| `Alas` | 系统 | 模拟器、错误处理、备份、日报 |
| `Farm` | 出击 | 主线图 1/2/3、紧急委托、三油低耗 |
| `Event` | 活动 | 活动图 1/2/3、共斗、作战档案 |
| `EventDaily` | 活动-每日任务 | 每日 A/B/C/D/SP 图 |
| `Reward` | 自动收获 | 委托、科研、后宅、指挥喵、大舰队 |
| `DailyMission` | 每日任务 | 每日任务、限界挑战、困难图、演习 |
| `Opsi` | 大世界 | 开荒、隐秘、深渊、要塞、智能调度 |
| `Island` | 赤石计划 | 农田、牧场、餐厅、制造、每日采集 |
| `FleetManagement` | 舰队管理 | 舰队扫描、舰队信息 |
| `RunParams` | 运行参数 | 调度器与设备节奏 |
| `Tool` | 工具 | 半自动、性能测试、OCR 基准、反和谐 |
| `Dashboard` | 仪表盘 | 资源上限与颜色 |

完整的 102 个任务命令见[任务命令总表](/reference/tasks)。

::: tip 任务数量会变
活动适配会增删任务，`alas.py` 上的任务方法数量也随版本变化。文档用「约」表述，具体以你当前版本的 WebUI 为准。
:::

## <DocIcon name="plug" /> 扩展方式

新增能力的最小闭环是**三处同名 + 一个 `run()`**：

1. <DocIcon name="file-pen" /> `task.yaml` 注册任务与菜单组。
2. <DocIcon name="file-pen" /> `alas.py` 添加同名方法（驼峰转下划线）。
3. <DocIcon name="folder" /> `module/<功能>/` 实现类并提供 `run()`。
4. <DocIcon name="refresh" /> 运行 `uv run -m module.config.config_updater` 生成配置产物。

详细步骤与常见陷阱见[新增一个任务](/azurpilot/developer/module-dev)。

## <DocIcon name="map" /> 继续阅读

<ul class="ap-linklist">
<li><a href="/azurpilot/user/webui">WebUI 界面导览<span class="desc">每个页面是干什么的</span></a></li>
<li><a href="/azurpilot/user/device">连接模拟器与 ADB<span class="desc">Serial、截图与控制</span></a></li>
<li><a href="/azurpilot/user/scheduler">调度器与任务编排<span class="desc">优先级、间隔与失败恢复</span></a></li>
<li><a href="/azurpilot/user/tasks/">任务手册<span class="desc">按玩法逐个说明</span></a></li>
</ul>
