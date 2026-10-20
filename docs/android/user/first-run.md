---
title: 首次启动与 Runtime
description: Runtime 部署状态机、首次启动为什么慢、必要权限、创建实例并启动第一个任务。
updated: 2026-10-20
---

# 首次启动与 Runtime

Android 版的首次启动分两段：先把 Linux Runtime 部署到应用私有目录，再启动 Runtime 里的 AzurPilot。两段都可能失败，但错误信息是分开的。

## <DocIcon name="settings" /> 部署状态机

| 状态 | 含义 | 下一步 |
| --- | --- | --- |
| `Checking` | 检查已装版本 | 自动继续 |
| `NotInstalled` | 尚未部署 | 主页点「下载 Runtime」 |
| `NotBundled` | 轻量包且 Release 无本架构 | 换完整包 |
| `LowDisk` | 剩余不足 2 GB | 清理空间 |
| `Downloading` | 下载中（按压缩字节计） | 等待 |
| `Extracting` | 解压中（同样按压缩字节计） | 等待 |
| `Ready` | 就位 | 启动 |
| `Failed` | 异常 | 看 `reason` 重试 |

部署不会自动开始：完整包内置 rootfs，但依然要你点一下「下载 Runtime」才会解压。这是为了避免在存储不足时静默失败。

### <DocIcon name="box" /> 部署做了什么

1. 若存在 `rootfs.previous`（上次中断），先恢复。
2. 校验 `.provisioned` 标记、`BUILD_MANIFEST` 与设备 ABI 是否一致。
3. 解压到 `rootfs.tmp`，成功后**原子改名**为 `rootfs`——半途失败不会留下半成品。
4. 保留 `config/`（含 SQLite、实例目录）、`password.txt`、`log/`。
5. 写入新标记，完成。

下载支持四连接分段（≥8 MiB 时先做 `Range` 探测），失败自动回退单连接重试一次。完成后校验大小与 SHA-256，任一不符进入 `Failed`。

## <DocIcon name="clock" /> 为什么第一次打开 WebUI 很慢

解压时会剥离 `__pycache__`。新 rootfs 第一次启动要重建全部字节码，WebUI 可能超过 90 秒才就绪。日志里会出现：

```text
AzurPilot WebUI not ready within 90000ms
```

这是**预期警告**，不是错误。服务随后会自然就绪，第二次启动恢复正常速度。

::: tip 不要在这个阶段强杀应用
强杀会留下未完成的会话与锁。等它自己起来，或者用应用内的「停止 Runtime」走正常收尾。
:::

## <DocIcon name="lock-keyhole" /> 必要权限

| 权限 | 用途 | 不给会怎样 |
| --- | --- | --- |
| 通知 | 前台服务、配对码、任务状态 | 无法用通知完成无线配对 |
| 电池优化白名单 | 后台保活 | 息屏后进程可能被回收 |
| 悬浮窗 | 全局控制面板 | 无法在其他应用上操作 |
| 安装未知应用 | 应用内更新 APK | 只能手动下载安装 |
| 所有文件访问（可选） | 导出日志到公共目录 | 导出到应用私有目录 |

不同厂商还有额外的「自启动」「后台弹窗」「省电策略」开关。Android 12+ 的「精确闹钟」与本应用无关，不需要给。

## <DocIcon name="lock" /> 激活权限

本地运行必须激活特权服务，否则无法创建虚拟屏、截图与注入触控。三种方式：

| 方式 | 适用 | 入口 |
| --- | --- | --- |
| 内置 ADB（推荐） | Android 11+ | 设置 → 运行与安全 → 内置 Shizuku |
| Root | 已 root 设备 | 同一页面选择 Root |
| 外部 Shizuku / Sui | 已装管理器 | 同一页面选择外部服务 |

详细步骤见[权限激活](/android/user/activation)。

## <DocIcon name="rocket" /> 启动 Runtime

1. 主页确认 Runtime 为 `Ready`。
2. 点击「启动」。
3. 等待状态变为运行中；首次启动可能较慢。
4. 打开「控制台」，进入内嵌 WebUI。

内嵌 WebUI 与桌面版是同一套前端，端口 `25548`，由 Runtime 监听在 `127.0.0.1`。宿主的 `AzurPilotGateway` 是唯一的 `/api/v1/ws` 订阅者。

## <DocIcon name="circle-plus" /> 创建第一个实例

<Steps>
<Step title="新建配置">

控制台 → 已安装配置 → 新建。名称用 `ap` 或自定义。

</Step>
<Step title="确认服务器">

模拟器/本机上的游戏包名。Android 宿主通常就是国服 `com.bilibili.azurlane`，渠道服按实际选择。

</Step>
<Step title="截图方案固定">

Android 宿主必须使用 `azurpilot_android` 截图与控制方案。其他方案走 ADB，无法访问虚拟屏。

</Step>
<Step title="启用一个短任务">

先开「科研」或「收获」，把下一次运行时间设为现在。

</Step>
<Step title="启动并观察">

挂机页能看到画面变化，日志出现任务开始/结束，就说明整条链路通了。

</Step>
</Steps>

## <DocIcon name="circle-check" /> 验证清单

| 检查 | 通过标准 |
| --- | --- |
| Runtime 状态 | 运行中，无反复重启 |
| 画面推流 | 挂机页能看到游戏画面 |
| 控制台 | 实例列表、任务页可打开 |
| 任务 | 日志有完整开始/结束，游戏内状态变化 |
| 后台 | 切到其他应用 5 分钟后回来，任务仍在跑 |

## <DocIcon name="map" /> 下一步

<ul class="ap-linklist">
<li><a href="/android/user/activation">权限激活<span class="desc">配对、Root、断网重连</span></a></li>
<li><a href="/android/user/console">控制台与悬浮窗<span class="desc">日常操作在哪</span></a></li>
<li><a href="/android/user/maintenance">更新与排障<span class="desc">热更、整包、日志</span></a></li>
</ul>
