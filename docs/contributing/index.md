---
title: 参与贡献
description: 提交 Issue 与 PR 的规范：什么该进 Issue、什么该进 PR、代码与文档的分工边界，以及哪些改动不会被接受。
updated: 2026-10-20
---

# 参与贡献

这三个仓库都是社区维护的开源项目。贡献不只有写代码：复现问题、补文档、验证设备兼容性同样有价值。

## <DocIcon name="gift" /> 可以贡献什么

| 类型 | 价值 | 入口 |
| --- | --- | --- |
| 复现 Bug 并给出日志 | 高 | Issue |
| 补充/修正文档 | 高 | 本站或仓库 `docs/` |
| 适配新活动图 | 高 | `campaign/` |
| 修复识别/调度问题 | 高 | PR |
| 设备兼容性验证 | 中 | Issue 附设备信息 |
| 翻译 | 中 | `i18n/*.json`、`locales/*.yml` |
| 新功能 | 需先讨论 | Issue 提案 |

## <DocIcon name="circle-alert" /> 提交 Issue

一个能修的 Issue 至少包含：

```text
版本：核心 7de6bb9 / 启动器 2.2.5 / 无 Android
环境：Windows 11 + MuMu12 16384 + 1280×720
复现：设置 → 任务 → 科研 → 启用 → 立即执行
期望：完成收取
实际：卡在「科研项目列表」，日志最后 20 行如下
证据：log/error/ap/2026-10-20_10-00-00/ 截图与 log.txt
已试：换截图方案、重启模拟器、换关卡
```

::: danger 不要贴凭据
`config/deploy.yaml`、`password.txt`、`remote-access.json`、SSH 私钥、账号截图都不要发。维护者不会向你要这些。
:::

## <DocIcon name="handshake" /> 提交 PR

### 流程

1. Fork，从默认分支拉分支（核心是 `master`，另外两个是 `main`）。
2. 改动聚焦单一主题。
3. 跑与改动相关的测试与生成器。
4. 按 `.github/PULL_REQUEST_TEMPLATE.md` 填写。
5. 确保 CI 通过。

### 核心仓库的额外要求

| 改动 | 必须 |
| --- | --- |
| 配置 YAML | 运行 `config_updater`，提交生成产物 |
| 按钮资源 | 运行 `button_extract` |
| API 参数 | 运行 `export_api_schema` |
| 新任务 | 补 i18n 五语言、模块文档、索引 |
| 模块行为 | 更新 `docs/modules/` 对应文档 |

### 不要做的事

- 不要手改 `args.json`、`menu.json`、`config_generated.py`、`generated.ts`、`contract.json`。
- 不要用 `--no-verify` 跳过钩子。
- 不要把格式化无关改动混进功能 PR。
- 不要在 PR 里提交 `config/`、`log/`、`.venv/`。
- 不要在未验证的情况下勾选「已测试」。

## <DocIcon name="pencil" /> 代码风格

| 语言 | 约定 |
| --- | --- |
| Python | 4 空格；中文注释；标识符英文；遵循现有模块结构 |
| TypeScript | 严格模式；组件就近；不引入新状态库 |
| Rust | `cargo fmt`；平台分支用 `#[cfg]`；日志用 `tracing` |
| Kotlin | 4 空格；KDoc 记录线程与生命周期约束 |
| Markdown | 中文技术写作，短句，先结论后细节 |

## <DocIcon name="file" /> 文档贡献

见[文档维护](/contributing/docs)。原则只有一条：**事实来自源码或可复现的实验**，不来自印象。

## <DocIcon name="shield" /> 安全

如果你发现的是安全问题（凭据泄露、越权、注入），不要公开提 Issue。通过仓库 Security 页面或维护者邮箱私下报告。

| 类型 | 例子 |
| --- | --- |
| 凭据泄露 | 日志打印密码、配置明文提交 |
| 越权 | 非本机请求访问 `/android/*`、Binder 回投未校验 |
| 注入 | 配置值进入 shell 命令 |
| 供应链 | 依赖被替换、下载未校验 |

## <DocIcon name="scale" /> 许可证

| 仓库 | 许可证 | 注意 |
| --- | --- | --- |
| 核心 | GPL-3.0 | 分发修改版需开源 |
| Android | AGPL-3.0 | 网络服务也需提供源码 |
| 启动器 | GPL-3.0 | 同上 |

提交即表示你同意以对应许可证分发你的贡献。不要提交来源不明或授权不兼容的代码与素材。
