# 验证与 CI 结果

记录日期：2026-11-08。严格区分源码分支 CI、上一版文档 CI 与本轮文档 PR 的待验证状态。

## 源码仓库

| 仓库 | 当前核对 HEAD | 最新相关 CI / Release |
| --- | --- | --- |
| [AzurPilot master](https://github.com/wess09/AzurPilot/commit/3a607a920f30d43d69454f9403b719d8b660cb76) | `3a607a92` | master CI Report [42469549576](https://github.com/wess09/AzurPilot/actions/runs/42469549576) 为 **skipped**，不能据此声称完整 CI 通过。dev CI [42469166004](https://github.com/wess09/AzurPilot/actions/runs/42469166004) 为 **failure**：React / WebSocket 契约检查和 button-config-check 失败，Windows 集成作业在 uv setup 阶段失败；该结果属于 dev，不是 master。 |
| [AzurPilotLauncher main](https://github.com/wess09/AzurPilotLauncher/commit/466b8c6b02dd990752cfcdb5bf93e807018bc0e5) | `466b8c6b` | Test [42459948454](https://github.com/wess09/AzurPilotLauncher/actions/runs/42459948454) **success**；Pack [42461003315](https://github.com/wess09/AzurPilotLauncher/actions/runs/42461003315) **success**；稳定版 3.0.7 已发布。 |
| [AzurPilot-for-Android main](https://github.com/wess09/AzurPilot-for-Android/commit/a944e2ef5353d636f6531bcff78a0dd21908e376) | `a944e2ef` | Android build [42454640653](https://github.com/wess09/AzurPilot-for-Android/actions/runs/42454640653) **success**；滚动 Release 资源包含 1.3.196。 |

## 文档仓库

- 上一版文档基线：[`acdb50d634cc`](https://github.com/wess09/AzurPilotDoc/commit/acdb50d634cc3dd174136d6718a452039090503c)。
- 上一版 Docs CI [41254199608](https://github.com/wess09/AzurPilotDoc/actions/runs/41254199608)：**completed / success**。
- **本轮文档 PR 必须由自己的 Docs CI 验证。** 上一版成功不能证明本轮构建、链接和覆盖通过。

## 本轮范围与限制

- 已核对四个仓库默认分支、关键提交、任务配置、MCP 注册表、Android 配置导入与截帧实现、Launcher 3.0.7 发布说明。
- 生成索引输入从 2eba5705 到当前 master 3a607a92 未变化；保留 101 / 173 / 80 的数据并更新来源元数据。
- 已更新五语大世界、MCP、Android、Launcher、调度与审计页面。
- 未执行真实游戏、模拟器、Android OEM 或桌面跨平台人工测试；不得将静态源码核对写成真机通过。
