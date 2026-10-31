---
title: 更新链路与镜像
description: 启动器的三层更新机制、deploy 引导脚本全量修复、Node.js 便携包多镜像自动回退、Python 独立运行时多镜像轮询、uv 依赖锁定同步与 Stable／Canary 通道。
updated: 2026-10-31
---

# 更新链路与镜像

启动器的更新体系由**四个彼此独立、分层解耦的环节**组成：
1. **运行引导组件（Git/ADB）与 deploy 引导脚本管理**；
2. **Python 与 Node.js 独立运行时自举与多镜像回退**；
3. **核心代码拉取与依赖精确同步**；
4. **启动器二进制自更新与通道切换**。

不能将这些环节混为一谈，也不应将所有更新过程简单概括为单一的命令行调用。

## 运行引导组件与 deploy 脚本管理

启动器在首次运行（部署阶段）或执行环境修复时，负责准备外部运行时工具链与 deploy 引导脚本：

- **外部工具组件**：从公开清单 `stable.json` 的 `runtime` 部分（schema 2）拉取对应平台的 Git（Windows 为 MinGit，macOS/Linux 为系统布局打包）、ADB 独立压缩包，解压部署至 `.azurpilot/tools/` 并校验 SHA-256 哈希，不污染宿主全局环境。
- **deploy 引导脚本与系统模板（3.0.5 改进）**：
  - 清单中列出 `deploy/**` 部署脚本与四个分系统模板（Windows 的 `deploy.template.yaml`、macOS/Linux 的 `deploy.template-linux.yaml` 以及对应的 `-cn` 变体）的 raw 下载路径。
  - **普通部署**：按清单逐项检查，只下载缺失或为空的脚本和当前系统模板。全部就绪后才提交部署记录；已有非空脚本由后续 git 更新接管，不被引导下载覆盖。
  - **显式环境修复**：从仓库 raw 源重新下载并逐文件原子替换清单中的全部 `deploy/` 脚本和当前系统模板，不再跳过已有非空文件；即使旧脚本损坏或版本过旧也能瞬间修复，同时严格保留用户配置文件（`config/deploy.yaml` 与 JSON 实例配置）。

## 独立 Python 运行时多镜像轮询

- 启动器内嵌 uv，自动在 `.venv/python` 目录下安装独立管理的 CPython 3.14.3（`uv python install --managed-python 3.14.3`）。
- **多镜像轮询机制**：内置默认轮询镜像列表：
  1. `https://registry.npmmirror.com/-/binary/python-build-standalone/`（首选国内镜像）
  2. `https://mirror.nju.edu.cn/github-release/astral-sh/python-build-standalone/`（备用高校镜像）
  3. `https://python-standalone.org/mirror/astral-sh/python-build-standalone/`（官方镜像源）
- 用户亦可在「设置」中选择 Python 下载源，或通过环境变量 `UV_PYTHON_INSTALL_MIRROR` 自定义覆盖。
- 下载失败时自动向用户展示当前镜像与回退状态，避免单点故障导致环境初始化中断。
- 通过 `uv venv --allow-existing --relocatable --python ... .venv` 创建独立的虚拟环境。

## Node.js 便携运行时自举与镜像回退链 (3.0.6)

在构建前端静态资源前，启动器自动调度 Node.js 自举模块（`src/nodejs.rs`），确保前端编译环境就绪：

### 1. 达标环境探测

- **判定标准**：Node.js 版本 ≥ 22.12.0（`MIN_VERSION = (22, 12, 0)`）且 npm 命令存在。
- **探测优先级**：优先检查启动器专用目录 `.azurpilot/tools/nodejs/node-v24.22.2-<platform>/`，其次检查系统 `PATH`、Windows 的 `ProgramData/AzurPilotLauncher/nodejs` 与 `ProgramFiles/nodejs`、Unix 的 `/usr/local/bin`、`/opt/homebrew/bin` 等。
- **防挂死保护**：执行 `node --version` 时设置 5 秒超时并监听 `cancel_requested`，避免损坏的本地环境挂起启动状态机。

### 2. 独立镜像选择与自动回退策略

设置模块提供独立的 `NodejsSource` 配置，支持以下镜像源：
- 官方源：`https://nodejs.org/dist`
- 淘宝镜像：`https://registry.npmmirror.com/-/binary/node`
- 南京大学镜像：`https://mirrors.nju.edu.cn/nodejs-release`

各模式下的自动尝试与回退链如下：

| 选择模式 | 首选站点 | 备选回退站点 1 | 备选回退站点 2 |
| --- | --- | --- | --- |
| **自动（国内网络环境）** | 淘宝镜像 (npmmirror) | 南京大学镜像 (nju) | 官方源 (official) |
| **自动（海外/默认网络）** | 官方源 (official) | 淘宝镜像 (npmmirror) | 南京大学镜像 (nju) |
| **显式：官方源** | 官方源 (official) | 淘宝镜像 (npmmirror) | 南京大学镜像 (nju) |
| **显式：淘宝镜像** | 淘宝镜像 (npmmirror) | 南京大学镜像 (nju) | 官方源 (official) |
| **显式：南京大学** | 南京大学镜像 (nju) | 淘宝镜像 (npmmirror) | 官方源 (official) |

