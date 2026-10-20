---
title: 多实例与配置管理
description: 用多个实例并行挂机：实例目录结构、内存与端口开销、任务错峰安排、账号保险库的使用，以及配置的导入导出与迁移。
updated: 2026-10-20
---

# 多实例与配置管理

一个实例 = 一份配置 + 一个调度器进程 + 一台被控制的模拟器。想同时挂两个账号，就是两套实例和两台模拟器，没有别的捷径。

## <DocIcon name="folder" /> 目录与隔离

```text
AzurPilot/
├── config/
│   ├── ap.json              # 实例 ap 的配置
│   ├── ap-2.json            # 实例 ap-2 的配置
│   ├── deploy.yaml          # 后端级设置（所有实例共享）
│   └── remote-access.json   # 远程访问身份（共享）
├── AzurPilot_Data_Backup/   # 每日备份，按日期分目录
├── log/
│   ├── 2026-10-20_ap.txt
│   └── 2026-10-20_ap-2.txt
└── cache/
```

各实例共享同一份代码、同一套资源、同一个 WebUI 后端，但：

- <DocIcon name="circle-check" /> 有独立的 `config/<实例>.json`；
- <DocIcon name="circle-check" /> 有独立的 worker 进程；
- <DocIcon name="circle-check" /> 有独立的日志文件；
- <DocIcon name="circle-check" /> 在 SQLite 总库里以实例名区分数据。

::: tip 实例名就是主键
重命名实例不要在文件系统里改文件名。用 WebUI 的导出/导入，或复制配置后删除旧实例。直接改名会让统计与调度记录对不上。
:::

## <DocIcon name="circle-plus" /> 创建第二个实例

<Steps>
<Step title="准备第二台模拟器">

复制模拟器实例（MuMu、雷电都支持多开），确保每台都有独立的 ADB 端口。不要两台共用同一个 Serial。

</Step>
<Step title="新建配置">

WebUI → 已安装配置 → 新建，名称填 `ap-2`。可以从 `ap` 复制，任务开关会一起带过来。

</Step>
<Step title="改设备字段">

至少改 `Emulator.Serial`。如果两台模拟器跑不同服务器，`PackageName` 也要改。

</Step>
<Step title="错开调度时间">

给时间敏感的任务设置不同的 `NextRun`，或使用「每日重启随机延后」错开登录。两个实例同时抢同一台机器的 CPU 时，截图会变慢。

</Step>
<Step title="逐个启动">

先启动一个确认稳定，再启动第二个。同时启动会放大冷启动时的资源争抢。

</Step>
</Steps>

## <DocIcon name="drive" /> 资源开销

| 资源 | 单实例大致占用 | 说明 |
| --- | --- | --- |
| 内存 | Python 进程数百 MB + 模拟器 2–4 GB | 模拟器是大头 |
| CPU | 识别时单核较高 | 截图与模板匹配是主要开销 |
| 磁盘 | 日志每天数 MB，错误现场更大 | 用 `Error.SaveErrorRetentionDays` 控制 |
| 网络 | 更新与统计上报 | 不影响游戏延迟 |

一台 16 GB 内存的机器通常能跑 2 个模拟器实例；再多需要看 CPU 单核性能与磁盘 IO。Android 宿主上的实例受手机内存限制，通常只建议一个。

## <DocIcon name="lock" /> 账号保险库

「设置 → 账户」提供凭据管理：

| 操作 | 说明 |
| --- | --- |
| 创建 | 新建一个加密的账号档案 |
| 解锁 / 锁定 | 手动控制保险库状态 |
| 绑定 TPM | 使用设备 TPM 保护密钥（可用时） |
| 绑定本机 | 使用系统级密钥（Windows DPAPI 等） |
| 切换 | 把某档案应用到实例 |
| 删除 | 移除档案 |

保险库绑定设备：换机器或重装系统后，旧密钥无法解密，需要重新录入。这是设计目标，不是缺陷。

## <DocIcon name="file" /> 导入与导出

| 场景 | 做法 |
| --- | --- |
| 备份单个实例 | 任务配置页导出 JSON |
| 迁移全部实例 | 复制 `config/*.json` |
| 分享配置模板 | 导出后删除设备 Serial、SSH 私钥、路径等本机信息 |
| 恢复误删 | 从 `AzurPilot_Data_Backup/<日期>/` 复制回来 |

导入时会做字段校验与迁移。版本差异过大时，缺少的字段会取默认值，多余字段会被忽略——所以跨大版本导入后要逐页检查关键开关。

## <DocIcon name="circle-alert" /> 多开时的常见坑

| 现象 | 原因 |
| --- | --- |
| 两个实例互相点击 | 两台模拟器用了同一个 Serial |
| 只有一个实例能截图 | 截图方案与模拟器实例不匹配（如 nemu_ipc 只认默认实例） |
| ADB 频繁掉线 | 多个 adb server 抢占 5037 端口 |
| CPU 打满、识别超时 | 同时跑大世界与主线，且机器核数不足 |
| 日志串台 | 用同一个实例名启动了两个进程 |

::: warning 一个实例只能有一个进程
`alas.py <实例名>` 没有单例锁。手动在命令行再启动一次同名实例，会得到两个 worker 同时操作一台模拟器。启动前先在 WebUI 确认状态。
:::
