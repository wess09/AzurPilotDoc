---
title: 连接模拟器与 ADB
description: 配置模拟器 Serial、游戏服务器、截图与控制方案，以及自动重启、SSH 远程管理和性能测试。
updated: 2026-10-20
---

# 连接模拟器与 ADB

设备层是核心程序与游戏之间唯一的 I/O 通道。它只做四件事：连上 ADB、拿到截图、注入点击、管理游戏应用。理解这四件事，就能定位绝大多数「连不上 / 识别错 / 点不准」的问题。

## <DocIcon name="plug" /> 连接链路

```text
gui.py / alas.py
   └── Device
        ├── Connection（adb 路径、serial、端口转发）
        ├── Screenshot（按配置分发到具体后端）
        ├── Control（点击 / 滑动 / 拖拽）
        └── Platform（模拟器发现与启停）
```

`Device` 在首次构造时会自动启动模拟器（最多 4 次）、跑一次简化基准测试，并预热控制后端。调度器里的 `Device` 则以 `auto_start_emulator=False` 创建——**模拟器该不该重启由调度器决定，不由设备层决定**。

## <DocIcon name="clipboard" /> 必填项

| 配置项 | 字段 | 说明 |
| --- | --- | --- |
| 模拟器 Serial | `Emulator.Serial` | ADB 地址或 `auto` |
| 游戏服务器 | `Emulator.PackageName` | 游戏包名，默认 `auto` |
| 截图方案 | `Emulator.ScreenshotMethod` | 默认 `auto` |
| 控制方案 | `Emulator.ControlMethod` | 推荐 `MaaTouch` |
| 游戏内服务器 | `Emulator.ServerName` | 用于维护检测，可禁用 |

### <DocIcon name="smartphone" /> Serial 怎么填

| 场景 | 填法 |
| --- | --- |
| 只有一台模拟器 | `auto` |
| 多开，或同时开了多个模拟器 | 明确的 `host:port` |
| MuMu 12 | `127.0.0.1:16384`（多开依次递增） |
| 雷电 | `emulator-5554` 或 `127.0.0.1:5555` |
| 蓝叠 Hyper-V | `bluestacks5-hyperv`，多开加 `-1`、`-2` |

查询真实 Serial：在模拟器安装目录找到 `adb.exe`，执行 `adb devices`。状态必须是 `device`；`offline` 表示 ADB 版本不匹配或连接卡死，`unauthorized` 表示设备未授权。

### <DocIcon name="cloud" /> 游戏服务器

| 服务器 | 包名 |
| --- | --- |
| 国服 | `com.bilibili.azurlane` |
| 国际服 | `com.YoStarEN.AzurLane` |
| 日服 | `com.YoStarJP.AzurLane` |
| 台服 | `com.hkmanjuu.azurlane.gp` |

渠道服使用各自的包名（华为、小米、OPPO、vivo、应用宝、4399 等），完整列表在配置下拉框中。模拟器里装了多个客户端时必须手动指定，否则 `auto` 可能选错。

## <DocIcon name="eye" /> 截图方案

截图速度直接决定状态循环的节奏：通用 `adb exec-out screencap` 一张要 300–500 ms，而模拟器内部通道只要几十毫秒。

| 方案 | 适用 | 说明 |
| --- | --- | --- |
| `auto` | 默认 | 跑一次基准测试后选最快 |
| `DroidCast_raw` | 通用 | 通常最快，需要模拟器允许安装配套应用 |
| `ADB_nc` | 通用 | netcat 通道，兼容性好 |
| `ADB` | 兜底 | 最慢但最稳 |
| `uiautomator2` | 兜底 | 与控件操作共用连接 |
| `aScreenCap` / `aScreenCap_nc` | 部分设备 | 需要推送二进制 |
| `nemu_ipc` | MuMu 12 | 走模拟器 IPC，低延迟 |
| `ldopengl` | 雷电 | 直读 OpenGL 缓冲 |
| `azurpilot_android` | Android 宿主 | 共享内存帧通道，必须选这个 |

::: warning nemu_ipc 的触控限制
`nemu_ipc` 截图需要搭配对应触控实现。它在低性能机器上滑动容易丢步、拖拽容易变形，偶发调用挂死会丢点击。滑动异常时改回 `MaaTouch`。
:::

