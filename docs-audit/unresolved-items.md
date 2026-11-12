# 待验证事项与人工边界

2026-11-12 增量核对：核心 master `3a607a92`、核心 dev `3da26f38`、Launcher main `185e8ad9`、Android main `3fcb6d53`。区分静态源码结论、CI 结果与真实设备验证。

| 事项 | 已知事实 | 仍需验证 |
| --- | --- | --- |
| 大世界主线与任务前置 | 文档统一要求先通关主线；源码帮助文本还列出模拟战、塞壬试验场、每月开荒或 5000 石油战役信息记录仪、港口商店跨月条件 | 需在真实账号确认主线、海域解锁、商店换版和记录仪使用状态；程序不会替用户通关，也不保证自动校验账号进度 |
| 大世界智能调度 | 已核对 scheduling、smart explore、AP overflow、cross-month 源码与设计文档 | AP / 黄币 / 紫币收支、跨月时序、特殊海域识别、多舰队执行仍需真实账号验证 |
| Android 原生统计 | Android main 新增八类报表、资源管理、CSV 和显式仓库扫描；当前公开 APK 仍为 1.3.196，早于统计功能提交 | 需修复 Build rootfs 导入 `deploy.atomic` 时缺少 `deploy` 模块的问题，再构建 APK；随后在 ARM64 / x86_64 真机验证报表、库存快照、资源流水、筛选与 CSV |
| Android 统计数据边界 | 库存当前值允许为 null；掉落重新统计只重算本地领奖记录；仓库统计需显式启动 `StorageStatistics` | 需用真实实例验证无快照、空数据、任务流水和校准记录的显示，不得把未知库存解释为 0 |
| Android 配置导入 | Android 源码提供 schema-aware 日期、范围、字符串及批次规整 | 需用不同桌面版本导出的真实配置，在 ARM64 / x86_64 和不同 OEM 系统验证 |
| Android 首帧重试 | SharedFrameServer 使用约 3 秒预算、200 ms 间隔；等待不阻塞帧生产线程 | 需验证不同 Android 版本、厂商 ROM、虚拟屏重建和低内存环境；真无帧仍应失败 |
| Android 远程客户端 | 远程模式只在网关切换成功后持久化；具备共享内存与 TCP 截帧通道 | 需实测网络切换、配对、撤销、断线和本地模式恢复 |
| Launcher 菜单 | main 已有 Windows Fluent 托盘弹窗、macOS 原生托盘菜单和页面内右键菜单；Test / Pack CI 通过；稳定版 3.0.7 早于这些提交 | 需在 Windows、macOS 手动验证托盘定位、焦点、Esc、重复右键和剪贴板权限；确认 Linux 无托盘行为符合预期；等待后续稳定版发布 |
| Core dev CI | dev 最新 CI 42687769681 的 React / WebSocket 检查有 3 个 `appear(offset=...)` mock 参数错误；macOS 作业取消 | 需维护者修复测试 mock 并重跑 dev CI；该失败不能标记为 master 失败 |
| 生成索引 | 101 任务、173 配置组、80 WebSocket 方法的输入在本轮 master 未变化 | 后续 task.yaml、args.json、argument.yaml、router.py 或 API 契约变更时必须重新生成索引 |
| Docs CI | 基线文档 commit 21e2be1a 的 Docs CI 42479426147 成功 | 本轮提交必须单独通过 Docs CI；旧版成功不代表本轮构建、链接、浏览器和响应式检查通过 |

**验证原则：**静态代码、单元测试和 CI 不能替代真实游戏、真机、OEM 或跨平台人工验收。三个源码仓库保持只读，本轮只修改文档仓库。

参考：[source-versions.json](source-versions.json)、[coverage-matrix.md](coverage-matrix.md)、[validation-report.md](validation-report.md)。
