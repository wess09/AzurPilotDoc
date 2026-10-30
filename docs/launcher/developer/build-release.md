---
title: 构建与发布
description: Launcher 3.0.4 的 Tauri／React 构建、组件清单 schema 2、跨平台 CI、Windows 签名及 Stable／Canary 发布链路。
updated: 2026-10-31
---

# 构建与发布

当前正式版本基线为 **3.0.4**。Launcher 仓库包含 React 前端、Tauri 2/Rust 后端，以及生成 Git/ADB 运行组件的 CI；并不把完整 AzurPilot 核心、Python 环境和 WebUI 源码全部打入安装包。

## 本地验证

```bash
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run build
cargo check --locked --all-targets
cargo test --locked --all-targets
```

提交生产版本前，还需要在目标操作系统检查实际部署、后端启动、更新、退出和模拟器存活。

## CI 构建职责

`.github/workflows/package.yml` 主要负责：

1. 获取核心 `master` 的部署引导清单，打包对应平台的 Git、ADB ZIP，并校验可执行文件。
2. 只构建一次与平台无关的 `frontend/dist`，供多个平台的打包作业复用。
3. 按 Windows、Linux、macOS 及支持的架构构建启动器；Windows 可同时生成 Inno Setup 安装程序并进行代码签名。
4. 按版本发布 `stable` 或 `canary` 载荷，将清单与运行组件发布至相应源。

组件清单使用 `stable.json.runtime`（schema 2），包含平台、`git`／`adb` ZIP 的 `sha256` 与 `size`，以及 deploy 脚本下载列表。Python 3.14.x、核心源码、依赖和 WebUI 构建在用户启动阶段完成，不能把「组件发布」理解为完整 Runtime 镜像。

## 版本与发布渠道

- 正式版：以 `Cargo.toml`、`tauri.conf.json` 等实际版本信息与 Git tag 为准，最新已发布 3.0.4。
- Canary：每次符合条件的 `main` 构建将基础 patch 加一，再附加 `-canary.<短 SHA>.<UTC 时间戳>`。滚动构建写入清单的 `canary` 字段。
- 更新载荷清单可含 `url`、`github_url`、`cloudflare_url`，下载失败按配置顺序回退。载荷使用 SHA-256 校验。
- 更新清单公开拉取；非 GitHub 下载源的载荷请求可使用构建时嵌入的 mTLS 客户端证书。证书和签名私钥不得提交到仓库。

跨平台版本矩阵与具体发布资产应以 `.github/workflows/package.yml` 和 [Releases](https://github.com/wess09/AzurPilotLauncher/releases) 为准，不应手写固定平台数量。

## 发布检查

1. 确认版本一致，相关测试通过。
2. 检查组件 ZIP、运行引导脚本、CN 与国际源及 SHA-256。
3. 验证正式版与 Canary 不互相覆盖清单，切换通道能发现正确更新。
4. 验证 Windows 安装程序与便携包、macOS App 迁移以及 Linux 依赖。
5. 验证下载中断、429 回退、取消和环境修复时不会删除用户配置。
6. 确认 CI 的实际最终结果，不能把代码检查通过写成设备实测通过。

另见[更新链路与镜像](/launcher/developer/update)和[架构说明](/launcher/developer/architecture)。