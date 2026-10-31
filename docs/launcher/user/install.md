---
title: 安装启动器
description: Windows、macOS、Linux 的下载、解压、权限与运行步骤，以及 WebView 依赖、Node.js 便携运行时自举、安装器安全策略和首次启动检查。
updated: 2026-10-31
---

# 安装启动器

Windows 提供安装向导（如 `AzurPilot_Setup_3.0.6.exe`、`AzurPilot-Windows-x64-Setup.exe`）和便携压缩包；macOS 与 Linux 提供带独立运行时环境的平台压缩包（`.tar.xz`）。首次运行或点击「部署」时，启动器会确保运行组件与 Python 环境就绪，并取得核心代码。构建 WebUI 前端时，启动器会自动探测或按需下载 Node.js 24 便携包，用户无需手动预装 Node.js 或 npm。

## <DocIcon name="download" /> 下载

| 渠道 | 地址 |
| --- | --- |
| GitHub Releases | `github.com/wess09/AzurPilotLauncher/releases/latest` |
| 官网下载页 | `azurpilot.com/download.html` |
| 国内镜像 | Releases 镜像源或 CNB 归档 |

选择**对应系统与 CPU 架构**的包：

| 文件名特征 | 适用平台与说明 |
| --- | --- |
| `AzurPilot-Windows-x64-Setup.exe` / `Windows-x64-Setup.exe` | 绝大多数 64 位 Windows PC（含兼容运行 x64 的 ARM 设备） |
| `AzurPilot-Windows-arm64-Setup.exe` / `Windows-arm64-Setup.exe` | 原生 Windows 11 on ARM 设备 |
| `AzurPilot-macOS-*.tar.xz` / `macOS-*.tar.xz` | macOS（含 Apple Silicon 与 Intel 架构） |
| `AzurPilot-Linux-x86_64.tar.xz` / `Linux-aarch64.tar.xz` | Linux 对应架构 |
| 带 `-cn` 标记 | 预置国内镜像源（PyPI / Git / Node.js 镜像）配置 |

::: tip 国际版与 CN 版的区别
两者的启动器二进制相同，区别在部署配置里的下载源：`-cn` 使用国内代码与依赖镜像。网络环境不同就选不同版本，启动后也可以在「设置」中随时手动切换下载源（包括组件下载源、Python 镜像、Node.js 镜像与 PyPI 源）。
:::

## <DocIcon name="folder" /> 解压与安装位置

若使用便携版或解压包，应选择一个**固定、可写、路径简单**的目录：

- ✅ `D:\AzurPilot\` 或 `D:\Apps\AzurPilot\`
- ✅ `~/Applications/AzurPilot/` 或 `/Applications/AzurPilot.app`
- ❌ `C:\Program Files\`（手动解压普通用户无直接写权限）
- ❌ 中文路径 + 特殊符号混用（部分底层工具链兼容性差）
- ❌ 同步盘（OneDrive / iCloud 会锁定 `.venv` 内部文件）

::: danger 不要放在系统临时目录
启动器管理的核心仓库、`.venv`、配置与日志均位于工作区中。放在临时目录会被系统清理工具误删，导致配置丢失。
:::

## <DocIcon name="monitor" /> Windows

Windows 提供图形化安装程序与便携版两种安装方式：

<Steps>
<Step title="运行安装向导或解压">

- **安装向导版（推荐）**：运行 Setup 安装程序。安装向导内置简体中文语言文件（`installer/ChineseSimplified.isl`），提供全中文图形界面。
  - 默认安装位置为 `{autopf}\AzurPilot`。
  - 安装程序会自动对安装目录及内部 `.venv`、`log` 目录赋予普通用户可写权限（`users-modify`），无需后续手动提权即可正常记录日志与执行环境自举。
  - **安装路径安全保护**：向导会自动校验安装路径，禁止安装到 `C:\Windows` 等系统关键目录、裸 Program Files 根目录或磁盘根目录（如 `D:\`）。若选择了上级目录，向导会自动追加子目录防止误操作。
  - **进程安全清理**：若覆盖安装或更新，安装程序会自动检查并终止可能占用的旧版启动器或 Python 子进程（`pythonw.exe` / `python.exe`）。
- **便携压缩包**：先用 7-Zip 或系统解压到独立文件夹，切勿直接在压缩包内双击打开。

</Step>
<Step title="允许管理员权限">

启动器的 manifest 声明了管理员权限请求（用于设置底层网络与安装 ADB 工具链等），启动时若弹出 UAC 提权提示，请点击「允许」。

</Step>
<Step title="处理 SmartScreen">

如果 SmartScreen 拦截下载文件，先确认文件来自官方发布渠道并检查发行者/签名信息；确认无误后点击「更多信息」→「仍要运行」。

</Step>
<Step title="确认 WebView2 运行时">

Windows 11 系统已内置 WebView2。Windows 10 若弹出缺失提示，下载并安装 [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) 即可。

</Step>
</Steps>

## <DocIcon name="laptop" /> macOS

macOS 发布包为 `.tar.xz` 格式，解压后得到标准的 `.app` 应用程序包（`AzurPilot.app`）。

```bash
# 解压并移动至系统应用程序目录
tar -xf AzurPilot-macOS-$(uname -m).tar.xz
mv "AzurPilot.app" /Applications/

