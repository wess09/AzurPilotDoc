---
title: 构建与发布
description: 启动器的三平台构建流程、构建期环境变量、CI 打包矩阵、版本号同步方式与最终发布产物。
updated: 2026-10-20
---

# 构建与发布

启动器的发布包不是简单的二进制：它把 Python、uv、git、adb 一起塞进压缩包，做到「解压即用」。这是 CI 里最重的一步。

## <DocIcon name="laptop" /> 本地构建

```bash
cargo build              # debug
cargo build --release    # LTO + strip，体积优先
cargo tauri dev          # 开发运行
cargo check --locked --all-targets
cargo test --locked --all-targets
```

### 构建期注入

| 变量 | 作用 | 不设置的后果 |
| --- | --- | --- |
| `ALAS_BOOTSTRAP_UV` | 内嵌 uv 二进制 | 运行时回退 PATH 中的 uv |
| `ALAS_LAUNCHER_MTLS_IDENTITY_PEM_B64` | 自更新证书 | 回退读 `证书.txt`，缺失则自更新不可用 |
| `LAUNCHER_UPDATE_URL` | 覆盖更新源 | 用默认 `launcher-api.azurpilot.com` |

本地开发通常只设 `ALAS_BOOTSTRAP_UV`，自更新不测试。

::: danger Windows 本地运行会弹 UAC
manifest 在 `build.rs` 里内嵌 `requireAdministrator`，这不是可选项。测试进程管理相关代码时必须在管理员终端。
:::

## <DocIcon name="cloud" /> CI 打包

`.github/workflows/package.yml`，tag push 或手动触发：

| 阶段 | 内容 |
| --- | --- |
| 版本解析 | tag 必须形如 `2.0.6`，不接受 `v2.0.6`；手动触发可传版本 |
| 依赖准备 | 按平台缓存 Python、git、adb、uv |
| 构建 | `cargo build --release`（每个 runner 独立缓存） |
| 打包 | `tar.xz`，preset 9 + extreme |
| 发布 | 上传 Release，并发布更新清单与载荷 |

矩阵覆盖三个平台，产物按 `OS` 与架构命名，国际版与 `-cn` 版各一份：

```text
AP-<OS>-<arch>.tar.xz
AP-CN-<OS>-<arch>.tar.xz
```

Windows 另有 Inno Setup 安装器（`install.iss`，管理员权限、简体中文）。

## <DocIcon name="flask" /> 测试工作流

`.github/workflows/test.yml` 在 `main` 推送、PR 和手动触发时运行：

| 平台 | 命令 |
| --- | --- |
| Linux / macOS / Windows x64 / ARM64 | `cargo check --locked --all-targets` |
| 同上 | `cargo test --locked --all-targets` |

不需要发布密钥，所以 fork 也能跑。

## <DocIcon name="refresh" /> 版本同步

发布前必须同步三处：

```text
Cargo.toml           version = "2.2.5"
tauri.conf.json      "version": "2.2.5"
CHANGELOG.md         对应条目
```

::: warning 版本不一致的后果
`tauri.conf.json` 的版本会进入安装包元数据与自更新比较。只改 `Cargo.toml` 会导致「更新后仍提示有新版」或「装了新版但版本号没变」。
:::

CI 的 tag 校验会拒绝 `v` 前缀。打 tag 时用 `2.2.5`，不是 `v2.2.5`。

## <DocIcon name="package" /> 发布产物

| 产物 | 用途 |
| --- | --- |
| `AP-*.tar.xz` | 国际版，解压即用 |
| `AP-CN-*.tar.xz` | 国内镜像版 |
| Windows 安装器 | 可选，带开始菜单与卸载 |
| `stable.json` | 自更新清单 |
| 启动器载荷 | R2 + CNB Release |

清单托管在 Cloudflare 静态资源，不跑 Worker；下载入口用 302 指向实际载荷。

## <DocIcon name="circle-check" /> 发布检查清单

- [ ] `Cargo.toml` / `tauri.conf.json` / `CHANGELOG.md` 版本一致
- [ ] `cargo check --locked --all-targets` 通过
- [ ] `cargo test --locked --all-targets` 通过（或在管理员终端）
- [ ] 三平台各启动一次，确认环境自举成功
- [ ] Windows 确认 UAC 与托盘
- [ ] macOS 确认 `xattr` 后的首次打开
- [ ] Linux 确认 `libwebkit2gtk-4.1` 依赖
- [ ] 国际版与 CN 版各验证一次下载源
- [ ] 自更新：旧版本能检测到新版本并完成替换
- [ ] 回滚：旧包覆盖后仍能启动
- [ ] 退出启动器后模拟器仍在（进程生命周期）
- [ ] 卸载后无残留注册表项（除自启）

## <DocIcon name="megaphone" /> 发布后

| 动作 | 说明 |
| --- | --- |
| 更新 `stable.json` | 自更新才会看到新版本 |
| 上传 R2 与 CNB | 两个下载入口都要有 |
| 验证 302 | `launcher-download` 指向正确载荷 |
| 观察 Issue | 新版本首日的启动失败报告 |

## <DocIcon name="monitor" /> 多平台注意事项

| 平台 | 注意 |
| --- | --- |
| Windows | WebView2、UAC、Toast 通知、`CREATE_NO_WINDOW` |
| macOS | 未签名、WKWebView、无 `additionalBrowserArgs` |
| Linux | glibc 版本、webkit2gtk-4.1、托盘实现差异 |

三平台的进程/窗口/通知分支都必须在真机或对应 runner 上验证，不能只靠 `cargo check`。
