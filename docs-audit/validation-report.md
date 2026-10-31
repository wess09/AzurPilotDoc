# 验证与 CI 结果

记录日期：2026-11-01。严格区分**上一版文档已通过**、**源码仓库 CI**与**本轮文档提交待验证**。

## 上一版文档：已通过

- 文档基线：[`2eab5fd42386`](https://github.com/wess09/AzurPilotDoc/commit/2eab5fd423862beca9e8a21e4a55fb70b7e7838b)。
- [Docs CI #41213764015](https://github.com/wess09/AzurPilotDoc/actions/runs/41213764015)：`completed / success`，包含依赖安装、类型检查、静态构建、链接/覆盖、SEO、Playwright 浏览器验收、响应式扫描与截图及产物上传。
- **该结果仅证明上一版文档通过，不自动证明本轮提交通过。**

## 三个源码分支

| 仓库 | HEAD | CI / 核验结论 |
| --- | --- | --- |
| [AzurPilot](https://github.com/wess09/AzurPilot/commit/d058314ecfd1ca0b910ba832eb885a9e394599c9) | `d058314e` | [CI #41212750148](https://github.com/wess09/AzurPilot/actions/runs/41212750148) **failure**：`FleetRotation.test.ts` 两项断言失败，前端 470 通过 / 2 失败；Ruff、导入冒烟与按钮配置等其他 Job 成功不等于整体通过 |
| [AzurPilotLauncher](https://github.com/wess09/AzurPilotLauncher/commit/4c024769c810391d30520a79e85a80cb1199fbc5) | `4c024769` | [Test #41196935846](https://github.com/wess09/AzurPilotLauncher/actions/runs/41196935846) success；[Pack #41243998845](https://github.com/wess09/AzurPilotLauncher/actions/runs/41243998845) success |
| [AzurPilot-for-Android](https://github.com/wess09/AzurPilot-for-Android/commit/7bc1e48b4160bd8361570ba83208e66d6b142e9b) | `7bc1e48b` | [Sync to CNB #41249955896](https://github.com/wess09/AzurPilot-for-Android/actions/runs/41249955896) success；最近 [Android build #41234793370](https://github.com/wess09/AzurPilot-for-Android/actions/runs/41234793370) success 对应 `75c10296`，**不是当前 HEAD 的新构建** |

## 本轮验证边界

- 已通过 GitHub 连接核对目标分支、提交 Diff、配置与测试，更新五语功能页及审计记录。
- 本任务环境无法解析 `github.com` 进行 Git 克隆，**未在本机执行** `npm run build`、`npm run check`、`npm run test:e2e` 或截图检查，不能将其标为本地通过。
- 本轮文档提交需要由对应 GitHub Actions 单独验证；CI 结束前不得声称已通过。
- 三个源码仓库均只读，未改生产代码或 CI；未进行游戏真机、Android OEM 或桌面跨平台实测。
