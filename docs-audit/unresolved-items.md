# 待验证事项与人工边界

2026-11-08 增量核对：核心 master `3a607a92`、Launcher main `466b8c6b`、Android main `a944e2ef`。区分静态源码结论、CI 结果与真实设备验证。

| 事项 | 已知事实 | 仍需验证 |
| --- | --- | --- |
| 大世界主线前置 | 五语手册已将通关主线设为统一前置；OpsiArchive 另需模拟战和塞壬试验场；源码有 16 个独立调度任务 | 需在真实账号确认主线、海域解锁和档案入口；文档前置不代表程序自动通关或自动校验 |
| 大世界智能调度 | 已核对 scheduling、smart explore、AP overflow、cross-month 源码与设计文档 | AP / 黄币 / 紫币收支、跨月时序、特殊海域识别、多舰队执行仍需真实账号验证 |
| 敏感任务错误处理 | Obscure、Abyssal、CrossMonth 默认敏感，异常时停止而非自动重启 | 需在真实异常场景验证日志、游戏状态和人工恢复步骤 |
| Android 桌面配置导入 | Android 源码提供 schema-aware 日期、范围、字符串及批次规整 | 需用不同桌面版本导出的真实配置，在 ARM64 / x86_64 和不同 OEM 系统验证 |
| Android 首帧重试 | SharedFrameServer 使用约 3 秒预算、200 ms 间隔；等待不阻塞帧生产线程 | 需验证不同 Android 版本、厂商 ROM、虚拟屏重建和低内存环境；真无帧仍应失败 |
| Android 远程客户端 | 远程模式只在网关切换成功后持久化；具备共享内存与 TCP 截帧通道 | 需实测网络切换、配对、撤销、断线和本地模式恢复 |
| Launcher 3.0.7 | Release 已发布，Test / Pack CI 成功；新增独立错误窗口、重试 / 退出和托盘恢复 | 需在 Windows、macOS、Linux 桌面环境人工检查焦点、托盘及后端反复崩溃场景 |
| Core CI | master 最新 CI Report 42469549576 为 skipped；dev 最新 CI 42469166004 failure，React / WebSocket 契约和 button-config 检查失败，Windows 作业在 uv setup 阶段失败 | dev 失败不能标记为 master 失败；需维护者检查并重跑对应作业 |
| 生成索引 | 101 任务、173 配置组、80 WebSocket 方法的输入从 2eba5705 到当前 master 未变化 | 后续 task.yaml、args.json、argument.yaml、router.py 或 API 契约变更时必须重新生成索引 |
| Docs CI | 上一版文档 commit acdb50d6 的 Docs CI 41254199608 成功 | 本轮 PR 必须单独通过 Docs CI；旧版成功不代表本轮通过 |

**验证原则：**静态代码、单元测试和 CI 不能替代真实游戏、真机、OEM 或跨平台人工验收。三个源码仓库未被修改，本轮也未执行生产环境操作。

参考：[source-versions.json](source-versions.json)、[coverage-matrix.md](coverage-matrix.md)。
