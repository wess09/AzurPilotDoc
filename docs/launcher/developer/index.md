---
title: 启动器开发者入口
description: Tauri 2 + Rust 项目的模块划分、Node.js 运行时自举、版本基线（3.0.6/0.0.0）、构建命令、构建期环境变量与跨平台约定。
updated: 2026-10-31
---

# 启动器开发者入口

启动器基于 **Tauri 2 + Rust** 构建，集成了轻量 Webview 渲染、进程托管与系统级集成；负责自举独立 Python 与 Node.js 便携运行时、同步核心依赖与管理后端服务。

## <DocIcon name="laptop" /> 开发环境与工具链

| 工具 | 版本 / 要求 | 说明 |
| --- | --- | --- |
| Rust | stable（edition 2021） | 编译启动器核心逻辑与 Tauri 原生桥接 |
| Node.js | v20+（CI 使用 Node 22） | 运行启动器自身前端构建与打包工具；部署后运行时由启动器自动管理 |
| Inno Setup | Inno Setup 6 / 7 | **仅 Windows**：构建 Setup 安装程序（CI 通过 choco 安装） |
| 系统底层库 | 三平台对应依赖 | Windows：WebView2；Linux：`libwebkit2gtk-4.1`、`libgtk-3`、`libappindicator3`、`librsvg2`、`patchelf`、`rdfind`；macOS：`rdfind`、Xcode CLI |

基础开发与编译命令：

```bash
cargo build              # debug 编译
cargo build --release    # 生产编译（开启 LTO 与 strip）
cargo tauri dev          # 开发调试运行
cargo test               # 单元测试与集成测试
cargo check              # 快速编译语法检查
```

Windows 下编译 Inno Setup 安装包（可在本地测试安装程序）：

```powershell
ISCC.exe install.iss /DTargetArch=x64 /DAppVersion=3.0.6
# 或 ARM64
ISCC.exe install.iss /DTargetArch=arm64 /DAppVersion=3.0.6
```

::: warning Windows 需要管理员终端
启动器 manifest 声明了 `requireAdministrator`。未提权时完整测试程序可能以错误 740 启动失败，`cargo test` 也会受影响。
:::

## <DocIcon name="box" /> 核心模块结构

| 源码路径 | 职责与能力 |
| --- | --- |
| `src/main.rs` | Tauri 应用程序入口：主窗口与启动画面（splash window）控制、系统托盘管理、错误页、全局命令与时间炸弹控制 |
| `src/setup.rs` | 运行时环境自举：Python 3.14.3 安装、创建 relocatable `.venv`、`uv sync` 依赖同步（最大 20 次重试）、调用 Node.js 自举并构建前端、取消控制与环境安全清理 |
| `src/nodejs.rs` | Node.js 运行时探测与自动自举：检测系统或私有可用环境（≥22.12.0），缺失时自动下载 24.22.2 便携包（六平台，官方 SHA-256 校验），安全解压并仅注入子进程 PATH |
| `src/sources.rs` | 下载源策略与镜像定义：组件源、Python 源、Node.js 源（官方/淘宝/南大）与 PyPI 源的 URL 解析与自动回退链 |
| `src/settings.rs` | SQLite 设置持久化（`launcher.db`）：读写与更新各下载源设置，向后兼容默认回退并校验非法注入 |
| `src/components.rs` | 二进制运行组件（Git/ADB）与 deploy 引导脚本管理；3.0.5 支持环境修复时全量重新下载替换全部 deploy 脚本与系统模板 |
| `src/backend.rs` | 后端服务子进程生命周期管理、端口占用探测与清理、心跳健康检查与进程回收 |
| `src/window_util.rs` | **Windows**：封装 `CREATE_NO_WINDOW` 进程创建标记，避免子进程弹出黑框控制台 |
| `src/notify.rs` | SSE 通知流监听（`/api/notify_stream`）与各操作系统原生通知推送 |
| `src/i18n.rs` | 国际化语言解析：支持 `--lang`、`--locale`、`/lang`、`/locale` 命令行覆盖与系统 locale 自动识别 |
| `locales/` | 4 种语言定义文件：`zh-CN.yml`（简体中文基准）、`zh-TW.yml`、`ja.yml`、`en.yml`（英文回退） |
| `install.iss` | Windows Inno Setup 安装包工程脚本，支持 x64 与 ARM64 双架构，集成目录安全权限配置与进程清理 |
| `installer/ChineseSimplified.isl` | 仓库内嵌的 Inno Setup 简体中文官方语言包，确保在任意 CI Runner 均能稳定编译中文安装向导 |

