---
title: 宿主架构与模块
description: App 壳层、PRoot Runtime、特权服务、原生桥协议、网关与 Docker 上报微服务的分层架构及源码地图。
updated: 2026-11-12
---

# 宿主架构与模块

<AndroidStack />

## <DocIcon name="box" /> 分层

| 层 | 进程 / 载体 | 关键类与位置 | 职责 |
| --- | --- | --- | --- |
| App 壳层 | 主进程 | `AzurPilotApp`、`MainActivity`、`AppRoot` | 初始化、Compose UI、Runtime 控制 |
| 部署 | 主进程 | `RootfsProvisioner` | 首次部署、更新、校验、切换 |
| PRoot | 子进程 | `ProotHost` | 拉起会话、崩溃退避、stdin 保活 |
| 网关 | 主进程 | `AzurPilotGateway` | 唯一的 `/api/v1/ws` 订阅者 |
| 特权与原生桥 | 独立进程 | `RemoteServiceImpl`、`BridgeServer`、`libbridge.so` | 虚拟屏、TCP 22301 线协议、共享内存截帧、输入注入 |
| OCR | `:ocr` | 私有绑定服务 | LiteRT/MNN 推理 API |
| 机型上报服务 | 腾讯云 Docker 容器 | `server/device-report/` | 接收签名上报、持久化去重、写入 GitHub Issue #1 评论 |

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
| 特权 IPC | `remote/RemoteServiceImpl.kt` | 拥有虚拟屏、窗口/电源控制 |
| 特权桥线协议 | `remote/internal/BridgeServer.kt` | 监听 `127.0.0.1:22301`，9 个协议端点 |
| 共享内存通道 | `remote/internal/SharedFrameServer.kt` | Unix 抽象套接字 `com.azurpilot.ghio.frames.v1`，Binder 事务 78 |
| JNI 帧与输入 | `bridge/`、`native/bridge.h` | 帧锁与输入操作码是 ABI |
| root 启动器 | `native/launcher.c` | 必须输出 `liblauncher.so` |

### 服务端与机型上报

| 职责 | 入口 | 约束 |
| --- | --- | --- |
| Go 报告服务 | `server/device-report/main.go` | 无独立 DB，内存目标 48 MiB，正文签名验证 |
| Docker 编排 | `server/device-report/deploy/compose.yaml` | 单核调度、96 MiB 硬限、挂载持久化状态目录 |
| 上报客户端 | `app/.../report/DeviceReportClient.kt` | 构造带时间戳/nonce 的 SHA256withRSA 正文签名 |

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

## 统计模块与数据流

`AzurPilotPage.kt` 将 `AzurPilotSection.Statistics` 映射到 `StatisticsSection`。查询以当前选中的 Runtime 实例为边界，顶部下拉在八类报表和资源管理之间切换。

| 层 | 源码入口 | 职责 |
| --- | --- | --- |
| 原生 UI | `sections/StatisticsSection.kt`、`ResourceManagementSection.kt`、`StatisticsContent.kt` | 报表选择、筛选、指标卡、趋势、表格和资源管理 |
| 数据模型 | `proot/AzurPilotStatistics.kt`、`AzurPilotResourceFlows.kt` | 解码指标、序列、表格、库存、流水和证据类型 |
| 资源 | `sections/StatisticsAssets.kt`、`assets/statistics.zip` | 提供统计项图标与多语言名称映射 |
| 导出 | `sections/StatisticsExport.kt` | 通过 Android 文档选择器导出 CSV |
| Core API | `module/api/statistics_service.py`、`module/statistics/resource_flow.py`、`frontend/src/api/contract.json` | 统计报表、资源流水和本地掉落重算的契约与实现 |

- `statistics.report` 返回指标卡、趋势序列、表格、备注和任务候选项；它是查询接口。
- `statistics.resourceFlows` 返回库存余额、按资源 / 任务汇总的收支，以及分页流水。
- `statistics.refreshLoot` 只重新汇总本地已记录的掉落数据，不会操作游戏。
- `StorageStatistics` 是显式启动的仓库采集任务；刷新报表只读取最近一次完整快照，不会自动扫描。
- 当前库存允许为未知值（`null`）；没有有效快照时不得把空值解释为 0。CSV 由 Android 客户端导出。

