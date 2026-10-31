# 待验证事项与人工边界

2026-11-01 增量核对：核心 `master` 从 `6f8c43da` 到 `d058314e`（1 次实质提交）；Launcher `main` 保持 `4c024769`；Android `main` 从 `3f00c7fc` 到 `7bc1e48b`（3 次 `[skip ci]` 上游检查心跳，未改应用代码）。本文件记录验证边界，不将静态检查等同真机实测。

**优先风险：**核心 [CI #41212750148](https://github.com/wess09/AzurPilot/actions/runs/41212750148) 失败，`FleetRotation.test.ts` 两项断言仍期待旧规则结构（新增 `favourite: false`）；470 项通过。当前 `master` 的通知代码读取 `General.Error.OnePushConfig`，而全局配置为 `Alas.Error.OnePushConfig`；PR #1405 的修复合并目标为 `dev`，**不能当作 master 已修复**。

| 事项 | 已知事实 | 仍需验证的内容 |
| --- | --- | --- |
| 真实游戏任务执行与换船后宅联动 | 核心源码包含 `module/dorm/fleet_rotation.py`、`module/campaign/fleet_training.py`，配置参数新增 `FleetDorm`（Floor 1/2 支持）；单元回归测试存在 | 真实账号与模拟器/真机环境下的舰船心情互换、后宅一二楼放入/移出行为、多队伍连续出击与异常中断处理；不可用静态代码推断端到端执行 |
| 启动器 Node.js 下载与镜像自动回退 | AzurPilotLauncher 3.0.6 发布（HEAD `4c024769`），`src/setup.rs`、`src/nodejs.rs`、`src/sources.rs` 包含 Node.js 镜像配置与备选源回退逻辑，CI 单元测试通过 | 在不同网络环境（国内直连、代理环境、限制性网络）下的真实 Windows/macOS/Linux 实机首次安装与 Node.js 自动下载完整生命周期 |
| HTTP/3 传输与远程云端网络 | 核心 `module/base/http.py`、`module/runtime/remote_cloudflare.py` 引入 HTTP/3 支持与远程网络回退 | 真实网络环境、特定运营商网络对 UDP/QUIC 阻断情况下的回退行为，以及 Cloudflare / 外部存储的实际交互 |
| 装备码与中断恢复 | `tests/test_equipment_code.py` 等测试入口存在 | 中断、无装备、失败清理及 Android 特权输入在实际设备上的表现 |
| Android 设备兼容性与特权桥 | 存在 Android 宿主、特权桥 (`android_equipment.py`)、设备上报服务和构建工作流；上游检查心跳持续运行 | 多 OEM、权限状态（root/Shizuku）、不同系统版本下的真机兼容性矩阵 |
| 地图相机回退与反复滑动 | `module/map/camera.py` 在 `d058314e` 移除三次无进展、坐标震荡、20/40 次上限及单次边缘重定位；原进展测试删除 | 稀疏海域、不同后端与异常画面是否持续滑动；50 条设备点击记录不等于相机尝试上限 |
| 培养通知与常用候补 | `StopOnComplete`、`Notify` 默认关闭，常用候补仅国服；当前 master OnePush 配置路径不匹配 | 外部推送、身份核实及不同服务器兼容性；不可用 dev 修复替代 master |
| 核心 CI 回归 | `d058314e` 的前端 470 通过、2 失败，其他 Job 成功不抵消整体失败 | 源码维护者修正旧断言或契约并重跑完整 CI；本次只读不修改源码 |
| 索引数据与新配置组同步 | 站点当前 `tasks.json`（101 任务）、`config.json`（173 配置组）、`api.json`（80 方法）仍基于核心 `2eba5705` 快照。上游 `d058314e` 包含新增 `FleetDorm` 配置组及 `FleetTraining.StopOnComplete`、`Notify` 字段 | 文档编写团队对新增 `FleetDorm` 的多语言文案审核完成后，需重新执行提取脚本并比对 diff，暂不草率破坏当前稳定索引 |
| 正式发布版本与开发分支边界 | AzurPilotLauncher 已正式发布 3.0.6（代码模板为 0.0.0）；AzurPilot 核心最近发布 Tag 为 `v1.0.4`，但 `master` 持续滚动演进；Android 使用滚动 Tag `azurpilot-android-latest` | 不能把 Git 分支 HEAD 直接标作已分发安装版本；文档站需向用户清晰区分 Launcher 稳定发布版本与核心程序滚动分支 |

**人工决定项：**无新增产品决策需要确认。任何正式部署、真机测试、跨仓库生产修改均未授权，也没有执行。

参考：[source-versions.json](source-versions.json) 和 [coverage-matrix.md](coverage-matrix.md)。
