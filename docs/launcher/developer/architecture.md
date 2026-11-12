---
title: Tauri 与 Rust 架构
description: AzurPilot Launcher 的 Tauri 2 + Rust 原生桥、Node.js 运行时自举、deploy 引导全量替换、SQLite 设置持久化与跨平台进程边界。
updated: 2026-11-12
---

# Tauri 与 Rust 架构

启动器基于 **Tauri 2 + Rust** 桌面框架开发，负责在不同桌面操作系统上提供启动画面、自举 Python 运行环境与 Node.js 便携包、同步代码与依赖、管理后端子进程并与 WebUI 桥接。

## 核心代码与架构分工

| 路径 | 核心模块 | 职责与平台特性 |
| --- | --- | --- |
| `src/main.rs` | 应用程序生命周期 | Tauri 2 Builder 配置、启动画面（splash window）与主窗口路由、系统托盘管理、开机自启动与时间炸弹检查 |
| `src/setup.rs` | 环境自举状态机 | 跨平台工作区识别、Python 3.14.3 独立管理（多镜像源）、relocatable `.venv` 创建、`uv sync` 依赖同步、调用 Node.js 自举并构建前端、任务取消信号处理与环境安全清理 |
| `src/nodejs.rs` | Node.js 便携运行时管理 | 自动探测达标环境（≥22.12.0），缺失时自动下载 Node.js 24.22.2 便携包（六平台，官方 SHA-256 校验），多镜像回退，防路径穿越安全解压，原子替换与构建子进程 PATH 隔离 |
| `src/sources.rs` | 镜像源策略与回退链 | 定义 `DownloadSource`、`PythonSource`、`NodejsSource`、`PypiSource` 枚举，生成候选 URL 序列与跨镜像自动回退规则 |
| `src/settings.rs` | SQLite 设置持久化 | 读写 `launcher.db`，管理各下载源及系统开关配置，支持旧配置无缝兼容（缺失字段默认 auto）与非法输入防御 |
| `src/components.rs` | 运行组件与引导脚本 | 清单解析、Git/ADB 组件下载解压与校验；3.0.5 支持环境修复时全量重新下载替换全部 `deploy/**` 脚本与系统模板，严格保留用户配置 |
| `src/backend.rs` | 后端服务托管 | 子进程启动与重定向、端口冲突检测、心跳探活与退出时全进程回收 |
| `src/window_util.rs` | 窗口属性封装 | **Windows**：为子进程附加 `CREATE_NO_WINDOW` 标记，避免弹出黑色命令行控制台 |
| `src/i18n.rs` | 国际化语言引擎 | 基于 `rust-i18n` 与 `sys-locale`，集成启动参数（`--lang`/`--locale`）与系统 locale 探测 |
| `src/notify.rs` | 通知与通信流 | SSE 流（`/api/notify_stream`）监听与系统原生通知中心桥接 |
| `install.iss` | Windows 安装器配置 | Inno Setup 脚本，支持 x64 与 ARM64 双架构，集成目录权限赋予与安全路径拦截 |
| `installer/ChineseSimplified.isl` | 安装向导语言包 | 内嵌简体中文向导语言文件，保证 CI 与离线环境编译稳定性 |

## 工作区发现与跨平台目录解析

启动器需要定位后端代码、工具链和虚拟环境。不同操作系统的目录结构存在差异，`setup.rs` 实现了自适应候选目录探测机制：

```text
# Windows / Linux：同级工作区
[exe_dir]
├── AzurPilot.exe / AzurPilot
├── .azurpilot/tools/ (git/, adb/, nodejs/)
└── main.py / pyproject.toml / uv.lock (.venv/)

# macOS：App Bundle 内部嵌入工作区
[AzurPilot.app]
└── Contents/
    ├── MacOS/ (exe_dir)
    ├── Resources/
    ├── Info.plist
    └── AzurPilot/ (工作区: .azurpilot/tools/, main.py, pyproject.toml, uv.lock, .venv/)
```

探测流程：
1. 获取当前可执行程序所在路径 `executable_dir()`。
2. **macOS 平台**：若 `exe_dir.file_name()` 为 `MacOS`，自动检查 `Contents/AzurPilot`（旧版兼容 `Contents/NTEPilot`）目录。
3. **Windows / Linux 平台**：检查 `exe_dir` 同级目录。
4. 校验目标目录下必须同时具备三个基准文件：`main.py`（或 `gui.py`）、`pyproject.toml` 与 `uv.lock`。

## 启动状态机、取消与安全清理

启动器在启动阶段通过 `setup_workspace` 推进状态流：

