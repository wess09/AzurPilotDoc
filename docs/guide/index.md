---
title: 选择你的运行方式
description: AzurPilot 三种运行形态的适用场景、前置条件与后续阅读路径，帮助你在安装前做出正确选择。
updated: 2026-10-20
---

# 选择你的运行方式

AzurPilot 有三条使用路径，它们运行的是**同一套核心程序**，区别只在「谁来准备 Python 环境、谁托管后端进程、游戏跑在哪里」。

| 运行方式 | 游戏跑在哪 | 需要电脑常开 | 适用场景 |
| --- | --- | --- | --- |
| 桌面启动器 | Windows / macOS / Linux 上的模拟器 | 是 | 长时间挂机、多开、性能最好 |
| Android 本地运行 | 手机上的游戏客户端 | 否 | 没有常开电脑，或想用旧手机专职挂机 |
| 源码运行 | 任意支持 Python 3.14 的环境 | 是 | 开发、调试、自定义修改 |
| 远程客户端 | 其他机器上的实例 | 否（客户端侧） | 用手机查看、控制家里电脑上的实例 |

## <DocIcon name="info" /> 先回答三个问题

<DocIcon name="smartphone" /> **1. 你打算让游戏跑在哪里？**
模拟器（MuMu、雷电、蓝叠、夜神等）适合桌面路径；手机本地运行需要 Android 9.0 以上、ARM64 或 x86_64、至少 4 GB 内存与 2.5 GB 可用空间。

<DocIcon name="clock" /> **2. 这台机器能长期开机吗？**
调度器的设计目标是 7×24 运行。如果电脑每晚关机，任务会在下次启动时继续，但大世界、委托这类按时间推进的玩法收益会下降。

<DocIcon name="wrench" /> **3. 你愿意碰命令行吗？**
不愿意 → 启动器或 APK。愿意，或需要改代码 → 源码运行，参见[开发者入口](/azurpilot/developer/)。

## <DocIcon name="compass" /> 三条路径的具体入口

<div class="ap-grid ap-grid--3">
<div>

#### 桌面启动器
下载压缩包，解压后运行。启动器会自建 `.venv`、拉取代码、同步依赖并打开 WebUI。
[安装启动器 →](/launcher/user/install)
</div>
<div>

#### Android 宿主
安装 APK，等待 Runtime 解压，激活 ADB 或 Root，然后在应用内配置实例。
[安装 Android 版 →](/android/user/install)
</div>
<div>

#### 源码运行
需要 Python 3.14 与 uv，执行 `uv sync --frozen` 后运行 `gui.py`。适合开发与排障。
[源码运行 →](/guide/install#源码运行)
</div>
</div>

## <DocIcon name="clipboard" /> 无论哪条路径，都绕不开的三件事

1. <DocIcon name="settings" /> **游戏内设置**必须按推荐值调整，否则识别会失败。清单见[环境与兼容性](/guide/requirements#游戏内设置)。
2. <DocIcon name="monitor" /> **截图分辨率固定为 1280×720**。这是识别资源的制作基准，不是 UI 尺寸。
3. <DocIcon name="cloud" /> **首次运行必须联网**。启动器要下载 Python 与依赖，Android 轻量包要下载 Runtime，核心程序要拉取代码。

::: warning 账号风险自负
自动化操作违反游戏用户协议，存在封号风险。AzurPilot 不提供任何规避检测的能力，也不会代替你承担账号后果。建议不要在主力账号上做未经验证的高风险操作。
:::

## <DocIcon name="map" /> 接下来读什么

<ul class="ap-linklist">
<li><a href="/guide/what-is-azurpilot">AzurPilot 是什么<span class="desc">能力边界与工作原理</span></a></li>
<li><a href="/guide/ecosystem">三个项目的关系<span class="desc">下载前先分清仓库</span></a></li>
<li><a href="/guide/requirements">环境与兼容性<span class="desc">模拟器、系统与游戏设置</span></a></li>
<li><a href="/guide/install">安装<span class="desc">三条路径的完整步骤</span></a></li>
</ul>
