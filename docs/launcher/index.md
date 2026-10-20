---
title: AzurPilot Launcher
description: 基于 Tauri 2 + Rust 的跨平台桌面启动器：内置 uv 与 Python、自动拉取核心代码、托管后端进程。
updated: 2026-10-20
---

# AzurPilot Launcher

启动器解决的是「装 Python、配依赖、拉代码、起服务」这四件事。它不包含游戏逻辑，只负责把核心程序跑起来，并把它包装成一个正常的桌面应用。

<div class="ap-meta">
<span><b>仓库</b> wess09/AzurPilotLauncher</span>
<span><b>分支</b> main</span>
<span><b>框架</b> Tauri 2 + Rust</span>
<span><b>运行时</b> Python 3.14.6（内置）</span>
<span><b>许可证</b> GPL-3.0</span>
</div>

![启动器正在更新 AzurPilot](/img/launcher-update.jpg)

<Figure caption="启动器更新画面：显示目标版本、部署配置与进度，更新完成后自动进入主界面。" />

## <DocIcon name="wrench" /> 它到底做了什么

```text
解压 → 启动器进程 → 启动画面 → 环境自举（uv/Python/git/adb）
     → git 更新核心仓库 → uv sync --frozen
       → 启动 gui.py → 打开 WebUI（免密直达）→ 托盘常驻
```

| 能力 | 实现 |
| --- | --- |
| 环境自举 | 内嵌 uv，下载 Python 3.14.6，创建可重定位 `.venv` |
| 工具链 | git、adb 一并装进 `.venv`，不污染系统 |
| 代码更新 | `git pull`，失败重试至多 20 次 |
| 依赖同步 | `uv sync --frozen`，按 `uv.lock` 锁定 |
| 后端托管 | 清理端口占用、注入环境标记、退出时全进程表回收 |
| 自更新 | mTLS 校验 + 多镜像回退 |
| 系统集成 | 托盘、原生通知、单实例、开机自启 |
| 国际化 | 简中 / 繁中 / 日语 / 英语，按系统 locale |

## <DocIcon name="handshake" /> 与核心程序的关系

| | 启动器 | 核心程序 |
| --- | --- | --- |
| 仓库 | AzurPilotLauncher | AzurPilot |
| 语言 | Rust / Tauri | Python / React |
| 版本线 | 独立版本号 | 跟随 `master` 滚动 |
| 更新 | 自更新（mTLS） | `git pull` + `uv sync` |
| 包含游戏逻辑 | 否 | 是 |

::: tip 两个版本号不是一回事
启动器 1.x 可以配任意核心提交。更新启动器不会回退核心代码，更新核心也不会改启动器。
:::

## <DocIcon name="clipboard" /> 环境要求

| 维度 | 要求 |
| --- | --- |
| 系统 | Windows 10+、macOS、Linux（较新 glibc） |
| WebView | Windows 需 WebView2；macOS 用系统 WKWebView；Linux 需 `libwebkit2gtk-4.1` |
| 权限 | Windows 需要管理员（安装 ADB、写系统目录） |
| 网络 | 首次启动需联网下载 Python 与依赖 |
| 磁盘 | 约 3–5 GB（含 .venv 与仓库） |

## <DocIcon name="folder" /> 目录结构

```text
AzurLaneAutoScript/                 # Windows / Linux 根目录
AzurPilot.app/Contents/AzurLaneAutoScript/   # macOS

├── alas-launcher.exe / alas-launcher
├── .venv/                          # Python + uv + git + adb
├── config/                         # 实例配置与 deploy.yaml
├── frontend/                       # 核心仓库的前端
├── log/                            # 运行日志
└── AzurPilot_Data_Backup/          # 每日备份
```

启动器会向子进程追加环境变量：

| 平台 | PATH 追加 |
| --- | --- |
| Unix | `.venv/bin` |
| Windows | `.venv/Scripts`、`.venv/Scripts/git/cmd` |

## <DocIcon name="scale" /> 与原版启动器的差异

| 项 | 本启动器 |
| --- | --- |
| 平台 | Windows / macOS / Linux |
| 更新策略 | 只更新 git 仓库，依赖用 `.venv` 内的 uv 同步 |
| 依赖锁定 | `uv.lock` 精确锁定，默认自动同步 |
| adb | 不重启、不替换 |
| 工具位置 | 全部收进 `.venv` |
| Node.js | 仅 Windows：检测系统 Node，缺失时可自动安装（SHA-256 校验） |

## <DocIcon name="map" /> 继续阅读

<ul class="ap-linklist">
<li><a href="/launcher/user/install">安装<span class="desc">三平台步骤与依赖</span></a></li>
<li><a href="/launcher/user/first-run">首次启动<span class="desc">环境初始化做了什么</span></a></li>
<li><a href="/launcher/user/maintenance">更新、修复与卸载<span class="desc">环境损坏怎么办</span></a></li>
<li><a href="/launcher/developer/architecture">Tauri 与 Rust 架构<span class="desc">源码入口</span></a></li>
</ul>
