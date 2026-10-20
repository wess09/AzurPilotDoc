---
title: 源码版本索引
description: 文档审计所依据的仓库、分支与 commit、审计范围与时间、尚未验证的事项，以及站点素材的来源与许可。
updated: 2026-10-20
---

# 源码版本索引

本站内容基于对三个仓库当前源码的只读审计，不是从 README 转写。这一页记录「依据哪一版、审计了什么、没验证什么」。

## <DocIcon name="clipboard" /> 审计基线

| 项目 | 仓库 | 默认分支 | 审计 commit | 提交时间 |
| --- | --- | --- | --- | --- |
| 核心程序 | `wess09/AzurPilot` | `master` | `7de6bb914da5798e76ef34a85a75648a526d319f` | 2026-10-20 |
| Android 宿主 | `wess09/AzurPilot-for-Android` | `main` | `1235c0a6d2d1f1bc334545e246eee2d93db756fa` | 2026-10-20 |
| 桌面启动器 | `wess09/AzurPilotLauncher` | `main` | `44a8715afef5c5be02184d9c7a08bf10a7b6c89f` | 2026-10-19 |

::: warning 默认分支不统一
核心用 `master`，另外两个用 `main`。旧文章里的 `/blob/main/` 链接指向核心仓库会 404。
:::

## <DocIcon name="search" /> 审计方法

- 以 `--depth 1` 克隆三个仓库，记录 HEAD。
- 读取 `AGENTS.md` / `CLAUDE.md` / README 各语言版本。
- 枚举目录结构，扫描 `module/`、`frontend/`、`app/`、`rootfs/`、`server/`、`src/`。
- 读取 `docs/modules/`（54 篇模块文档）、`doc/`（Android 31 篇、启动器 1 篇）。
- 解析 `task.yaml`、`argument.yaml`、`args.json`、`i18n/zh-CN.json`、`contract.json`。
- 读取 `.github/workflows/` 与 `.cnb/` 的 CI 配置。
- 用脚本生成任务表（102 项）与 API 表（72 项），避免手抄错误。

## <DocIcon name="badge-dollar" /> 覆盖统计

| 维度 | 数量 | 来源 |
| --- | --- | --- |
| 任务命令 | 102 | `args.json` |
| 选项组 | 167 | `argument.yaml` |
| WebSocket 方法 | 72 | `frontend/src/api/contract.json` |
| MCP 工具 | 18 | `mcp_server_sse.py` |
| 核心模块文档 | 54 篇 | `docs/modules/` |
| Python 测试文件 | 209 | `tests/` |

## <DocIcon name="circle-check" /> 已验证与未验证

### 已做（静态验证）

- 源码结构、配置字段、接口契约、CI 工作流的一致性核对。
- 文档内所有代码命令均来自仓库脚本或 `AGENTS.md`。
- 本站自身的构建、类型检查、链接、SEO、响应式与交互测试：31 项浏览器用例、112 个断点组合、5 页无障碍扫描。明细见站点仓库的 `docs-audit/validation-report.md`。

### 未做（需要真实环境）

| 事项 | 原因 |
| --- | --- |
| 真实游戏任务执行 | 需要账号、模拟器与游戏客户端，且会消耗资源 |
| 模拟器兼容性矩阵 | 需要逐款模拟器实测，仓库只提供默认 Serial |
| Android 真机全量回归 | 需要多台设备覆盖 OEM 差异；仓库只记录了 Redmi Note 10 Pro 的验证 |
| NPU 加速效果 | 依赖具体 SoC 与驱动，仓库文档明确「以实际初始化结果为准」 |
| 远程 Tunnel 连通性 | 依赖 Cloudflare 与网络环境 |
| 启动器三平台实机 | 仓库 CI 覆盖构建与单测，不覆盖真实桌面环境 |

::: warning 文档不把推测写成事实
涉及上述内容时，页面会标注「待核实」或直接说明未验证，而不是给出看似确定的结论。
:::

## <DocIcon name="scale" /> 事实冲突的处理

| 冲突 | 采用 |
| --- | --- |
| 源码 vs README | 源码优先 |
| 配置 schema / 测试 vs 文档 | schema 与测试优先 |
| 两个仓库文档互相矛盾 | 标注差异并以代码为准（例如 Android 版本号基线） |

## <DocIcon name="folder" /> 素材来源

| 素材 | 来源 | 许可 |
| --- | --- | --- |
| Android 截图 | `AzurPilot-for-Android/docs/screenshots/` | AGPL-3.0 |
| 启动器截图 | `AzurPilotLauncher/screenshots/` | GPL-3.0 |
| WebUI 截图 | `AzurPilot/doc/GUI.png` | GPL-3.0 |
| 项目 Logo | `AzurPilot/doc/logo.webp` | GPL-3.0 |
| 架构图 | 本站原创 SVG | Apache-2.0 |
| 图标 | 本站原创 SVG / Lucide | ISC |

未使用任何游戏内美术素材。界面截图中出现的游戏画面属于原权利方。

## <DocIcon name="refresh" /> 文档更新策略

1. 三个仓库更新后，重新跑 `scripts/extract-tasks.py`、`scripts/extract-api.py`、`scripts/extract-config.py`。
2. 对比生成数据的 diff，人工判断哪些行为变化需要改文案。
3. 更新本页的 commit 与日期。
4. 不在未读源码的情况下根据 Issue 或群聊补文档。

## <DocIcon name="file" /> 审计记录

站点仓库的 `docs-audit/` 下保存：

| 文件 | 内容 |
| --- | --- |
| `source-inventory.md` | 三仓库目录与关键文件清单 |
| `coverage-matrix.md` | 功能 → 源码 → 文档 → 验证状态 |
| `source-versions.json` | 机器可读的版本记录 |
| `unresolved-items.md` | 待核实清单 |
| `validation-report.md` | 构建、浏览器、SEO 验收结果 |
