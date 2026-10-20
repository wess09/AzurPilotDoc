---
title: 调度器生命周期
description: alas.py 的主循环、任务选择、异常分级、线程模型与缓存策略；修改调度行为前必读。
updated: 2026-10-20
---

# 调度器生命周期

`alas.py` 是运行时的心脏。它不实现任何游戏操作，只负责「选出下一个任务 → 绑定配置 → 执行 → 按结果安排下次」。

<SchedulerFlow />

## <DocIcon name="rocket" /> 入口

| 入口 | 用途 |
| --- | --- |
| `uv run python alas.py [实例名]` | 命令行；不传实例名时用默认 `ap`，实例名非法直接退出码 2 |
| `AzurLaneAutoScript(config_name).loop()` | worker 主入口 |
| `AzurLaneAutoScript.run(command)` | 单任务入口（WebUI「立即执行」） |
| `config.task_call('Restart')` | 跨任务注入恢复 |
| `AzurLaneAutoScript.stop_event` | 跨进程停止事件代理 |

## <DocIcon name="refresh" /> 主循环做了什么

每轮固定六步：

1. **停止检查**：`stop_event` 置位则退出，走正常收尾。
2. **维护等待**：`checker.wait_until_available()`；服务器恢复瞬间刷新配置并注入 `Restart`。
3. **计划重启**：距上次重启超过 `RestartIntervalHours`（默认 4 小时）时，在任务间隙重启模拟器。
4. **选任务**：`get_next_task()`。
5. **执行**：刷新 `device.config`、清空卡死与连点记录、激活运行监护，调用 `run(command)`。
6. **结算**：更新失败计数、判断敏感任务、按结果重置计数器。

### 选任务的细节

`config.get_next()` 优先取「已到期且已启用」的任务中优先级最高的；没有则取等待队列里最近到期的，并给返回副本的 `next_run` 加上囤积时长。

两个队列都为空时抛 `RequestHumanTakeover`——提示至少启用一个任务。

等待超过 3 小时且开启 `CloseEmulatorDuringLongWait` 时，会关闭模拟器并在醒来后重新拉起。预热开启时则相反：提前启动并登录到主界面。

### wait_until 与热重载

```python
def wait_until(self, future):
    while True:
        if self.stop_event.is_set():
            exit(0)          # 由父进程归类为「更新退出」
        if self.config.should_reload():
            return False     # 外层丢掉 config 缓存，重新选择任务
        ...
```

每 5 秒检查一次停止事件与配置文件 mtime。这就是空闲期的配置热重载：**不做增量合并，直接丢弃整个 config 对象**。

## <DocIcon name="circle-check" /> run() 的三态返回

| 返回 | 含义 | 失败计数 |
| --- | --- | --- |
| `True` | 成功（含 `TaskEnd`） | 清零 |
| `'recoverable'` | 失败但已就地安排恢复 | 不变 |
| `False` | 不可恢复失败 | +1 |

为什么可恢复失败不计数：失败计数驱动的是「强制重启模拟器」这种高代价动作。可恢复错误已经各自触发过针对性恢复，再升级会重复惩罚。

## <DocIcon name="circle-alert" /> 异常矩阵

所有分支的第一动作都是 `_check_sensitive_exit()`：严格重启开启且该任务标记敏感时，保存现场、推送并 `exit(1)`。

| 异常 | 恢复动作 | 返回 |
| --- | --- | --- |
| `TaskEnd` | 视为正常结束 | `True` |
| `GameNotRunningError` | 注入 `Restart` | `recoverable` |
| `GameStuckError` / `GameTooManyClickError` | 连续达阈值重启模拟器，否则 10 秒后重启游戏 | `recoverable` |
| `GameBugError` | 重启游戏 | `recoverable` |
| `GamePageUnknownError` | 查服务器：可用则重启游戏，维护中则等待 | `recoverable` / `False` |
| `ScriptError` | 3 次内注入 `Restart`，第 3 次退出 | `recoverable` / `exit(1)` |
| `EmulatorNotRunningError` | 重启模拟器（不放弃，只拉长间隔）+ `Restart` | `recoverable` |
| `RequestHumanTakeover` | 先尝试重启模拟器自动恢复 | `recoverable` |
| `MindCalculatorScanError` | 记录原因与截图，保留旧清单，不重启 | `False` |
| `AutoSearchSetError` | 重启游戏 | `recoverable` |
| 其他 `Exception` | 连续达阈值升级为重启模拟器 | `recoverable` |

最外层 `except` 是最后防线：上报日志、重启模拟器、注入 `Restart`，按 `min(300, 20 × 2^(n-1))` 秒退避后重试。

### 终止路径只有四条

1. `ScriptError` 连续 3 次。
2. 敏感任务失败。
3. `stop_event`。
4. 配置或设备初始化失败。

