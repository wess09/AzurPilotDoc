---
title: 首次启动与环境初始化
description: Launcher 如何管理 Git/ADB/deploy 引导组件，通过独立 uv 与镜像回退安装 Python 3.14.3，自动探测或下载 Node.js 24 便携包构建前端，并安全启动托管后端。
updated: 2026-10-31
---

# 首次启动与环境初始化

启动器将**组件部署**和**服务启动**明确拆分为两个阶段。第一次打开后先确保运行环境与工具链就绪，再点击启动；用户不必预先在操作系统中手动安装 Git、ADB、uv、Python、Node.js 或 npm。

## 第一步：部署运行组件

首次打开若缺少必要的环境工具，启动器首页将提示进行「部署」：

1. **读取更新清单**：从官方源获取 `stable.json` 的 `runtime` 部分（schema 2）。
2. **下载并校验二进制工具**：按所选下载源下载当前平台对应的 Git（Windows 为 MinGit，macOS/Linux 为发行版打包）和 Google platform-tools ADB 归档包，经 SHA-256 强校验后解压至 `.azurpilot/tools/` 目录。
3. **补齐 deploy 引导脚本与模板**：从仓库 raw 源按清单补齐 `deploy/**` 部署引导脚本以及系统对应的配置模板（Windows 为 `deploy.template.yaml`，macOS/Linux 为 `deploy.template-linux.yaml`；国内网络自动选用对应 `-cn` 变体）。普通部署只下载缺失或为空的文件，已有非空文件由 git 接管，不覆盖修改。
4. **提交安装记录**：部署全部就绪后写入 `.azurpilot/installed.json` 并返回主界面，状态切换为“启动”。

部署阶段**不强行捆绑整个 Python 运行时、Node.js 或庞大源码镜像**，避免体积过大与不同系统架构的兼容问题。中断后会记录事务，再次部署会自动补齐未完成部分；即使取消也不会清空已经存在的用户配置。组件源可在「设置」中选择自动、CNB 或 GitHub。参见[更新链路与镜像](/launcher/developer/update)。

## 第二步：启动核心程序

点击「启动」后，启动器后台状态机将依次执行环境自举流程：

1. **内嵌 uv 自举与独立 Python 准备**：
   - 启动器提取编译期嵌入的 `uv` 二进制（或复用系统/独立 uv）。
   - 检测 `.venv/python` 下的独立 Python 3.14.3；若不存在，则使用 uv 自动下载 `cpython-3.14.3` 独立构建包。
   - **多镜像回退保障**：内置轮询淘宝镜像源 npmmirror（国内首选）、南京大学镜像源以及官方源（或用户通过 `UV_PYTHON_INSTALL_MIRROR` 指定的自定义镜像）。
   - 创建 relocatable 可重定位虚拟环境 `.venv`（Windows 下为 `Scripts`，Unix 下为 `bin`），并安装 requests 引导依赖。
2. **源码检查与更新**：
   - 执行 `deploy.git.GitManager` 拉取或更新核心程序仓库（重试至多 20 次）。
3. **依赖精确同步**：
   - 调用 `uv sync --frozen --no-dev --no-install-project`，严格按照 `uv.lock` 锁定版本同步依赖，避免安装项目本身或开发依赖。
   - 解析 uv 输出中的 `Resolved`、`Downloading`、`Prepared`、`Installed` 等进度状态，实时反馈至界面。
4. **Node.js 运行时探测与自动自举**：
   - **达标环境探测**：检查本地是否存在可用的 Node.js ≥ 22.12.0 且带有 npm。优先探测启动器私有目录 `.azurpilot/tools/nodejs/`，随后搜索系统 `PATH` 以及常见目录（Windows 的 `ProgramData/AzurPilotLauncher/nodejs`、`ProgramFiles/nodejs`；Unix 的 `/usr/local/bin`、`/opt/homebrew/bin`、`/usr/bin`），带 5 秒超时与取消保护。
   - **便携包自动下载**：若未检测到可用环境，启动器自动下载官方 Node.js 24.22.2 便携包（覆盖 Windows x64/ARM64、macOS x64/ARM64、Linux x64/ARM64 六大主流平台）。
   - **独立镜像选择与回退**：支持在「设置」中独立选择“Node.js 下载源”（自动、淘宝镜像 npmmirror、南京大学镜像 nju、官方源 official）。自动模式在国内环境下优先走淘宝与南大镜像，海外优先官方源；显式指定某一源时优先使用，当下载失败或网络超时时**自动无缝回退至备用源**。
   - **官方摘要校验与安全解压**：所有镜像源统一经过内置的官方 SHA-256 摘要强校验；使用 `.venv` 隔离 Python 脚本进行防路径穿越解压，验证可用后原子替换至 `.azurpilot/tools/nodejs/` 目录。
   - **私有 PATH 注入**：仅为前端构建子进程注入前置 Node.js `PATH`，**绝不修改系统全局安装或系统环境变量**。
