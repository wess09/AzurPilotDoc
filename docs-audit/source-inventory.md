# 源码审计范围与入口

最近核对：2026-11-12。精确分支、SHA、Release 与 CI 以 [source-versions.json](source-versions.json) 为准。

本清单覆盖四个仓库的关键入口，不代表逐文件人工审阅。事实来源为当前源码、配置契约、测试与 CI；公开文档优先跟随各源码仓库默认分支。开发分支与默认分支有差异时单独注明。

| 仓库 | 核对目录 / 文件 | 用途 |
| --- | --- | --- |
| [AzurPilot](https://github.com/wess09/AzurPilot/tree/master) | `module/os/`、`module/config/argument/task.yaml`、`argument.yaml`、`module/config/i18n/zh-CN.json` | 大世界导航、任务、资源、调度、任务前置与任务帮助文本 |
| AzurPilot | `module/mcp/registry.py`、`module/mcp/tools.py`、`module/mcp/device_contract.py` | MCP 注册表、兼容入口、写操作和设备控制契约 |
| AzurPilot | `alas.py`、`module/api/router.py`、`frontend/src/api/contract.json`、`module/api/statistics_service.py`、`module/statistics/resource_flow.py` | 异常恢复、watchdog、WebSocket 与统计 API 契约 |
| [AzurPilotLauncher](https://github.com/wess09/AzurPilotLauncher/tree/main) | `src/main.rs`、`src/launcher.rs`、`src/tray_menu.rs`、`frontend/src/TrayMenu.tsx`、`ContextMenu.tsx`、`menus.test.tsx`、`capabilities/tray-menu.json` | 启动器生命周期、平台托盘菜单、页面右键菜单、IPC 权限与交互测试 |
| [AzurPilot-for-Android](https://github.com/wess09/AzurPilot-for-Android/tree/main) | `AzurPilotPage.kt`、`StatisticsSection.kt`、`ResourceManagementSection.kt`、`StatisticsContent.kt`、`StatisticsAssets.kt`、`StatisticsExport.kt` | Android 原生统计、资源管理、图表、图标资源与 CSV 导出 |
| AzurPilot-for-Android | `AzurPilotStatistics.kt`、`AzurPilotResourceFlows.kt`、`StatisticsWireTest.kt`、`.github/azurpilot-upstream.txt` | 统计报表与资源流水模型、线协议测试、核心上游同步标记 |
| [AzurPilotDoc](https://github.com/wess09/AzurPilotDoc/tree/master) | `docs/`、`docs/.vitepress/`、`docs-audit/` | 五语种文档、站点构建、生成索引与审计 |

## 机器生成索引

- `tasks.json`：101 个任务命令
- `config.json`：173 个配置组
- `api.json`：80 个 WebSocket 方法

核心 master 从上次审计到当前 SHA 未变化，任务、配置与 API 索引输入未变化，因此保留生成数据，仅更新审计来源信息。统计 API 的实现入口已纳入本轮核对。

## 分支与审计边界

- AzurPilot 默认分支 `master`：`3a607a92`，本轮未前进。开发分支 `dev`：`3da26f38`，较上次审计新增 19 个提交，比较结果显示领先 master 786 个提交；公开文档继续跟随默认 master。
- Launcher 默认分支 `main`：`185e8ad9`，稳定版仍为 3.0.7；新托盘与页面右键菜单已进入 main，但晚于 3.0.7 发布。
- Android 默认分支 `main`：`3fcb6d53`，上游同步标记指向核心 dev `3da26f38`。原生统计提交晚于最新公开 APK 1.3.196。
- 文档仓库默认分支 `master`：`21e2be1a` 为本轮修改前基线。

静态源码核对不等于真实游戏、模拟器、Android OEM 或跨平台 GUI 实测。未验证事项见 [unresolved-items.md](unresolved-items.md)。