```text
打开启动器 → 检查工作区完整性
  → 准备环境 (ensure_runtime_tools)
      ├─ 检查/下载 Python 3.14.3 (npmmirror / nju / 官方源轮询)
      └─ 创建 relocatable .venv (Scripts/ 或 bin/) 并安装 requests
  → git 更新核心仓库代码 (最多重试 20 次)
  → uv sync --frozen --no-dev --no-install-project
  → Node.js 运行时探测与自举 (nodejs::ensure)
      ├─ 探测现有环境 (私有目录 / 系统 PATH，验证 >= 22.12.0)
      └─ 缺失时下载 Node.js 24.22.2 (多镜像回退、SHA-256 校验、安全解压、原子替换)
  → 构建 WebUI 前端 (deploy.app，仅向子进程注入私有 PATH)
  → 启动后端进程 (Windows Job Object / Unix 进程组)
  → 端口就绪，打开 WebUI (免密直达)
```

- **实时进度解析**：启动器捕获 `uv` 与下载流的标准输出，实时识别阶段并更新 `SplashUpdate` 结构。
- **Tips 轮播**：内置 19 条贴心 Tips，在启动与等待期间展示温馨提示与排障技巧。
- **原子取消与状态回滚**：支持通过 `cancel_requested: Arc<AtomicBool>` 响应用户取消操作，主动向子进程发送终止信号并清理临时文件，防止产生半初始化的损坏环境。
- **安全清理防护**：运行时重建函数 `cleanup_runtime_for_rebuild` 会强制比对工作区路径是否确实属于当前启动器，避免跨目录误删。

## 部署引导脚本与模板管理（3.0.5 改进）

在 `src/components.rs` 中，`download_deploy_bootstrap` 负责下载 `deploy/**` 部署脚本与系统对应的 `deploy.template*.yaml`：

- **普通部署**（`repair = false`）：检查 `bootstrap_file_ready`，只下载缺失或为空的文件。已有非空脚本交由 git 更新管理，普通部署不予覆盖。
- **显式环境修复**（`repair = true`）：跳过已有文件跳过逻辑，强制重新联网下载清单中全部 `deploy/` 脚本及当前系统模板，逐文件原子写入（`temporary` 文件 `fs::rename` 覆盖目标）。
- **用户数据保护**：用户配置文件（`config/deploy.yaml`、`config/user.json`）、用户代码与清单外文件严格不下载、不修改，保证修复操作安全无损。

## Node.js 运行时自举与子进程隔离（3.0.6 改进）

在 `src/nodejs.rs` 中，Node.js 运行时管理遵循轻量、安全与宿主零污染原则：

1. **达标版本探测**：
   - 目标最低版本常量 `MIN_VERSION = (22, 12, 0)`。
   - 探测候选包括 `.azurpilot/tools/nodejs/node-v24.22.2-<platform>/`，系统 `PATH`，Windows 的 `ProgramData/AzurPilotLauncher/nodejs` 与 `ProgramFiles/nodejs`，Unix 的 `/usr/local/bin` 等。
   - 通过限时 5 秒的可取消子进程执行 `node --version`，避免挂起损坏的宿主 Node.js。
2. **多镜像下载与回退**：
   - 支持 Windows x64/ARM64（zip）、macOS x64/ARM64（tar.gz）、Linux x64/ARM64（tar.gz）。
   - 镜像源包括官方源（`nodejs.org/dist`）、淘宝镜像（`npmmirror.com`）、南京大学镜像（`mirrors.nju.edu.cn`）。
   - 下载循环中捕获超时与错误，自动尝试下一个镜像源；所有下载包大小限制在 200 MiB 以内，并计算流式 SHA-256。
3. **安全隔离解压与原子激活**：
   - 解压由嵌入的 Python 脚本 `tools/extract_nodejs.py` 驱动，使用已建好的 `.venv/python` 在沙盒内解压，防御文件名穿越（`..` 与绝对路径）。
   - 解压至临时目录验证 usable 后，通过 `activate` 进行原子替换：先将目标目录重命名为 `previous` 备份，移动成功后清理备份；若替换失败则自动回退旧环境。
4. **子进程 PATH 隔离**：
   - `nodejs::configure_command(&mut cmd, &node_bin)` 仅修改子进程的 `PATH` 环境变量，将 Node.js 的 bin 目录置于最前，绝不修改父进程或系统的全局环境变量。

## SQLite 设置持久化与安全校验

设置模块（`src/settings.rs`）使用嵌入式 SQLite 数据库存储启动器偏好：

