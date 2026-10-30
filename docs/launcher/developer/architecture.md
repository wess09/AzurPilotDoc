---
title: Tauri 与 Rust 架构
description: AzurPilot Launcher 3.x 的 React 前端、Tauri 2 原生桥、部署与启动状态机、WebSocket v2 及安全边界。
updated: 2026-10-31
---

# Tauri 与 Rust 架构

Launcher 3.x 是 **Tauri 2 + Rust + React** 桌面程序，不再是旧版的纯 Rust 内嵌 HTML 启动画面。用户操作由 `frontend/src/App.tsx`、`SettingsDialog.tsx` 等组件处理，Rust 负责部署、启动和管理 Python 后端、系统集成及自更新。

## 核心代码入口

| 路径 | 职责 |
| --- | --- |
| `frontend/src/App.tsx` | 首页、部署／启动／更新／停止、二次确认取消、错误提示与日志入口 |
| `frontend/src/SettingsDialog.tsx` | 语言、镜像、Stable／Canary、外观与系统开关 |
| `src/launcher.rs` | 操作状态机、取消和修复 |
| `src/components.rs` | 运行组件清单、校验、下载、事务恢复 |
| `src/setup.rs` | Python、仓库、依赖及前端部署 |
| `src/settings.rs` | SQLite 设置持久化 |
| `src/backend.rs` | `gui.py` 启动与健康检查 |
| `src/launcher_control.rs` | 与后端的鉴权 WebSocket v2 |
| `src/updater.rs` | 启动器自身更新及载荷校验 |
| `src/power.rs` | 三平台阻止计算机自动睡眠 |

## 部署、启动与取消

```text
首次打开 → 首页显示「部署」
  → 下载 Git、ADB 与 deploy 引导文件
  → 完成后返回首页
点击「启动」
  → 内嵌 uv 安装 Python 3.14.x、部署 requests
  → deploy.git 更新 AzurPilot 源码
  → uv 同步依赖、deploy.app 构建 WebUI
  → 启动 gui.py → 建立受保护的本机 WebSocket
  → 用一次性票据打开 WebUI
```

部署和启动是两个明确的按钮操作。取消采用两次点击确认；组件提交及后端启动有相应的取消／回滚边界。环境修复会重新下载组件并重建 Python 环境，保留用户配置与日志。详情见[首次运行](/launcher/user/first-run)及[环境修复](/launcher/user/maintenance)。

## 通信协议与认证

启动器连接后端本机 `ws://127.0.0.1:<WebuiPort>/api/v2/launcher/ws`，用 `Authorization: Bearer <AP_WEBUI_TRUST_SECRET>` 建立**启动器专用**的 WebSocket v2 会话。该密钥由启动器注入 Python 后端，不能放入网页或日志。通道承载 `session.hello`、`state.report`、`autostart.get/set`、`notifications.ack`、`login.issue` 等指令。

后端业务 WebSocket 仍是 `/api/v1/ws`，**它与启动器 v2 通道不是同一协议**。启动器获取 60 秒有效、只能使用一次的 `launcherTicket` 后打开 WebUI，浏览器消费票据并移除 URL 中的参数。旧的 `/api/launcher/*`、`/api/notify_stream` 等 HTTP/SSE 接口已被移除。详见[核心 WebSocket API](/api/websocket)和[后端进程生命周期](/launcher/developer/backend-lifecycle)。

## 设置与平台行为

设置持久化在启动器 SQLite 中，包含自动启动、托盘偏好、更新通道、下载源、减弱动态效果、背景音频及阻止空闲睡眠。阻止睡眠分别使用 Windows 电源接口、macOS IOPM 和 Linux `systemd-inhibit`；它不代表必须保持显示器常亮。视频在窗口隐藏时暂停。

Windows 使用 Job Object 管理后端进程，Unix 使用进程组；真正退出时回收后端和 worker，但不应连带关闭模拟器。修改时应分别验证运行和退出两条路径。

## 验证

```bash
npm --prefix frontend test
npm --prefix frontend run build
cargo check --locked --all-targets
cargo test --locked --all-targets
cargo test --locked --test launcher_ws
```

以上是仓库提供的检查命令，不表示本站已经执行了三平台实机验证。构建和发布见[构建与发布](/launcher/developer/build-release)。