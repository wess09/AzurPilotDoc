---
title: 发布与版本
description: 三个仓库各自的版本策略与发布节奏、发布前的检查清单，以及文档站如何跟随源码版本更新。
updated: 2026-10-20
---

# 发布与版本

三个仓库独立发布，没有统一的版本号。这一页说明各自的规则，避免「升级了启动器却以为核心也更新了」。

## <DocIcon name="medal" /> 版本策略

| 项目 | 版本方式 | 发布载体 |
| --- | --- | --- |
| 核心 | 滚动 `master`，无严格语义化版本 | git 提交 / Docker 镜像 |
| 启动器 | 语义化版本（如 `2.2.5`） | 压缩包 + 自更新清单 |
| Android | `versionCode` 时间戳 + `versionName` 提交计数 | 固定 Release + `latest.json` |
| 文档 | 跟随审计 commit | 静态站点 |

## <DocIcon name="zap" /> 核心程序

- 更新即 `master` 最新提交；没有「稳定版 tag」的承诺。
- Docker 镜像按 tag / master 构建。
- WebUI 的更新页按提交粒度展示。

发布前的最小检查：

- [ ] `ruff` 通过
- [ ] 相关单测通过
- [ ] `config_updater` / `button_extract` / `export_api_schema` 无 diff
- [ ] 导入冒烟通过
- [ ] 前端构建与 Vitest 通过

## <DocIcon name="rocket" /> 启动器

| 项 | 规则 |
| --- | --- |
| 版本号 | `Cargo.toml`、`tauri.conf.json`、`CHANGELOG.md` 三处同步 |
| tag | `2.2.5`，不接受 `v` 前缀 |
| 产物 | 三平台 tar.xz，国际版 + `-cn` |
| 自更新 | `stable.json` + mTLS 载荷 |

检查清单见[构建与发布](/launcher/developer/build-release#发布检查清单)。

## <DocIcon name="smartphone" /> Android

| 项 | 规则 |
| --- | --- |
| `versionCode` | HEAD 时间戳（CI 取 `max(旧值+1, 时间戳)`） |
| `versionName` | `1.<series>.<X>`，基线在 `GitVersion.kt` 与 CI 同步 |
| App 产物 | 按 ABI 完整包 + 双 ABI 轻量包 |
| Runtime | `rootfs-<abi>.tar.xz` + `BUILD_MANIFEST` |
| 清单 | 固定 Release 的 `latest.json` |

::: warning 基线以代码为准
仓库文档历史上有过不同基线记录。发布前读当前 `GitVersion.kt`，不要照抄旧数字。
:::

## <DocIcon name="file" /> 文档站

本站不发布 npm 包，只产出静态目录。版本跟随审计 commit：

1. 源码更新后重跑生成脚本。
2. 更新 `reference/versions.md` 的 commit 与日期。
3. 重跑 `npm run check` 与 `npm run test:e2e`。
4. 构建并检查产物（meta、canonical、sitemap）。

## <DocIcon name="shield" /> 兼容性声明

| 组合 | 承诺 |
| --- | --- |
| 新启动器 + 旧核心 | 尽力兼容，可能提示更新 |
| 旧启动器 + 新核心 | 不保证，缺少新协议时可能失败 |
| 新 APK + 旧 Runtime | 通常可用；依赖变化时提示整包 |
| 旧 APK + 新 Runtime | 不保证，宿主协议可能不匹配 |

「尽力兼容」不是「保证可用」。跨版本组合出问题时，先统一到同一天发布的版本再排查。

## <DocIcon name="megaphone" /> 发布后

| 动作 | 负责 |
| --- | --- |
| 更新 CHANGELOG | 各仓库 |
| 上传产物与清单 | 各仓库 CI |
| 更新文档版本页 | 文档维护者 |
| 观察首日 Issue | 维护者 |
| 必要时回滚 | 维护者 |
