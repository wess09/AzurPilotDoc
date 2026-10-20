---
title: 权限激活
description: 内置 ADB 无线配对、Root 与外部 Shizuku 三种激活方式，断网重连、失效条件与安全边界。
updated: 2026-10-20
---

# 权限激活

虚拟屏、截屏与触控注入都需要 shell 级权限。Android 版提供三条路径，**推荐内置 ADB**：不需要电脑、不需要 Root、不需要另装管理器。

| 方式 | 前提 | 重启后 | 安全面 |
| --- | --- | --- | --- |
| 内置 ADB | Android 11+（9–10 需先 `adb tcpip 5555`） | 需重新激活 | 仅回环连接，RSA 认证 |
| Root | 已 root（Magisk 等） | 通常自动可用 | 授予 root 权限 |
| 外部 Shizuku | 已安装 Shizuku / Sui | 取决于管理器 | 复用其授权 |

## <DocIcon name="smartphone" /> 内置 ADB

内置实现移植自 [shizuku-m](https://github.com/wess09/shizuku-m)（Apache-2.0），包含无线配对、离线重连与加密密钥存储。

### <DocIcon name="refresh" /> Android 11 及以上

<Steps>
<Step title="开启开发者选项">

设置 → 关于手机 → 连续点击版本号 7 次。然后在「系统 → 开发者选项」中打开**无线调试**。

</Step>
<Step title="进入配对页">

应用内：设置 → 运行与安全 → 内置 Shizuku → 开始配对。

</Step>
<Step title="获取配对码">

在系统的「使用配对码配对设备」页面选择「配对码配对」。系统会显示六位配对码与端口。

- 通知可用：直接在应用弹出的通知里输入配对码。
- 通知不可用：用分屏，把系统配对页与应用并排，展开「设备配对 → 手动输入配对码」，填写端口与六位码。

</Step>
<Step title="确认调试授权">

如果系统弹出「允许 USB 调试吗」，勾选「始终允许」并确定。这一步容易被忽略，漏掉会表现为「配对成功但服务起不来」。

</Step>
<Step title="等待激活">

成功后启动页显示状态与「返回应用」，配对表单自动收起。配对码不会被保存。

</Step>
</Steps>

### <DocIcon name="settings" /> Android 9–10

系统没有无线调试配对界面，需要先借助电脑把 adbd 切到 TCP 模式：

```bash
adb devices            # 确认设备已连接
adb tcpip 5555         # 让 adbd 监听 5555
```

之后在应用内连接 `127.0.0.1:5555`。USB 线可以拔掉，但设备重启后需要重新执行。

### <DocIcon name="cloud" /> 断网与重连

激活后，**本次开机内**即使断网、开飞行模式，也能重新连接。失效条件：

- 设备重启
- 撤销调试授权
- 关闭开发者选项 / 无线调试
- 清除应用数据

以上任一情况都需要重新激活。

::: danger 5555 端口
系统 adbd 监听 5555，可能对局域网开放。应用客户端只连接 `127.0.0.1`，且 adbd 仍要求系统认可的 RSA 密钥。但请不要在公共网络下长期开启无线调试，也不要在不认识的设备上点「允许调试」。
:::

### <DocIcon name="key" /> 密钥存储

RSA 私钥由 Android Keystore 的 AES-GCM 密钥加密后保存在应用私有偏好中，排除云备份与设备迁移。配对码只用于当前操作，不落盘、不写日志。

## <DocIcon name="lock-keyhole" /> Root

已 root 设备可以选择 Root 后端：

1. 在激活页选择 Root。
2. 授予超级用户权限（Magisk / KernelSU 等会弹窗）。
3. 应用通过 `app_process` 拉起特权服务，Binder 回投时校验 root/shell UID 与一次性 token。

Root 路径与 ADB 路径完全独立：`RootUserService` 的忽略安全检查 Context 只存在于特权子进程，不会扩散到普通 app 进程。

::: warning Root 不是「更高级的 ADB」
Root 提供的是不同的启动链路与权限上下文。遇到 ADB 路径失败时，切 Root 可能绕过问题，但不代表问题消失。
:::

## <DocIcon name="plug" /> 外部 Shizuku

已经装了 Shizuku / Sui 并授权的用户：

1. 激活页选择外部服务。
2. 确认 Shizuku 正在运行且已授权本应用。
3. 应用复用其用户服务路径。

如果同时存在内置认证，`SHIZUKU` 后端**优先使用内置连接**；没有内置认证时才回退外部服务。已连接的外部服务会继续运行，重新绑定后走内置路径。

## <DocIcon name="compass" /> 选择逻辑

```text
后端选择
├── 内置 ADB 已激活 → 使用内置
├── 外部 Shizuku 已授权 → 使用外部
└── Root 可用 → 使用 Root
```

实际优先级由 `PermissionManager` 的状态机决定：Shizuku 与 root 连接器只暴露无 Binder 的状态投影，过期连接与死亡回调按 Binder 身份丢弃。

## <DocIcon name="circle-check" /> 验证激活成功

| 检查 | 期望 |
| --- | --- |
| 激活页状态 | 已就绪 / Ready |
| 挂机页 | 能创建虚拟屏并显示画面 |
| 启动任务 | 能截图、点击，任务推进 |
| 日志 | 无 `Binder` 超时、无 `SecurityException` |

## <DocIcon name="wrench" /> 失败排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 配对码输入后无反应 | 未确认 USB 调试授权 | 重新配对，注意系统弹窗 |
| 「配对成功但服务未启动」 | 5555 未监听 / 被系统回收 | 重开无线调试；Android 9–10 重跑 `adb tcpip 5555` |
| Binder 超时 | 特权进程被杀 | 关闭电池优化，重试 |
| 联发科设备启动即崩 | `LoadedApk.makeApplication` 注入 | 应用已用 Context-only 路径规避；仍失败请附日志 |
| 重启后失效 | 正常行为 | 重新激活 |
| 外部 Shizuku 连不上 | 管理器未运行 / 授权被撤 | 打开管理器重新授权 |

启动失败与 Binder 超时可以查看应用私有目录下的：

```text
debug/embedded_adb_launch.log
```

## <DocIcon name="shield" /> 安全边界

| 项 | 设计 |
| --- | --- |
| 服务发布 | 内置路径不发布通用 Shizuku 服务，不为其他应用授权 |
| 回投校验 | 只接受 root/shell UID + 一次性 token，超时/取消即撤销 |
| 进程死亡 | App 进程死亡会销毁特权子进程 |
| 端口 | 客户端只连回环；不对局域网发起连接 |
| 日志 | 配对码不写入日志 |
