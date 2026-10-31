---
title: AzurPilot Launcher
description: 基于 Tauri 2 + Rust 的跨平台桌面启动器：内置 uv 与独立 Python/Node.js、自动拉取核心代码、托管后端进程。
updated: 2026-10-31
---

# AzurPilot Launcher

启动器解决的是「装 Python、配依赖、拉代码、构建前端、起服务」这些繁琐运维工作。它不包含游戏逻辑，只负责把核心程序与 WebUI 跑起来，并把它包装成一个开箱即用的跨平台桌面应用。

<div class="ap-meta">
<span><b>仓库</b> wess09/AzurPilotLauncher</span>
<span><b>分支</b> main</span>
<span><b>框架</b> Tauri 2 + Rust</span>
<span><b>运行时</b> Python 3.14.3 + Node.js 24.22.2（按需自举/独立管理）</span>
<span><b>许可证</b> GPL-3.0</span>
</div>

![启动器正在更新 AzurPilot](/img/launcher-update.jpg)

<Figure caption="启动器更新画面：显示目标版本、部署配置与进度，更新完成后自动进入主界面。" />

## <DocIcon name="wrench" /> 它到底做了什么

```text
解压/安装 → 启动器进程 → 启动画面 → 环境自举（uv/Python/git/adb）
     → git 更新核心仓库 → uv sync --frozen --no-dev --no-install-project
     → 探测/补齐 Node.js (≥22.12.0) → 构建 WebUI 前端
     → 启动 gui.py → 打开 WebUI（免密直达）→ 托盘常驻
```

| 能力 | 实现 |
| --- | --- |
| 环境自举 | 内嵌 uv，自动下载独立 Python 3.14.3，创建可重定位 `.venv` |
| 工具链 | git、adb 集中收拢并管理于 `.azurpilot/tools/`，不污染宿主全局环境 |
| Node.js 运行时 | 检查现有 Node.js 与 npm（≥22.12.0）；缺失或过旧时自动下载 Node.js 24.22.2 便携包（六平台架构，官方 SHA-256 校验），独立镜像源选择与自动回退，仅注入构建子进程 PATH |
| 代码更新 | `git pull`，失败重试至多 20 次 |
| 依赖同步 | `uv sync --frozen --no-dev --no-install-project`，按 `uv.lock` 严格锁定 |
| 环境修复 | 3.0.5 支持重新下载替换全部 deploy 引导脚本与系统模板，重建 `.venv`，严格保留用户配置与日志 |
| 后端托管 | 清理端口占用、注入环境标记、退出时全进程表回收（Windows Job Object / Unix 进程组） |
| 自更新 | SHA-256 强校验 + 多镜像源（官方/GitHub/Cloudflare CDN）回退机制 |
| 系统集成 | 托盘、原生通知、单实例运行、开机自启、阻止计算机自动睡眠与动态效果减弱 |
| 国际化 | 简中 / 繁中 / 日语 / 英语四语支持；系统 locale 自动识别，Windows 安装向导内置简体中文语言包 |

## <DocIcon name="handshake" /> 与核心程序的关系

| | 启动器 | 核心程序 |
| --- | --- | --- |
| 仓库 | AzurPilotLauncher | AzurPilot |
| 语言 | Rust / Tauri 2 | Python / React |
| 版本线 | 独立版本号（发布版基线 3.0.6，源码模板 0.0.0） | 跟随 `master` 滚动 |
| 更新 | 启动器自更新（SHA-256 强校验 / 清单回退） | `git pull` + `uv sync` |
| 包含游戏逻辑 | 否 | 是 |

::: tip 两个版本号不是一回事与 0.0.0 说明
启动器版本与核心程序完全解耦，启动器 3.x / 1.x 可以配任意核心提交。更新启动器不会回退核心代码，更新核心也不会改变启动器二进制。
在源码仓库中，`Cargo.toml`、`tauri.conf.json` 与 `Info.plist` 统一固定为 `0.0.0` 模板基线；实际发布版本（如稳定的 **3.0.6**，以及 **3.0.5**）由 CI 工作流在打包时动态解析 Git Tag 或输入参数并注入，避免多文件硬编码版本漂移。
:::

## <DocIcon name="clipboard" /> 环境要求

