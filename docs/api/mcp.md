---
title: MCP 服务
description: 18 个 MCP 工具的用途、挂载方式、鉴权与客户端接入配置，以及和 WebSocket API 的边界。
updated: 2026-10-20
---

# MCP 服务

MCP（Model Context Protocol）让支持该协议的客户端（编辑器、Agent 工具）直接查询和控制 AzurPilot。它是**另一条入口**，不是 WebSocket API 的替代品。

## <DocIcon name="rocket" /> 两种运行方式

| 方式 | 端点 | 说明 |
| --- | --- | --- |
| 随 WebUI 挂载 | `http://<host>:25548/mcp/sse` | 默认，复用 WebUI 进程 |
| 独立服务 | `python mcp_server_sse.py`，端口 `22268` | 调试或分离部署 |

::: warning 22268 与 OCR 冲突
独立 MCP 与 OCR 服务默认都用 22268。同机运行两者时，先改其中一个端口。
:::

## <DocIcon name="key" /> 鉴权

MCP 复用 WebUI 密码（`--key` 或 `deploy.yaml` 的 `Password`）：

| 方式 | 写法 |
| --- | --- |
| 请求头（推荐） | `Authorization: Bearer <密码>` |
| 兼容头 | `X-API-Key: <密码>` |
| 查询参数 | `?key=<密码>`（仅限无法自定义 Header 的客户端） |

不带凭据返回 `401`。修改密码后需要重启 WebUI，MCP 才会使用新密码。

::: danger 查询参数就是凭据
`?key=` 会出现在日志、历史记录与截图中。有条件就改用 Header。
:::

## <DocIcon name="settings" /> 客户端配置

本地：

```json
{
  "mcpServers": {
    "azurpilot": {
      "url": "http://127.0.0.1:25548/mcp/sse",
      "headers": { "Authorization": "Bearer <WebUI 密码>" }
    }
  }
}
```

远程或内网：

```json
{
  "mcpServers": {
    "azurpilot": {
      "url": "http://<IP_ADDRESS>:25548/mcp/sse",
      "headers": { "Authorization": "Bearer <WebUI 密码>" }
    }
  }
}
```

端口被改过时同步替换。

## <DocIcon name="clipboard" /> 工具清单

共 18 个工具。

| 类别 | 工具 | 作用 |
| --- | --- | --- |
| 实例 | `list_instances` | 列出所有实例 |
| 实例 | `get_status` | 获取实例状态 |
| 实例 | `start_instance` | 启动实例 |
| 实例 | `stop_instance` | 停止实例 |
| 任务 | `list_tasks` | 列出所有任务 |
| 任务 | `get_task_help` | 获取任务帮助 |
| 任务 | `trigger_task` | 触发任务 |
| 任务 | `get_scheduler_queue` | 获取调度队列 |
| 任务 | `clear_scheduler_queue` | 清空调度队列 |
| 监控 | `get_current_running_task` | 当前运行任务 |
| 监控 | `get_resources` | 资源状态 |
| 监控 | `get_config` | 实例配置 |
| 监控 | `get_recent_logs` | 最近日志 |
| 监控 | `get_screenshot` | 当前截图 |
| 配置 | `update_config` | 更新配置 |
| 维护 | `restart_emulator` | 重启模拟器 |
| 维护 | `restart_adb` | 重启 ADB |
| 维护 | `update_alas` | 更新 AzurPilot |

::: tip 参数以服务端声明为准
MCP 客户端会通过 `tools/list` 拿到每个工具的 JSON Schema。这里只说明用途，不复制容易过期的参数定义。
:::

## <DocIcon name="lightbulb" /> 典型用法

### 让 Agent 巡检

```text
1. list_instances           → 有哪些实例
2. get_status(instance)     → 哪个在跑、当前任务
3. get_recent_logs(...)     → 有没有异常
4. get_resources(...)       → 石油/物资是否异常
```

### 手动干预

```text
trigger_task(instance, task)   → 立即执行某任务
clear_scheduler_queue(...)     → 清掉排错时堆积的队列
restart_adb(...)               → ADB 掉线
```

### 危险操作

`update_alas`、`restart_emulator`、`clear_scheduler_queue` 都会中断正在运行的任务。让 Agent 自动调用前，先确认它理解后果。

::: danger 不要让 Agent 无人监督地改配置
`update_config` 是写操作，会直接落盘并影响后续调度。没有 revision 冲突保护的外部写入可能覆盖用户手动修改。
:::

## <DocIcon name="scale" /> 与 WebSocket 的分工

| 能力 | MCP | WebSocket |
| --- | --- | --- |
| 列出/启停实例 | ✅ | ✅ |
| 精细配置读写 | 有限（`update_config`） | ✅ 完整 |
| 实时订阅 | ❌ | ✅ |
| 调度程序编辑 | ❌ | ✅ |
| 面向 AI 客户端 | ✅ | 需自建 |

MCP 是「给 Agent 的窄接口」，WebSocket 是「给前端的完整接口」。

## <DocIcon name="shield" /> 安全建议

1. 只在需要时开启，不要长期暴露到公网。
2. 密码要强，且与游戏账号不同。
3. 远程访问优先走 WSS / Tunnel，不要把 25548 直接映射到公网。
4. 查看 Agent 的工具调用记录，尤其是写操作。
5. 不用时重启 WebUI 并更换密码。

## <DocIcon name="wrench" /> 排查

| 现象 | 原因 |
| --- | --- |
| 401 | 未带凭据、密码错误、改密码后未重启 |
| 连接被拒 | 端口不对，或 MCP 未随 WebUI 启动 |
| 工具调用超时 | 实例正在执行长任务，后端繁忙 |
| 返回旧配置 | 配置缓存，重新 `get_config` |
| 独立服务起不来 | 22268 被 OCR 占用 |
