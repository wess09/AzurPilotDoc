---
title: 日常与资源
description: 委托、科研、后宅、指挥喵、大舰队、每日任务、演习、商店与研发船坞的配置要点与奖励领取逻辑。
updated: 2026-10-31
---

# 日常与资源

日常类任务的特点是：单个耗时短、失败代价低、但漏做会持续损失收益。建议全部启用，并按服务器刷新时间排期。

## <DocIcon name="gift" /> 一键收获（`Reward`）

把主界面上所有可领的东西点一遍。

| 字段 | 说明 |
| --- | --- |
| `CollectOil` | 领取石油 |
| `CollectCoin` | 领取物资 |
| `CollectExp` | 领取经验 |
| `CollectMission` | 领取任务奖励 |
| `CollectWeeklyMission` | 领取周常奖励 |

推荐全开。它是所有任务里最安全的一个，适合作为安装后的第一次验证。

## <DocIcon name="scroll" /> 委托（`Commission`）

| 项 | 说明 |
| --- | --- |
| 用途 | 自动派遣、收取委托，优先高价值委托 |
| 前置 | 委托栏位已解锁（随等级） |
| 关键配置 | `PresetFilter`（预设策略）、`DynamicProgramming`（动态规划选委托）、`DoMajorCommission`（是否做大型委托） |
| 高级 | `TierValueRatio`、`DelayHalfLife`、`DeadlineFutureHorizon` 控制收益/时间权衡 |
| 通知 | `CommissionNotifyReward`、`DetectShipDrop`、`GemNotify` 可推送稀有奖励与钻石委托 |
| 验证 | 委托列表出现新派遣；日志有「收取 / 派遣」记录 |

`NoFreeShipPolicy` 与 `AutoPickShip` 控制船坞满时的处理策略。船坞吃紧时务必配置，否则会因为无法接收舰船而卡住。时长过滤算法对小数时长保留有效位（如 `0.5h`），避免黑名单规则误屏蔽半小时魔方委托。

## <DocIcon name="flask" /> 科研（`Research`）

| 项 | 说明 |
| --- | --- |
| 用途 | 选择科研项目、收取、开始下一项 |
| 前置 | 科研系统已解锁；至少有一个可用队列 |
| 关键配置 | `UseCube`（是否用魔方加速）、`UseCoin`（是否用物资）、`UsePart`（是否用部件） |
| 项目选择 | `PresetFilter` 选预设（如「舰装解析优先」），`CustomFilter` 自定义 |
| 延迟 | `AllowDelay` 允许为了等更好的项目而空转 |
| 验证 | 科研队列有进行中的项目；日志显示项目名与剩余时间 |

::: tip 钻石不要随便开
`UseCube` 使用魔方（快速完成），不是钻石。真正花钻石的加速在游戏内需要手动确认，脚本不会自动花钻石。
:::

## <DocIcon name="brain" /> 战术学院（`Tactical`）

| 字段 | 说明 |
| --- | --- |
| `TacticalFilter` | 选择要训练的技能 |
| `RapidTrainingSlot` | 是否使用快速训练位 |
| `SkillAutoSwitch` | 技能满级后自动换下一个 |
| `ControlExpOverflow` | 控制经验溢出（可分别允许 T4/T3/T2/T1 教材） |
| `AddNewStudent` | 自动补充学员，`MinLevel` / `MaxLevel` 限定范围 |

## <DocIcon name="sparkles" /> 后宅（`Dorm`）

| 字段 | 说明 |
| --- | --- |
| `Collect` | 收取后宅物资与经验 |
| `Feed` | 补充食物 |
| `FeedFilter` | 选择食物优先级 |
| `ReserveFood` | 保留食物数量 |
| `BuyFood` | 食物不足时购买 |
| `BuyFurniture.Enable` | 自动购买家具（可选） |

食物耗尽会导致后宅经验停摆，`ReserveFood` 不要设得过高。

