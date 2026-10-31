# 功能 → 源码 → 文档覆盖矩阵

核对日期：2026-11-01。以下行表示已核对的**关键功能映射**，不代表所有源码均已人工审阅或功能已真机实测。
增量核对：AzurPilot `d058314e`（+1）、Launcher `4c024769`（+0）、Android `7bc1e48b`（+3，仅上游心跳）。

| 功能 / 契约 | 可核实的源码入口或测试 | 文档页面（五种语言共享相对路径） | 状态 |
| --- | --- | --- | --- |
| 任务目录与配置分组 | `AzurPilot/module/config/` 与生成脚本 `scripts/extract-tasks.py`、`scripts/extract-config.py` | `reference/tasks.md`、`reference/config.md` | 生成索引保留核心 `2eba5705` 快照（101 任务 / 173 配置组）；新增 `FleetDorm` 配置组与换船休息联动已在相关文档中完成覆盖 |
| WebSocket 方法契约 | `AzurPilot/frontend/src/api/contract.json` | `api/websocket.md`、`api/index.md`、`reference/api.md` | 80 个业务方法，契约定义在近期提交中保持稳定 |
| 后宅换船联动与选船确认 (FleetDorm) | `AzurPilot/module/dorm/fleet_rotation.py`、`module/campaign/fleet_rotation.py`、`module/config/argument/argument.yaml` | `azurpilot/user/tasks/daily.md`、`azurpilot/user/tasks/campaign.md`、`azurpilot/user/scheduler.md` | 核心新增换船后宅休息（支持一楼训练/二楼休息、逐排拖动抑制惯性、卡片位移与稳定帧校验、前七排上限与未选齐安全回退）；已完成文档覆盖，单元回归存在，未真机实测 |
| HTTP/3 传输与云端上报 | `AzurPilot/module/base/http.py`、`module/runtime/update_network.py`、`module/runtime/update_network.py`、`tests/test_http_transport.py` | `azurpilot/developer/architecture.md`、`azurpilot/user/scheduler.md`、`azurpilot/user/observability.md` | 运行时 niquests HTTP/3-first 服务请求与 CDN 增量更新；启动引导使用 Requests/Git，`deploy/http.py` 已删除；五语文档已更正 |
| 装备码、换装与清空前置装备 | `AzurPilot/module/equipment/`、`tests/test_equipment_code.py` | `azurpilot/user/tasks/daily.md`、`azurpilot/user/tasks/opsi.md` | 源码及回归测试入口存在；未进行游戏实测 |
| 岛屿生产规划 | `AzurPilot/module/island_planner/` | `azurpilot/user/tasks/island.md` | 已纳入前次文档更新；最新提交补充了离线测试基础设施 |
| 云端签名上传与本地队列 | `AzurPilot/module/cloud/`、`tests/test_cloud_direct_upload.py` | `azurpilot/user/observability.md`、`api/index.md` | 已区分结构化统计与截图上传契约 |
| 启动器协议与运行时安装 | `AzurPilotLauncher/src/launcher_protocol.rs`、`src/updater.rs`、`src/setup.rs`、`src/nodejs.rs`、`src/sources.rs` | `launcher/developer/architecture.md`、`launcher/developer/update.md`、`launcher/user/maintenance.md` | 发布版 3.0.6（代码模板 0.0.0）；HEAD 为 `4c024769`；恢复 Node.js 运行时自动下载与镜像源独立选择/回退 |
| 培养达标停止、常用候补与通知 | `AzurPilot/module/campaign/fleet_training.py`、`module/retire/fleet_favourite.py`、`module/campaign/fleet_training_notify.py`、`tests/test_fleet_training.py` | 五语 `azurpilot/user/tasks/campaign.md` | `StopOnComplete`、`Notify` 默认关闭；`favourite` 仅国服；OnePush 配置路径待修复，未真机实测 |
| 地图相机回退 | `AzurPilot/module/map/camera.py`（`d058314e`），移除 `tests/test_map_camera_progress.py` | 五语 `azurpilot/developer/device-vision.md` | 移除三次无进展、20/40 次上限及单次边缘重定位；异常时可能反复滑动 |
| Android 特权装备码路径 | `AzurPilot-for-Android/rootfs/overlays/android_equipment.py` | `android/developer/runtime.md` | 有特权桥源码；未真机实测 |
| Android 上游核对、设备报告 | `AzurPilot-for-Android/.github/workflows/check-upstream.yml`、`server/device-report/` | `android/developer/runtime.md`、`android/user/console.md` | 只读审计；分支持续保持日常上游心跳，无功能业务改动 |
| GitHub 编辑本页入口 | `AzurPilotDoc/docs/.vitepress/config.mts` 与 GitHub 实际 `master` 分支 | 五种语言全部文档页 | commit `d209bc9` 修复原先指向不存在的 `main` 的链接，已由 Docs CI `41098853139` 验证 |

五个语言前缀：`docs/`（简中）、`docs/en/`、`docs/ja/`、`docs/zh-HK/`、`docs/zh-TW/`。当前仓库树中每个语言目录均有 68 篇 Markdown 页面（全站 340 篇）；此数仅为文件数量，并非翻译质量评分。

## 边界

- 对任何尚未真实运行的能力，**不能**由「相关测试文件存在」推断端到端通过。
- [validation-report.md](validation-report.md) 只记录有 GitHub Actions 运行依据的结果。
- [unresolved-items.md](unresolved-items.md) 保留需要设备、外部服务或人工判断的验证缺口。
