---
title: 大型作战
description: 大世界 19 个任务的用途、行动力与黄币机制、智能调度的决策逻辑、每月开荒与跨月注意事项。
updated: 2026-10-20
---

# 大型作战

大世界（Operation Siren）是配置复杂度最高的模块：它有自己的资源系统（行动力、黄币、紫币）、每月重置周期、特殊海域类型，以及一个会**代理其他任务**的智能调度器。

## <DocIcon name="badge-dollar" /> 先理解资源

| 资源 | 符号 | 来源 | 约束 |
| --- | --- | --- | --- |
| 行动力 | AP / `P` / `C` | 自然恢复（约 600 秒 1 点，上限 200）、港口购买、箱子 | 溢出即浪费 |
| 黄币 | `Y` | 海域掉落、任务 | 补币任务的目标 |
| 紫币 | — | 隐秘海域、深渊 | 商店兑换 |

`P` 是「可用于决策的总行动力」：开箱开启时包含箱内行动力，关闭时只算当前行动力 `C`。仪表盘显示的总量始终包含箱子，两者的口径不同。

保留值：

| 符号 | 配置 | 含义 |
| --- | --- | --- |
| `K` | `OpsiScheduling.OperationCoinsPreserve` | 黄币保留线 |
| `R` | `OpsiScheduling.OperationCoinsReturnThreshold` | 补币回补增量（负数按 0） |
| `B` | `OpsiScheduling.ActionPointPreserve` | 补币时的行动力保留线，0 时回退到耄耋相接的配置 |
| `L` | `OpsiHazard1Leveling.MinimumActionPointReserve` | 侵蚀 1 练级的保留线（默认 200） |
| `M` | 月末清理保留线 | `max(月末保留, 跨月任务启用时的 200)` |

## <DocIcon name="brain" /> 智能调度（`OpsiScheduling`）

智能调度不是「一个任务」，而是一个决策循环。它接管以下子任务：

- 侵蚀 1 练级
- 耄耋相接
- 隐秘海域
- 深渊坐标
- 塞壬要塞

接管后，子任务的**具体设置仍来自各自页面**，智能调度只决定「什么时候跑哪个」。

### <DocIcon name="scale" /> 两种模式

| 模式 | 触发 | 行为 |
| --- | --- | --- |
| 黄币目标 | `Y < K`，或上一轮已在补币 | 代理补币任务直到 `Y ≥ K + R`，然后回侵蚀 1 |
| 行动力调度 | 未开启黄币目标 | 按 `P` 与 `L` 决定是否练级、是否购买行动力 |

### <DocIcon name="compass" /> 决策顺序

```text
每月开荒未完成 → 延后到服务器刷新
  ↓
读取 Y / P / C
  ↓
港口行动力续购（本月未完成时）
  ↓
P ≤ L → 尝试购买
  ↓
月末清理窗口 → 优先清理
  ↓
智能开荒接管 → 执行开荒节点
  ↓
黄币 / 行动力调度
```

::: warning 不要同时开智能调度和子任务
同时启用智能调度与它接管的子任务，会出现两个任务抢同一个海域的情况。要么让智能调度接管，要么单独跑子任务。
:::

## <DocIcon name="map" /> 每月开荒（`OpsiExplore`）

| 项 | 说明 |
| --- | --- |
| 用途 | 每月重置后推进海域到 100%，解锁港口与后续玩法 |
| 前置 | 大世界主线已通关 |
| 关键配置 | `OpsiExplore` 的路线与海域顺序、`ActionPointPreserve` |
| 验证 | 海域完成度上升；日志出现逐海域进入与事件处理 |
| 限制 | 开荒期间不要手动操作游戏 |

### <DocIcon name="refresh" /> 事件补扫（`OpsiExploreCleanup`）

达到 100% 后，按原顺序重新进入普通海域（不进安全海域），全图识别并逐队扫描雷达，处理遗漏事件与事件生成的敌人。

它使用独立的月度断点，每张图退出成功后保存，本月完成后不重复。开荒未完成时会提示先跑开荒。

## <DocIcon name="calendar" /> 每日与商店

| 任务 | 说明 |
| --- | --- |
| `OpsiDaily` | 大世界每日任务，按服务器刷新排期 |
| `OpsiShop` | 大世界商店（黄币/紫币兑换） |
| `OpsiVoucher` | 白票商店 |
| `OpsiAshBeacon` | META 作战（余烬信标） |
| `OpsiAshAssist` | META 支援 |

