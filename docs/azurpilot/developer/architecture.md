---
title: 系统架构
description: AzurPilot 的分层结构、进程模型、模块边界与数据流，以及修改代码前必须知道的约束。
updated: 2026-10-20
---

# 系统架构

<CoreArchDiagram />

<Figure caption="上层依赖下层。业务模块之间不互相调用，跨任务协作通过配置与调度原语完成。" />

## <DocIcon name="box" /> 进程模型

```text
gui.py（父进程）
├── HTTP / WebSocket 服务（uvicorn）
├── 静态前端（frontend/dist）
├── 实例 worker × N（multiprocessing.Process）
│    └── AzurLaneAutoScript.loop()
└── TaskHandler（WebUI 自用的后台任务：更新检查、远程保活）
```

| 进程 | 生命周期 | 职责 |
| --- | --- | --- |
| `gui.py` | 常驻 | 提供界面与 API，创建、监督、回收 worker |
| worker | 随实例启停 | 调度循环与全部游戏操作 |
| `mcp_server_sse.py` | 可选独立进程 | MCP 工具，复用 WebUI 密码 |

几个容易误解的点：

- **worker 不是守护进程**。它由 `ProcessManager` 创建，父进程退出会一起收尾。
- **`TaskHandler` 不是游戏调度器**。它只服务 WebUI 的定时任务，不接触设备。
- **每个实例独占一个 worker**。两个 worker 操作同一台模拟器，行为未定义。

## <DocIcon name="settings" /> 分层与边界

### 入口层

| 文件 | 入口 | 说明 |
| --- | --- | --- |
| `alas.py` | `AzurLaneAutoScript.loop()`、`run(command)` | 唯一调度者 |
| `gui.py` | `main()` | 参数解析、前端构建检查、启动 uvicorn、监督 worker |
| `mcp_server_sse.py` | `main()` | SSE 传输的 MCP 服务 |
| `tui.py` | `main()` | 终端界面，复用同一套配置 |

### 运行时层

| 路径 | 职责 |
| --- | --- |
| `module/api/router.py` | 显式方法注册表，参数校验与分发 |
| `module/api/socket.py` | WebSocket 会话、鉴权、订阅 |
| `module/runtime/process_manager.py` | worker 生命周期、停止信号 |
| `module/runtime/updater.py` | 更新检查、拉取、应用 |
| `module/runtime/remote_*.py` | Cloudflare Tunnel 与配对 |
| `module/runtime/account_*.py` | 账号保险库 |

### 业务层

每个玩法一个包，入口类实现 `run()`。业务层通过 `ModuleBase` 获得：

- `self.device`：截图、点击、应用控制
- `self.config`：绑定到当前任务的配置
- `self.appear()` / `appear_then_click()`：识别与操作原语
- `self.ui_ensure()` / `ui_goto()`：页面导航

### 基础层

| 模块 | 关键抽象 | 边界 |
| --- | --- | --- |
| `module/base` | `ModuleBase`、`Button`、`Template`、`Timer`、`Filter` | 不包含具体玩法 |
| `module/device` | `Device`、`Connection`、`Screenshot`、`Control` | 不做恢复决策 |
| `module/ui` | `UI`、`Page`、页面图 | 不做业务判断 |
| `module/ocr` | 模型、推理封装、基准 | 不关心调用方 |
| `module/map` | `Map`、网格感知、寻路 | 不含战斗策略 |
| `module/combat` | 战斗循环、结算、阵容 | 不含关卡选择 |

## <DocIcon name="zap" /> 一次任务的数据流

```text
WebUI 配置修改
  → config/<实例>.json
    → 调度器在任务边界丢弃 config 缓存
      → get_next() 选出任务
        → bind(task)：self.config.<Group>_<Argument>
          → run(command)
            → 业务模块截图 / 识别 / 点击
              → task_delay() 写回 NextRun
                → 返回 True / 'recoverable' / False
```

