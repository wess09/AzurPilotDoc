# 源码审计范围与入口

最近一次核对：2026-11-01。源分支、精确 SHA 和发布标签以 [source-versions.json](source-versions.json) 为准。

这是**关键入口清单**，不是对三个仓库每个文件的覆盖声明。以当前分支实际源码为第一事实来源；没有新提交时不依据心跳、Issue 标题或版本猜测新增功能。

| 仓库 | 核对的目录 / 文件 | 用途 |
| --- | --- | --- |
| [AzurPilot](https://github.com/wess09/AzurPilot/tree/master) | `module/`、`module/island_planner/`、`module/equipment/`、`module/cloud/` | 任务执行、岛屿生产规划、装备码、云端上传 |
| AzurPilot | `frontend/src/api/contract.json`、`frontend/src/pages/`、`module/webui/` | 前后端 API 与界面能力 |
| AzurPilot | `config/`、`module/config/`、`tests/test_equipment_code.py`、`tests/test_cloud_direct_upload.py` | 部署配置、配置系统和关键回归测试 |
| [AzurPilotLauncher](https://github.com/wess09/AzurPilotLauncher/tree/main) | `src/launcher_protocol.rs`、`src/updater.rs`、`src/setup.rs`、`src/backend.rs` | 鉴权 WebSocket 协议、自更新、安装和后端控制 |
| AzurPilotLauncher | `frontend/`、`capabilities/`、`.github/workflows/package.yml` | 桌面 UI、Tauri 权限与打包 |
| [AzurPilot-for-Android](https://github.com/wess09/AzurPilot-for-Android/tree/main) | `app/`、`rootfs/overlays/android_equipment.py`、`rootfs/tests/` | Android 应用、装备码特权桥与运行环境测试 |
| AzurPilot-for-Android | `server/device-report/`、`.github/workflows/check-upstream.yml` | 设备兼容性上报与上游变更检查 |

## 机器生成索引

下列文件全部从 [AzurPilot `2eba5705`](https://github.com/wess09/AzurPilot/commit/2eba570571ec9b7afd8c9b8ce52c7ccb2705a747) 源码快照提取，并非人工估算：

- `docs/.vitepress/data/tasks.json`：101 个任务命令
- `docs/.vitepress/data/config.json`：173 个配置选项组
- `docs/.vitepress/data/api.json`：80 个 WebSocket 业务方法

本次核心 `master` 前进至 `d058314e`，新增培养达标停止、常用候补与通知，回退地图相机进展及次数保护；Launcher `main` 保持 `4c024769`（稳定版 3.0.6）；Android `main` 仅新增三次上游心跳至 `7bc1e48b`。索引仍基于 `2eba5705`，未重新提取，不得将 101/173/80 视为当前 HEAD 的完整数量。

## 审计限制

本次仅通过 GitHub 仓库内容、提交、PR、Release 与 Actions 检查，不等于在真实设备上运行游戏、测试所有模拟器或完成跨平台图形回归。具体未验证项见 [unresolved-items.md](unresolved-items.md)。
