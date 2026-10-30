# 功能 → 源码 → 文档覆盖矩阵

核对日期：2026-10-31。以下行表示已核对的**关键功能映射**，不代表所有源码均已人工审阅或功能已真机实测。上游三个分支本次无新增提交。

| 功能 / 契约 | 可核实的源码入口或测试 | 文档页面（五种语言共享相对路径） | 状态 |
| --- | --- | --- | --- |
| 任务目录与配置分组 | `AzurPilot/module/config/` 与生成脚本 `scripts/extract-tasks.py`、`scripts/extract-config.py` | `reference/tasks.md`、`reference/config.md` | 生成索引当前对应核心 `2eba5705` |
| WebSocket 方法契约 | `AzurPilot/frontend/src/api/contract.json` | `api/websocket.md`、`api/index.md`、`reference/api.md` | 80 个业务方法，与提交索引一致 |
| 装备码、换装与清空前置装备 | `AzurPilot/module/equipment/`、`tests/test_equipment_code.py` | `azurpilot/user/tasks/daily.md`、`azurpilot/user/tasks/opsi.md` | 源码及回归测试入口存在；未进行游戏实测 |
| 岛屿生产规划 | `AzurPilot/module/island_planner/` | `azurpilot/user/tasks/island.md` | 已纳入前次文档更新 |
| 云端签名上传与本地队列 | `AzurPilot/module/cloud/`、`tests/test_cloud_direct_upload.py` | `azurpilot/user/observability.md`、`api/index.md` | 已区分结构化统计与截图上传契约 |
| 启动器 WS 协议 v2、更新渠道 | `AzurPilotLauncher/src/launcher_protocol.rs`、`src/updater.rs` | `launcher/developer/architecture.md`、`launcher/developer/update.md`、`launcher/user/maintenance.md` | 代码入口存在；发布版 3.0.4 |
| Android 特权装备码路径 | `AzurPilot-for-Android/rootfs/overlays/android_equipment.py` | `android/developer/runtime.md` | 有特权桥源码；未真机实测 |
| Android 上游核对、设备报告 | `AzurPilot-for-Android/.github/workflows/check-upstream.yml`、`server/device-report/` | `android/developer/runtime.md`、`android/user/console.md` | 只读审计；不把上游心跳当新功能 |
| GitHub 编辑本页入口 | `AzurPilotDoc/docs/.vitepress/config.mts` 与 GitHub 实际 `master` 分支 | 五种语言全部文档页 | 本次修复原先默认指向不存在的 `main` 的链接 |

五个语言前缀：`docs/`（简中）、`docs/en/`、`docs/ja/`、`docs/zh-HK/`、`docs/zh-TW/`。当前仓库树中每个语言目录均有 68 篇 Markdown 页面；此数仅为文件数量，并非翻译质量评分。

## 边界

- 对任何尚未真实运行的能力，**不能**由「相关测试文件存在」推断端到端通过。
- [validation-report.md](validation-report.md) 只记录有 GitHub Actions 运行依据的结果。
- [unresolved-items.md](unresolved-items.md) 保留需要设备、外部服务或人工判断的验证缺口。
