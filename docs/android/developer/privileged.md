---
title: 特权服务与原生桥
description: 内置 ADB、Root 与外部 Shizuku 三种后端，AIDL 接口、JNI 帧/输入 ABI、虚拟屏与 SDK 弹窗搬回。
updated: 2026-10-20
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
                    └── 输入注入（libbridge.so）
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

## <DocIcon name="monitor" /> 虚拟屏

虚拟屏是后台挂机的核心：

- 游戏 Activity 运行在独立 Display 上，主屏可以正常使用。
- 帧通过共享内存通道送回宿主（Unix 抽象域套接字 + `SCM_RIGHTS` 传句柄）。
- 输入通过桥接注入到虚拟屏，不干扰主屏触控。

实测帧延迟：匿名共享内存约 15.6 ms，TCP 通道约 47.2 ms。数据只在 RAM 流转，不落 Flash。

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

## <DocIcon name="circle-check" /> 验证

```bash
cd app

# Kotlin 编译
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime

# ADB 运行时单测
./gradlew :adb-runtime:testDebugUnitTest

# 设备测试（需要真机）
./gradlew :app:connectedDebugAndroidTest -PembeddedAdbTestsOnly=true

# 原生桥构建
./gradlew assembleDebug -Pazurpilot.slimApk=true
```

设备测试覆盖：加密密钥持久化、平台 TLS exporter、SPAKE2 正确配对与错误码拒绝、shell UID、原生桥、虚拟屏创建、解绑重连、服务死亡恢复。

2026-10-13 在 Redmi Note 10 Pro（Android 11 / API 30）验证通过真实系统配对与虚拟屏创建；整机重启后的重新激活仍需人工验收。

## <DocIcon name="clipboard" /> 修改检查清单

- [ ] 新后端是否接入统一状态机，而不是绕过 `PermissionManager`
- [ ] Binder 回投是否校验 UID 与 token
- [ ] 帧锁是否成对释放
- [ ] 输入操作码是否保持不变
- [ ] 原生库是否命名为 `lib*.so`
- [ ] 是否在真机上验证（不是只编译）
- [ ] 是否检查了 MTK / 小米 / 华为等 OEM 差异
