# 功能 → 源码 → 文档覆盖矩阵

核对日期：2026-11-12。已核对关键源码入口、配置契约、测试和 CI；不代表所有功能均已实机验收。

| 功能 / 契约 | 源码入口 | 文档页面（五种语言相同相对路径） | 状态 |
| --- | --- | --- | --- |
| 大世界主线与任务级前置 | `module/config/argument/task.yaml`、`argument.yaml`、`module/config/i18n/zh-CN.json`、`module/os/tasks/` | `azurpilot/user/tasks/opsi.md` | 明确所有大世界自动化功能的主线通关前置；补充模拟战 / 塞壬试验场、每月开荒或 5000 石油战役信息记录仪、港口商店跨月条件及开荒 100% 条件。主线进度仍需在游戏内确认。 |
| 大世界资源与智能调度 | `module/os/tasks/scheduling.py`、`smart_explore.py`、`prevent_action_point_overflow.py`、`cross_month.py` | `azurpilot/user/tasks/opsi.md`、`azurpilot/user/scheduler.md` | 保留 AP / 黄币 / 紫币、保留值、子任务代理、月末清理、智能开荒互斥和跨月边界；本轮补齐各任务额外解锁条件。 |
| 任务 / 配置索引 | `task.yaml`、`args.json`、`argument.yaml` | `reference/tasks.md`、`reference/config.md`、`.vitepress/data/tasks.json`、`.vitepress/data/config.json` | 核心 master 输入未变化；保留 101 任务 / 173 配置组。 |
| WebSocket 契约 | `frontend/src/api/contract.json`、`module/api/router.py` | `api/websocket.md`、`api/index.md`、`.vitepress/data/api.json` | 核心 master 输入未变化；保留 80 个公开方法。 |
| Android 原生统计 | `StatisticsSection.kt`、`StatisticsContent.kt`、`AzurPilotStatistics.kt`、`statistics.report` | `android/index.md`、`android/user/console.md`、`android/developer/architecture.md` | 补齐资源趋势、大世界趋势 / 总结、委托收益、舰船经验、大世界掉落、科研掉落、仓库物品八类报表；记录实例范围、周期筛选、重新统计和 CSV。 |
| Android 资源管理 | `ResourceManagementSection.kt`、`AzurPilotResourceFlows.kt`、`statistics.resourceFlows`、`StorageStatistics` | `android/user/console.md`、`android/developer/architecture.md` | 补齐库存、收入 / 支出 / 校准、资源流向、流水证据、1 / 7 / 30 天及自定义范围、石油控制和显式仓库扫描；未知库存不当作 0。 |
| Launcher 托盘与页面右键菜单 | `src/tray_menu.rs`、`src/main.rs`、`src/launcher.rs`、`TrayMenu.tsx`、`ContextMenu.tsx`、`menus.test.tsx` | `launcher/index.md`、`launcher/user/maintenance.md`、`launcher/developer/architecture.md` | 记录 Windows Fluent 自绘托盘、macOS 原生托盘、Linux 暂无托盘、页面内刷新 / 复制 / 粘贴 / 全选菜单及权限边界；标记为 main 新功能，尚不属于稳定版 3.0.7。 |
| Android 配置导入 | `AzurPilotConfigImport.kt`、`android_config_compat.py`、`doc/config-import-compatibility.md` | `android/user/maintenance.md` | 覆盖日期、数值、字符串、内部状态和批次写入；未在多 OEM 真机验证。 |
| Android 共享内存首帧 | `SharedFrameServer.kt`、`BridgeServer.kt` | `android/developer/privileged.md` | 记录约 3 秒 / 200 ms 有界重试；持续无帧仍失败，需真机验证。 |
| MCP 工具与设备控制 | `module/mcp/registry.py`、`tools.py`、`device_contract.py` | `api/mcp.md`、`api/index.md`、`azurpilot/user/observability.md` | 默认 25 个 azurpilot_ 工具；旧名称仅在显式兼容入口；记录租约、frame_id、revision、request_id 和 operation_id。 |
| 异常处理关闭行为 | `alas.py` 的 watchdog / error recovery 路径 | `azurpilot/user/scheduler.md` | 普通异常保存日志并停止进程；watchdog 超时停止 worker 并保留模拟器现场。 |
| 五语种覆盖 | `docs/`、`.vitepress/data/`、`docs-audit/` | 简中、英语、日语、繁中 HK / TW | 本轮同步大世界前置、Android 统计 / 资源管理、Launcher 菜单和审计记录。 |

## 验证边界

- 大世界主线通关是明确的游戏进度前置；程序不会替用户通关，账号实际进度仍需在游戏内确认。
- Android 原生统计与 Launcher 新菜单均已进入默认分支源码，但最新公开安装包 / 稳定版尚未包含对应提交。
- 静态源码、单元测试和 CI 不能替代真实游戏、模拟器、Android OEM 或跨平台人工验收。
- [validation-report.md](validation-report.md) 记录 CI 依据；[unresolved-items.md](unresolved-items.md) 记录未完成的实机验证。
