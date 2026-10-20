---
title: 辅助工具任务
description: 系统设置、退役与强化、情绪管理、日志与掉落记录，以及扫描、基准测试、半自动等工具类任务。
updated: 2026-10-20
---

# 辅助工具任务

「工具」分组里的任务不产出资源，它们负责扫描、测试、半自动操作，或者修改系统级行为。系统设置（`Alas`、`General`、`Restart`）也放在这一页，因为它们同样不属于某个具体玩法。

## <DocIcon name="settings" /> 系统设置（`Alas`）

### <DocIcon name="monitor" /> 模拟器与错误

| 组 | 关键字段 | 作用 |
| --- | --- | --- |
| `Emulator` | `Serial`、`PackageName`、`ScreenshotMethod`、`ControlMethod` | 设备连接，详见[连接模拟器](/azurpilot/user/device) |
| `Error` | `HandleError`、`StrictRestart`、`TaskRestartLimit`、`LowPushMode` | 异常处理与推送 |
| `Optimization` | `OcrDevice`、`ScreenshotInterval`、`TaskHoardingDuration`、`WarmupEnable` | 识别设备、截图节奏、囤积与预热 |
| `EmulatorManagement` | `ScheduledEmulatorRestart`、`RestartIntervalHours`、`DeepRestartAfterFailures` | 计划重启与深度重启 |
| `Backup` | `Enable`、`KeepDays` | 每日备份 |
| `DailySummary` | `Enable`、`TriggerTime` | 每日日报 |
| `DropRecord` | `SaveFolder`、`RetentionDays`、各类记录开关 | 掉落截图与记录 |

`Optimization.OcrDevice` / `OcrBackend` 决定 OCR 用 CPU 还是 GPU。Android 宿主上还有 NPU 选项；桌面端一般保持自动。

### <DocIcon name="gift" /> 掉落记录（`DropRecord`）

按类别保存掉落截图与结构化记录：科研、委托、战斗、大世界各玩法、指挥喵等。`RetentionDays` 控制保留天数，过期按 `BackUpMethod` 删除或压缩。

`AzurStatsID` / `API` 是社区统计服务的接入字段。不打算上报就留空。

## <DocIcon name="pencil" /> 通用设置（`General`）

### <DocIcon name="circle-off" /> 退役（`Retirement` / `OneClickRetire` / `OldRetire`）

| 字段 | 说明 |
| --- | --- |
| `Retirement.RetireMode` | 退役模式（一键退役 / 旧版逐艘） |
| `OneClickRetire.KeepLimitBreak` | 保留已突破的舰船 |
| `OldRetire.N/R/SR/SSR` | 各稀有度的处理策略 |
| `OldRetire.RetireAmount` | 单次退役数量 |

退役策略必须与游戏内「一键退役设置」配合，否则会出现「脚本选中的船和游戏过滤的不一致」。

::: danger 退役不可逆
第一次配置时先用小批量验证。把 `RetireAmount` 设为 1，确认脚本选中的船符合预期后再放开。
:::

### <DocIcon name="zap" /> 强化（`Enhance`）

| 字段 | 说明 |
| --- | --- |
| `ShipToEnhance` | 要强化的舰船 |
| `Filter` | 作为材料的舰船筛选 |
| `CheckPerCategory` | 按类别检查 |
| `KeepCommonCV` | 保留普通航母（部分玩法需要） |

### <DocIcon name="sparkles" /> 公共情绪（`PublicEmotion`）

跨任务共享心情与舰队状态：

| 字段 | 说明 |
| --- | --- |
| `Enable` | 启用公共情绪管理 |
| `Tasks` | 参与管理的任务 |
| `FleetValue` / `FleetRecord` | 舰队心情值与记录 |
| `FleetRecoveryState` / `FleetRecover` | 恢复状态与恢复策略 |
| `FleetOath` / `FleetOnsen` | 誓约、温泉恢复 |

心情不足时任务会主动休眠，避免红脸出击导致好感下降。

### <DocIcon name="badge-dollar" /> 石油控制与优先级

| 字段 | 说明 |
| --- | --- |
| `OilControl.Enable` / `Target` | 原调度下的石油自动控制，默认关闭，目标 24000 |
| `YukikazeTaskManager.TaskPriorityAdjustment` | 自定义任务优先级（每行一个命令） |

## <DocIcon name="clock" /> 运行参数（`RunParams`）

这一组控制「等待多久算异常」，普通使用保持默认。

