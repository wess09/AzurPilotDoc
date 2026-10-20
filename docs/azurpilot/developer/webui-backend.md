---
title: WebUI 后端
description: gui.py 的进程监督、WebSocket RPC 协议、方法注册、鉴权与限流，以及新增 API 方法的完整流程。
updated: 2026-10-20
---

# WebUI 后端

后端由两部分组成：`gui.py` 负责进程与生命周期，`module/api/` 负责协议与业务方法。它不包含任何游戏逻辑，所有操作都转化为配置写入或 worker 指令。

## <DocIcon name="zap" /> gui.py

启动顺序：

1. 解析参数（`--host`、`--port`、`--key`、`--ssl-key`、`--ssl-cert`、`--run`、`--electron`）。
2. `ensure_frontend()`：检查 `frontend/dist`，缺失时安装依赖并构建。
3. 初始化 `State`（部署配置、路径、数据库）。
4. 启动 uvicorn；可选启动 MCP 与 OCR 服务。
5. 进入监督循环，管理 worker 与更新事务。

### 监督循环

- worker 由 `ProcessManager` 创建，停止事件通过 `State.manager.Event()` 跨进程注入。
- 更新时先停 worker，置位 `stop_event`，让 `loop()` 走「更新退出」而不是报错。
- 启动时扫描 `worker_registry`，回收上次异常退出留下的孤儿进程。
- 退出码有明确语义（例如「更新退出」「配置失败」），父进程据此决定是否重启。

::: tip 不要用 `kill -9` 当常规停止方式
强杀 worker 会跳过收尾，留下锁文件与孤儿进程。WebUI 的停止按钮走的是正常信号链。
:::

## <DocIcon name="clipboard" /> 方法注册表

`module/api/router.py` 用显式表注册方法，不做反射调用：

```python
self.methods = {
    'system.ping': Method(p.Params, lambda _: {'pong': True}),
    'instances.list': Method(p.Params, lambda _: runtime.instances()),
    'config.patch': Method(p.PatchParams, lambda x: configs.patch(...), True),
}
```

`Method(params, handler, mutates)`：

| 字段 | 作用 |
| --- | --- |
| `params` | Pydantic 模型，严格校验、禁止额外字段 |
| `handler` | 处理函数 |
| `mutates` | 是否修改状态；前端据此决定是否刷新 |

当前注册 **72 个方法**，覆盖实例、配置、调度、日志、统计、心智计算器、舰队科技、交易所、远程配对、账号、更新、公告、背景图库。

## <DocIcon name="plug" /> WebSocket 协议

端点：`/api/v1/ws`。

### 信封

```json
{ "v": 1, "type": "request", "id": "req-1", "method": "instances.list", "params": {} }
{ "v": 1, "type": "response", "id": "req-1", "ok": true, "result": [] }
{ "v": 1, "type": "response", "id": "req-1", "ok": false,
  "error": { "code": "INVALID_PARAMS", "message": "请求格式或参数不正确", "details": [] } }
{ "v": 1, "type": "event", "topic": "overview", "data": {} }
```

### 会话建立

连接后服务器先推一条 `session` 事件：

```json
{ "v": 1, "type": "event", "topic": "session",
  "data": { "authRequired": true, "protocolVersion": 1 } }
```

本机回环连接且未设置密码时 `authRequired` 为 `false`，直接可用。

### 鉴权

```json
{ "v": 1, "type": "request", "id": "auth", "method": "auth.login",
  "params": { "password": "<WebUI 密码或配对凭据>" } }
```

- 密码来自 `--key`、`config/deploy.yaml` 的 `Password`，或自动生成的 `password.txt`。
- 远程配对使用独立凭据，撤销后下一次请求（含 15 秒心跳）即失效。
- 账号操作（`accounts.manage`）在非本机连接时必须走 WSS，否则返回 `TLS_REQUIRED`。

### 订阅

```json
{ "v": 1, "type": "request", "id": "sub", "method": "events.subscribe",
  "params": { "instance": "ap", "topics": ["overview", "logs", "statistics"] } }
```