商店类任务的兑换优先级在 `Filter` 中配置。紫币有限，优先换限定物品。

## <DocIcon name="target" /> 隐秘、深渊、要塞

| 任务 | 用途 | 重置 |
| --- | --- | --- |
| `OpsiObscure` | 隐秘海域，产出紫币与装备 | 每月 |
| `OpsiAbyssal` | 深渊坐标，高价值掉落 | 每月 |
| `OpsiStronghold` | 塞壬要塞，需要多次进攻 | 每月 |
| `OpsiArchive` | 档案坐标，不消耗行动力 | 每月 |
| `OpsiMonthBoss` | 月度 Boss | 每月 |

::: danger 三个敏感任务
`OpsiObscure`、`OpsiAbyssal`、`OpsiCrossMonth` 默认开启 `Scheduler.Sensitive`。出错时实例会停止而不是重启游戏，避免奖励丢失或坐标错乱。除非你确认风险，不要关闭。
:::

`OpsiArchive` 的前置条件较硬：

- 通关大世界主线并完成模拟战 + 塞壬试验场；
- 启用每月开荒，或使用战役信息记录仪（5000 油道具）。

## <DocIcon name="circle-alert" /> 耄耋相接与侵蚀 1

| 任务 | 用途 | 关键配置 |
| --- | --- | --- |
| `OpsiMeowfficerFarming` | 耄耋相接（猫 farming） | `ActionPointPreserve`、海域与队伍 |
| `OpsiHazard1Leveling` | 侵蚀 1 练级 | `MinimumActionPointReserve`、练级队伍、停止条件 |

侵蚀 1 是长期练级的核心：低消耗、可循环、可被智能调度代理。它的配置项较多，默认值适用于大多数情况；不理解机制时不要随意改。

::: warning 侵蚀 1 的配置风险
任务说明原文是「配置前请确保你已了解侵蚀 1 的基础原理，后果自负」。改保留线与队伍前，先跑一轮观察行动力收支。
:::

## <DocIcon name="refresh" /> 跨月每日（`OpsiCrossMonth`）

在大世界跨月重置前 10 分钟进入，等待重置但不退出，然后完成新一天的每日、隐秘、深渊与耄耋相接，以获取额外金菜。

- 运行期间**不要操作游戏**。
- 默认敏感任务，出错即停。
- 按「大世界每日」等同名任务的设置执行。

## <DocIcon name="circle-dollar" /> 防止行动力溢出（`OpsiPreventActionPointOverflow`）

当前行动力达到上限时执行大世界任务消耗行动力。

- 非必要不开启。
- 适合「大世界坠机」或长期刷委托、不常进大世界的情况。
- 它可以直接代理一轮智能调度，不要求智能调度自身开关开启。

## <DocIcon name="video" /> 大世界模拟器（`OpsiSimulator`）

用蒙特卡洛方法估算当前状态下持续侵蚀循环一段时间后的结果。

- **不影响 AzurPilot 正常运行**，是独立工具。
- 参数取自配置与统计，配置不准结果就没意义。
- 目前为 Alpha，结果参考价值有限。

## <DocIcon name="lightbulb" /> 推荐起步配置

```text
OpsiDaily           启用
OpsiShop            启用
OpsiExplore         月初启用，100% 后关闭
OpsiScheduling      开荒完成后启用
OpsiHazard1Leveling 交给智能调度接管
OpsiCrossMonth      月末前确认已配置
```

先跑「大世界每日」验证基础导航，再跑开荒，最后才开智能调度。

## <DocIcon name="message" /> 常见问题

| 现象 | 原因 |
| --- | --- |
| 卡在球面图 | 区域名与资源不匹配，更新核心程序 |
| 行动力见底后不动 | `P ≤ L` 且无法购买，属预期行为 |
| 黄币一直补不满 | 补币任务失败或保留值 `K + R` 设得过高 |
| 开荒进度不保存 | 海域未正常退出，断点只在成功退出后写入 |
| 智能调度不接管 | 任务开关未开，或每月开荒尚未完成 |
| 跨月任务中断 | 敏感任务触发停止，检查日志中的具体异常 |

源码级细节见[大世界导航](/azurpilot/developer/device-vision#大世界导航)与 [OSMap 结构](/azurpilot/developer/architecture#分层与边界)。