用户操作与筛选说明见[控制台与统计](/android/user/console)。

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

## <DocIcon name="cloud" /> 机型上报与 Docker 微服务

为收集 Android 生态下不同机型与定制系统上的实际兼容情况，宿主设计了客户端机型上报与服务端 Docker 收集微服务（`server/device-report/`）：

```text
Android 客户端（设置 → 提交机型）
  → 本地只读检测厂商属性与 Google 机型目录
    → SHA256withRSA / PKCS#1 v1.5 私钥对正文签名
      → POST https://afa-api.azurpilot.com/v1/device-reports
        → Cloudflare 边缘（mTLS 终止与限流）
          → Nginx 反代 → 本机 127.0.0.1:18882
            → Docker 容器（afa-api，Go 标准库实现）
              ├── 校验时间戳（±5 分钟）与 32 字符 Hex nonce 防重放
              ├── 校验客户端公钥签名与 8 KiB 正文长度
              ├── 原子比对持久化去重状态 state.json
              └── 持有服务端专用 GITHUB_TOKEN → POST Issue #1 评论
```

### 微服务架构设计与约束

1. **公网端点**：`https://afa-api.azurpilot.com/v1/device-reports`。生产目录为 `/srv/agentdock/AgentDock/afa-api`。
2. **认证分层**：Cloudflare 边缘执行客户端 TLS 验证；Docker 服务端使用已钉住的公开证书（`client-cert.pem`）独立校验 HTTP 正文签名（`X-Report-Timestamp`、`X-Report-Nonce`、`X-Report-Signature`）。
3. **极简低资源开销**：Go 标准库静态二进制，以非 root 用户在 Docker 内运行；设置 `GOMEMLIMIT=48MiB` 内存软目标、96 MiB 容器硬上限与 `cpus: "1.0"` 单核配额。
4. **状态与去重机制**：无独立数据库进程，挂载外部目录 `/srv/agentdock/AgentDock/afa-api-state/state.json`。只记录报告哈希、创建时间、评论 ID 与链接，**不持久化报告正文、不记录 IP**。容量上限 10,000 条，写操作前持久化待确认状态，并发重试时利用 Issue #1 隐藏标记对齐，防止因 GitHub 延迟导致刷评。
5. **权限隔离**：GitHub API Token 仅在服务端 `deploy/private/service.env`（权限 0600）提供，目标限定在 `wess09/AzurPilot-for-Android` 的固定 Issue #1，永远不进入 APK。

## <DocIcon name="shield" /> 修改时的边界

| 不要 | 因为 |
| --- | --- |
| 让 Compose 直接调 JNI 或 `app_process` | 越过端口边界，测试与回滚都会失控 |
| 用后台启动替代 PRoot 父子关系 | 失去父进程死亡协议，会留孤儿 |
| 在普通进程使用忽略安全检查的 Context | 权限扩散 |
| 重编号输入操作码 / 改 JNI 注册名 | 跨语言 ABI |
| 假设悬浮窗能读 Activity 状态 | 它是独立 Window |
| 把服务端 GITHUB_TOKEN 打进 APK | 造成 GitHub 凭据泄露 |
| 仅凭静态编译通过就认定设备功能就绪 | 虚拟屏、OEM 触控注入与 SPAKE2 配对具有强硬件与 ROM 依赖 |

## <DocIcon name="circle-plus" /> 新功能放哪里

1. 先找现有边界（端口、仓库、状态流、微服务）。
2. 在实现侧添加能力。
3. 通过已有端口暴露给 UI。
4. 严格执行双层验证：
   - **静态验证**：Gradle `compileDebugKotlin`、Go 测试与 vet、Python 覆盖层单测；
   - **真机验证**：在实体 ARM64 设备上验证虚拟屏生命周期、输入穿透与断电/重启表现。

如果必须新增边界，先写清楚生命周期与线程约束的 KDoc，再实现。
