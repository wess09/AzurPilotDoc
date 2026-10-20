---
title: 安装启动器
description: Windows、macOS、Linux 的下载、解压、权限与运行步骤，以及 WebView 依赖和首次启动检查。
updated: 2026-10-20
---

# 安装启动器

启动器是绿色压缩包，没有安装向导。真正的「安装」发生在首次启动：它会在目录里创建 `.venv`、下载 Python、拉取核心仓库。

## <DocIcon name="download" /> 下载

| 渠道 | 地址 |
| --- | --- |
| GitHub Releases | `github.com/wess09/AzurPilotLauncher/releases/latest` |
| 官网下载页 | `azurpilot.com/download.html` |
| CNB | 国内镜像 |

选择**对应系统与 CPU 架构**的包：

| 文件名特征 | 适用 |
| --- | --- |
| `windows-x64` | 绝大多数 Windows |
| `windows-arm64` | Windows on ARM |
| `macos` | Apple Silicon / Intel（按发布说明） |
| `linux-x64` / `linux-arm64` | 对应架构 |
| 带 `-cn` | 国内镜像版部署配置 |

::: tip 国际版与 CN 版的区别
两者的启动器二进制相同，区别在部署配置里的下载源：`-cn` 使用 `git://git.pull/AzurPilot` 与国内 PyPI / Python 镜像。网络环境不同就选不同版本，之后也可以手动改配置。
:::

## <DocIcon name="folder" /> 解压位置

解压到一个**固定、可写、路径简单**的目录：

- ✅ `D:\AzurPilot\`
- ✅ `~/Applications/AzurPilot/`
- ❌ `C:\Program Files\`（需要管理员写权限）
- ❌ 中文路径 + 特殊符号混用（部分工具链兼容性差）
- ❌ 同步盘（OneDrive / iCloud 会锁定 `.venv` 里的文件）

::: danger 不要放在临时目录
启动器把核心仓库、`.venv`、配置、日志全部放在自己的目录下。放临时目录会被清理工具删掉，等于丢配置。
:::

## <DocIcon name="monitor" /> Windows

<Steps>
<Step title="解压">

用 7-Zip 或系统自带解压。不要直接在压缩包里双击运行。

</Step>
<Step title="允许管理员权限">

`alas-launcher.exe` 的 manifest 声明了 `requireAdministrator`，启动会弹 UAC。这是为了安装 ADB 与写入系统目录。

</Step>
<Step title="处理 SmartScreen">

未签名的可执行文件可能被 SmartScreen 拦截。选择「更多信息 → 仍要运行」。

</Step>
<Step title="确认 WebView2">

Windows 11 已内置。Windows 10 若提示缺失，安装 [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) 后重试。

</Step>
</Steps>

## <DocIcon name="laptop" /> macOS

```bash
# 解压后放到 Applications
xattr -dr com.apple.quarantine /Applications/AzurPilot.app
open /Applications/AzurPilot.app
```

程序未经 Apple 开发者签名，直接双击会被 Gatekeeper 拦截。`xattr` 命令移除隔离标记后再打开。

::: warning 不要用「右键 → 打开」反复尝试
部分 macOS 版本会记住拒绝状态。用 `xattr` 清一次最省事。
:::

## <DocIcon name="wrench" /> Linux

```bash
tar -xf azurpilot-launcher-linux-x64.tar.xz
cd AzurPilot
chmod +x alas-launcher
./alas-launcher
```

依赖：

| 依赖 | 说明 |
| --- | --- |
| `libwebkit2gtk-4.1` | WebView |
| 较新 glibc | CI 使用 Ubuntu 22.04 构建 |
| `libgtk-3` | 窗口 |

Debian / Ubuntu：

```bash
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0
```

如果发行版太旧导致启动器无法运行，核心程序仍可以用命令行方式运行：进入目录后 `uv run python gui.py`（需要系统 Python 3.14 与 uv）。

## <DocIcon name="circle-check" /> 首次启动检查

首次启动会执行完整的环境自举，耗时取决于网络。判断成功的标准：

| 检查 | 期望 |
| --- | --- |
| 启动画面 | 依次显示创建 `.venv`、下载 Python、更新仓库、同步依赖 |
| 窗口 | 打开后直接进入 WebUI，无需登录 |
| 端口 | 默认 `22267` |
| 目录 | 出现 `.venv/`、`config/`、`frontend/`、`log/` |

## <DocIcon name="file-pen" /> 命令行参数

| 参数 | 作用 |
| --- | --- |
| `--lang <zh-CN\|zh-TW\|ja\|en>` | 强制界面语言 |
| `--skip-update` | 跳过仓库更新（断网或排查更新问题时） |
| `--preview-crash` | 预览错误页 |
| `--start-minimized` | 启动后最小化到托盘（开机自启使用） |

## <DocIcon name="circle-off" /> 卸载

删除整个目录即可。启动器不写注册表（除开机自启项），也不在系统目录留下运行库。

**删除前先备份 `config/`**，否则实例配置、统计与账号保险库全部丢失。

```text
需要保留：config/、AzurPilot_Data_Backup/
可以删除：.venv/、frontend/、log/、cache/
```

## <DocIcon name="message" /> 常见安装问题

| 现象 | 原因 |
| --- | --- |
| 双击没反应 | 未通过 UAC，或被安全软件拦截 |
| 提示缺少 WebView2 | 未安装运行时 |
| macOS「应用已损坏」 | 隔离标记未移除 |
| Linux 报 `libwebkit2gtk` 缺失 | 未安装 4.1 版本 |
| 解压后路径含空格导致异常 | 换到无空格路径 |
| 启动器反复重启 | 环境初始化失败，见[首次启动](/launcher/user/first-run#初始化失败) |
