---
title: 安装
description: 通过桌面启动器、Android APK、Docker 或源码安装 AzurPilot，并验证安装结果。
updated: 2026-10-20
---

# 安装

装之前请先确认[环境与兼容性](/guide/requirements)。下面四条路径按「推荐程度」排序，普通用户优先看启动器。

## <DocIcon name="download" /> 桌面启动器（推荐）

### 下载

从 [官网下载页](https://azurpilot.com/download.html) 或 [GitHub Releases](https://github.com/wess09/AzurPilotLauncher/releases/latest) 获取对应系统与 CPU 架构的压缩包。国内网络选择带 `-cn` 的镜像版。

### 解压与运行

<Steps>
<Step title="解压到固定目录">

启动器会在自身目录下创建 `.venv`、拉取核心仓库并保存配置。不要放在临时目录或只读位置，也不要放在中文路径兼容性差的同步盘里。

</Step>
<Step title="运行启动器">

- <DocIcon name="monitor" /> **Windows**：双击 `alas-launcher.exe`，需要管理员权限（安装 ADB 与写入系统目录）。会弹 UAC。
- <DocIcon name="laptop" /> **macOS**：打开 `AzurPilot.app`。未签名程序可能被 Gatekeeper 拦截，见下方说明。
- <DocIcon name="wrench" /> **Linux**：`chmod +x alas-launcher && ./alas-launcher`。

</Step>
<Step title="等待环境初始化">

启动画面会显示：创建 `.venv` → 下载 Python 3.14.6 → 更新仓库 → `uv sync --frozen`。首次启动需要联网，耗时取决于网络，通常几分钟。

</Step>
<Step title="进入 WebUI">

窗口打开时已经完成登录，直接进入 AzurPilot WebUI。默认端口 `22267`（启动器会指定端口，核心程序自身的默认端口是 `25548`）。

</Step>
</Steps>

::: warning macOS 首次打开失败
程序未经 Apple 开发者签名。若提示「无法验证开发者」，在终端执行：

```bash
xattr -dr com.apple.quarantine /Applications/AzurPilot.app
```

然后重新打开。不要从「系统设置 → 隐私与安全性」反复点击「仍要打开」。
:::

::: tip Windows 缺少 WebView2
Tauri 依赖 WebView2。Windows 11 已内置；Windows 10 若提示缺失，安装 [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) 后重试。
:::

## <DocIcon name="smartphone" /> Android

完整步骤见 [Android 安装与架构选择](/android/user/install)。简要流程：

1. <DocIcon name="clipboard" /> 确认设备为 Android 9.0+、ARM64 或 x86_64。
2. <DocIcon name="download" /> 下载与架构匹配的**完整版 APK**（内置 Runtime）或**轻量增量 APK**（首次启动下载约 1 GB Runtime）。
3. <DocIcon name="clock" /> 安装并启动，等待 rootfs 解压（1–3 分钟）。
4. <DocIcon name="lock" /> 按提示激活 ADB（内置无线配对）或使用 Root。
5. <DocIcon name="settings" /> 在应用内打开 AzurPilot 控制台配置实例。

## <DocIcon name="box" /> Docker

适合 NAS、服务器与无桌面环境。容器只跑 WebUI 与调度器，模拟器仍在宿主机：

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
docker compose up -d --build
```

`docker-compose.yml` 使用 `network_mode: host`，容器内以 `.venv/bin/python gui.py` 启动。国内构建可把 Dockerfile 换成 `deploy/docker/Dockerfile.cn`，并通过 `UV_INDEX_URL` 指定镜像。

::: tip 首次启动较慢
镜像分两阶段构建：Node 24 构建前端，Python 3.14 安装运行时依赖。首次 `--build` 会下载较多内容，后续重建会复用缓存。
:::

## <DocIcon name="laptop" /> 源码运行

适用于开发、调试与自定义修改。

### 依赖

- <DocIcon name="circle-check" /> Python **3.14**（版本要求以 `pyproject.toml` 为准）
- <DocIcon name="circle-check" /> [uv](https://github.com/astral-sh/uv)
- <DocIcon name="circle-check" /> Node.js（前端构建；`gui.py` 会在 `frontend/dist` 缺失时自动安装依赖并构建）

### 步骤

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
uv sync --frozen --no-dev
uv run python gui.py
```

浏览器访问 `http://127.0.0.1:25548`。默认监听 `0.0.0.0`，端口与监听地址来自 `config/deploy.yaml` 的 `WebuiHost` / `WebuiPort`。

常用启动参数：

```bash
uv run python gui.py --port 25548 --host 127.0.0.1 --key "your-password"
```

| 参数 | 作用 |
| --- | --- |
| `--host` | 覆盖 `WebuiHost` |
| `-p, --port` | 覆盖 `WebuiPort` |
| `-k, --key` | 设置访问密码 |
| `--ssl-key` / `--ssl-cert` | 启用 HTTPS |
| `--run <实例名>` | 启动时直接运行指定实例 |

### 验证安装

```bash
# 导入冒烟检查：不连接模拟器，只验证模块可加载
uv run python -m dev_tools.import_smoke_test

# Python 单元测试
uv run python -m unittest discover -s tests
```

WebUI 能打开、任务列表能渲染、日志无 traceback，就说明后端装好了。设备连接是下一步。

## <DocIcon name="circle-check" /> 安装完成之后

<ul class="ap-linklist">
<li><a href="/guide/first-run">第一次运行<span class="desc">连接模拟器并跑通一个任务</span></a></li>
<li><a href="/azurpilot/user/device">连接模拟器与 ADB<span class="desc">Serial、截图方案与控制方案</span></a></li>
<li><a href="/troubleshooting/">故障排查<span class="desc">初始化失败与环境损坏</span></a></li>
</ul>
