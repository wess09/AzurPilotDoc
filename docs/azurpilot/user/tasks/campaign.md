---
title: 出击与活动
description: 主线图、紧急委托、三油低耗、活动图、共斗、作战档案与每日图的配置方法、前置条件与验证方式。
updated: 2026-10-20
---

# 出击与活动

出击类任务消耗石油，也是收益波动最大的一类。配置前先明确三件事：**打哪张图、打到什么条件停、用哪支舰队**。

## <DocIcon name="clipboard" /> 通用结构

所有出击任务共享三个参数组：

| 组 | 关键字段 | 作用 |
| --- | --- | --- |
| `Campaign` | `Name`、`Mode`、`UseAutoSearch`、`Use2xBook`、`AmbushEvade` | 关卡、难度、自律、双倍书、避伏击 |
| `StopCondition` | `OilLimit`、`CoinLimit`、`RunCount`、`MapAchievement` | 什么时候停 |
| `Fleet` | `Fleet1`、`Fleet1Formation`、`FleetOrder` | 舰队与阵型 |

停止条件的实际语义：石油低于 `max(OilLimitHardFloor, OilLimit)` 时停止，硬下限默认 500，防止把油打空后无法做日常。

::: tip 先手动打一遍
新图、活动图第一次跑之前，先手动通关并解锁自律寻敌。脚本的「开荒」能力依赖地图识别，遇到新机制（传送门、机关、特殊 boss）经常需要人工先走一遍。
:::

## <DocIcon name="target" /> 主线图 1 / 2 / 3

同一条主线可以配置三套独立任务，用于「不同图、不同舰队、不同停止条件」的组合。

| 项 | 说明 |
| --- | --- |
| 用途 | 刷经验、刷装备图纸、刷物资、练船 |
| 前置 | 关卡已解锁；任务提示需要至少 4 支编队（可开「跳过编队检测」临时绕过） |
| 关键配置 | `Campaign.Name` 填关卡（如 `12-4`）、`Mode` 选 `normal`、`UseAutoSearch` 开 |
| 推荐 | 12-4 练级：`UseAutoSearch=true`、`AmbushEvade=true`、`StopCondition.OilLimit=1000` |
| 验证 | 日志出现「进入关卡 → 自律寻敌 → 结算」，物资/经验增长 |
| 常见问题 | 卡在「寻找敌人」多为地图未识别，换 `UseClearMode` 或手动清一次 |

`DefeatWithdraw` 控制战败后的行为：`withdraw_stop`（撤退并停止）、`switch_fleet`（换队继续）、`withdraw_continue`（撤退后继续打）。

## <DocIcon name="zap" /> 紧急委托（`GemsFarming`）

| 项 | 说明 |
| --- | --- |
| 用途 | 在特定图上刷紧急委托（钻石委托），兼顾练级 |
| 前置 | 关卡已解锁，舰队满足油耗要求 |
| 关键配置 | `GemsFarming.Fleet1`、`Campaign.Name`、`StopCondition` |
| 限制 | **与三油低耗互斥**，只能开一个 |
| 验证 | 日志出现委托检测与撤退；委托列表出现紧急委托 |

## <DocIcon name="badge-dollar" /> 三油低耗（`ThreeOilLowCost`）

用 3 油阵容反复刷低耗图，旗舰达到 32 级后自动更换旗舰并退役。

