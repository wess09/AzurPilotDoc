# 验证与 CI 结果

记录日期：2026-11-12。严格区分默认分支、开发分支、公开 Release、CI 与真实设备验证。

## 源码仓库

| 仓库 | 当前核对 HEAD | 最新相关 CI / Release |
| --- | --- | --- |
| [AzurPilot master](https://github.com/wess09/AzurPilot/commit/3a607a920f30d43d69454f9403b719d8b660cb76) | `3a607a92` | 本轮 master 未新增提交。CI Report [42884382074](https://github.com/wess09/AzurPilot/actions/runs/42884382074) 的报告作业成功；这不是单独的完整测试矩阵结论。最新核心 Release 仍为 v1.0.4。 |
| [AzurPilot dev](https://github.com/wess09/AzurPilot/commit/3da26f38150540d2da2054ddd7825e2f2e23da0f) | `3da26f38` | CI [42687769681](https://github.com/wess09/AzurPilot/actions/runs/42687769681) **failure**。React / WebSocket 检查中 3 个测试错误：mock 的 `appear()` lambda 不接受 `offset` 参数，涉及 `test_completed_scan_stages_and_rejects_concurrent_canonical_edits`（两个子场景）和 `test_scan_transaction_preserves_manual_edit_made_during_scan`；macOS 作业取消。该结果属于 dev，不是 master。 |
| [AzurPilotLauncher main](https://github.com/wess09/AzurPilotLauncher/commit/185e8ad976a2ed9a2860e653453d9112f1a3fa94) | `185e8ad9` | Test [42809252165](https://github.com/wess09/AzurPilotLauncher/actions/runs/42809252165) **success**；Pack [42809252316](https://github.com/wess09/AzurPilotLauncher/actions/runs/42809252316) **success**；最新定时 Pack [43128919622](https://github.com/wess09/AzurPilotLauncher/actions/runs/43128919622) **success**。稳定版仍为 3.0.7；托盘与页面右键菜单提交晚于该 Release。 |
| [AzurPilot-for-Android main](https://github.com/wess09/AzurPilot-for-Android/commit/3fcb6d538b54d5900d9a249e47998b059740cb43) | `3fcb6d53` | Build [43131585649](https://github.com/wess09/AzurPilot-for-Android/actions/runs/43131585649) **failure**：x86_64 与 arm64-v8a 两个 Build rootfs 作业均在导入 `deploy/frontend.py` 时因 `ModuleNotFoundError: No module named 'deploy'` 失败；APK 与 publish 作业 skipped。前端资源构建已完成，但不能据此声称 APK 构建或发布通过。最新公开滚动 APK 仍为 1.3.196（2026-11-08）。 |

## 文档仓库

- 本轮基线：[`21e2be1a20b5`](https://github.com/wess09/AzurPilotDoc/commit/21e2be1a20b56efcee0faa0bf43ab87f2bff48c0)。
- 基线 Docs CI [42479426147](https://github.com/wess09/AzurPilotDoc/actions/runs/42479426147)：**completed / success**。
- 本轮提交后的 Docs CI 必须单独通过；工作流会执行 typecheck、静态构建、链接 / 覆盖 / SEO 检查、Playwright 浏览器检查和响应式截图扫描。

## 本轮范围与限制

- 核对核心 master、核心 dev、Android main、Launcher main 和文档 master 的提交差异、相关源码、测试与 CI。
- 核心 master 的任务 / 配置 / API 索引输入未变化；保留 101 / 173 / 80 的生成数据。
- Android 统计功能有线协议测试源码，但最新构建在 rootfs 导入阶段失败；不得写成 APK 已构建或已发布。
- Launcher Test / Pack CI 通过；没有执行 Windows、macOS、Linux 的人工托盘交互验收。
- 未执行真实游戏账号、模拟器、Android OEM 或桌面跨平台人工测试。
