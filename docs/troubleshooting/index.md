---
title: 排查方法
description: 从现象到根因的定位顺序：先分层确认问题出在设备、识别还是调度，再取证日志与截图，最后每次只改一处并验证一处。
updated: 2026-10-20
---

# 排查方法

自动化系统的故障往往不是「坏了」，而是「某一步没按预期发生」。按层排查比逐条试配置快得多。

## <DocIcon name="box" /> 先分层

```text
第 0 层：启动器 / APK 本身能不能起来
第 1 层：后端能不能起来（端口、密码、前端）
第 2 层：设备能不能连（ADB、截图、点击）
第 3 层：识别对不对（页面、按钮、OCR）
第 4 层：任务逻辑与调度（选任务、排期、恢复）
第 5 层：游戏机制与活动适配
```

从下往上查。第 2 层没通，改第 4 层的配置毫无意义。

## <DocIcon name="clipboard" /> 取证清单

| 证据 | 位置 |
| --- | --- |
| 当前任务与状态 | WebUI 总览 |
| 最近日志 | `log/<日期>_<实例>.txt` |
| 错误现场 | `log/error/<实例>/<时间戳>/`（截图 + log.txt） |
| 启动器日志 | `log/<日期>_launcher.txt` |
| Android 宿主日志 | `log/app.log`、`log/proot/session.log` |
| 设备状态 | `adb devices`、截图测试 |
| 版本 | 核心提交、启动器版本、Runtime 版本 |

::: danger 分享前先脱敏
配置导出里有模拟器 Serial、SSH 私钥、WebUI 密码、远程身份。发 Issue 前删掉这些字段。
:::

## <DocIcon name="search" /> 常见现象与第一检查点

| 现象 | 先看 |
| --- | --- |
| WebUI 打不开 | 进程是否存活、端口是否被占、监听地址 |
| 截图全黑 | 截图方案、分辨率、模拟器渲染后端 |
| 点不动 | 控制方案、虚拟屏、权限 |
| 识别错位 | 分辨率是否 1280×720、皮肤/装备遮挡 |
| 任务反复失败 | 日志里的异常类型，不是「失败」两个字 |
| 任务不运行 | `Enable`、`NextRun`、优先级、敏感任务停机 |
| 配置改了没生效 | 是否在任务执行中、是否被 override |
| 更新后崩溃 | 回滚、看生成产物差异、依赖是否同步 |

## <DocIcon name="scale" /> 隔离变量

一次只改一个东西，并记录改前/改后：

1. 换截图方案 → 只换截图，不动控制。
2. 换控制方案 → 只换控制。
3. 换关卡/舰队 → 只动任务参数。
4. 换实例 → 确认是配置问题还是环境问题。

同时改三处，最后你不知道是哪一处生效。

## <DocIcon name="hand" /> 什么时候该停下来

| 情况 | 建议 |
| --- | --- |
| 敏感任务（跨月、隐秘、深渊）出错 | 不要反复重试，先保存现场 |
| 账号出现异常登录/风控提示 | 立即停止所有自动化 |
| 日志出现凭据或个人信息 | 停止分享，先脱敏 |
| 连续重启模拟器超过阈值 | 检查模拟器本身，而不是加大重试 |

## <DocIcon name="send" /> 提 Issue 的正确姿势

包含：

- 版本（核心提交 / 启动器 / Runtime）
- 平台与模拟器（或手机型号、Android 版本）
- 复现步骤（从哪个页面、点了什么）
- 期望结果 vs 实际结果
- 日志片段与错误截图
- 已尝试的排查

不包含：

- `deploy.yaml`、`password.txt`、`remote-access.json`
- 完整账号截图
- 「不能用」三个字

## <DocIcon name="map" /> 分平台入口

<ul class="ap-linklist">
<li><a href="/troubleshooting/azurpilot">核心程序<span class="desc">设备、识别、调度、远程</span></a></li>
<li><a href="/troubleshooting/android">Android<span class="desc">Runtime、权限、热更、保活</span></a></li>
<li><a href="/troubleshooting/launcher">启动器<span class="desc">初始化、端口、三平台</span></a></li>
</ul>