### 后宅日常与「换船休息」联动的职责区分

后宅日常任务（`Dorm`）负责定期的日常喂粮、收取经验与物资，按独立调度周期运行；而智能换船联动中的「换船休息」（`FleetInfo.FleetDorm`）属于出战前换船与换装流程的一部分，**不作为独立日常任务排期**。

- **换船休息触发与楼层**：整轮实际换船及换装全部完成后，由 `module/dorm/fleet_rotation.py` 从本轮已完成换船的出战舰队中按「全队出击 > 道中队 > Boss 队」的优先级选择一队进入后宅。`FleetDorm.Floor` 可选 `floor_1`（一楼训练）或 `floor_2`（二楼休息）。没有实际换船或未开启开关时不会进入后宅。
- **选船与清空机制**：进入后宅后，先逐艘取消所选楼层的原有选中；随后分别筛选先锋与主力，按当前实际舰队编号徽标选齐整队（包括保留固定舰位的未更换舰船）。
- **逐排拖动与画面稳定确认**：后宅选船列表每次仅拖动一排。支持按住拖动的控制后端（`minitouch`、`MaaTouch`、`uiautomator2`、`scrcpy`、`nemu_ipc`）在松手前保持触点 0.4 秒以抑制惯性，其余后端使用慢滑；每次拖动后通过区域像素均值比对确认列表实际发生位移，并等待 0.3 秒画面稳定后再进行模板识别，避免因滚动条抖动或惯性翻过目标舰船；检查范围严格限制在前五排（最多三次逐排拖动），前五排未选齐则终止并跳过本次后宅安排，不再深入翻找普通船坞。
- **数量校验与防重复**：每次点击舰船卡片均核验已选数量变化，翻页重叠区域已选舰船不会重复点击；选齐后确认并退出后宅，继续原出击任务。
- **安全回退保护**：若后宅栏位不足、楼层未解锁、弹出移出另一楼层的提示或选船状态无法确认，程序会主动点击取消、退出后宅并跳过本次后宅安排，保留已生效的换船与换装结果继续原出击任务；不会自动扩建栏位或确认移出提示。

## <DocIcon name="crown" /> 指挥喵（`Meowfficer`）

| 字段 | 说明 |
| --- | --- |
| `BuyAmount` | 购买指挥喵箱子的数量 |
| `FortChoreMeowfficer` | 要塞任务使用的指挥喵 |
| `MeowfficerTrain.Enable` | 自动训练 |
| `MeowfficerTrain.Mode` | 训练策略 |
| `ScoreTalents` / `ScoreThreshold` | 按天赋评分，低于阈值不保留 |
| `MaxFeedLevel` | 喂养上限 |

「工具 → 指挥喵评分」可以单独识别天赋并按公开攻略口径打分，用于人工核对。

## <DocIcon name="handshake" /> 大舰队（`Guild`）

| 字段 | 说明 |
| --- | --- |
| `GuildLogistics.Enable` | 自动接取 / 提交后勤任务 |
| `GuildLogistics.SelectNewMission` | 自动选择新任务 |
| `GuildOperation.Enable` | 参与大舰队作战 |
| `GuildOperation.AttackBoss` | 是否攻击 boss |
| `JoinThreshold` | 加入作战的最低人数阈值 |

不在大舰队、或没有权限时，关掉这两个子开关。

## <DocIcon name="zap" /> 认知觉醒（`Awaken`）

| 字段 | 说明 |
| --- | --- |
| `LevelCap` | 觉醒的目标等级上限 |
| `Favourite` | 优先觉醒的舰船 |

消耗认知觉醒材料，把满级舰船继续提升。材料不足时会跳过。

## <DocIcon name="user-check" /> 秘书舰（`Secretary`）

自动检测秘书舰好感度，达到设定值后更换。

