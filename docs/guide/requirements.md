---
title: 环境与兼容性
description: 运行 AzurPilot 所需的操作系统、模拟器、分辨率、网络条件与游戏内设置清单。
updated: 2026-10-20
---

# 环境与兼容性

这一页只列**会导致直接失败**的条件。性能建议放在后面，硬性要求放在前面。

## <DocIcon name="clipboard" /> 硬性要求

<table>
<thead>
<tr><th>维度</th><th>桌面（启动器 / 源码）</th><th>Android 宿主</th></tr>
</thead>
<tbody>
<tr><td>操作系统</td><td>Windows 10+、macOS、Linux（较新 glibc）</td><td>Android 9.0+（API 28）</td></tr>
<tr><td>架构</td><td>x64 / ARM64</td><td>ARM64-v8a 或 x86_64，不支持 32 位</td></tr>
<tr><td>运行时</td><td>启动器自带 Python 3.14.6；源码需要 Python 3.14 + uv</td><td>内置 Ubuntu 24.04 + Python 3.14</td></tr>
<tr><td>内存</td><td>建议 8 GB 以上（模拟器 + 后端）</td><td>最低 4 GB，建议 6 GB 以上</td></tr>
<tr><td>存储</td><td>约 5 GB（依赖 + 资源 + 日志）</td><td>最低 2.5 GB，建议 5 GB</td></tr>
<tr><td>显示</td><td>WebUI 需要现代浏览器</td><td>—</td></tr>
<tr><td>游戏分辨率</td><td colspan="2"><strong>1280×720</strong>（识别资源基准，不可更改）</td></tr>
</tbody>
</table>

::: warning Linux 上的启动器依赖
启动器需要 `libwebkit2gtk-4.1` 与较新的 glibc（CI 使用 Ubuntu 22.04 构建）。如果发行版太旧导致启动器无法运行，核心程序通常仍可以用命令行方式运行。
:::

## <DocIcon name="monitor" /> 模拟器

核心程序通过 ADB 连接模拟器。以下是配置中内置的默认 Serial，可直接填入「模拟器 Serial」：

| 模拟器 | 默认 Serial | 备注 |
| --- | --- | --- |
| MuMu 模拟器 12 | `127.0.0.1:16384` | 多开依次递增 |
| MuMu 模拟器 / MuMu X | `127.0.0.1:7555` | — |
| MuMu Pro（macOS） | `127.0.0.1:16384` | 多开为 16416、16448… |
| 雷电模拟器 | `emulator-5554` 或 `127.0.0.1:5555` | 另有 `ldopengl` 专用截图方案 |
| 夜神模拟器 | `127.0.0.1:62001` | 64 位为 `127.0.0.1:59865` |
| 蓝叠模拟器 | `127.0.0.1:5555` | Hyper-V 版填 `bluestacks5-hyperv` |
| 逍遥模拟器 | `127.0.0.1:21503` | — |

不知道 Serial 时，可以在模拟器安装目录的 `adb` 中执行 `adb devices` 查询；也可以在设置里填 `auto` 自动检测，但**多个模拟器同时运行时不适用**。

::: tip 截图与控制方案
默认「自动选择」会跑一次性能测试挑选最快的截图方案。常见速度排序：`DroidCast_raw` > `aScreenCap_nc` > `ADB_nc` > `aScreenCap` ≈ `uiautomator2`。MuMu 与雷电有专用方案（`nemu_ipc`、`ldopengl`）。控制方案推荐 `MaaTouch`。
:::

## <DocIcon name="cloud" /> 网络

| 场景 | 需要能访问 |
| --- | --- |
| 启动器首次启动 | GitHub（拉取核心仓库）、PyPI 或镜像、npmmirror（Python standalone） |
| Android 完整包 | 无需联网即可解压 Runtime；更新需要 GitHub / CNB |
| Android 轻量包 | GitHub Release 或 CNB（下载约 1 GB Runtime） |
| 运行时 | 游戏服务器、更新检查、可选的远程访问服务 |

国内网络可使用启动器的 `-cn` 镜像版部署配置，或 Android 设置中的 CNB 下载源。启动器在更新代码、安装依赖与连接本地 WebUI 时会绕过系统代理，避免代理干扰本地回环。

## <DocIcon name="settings" /> 游戏内设置

以下设置直接影响识别与流程推进，**必须在开始任务前完成**。

路径：主界面 → 右下角设置 → 左侧边栏。

| 设置项 | 推荐值 | 影响 |
| --- | --- | --- |
| 帧数设置 | 60 帧 | 帧率过低会导致动画未结束就截图 |
| 大型作战 · 减少 TB 引导 | 开 | 减少大世界进入时的引导弹窗 |
| 大型作战 · 自律时自动提交道具 | 开 | 避免背包满导致自律中断 |
| 大型作战 · 安全海域默认开启自律 | 关 | 脚本需要自行决定是否自律 |
| 剧情自动播放 | 开启 | 否则剧情会卡住 |
| 剧情自动播放速度 | 特快 | 缩短等待 |
| 待机模式 | 关 | 待机画面会干扰识别 |
| 重复角色获得提示 | 关 | 弹窗会打断流程 |
| 快速更换二次确认 | 关 | 减少一次点击 |
| 展示结算角色 | 关 | 结算画面遮挡 |

### 大型作战：潜艇支援

路径：大型作战 → 右上角雷达 → 指令模块 → 潜艇支援。**取消勾选「X 消耗时潜艇出击」**。

### 一键退役

路径：主界面 → 建造 → 退役 → 齿轮 → 一键退役设置。

| 设置项 | 推荐值 |
| --- | --- |
| 选择优先级 1 / 2 / 3 | R / SR / N |
| 有满星同名舰船时保留 | 不保留 |
| 无满星同名舰船时保留 | 满星所需或不保留 |

## <DocIcon name="eye" /> 图像识别注意事项

以下内容会让模板匹配失准，建议在挂机账号上去除：

- <DocIcon name="circle-alert" /> 角色设备装备（会改变立绘区域）
- <DocIcon name="circle-alert" /> 角色皮肤
- <DocIcon name="circle-alert" /> 任何遮挡界面元素的自定义显示内容

如果识别持续失败，先恢复默认皮肤与装备，再排查分辨率与缩放。

## <DocIcon name="lock" /> 账号与安全

- <DocIcon name="lock" /> WebUI 默认只监听本机。开放到局域网或公网前必须设置密码，否则任何人拿到地址都能操作你的账号。
- <DocIcon name="key" /> 远程访问使用独立配对凭据，不暴露 WebUI 主密码；撤销配对不会影响主密码。
- <DocIcon name="ban" /> 不要把 `config/remote-access.json`、`config/deploy.yaml`、`password.txt` 提交到 Git 或发给他人。
- <DocIcon name="lock-keyhole" /> 账号保险库使用系统级密钥（Windows DPAPI / TPM）加密，绑定设备；换机器后需要重新录入。

## <DocIcon name="rocket" /> 下一步

<ul class="ap-linklist">
<li><a href="/guide/install">安装<span class="desc">按平台选择步骤</span></a></li>
<li><a href="/guide/first-run">第一次运行<span class="desc">从连接到第一个任务</span></a></li>
<li><a href="/troubleshooting/">故障排查<span class="desc">装不上、连不上、识别失败</span></a></li>
</ul>
