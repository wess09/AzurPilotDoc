---
title: 测试与 CI
description: Python 单元测试、前端 Vitest 与 Playwright、导入冒烟、生成产物校验，以及 GitHub Actions 的五个作业。
updated: 2026-10-20
---

# 测试与 CI

这个仓库的测试策略是「**便宜的检查每次跑，昂贵的检查按范围跑**」。CI 负责保证生成产物一致、模块可导入、关键链路不回归；真机识别效果仍然只能人工验证。

## <DocIcon name="box" /> 测试分层

| 层 | 工具 | 数量级 | 特点 |
| --- | --- | --- | --- |
| Python 单元测试 | `unittest` | 200+ 文件 | 不连设备，使用夹具与临时配置 |
| Python 专项 | `pytest` | `tests/shop_event` 等 | 参数化场景 |
| 前端单元 | Vitest | 组件、hooks、工具 | jsdom 环境 |
| 前端端到端 | Playwright | 真实后端 / mock 两套 | 覆盖关键交互 |
| 导入冒烟 | 自研脚本 | 遍历 `module/`、`deploy/` | 子进程导入，白名单已知失败 |
| 生成产物校验 | git diff | 全量 | 配置、按钮、API 契约 |

## <DocIcon name="laptop" /> 本地跑测试

```bash
# 全量 Python 单元测试
uv run python -m unittest discover -s tests

# 单个模块
uv run python -m unittest tests.test_api

# pytest 专项
uv run pytest tests/shop_event

# 导入冒烟（不连设备）
uv run python -m dev_tools.import_smoke_test

# 基础 lint
uv run ruff check . --select E9,F63,F7,F82 --ignore F821,F722
```

前端：

```bash
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run test:e2e:mock --prefix frontend
```

::: tip 不要每次改一行就跑全量
AGENTS.md 的约定是：优先跑与改动直接相关的测试；只有行为影响三个以上模块或大规模重构时才跑全量。生成文件、翻译、文档不计入「行为模块」数量。
:::

## <DocIcon name="cloud" /> CI 作业

`.github/workflows/ci.yml`，在 push 与 PR 时触发，同一分支并发会取消旧运行。

| 作业 | 运行环境 | 内容 |
| --- | --- | --- |
| `game-data` | Ubuntu / Windows / macOS-14 矩阵 | 身份持久化、交易所、历史认证、账户恢复、部署迁移 |
| `frontend` | Ubuntu + Node 24 | 锁文件下载源、API 契约 diff、API/运行时/岛屿/心智/舰队科技测试、前端构建与 Vitest、Playwright |
| `ruff` | Ubuntu | `E9,F63,F7,F82`（忽略 `F821,F722`） |
| `button-config-check` | Ubuntu | 重跑 `button_extract` 与 `config_updater`，`git diff --exit-code` |
| `import-smoke` | Ubuntu | 全量导入 + `tests.test_ci_import`，上传汇总 |

另有两条协作工作流：

- `ci-report-placeholder.yml`：PR 提交时创建占位评论。
- `ci-report.yml`：CI 完成后把占位评论更新为结果报告。

### 为什么 macOS 只跑 `macos-14`
`macos-15-intel` 没有 llvmlite 的 x86_64 wheel，`uv sync` 会必然失败。矩阵因此只包含 Apple Silicon 的 `macos-14`。

### API 契约校验

```bash
uv run python -m dev_tools.export_api_schema
git diff --exit-code -- frontend/src/api/generated.ts frontend/src/api/contract.json
```

改了后端参数模型却没导出契约，CI 直接失败。

### 生成产物校验

```bash
uv run -m dev_tools.button_extract
uv run -m module.config.config_updater
git diff --exit-code
```

这条检查拦住两类问题：改了 YAML 没生成，以及手改了生成文件。

## <DocIcon name="settings" /> 前端 e2e 的三种配置

| 命令 | 配置 | 用途 |
| --- | --- | --- |
| `npm run test:e2e` | 默认 | 连真实后端，覆盖主流程 |
| `npm run test:e2e:mock` | `playwright.mock.config.ts` | 模拟服务，界面改动首选 |
| `npx playwright test --config playwright.mind.config.ts` | 心智专项 | 心智计算器流程 |

CI 里会安装 Chromium 依赖并依次运行。

## <DocIcon name="shield" /> 写测试的边界

| 能测 | 不能测 |
| --- | --- |
| 配置迁移、参数校验 | 真实识别准确率 |
| 调度状态机、恢复矩阵 | 模拟器兼容性 |
| API 契约与会话鉴权 | 游戏活动机制 |
| 前端交互与表单保存 | OEM 系统上的悬浮窗行为 |

::: warning 静态验证不等于真机验证
文档里会明确区分「源码静态验证」与「真实设备验证」。编译通过、单测通过、甚至 CI 全绿，都不能说明某个识别在真机上可用。
:::

## <DocIcon name="circle-check" /> 提交前自检

- [ ] 改动相关的 Python 测试通过
- [ ] `ruff` 通过
- [ ] 前端改动用 `typecheck` + `vitest` 验证
- [ ] 改了 YAML → 跑过 `config_updater`
- [ ] 改了按钮 → 跑过 `button_extract`
- [ ] 改了 API → 跑过 `export_api_schema`
- [ ] 生成产物与源码一起提交
- [ ] PR 描述写清验证方式与未验证部分
- [ ] 未执行的检查不要勾选

## <DocIcon name="medal" /> 发布相关

| 工作流 | 触发 | 作用 |
| --- | --- | --- |
| `docker-publish.yml` | tag / master | 构建并推送镜像 |
| `sync-cnb.yml` | 推送 | 同步到 CNB |
| `git-over-cdn-*.yml` | 定时 / 手动 | 国内镜像分发 |
| `ai-issue-labeler.yml` | Issue | 自动打标签 |

发布流程见[发布与版本](/contributing/release)。
