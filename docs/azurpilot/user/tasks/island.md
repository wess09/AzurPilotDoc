---
title: 岛屿计划
description: 赤石计划（岛屿）17 个任务：季节设置、五家商店经营、农田牧场、制造、每日采集与珍珠交易。
updated: 2026-10-20
---

# 岛屿计划

岛屿（游戏内「赤石计划」，任务分组 `Island`）是一套独立的经营玩法：种田、养殖、采矿、开店、完成每日订单与周常。它与主线/大世界互不消耗石油，但操作界面完全不同，识别资源也是单独一套。

## <DocIcon name="clipboard" /> 前置条件

- 游戏内已解锁岛屿玩法。
- 当前赛季与 `IslandPlan.Season` 一致。赛季切换后，商店菜品与走位点可能变化。
- 部分任务要求控制方式为 `minitouch`、`MaaTouch`、`uiautomator2` 或 `azurpilot_android`，`ADB` 注入不支持拖拽类操作。

::: tip 先跑「全局配置」
`IslandPlan` 不是普通的挂机任务：它会把你勾选的走位路线在岛上各走一遍，用于**校验角色能否走到目标位置**。跑完（或没有勾选任何路线）后任务自动推迟到第二天。
:::

## <DocIcon name="settings" /> 全局配置（`IslandPlan`）

| 字段 | 说明 |
| --- | --- |
| `Season` | 当前赛季，影响商品与地图 |
| `IslandWalk.*` | 各角色的走位路线开关：空投、每日采集点、珍珠组装、珍珠港等 |
| `IslandWalk.*Enable` | 是否校验该路线 |

赛季更新后第一件事是重跑一次全局配置，确认所有勾选路线可达。

## <DocIcon name="box" /> 经营模块（`IslandBusiness`）

自动经营 5 家商店：有鱼餐馆、白熊饮品、乌鱼烤肉、啾啾简餐、啾咖啡。

| 字段 | 说明 |
| --- | --- |
| `BatchEnabled` | 分批经营（降低单次时长） |
| `Batch1Shops` / `Batch2Shops` | 两批各包含哪些商店 |
| `SeasonalReplaceEnabled` / `SeasonalThreshold` | 赛季菜品替换 |
| `IslandBusinessShop1..5` | 每家店的店员（`Char1/2`）与菜品（`Product1..5`） |
| `BoostReplaceFilter` | 加成替换策略 |

每家店的菜品按 1→8 的顺序生产，前一项满足后才执行下一项；运行后一项不会影响之前几项已达成的目标。这条规则对 `IslandGrill`、`IslandJuuEatery`、`IslandJuuCoffee` 同样适用。

## <DocIcon name="sparkles" /> 农田与果园（`IslandFarm`）

包含三块地：农田、果园、苗圃。

| 子组 | 关键字段 | 说明 |
| --- | --- | --- |
| `IslandFarm` | `Positions`、`WorkerFilter`、`MinFarm`、`PlantPotatoes` | 农田与工人 |
| `IslandOrchard` | `MinOrchard`、`IgnoreAvocado`、`PlantRubber`、`AmagiChanRubber` | 果园与橡胶 |
| `IslandNursery` | `MinNursery`、`IgnorePineapple`、`PlantLavender` | 苗圃与薰衣草 |

`Min*` 是保留数量下限，低于它才补种。`Positions` 决定走位点，通常保持默认。

## <DocIcon name="circle-check" /> 牧场（`IslandRancher`）

自动喂养与收取畜产品。需要先解锁对应栏位，并保证饲料充足。

## <DocIcon name="drive" /> 矿山林场（`IslandMineForest`）

自动采矿与伐木。工具耐久耗尽时会停止，需在游戏内补充。

## <DocIcon name="wrench" /> 制造业（`IslandManufacture`）

| 项 | 说明 |
| --- | --- |
| 用途 | 按配方生产中级/高级材料 |
| 前置 | 配方已解锁，原料充足 |
| 关键配置 | 生产队列与目标数量 |
| 验证 | 制造队列出现任务；仓库材料增加 |
| 限制 | 原料不足会空转，建议与农田/牧场一起跑 |

## <DocIcon name="calendar" /> 每日采集（`IslandDailyGather`）

通过管理界面的采集页签，用 UI 模拟完成每日采集。

- 执行时间：**凌晨 3:10** 与 **下午 18:00**。
- 流程：选择采集目标 → 切换开关 → 分配角色 → 出发。
- 走位相关操作要求非 ADB 控制方式。

## <DocIcon name="gift" /> 每日补给（`IslandAirDrop`）

收取本岛空中补给，并可拜访其他玩家岛屿拿补给。

- 移动仅支持 `minitouch` / `MaaTouch` / `uiautomator2` / `azurpilot_android`。
- 拜访他人岛屿会受好友列表与次数限制。

## <DocIcon name="package" /> 货物筹备（`IslandCargoPreparation`）

自动处理岛屿货运委托：

1. 领取已完成的货运奖励。
2. 避开牛奶等黑名单货物。
3. 进入更换页面，确认默认选中的第一个委托。
4. 装载可提交的货物。

## <DocIcon name="scroll" /> 每日订单（`IslandDailyOrder`）

从岛屿手机页面进入每日订单，自动检测订单类型（紧急 / 挑战 / 轻松），按物品条件交付或驳回。

::: warning 不支持「标准」订单
「标准」类型订单不会被处理。若当天全是标准订单，任务会跳过。
:::

## <DocIcon name="clipboard" /> 每日/周任务（`IslandDailyInteract`）

处理四类交互：

- 摸猫
- JUU 速运
- 商区外送服务
- 每周照相任务

移动同样要求非 ADB 控制方式。相关按钮资源生成后才能启用。

## <DocIcon name="badge-dollar" /> 每周珍珠采购与售卖（`IslandPearlSell`）

每周二 **01:00** 自动处理珍珠：先采购本周珍珠，再售卖已有珍珠。

| 字段 | 说明 |
| --- | --- |
| `BuyPrice` / `SellPrice` | 价格阈值 |
| `BuyNextRun` / `NextPearlTradeTime` | 下次交易时间（自动维护） |
| `DailyPriceRefresh` | 每日价格刷新 |

::: danger 金币下限
采购前金币必须足够买 200×220 个珍珠，这是最低要求。金币不足时任务可能报错。跑之前确认金币充足。
:::

## <DocIcon name="lightbulb" /> 推荐启用顺序

```text
1. IslandPlan        （校验走位，跑一次）
2. IslandFarm        （农田/果园/苗圃）
3. IslandRancher     （牧场）
4. IslandMineForest  （矿山林场）
5. IslandManufacture （制造）
6. IslandBusiness    （五家店）
7. IslandDailyGather / IslandAirDrop / IslandDailyOrder / IslandDailyInteract
8. IslandCargoPreparation / IslandPearlSell
```

先解决原料，再跑制造与商店，最后才是每日交互类任务。

## <DocIcon name="message" /> 常见问题

| 现象 | 原因 |
| --- | --- |
| 角色走不到目标点 | 走位点过期，重跑 `IslandPlan` 校验 |
| 商店不开门 | 当前赛季与 `Season` 不匹配 |
| 采集任务不动 | 控制方式是 `ADB`，不支持拖拽 |
| 珍珠任务报错 | 金币不足 200×220 |
| 订单全部跳过 | 当天只有「标准」类型订单 |
| 作物不补种 | `Min*` 设得过高，或工人未分配 |
