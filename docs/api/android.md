---
title: Android 薄接口
description: Android 宿主与 Runtime 之间的 HTTP 约定：状态、实例控制、日志、工具任务与热更挂起。
updated: 2026-10-20
---

# Android 薄接口

Android 宿主不通过 WebSocket 做所有事。启停实例、读状态、挂起更新这些操作走一组更薄的 HTTP 接口，前缀 `/android/`。

## <DocIcon name="clipboard" /> 启用条件

只有在设置环境变量后才会注册路由：

```bash
AZURPILOT_ANDROID=1
```

桌面版没有这些路由。

## <DocIcon name="key" /> 鉴权

```http
GET /android/status HTTP/1.1
X-AzurPilot-Android-Token: <token>
```

要求同时满足：

1. 请求来自回环地址（`127.0.0.1` / `::1`）。
2. Header 与 Runtime 持有的 token 常量时间比较一致。

否则返回 `403 {"error": "loopback only"}`。

::: danger 不要把 25548 暴露到局域网后指望这层保护
薄接口的安全模型是「只允许本机」。一旦端口被转发出去，其他防护只剩 WebSocket 密码。
:::

## <DocIcon name="settings" /> 实例参数

所有涉及实例的接口接受查询参数：

```text
?config=<实例名>
```

省略时：

- 若有正在运行的实例，取第一个；
- 否则用 `alas`。

实例名必须存在，否则返回 400。

## <DocIcon name="plug" /> 端点

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/android/status` | 运行状态 |
| GET | `/android/configs` | 实例名列表 |
| GET | `/android/logs?tail=N` | 纯文本日志（N ≤ 2000） |
| POST | `/android/start` | 启动实例 |
| POST | `/android/stop` | 停止实例 |
| POST | `/android/tool/start?name=<tool>` | 启动工具任务 |
| POST | `/android/tool/stop` | 停止工具任务 |
| GET | `/android/update/status` | 热更状态 |
| POST | `/android/update/apply` | 应用热更 |
| POST | `/android/update/suspend` | 为整包更新挂起所有实例 |

### status

```json
{
  "runner_alive": true,
  "pid": 12345,
  "config": "ap",
  "gui_alive": true,
  "tool_alive": false,
  "tool_name": null,
  "log_lines": 128
}
```

| 字段 | 含义 |
| --- | --- |
| `runner_alive` | 实例在跑且当前不是工具任务 |
| `pid` | 调度器进程号 |
| `config` | 当前实例名 |
| `gui_alive` | 后端存活（当前实现恒为 true） |
| `tool_alive` / `tool_name` | 是否在跑工具任务 |
| `log_lines` | 日志条目数 |

### start / stop

- `start`：先停掉其他运行中的实例，再启动目标实例。若目标已经在跑同一个任务，直接返回状态。
- `stop`：只停目标实例。
- 两者都会先检查旧版宿主进程是否占用设备（探测 `22300` 与 `22400`）。占用时返回 `DEVICE_BUSY`，提示先停止旧版任务。

### tool/start

支持的工具：

| `name` | 任务 |
| --- | --- |
| `daemon` | `Daemon`（半自动点击） |
| `event_story` | `EventStory`（活动剧情） |

未知名称返回 400。工具任务同一时间只能有一个。

### logs

返回 `text/plain`，每行一条，默认 80 行：

```text
GET /android/logs?config=ap&tail=200
```

### update/suspend

整包更新前调用。行为：

1. 枚举所有运行中的调度器与工具任务。
2. 把实例名写入 `config/reloadalas`。
3. 逐个优雅停止。
4. 返回 `{"ok": true, "suspended": ["ap", "ap-2"]}`。

下次 WebUI 启动时 `restart_processes()` 读取该清单，自动复活被挂起的实例。

::: warning 不要把 suspend 当成普通停止
它写恢复清单。手动调用后如果不再启动 WebUI，实例会一直停着。
:::

## <DocIcon name="circle-alert" /> 错误

| 状态码 | 场景 |
| --- | --- |
| 400 | 实例不存在、未知工具、参数非法 |
| 403 | 非回环请求或 token 不匹配 |
| 404 | 路径不存在 |

错误体：

```json
{ "error": "DEVICE_BUSY" }
```

错误信息会说明具体原因（如已有实例在运行、旧版任务未停止），按提示处理即可。

## <DocIcon name="scale" /> 与 WebSocket 的分工

| 操作 | 走哪条 |
| --- | --- |
| 配置读写、任务参数 | WebSocket |
| 日志与统计订阅 | WebSocket |
| 启停、状态轮询 | HTTP 薄接口 |
| 热更 | HTTP 薄接口 |

Android 宿主用 HTTP 做「开关」，用 WebSocket 做「数据面」。这样即使 WebSocket 断线，宿主仍能安全地停止实例。