| 主题 | 内容 | 采样 |
| --- | --- | --- |
| `instances` | 实例列表与状态 | 2 秒 |
| `overview` | 当前任务、资源 | 1 秒 |
| `logs` | 增量日志 | 变更即推 |
| `preview` | 截图预览 | 变更即推 |
| `statistics` | 统计 | 1 秒 |
| `notifications` | 通知流 | 事件 |
| `stock` | 交易所数据 | 事件 |

订阅是**整体替换**语义：再次订阅会清空旧主题。Android 宿主因此只允许一个全局订阅者。

### 限制

| 项 | 值 |
| --- | --- |
| 单条消息上限 | 8 MiB |
| 普通请求上限 | 1 MiB（心智导入/识别/保存/计算例外） |
| 频率 | 每窗口 30 个请求，超出 `RATE_LIMITED` |
| 重复 ID | `DUPLICATE_REQUEST` |
| 未鉴权读超时 | 30 秒 |

## <DocIcon name="circle-alert" /> 错误码

| 码 | 含义 |
| --- | --- |
| `INVALID_REQUEST` | 信封或大小不合法 |
| `INVALID_PARAMS` | 参数校验失败 |
| `UNAUTHORIZED` | 未登录或配对已撤销 |
| `TLS_REQUIRED` | 远程账号操作未走 WSS |
| `RATE_LIMITED` | 请求过频 |
| `DUPLICATE_REQUEST` | 请求 ID 复用 |
| `INTERNAL_ERROR` | 服务端异常（详情不返回给客户端） |

参数校验的错误详情只包含字段路径与类型，不回显输入值——避免密码与私有配置泄露。

## <DocIcon name="cloud" /> HTTP 接口

除 WebSocket 外，还有少量 HTTP 路由：

| 路径 | 用途 |
| --- | --- |
| `/healthz` | 健康检查（Android 就绪探测） |
| `/android/*` | Android 宿主专用薄接口，需 `X-AzurPilot-Android-Token` |
| `/api/v1/pairings/*` | 远程配对注册（由注册服务提供） |
| 静态资源 | `frontend/dist`，本地提供，不走 CDN |

`/android/*` 的鉴权额外要求客户端来自回环地址。详见 [Android 薄接口](/api/android)。

## <DocIcon name="drive" /> 运行时与持久化

| 模块 | 职责 |
| --- | --- |
| `module/runtime/process_manager.py` | worker 创建、停止、回收 |
| `module/runtime/updater.py` | 更新检查与应用 |
| `module/runtime/remote_access.py` | Tunnel 生命周期 |
| `module/runtime/account_vault.py` | 账号保险库 |
| `module/persistence/` | SQLite 总库、迁移、恢复 |

业务数据表由 `module/persistence` 统一管理。API 层不直接拼 SQL，走 service 层。

## <DocIcon name="circle-plus" /> 新增一个 API 方法

<Steps>
<Step title="定义参数模型">

在 `module/api/protocol.py` 加 Pydantic 模型，继承 `Params`（`extra='forbid'`、`strict=True`）。

</Step>
<Step title="实现服务">

业务逻辑放在 `module/api/<domain>_service.py`，不要在 router 里写长逻辑。

</Step>
<Step title="注册方法">

在 `router.py` 的 `self.methods` 中登记，标明 `mutates`。

</Step>
<Step title="导出契约">

```bash
uv run python -m dev_tools.export_api_schema
```

会更新 `frontend/src/api/generated.ts` 与 `contract.json`。

</Step>
<Step title="接前端">

在 `frontend/src` 用 `api.request('your.method', params)` 调用，类型自动来自契约。

</Step>
<Step title="测试">

```bash
uv run python -m unittest tests.test_api
```

需要覆盖：正常返回、参数校验失败、未鉴权、并发/重复请求。

</Step>
</Steps>

::: warning 不要暴露内部方法
只有注册在 router 里的方法才是公开契约。业务模块的内部函数不是 API，不要在前端直接调用，也不要在文档里宣传成稳定接口。
:::

## <DocIcon name="map" /> 相关文档

<ul class="ap-linklist">
<li><a href="/api/websocket">WebSocket API 参考<span class="desc">全部方法与参数</span></a></li>
<li><a href="/azurpilot/developer/frontend">React 前端<span class="desc">契约如何被消费</span></a></li>
<li><a href="/api/android">Android 薄接口<span class="desc">跨进程通信</span></a></li>
</ul>
