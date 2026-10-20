---
title: AzurPilot for Android
description: 在手机上本地运行 AzurPilot：Kotlin 宿主 + PRoot Linux Runtime + 虚拟屏，或作为远程客户端连接其他实例。
updated: 2026-10-20
---

# AzurPilot for Android

Android 版不是「手机端的精简版」——它把**完整的核心程序**（含 Python 3.14、依赖、OCR 模型、前端）装进 APK，通过 PRoot 在免 Root 环境下运行，再用虚拟屏把游戏放到后台。

<div class="ap-meta">
<span><b>仓库</b> wess09/AzurPilot-for-Android</span>
<span><b>分支</b> main</span>
<span><b>系统</b> Android 9.0+（API 28）</span>
<span><b>架构</b> ARM64-v8a / x86_64</span>
<span><b>许可证</b> AGPL-3.0</span>
</div>

![AzurPilot for Android 主页](/img/android-home.jpg)

<Figure caption="Android 宿主主页：Runtime 状态、安装入口与本地/远程模式切换。截图来自 Android 仓库 docs/screenshots。" />

## <DocIcon name="smartphone" /> 两种完全不同的用法

| 模式 | 游戏跑在哪 | 本机 Runtime | 权限 | 适用 |
| --- | --- | --- | --- | --- |
| **本地运行** | 手机上 | 需要 | 需要内置 ADB / Root 激活 | 没有电脑，或用旧手机专职挂机 |
| **远程客户端** | 其他机器上 | 不需要 | 不需要 | 用手机查看、控制家里电脑的实例 |

::: warning 不要混淆
远程客户端模式不会启动本机 Runtime，也不需要 Shizuku。它是把 `AzurPilotGateway` 指向另一个实例的固定入口，复用原生控制台。详见[作为远程客户端](/android/user/remote-client)。
:::

## <DocIcon name="box" /> 分层结构

<AndroidStack />

<Figure caption="App 壳层持有 Runtime 的 stdin；关闭 stdin 即触发 Runtime 进程组回收，避免孤儿进程。" />

| 层 | 技术 | 职责 |
| --- | --- | --- |
| App 壳层 | Kotlin + Compose (Material / Miuix) | 界面、Runtime 部署、网关订阅、悬浮窗 |
| PRoot | jniLibs 九件套 | 免 Root 的系统调用映射 |
| Runtime | Ubuntu 24.04 + Python 3.14 | 上游核心程序与 WebUI |
| 特权服务 | app_process + AIDL + JNI | 虚拟屏、截屏、触控注入 |
| OCR 工作进程 | `:ocr` 独立进程 | 推理 API（`127.0.0.1:22302`） |

三个进程边界：

- <DocIcon name="monitor" /> **主进程**：Compose UI、配置、网关。
- <DocIcon name="brain" /> **`:ocr`**：承载 LiteRT / MNN 推理库，崩溃不影响主界面。
- <DocIcon name="lock-keyhole" /> **特权进程**：通过内置 ADB、Shizuku 或 root 拉起，持有虚拟显示与原生桥。

## <DocIcon name="zap" /> 能力清单

| 能力 | 说明 |
| --- | --- |
| 后台虚拟屏 | 游戏在独立 Virtual Display 运行，主屏可正常使用 |
| 悬浮控制 | 全局浮窗启停任务、看队列、滚日志 |
| 内置控制台 | 设备端完整 WebUI，无需电脑 |
| OCR 硬件加速 | 高通 QNN、联发科 NeuroPilot、海思 HiAI；失败回退 CPU |
| 帧通道 | 匿名共享内存 + SCM_RIGHTS，实测 15.6 ms（TCP 47.2 ms） |
| 屏保防烧屏 | 黑色低亮度，30 秒后每 10 秒上下漂移 16dp |
| 双轨更新 | APK 与 Runtime 独立；脚本可事务级热更 |
| 日志导出 | 宿主与业务日志分离，7 天轮转，一键打包 |

## <DocIcon name="clipboard" /> 环境要求

| 维度 | 最低 | 推荐 |
| --- | --- | --- |
| 系统 | Android 9.0（API 28） | Android 12–15 |
| 架构 | ARM64-v8a / x86_64 | 同上 |
| 存储 | 2.5 GB 可用 | 5 GB |
| 内存 | 4 GB | 6 GB 以上 |
| 权限 | 内置 ADB 配对 / Root / 外部 Shizuku | 内置 ADB |

32 位设备不支持。x86_64 主要用于模拟器；真机几乎都是 ARM64。

## <DocIcon name="download" /> 安装包怎么选

| 包 | 内含 Runtime | 首次启动 | 适用 |
| --- | --- | --- | --- |
| 完整版 APK | 是 | 本地解压 1–3 分钟，无需联网 | 首次安装，推荐 |
| 轻量增量 APK | 否 | 下载约 1 GB Runtime | 已装过完整版，只更新宿主代码 |

轻量包覆盖安装不会重新解压 Runtime，配置与实例保留。

## <DocIcon name="monitor" /> 界面

![AzurPilot for Android 总览](/img/android-overview.jpg)

<Figure caption="Runtime 总览：实例状态、调度与 WebUI 入口。" />

| 页面 | 内容 |
| --- | --- |
| 主页 | Runtime 状态、下载/解压、启动与停止 |
| 挂机 | 画面推流、实例、开始/停止 |
| 控制台 | 内嵌 WebUI |
| 日志 | 宿主与业务日志、导出 |
| 设置 | 外观、下载源、保活、OCR、屏保、远程 |

深色主题与 Material / Miuix 两套外观都受支持。截图见 [控制台、悬浮窗与屏保](/android/user/console)。

## <DocIcon name="map" /> 继续阅读

<ul class="ap-linklist">
<li><a href="/android/user/install">安装与架构选择<span class="desc">APK、架构、下载源</span></a></li>
<li><a href="/android/user/first-run">首次启动与 Runtime<span class="desc">解压、权限、首个实例</span></a></li>
<li><a href="/android/user/activation">权限激活<span class="desc">内置 ADB、Root、外部 Shizuku</span></a></li>
<li><a href="/android/developer/architecture">宿主架构<span class="desc">模块与进程边界</span></a></li>
</ul>