5. **前端资源构建与检查**：
   - 运行 `deploy.app.AppManager`（`ensure_frontend`）构建 WebUI 前端静态资源；若已有匹配指纹的 `dist` 产物则直接跳过。
6. **后端启动与安全连接**：
   - 启动 `gui.py`（或 `main.py`），默认监听本机 `22267` 端口；Windows 平台使用 Job Object 纳管，Unix 平台使用独立进程组。
   - 后端就绪后建立受保护的启动器专用 WebSocket 连接。
7. **打开 WebUI**：
   - 生成 60 秒有效的单次登录凭据（Launcher Ticket），唤起内置或系统浏览器打开 WebUI，免密直达管理界面。

## 启动画面与状态交互

- **进度与状态反馈**：启动画面实时显示进度百分比、主任务标题与副标题；内置 19 条贴心 Tips 轮播展示（包含环境优化、使用技巧与故障排查建议）。
- **取消操作与安全清理**：若在环境初始化或依赖同步过程中点击取消，启动器支持原子取消信号（`cancel_requested`），会安全终止子进程并执行临时文件清理，防止虚拟环境处于半损坏状态。
- **首页与设置**：
  - 首页提供部署、启动、检查更新、环境修复、停止后端以及导出日志压缩包入口。
  - 「设置」面板支持细粒度控制：
    - **语言选择**：简体中文 / 繁体中文 / 日本語 / English。
    - **更新通道**：正式版（Stable） / 金丝雀测试构建（Canary）。
    - **更新下载源**：自动 / 官方源 / GitHub / Cloudflare CDN。
    - **组件下载源**：自动 / CNB / GitHub。
    - **Python 下载源**：自动 / 南京大学 / 中科大 / 淘宝镜像 / 阿里云 / CNB / Astral 官方。
    - **Node.js 下载源**：自动 / 淘宝镜像 / 南京大学 / 官方源。
    - **PyPI 源**：自动 / PyPI 官方 / 清华大学 / 中科大 / 阿里云 / 腾讯云 / 华为云 / 南京大学。
    - **系统与外观**：播放背景音乐、减弱动态效果（暂停背景动画/视频，允许系统按时息屏）、阻止计算机自动睡眠（三平台电源锁）以及开机自启动。

## 常见初始化故障排查

| 故障现象 | 关键排查点 | 解决方案 |
| --- | --- | --- |
| Python 下载超时或失败 | 检查网络连接与镜像源连接性 | 启动器会自动尝试备用镜像；亦可在「设置」中切换 Python 下载源或在环境变量中指定 `UV_PYTHON_INSTALL_MIRROR` |
| `uv sync` 报依赖锁定错误 | 检查 `uv.lock` 与 PyPI 镜像配置 | 确认网络可访问 PyPI 镜像源；若文件损坏可尝试首页「环境修复」 |
| Node.js 下载超时或 SHA-256 校验失败 | 网络连接或镜像站点抖动 | 在「设置」中切换 Node.js 下载源（淘宝镜像 / 南京大学 / 官方源），重试启动；所有镜像均有官方摘要保护 |
| Node.js 解压报错退出 | 系统防病毒软件或权限拦截 | 检查 `.azurpilot/tools/` 目录写入权限，临时放行安全软件；启动器会自动回滚损坏目录 |
| 找不到 `pyproject.toml` | 核心仓库未能完整拉取 | 检查 git 网络连通性，或执行环境修复重新检出 |
| WebUI 前端加载白屏 | 前端编译产物或 Node.js 环境 | 检查 `frontend/dist/` 是否生成完整，查看启动日志详情；启动器已集成 Node.js 24 自动自举 |
| 引导脚本报错或版本过旧 | 旧 `deploy/` 脚本损坏 | 点击首页「环境修复」，3.0.5 起环境修复会强制重新联网下载替换全部 `deploy/` 脚本与系统模板 |
| 后端启动超时（等待 60 秒） | 端口占用或 Python 语法/依赖异常 | 检查 `22267` 端口是否被其他进程占用，查阅 `log/` 最新日志定位具体报错 |
| 反馈问题时的日志提供 | 点击首页「导出日志」按钮 | 导出脱敏后的 ZIP 日志包，连同系统版本反馈，避免仅发送单张截图 |

环境修复会强制重新下载 Git/ADB 组件与 deploy 引导脚本，并重建 `.venv` 虚拟环境，但会严格保留用户的 `config/` 配置与历史运行日志。详见[更新、修复与卸载](/launcher/user/maintenance)及[Tauri 与 Rust 架构](/launcher/developer/architecture)。