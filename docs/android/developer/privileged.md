---
title: 特权服务与原生桥
description: 内置 ADB、Root 与外部 Shizuku 三种后端，AIDL 接口、TCP 22301 线协议、JNI 帧与输入 ABI、共享内存截帧与虚拟屏管理。
updated: 2026-11-08
---

# 特权服务与原生桥

没有特权，宿主只能看不能动：创建虚拟屏、读取帧缓冲、注入触控都需要 shell 级权限。这一层是整个 Android 版最敏感、也最容易改出安全问题的地方。

## <DocIcon name="box" /> 三种后端

| 后端 | 启动方式 | 凭据 | 生命周期 |
| --- | --- | --- | --- |
| 内置 ADB | `adb shell app_process` | 系统配对 + RSA | 本次开机 |
| Root | `su -c app_process` | root 授权 | 常驻 |
| 外部 Shizuku | Shizuku 用户服务 | 管理器授权 | 由管理器决定 |

`PermissionManager` 暴露一个**无 Binder 的状态投影**：UI 只看到「未激活 / 激活中 / 就绪 / 失败」，看不到 Binder 对象，也不会误持过期连接。死亡回调按 Binder 身份丢弃。

### 内置 ADB 的实现

移植自 [shizuku-m](https://github.com/wess09/shizuku-m)（Apache-2.0，commit `bcb2b62`）：

```text
无线调试配对（SPAKE2）
  → 生成/复用 RSA 身份（Keystore AES-GCM 加密）
    → adb connect 127.0.0.1:5555
      → app_process 拉起 RemoteServiceImpl
        → Binder 经 bootstrap provider 回投
          → 校验 shell UID + 一次性 token
```

几个关键决策：

- **不发布通用 Shizuku 服务**。它只用已认证的 shell 启动本项目自己的服务，不为其他应用授权。
- **Context-only 初始化**。`ShellServiceStarter` 避开联发科对 `LoadedApk.makeApplication` 的注入，这是 MTK 设备启动崩溃的根因。
- **`setsid` 与标准流分离后才返回**。否则 adb 命令结束会清理掉刚启动的服务。
- **一次性 token**。超时、取消、解绑都会撤销；App 进程死亡会销毁特权子进程。

::: danger 5555 端口
系统 adbd 监听 5555，可能对局域网开放。客户端只连 `127.0.0.1`，但 adbd 仍要求系统认可的 RSA 密钥。不要在公共网络长期开启无线调试。
:::

### Root

`RootServiceStarter` 通过 `app_process` 启动服务，Binder 回投只接受 root/shell UID 与一次性 token。

`RootUserService` 持有一个忽略安全检查的 Context，但它**只存在于特权子进程**，不能扩散到普通 app 进程。改这段代码时，任何把该 Context 传回主进程的行为都是安全漏洞。

## <DocIcon name="plug" /> 进程与接口

```text
主进程 ──AIDL──▶ 特权进程（RemoteServiceImpl）
                    ├── 虚拟显示管理
                    ├── 窗口 / 电源控制
                    ├── 桥接截屏（libbridge.so）
                    ├── 输入注入（libbridge.so）
                    └── 原生桥服务（BridgeServer, 127.0.0.1:22301）
```

| 边界 | 规则 |
| --- | --- |
| AIDL | app 侧只通过端口调用，不直接访问 hidden API |
| JNI | `libbridge.so` 只运行在特权进程 |
| 帧锁 | `GetLockedPixels` 与 `UnlockPixels` 必须严格配对 |
| 输入 | 操作码与 JNI 注册名是跨语言 ABI，不能重编号或随意改名 |
| 启动器 | `launcher.c` 必须输出 `liblauncher.so`，才能落到 `nativeLibraryDir` |

::: warning 帧指针会失效
`GetLockedPixels` 返回的指针在 `UnlockPixels` 之后立即失效。把它缓存起来跨帧使用会读到脏数据或崩溃。
:::

## <DocIcon name="network" /> 特权桥线协议（TCP 22301）

桥服务由 `BridgeServer.kt` 承载，只监听 `127.0.0.1:22301`，供 PRoot 内的 Python 运行时连接。该接口仅限本机回环，严禁对外暴露或端口映射。特权进程具备全套截图、输入与 shell 注入能力，任何协议改动都必须满足最小权限约束。

### 帧格式

1. 客户端发送单行 UTF-8 JSON，并以 `\n` 结尾；单行上限为 64 KiB，超限连接立即关闭。
2. 服务端在成功或错误响应中回显请求携带的可选 `id` 字段（缺失时回显 `null`）。
3. 文本响应为单行 UTF-8 JSON + `\n`。
4. `screencap` 成功时先输出一行 JSON 元数据，随后紧接写入 `length` 字节的原始 BGR888 像素数据。客户端必须严格读完指定字节后才能处理下一条指令。

### 核心端点

| 端点 | 参数 | 成功响应 | 约束与说明 |
| --- | --- | --- | --- |
| `ping` | 无 | `ok`、`pong`、`displayId`、`capture`、`uptime`、`capabilities` | 返回当前虚拟屏状态与能力字典，如 `equipmentCode`、`sharedMemoryScreencap`、`nativeGameResolution`、`appFocus`。 |
| `screencap` | 无 | 元数据行（`width`、`height`、`channels=3`、`length`、`frames`）+ 原始 BGR888 字节 | `frames` 记录帧序号，值不变代表画面冻结（例如被 ROM 进程冻结）。尺寸不符时返回错误 JSON，不发送字节流。 |
| `click` | `x`、`y` | `ok=true` | 注入至当前虚拟屏，无活动虚拟屏时返回错误。 |
| `swipe` | `x1`、`y1`、`x2`、`y2` | `ok=true` | 可选 `duration`（毫秒），负数按 0 处理。 |
| `equipment_code_read` | 无 | `ok=true`、`code` | 从系统剪贴板首项读取装备码，无有效码返回 `code=null`，不展开 URI。 |
| `equipment_code_input` | `code` | `ok=true` | 仅接受 16–4096 字符的合规 Base64 装备码。在虚拟屏已聚焦输入框注入 Ctrl+A、Delete、文本与 Enter，序列预算 10 秒。 |
| `shell` | `cmd` | `ok`、`code`、`stdout`、`stderr` | 可选 `timeout`（秒）；每个输出流至多保留 64 KiB。 |
| `app_prepare` | `package`、`displayId` | `ok=true` | 要求 `nativeGameResolution=true`；在当前 1280×720 虚拟屏关闭目标包的标准及 APS 兼容缩放，回读验证并在 APS 设备上强停旧进程。 |
| `app_focus` | `package`、`displayId` | `ok=true`、`displayId` | 要求 `appFocus=true`；在虚拟屏顶层窗口注入 down/cancel 触摸事件恢复焦点，不触发点击，重试预算 3 秒。 |

### 并发与锁边界

- `screencap`、`click`、`swipe` 与装备码接口共享特权进程的设备互斥锁，彼此互斥串行。
- `shell` 不占用设备锁。
- 客户端仍须自行维护单个设备操作序列有序，不应利用服务端线程细节进行并发请求。

## <DocIcon name="monitor" /> 虚拟屏与共享内存截帧

虚拟屏是后台挂机的核心：

- 游戏 Activity 运行在独立 Display 上，主屏可以正常使用。
- 截帧通道分为 **共享内存截帧 v1** 与 **TCP 字节流**。
- 输入通过桥接注入到虚拟屏，不干扰主屏触控。

### 共享内存截帧 v1

`ping` 返回 `capabilities.sharedMemoryScreencap=true` 时启用：

1. 抽象 Unix 套接字 `com.azurpilot.ghio.frames.v1` 监听同 UID 连接。
2. 主应用接受连接后，通过固定 Binder 事务 78（`openSharedFrameChannel`）向特权服务交付连接 FD（设置 60 秒超时），避免跨 SELinux 域的端口监听限制。
3. 客户端发送 `{"method":"open","version":1}`，服务端通过 `SCM_RIGHTS` 交付仅限只读 mmap 的匿名内存 FD。
4. 随后发送 `{"method":"screencap"}`，响应仅包含元数据（`transport="shared_memory"`），无像素尾随，像素在响应前由 native 完成 memcpy。
5. **截帧不占输入锁**：共享内存截帧与滑动/点击互不阻塞。每个连接独立拥有映射，最多支持 8 个连接，单映射上限 32 MiB。

实测帧延迟：匿名共享内存约 15.6 ms，TCP 通道约 47.2 ms。数据只在 RAM 流转，不落 Flash。

### 运行时覆盖层自动同步

Runtime 镜像中的 `rootfs/overlays/` 包含以下与特权桥配合的兼容层：

- `android_equipment.py`：装备码读写适配，通过 `equipment_code_*` 桥端点工作，不启用 FastInputIME 也不回退主屏。
- `android_device.py`：虚拟屏前台检测，精确解析 `Display: mDisplayId=…` 匹配桥返回的 ID，仅查询目标屏窗口与恢复的 Activity。
- `android_capture.py`：优先连接共享内存截帧通道，失败时平滑回退到 TCP 22301。
- `android_app_launch.py`：拉起游戏并调用 `app_prepare` 与 `app_focus`。

APK 在**每次 Runtime 启动前**自动将这些覆盖层文件同步至运行时目录，确保上游源码热更不会覆盖或破坏特权桥补丁。

### SDK 弹窗搬回

部分定制 ROM 会把厂商/渠道 SDK 的登录、实名、支付 Activity 重定向到默认显示器。`SdkTaskRepatriator` 在游戏运行期间把这些页面搬回虚拟屏，否则脚本会「看到」一个不属于游戏的界面。

这是与 OEM 行为强相关的补丁，改动必须真机验证，模拟器覆盖不到。

## <DocIcon name="shield" /> 安全边界

| 攻击面 | 防护 |
| --- | --- |
| Binder 回投 | 只接受 root/shell UID + 一次性 token |
| 配对码 | 仅当前操作，不持久化、不写日志 |
| RSA 私钥 | Keystore AES-GCM 加密，排除云备份与设备迁移 |
| 外部服务 | 复用其授权，不扩大权限 |
| 调试端口 | 客户端只连回环；提示用户关闭无线调试 |

## <DocIcon name="circle-check" /> 静态源码检查与真机验证

特权层涉及 Linux 系统调用与 OEM 定制行为，**必须严格区分静态验证与真机验证**：

### 1. 静态源码与离线单测

在开发机或 CI 上运行，不依赖物理设备连接：

```bash
cd app

# Kotlin 语法与类型校验（必跑）
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime

# ADB 运行时加密与协议单测
./gradlew :adb-runtime:testDebugUnitTest

# 原生桥与打包流水线编译
./gradlew assembleDebug -Pazurpilot.slimApk=true

# 特权桥覆盖层 Python 单测（前台探测、装备码协议、拉起聚焦）
cd ..
uv run --with psutil --with numpy --with pyyaml python -m unittest \
  rootfs/tests/test_android_device.py \
  rootfs/tests/test_android_equipment.py \
  rootfs/tests/test_android_app_launch.py
```

### 2. 真机集成验证（不可由静态分析替代）

下列项目涉及内核 IPC、DisplayManager 与厂商 ROM 特殊行为，静态测试通过**不代表真机功能正常**：

- **系统无线调试配对**：SPAKE2 握手、RSA 密钥存入 Android Keystore（AES-GCM）、通知栏填码与分屏填码。
- **虚拟屏创建与生命周期**：不同 Android 版本的 VirtualDisplay 私有标志、Activity 绑定与黑屏恢复。
- **触控与输入注入**：逐键发送 Ctrl+A、Delete、Base64 装备码文本与 Enter 的实际生效情况。
- **OEM 弹窗搬回**：小米/华为等系统在登录与支付时将 SDK 窗口强制弹出至主屏，需实测 `SdkTaskRepatriator` 搬回。
- **整机重启后的重新激活**：验证重启后调试状态失效能否被应用优雅捕获并引导。

2026-10-13 在 Redmi Note 10 Pro（Android 11 / API 30）验证通过真实系统配对与虚拟屏创建；整机重启后的重新激活仍需人工验收。

```bash
# 设备自动化测试（需要已连接 ADB 的真机）
./gradlew :app:connectedDebugAndroidTest -PembeddedAdbTestsOnly=true
```

## <DocIcon name="clipboard" /> 修改检查清单

- [ ] 新后端是否接入统一状态机，而不是绕过 `PermissionManager`
- [ ] Binder 回投是否校验 UID 与 token
- [ ] 帧锁是否成对释放，共享内存映射是否正确关闭
- [ ] 输入操作码与线协议字段是否保持向后兼容
- [ ] 原生库是否命名为 `lib*.so`
- [ ] 静态 `compileDebugKotlin` 与覆盖层单测均已通过
- [ ] 是否在真机上验证（不是只看静态编译通过）
- [ ] 是否检查了 MTK / 小米 / 华为等 OEM 差异


## 首帧尚未就绪时的有界重试

虚拟屏刚创建或重建后，游戏可能尚未渲染第一帧。共享内存截帧通道会进行有界等待：

- 等待预算约 **3 秒**，按 **200 ms** 间隔重试。
- 等待只占用当前连接的客户端线程，不阻塞帧生产线程或其他连接。
- 真正没有画面的虚拟屏仍会在预算耗尽后返回错误；这不是无限等待，也不能替代虚拟屏创建成功检查。
- 预算低于客户端 5 秒 socket 超时，用于吸收重建后的瞬时首帧竞态。

TCP 截帧通道也有对应的有界重试。若持续超时，仍应检查虚拟屏状态、游戏是否启动及特权桥能力。
