# 源码审计范围与入口

最近核对：2026-11-08。精确分支、SHA、Release 与 CI 以 [source-versions.json](source-versions.json) 为准。

本清单覆盖四个仓库的关键入口，不代表逐文件人工审阅。公开文档优先跟随各仓库默认分支；开发分支与默认分支有差异时单独注明。

| 仓库 | 核对目录 / 文件 | 用途 |
| --- | --- | --- |
| [AzurPilot](https://github.com/wess09/AzurPilot/tree/master) | `module/os/`、`docs/modules/os/`、`module/config/argument/` | 大世界导航、任务、资源、调度、任务目录和配置 |
| AzurPilot | `module/mcp/registry.py`、`module/mcp/tools.py`、`module/mcp/device_contract.py` | MCP 注册表、兼容入口、写操作和设备控制契约 |
| AzurPilot | `alas.py`、`module/api/router.py`、`frontend/src/api/contract.json` | 异常恢复、watchdog、WebSocket 方法 |
| [AzurPilotLauncher](https://github.com/wess09/AzurPilotLauncher/tree/main) | `src/launcher.rs`、`src/native_dialog.rs`、`src/fs_util.rs`、`frontend/src/ConnectionWindow.tsx`、`CHANGELOG.md` | 启动器生命周期、连接错误窗口、文件系统恢复与 3.0.7 |
| [AzurPilot-for-Android](https://github.com/wess09/AzurPilot-for-Android/tree/main) | Kotlin 宿主、`SharedFrameServer.kt`、`BridgeServer.kt`、`RemotePairingCard.kt` | Android 宿主、特权桥、共享内存截帧、远程客户端 |
| AzurPilot-for-Android | `android_config_compat.py`、`android_app_launch.py`、`doc/config-import-compatibility.md`、`server/remote-access/` | 桌面配置导入、游戏启动、远程配对服务 |
| [AzurPilotDoc](https://github.com/wess09/AzurPilotDoc/tree/master) | `docs/`、`docs/.vitepress/`、`docs-audit/` | 五语种文档、站点构建、生成索引与审计 |

## 机器生成索引

- `tasks.json`：101 个任务命令
- `config.json`：173 个配置组
- `api.json`：80 个 WebSocket 方法

从核心快照 `2eba5705` 比较到当前 master `3a607a92`，`task.yaml`、`args.json`、`argument.yaml`、`router.py` 和前端 API 契约输入均未变化。因此本轮保留生成数据，仅更新来源 SHA 与审计日期。

## 分支与审计边界

- AzurPilot 默认分支 `master`：`3a607a92`。当前 `dev` 为 `2943abb9`，另有 Vite 8.3.6、前端清理与启动依赖复用提交；公开文档跟随默认 master。
- Launcher 默认分支 `main`：`466b8c6b`，稳定版 3.0.7。
- Android 默认分支 `main`：`a944e2ef`，滚动 Release 资源已包含 1.3.196。
- 文档仓库默认分支 `master`：`acdb50d6`，本轮通过独立分支和 PR 更新。

静态源码核对不等于真实游戏、模拟器、Android OEM 或跨平台图形实测。未验证事项见 [unresolved-items.md](unresolved-items.md)。