**调度状态完全落在配置文件的 `Scheduler.NextRun` 里**。内存中的失败计数只辅助恢复决策，进程重启后调度队列原样保留。

## <DocIcon name="pencil" /> 任务注册机制

调度器只认识字符串：

1. `task.yaml` 定义任务、菜单与参数组。
2. `alas.py` 提供同名方法（命令驼峰转下划线）。
3. 方法内惰性导入实现类并调用 `run()`。

```python
# alas.py
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

新增任务不需要注册表，`run()` 通过 `getattr(self, command)()` 分发。这也意味着**方法名写错不会在启动时报错**，只会在任务执行时抛 `AttributeError`。

## <DocIcon name="drive" /> 持久化

| 数据 | 位置 | 说明 |
| --- | --- | --- |
| 实例配置 | `config/<实例>.json` | 用户可见、可导出 |
| 部署配置 | `config/deploy.yaml` | 后端级 |
| 业务数据 | SQLite 总库 | 统计、掉落、调度程序、安全历史 |
| 掉落记录 | `log/drop/` 等 | 按类别与保留策略 |
| 错误现场 | `log/error/<实例>/<时间戳>/` | 截图 + 截断日志 |

业务数据库由 `module/persistence` 统一管理：首次迁移先备份、转换、检查，失败停止启动并保留旧源。**模块导入不创建数据库**，只有运行入口初始化。

## <DocIcon name="handshake" /> 横切约定

### 异常

`module/exception.py` 定义全部业务异常。调度器按类型决定恢复力度，业务模块不要吞异常：

| 异常 | 语义 |
| --- | --- |
| `GameStuckError` | 画面长期无推进 |
| `GameTooManyClickError` | 同一按钮反复点击 |
| `GameNotRunningError` | 游戏进程不存在 |
| `EmulatorNotRunningError` | 设备离线 |
| `RequestHumanTakeover` | 无法安全自动判断 |
| `ScriptError` | 代码缺陷 |
| `TaskEnd` | 任务主动正常结束 |

### 日志

- `logger.hr()` 标记阶段，`logger.attr()` 记录状态。
- 日志写入 `log/<日期>_<实例>.txt`。
- 不要在日志里输出账号、密钥、截图路径中的用户名。

### 资源

- 四服资源在 `assets/{cn,en,jp,tw}/`，按 1280×720 坐标制作。
- 模板对象以 `TEMPLATE_` 前缀命名。
- 改按钮后运行 `uv run -m dev_tools.button_extract`，提交生成的 `assets.py`。

### 配置

- 先改 `module/config/argument/*.yaml`，再运行生成器。
- 配置路径是 `<Task>.<Group>.<Argument>`，业务里通过 `self.config.Group_Argument` 访问。
- 新增字段必须补 `i18n/*.json` 的翻译，生成器不会自动翻译。

## <DocIcon name="circle-alert" /> 已知的技术债

| 位置 | 问题 |
| --- | --- |
| `run()` / `loop()` | 数百行长方法，异常矩阵靠内联分支，新增异常容易漏对称处理 |
| 返回值 | `True / False / 'recoverable'` 是弱类型协议，重构需全局搜索 |
| `failure_record` | 只存内存，进程重启清零，敏感任务的连续失败保护会被重启重置 |
| `EmulatorManager` 任务 | 内联 SSH 逻辑，是唯一不遵循「委托业务模块」形态的任务方法 |
| `GameManager` | 未完成，不要依赖 |

## <DocIcon name="map" /> 相关文档

<ul class="ap-linklist">
<li><a href="/azurpilot/developer/scheduler">调度器生命周期<span class="desc">loop / run / 恢复矩阵</span></a></li>
<li><a href="/azurpilot/developer/config">配置系统<span class="desc">YAML 到运行时的链路</span></a></li>
<li><a href="/azurpilot/developer/webui-backend">WebUI 后端<span class="desc">API 与进程管理</span></a></li>
<li><a href="/azurpilot/developer/module-dev">新增一个任务<span class="desc">完整示例</span></a></li>
</ul>
