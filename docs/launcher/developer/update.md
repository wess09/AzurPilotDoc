---
title: 更新链路与镜像
description: Launcher 3.x 的组件部署、核心源码更新、Stable／Canary 清单、mTLS 载荷、下载源与失败回退。
updated: 2026-10-31
---

# 更新链路与镜像

Launcher 3.x 有**三个不同环节**：下载运行引导组件、部署／更新核心程序、更新启动器自身。它们不使用同一套清单字段，也不能把所有操作都描述为 `git pull && uv sync --frozen`。

## 运行引导组件

启动器从公开 `stable.json` 的 `runtime`（schema 2）读取每平台 Git、ADB ZIP 的 SHA-256、大小与下载地址，并补齐 `deploy/**` 以及系统对应的 `deploy.template*.yaml`。组件位于 `.azurpilot/tools/`，正常部署使用缓存、显式环境修复强制重新下载并校验。组件下载和 Python 安装是两个阶段。

下载源偏好 `downloadSource` 有自动、CNB、GitHub；自动优先级按系统原始简体中文语言和北京时间共同判断，网络失败回退另一源。Python 与 PyPI 镜像还有独立设置；`config/deploy.yaml` 中用户明确指定的 PyPI 镜像保持优先。

## 核心程序和 WebUI

点击首页「启动」后，内嵌 uv 安装 Python 3.14.x、初始化 `.venv`，并通过 deploy 脚本更新仓库、同步依赖与构建前端。部署脚本使用的依赖同步方式是 `uv sync --no-dev --no-install-project`，失败可按镜像回退／重新解析锁定。**不能将该过程写成始终执行 `uv sync --frozen`**。

此过程不依赖此前已撤回的六组件预构建协议。只安装 Git、ADB 等引导组件，不会从 CI 下载完整的 Python 环境或核心源码镜像。详见[首次启动](/launcher/user/first-run)。

## 启动器正式版与 Canary

启动器更新清单由构建期 `LAUNCHER_UPDATE_URL` 指定，失败后回退 `https://ap.launcher-update.nanoda.work/updata/stable.json`。**清单本身公开获取，不要求 mTLS**；在非 GitHub 下载源取得更新载荷时才使用编译期提供的 mTLS 身份（如果配置），随后核验 SHA-256。

`updateChannel` 可选 `stable`（默认）或 `canary`。同一份清单的顶层字段描述正式版，`canary` 字段描述对应测试构建；没有可用 Canary 条目时不提示更新。更新选择依照通道判断版本，避免同号正式版与 Canary 相互误判。

`updateSource` 可选 `auto`（默认）、`official`、`github`、`cloudflare`，**只调整载荷 URL 优先级，不影响清单地址**。自动模式在简体中文＋北京时间环境优先官方源，否则优先 GitHub、Cloudflare、官方源。所有可用候选源均需遵守完整性校验，遇到 HTTP 429 可降低并发、按 Retry-After 退避并继续未完成分片；用户可以取消。

## 通知、发布与回滚

启动器会定期（约每 10 分钟）在后台检查可用更新，发现新版本时在首页显示更新入口，并针对同一版本避免重复通知。应用期间若下载失败或验证失败，保留当前启动器和用户数据，不应将失败的载荷当作成功。

发布流程由 `.github/workflows/package.yml` 管理；运行组件清单的 `runtime` 字段与启动器更新载荷字段独立更新，Canary 不覆盖 Stable。更多信息见[构建与发布](/launcher/developer/build-release)与[维护指南](/launcher/user/maintenance)。