| 字段 | 说明 |
| --- | --- |
| `CustomFilter` | 候选舰船 |
| `LowFavorabilityPriority` | 优先选择低好感舰船 |
| `FavouriteOnly` | 只在收藏中选 |
| `CheckInterval` | 检查间隔 |
| `BackupEnable` | 保留原秘书舰作为备份 |

## <DocIcon name="target" /> 作战委托（`OperationHandover`）

消耗作战委托书自动进行作战委托。除主线关卡（如 `12-4`）外，现已支持活动关卡委托（如 `D3`、`T6`、`SP3`）：当 `Campaign.Name` 为活动关卡时，自动读取 `Campaign.Event` 对应活动并复用关卡别名与难度确认逻辑；关卡是否支持委托以游戏内入口为准。

| 字段 | 说明 |
| --- | --- |
| `Count` | 每次执行的数量 |
| `UseHandoverBook` | 是否使用委托书 |
| `ConsumeAllBook` | 一键消耗全部，`ConsumeAllBookWeekday` / `Time` 控制时点 |
| `OilLimit` | 石油下限 |

## <DocIcon name="package" /> 仓库统计（`StorageStatistics`）

读取材料仓库中的金色/彩色指定物品，完整单遍扫描并同页核对后更新统计。

- 默认关闭，启用后默认每 7 天执行一次，也可手动运行。
- **不消耗物品**，只读取。
- 仅支持已验证的国服模板。

## <DocIcon name="calendar" /> 每日任务（`Daily`）

| 字段 | 说明 |
| --- | --- |
| `UseDailySkip` | 使用每日任务跳过券 |
| `EscortMission` / `EscortMissionFleet` | 商路护航及舰队 |
| `AdvanceMission` / `AdvanceMissionFleet` | 前进任务及舰队 |
| `FierceAssault` / `FierceAssaultFleet` | 猛攻任务及舰队 |
| `TacticalTraining` / `TacticalTrainingFleet` | 战术训练及舰队 |
| `SupplyLineDisruption` | 破交任务 |
| `ModuleDevelopment` / `EmergencyModuleDevelopment` | 模块开发及紧急开发 |

每日任务的子项与游戏内「每日任务」列表对应。某个子项反复失败时，先手动完成该类型，确认舰队与关卡可用。

## <DocIcon name="circle-alert" /> 困难图（`Hard`）

| 字段 | 说明 |
| --- | --- |
| `HardStage` | 困难关卡 |
| `HardFleet` | 出击舰队 |

每天有次数限制，通常在服务器刷新后运行。航母/战列限制随关卡变化，配置前确认舰队符合要求。

## <DocIcon name="medal" /> 演习（`Exercise`）

| 字段 | 说明 |
| --- | --- |
| `OpponentChooseMode` | 对手选择策略 |
| `OpponentTrial` | 是否先试打 |
| `ExerciseStrategy` | 进攻策略 |
| `DelayUntilHoursBeforeNextUpdate` | 在刷新前若干小时再打，避开强敌 |
| `LowHpThreshold` | 低血量判定 |

演习失败也会消耗次数，策略保守一点更稳。

### 演习战前／战后装备方案

演习任务新增 `Equipment.Enable`、`Equipment.ClearBeforeApply` 与 YAML 文本 `Equipment.Config`，可按 `flagship`、`up`、`down`、`head`、`middle`、`tail` 六个站位分别配置 `before`（首次出击前）和 `after`（任务结束后）的装备码。默认**关闭**；仅支持可输入装备码的控制方式。

`ClearBeforeApply` 开启时会先卸下目标舰船装备再应用配装码。**设置了 `before` 但 `after` 留空的站位，任务结束时会被卸装，而不是自动恢复原装备**。如果换装失败、恢复入口不可用或进程中断，仍可能需要人工恢复；建议先用非关键编队验证。此功能不适用于 META 档案的独立编队，META 信标和支援的处理见[大型作战](/azurpilot/user/tasks/opsi)。