| 维度 | 要求 |
| --- | --- |
| 系统 | Windows 10+（x64 / ARM64）、macOS 12+、Linux（Ubuntu 22.04+ 或同等较新 glibc 发行版） |
| WebView | Windows 需 WebView2；macOS 使用系统 WKWebView；Linux 需 `libwebkit2gtk-4.1` 与 `libgtk-3` |
| Node.js | 无需用户预装。构建前端时优先复用系统中 ≥22.12.0 的环境；若缺失则启动器自动下载校验过的独立 Node.js 24 便携包 |
| 权限 | Windows 安装器与部分功能需管理员权限（安装 ADB、写系统目录与端口绑定） |
| 网络 | 首次启动或部署需联网下载 Python、Node.js 与项目依赖（支持国内镜像回退） |
| 磁盘 | 约 3–5 GB（含独立 .venv、工具链与核心代码仓库） |

## <DocIcon name="folder" /> 目录结构

跨平台打包提供了统一规范的目录组织形式：

```text
# Windows / Linux 目录结构
AzurPilot/                          # 根工作区目录
├── AzurPilot.exe / AzurPilot       # 启动器可执行文件
├── .azurpilot/                     # 启动器工具与运行时缓存
│   ├── tools/                      # 独立工具链
│   │   ├── git/                    # MinGit 或平台 git
│   │   ├── adb/                    # Google platform-tools adb
│   │   └── nodejs/                 # Node.js 24 便携运行时（按需自举）
│   ├── cache/                      # 组件归档下载缓存（SHA-256 寻址）
│   └── installed.json              # 组件安装收据
├── .venv/                          # Python 3.14.3 + uv + 依赖环境
│   ├── Scripts/ (Windows) 或 bin/ (Linux)
│   └── python/                     # standalone Python 安装目录
├── config/                         # 实例配置与 deploy.yaml
├── frontend/                       # 核心 WebUI 前端源码与 dist 产物
├── log/                            # 运行日志
└── AzurPilot_Data_Backup/          # 每日备份

# macOS 应用包结构 (App Bundle)
AzurPilot.app/
└── Contents/
    ├── MacOS/
    │   └── AzurPilot               # 启动器主入口二进制
    ├── Resources/
    │   └── icon.icns               # 应用图标
    ├── Info.plist                  # 应用属性与版本配置
    └── AzurPilot/                  # 独立工作区（含 .azurpilot/、.venv/、配置与日志）
```

启动器会向子进程追加环境变量：

| 平台 | PATH 追加范围与隔离 |
| --- | --- |
| 后端运行子进程 (Unix) | `.venv/bin` |
| 后端运行子进程 (Windows) | `.venv/Scripts`、`.venv/Scripts/git/cmd`（若使用内嵌 git） |
| 前端构建子进程 (三平台) | 将选中的 Node.js/npm `bin` 目录前置注入私有 `PATH`，不污染宿主全局环境或系统 PATH |

## <DocIcon name="scale" /> 与原版启动器的差异

| 项 | 本启动器 |
| --- | --- |
| 平台 | Windows（x64 / ARM64）、macOS、Linux |
| Node.js 管理 | 自动检测 ≥22.12.0 环境，缺失时自动下载 Node.js 24 便携包并多源回退，无需手动折腾前端环境 |
| 更新策略 | 只更新 git 仓库，依赖用 `.venv` 内的 uv 同步，修复时替换全部 deploy 脚本与模板 |
| 依赖锁定 | `uv.lock` 精确锁定，默认自动同步 |
| adb | 不强行重启、不强行替换 |
| 工具位置 | 全部收进 `.azurpilot/tools/` 与 `.venv` 专用工具目录 |
| 多语言 | 简中、繁中、日、英四语，安装向导内置中文语言文件 |

## <DocIcon name="map" /> 继续阅读

<ul class="ap-linklist">
<li><a href="/launcher/user/install">安装<span class="desc">三平台步骤与依赖</span></a></li>
<li><a href="/launcher/user/first-run">首次启动<span class="desc">环境初始化做了什么</span></a></li>
<li><a href="/launcher/user/maintenance">更新、修复与卸载<span class="desc">环境损坏怎么办</span></a></li>
<li><a href="/launcher/developer/architecture">Tauri 与 Rust 架构<span class="desc">源码入口</span></a></li>
</ul>
