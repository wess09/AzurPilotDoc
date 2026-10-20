---
title: 接口总览
description: AzurPilot 对外暴露的三类接口：WebSocket RPC、Android 薄接口与 MCP 服务，以及鉴权与稳定性边界。
updated: 2026-10-20
---

# 接口总览

核心程序对外只有三类接口。它们共享同一套配置与进程模型，但协议、鉴权与适用场景不同。

| 接口 | 端点 | 协议 | 鉴权 | 用途 |
| --- | --- | --- | --- | --- |
| WebSocket API | `/api/v1/ws` | JSON RPC over WS | 会话密码 / 配对凭据 | 前端、Android、自建看板 |
| Android 薄接口 | `/android/*` | HTTP | 本机回环 + Header Token | Android 宿主 |
| MCP 服务 | `/mcp/sse` 或独立 `:22268` | MCP SSE | Bearer（WebUI 密码） | AI 客户端 |

另有 `/healthz` 用于就绪探测，无鉴权、无业务数据。

## <DocIcon name="shield" /> 稳定性边界

::: warning 只有注册的方法才是公开接口
`module/api/router.py` 里的 72 个方法是公开契约，由 `dev_tools.export_api_schema` 生成类型。业务模块内部的 Python 函数不是 API，不要在前端或外部工具里直接调用。
:::

| 层 | 稳定性 |
| --- | --- |
| `router.py` 注册方法 | 公开，参数模型受严格校验 |
| `/android/*` | App 专用，随宿主版本演进 |
| MCP 工具 | 公开，数量与语义随版本变化 |
| 内部 service / 模块函数 | 私有，随时可改 |

## <DocIcon name="plug" /> 端口

| 端口 | 用途 | 来源 |
| --- | --- | --- |
| `25548` | WebUI + WebSocket | `deploy.yaml` 的 `WebuiPort` |
| `22267` | 启动器打开的 WebUI | 启动器指定 |
| `22268` | 独立 MCP / OCR 服务 | `OcrServerPort` |
| `22302` | Android OCR 张量 API | Android `:ocr` |
| `22300` / `22400` | 旧版宿主进程探测 | Android 兼容检查 |

::: tip 22268 是共用端口
MCP 独立服务与 OCR 服务默认都用 22268。同机运行两者会冲突，先改其中一个。
:::

## <DocIcon name="key" /> 鉴权

| 场景 | 方式 |
| --- | --- |
| 本机回环、未设密码 | 免密 |
| 浏览器 / 局域网 | `auth.login` 提交 WebUI 密码 |
| Android 远程客户端 | 配对凭据（独立于主密码） |
| Android 本地宿主 | `X-AzurPilot-Android-Token`，且必须来自回环 |
| MCP | `Authorization: Bearer <WebUI 密码>` 或 `?key=` |

密码来源：`--key` 参数、`config/deploy.yaml` 的 `Password`，或自动生成的 `password.txt`。

## <DocIcon name="file" /> 最小示例

WebSocket：

```json
{"v":1,"type":"request","id":"1","method":"system.ping","params":{}}
{"v":1,"type":"response","id":"1","ok":true,"result":{"pong":true}}
```

HTTP：

```bash
curl -s http://127.0.0.1:25548/healthz
```

MCP：

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

## <DocIcon name="map" /> 继续阅读

<ul class="ap-linklist">
<li><a href="/api/websocket">WebSocket API<span class="desc">信封、鉴权、72 个方法</span></a></li>
<li><a href="/api/android">Android 薄接口<span class="desc">宿主与 Runtime 的约定</span></a></li>
<li><a href="/api/mcp">MCP 服务<span class="desc">18 个工具与接入方式</span></a></li>
<li><a href="/azurpilot/developer/webui-backend">WebUI 后端<span class="desc">实现侧</span></a></li>
</ul>
