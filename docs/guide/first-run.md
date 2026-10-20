---
title: 第一次运行
description: 从打开 WebUI 到跑通第一个自动化任务：创建实例、连接模拟器、配置任务与验证运行结果。
updated: 2026-10-20
---

# 第一次运行

假设你已经完成[安装](/guide/install)，并且模拟器里装好了游戏、按[游戏内设置](/guide/requirements#游戏内设置)调整完毕。

## <DocIcon name="monitor" /> 1. 打开 WebUI

启动器会直接打开窗口。源码或 Docker 部署则访问：

```text
http://127.0.0.1:25548
```

首次访问如果要求输入密码，说明部署配置里已经设置了 `Password`，或者监听地址不是回环、程序自动生成了密码。自动生成的密码在项目根目录的 `password.txt`。

::: danger 不要裸奔在公网
WebUI 可以启停任务、读取截图、修改配置。监听 `0.0.0.0` 且没有密码，等于把账号交给整个网络。开放前务必在[部署设置](#部署设置)里设置强密码。
:::

## <DocIcon name="circle-plus" /> 2. 创建实例

「实例」= 一份独立的用户配置 + 一个调度器进程。默认实例名是 `ap`，可以创建 `ap-2`、`ap-3` 用于多开。

<Steps>
<Step title="新建配置">

在 WebUI 的实例列表点击新建，选择空白模板或从已有实例复制。复制会连同任务开关和调度时间一起带走。

</Step>
<Step title="确认实例目录">

配置写入 `config/<实例名>.json`。实例名只允许字母、数字、下划线与短横线，重命名请通过 WebUI 导出再导入，不要直接改文件名。

</Step>
<Step title="选择语言与服务器">

WebUI 语言与游戏服务器是两件不同的事。前者影响界面文案（`zh-CN` / `en-US` / `ja-JP` / `zh-TW`），后者在「系统设置 → 模拟器设置 → 游戏服务器」里选择包名。

</Step>
</Steps>

## <DocIcon name="smartphone" /> 3. 连接模拟器

进入「系统 → 模拟器设置」：

| 字段 | 填什么 |
| --- | --- |
| 模拟器 Serial | 模拟器 ADB 地址，例如 `127.0.0.1:16384`；不确定就填 `auto` |
| 游戏服务器 | 通常留 `auto`；多客户端时手动选包名 |
| 游戏内服务器 | 用于维护检测。不知道就选「不使用检测」 |
| 截图方案 | 先留「自动选择最快的」 |
| 控制方案 | 推荐 `MaaTouch` |

保存后回到总览，点击**截图测试**。能显示游戏画面就说明 ADB、截图方案、分辨率三项都通了。

::: tip `auto` 不是万能的
同时开着两个模拟器时，`auto` 无法判断你要控制哪一个。此时必须手填 Serial。查询方法：在模拟器自带 adb 目录执行 `adb devices`。
:::

### 画面是黑的 / 截图超时

按顺序排查：

1. <DocIcon name="monitor" /> 模拟器是否真的启动了游戏（不是启动器界面）。
2. <DocIcon name="smartphone" /> `adb devices` 是否能看到设备且状态为 `device`（不是 `offline` / `unauthorized`）。
3. <DocIcon name="eye" /> 截图方案换一个再试（例如从 `DroidCast_raw` 换到 `ADB_nc`）。
4. <DocIcon name="settings" /> 分辨率是否为 1280×720。平板模式或自定义 DPI 会导致识别与截图异常。

## <DocIcon name="zap" /> 4. 跑通第一个任务

不要一上来就开大世界。先用一个短周期、低风险的任务验证整条链路：

<Steps>
<Step title="启用「科研」或「委托」">

在任务列表找到「科研」，打开「启用该功能」。这两个任务不消耗石油、失败代价低，适合验证。

</Step>
<Step title="把下一次运行时间设为现在">

任务的 `Scheduler.NextRun` 默认是 2020-01-01（即「立即到期」）。启用后如果显示未来时间，清空该字段即可立即运行。

</Step>
<Step title="启动调度器">

回到总览点击启动。日志会依次出现：加载配置 → 连接设备 → 截图 → 进入科研 → 收取/开始研究 → 安排下次运行。

</Step>
<Step title="确认结果">

游戏内科研队列确实发生变化；WebUI 总览的「当前任务」显示该任务；日志结尾出现「任务结束」；下次运行时间被推到合理区间（科研通常是数小时）。

</Step>
</Steps>

### 如果日志一直停在「连接设备」

说明调度器进程没拿到设备。检查模拟器是否被其他程序占用 ADB（例如另一个脚本、Android Studio），以及 Serial 是否写错。必要时在「模拟器设置」里开启「在检测不到设备的时候尝试重启 adb」。

## <DocIcon name="settings" /> 5. 部署设置

`config/deploy.yaml` 控制后端本身的行为，改动通常需要重启：

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `WebuiHost` | `0.0.0.0` | 监听地址；仅本机用 `127.0.0.1` |
| `WebuiPort` | `25548` | WebUI 端口 |
| `WebuiPassword` | 空 | 访问密码；空且监听公网时会自动生成 |
| `Language` | `zh-CN` | WebUI 语言 |
| `Theme` | `default` | 亮色 / 深色 |
| `OcrServerPort` | `22268` | 独立 OCR 服务端口 |

## <DocIcon name="rocket" /> 6. 接下来

- <DocIcon name="map" /> 想把任务排得更合理：[调度器与任务编排](/azurpilot/user/scheduler)
- <DocIcon name="map" /> 想多开：[多实例与配置管理](/azurpilot/user/multi-instance)
- <DocIcon name="map" /> 想用手机看：[远程访问与设备配对](/azurpilot/user/remote-access)
- <DocIcon name="wrench" /> 任务失败：[故障排查](/troubleshooting/azurpilot)