## <DocIcon name="trophy" /> 限界挑战（`LimitChallenge`）

每月依次挑战至目标难度，每个难度最多出击一次；战败后等待下月。

| 字段 | 说明 |
| --- | --- |
| `TargetLevel` | 目标难度 |
| `Month` / `CompletedLevel` / `AttemptedLevel` / `Failed` | 进度状态（自动维护） |

需要先在游戏内配置限界挑战舰队。当前使用国服识别资源。

## <DocIcon name="badge-dollar" /> 商店

### <DocIcon name="badge-dollar" /> 军火商商店（`ShopFrequent`）

| 字段 | 说明 |
| --- | --- |
| `Enable` | 启用 |
| `UseGems` | 是否用钻石购买 |
| `Refresh` | 是否刷新 |
| `BuySkinBox` | 购买皮肤箱 |
| `ConsumeCoins` | 消耗物资 |
| `Filter` | 购买优先级 |

### <DocIcon name="box" /> 其他商店（`ShopOnce`）

包含大舰队商店、勋章商店、功勋商店、核心商店等，分别有独立开关与过滤：

```text
GuildShop / MedalShop2 / MeritShop / CoreShop
```

`BuyUnobtainedShip` 只买未获得的舰船，适合补齐图鉴。

### <DocIcon name="wrench" /> 研发船坞（`Shipyard`）

| 字段 | 说明 |
| --- | --- |
| `ResearchSeries` | 研发系列（PR1–PR3 等） |
| `ShipIndex` | 目标舰船 |
| `BuyAmount` | 购买数量 |

## <DocIcon name="circle-plus" /> 每日抽卡（`Gacha`）

| 字段 | 说明 |
| --- | --- |
| `Pool` | 卡池 |
| `Amount` | 抽数 |
| `UseTicket` / `TicketAmount` | 使用抽卡券 |
| `ClearTicket` / `ClearTicketTime` | 清空券的时点 |
| `UseDrill` | 使用演习相关道具 |

每日一发通常只花 1 个魔方，适合做任务。

## <DocIcon name="circle-dollar" /> 白嫖奖励（`Freebies`）

| 子项 | 内容 |
| --- | --- |
| `BattlePass.Collect` | 通行证奖励 |
| `DataKey.Collect` | 数据钥匙 |
| `Mail.*` | 邮件领取与清理（`ClaimMerit`、`ClaimMaintenance`、`ClaimTradeLicense`、`DeleteCollected`） |
| `SupplyPack.Collect` / `DayOfWeek` | 补给包 |

## <DocIcon name="video" /> 小游戏（`Minigame`）

游戏币不会溢出时自动领取；有游戏币且奖励没满时自动玩小游戏。没有额外配置。

## <DocIcon name="sparkles" /> 宿舍计划（`PrivateQuarters`）

| 字段 | 说明 |
| --- | --- |
| `BuyRoses` / `BuyCake` | 购买玫瑰 / 蛋糕 |
| `TargetInteract` / `TargetShip` | 互动目标与舰船 |

`TargetShip` 可选安克雷奇（`anchorage`）、能代（`noshiro`）、天狼星（`sirius`）、新泽西（`new_jersey`）、大凤（`taihou`）、埃吉尔（`aegir`）、纳希莫夫（`nakhimov`）、怨仇（`implacable`）。

游戏内宿舍计划每日互动与购买刷新时间为**凌晨 03:00**（`Scheduler.ServerUpdate: 03:00`，系统预设，不建议跨日手动提前运行）。

## <DocIcon name="lightbulb" /> 推荐组合

```text
Reward → Commission → Research → Dorm → Meowfficer → Guild
      → Daily → Hard → Exercise → ShopFrequent → ShopOnce → Freebies
```

顺序不是硬性的，但把「收取类」放在前面能减少重复进入界面的次数。所有任务都受 `Scheduler.ServerUpdate` 影响，跨时区部署时改成服务器刷新时间。
