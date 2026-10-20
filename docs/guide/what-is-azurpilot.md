---
title: AzurPilot 是什么
description: AzurPilot 的定位、技术实现、支持范围与明确不做的事情，基于核心仓库源码与 README 核实。
updated: 2026-10-20
---

# AzurPilot 是什么

<DocIcon name="bot" /> AzurPilot 是《碧蓝航线》的自动化框架。它通过 ADB 连接安卓模拟器或设备，循环执行「截图 → 识别 → 操作」，把日常、出击、大世界等重复流程交给程序。

它不是游戏辅助插件，也不修改游戏客户端：所有操作都发生在屏幕层面，和玩家手动点击走的是同一条输入链路。

## <DocIcon name="settings" /> 技术构成

| 层 | 实现 | 说明 |
| --- | --- | --- |
| 调度 | `alas.py` | 每个实例一个进程，串行执行任务，失败后分级恢复 |
| 识别 | OpenCV 模板匹配 + OCR + 地图网格检测 | 资源按 1280×720 制作，分 CN / EN / JP / TW 四套 |
| 控制 | uiautomator2 / ADB / minitouch / MaaTouch | 截图与控制方式可在设置中切换 |
| 界面 | React + TypeScript + Vite | 浏览器访问，默认端口 25548 |
| 通信 | WebSocket RPC（`/api/v1/ws`） | 前端、Android 宿主与外部工具共用 |
| 扩展 | MCP SSE 服务 | 18 个工具，供支持 MCP 的客户端调用 |

## <DocIcon name="compass" /> 支持范围

- <DocIcon name="cloud" /> **服务器**：国服（含 B 服与多个渠道服）、国际服、日服、台服。渠道服通过包名区分，列表见[设备连接](/azurpilot/user/device#游戏服务器)。
- <DocIcon name="laptop" /> **运行平台**：Windows、macOS、Linux（启动器）；Android 9.0+（宿主）；任何能运行 Python 3.14 的环境（源码）。
- <DocIcon name="monitor" /> **游戏分辨率**：1280×720。这是硬约束，不是建议值。
- <DocIcon name="ban" /> **不支持真机直连**（核心程序侧）。Android 版通过虚拟屏把手机变成「被控制端」，属于另一条链路。

## <DocIcon name="shield" /> 明确不做的事

- <DocIcon name="ban" /> 不破解、不注入、不修改游戏内存或资源。
- <DocIcon name="ban" /> 不提供账号代练、交易或共享服务。
- <DocIcon name="ban" /> 不绕过游戏的反作弊与风控。自动化本身存在封号风险。
- <DocIcon name="ban" /> 不保证所有活动图都能自动开荒。活动机制变化频繁，部分玩法需要人工完成前置。

## <DocIcon name="zap" /> 一次任务到底发生了什么

以「科研」为例：

1. WebUI 把 `Research.Scheduler.NextRun` 写进 `config/<实例>.json`。
2. 调度器选出到期任务，把该任务的参数绑定到 `self.config.Research_*`。
3. `run('research')` 调用 `alas.py` 上的同名方法，方法惰性导入 `module/research/research.py`。
4. 模块通过 `device.screenshot()` 截图，用模板与 OCR 判断当前页面，再调用 `device.click()` 推进流程。
5. 结束后调用 `task_delay()` 写入下一次运行时间，调度器进入下一轮。

完整生命周期（含异常分级与恢复）见[调度器生命周期](/azurpilot/developer/scheduler)。

## <DocIcon name="rocket" /> 下一步

<ul class="ap-linklist">
<li><a href="/guide/ecosystem">三个项目的关系<span class="desc">该下载哪一个</span></a></li>
<li><a href="/guide/requirements">环境与兼容性<span class="desc">装之前先核对</span></a></li>
<li><a href="/azurpilot/user/webui">WebUI 界面导览<span class="desc">装好之后看这里</span></a></li>
</ul>
