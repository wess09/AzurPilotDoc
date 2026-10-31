# 验证与 CI 结果

记录日期：2026-10-31。这里严格区分 **上一份已验证的文档构建**、**本次新增修复**与**源码仓库其他工作流**；未在本机运行的命令不标记为本地通过。

## 文档站：上一份完整成功记录

- 仓库：`wess09/AzurPilotDoc`
- 基线 commit：[`d209bc98`](https://github.com/wess09/AzurPilotDoc/commit/d209bc98f3c46dc3f0b0b4b2b74a6f82490029f2)
- Actions：[Docs CI #41098853139](https://github.com/wess09/AzurPilotDoc/actions/runs/41098853139)
- 状态：`completed / success`

该次工作流中逐步显示为 `success` 的检查：`npm ci`、Type check、Static build、Link / coverage checks、SEO checks on build output、Install Playwright browser、Browser checks、Responsive sweep and screenshots、Upload static site、Upload audit records。

这证明 **`d209bc98`** 这份文档通过相应检查；不自动证明当前新提交通过。本次修复的 CI 必须以新 commit 对应 Actions 运行为准，并在运行结束后再确认。

## 三个源码仓库的独立运行记录

| 仓库 / 工作流 | 可核实运行 | 状态 | 说明 |
| --- | --- | --- | --- |
| [AzurPilotLauncher / Test AzurPilot](https://github.com/wess09/AzurPilotLauncher/actions/runs/41196935846) | `41196935846` | success | SHA `4c024769`；Node.js 镜像设置持久化单元测试通过 |
| [AzurPilotLauncher / Pack AzurPilot](https://github.com/wess09/AzurPilotLauncher/actions/runs/41200916911) | `41200916911` | success | 定时打包工作流成功 |
| [AzurPilot-for-Android / AzurPilot for Android build](https://github.com/wess09/AzurPilot-for-Android/actions/runs/41186491358) | `41186491358` | success | SHA `3f00c7fc` |
| [AzurPilot / CI](https://github.com/wess09/AzurPilot/actions/runs/41202889104) | `41202889104` | success | 核心开发分支持续集成通过 |

## 本次仓库状态与修改范围

- 三个源码分支 HEAD 已推进并完成审查；因核心新增任务与启动器新发版仍待文案跟进，站点索引文件暂保留原有快照。
- 文档元数据更新：准确核实记录三个仓库最新 HEAD、Release 3.0.6 与新增功能的技术边界及待验证项。
- 本地执行并通过 `npm run build`、`npm run check`（包含 check:links、check:nav、check:seo）；新提交 CI 结论由后续 GitHub Actions 决定。
