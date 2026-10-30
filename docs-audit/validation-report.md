# 验证与 CI 结果

记录日期：2026-10-31。这里严格区分 **上一份已验证的文档构建**、**本次新增修复**与**源码仓库其他工作流**；未在本机运行的命令不标记为本地通过。

## 文档站：上一份完整成功记录

- 仓库：`wess09/AzurPilotDoc`
- 基线 commit：[`f95a8eb6`](https://github.com/wess09/AzurPilotDoc/commit/f95a8eb6dce2e7a8a41322029ea16f58f5a03279)
- Actions：[Docs CI #41091791942](https://github.com/wess09/AzurPilotDoc/actions/runs/41091791942)
- 状态：`completed / success`

该次工作流中逐步显示为 `success` 的检查：`npm ci`、Type check、Static build、Link / coverage checks、SEO checks on build output、Install Playwright browser、Browser checks、Responsive sweep and screenshots、Upload static site、Upload audit records。

这证明 **`f95a8eb6`** 这份文档通过相应检查；不自动证明当前新提交通过。本次修复的 CI 必须以新 commit 对应 Actions 运行为准，并在运行结束后再确认。

## 三个源码仓库的独立运行记录

| 仓库 / 工作流 | 可核实运行 | 状态 | 说明 |
| --- | --- | --- | --- |
| [AzurPilotLauncher / Pack AzurPilot](https://github.com/wess09/AzurPilotLauncher/actions/runs/41058458672) | `41058458672` | success | SHA `e3e26905`；只表示此工作流成功 |
| [AzurPilot-for-Android / AzurPilot for Android build](https://github.com/wess09/AzurPilot-for-Android/actions/runs/41064735737) | `41064735737` | success | SHA `5b445855` |
| [AzurPilot / Git over CDN Worker](https://github.com/wess09/AzurPilot/actions/runs/41072005699) | `41072005699` | success | SHA `2eba5705`；不是全套核心单元测试结论 |
| [AzurPilot / Sync dev ancestry after squash](https://github.com/wess09/AzurPilot/actions/runs/41072005593) | `41072005593` | success | SHA `2eba5705`；不是业务测试结论 |

## 本次仓库状态与修改范围

- 三个源码分支 HEAD 与上一次审计完全一致，故不刷新无变化的任务/API/配置生成文件。
- 文档本次修复：五种语言「编辑本页」链接的错误默认分支 `main` → `master`，并补齐 README 与源码版本索引已经引用但仓库内缺失的 `docs-audit/` 记录。
- 未进行本地 npm、真机、模拟器或生产部署测试；新 CI 的结论由该提交对应 Actions 决定。
