---
title: WebSocket API v1
description: 核心程序的 WebSocket API v1：协议信封、会话建立、订阅主题、错误语义，以及 72 个方法的完整清单与可运行调用示例。
updated: 2026-10-20
---

# WebSocket API v1

端点：

```text
ws://127.0.0.1:25548/api/v1/ws
wss://<远程入口>/api/v1/ws
```

协议版本 `v=1`。所有消息都是 JSON 文本帧。

## <DocIcon name="file" /> 信封

### 请求

```json
{
  "v": 1,
  "type": "request",
  "id": "req-001",
  "method": "instances.list",
  "params": {}
}
```

| 字段 | 约束 |
| --- | --- |
| `v` | 必须为 `1` |
| `type` | `request` |
| `id` | 1–100 字符，同一会话内不能重复 |
| `method` | 已注册方法名 |
| `params` | 严格模型，禁止额外字段 |

### 成功响应

```json
{ "v": 1, "type": "response", "id": "req-001", "ok": true, "result": [] }
```

### 失败响应

```json
{
  "v": 1,
  "type": "response",
  "id": "req-001",
  "ok": false,
  "error": { "code": "INVALID_PARAMS", "message": "请求格式或参数不正确", "details": [] }
}
```

### 事件

```json
{ "v": 1, "type": "event", "topic": "overview", "data": {} }
```

## <DocIcon name="handshake" /> 会话

连接后服务器主动推送：

```json
{
  "v": 1,
  "type": "event",
  "topic": "session",
  "data": { "authRequired": true, "protocolVersion": 1 }
}
```

- `authRequired: false` 表示本机回环且未设密码，直接可调用。
- 未鉴权时读超时 30 秒，已鉴权 60 秒。

### 登录

```json
{
  "v": 1, "type": "request", "id": "a1", "method": "auth.login",
  "params": { "password": "<WebUI 密码>" }
}
```

远程配对客户端提交的是配对凭据，不是主密码。撤销配对后，下一次请求（含 15 秒心跳）会返回 `UNAUTHORIZED`。

## <DocIcon name="megaphone" /> 订阅

```json
{
  "v": 1, "type": "request", "id": "s1", "method": "events.subscribe",
  "params": { "instance": "ap", "topics": ["overview", "logs", "statistics"] }
}
```

| 主题 | 数据 | 采样 |
| --- | --- | --- |
| `instances` | 实例列表与运行状态 | 2 秒 |
| `overview` | 当前任务、资源 | 1 秒 |
| `logs` | 增量日志 | 变更即推 |
| `preview` | 截图预览 | 变更即推 |
| `statistics` | 统计报表 | 1 秒 |
| `notifications` | 通知流 | 事件 |
| `stock` | 交易所 | 事件 |

::: warning 订阅是整体替换
再次订阅会清空旧主题。Android 宿主因此只允许一个全局订阅者；外部工具不要和前端同时订阅同一实例后互相覆盖。
:::

## <DocIcon name="circle-alert" /> 限制与错误码

| 项 | 值 |
| --- | --- |
| 单条消息 | ≤ 8 MiB |
| 普通请求 | ≤ 1 MiB |
| 大请求例外 | `mind.import`、`mind.recognize`、`mind.save`、`mind.calculate` |
| 频率 | 30 请求 / 秒 |

| 错误码 | 含义 |
| --- | --- |
| `INVALID_REQUEST` | 信封/大小不合法 |
| `INVALID_PARAMS` | 参数校验失败 |
| `UNAUTHORIZED` | 未登录或配对撤销 |
| `TLS_REQUIRED` | 远程账号操作未走 WSS |
| `RATE_LIMITED` | 请求过频 |
| `DUPLICATE_REQUEST` | 请求 ID 复用 |
| `INTERNAL_ERROR` | 服务端异常，详情不返回 |

参数错误只回字段路径与类型，不回显输入值。

## <DocIcon name="zap" /> 常用流程

### 列出实例并读取总览

```json
{"v":1,"type":"request","id":"1","method":"instances.list","params":{}}
{"v":1,"type":"request","id":"2","method":"overview.get","params":{"instance":"ap"}}
```

### 启动与停止调度器

```json
{"v":1,"type":"request","id":"3","method":"scheduler.start","params":{"instance":"ap"}}
{"v":1,"type":"request","id":"4","method":"scheduler.stop","params":{"instance":"ap"}}
```

### 修改配置

```json
{
  "v": 1, "type": "request", "id": "5", "method": "config.patch",
  "params": {
    "instance": "ap",
    "revision": "<上次读取的 revision>",
    "changes": [{ "path": "Research.Scheduler.Enable", "value": true }]
  }
}
```

`revision` 是乐观并发控制：与当前不一致会返回冲突，需要重新 `config.get` 后再提交。

### 立即运行任务

```json
{"v":1,"type":"request","id":"6","method":"tasks.run","params":{"instance":"ap","task":"Research"}}
```

这是「跳过调度直接执行」，不会修改 `NextRun`。

### 读取日志

```json
{"v":1,"type":"request","id":"7","method":"logs.get","params":{"instance":"ap","after":128}}
```

`after` 是游标，返回此后的增量条目。

## <DocIcon name="clipboard" /> 方法清单

下表由 `frontend/src/api/contract.json` 生成。展开任一行可看参数类型与约束。

<ApiTable />

## <DocIcon name="lightbulb" /> 客户端实现建议

1. 连接后先等 `session` 事件，再决定是否登录。
2. `id` 用单调递增或 UUID，不要复用。
3. 断线后用指数退避重连，并重新订阅。
4. 订阅前先 `overview.get` 拿一次全量，再靠事件增量。
5. 写操作后不要假设成功，读回状态确认。
6. 不要把密码写进 URL（MCP 的 `?key=` 是例外，且仅限无法设 Header 的客户端）。

## <DocIcon name="shield" /> 安全

- 远程访问必须走 WSS；账号操作在非本机连接下强制 TLS。
- 不要把 WebSocket 地址与密码一起截图分享。
- 自建看板应使用只读方法，避免误触 `scheduler.stop` 之类的写操作。
