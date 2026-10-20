---
title: 通知、日志与统计
description: 日志文件与错误现场的位置、OnePush 推送配置、LLM 错误分析、每日日报与统计报表。
updated: 2026-10-20
---

# 通知、日志与统计

无人值守的前提是「出问题能知道」。核心程序提供三层可观测性：日志落盘、错误现场、主动推送。

## <DocIcon name="scroll" /> 日志

| 内容 | 位置 |
| --- | --- |
| 实例运行日志 | `log/<日期>_<实例名>.txt` |
| 启动器日志 | `log/<日期>_launcher.txt`（Launcher 仓库） |
| 错误现场 | `log/error/<实例名>/<时间戳>/` |
| 调试服务 | 环境变量 `ALAS_DEBUG_SERVER=1` 时启用，仅监听本机 |

日志按天追加，任务边界用分隔线标出：

```text
2026-10-20 09:00:12.345 | INFO | [AzurPilot] 调度器: 开始任务
2026-10-20 09:00:12.346 | INFO | ──────────────── 科研 ────────────────
2026-10-20 09:02:41.002 | INFO | [AzurPilot] 调度器: 结束任务
```

### <DocIcon name="circle-alert" /> 错误现场

发生异常时，程序会保存最近若干张截图与截断后的 `log.txt`，并对账号信息做遮罩。相关配置：

| 配置 | 默认 | 说明 |
| --- | --- | --- |
| `Error.SaveError` | 开 | 是否保存现场 |
| `Error.ScreenshotLength` | — | 保留最后 X 张截图 |
| `Error.SaveErrorRetentionDays` | — | 过期天数，0 = 不清理 |
| `Error.SaveErrorBackUpMethod` | — | 过期后删除 / 拷贝 / 压缩 |
| `Error.SaveErrorZipMethod` | `zip` | 压缩格式（bz2 / gzip / xz / zip） |

::: tip 提 Issue 时附什么
`log/error/<实例名>/<时间戳>/` 里的 `log.txt` 与截图，加上你的模拟器类型、截图方案、控制方案。不要附 `config/deploy.yaml` 或 `remote-access.json`。
:::

## <DocIcon name="megaphone" /> 通知

### <DocIcon name="send" /> OnePush

`Error.OnePushConfig` 使用 OnePush 的配置格式，把任务结果与错误推送到多种渠道（Telegram、Server 酱、企业微信等，具体支持以 OnePush 文档为准）。

两条推送路径：

| 路径 | 触发 |
| --- | --- |
| 任务结束推送 | 任务开启 `Scheduler.PushNotification` |
| 错误推送 | 无法自动处理的异常 |

### <DocIcon name="clock" /> 低推送量模式

`Error.LowPushMode` 开启后，能自动恢复的错误（游戏未运行、模拟器离线、卡死）只记日志不推送；需要人工介入的错误仍然推送。适合 7×24 长期运行，避免被自动重试刷屏。

### <DocIcon name="monitor" /> WebUI 通知

即使不配 OnePush，WebUI 也会收到实时通知流（SSE）。启动器的原生通知与 Android 的前台通知都基于这条流。

## <DocIcon name="brain" /> LLM 错误分析

`Error.LlmAnalysis` 默认开启时会调用 OpenAI 兼容接口分析异常，给出可能原因。相关字段：

| 字段 | 说明 |
| --- | --- |
| `LlmApiKey` | 服务商 API Key |
| `LlmApiBase` | OpenAI 兼容 Base URL |
| `LlmModel` | 模型名 |

分析结果写入日志，不会自动执行修复动作。

::: warning 会把日志发出去
分析需要把错误日志片段发送到你配置的模型服务。如果你不接受，关闭 `LlmAnalysis`。
:::

## <DocIcon name="calendar" /> 每日日报

`Alas.DailySummary.Enable` 默认关闭。开启后按 `TriggerTime`（默认 20:00）汇总当天的任务、资源与掉落，通过推送渠道发送。

日报线程独立于调度主线程，只读配置文件的只读快照，不访问正在执行任务的 `config` 对象。

## <DocIcon name="eye" /> 统计

统计页的数据来自 SQLite 总库，按类别组织：

| 分类 | 内容 |
| --- | --- |
| 资源 | 石油、物资、钻石、魔方、行动力等曲线 |
| 出击 | 关卡、次数、油耗、掉落 |
| 大世界 | 侵蚀循环、海域、行动力收支 |
| 委托 | 委托类型与完成数 |
| 科研 | 项目、耗时、产出 |
| 舰船 | 掉落与获取记录 |
| 仓库 | 材料库存与消耗 |

「资源管理」视图额外提供桑基图（资源流向）与库存对账，并把石油控制线接到 `General.OilControl`。

::: tip 统计不是实时截图
资源值来自任务执行时的截图读取与掉落后计算，不是持续轮询。长时间不跑任务时，曲线会停在那里，这是正常的。
:::

## <DocIcon name="plug" /> 外部监控

- <DocIcon name="plug" /> **MCP**：`get_status`、`get_resources`、`get_recent_logs` 可以让支持 MCP 的客户端读取状态。见 [MCP 服务](/api/mcp)。
- <DocIcon name="zap" /> **WebSocket**：订阅 `overview`、`logs`、`statistics` 主题，自建看板。见 [WebSocket API](/api/websocket)。
- <DocIcon name="scroll" /> **日志文件**：直接 tail `log/<日期>_<实例>.txt`，适合接入现有的日志系统。

## <DocIcon name="clipboard" /> 远程诊断清单

出问题时按这个顺序收集信息，能省掉大部分来回：

1. WebUI 总览的当前任务与最后 100 行日志。
2. `log/error/` 下最新目录的 `log.txt` 与截图。
3. 模拟器类型、分辨率、截图/控制方案。
4. 实例配置导出（删除敏感字段后）。
5. 是否刚更新过核心 / 启动器 / Runtime。
