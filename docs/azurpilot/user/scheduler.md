---
title: 调度器与任务编排
description: 任务何时运行、按什么顺序运行、失败后如何恢复；优先级、间隔、囤积、预热与敏感任务的配置方法。
updated: 2026-10-20
---

# 调度器与任务编排

调度器只回答一个问题：**现在该跑哪个任务**。它不实现任何游戏逻辑，也不并发执行任务——同一实例内，任务永远是一个接一个串行跑的。

<SchedulerFlow />

<Figure caption="每轮循环都会重新读一次磁盘配置。配置热重载发生在任务边界，而不是任务执行中途。" />

## <DocIcon name="clipboard" /> 任务的状态

每个任务只有三个真正重要的字段：

| 字段 | 含义 |
| --- | --- |
| `Scheduler.Enable` | 是否加入调度 |
| `Scheduler.NextRun` | 下一次允许运行的时间戳（持久化在配置文件里） |
| `Scheduler.Command` | 内部任务名，与 `alas.py` 方法对应 |

当 `NextRun` 早于当前时间且任务已启用，它就进入待执行集合。调度器从待执行集合里按优先级挑一个；如果没有待执行任务，就取最近到期的那个并等待。

::: tip 清空 NextRun = 立即运行
把「下一次运行时间」清空，等价于把它设为过去时间。这是手动触发任务最直接的方式。
:::

## <DocIcon name="crown" /> 优先级怎么定

默认优先级在 `module/config/config_manual.py` 的 `_DEFAULT_SCHEDULER_PRIORITY` 中定义。用户可以覆盖：

> 系统设置 → 通用设置 → **自定义任务优先级**

格式是每行一个任务命令，越靠前越优先：

```text
Restart
Commission
Research
Reward
OpsiScheduling
Main
```

没有列出的任务排在后面，按默认顺序。

::: warning 优先级不是万能的
优先级只在「多个任务同时到期」时决定谁先跑。一个任务跑多久由它自己决定，调度器不会中途抢占。想让某任务快点结束，调它自己的停止条件，而不是调优先级。
:::

## <DocIcon name="clock" /> 时间安排

| 配置 | 作用 |
| --- | --- |
| `SuccessInterval` | 成功后推迟多少分钟再跑（0 表示任务自己安排） |
| `FailureInterval` | 失败后推迟多少分钟（默认 120） |
| `ServerUpdate` | 服务器刷新时间，每日任务的排期基准 |

任务内部通常调用 `task_delay(success=True/False)` 来写入下一次时间。不同玩法的间隔差异很大：委托可能十几分钟，科研几小时，每日任务固定到服务器刷新后。

### <DocIcon name="package" /> 囤积

`Optimization.TaskHoardingDuration` 大于 0 时，等待中的任务会在计划时间上再加一段「囤积时长」。比如 12:00 到期、囤积 10 分钟，实际最早 12:10 运行。

用途是把多个零散任务聚到一起跑，减少唤醒次数。代价是时间精度下降，不适合对时间敏感的活动。

### <DocIcon name="zap" /> 预热

`Optimization.WarmupEnable` 开启后，调度器会在任务开始前提前启动模拟器与游戏，登录到主界面等着。提前量取自上次实测耗时 + 2 分钟；没有实测时用 `WarmupMinutes`（默认 15 分钟）。

这对冷启动很慢的机器意义很大：任务到点时游戏已经就绪，不用再等两分钟。

## <DocIcon name="circle" /> 空闲时做什么

没有到期任务时，按 `Optimization.WhenTaskQueueEmpty` 处理：

| 值 | 行为 |
| --- | --- |
| `goto_main` | 停在主界面（默认） |
| `close_game` | 关闭游戏，省内存 |
| `stay_there` | 保持当前画面不动 |

如果等待超过 3 小时且 `CloseEmulatorDuringLongWait` 开启，会直接关闭模拟器；醒来后重新拉起并走登录流程。无线 ADB / SSH 远程设备会跳过这个优化。

## <DocIcon name="wrench" /> 失败与恢复

调度器把失败当作常态。异常按「恢复力度」分级：