# 移除隔离标记
xattr -dr com.apple.quarantine "/Applications/AzurPilot.app"
open "/Applications/AzurPilot.app"
```

由于社区开源构建未加入 Apple 付费开发者签名，首次打开前需通过 `xattr` 命令移除 macOS Gatekeeper 的 quarantine 隔离标记，即可正常运行。

::: tip 内部结构与空间优化
macOS 应用包内部包含了 `Contents/MacOS` 主程序与 `Contents/AzurPilot` 独立工作区，CI 打包时使用 `rdfind` 硬链接去重与 xz 极限压缩，减小了应用体积。
:::

## <DocIcon name="wrench" /> Linux

Linux 提供包含独立 `.venv` 与二进制的 `.tar.xz` 归档：

```bash
tar -xf AzurPilot-Linux-x86_64.tar.xz
cd AzurPilot
chmod +x AzurPilot
./AzurPilot
```

系统运行依赖：

| 依赖库 | 说明 |
| --- | --- |
| `libwebkit2gtk-4.1` | Tauri 2 所需的 WebKit 渲染引擎 |
| `libgtk-3` | 窗口系统支持 |
| `libappindicator3` | 系统托盘与状态指示支持 |
| 较新 glibc | CI 基于 Ubuntu 22.04 构建 |

在 Debian / Ubuntu 上安装依赖：

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0 libappindicator3-1
```

如果系统缺少 GUI 环境或库版本过旧，核心程序也可以直接在控制台启动：进入工作区后使用 `.venv/bin/python main.py`（或 `gui.py`）。

## <DocIcon name="circle-check" /> 首次启动检查

首次启动时，启动器会执行初始化检查与环境自举。判断运行正常的标准：

| 检查项 | 正常表现 |
| --- | --- |
| 启动画面 | 实时显示进度条、状态副标题与 19 条贴心 Tips 轮播 |
| 依赖安装 | 依次显示准备环境、下载/复用 Python 3.14.3、`uv sync` 依赖同步 |
| 前端就绪 | 探测系统或私有 Node.js（≥22.12.0）；缺失时自动下载 Node.js 24 便携包并完成 WebUI 构建 |
| 主窗口 | 启动完成后自动载入 WebUI 界面，通过单次登录凭据免密访问 |
| 默认端口 | 默认监听本机 `22267` |
| 目录就绪 | 工作区内生成 `.venv/`、`.azurpilot/`、`config/`、`log/` 等必要子目录 |

## <DocIcon name="file-pen" /> 命令行参数

启动器支持通过命令行传参覆盖运行设置与界面语言：

| 参数 | 格式 / 别名 | 作用 |
| --- | --- | --- |
| `--lang` / `--locale` | `--lang <zh-CN\|zh-TW\|ja\|en>`、`/lang <locale>`、`--lang=zh-CN` | 强制指定界面语言，优先级高于系统自动识别 |
| `--skip-update` | `--skip-update` | 跳过核心仓库与运行组件的联网更新检查 |
| `--preview-crash` | `--preview-crash` | 调试用：直接预览崩溃/错误提示界面 |
| `--start-minimized` | `--start-minimized` | 启动后自动最小化到系统托盘（开机自启动时调用） |

## <DocIcon name="circle-off" /> 卸载

- **Windows 安装程序版**：在系统「设置」→「已安装的应用」中找到启动器并点击卸载。卸载向导会自动清理进程，并**弹出对话框交互询问是否保留本地运行环境与配置数据**。选择「是」将保留数据方便日后重装；选择「否」将完全移除安装目录。
- **便携版与 macOS / Linux**：退出启动器后，先备份 `config/` 与统计数据，然后直接删除应用文件夹或 `.app` 包。

```text
建议保留：config/、AzurPilot_Data_Backup/
可随应用删除：.venv/、.azurpilot/、frontend/dist/、log/
```

## <DocIcon name="message" /> 常见安装问题

| 现象 | 原因与解决方案 |
| --- | --- |
| 双击启动无反应 | 未通过 UAC 授权，或被第三方杀毒软件拦截；检查管理员权限 |
| Windows 提示缺少 WebView2 | 从微软官网下载安装 Evergreen 独立安装包 |
| macOS 提示「应用已损坏」 | Gatekeeper 拦截未签名应用，使用 `xattr -dr com.apple.quarantine` 移除属性 |
| Linux 报 `libwebkit2gtk-4.1` 缺失 | 确认安装了 `4.1` 版本而非旧版 `4.0` |
| 语言显示不是中文 | 系统 locale 识别为外语；可通过启动参数 `--lang zh-CN` 强制指定 |
| 覆盖安装提示文件被占用 | 安装程序会自动 `taskkill`，若手动解压请确认已在托盘完全退出启动器和 Python 进程 |
| Node.js 下载超时或校验失败 | 启动器会在淘宝镜像、南京大学镜像与官方源之间自动回退；可在「设置」中手动指定 Node.js 下载源 |
