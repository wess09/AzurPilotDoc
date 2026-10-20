---
title: 更新、备份与排障
description: APK、Runtime 与脚本热更三条通道的区别，整包与热更的判定，以及数据备份和常见故障处理。
updated: 2026-10-20
---

# 更新、备份与排障

Android 版有三条独立的更新通道。分不清它们，就会出现「点了更新但功能没变」或者「只想换界面却重下了 1 GB」。

## <DocIcon name="refresh" /> 三条通道

| 通道 | 更新什么 | 触发 | 保留数据 |
| --- | --- | --- | --- |
| App（APK） | Kotlin 宿主、原生桥、UI | 应用内检查 / 覆盖安装 | 是 |
| Runtime（整包） | Ubuntu rootfs、Python、依赖、OCR | 设置页整包更新 | 是（config / log 保留） |
| 脚本热更 | 上游 AzurPilot 源码 + 前端 dist | 自动（空闲时）/ 手动 | 是 |

### <DocIcon name="smartphone" /> App 更新

- 轻量增量 APK 双 ABI、无 rootfs，下载量小。
- 下载完成后校验大小与 SHA-256，再交给系统安装器。
- **签名必须一致**：debug 与 release 不能互相覆盖，否则 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`，只能卸载重装（数据全丢）。
- 版本码回落时用 `adb install -r -d`。

### <DocIcon name="package" /> Runtime 整包更新

判定依据是 `BUILD_MANIFEST.rootfs_version`：

```text
<上游提交前 12 位>-<构建输入哈希前 10 位>
```

- 哈希相同、提交不同 → 设置 `commitOnly`，优先热更。
- 哈希不同 → 必须整包重部署（Python、系统库、overlay、依赖变了）。

整包更新会保留 `config/`（含 SQLite、实例目录）、`password.txt` 与 `log/`；模板与部署种子用新镜像的版本。

### <DocIcon name="zap" /> 脚本热更

热更只换源码与前端，不换 Python 与系统库。流程：

1. 检查目标提交（默认跟随构建清单记录的分支）。
2. 浅拉确切提交到 `/opt/azurpilot-update/source`（优先 CNB，失败回退 GitHub 镜像）。
3. **比较 `uv.lock`**：不同则返回 `requiresRuntimeUpdate=true`，不热更，交给整包。
4. 在候选目录 `npm ci` + `npm run build`（超时 600 秒）。
5. 构建成功后记录事务日志，安全停止实例。
6. 备份旧 dist → 切换源码 → 安装新 dist → 原子更新清单 → 重载并恢复实例。
7. 任一步失败，恢复旧源码、dist 与清单。

::: warning 热更不会装依赖
依赖安装被刻意关闭，避免未经构建与 OCR 验证的环境进入正式版本。`uv.lock` 一变，就必须整包。
:::

自动热更只在调度器与工具空闲时应用；手动更新会恢复原有的实例运行状态。热更与整包共用同一把流水线锁。

## <DocIcon name="compass" /> 什么时候该用哪种

| 你的情况 | 应该 |
| --- | --- |
| 只是上游脚本更新（无依赖变化） | 热更 |
| 上游改了依赖 / Python 版本 | 整包 |
| 宿主界面或原生桥变化 | APK |
| 换手机、重装 | 完整版 APK + 恢复配置 |
| 更新后启动崩溃 | 看事务日志，回滚；仍失败则整包 |

## <DocIcon name="drive" /> 备份

| 内容 | 位置 | 说明 |
| --- | --- | --- |
| 实例配置 | Runtime `config/*.json` | 最重要 |
| 部署配置 | `config/deploy.yaml` | 含密码，勿外传 |
| 统计数据库 | `config/azurpilot.db` | 历史数据 |
| 日志 | `log/` 与 `proot/session.log` | 排障用，7 天轮转 |
| 远程身份 | `config/remote-access.json` | 需要保留固定入口时 |

导出方式：

1. 设置 → 日志 → 导出（zip）。
2. 或 `adb pull /sdcard/Android/data/com.azurpilot.ghio/files/`（部分文件需 root）。

::: danger 卸载即清空
卸载应用会删除 Runtime、配置、统计与日志，没有云端副本。升级前先导出。
:::

## <DocIcon name="wrench" /> 排障

### <DocIcon name="circle-alert" /> Runtime 起不来

| 现象 | 检查 |
| --- | --- |
| 状态 `NotInstalled` | 是否点了「下载 Runtime」 |
| 状态 `LowDisk` | 可用空间是否 ≥ 2 GB |
| 状态 `NotBundled` | 是否装了轻量包但 Release 无本架构 |
| `Failed` | 展开 `reason`；换下载源重试 |
| WebUI 90 秒未就绪 | 首次启动重建字节码，属预期；等待 |

### <DocIcon name="circle-alert" /> 启动后闪退

- 架构不符（x86 包装到 ARM 机）。
- 外部存储未挂载（应用会快速失败）。
- 签名冲突导致实际没装上。

### <DocIcon name="lock" /> 权限被系统回收

厂商 ROM 会在后台清理权限：

- 悬浮窗权限被撤销 → 浮窗消失。
- 电池优化白名单被重置 → 息屏后进程被杀。
- 调试授权被撤销 → 特权服务失效，需重新激活。

处理：重新授权，并把应用加入自启动/后台白名单。

### <DocIcon name="circle-alert" /> 任务中断

| 线索 | 可能原因 |
| --- | --- |
| 日志突然截断，无异常栈 | 进程被系统杀死 |
| `EmulatorNotRunningError` | 虚拟屏或特权服务失效 |
| `ScriptError` 连续 3 次 | 代码缺陷，需更新 |
| 热更后启动崩溃 | 事务回滚失败，查 `config/android-update-transaction.json` |
| 构建前端超时 | 设备性能不足或网络差，保持旧版重试 |

### <DocIcon name="clipboard" /> 收集诊断信息

```bash
# 应用日志
adb logcat -v time --pid=$(adb shell pidof com.azurpilot.ghio)

# Runtime 会话
adb shell tail -n 200 /sdcard/Android/data/com.azurpilot.ghio/files/log/proot/session.log

# 转发 WebUI 端口
adb forward tcp:25548 tcp:25548
```

Windows 可用仓库的 `tools/watch-android-logs.ps1`，默认跟踪 `com.azurpilot.ghio`。

提 Issue 时附：设备型号、Android 版本、架构、Runtime 版本、操作步骤、日志片段。**不要附 `deploy.yaml`、`password.txt`、`remote-access.json`。**
