---
title: 宿主架构与模块
description: App 壳层、PRoot Runtime、特权服务与网关协议的分层，以及按职责划分的源码地图。
updated: 2026-10-20
---

# 宿主架构与模块

<AndroidStack />

## <DocIcon name="box" /> 分层

| 层 | 进程 | 关键类 | 职责 |
| --- | --- | --- | --- |
| App 壳层 | 主进程 | `AzurPilotApp`、`MainActivity`、`AppRoot` | 初始化、Compose UI、Runtime 控制 |
| 部署 | 主进程 | `RootfsProvisioner` | 首次部署、更新、校验、切换 |
| PRoot | 子进程 | `ProotHost` | 拉起会话、崩溃退避、stdin 保活 |
| 网关 | 主进程 | `AzurPilotGateway` | 唯一的 `/api/v1/ws` 订阅者 |
| 特权 | 独立进程 | `RemoteServiceImpl`、`bridge/` | 虚拟屏、截屏、注入 |
| OCR | `:ocr` | 私有绑定服务 | 推理 API |

## <DocIcon name="rocket" /> 启动顺序

```text
Application.onCreate
  → 仅主进程执行完整初始化（:daemon 只启动最小组件）
  → 加载设置（DataStore）
  → postCreate 按依赖顺序启动常驻服务
      → 日志
      → 权限管理器（探测 ADB / Root / Shizuku）
      → Runtime 控制（若已有 rootfs）
      → 悬浮窗 / 保活 / 前台服务
```

Activity 只管理 splash、edge-to-edge 与保持亮屏。业务状态来自 ViewModel / repository / 状态流，不放在 Activity。

## <DocIcon name="settings" /> 依赖注入

Koin 组合根按领域拆分：

| 模块 | 绑定 |
| --- | --- |
| `CoreModule` | 应用级单例、时钟、调度器 |
| `HostModule` | 宿主服务、设置 |
| `LogModule` | 日志写入器 |
| `OverlayModule` | 悬浮窗与屏保 |
| `PrivilegedModule` | 权限管理器、远程服务 |
| `ProvisionModule` | 部署器 |
| `ProotModule` | PRoot 会话与仓库 |
| `ViewModelModule` | 页面 VM |

新增依赖先定义接口或端口，再在所属模块绑定。`AppCoroutineScope` 是进程级监督 scope，**不能**放 UI 生命周期的工作。

## <DocIcon name="map" /> 源码地图

### Runtime 与 PRoot

| 职责 | 入口 | 约束 |
| --- | --- | --- |
| 首次部署与升级 | `provision/RootfsProvisioner.kt`、`RuntimeArch.kt` | rootfs 是不可变工件，按 ABI 发布 |
| PRoot 会话 | `proot/ProotHost.kt` | App 持有 stdin；关闭 stdin = 通知 Runtime 清理进程组 |
| 运行控制 | `proot/AzurPilotRunController.kt` | 启动/停止状态机 |
| 网关 | `proot/AzurPilotGateway.kt` | 唯一订阅者（上游订阅是整体替换语义） |
| 配置编辑 | `proot/AzurPilotConfigEditor.kt` | 写入远端配置 |
| 覆盖层与种子 | `rootfs/overlays/`、`rootfs/seeds/` | 只处理兼容差异，不覆盖用户配置 |

### 特权与原生

| 职责 | 入口 | 约束 |
| --- | --- | --- |
| 后端选择与授权 | `privileged/PermissionManager.kt` | 统一状态机，过期连接按 Binder 身份丢弃 |
| Shizuku 连接 | `privileged/RemoteServiceManager.kt` | 外部/内置两条路径 |
| root 启动 | `root/RootServiceStarter.kt` | `app_process` + 一次性 token 回投 |
| 特权 IPC | `remote/RemoteServiceImpl.kt` | 拥有虚拟屏、窗口/电源、桥接服务 |
| JNI | `bridge/`、`native/bridge.h` | 帧锁与输入操作码是 ABI |
| root 启动器 | `native/launcher.c` | 必须输出 `liblauncher.so` |

### 设置与界面

| 职责 | 入口 | 约束 |
| --- | --- | --- |
| 应用设置 | `settings/AppSettings.kt` | `@PrefSchema` 生成 snake_case 键 |
| 用户配置 | `config/UserConfigurationStore.kt` | 独立的 JSON DataStore，不与设置混用 |
| Compose 页面 | `ui/settings/`、`ui/azurpilot/`、`ui/logs/` | 状态由 VM/repository 提供 |
| 悬浮窗与屏保 | `overlay/` | 独立 Window，不能读 Activity 配置 |
| 小组件 | `widget/` | 用显式 drawable，不依赖 `?attr` |

### 保活与日志

| 职责 | 入口 |
| --- | --- |
| 前台服务 | `service/RunForegroundService.kt` |
| 多路径保活 | `keepalive/KeepAliveManager.kt` |
| 日志 | `log/`、`constant/AppPaths.kt` |

保活子系统必须可重复启停，设置开关是最终裁决。接收器和服务可能在无 DI 的路径上启动，因此使用受控的进程级管理器入口。

## <DocIcon name="plug" /> 网关协议

Runtime 在 `127.0.0.1:25548` 暴露三类接口：

| 接口 | 鉴权 | 用途 |
| --- | --- | --- |
| `/api/v1/ws` | 会话令牌 | 实例、总览、配置、日志、统计 |
| `/android/*` | `X-AzurPilot-Android-Token` | App 专用薄接口 |
| `/healthz` | 无 | 就绪探测 |

端口来自 `deploy.yaml` 的 `WebuiPort`，修改后 App 在下次启动 Runtime 时读取并一起切换网关、控制与更新接口。

为什么只能有一个 WebSocket 订阅者：上游的订阅是**整体替换**语义，两个订阅者会互相清空主题。所有 UI 与业务通过 `AzurPilotRepository` 的状态流消费。

## <DocIcon name="refresh" /> 两条更新通道

| 通道 | 内容 | 载体 |
| --- | --- | --- |
| App | 宿主代码 | 轻量 APK（双 ABI、无 rootfs） |
| Runtime | rootfs、Python、依赖 | `rootfs-<abi>.tar.xz` |

另有第三条「脚本热更」，只换上游源码与前端，要求 `uv.lock` 不变。

## <DocIcon name="shield" /> 修改时的边界

| 不要 | 因为 |
| --- | --- |
| 让 Compose 直接调 JNI 或 `app_process` | 越过端口边界，测试与回滚都会失控 |
| 用后台启动替代 PRoot 父子关系 | 失去父进程死亡协议，会留孤儿 |
| 在普通进程使用忽略安全检查的 Context | 权限扩散 |
| 重编号输入操作码 / 改 JNI 注册名 | 跨语言 ABI |
| 假设悬浮窗能读 Activity 状态 | 它是独立 Window |

## <DocIcon name="circle-plus" /> 新功能放哪里

1. 先找现有边界（端口、仓库、状态流）。
2. 在实现侧添加能力。
3. 通过已有端口暴露给 UI。
4. 补最小验证：Kotlin 编译、原生构建、真机回归。

如果必须新增边界，先写清楚生命周期与线程约束的 KDoc，再实现。