| 子组 | 关键字段 | 默认 | 说明 |
| --- | --- | --- | --- |
| `Watchdog` | `CheckInterval` | 30 秒 | 运行监护检查间隔 |
| `Watchdog` | `DailySummaryCheckInterval` | 1 秒 | 日报检查间隔 |
| `Reboot` | `Tries` | 3 | 游戏启动重试次数 |
| `Reboot` | `FirstTryWaitSeconds` / `SubsequentTryWaitSeconds` | 30 / 20 秒 | 重试等待 |
| `Reboot` | `ObserveSeconds` / `ObserveInterval` | 180 / 15 秒 | 观察阶段 |
| `Device` | `Mumu12StopWaitTimeout` | 60 秒 | MuMu12 关闭确认等待 |
| `UiWait` | 各界面等待 | — | 岛屿、宿舍、抽卡等界面的超时 |
| `Handover` | `MaintainLeadMinutes` | — | 作战委托的维护提前量 |

改这些值的典型场景：机器很慢、模拟器启动要两分钟以上，适当调大 `Reboot` 的等待；而不是关掉异常处理。

## <DocIcon name="search" /> 扫描类工具

### 舰队扫描（`FleetScan`）

扫描当前编入舰队的舰娘信息，结果在「舰队信息」页查看。用于核对舰队配置，不修改游戏状态。

### <DocIcon name="brain" /> 心智单元船坞扫描（`MindCalculatorScan`）

扫描国服 1280×720 船坞，结果供心智单元计算器核对。

- 完成前保留旧数据；
- **会重置船坞筛选**；
- 识别不确定时会报 `MindCalculatorScanError`，不会写入半成品。

### <DocIcon name="medal" /> 舰船科技扫描（`FleetTechScan`）

独立记录舰船身份与等级，不按心智计费条件排除。用于「舰队科技」页的科技点统计。

### <DocIcon name="crown" /> 指挥喵评分（`MeowfficerScore`）

| 字段 | 说明 |
| --- | --- |
| `Source` / `Folder` | 图片来源（设备截图或指定目录） |
| `MaxImages` / `ScanLimit` / `ScanPasses` | 扫描数量与次数 |
| `DeviceShots` / `DeviceInterval` | 设备截图与间隔 |
| `ReportPath` | 报告输出路径 |

识别指挥喵天赋，按公开攻略口径评分。适合批量筛选，不改变游戏内任何状态。

## <DocIcon name="hand" /> 辅助类工具

| 任务 | 用途 | 注意 |
| --- | --- | --- |
| `Daemon` | 半自动点击：进入地图后由你手动操作，脚本只处理重复点击 | 适合活动机制脚本不支持时 |
| `OpsiDaemon` | 大世界半自动：修理、选敌由脚本做 | 需要人在旁边 |
| `EventStory` | 活动剧情自动跳过 | `SkipBattle` 控制是否跳过战斗 |
| `BoxDisassemble` | 批量拆装备箱 | 可分别设置紫/蓝/白箱上限 |
| `AutoEquip` | 自动装备（快速更换 + 按舰船遍历） | 换装策略尚在完善 |
| `EmulatorManager` | 手动重启模拟器入口 | 支持 SSH 远程命令 |
| `GameManager` | 游戏管理器 | **未完成**，不要依赖 |

### <DocIcon name="shield" /> 反和谐（`AzurLaneUncensored`）

按 `Repository` 配置替换资源。这属于修改客户端文件，存在账号风险，且与自动化识别无关。是否使用由你自行判断。

## <DocIcon name="flask" /> 基准与测试

| 任务 | 用途 |
| --- | --- |
| `Benchmark` | 性能测试：`DeviceType`、`TestScene` |
| `OcrBenchmark` | OCR 性能测试，辅助选择推理设备 |

跑基准前关闭其他实例，否则测出来的耗时没有参考价值。

## <DocIcon name="folder" /> 系统级配置放在哪

| 想改什么 | 位置 |
| --- | --- |
| WebUI 端口、密码、语言 | `config/deploy.yaml` |
| 实例任务开关与参数 | `config/<实例>.json` |
| 模拟器 Serial 与截图方案 | 系统 → 模拟器设置 |
| 异常处理与推送 | 系统 → 调试设置 |
| 备份与日报 | 系统 → 备份 / 日报 |
| 私有部署的远程服务地址 | `config/remote-access.json` 与注册服务配置 |