| 项 | 说明 |
| --- | --- |
| 用途 | 极限省油刷图，适合长期积累 |
| 前置 | 有可用的低耗阵容；退役设置已按[一键退役](/guide/requirements#一键退役)配好 |
| 关键配置 | `Campaign.Name`（通常 1-1 或低耗图）、`StopCondition.RunCount` |
| 限制 | 与紧急委托互斥；需要正确的退役策略，否则会误退 |
| 验证 | 油耗增长极慢；退役记录出现 32 级旗舰 |

## <DocIcon name="shield" /> 1-1 刷伏击（`Ambush11`）

在 1-1 不打 boss，反复触发伏击获取物资，支持按紧急委托流程自动换船。

::: warning 实验性
任务名带「尚不完善」标记。收益依赖伏击触发概率，行为可能随版本变化。不要作为主力收益手段。
:::

## <DocIcon name="star" /> 活动图 1 / 2 / 3

| 项 | 说明 |
| --- | --- |
| 用途 | 刷活动图（PT、活动装备、限定掉落） |
| 前置 | 活动已开启；普通难度通常需要先通关 |
| 关键配置 | `Campaign.Event` 选活动、`Campaign.Name` 选关卡、`StopCondition` 设 PT 或次数 |
| 推荐 | 先 `RunCount=1` 验证能进图，再放开次数 |
| 验证 | 活动 PT 增长；日志显示正确的关卡名 |
| 限制 | 共斗类活动有独立页面（`Raid`），不要用活动图任务硬跑 |

三个槽位的意义是「同时安排三张不同的图」，例如：活动图刷 PT、主线图练级、另一张活动图刷掉落。它们各自独立调度。

## <DocIcon name="megaphone" /> 共斗活动（`Raid` / `RaidScuttle`）

| 任务 | 用途 | 注意 |
| --- | --- | --- |
| `Raid` | 共斗活动正常出击 | 需要活动已解锁，boss 血量共享 |
| `RaidScuttle` | 共斗沉船（送船） | 通过沉船刷好感/次数，配置更激进 |

共斗的「沉船」不是失败，而是一种策略：让低价值舰队被击沉以快速结束战斗。使用前确认你理解活动规则。

## <DocIcon name="sparkles" /> 活动专属任务

| 任务 | 活动 | 说明 |
| --- | --- | --- |
| `Hospital` | 深谷来信 | 活动专属流程，机制与其他活动不同 |
| `Coalition` | 夜勤病栋 | 联盟活动 |
| `CoalitionScuttle` | 联盟沉船 | 舰队被击沉后刷好感，建议多队出击、第一队就沉 |
| `MaritimeEscort` | 商路护航 | 护送类活动，节奏与普通出击不同 |
| `EventShop` | 活动商店 | 按优先级兑换活动商店 |
| `CoalitionSp` | 怪谈纪实：逃离白夜山庄 SP | 特定活动的 SP 图 |

这些任务只在对应活动期间有意义。活动结束后即使启用也不会运行（找不到入口会报错或跳过）。是否保留取决于版本，以 `task.yaml` 为准。

## <DocIcon name="file" /> 作战档案（`WarArchives`）

| 项 | 说明 |
| --- | --- |
| 用途 | 刷已归档活动的每日次数与掉落 |
| 前置 | 档案已解锁 |
| 关键配置 | `WarArchives.DailyRunCount`、`AutoClear`、`AutoClearTarget` |
| 限制 | **缺少维护**，开荒功能不一定可用。建议手动完成开荒后再用自律寻敌 |
| 验证 | 档案每日次数减少；掉落进入统计 |

## <DocIcon name="calendar" /> 每日图 A / B / C / D / SP

| 任务 | 对应 | 说明 |
| --- | --- | --- |
| `EventA` ~ `EventD` | 每日 A/B/C/D 图 | 通常只打一次拿每日奖励 |
| `EventSp` | 每日 SP 图 | 需要通关前置，油耗较高 |
| `RaidDaily` | 共斗每日 | 共斗活动的每日次数 |

这些任务的 `Scheduler.ServerUpdate` 很重要：每日次数在服务器刷新点重置，任务应排在刷新后运行。默认 `00:00`，跨时区时按服务器时间调整。

## <DocIcon name="refresh" /> 活动适配的季节性

活动图的地图与机制每月变化，`campaign/` 下是 Python 地图定义，不是通用 YAML。新活动适配需要开发者提交地图与战斗逻辑。因此：

- 活动刚开时，脚本可能还不支持，关注仓库更新。
- 支持后也可能因机制变化失效，优先看日志里的页面识别失败。
- 不要用旧活动的配置硬套新活动。

## <DocIcon name="hand" /> 停止条件怎么选

| 目标 | 配置 |
| --- | --- |
| 刷够次数就停 | `RunCount = N` |
| 油低于阈值停 | `OilLimit`（配合硬下限 500） |
| 物资达到目标停 | `CoinLimit` |
| 刷到 100% 通关 | `MapAchievement = 100_percent_clear` |
| 刷到三星 | `MapAchievement = map_3_stars` |
| 练到指定等级 | `ReachLevel` |
| 捞到新船就停 | `GetNewShip = true` |

`StageIncrease` 开启后，达成条件会自动推进到下一关，用于连续推图。

## <DocIcon name="wrench" /> 验证与排查

跑完一轮后检查：

1. 日志是否出现完整的「进图 → 战斗 → 结算 → 撤退/继续」。
2. 统计页的出击次数与油耗是否增加。
3. 游戏内关卡进度、PT、物资是否符合预期。

常见失败：

| 现象 | 原因 |
| --- | --- |
| 一直停在关卡选择 | 关卡名不在当前活动/主线列表 |
| 进图后不动 | 自律未解锁，或 `UseAutoSearch` 关了但脚本不会手动寻路 |
| 反复撤退 | 舰队强度不足，`DefeatWithdraw` 触发 |
| 油耗异常高 | 舰队配置与预期不符，检查 `Fleet1` 与潜艇设置 |
| 活动图识别失败 | 活动资源未更新，更新核心程序 |