新增分支时不要主动退出。7×24 的前提就是「永不因故障退出」。

## <DocIcon name="refresh" /> 同一任务连续重启上限

`Error.TaskRestartLimit`（默认 3，0 关闭）用独立的 `task_restart_record` 计数：

- 累计 `recoverable`、`False` 和选出任务后的全局异常；
- 只有**该任务成功**才清零（其他任务成功、`Restart` 成功都不清）；
- 达到上限后把 `NextRun` 写到服务器次日零点，发错误推送，其他任务继续；
- `Restart` 豁免，不计入也不被阻挡。

## <DocIcon name="clock" /> 线程模型

| 线程 | 创建条件 | 职责 |
| --- | --- | --- |
| 主线程 | 进程启动 | `loop()` 与任务执行 |
| `alas-watchdog` | 任一监护子功能开启 | 每 30 秒检查任务超时、强制定时重启 |
| `daily-summary-scheduler-<name>` | 日报开启 | 每秒检查触发窗口 |
| 模拟器启停 worker | 每次启停操作 | 执行 stop/start，600 秒硬超时 |

关键约定：

- **监护只在 `run()` 前后激活**，空闲等待不会误判。
- **监护杀模拟器而不是杀线程**：主线程可能阻塞在 ADB/uiautomator2 的 C 调用里，Python 层无法安全中断。
- **启停必须经 `_emulator_op_with_timeout`**。超时放弃的线程仍持有平台锁，后来的请求会收到 `EmulatorOpBusy` 并被跳过，防止踩踏。
- **跨进程停止信号**由 `State.manager.Event()` 创建，普通 `threading.Event` 不能替代。
- **日报线程不访问 `self.config`**，只读配置文件快照，避免读到任务中途绑定的参数。

## <DocIcon name="drive" /> 缓存与失效

| 数据 | 位置 | 失效时机 |
| --- | --- | --- |
| `config` / `device` / `checker` | `cached_property` | `del_cached_property`：任务结束、错误恢复、服务器恢复、模拟器重启 |
| `failure_record` | 内存 | 成功清零，进程重启清零 |
| `_warmup_measured_*` | 实例属性 | 每次预热成功后覆盖 |
| `_i18n_task_names` | 模块级 | 进程内加载一次 |

注意 `module/config/deep.py` 的 `deep_iter_diff` 目前没有调用方——热重载不是基于差异比较，而是 mtime + 整体重建。

## <DocIcon name="circle-plus" /> 扩展：新增可调度任务

1. `task.yaml` 注册任务与菜单；`argument.yaml` 定义参数（含 `Scheduler` 组）。
2. `module/<功能>/` 实现 `run()`。
3. `alas.py` 添加同名方法。
4. 需要时在 `config_manual.py` 的 `_DEFAULT_SCHEDULER_PRIORITY` 插入默认优先级。
5. 补 `i18n/*.json` 的任务名翻译。
6. 运行 `uv run -m module.config.config_updater`。

不需要任何注册动作。业务模块内部通过 `config.check_task_switch()` 感知任务切换，调度器不会中断正在执行的任务。

## <DocIcon name="shield" /> 修改注意事项

::: danger 五个不要
1. 不要漏掉异常分支里的 `_check_sensitive_exit()`——敏感任务会在该停机时被自动重启。
2. 不要恢复 `RESTART_SENSITIVE_TASKS` 常量，敏感任务已是动态配置。
3. 不要让 `loop()` 在新分支里主动退出。
4. 不要绕过 `_emulator_op_with_timeout` 直接调用平台启停。
5. 不要在状态循环里 `sleep()` 代替截图确认。
:::

## <DocIcon name="wrench" /> 调试

| 手段 | 说明 |
| --- | --- |
| 日志 | 搜 `[AzurPilot]` 看调度决策链 |
| 错误现场 | `log/error/<实例>/<时间戳>/` |
| 运行监护 | 临时开 `WatchdogEnable` + `WatchdogTaskEnable` 验证是否逻辑死循环 |
| 单任务 | WebUI「立即执行」走 `run(command)`，跳过调度 |
| 外部调度器 | 只用启动命令、配置、日志、进程终止四个面，见[外部契约](#外部调度器契约) |

### 外部调度器契约

AUTO-MAS 一类外部工具把 AzurPilot 当黑箱：

| 面 | 约定 |
| --- | --- |
| 启动 | `uv run python alas.py <实例名>`，工作目录为项目根 |
| 配置 | 读写 `config/<实例名>.json`，字段语义归配置系统 |
| 日志 | `log/<日期>_<实例名>.txt`，以「开始任务 / 结束任务」为边界 |
| 停止 | 终止进程树；没有停止文件 |

`module/logger.py` 在导入时会把工作目录切到项目根，所以外部工具不需要设置 cwd，但一个实例必须独占一个进程。