## <DocIcon name="hand" /> 控制方案

| 方案 | 速度 | 说明 |
| --- | --- | --- |
| `MaaTouch` | 快 | 推荐；兼容新安卓 |
| `minitouch` | 快 | 部分新设备不稳定 |
| `ADB` | 中 | 用 `input tap/swipe`，最兼容 |
| `uiautomator2` | 慢 | 依赖无障碍服务 |
| `Hermit` | 中 | 特定环境使用 |
| `azurpilot_android` | 快 | Android 宿主桥接注入 |

点击不是「点坐标」这么简单：设备层会在按钮区域内随机取点、滑动使用贝塞尔曲线并加入抖动，以接近人手轨迹。这些是内置行为，没有配置项。

## <DocIcon name="settings" /> 模拟器管理

「系统设置 → 模拟器设置」里可以登记模拟器类型、安装路径与实例名。登记正确后，调度器才能执行：

- <DocIcon name="clock" /> **计划重启**：`Alas.EmulatorManagement.ScheduledEmulatorRestart` 开启后，按 `RestartIntervalHours`（默认 4 小时）在任务间隙重启模拟器。
- <DocIcon name="zap" /> **强制计划重启**：`ForceScheduledRestart` 允许在任务运行中打断。
- <DocIcon name="wrench" /> **故障重启**：连续卡死或 ADB 离线达到阈值后自动重启；失败不放弃，只拉长间隔。
- <DocIcon name="refresh" /> **深度重启**：`DeepRestartAfterFailures`（默认 0，关闭）连续失败 N 次后对 MuMu 执行深度重启，清理僵死进程。

### <DocIcon name="key" /> SSH 远程管理

模拟器跑在另一台机器（NAS、服务器、云主机）上时，可以开启 `EnableRemoteSSH`，在重启模拟器前后执行远程命令：

| 字段 | 用途 |
| --- | --- |
| `RemoteSSHHost` / `Port` / `User` | SSH 连接信息 |
| `RemoteSSHPublicKey` | 私钥内容（注意保管） |
| `RemoteStartCommand` / `RemoteStopCommand` | 启动 / 停止容器或服务的命令 |

这适合「模拟器跑在 Docker 里」的场景：重启动作实际是 `docker restart <容器>`。

::: danger 私钥不要外泄
SSH 私钥以明文保存在实例配置中。导出配置或提交 Issue 前，确认已删除该字段。
:::

## <DocIcon name="shield" /> 服务器维护检测

`Emulator.ServerName` 选择游戏内服务器后，调度器会在每轮开始前检查服务器状态：

- <DocIcon name="clock" /> 维护中 → 阻塞等待，不反复重启游戏。
- <DocIcon name="refresh" /> 恢复瞬间 → 刷新配置并注入 `Restart`，因为阻塞期间游戏状态已经失效。
- <DocIcon name="circle-alert" /> 状态 API 不可达 → 回退直连游戏网关；仍不可用则按不可用处理。

不知道自己在哪个服，或状态 API 经常超时，就选「不使用检测」。

## <DocIcon name="zap" /> 性能测试

「工具 → 性能测试」会逐一尝试截图与控制方案并记录耗时，结果写回配置。首次连接时的简化基准只测常用方案；怀疑某个方案拖慢整体节奏时，跑一次完整测试。

OCR 也有独立的基准任务（`OcrBenchmark`），用于选择 CPU / GPU 推理设备。

## <DocIcon name="message" /> 常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `adb devices` 为空 | 模拟器未开 ADB 调试 | 在模拟器设置中开启「ADB 调试」 |
| 设备 `offline` | ADB 版本冲突 | 用模拟器自带的 adb，或重启 adb server |
| 截图全黑 | 模拟器使用独立渲染后端 | 换 `DroidCast_raw` 或 `nemu_ipc` |
| 点击偏移 | 分辨率不是 1280×720 | 调整模拟器分辨率与 DPI |
| 频繁 `GameStuckError` | 帧率过低或动画被跳过 | 游戏帧数设 60，关闭加速跳过 |
| 重启模拟器无效 | 未登记安装路径 | 填写 `EmulatorInfo.name` 与 `path` |

更完整的排查顺序见[故障排查 · 核心程序](/troubleshooting/azurpilot)。