当首选站点遭遇连接超时、HTTP 错误或下载中断时，启动器记录 warning 日志并自动尝试备选源，直至所有来源均失败才向用户报错。

### 3. 官方固定摘要强校验与安全隔离

- **六大主流架构覆盖**：Windows x64 / ARM64（`.zip`）、macOS x64 / ARM64（`.tar.gz`）、Linux x64 / ARM64（`.tar.gz`）。
- **官方 SHA-256 强校验**：启动器硬编码官方 release 的 `SHASUMS256.txt` 摘要；无论从哪个国内镜像下载，均要求计算出的流式 SHA-256 必须与官方摘要完全一致，杜绝镜像投毒与文件不完整。
- **安全沙盒解压**：使用内嵌 Python 脚本 `tools/extract_nodejs.py` 驱动解压，自动校验归档内相对路径，杜绝绝对路径与 `../` 路径穿越攻击。
- **原子替换与回滚**：解压并验证 usable 后，通过先备份再重命名（`activate`）的方式原子更新目标目录，失败时自动恢复旧环境。
- **私有 PATH 注入**：仅通过 `nodejs::configure_command` 为前端构建子进程注入前置 Node.js `PATH`，完全不修改系统全局安装或系统环境变量。

## 核心程序代码与依赖同步

在每次启动或更新核心时，启动器调度部署逻辑：

- **核心代码更新**：通过 `deploy.git.GitManager` 更新核心仓库代码，内置失败重试机制（`MAX_SYNC_RETRIES = 20`，每次间隔 1 秒），有效应对偶发网络丢包或连接抖动。
- **依赖精确同步**：
  - 启动器调用内置 uv 执行同步：
    ```bash
    uv sync --frozen --no-dev --no-install-project
    ```
  - `--frozen` 严格遵守核心仓库的 `uv.lock` 依赖锁，防止拉取未经验证的次级新版依赖；
  - `--no-dev` 与 `--no-install-project` 避免在生产环境引入开发测试依赖或将核心自身作为可安装包安装。
- **进度监听与解析**：启动器实时流式捕获 uv 与下载输出，自动解析进度并配合 19 条 Tips 轮播展示。

## 启动器正式版与 Canary 通道

启动器自身的更新机制与核心程序完全独立：

- **源码与发布版本解耦**：
  - 源码仓库配置文件（`Cargo.toml`、`tauri.conf.json`、`Info.plist`）统一设为 `0.0.0` 模板基线；
  - CI 在 Tag 推送或手动触发时动态替换为真实 SemVer（当前稳定发布基线为 **3.0.6**，以及 **3.0.5**）。
- **更新清单公开获取**：
  - 启动器从编译期配置的 `LAUNCHER_UPDATE_URL`（或备用源 `https://launcher-api.azurpilot.com/updata/stable.json`）拉取更新清单，清单拉取公开透明。
- **更新通道划分**：
  - `stable`（正式版，默认）：对应最新已发布的稳定版本（如 3.0.6）。
  - `canary`（测试构建）：每次 main 分支构建自动发布，版本号规则为 Cargo 基础版本的 patch 加 1（如 `3.0.7-canary.{提交哈希前8位}.{UTC时间戳}`），使旧正式版也能按版本号正常发现更新。
  - 两个通道独立判断版本，支持按所选通道在同号正式版与金丝雀之间平滑切换。
- **更新载荷源与回退策略**：
  - `updateSource` 可在「设置」中配置：`auto`（默认）、`official`、`github`、`cloudflare`。
  - 自动模式在检测到简体中文与北京时间环境下优先使用官方镜像，否则优先 GitHub 或 Cloudflare CDN。
  - 当遭遇网络异常或 HTTP 429 限流时，按配置顺序自动降级并执行指数退避。
- **载荷完整性与 mTLS 安全校验**：
  - 所有下载载荷必须通过 SHA-256 哈希校验；
  - 若配置了非 GitHub 官方源的更新请求，客户端在请求更新载荷时可附带编译期嵌入的 mTLS 证书完成双向认证。
  - 更新载荷下载或校验失败时，启动器会完整保留当前运行环境，绝不进行半途替换。

## 定时检查与错误回滚

- 启动器在后台约每 10 分钟执行一次非阻塞的轻量更新检查，发现新版本时在界面呈现更新提示，且针对同一版本不会重复弹出骚扰。
- 若更新替换过程中被用户点击取消（通过 `cancel_requested`），启动器安全终止下载或解压子线程，并清理临时下载文件。

详见[构建与发布](/launcher/developer/build-release)、[Tauri 与 Rust 架构](/launcher/developer/architecture)与[更新、修复与卸载](/launcher/user/maintenance)。