## <DocIcon name="scale" /> 版本基线机制：3.0.6 与 0.0.0

在源码仓库中，所有配置文件（`Cargo.toml`、`tauri.conf.json`、`Info.plist`）统一将版本号固定为 `0.0.0` 模板基线：

- **为什么源码固定为 `0.0.0`**：启动器包含多个跨平台配置文件，若在源码中手动更新版本，极易出现跨文件版本号不一致或提交冲突。
- **CI 动态解析与注入**：`.github/workflows/package.yml` 中的 `Resolve release version` 步骤会在检测到 Git Tag（例如 `3.0.6`、`3.0.5`）或手动发布触发时，自动验证 SemVer 规范，并批量重写 `Cargo.toml`、`tauri.conf.json`、`Info.plist` 中的版本字段，并以 `/DAppVersion` 编译参数注入 Inno Setup。
- **当前发布基线**：当前公开的稳定发布版本为 **3.0.6**（3.0.5 引入 deploy 脚本修复替换，3.0.6 恢复 Node.js 自动下载与独立镜像源）。源码树中的 `0.0.0` 属于模板占位符，不代表处于未定义状态。

## <DocIcon name="settings" /> 构建期环境变量与关键常量

`build.rs` 与代码库支持以下编译期与运行时配置：

| 常量 / 变量 | 说明与默认值 |
| --- | --- |
| `PYTHON_VERSION` | `3.14.3`（独立 managed Python 构建版本） |
| `NODEJS_VERSION` | `24.22.2`（便携 Node.js 发行包版本） |
| `MIN_NODEJS_VERSION` | `(22, 12, 0)`（达标 Node.js 最低允许版本） |
| `MAX_DOWNLOAD` (Node.js) | `200 MiB`（Node.js 下载包安全大小上限） |
| `DEFAULT_UV_PYTHON_INSTALL_MIRRORS` | 默认 Python 安装镜像列表：npmmirror、南京大学镜像、官方 python-standalone |
| `UV_PYTHON_INSTALL_MIRROR` | 可选环境变量，用户覆盖自定义 Python 下载源 |
| `WebUI 端口` | 默认 `22267` |
| `MAX_SYNC_RETRIES` | 依赖同步重试次数，默认 20 次 |
| `TIPS_COUNT` | 启动画面 Tips 总数（19 条） |
| `时间炸弹` | `Cargo.toml` 中 `[package.metadata.ntep-launcher.time-bomb]`，默认 `enabled = false` |

## <DocIcon name="shield" /> 编码与贡献约定

1. **多语言对齐**：新增界面文本时，需在 `locales/` 下的 4 个语言文件（`zh-CN.yml`、`zh-TW.yml`、`ja.yml`、`en.yml`）同时添加对应翻译键，代码中使用 `t!("...")` 宏调用。
2. **多平台兼容**：系统特性（如 Windows Job Object、Unix 进程组、macOS App Bundle 路径）必须通过 `#[cfg(target_os = "...")]` 或 `#[cfg(windows)]` / `#[cfg(unix)]` 严格隔离。
3. **隐藏控制台黑窗**：所有子进程调用统一通过 `window_util::CreateNoWindow` 附加无窗口标记。
4. **统一日志记录**：使用 `tracing` 框架记录日志，不要直接在生产逻辑中使用 `println!`。
5. **保护用户数据**：任何清理或重置函数必须校验工作区归属，禁止删除用户 `config/` 配置与备份目录。
6. **环境变量隔离**：子进程所需的特定环境（如 Node.js bin 路径、uv 代理跳过配置）必须精准注入对应 Command，不得调用 `std::env::set_var` 污染父进程或系统全局环境变量。

## <DocIcon name="flask" /> 测试与检查

```bash
cargo check --locked --all-targets
cargo test --locked --all-targets
# 运行 Node.js 镜像与解压测试
python -m unittest discover -s tools -p "test_*.py"
```

## <DocIcon name="map" /> 文档地图

<ul class="ap-linklist">
<li><a href="/launcher/developer/architecture">Tauri 与 Rust 架构<span class="desc">窗口、协议、托盘</span></a></li>
<li><a href="/launcher/developer/backend-lifecycle">后端进程生命周期<span class="desc">Job Object 与回收</span></a></li>
<li><a href="/launcher/developer/update">更新链路与镜像<span class="desc">git、uv、Node.js、mTLS</span></a></li>
<li><a href="/launcher/developer/build-release">构建与发布<span class="desc">三平台矩阵</span></a></li>
</ul>
