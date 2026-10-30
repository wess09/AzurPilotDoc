---
title: 首次启动与环境初始化
description: Launcher 3.x 如何分别部署 Git、ADB 与引导文件，再安装 Python、同步 AzurPilot、构建 WebUI 并启动后端。
updated: 2026-10-31
---

# 首次启动与环境初始化

Launcher 3.x 将**部署**和**启动**拆成两个操作。第一次打开后先完成部署，再点击启动；不必自行预装 Git、ADB、uv 或 Python。

## 第一步：部署运行组件

首页缺少组件时显示「部署」。点击后：

1. 读取更新清单 `stable.json` 的 `runtime` 部分（schema 2）。
2. 下载并校验当前平台的 Git 和 ADB ZIP，安装到 `.azurpilot/tools/`。
3. 补齐 `deploy/**` 脚本及系统对应的 `config/deploy.template*.yaml`。
4. 成功后返回首页，主按钮变为「启动」。

部署**不会**安装 Python、拉取核心程序或构建前端。中断后会尝试补齐未完成部分；不会因为取消而清空已经存在的配置。组件源可在「设置」中选择自动、CNB 或 GitHub。参见[更新链路](/launcher/developer/update)。

## 第二步：启动核心程序

点击「启动」后，依次完成：

1. 内嵌 `uv` 安装可用的 Python 3.14.x，建立 `.venv`，并安装 deploy 引导依赖。
2. 运行 `deploy.git` 拉取或更新 AzurPilot 核心和资源。
3. 按核心的 `uv.lock` 同步 Python 依赖（发生镜像故障时有回退）。
4. 运行 `deploy.app` 检查、构建 WebUI 前端；缺少 Node.js 时可能提示需要安装。
5. 启动 `gui.py`，默认监听本机 `22267`；等待后端就绪后建立专用 WebSocket v2。
6. 生成一次性登录票据并打开 WebUI，用户不必重复输入 WebUI 密码。

Git/ADB 独立于 `.venv`，重建 Python 环境不等于重新部署全部工具。升级不会在一次「部署」按钮操作中执行完整链路。

## 首页和设置

- 首页可以执行部署、启动、检查更新、环境修复、停止后端，以及导出日志压缩包。
- 进行中的操作需要二次点击才确认取消，点击后会显示取消中。
- 「设置」提供 Stable／Canary、各类下载源、语言、背景音乐、减弱动态效果、阻止计算机自动睡眠和系统启动相关设置。
- 退出启动器与隐藏窗口到托盘不是同一行为。退出后端会被回收，但模拟器应独立保留。

## 故障处理

| 现象 | 优先检查 |
| --- | --- |
| 「部署」下载失败 | 组件下载源、网络、磁盘；重试或执行环境修复 |
| 「启动」找不到 `pyproject.toml` | 核心代码未部署完整，执行环境修复 |
| `uv sync` 失败 | PyPI 镜像、网络与 `uv.lock` |
| WebUI 构建失败 | Node.js 与前端构建日志 |
| 启动后端超时 | `log/` 日志、端口 `22267` 与 Python 异常 |
| 反馈问题 | 使用首页「导出日志」，不要只发送截图 |

环境修复会强制重新下载 Git/ADB，重新创建 `.venv`；它不删除配置和日志。详见[更新、修复与卸载](/launcher/user/maintenance)及[后端架构](/launcher/developer/architecture)。