| 异常 | 恢复动作 |
| --- | --- |
| 游戏未运行 | 重启游戏 |
| 游戏卡死 / 连点 | 重启游戏；连续达到阈值后重启模拟器 |
| 页面无法识别 | 先查服务器状态；可用则重启游戏，维护中则等待 |
| 模拟器离线 | 重启模拟器（永不放弃，只拉长间隔） |
| 代码异常（`ScriptError`） | 连续 3 次后退出进程 |
| 敏感任务失败 | 立即停止实例，保存现场并推送 |

只有四种情况会真正停止调度：

1. <DocIcon name="circle-x" /> `ScriptError` 连续 3 次（代码缺陷，重试无意义）。
2. <DocIcon name="warning" /> 敏感任务失败（避免在错误状态上继续写入）。
3. <DocIcon name="hand" /> 收到停止 / 更新信号。
4. <DocIcon name="circle-alert" /> 配置或设备初始化就失败。

其余故障都会自动恢复，最外层还有指数退避兜底（20 秒起步，300 秒封顶）。

### <DocIcon name="warning" /> 敏感任务

`Scheduler.Sensitive` 默认对以下任务开启：

- <DocIcon name="warning" /> `OpsiCrossMonth`（跨月每日）
- <DocIcon name="warning" /> `OpsiObscure`（隐秘海域）
- <DocIcon name="warning" /> `OpsiAbyssal`（深渊坐标）

这些环节出错时重启游戏可能造成奖励丢失或状态错乱，所以选择「停下来等人」。是否敏感是运行时读配置判断的，你可以按自己的风险偏好调整。

### <DocIcon name="refresh" /> 同一任务连续重启上限

`Error.TaskRestartLimit`（默认 3，0 = 不限制）限制同一任务连续恢复的次数。超过后：

1. <DocIcon name="clock" /> 把该任务的 `NextRun` 推到服务器次日零点。
2. <DocIcon name="megaphone" /> 发送错误推送与 WebUI 提醒（低推送量模式也保留）。
3. <DocIcon name="refresh" /> 其他任务继续调度。

任务成功一次即清零。`Restart` 本身豁免此限制，避免游戏没起来时整个队列连环失败。

## <DocIcon name="eye" /> 运行监护

长时间卡在一个任务里（剧情跳不过、寻路死循环）时，调度器自己发现不了，因为日志还在动。运行监护补上这一环：

| 配置 | 默认 | 作用 |
| --- | --- | --- |
| `Error.WatchdogEnable` | 关 | 总开关 |
| `Error.WatchdogTaskEnable` | 关 | 任务超时检测 |
| `Error.WatchdogTaskTimeout` | 120 分钟 | 超过即重启模拟器打断任务 |

监护线程每 30 秒检查一次，且只在任务执行期间激活——空闲等待不会被误判。

## <DocIcon name="badge-dollar" /> 石油自动控制

`General.OilControl.Enable` 默认关闭，`Target` 默认 24000（可设 1000–24999）。

开启后，在**原调度**模式下，石油超过控制线会临时插入清油流程：

- <DocIcon name="rocket" /> 先跑已到期的出击图；
- <DocIcon name="badge-dollar" /> 没有可跑的图时，调用后宅购粮；
- <DocIcon name="circle-check" /> 清理完成后恢复原本的业务顺序。

它不改写你的优先级配置，也不适用于「增强调度」与「完全接管」模式——那两种模式下由调度程序自己决定。

## <DocIcon name="refresh" /> 每日重启

`Alas.Restart.RandomDelay` 控制每日重启在服务器刷新后的随机延后，格式为单个数字或区间（如 `5, 50` 分钟），用于错开多客户端登录。填 `0` 关闭。

`Restart.ClearCache` 会在重启时删除游戏的外部缓存目录（`/sdcard/Android/data/<包名>/cache/`）。部分渠道服需要它来清理登录态。

## <DocIcon name="rocket" /> 下一步

<ul class="ap-linklist">
<li><a href="/azurpilot/user/tasks/">任务手册<span class="desc">每个玩法怎么配</span></a></li>
<li><a href="/azurpilot/user/multi-instance">多实例与配置管理<span class="desc">多开时的隔离</span></a></li>
<li><a href="/azurpilot/developer/scheduler">调度器生命周期<span class="desc">源码级细节</span></a></li>
</ul>