- **存储路径**：数据目录下的 `AzurPilot/launcher.db`。
- **键值对存储**：`settings` 表（`key TEXT PRIMARY KEY, value TEXT NOT NULL`）。
- **独立下载源管理**：
  - `downloadSource`：`auto` / `cnb` / `github`
  - `pythonSource`：`auto` / `nju` / `ustc` / `npmmirror` / `aliyun` / `cnb` / `astral`
  - `nodejsSource`：`auto` / `official` / `npmmirror` / `nju`
  - `pypiSource`：`auto` / `pypi` / `tsinghua` / `ustc` / `aliyun` / `tencent` / `huawei` / `nju`
- **向后兼容与安全防御**：
  - 读取旧版本数据库时，若缺少 `nodejsSource` 键，自动回退默认枚举 `NodejsSource::Auto`。
  - 反序列化严格校验合法枚举；若数据库被外部篡改或注入自定义 URL（如恶意下载链接），反序列化直接报错并安全重置为 `Auto`，防止任意 URL 注入。

## 国际化与语言解析架构

启动器支持 `zh-CN`（简体中文）、`zh-TW`（繁体中文）、`ja`（日本語）和 `en`（English）四种语言：

- **优先级**：命令行覆盖参数 > 系统检测 locale > 英语默认回退。
- **命令行参数识别**：`i18n.rs` 支持 `--lang <locale>`、`--locale <locale>`、`/lang <locale>`、`/locale <locale>` 以及 `--lang=zh-CN`、`--locale=zh-CN` 形式。
- **智能语言归一化**：
  - 含有 `tw`、`hk`、`hant` 或 `zht` 归为 `zh-TW`；
  - 其他 `zh` 开头归为 `zh-CN`；
  - `ja` 或 `jp` 归为 `ja`；
  - 其他未识别标识回退至 `en`。
- **Inno Setup 安装器**：内嵌 `installer/ChineseSimplified.isl`，解决 Windows 安装阶段的语言本地化，无需依赖主机系统或 CI Runner 预装中文语言包。

## 进程托管与退出安全边界

- **Windows 平台**：使用 Windows Job Object（`JOB_OBJECT_LIMIT_BREAKAWAY_OK` 与 `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`）管理后端。模拟器启动时声明 Breakaway 机制，使得启动器退出时能够彻底回收 Python 后端和 worker，同时保持模拟器独立运行。
- **Unix 平台**：通过独立进程组（Process Group）与信号机制回收子进程。
- **控制台无窗口化**：Windows 平台统一附加 `CREATE_NO_WINDOW` 标记，彻底杜绝子进程弹黑窗。

## 托盘与上下文菜单实现

| 模块 | 源码入口 | 职责 |
| --- | --- | --- |
| 托盘事件 | `src/main.rs`、`src/launcher.rs` | 注册托盘图标事件、平台分支、菜单动作和 IPC 命令 |
| Windows 托盘弹窗 | `src/tray_menu.rs`、`frontend/src/TrayMenu.tsx` | 预建透明 WebView 窗口，按 DPI 与指针位置定位；提供首页、显示 / 隐藏、退出动作 |
| 页面右键菜单 | `frontend/src/ContextMenu.tsx`、`frontend/src/contextMenu.module.css` | 拦截 WebView 默认菜单，按选区与输入焦点启用刷新、复制、粘贴、全选 |
| 权限与测试 | `capabilities/tray-menu.json`、`frontend/src/menus.test.tsx`、`frontend/src/focusRing.css` | 限定托盘窗口 IPC 权限，覆盖菜单交互并绘制可见键盘焦点 |

Windows 使用自绘 Fluent 托盘弹窗；macOS 保留原生 NSMenu；Linux 当前不创建系统托盘图标。Windows 弹窗在启动时预建并隐藏，右键后贴近指针显示，失焦、Esc 或短时间内再次右键会收起。托盘菜单动作共用 `handle_tray_menu_action`，避免 Windows 与 macOS 两套业务逻辑分叉。

页面内右键菜单替换 WebView2 / WKWebView 的浏览器默认菜单。复制仅在有文本选区时启用；粘贴和全选要求输入框或文本域聚焦。菜单外点击、窗口失焦或 Esc 会关闭菜单。

当前 main 分支的功能状态与用户操作见[更新、修复与卸载](/launcher/user/maintenance)。

## 验证与测试命令

```bash
npm --prefix frontend test
npm --prefix frontend run build
cargo check --locked --all-targets
cargo test --locked --all-targets
```

详见[构建与发布](/launcher/developer/build-release)、[后端进程生命周期](/launcher/developer/backend-lifecycle)与[更新链路与镜像](/launcher/developer/update)。