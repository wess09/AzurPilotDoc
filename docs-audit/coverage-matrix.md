# 功能 → 源码 → 文档覆盖矩阵

核对日期：2026-11-08。已核对关键源码入口、配置契约和文档覆盖；不代表所有功能均已真机实测。

| 功能 / 契约 | 源码入口 | 文档页面（五种语言相同相对路径） | 状态 |
| --- | --- | --- | --- |
| 大世界任务与解锁前置 | `module/config/argument/task.yaml`、`argument.yaml`、`module/os/tasks/`、`docs/modules/os/` | `azurpilot/user/tasks/opsi.md`、`azurpilot/user/tasks/index.md` | 更正为 16 个独立调度任务；区分通用设置、模拟器和子配置；全页明确主线通关前置，档案坐标另需模拟战 / 塞壬试验场 |
| 大世界资源与智能调度 | `module/os/tasks/scheduling.py`、`smart_explore.py`、`prevent_action_point_overflow.py`、`cross_month.py` | `azurpilot/user/tasks/opsi.md`、`azurpilot/user/scheduler.md` | 补充 AP / 黄币 / 紫币、保留值、子任务代理、月末清理、智能开荒互斥和跨月边界 |
| 任务 / 配置索引 | `task.yaml`、`args.json`、`argument.yaml` | `reference/tasks.md`、`reference/config.md`、`.vitepress/data/tasks.json`、`.vitepress/data/config.json` | 生成输入从 2eba5705 到当前 master 未变化；保留 101 任务 / 173 配置组并更新来源 SHA |
| WebSocket 契约 | `frontend/src/api/contract.json`、`module/api/router.py` | `api/websocket.md`、`api/index.md`、`.vitepress/data/api.json` | 80 个公开方法；抽取输入未变化 |
| MCP 工具与设备控制 | `module/mcp/registry.py`、`tools.py`、`device_contract.py` | `api/mcp.md`、`api/index.md`、`azurpilot/user/observability.md` | 默认 25 个 azurpilot_ 工具；旧名称仅在显式兼容入口；记录租约、frame_id、revision、request_id 和 operation_id |
| 异常处理关闭行为 | `alas.py` 的 watchdog / error recovery 路径 | `azurpilot/user/scheduler.md` | 说明普通异常保存日志并停止进程、watchdog 超时停止 worker 并保留模拟器现场 |
| Android 配置导入 | `AzurPilotConfigImport.kt`、`android_config_compat.py`、`doc/config-import-compatibility.md` | `android/user/maintenance.md` | 覆盖日期、数值、字符串、内部状态和批次写入；未在多 OEM 真机验证 |
| Android 共享内存首帧 | `SharedFrameServer.kt`、`BridgeServer.kt` | `android/developer/privileged.md` | 记录约 3 秒 / 200 ms 有界重试；持续无帧仍失败，需真机验证 |
| Launcher 3.0.7 | `ConnectionWindow.tsx`、`native_dialog.rs`、`launcher.rs`、`CHANGELOG.md` | `launcher/user/maintenance.md` | 记录独立连接错误窗口、重试 / 退出、托盘恢复与 WinUI 3；Test / Pack CI 成功 |
| 五语种覆盖 | `docs/`、`.vitepress/data/`、`docs-audit/` | 简中、英语、日语、繁中 HK / TW | 本轮更新大世界、MCP、Android、Launcher、调度和审计内容 |

## 验证边界

- 静态源码核对不能证明真实游戏任务、模拟器、Android OEM 或跨平台 UI 已端到端正常。
- 大世界主线通关是明确的游戏进度前置；程序不会替用户通关，账号实际进度仍需在游戏内确认。
- [validation-report.md](validation-report.md) 记录 CI 依据；[unresolved-items.md](unresolved-items.md) 记录未完成的实机验证。
