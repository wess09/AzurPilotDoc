---
title: 远程访问与设备配对
description: 通过局域网或 Cloudflare Quick Tunnel 远程访问 WebUI，使用配对码与 Android 客户端安全连接。
updated: 2026-10-20
---

# 远程访问与设备配对

远程访问解决的是「人不在机器旁边」的问题。它有两种形态，安全模型完全不同：

| 形态 | 暴露面 | 适用 |
| --- | --- | --- |
| 局域网直连 | 内网 IP + 端口 | 同一路由器下，最省事 |
| Cloudflare Quick Tunnel | 公网域名（临时） | 外网临时访问、手机远程 |

## <DocIcon name="laptop" /> 局域网直连

1. <DocIcon name="file-pen" /> 把 `config/deploy.yaml` 的 `WebuiHost` 改为 `0.0.0.0`（或保留默认值）。
2. <DocIcon name="lock" /> 设置 `WebuiPassword`，或使用启动参数 `-k`。
3. <DocIcon name="refresh" /> 重启后端。
4. <DocIcon name="monitor" /> 在同一局域网的设备访问 `http://<内网IP>:25548`。

::: danger 没有密码就不要监听 0.0.0.0
WebUI 可以启停任务、读取截图、改配置。程序在未设置密码且监听公网时会自动生成密码并写入 `password.txt`，但这只防「完全裸奔」，不防弱口令。请自己设置强密码。
:::

## <DocIcon name="cloud" /> Cloudflare Quick Tunnel

「设置 → 远程访问」把模式设为 `cloudflare`，设置 WebUI 密码，开启远程访问并重启。程序会：

1. <DocIcon name="rocket" /> 在本地启动 `cloudflared` Quick Tunnel，得到一个 `*.trycloudflare.com` 地址。
2. <DocIcon name="key" /> 用设备密钥把地址注册到注册服务（默认 `https://remote.azurpilot.com`）。
3. <DocIcon name="clock" /> 每 60 秒续约；异常退出后服务端租约 180 秒失效。
4. <DocIcon name="plug" /> 提供固定入口 `<registry>/d/<device_id>/`，以 301 跳转到当前 Tunnel。

设备身份保存在 `config/remote-access.json`：安装 ID 与注册密钥持久化，配对凭据只存 SHA-256 摘要。**备份这个文件**才能在迁移后保留固定入口；**不要提交它**。

::: warning Quick Tunnel 不是生产级服务
Cloudflare 不保证 Quick Tunnel 的可用性，并限制并发请求与 SSE 等能力。它适合测试与临时使用。业务通道是 WebSocket，固定入口不会消除这些限制。网络需允许访问 Cloudflare 边缘的 7844 端口。
:::

## <DocIcon name="handshake" /> 配对流程

<RemotePairing />

<Figure caption="配对码与二维码共享同一次「领取」状态。任一方式成功后，另一种不能重放。" />

<Steps>
<Step title="在主机侧生成配对">

远程访问就绪后点击「配对」。程序请求注册服务生成六位数字码（保留前导零）、128 位扫描密钥和五分钟有效期。

</Step>
<Step title="在客户端领取">

- 扫码：解析 `azurpilot://pair?secret=<secret>` 二维码。
- 手输：输入六位验证码。

领取在服务端 SQLite 事务内执行，只能成功一次。

</Step>
<Step title="客户端保存凭据">

Android 客户端用 Android Keystore AES-GCM 保存固定入口与独立凭据。之后连接时以 WSS 调用 `auth.login`，认证完成才发布就绪状态。

</Step>
<Step title="验证与撤销">

主机侧「已授权的配对」可以单独撤销某个客户端。已连接的客户端在下一次请求（含 15 秒心跳）时停止授权，**不需要修改 WebUI 主密码**。

</Step>
</Steps>

## <DocIcon name="shield" /> 安全边界

| 项 | 设计 |
| --- | --- |
| 配对码 | 五位/六位数字 + 128 位密钥，五分钟过期，单次领取 |
| 存储 | 服务端只存摘要；客户端存于 Keystore |
| 撤销 | 按客户端粒度，不影响其他设备 |
| 主密码 | 注册服务不保存 WebUI 主密码 |
| 流量 | 注册服务不代理 WebSocket、截图或业务数据 |

## <DocIcon name="smartphone" /> 客户端形态

- <DocIcon name="monitor" /> **浏览器**：直接访问 Tunnel 地址，输入 WebUI 密码。
- <DocIcon name="smartphone" /> **Android 宿主**：作为远程客户端连接其他实例，不需要本机 Runtime，也不需要 Shizuku。详见 [作为远程客户端](/android/user/remote-client)。
- <DocIcon name="plug" /> **MCP 客户端**：使用 `/mcp/sse`，携带 WebUI 密码作为 Bearer Token。见 [MCP 服务](/api/mcp)。

## <DocIcon name="wrench" /> 排查

| 现象 | 检查 |
| --- | --- |
| 固定入口 302 到 `/error` | 设备离线、租约过期或 Tunnel 失效 |
| 二维码扫不出来 | 屏幕亮度、缩放；二维码为标准 M 级纠错 |
| 配对码提示过期 | 超过五分钟，重新生成 |
| 连上但一直转圈 | WebSocket 被中间网络阻断，或密码错误 |
| 更新后 Tunnel 起不来 | Runtime 中缺少新版 `pyflared`，见 Android 热更说明 |

更多网络问题见[故障排查 · 核心程序](/troubleshooting/azurpilot)。
