---
title: 安装与架构选择
description: 选择正确的 APK 架构与安装包类型，从 GitHub 或 CNB 下载，处理签名冲突与存储不足。
updated: 2026-10-20
---

# 安装与架构选择

Android 版有两个容易选错的地方：**CPU 架构**和**完整包 / 轻量包**。选错的后果分别是「装上了但 Runtime 起不来」和「多下一次 1 GB」。

## <DocIcon name="clipboard" /> 1. 确认架构

| 架构 | 典型设备 | 说明 |
| --- | --- | --- |
| `arm64-v8a` | 绝大多数手机、平板 | 首选 |
| `x86_64` | 安卓模拟器、少数 x86 平板 | MuMu 等模拟器用这个 |

查看方法：

- 设置 → 关于手机 → 处理器，通常写 `arm64-v8a`。
- 或安装任意设备信息应用查看 `ABI`。
- 模拟器在创建实例时就能看到架构，选 x86_64。

::: danger 32 位设备不支持
Runtime 依赖 64 位 Linux 二进制。`armeabi-v7a` 设备无法运行，没有降级方案。
:::

## <DocIcon name="package" /> 2. 选包

| 包 | 大小量级 | 首次启动 | 什么时候用 |
| --- | --- | --- | --- |
| 完整版 APK | 大（内置 rootfs） | 本地解压 1–3 分钟，**无需联网** | 第一次安装 |
| 轻量增量 APK | 小（无 rootfs） | 下载约 1 GB Runtime | 已装完整版，只更新宿主 |

首次安装请选完整包。轻量包的价值在于后续宿主更新：覆盖安装不会重新解压 Runtime，配置和实例都保留。

## <DocIcon name="download" /> 3. 下载

| 渠道 | 地址 | 适用 |
| --- | --- | --- |
| GitHub Releases | `github.com/wess09/AzurPilot-for-Android/releases/latest` | 国际网络 |
| CNB | `cnb.cool/azurpilot/AzurPilot-for-Android/-/releases` | 国内网络，新安装默认源 |

两个渠道的清单与附件是同一版本，大小与 SHA-256 一致。应用内也可以在设置里切换下载源：

| 源 | 说明 |
| --- | --- |
| `cnb` | 国内直连，默认 |
| `direct` | GitHub 直连 |
| 内置镜像 | ghproxy 形态的五个前缀 |
| 自定义 | 自行填写 ghproxy 形态前缀，非法输入回落直连 |

::: tip 镜像不是都可用
内置列表中 `gh-proxy.net` 会对无 JS 引擎的下载器返回挑战页，**不能用于下载**。实测较稳的是 `gh.ddlc.top`、`ghfast.top`。切换源不会改变版本与校验值。
:::

## <DocIcon name="smartphone" /> 4. 安装

<Steps>
<Step title="允许安装未知来源">

系统会提示「禁止安装未知应用」。在设置中为文件管理器或浏览器授予「安装未知应用」权限。

</Step>
<Step title="处理签名冲突">

如果之前装过别的签名版本（例如自行编译的 debug 包），覆盖安装会报 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`。需要先卸载旧版——**卸载会删除应用数据，包括 Runtime 与配置**，先导出日志与配置。

</Step>
<Step title="安装并首次启动">

安装完成后打开应用。首次启动先做权限引导，再进入 Runtime 部署。

</Step>
<Step title="等待 Runtime 就位">

完整包：解压 1–3 分钟。
轻量包：下载约 1 GB，再解压。建议 Wi-Fi。

</Step>
</Steps>

## <DocIcon name="circle-check" /> 5. 验证安装

| 检查 | 期望 |
| --- | --- |
| 主页 Runtime 状态 | `Ready` / 已就绪 |
| 存储占用 | 增加约 1.5–2.5 GB |
| 挂机页 | 能看到画面推流（激活权限后） |
| 控制台 | 能打开内嵌 WebUI |

如果状态停在 `Failed`，点开错误详情看 `reason`：

| 状态 | 原因 | 处理 |
| --- | --- | --- |
| `NotBundled` | 轻量包 + Release 无本架构 Runtime | 换完整包 |
| `LowDisk` | 剩余空间不足 2 GB | 清理空间 |
| `Downloading` 卡住 | 网络或镜像不可用 | 换下载源 |
| `Failed` | 校验失败或解压异常 | 重试；仍失败则重新下载 |

## <DocIcon name="circle-off" /> 6. 卸载与数据

卸载应用会删除：

- Runtime（`rootfs` 目录）
- 全部实例配置与统计数据库
- 日志与截图

不会保留任何云端副本。需要保留时，先在应用内导出日志/配置，或用 ADB 备份应用私有目录（需要 root 或 `adb backup` 兼容性支持）。

## <DocIcon name="message" /> 常见问题

| 现象 | 原因 |
| --- | --- |
| 安装时报「解析包错误」 | 下载不完整或架构不符 |
| 装上了但一启动就闪退 | 架构不符（x86 包装到 ARM 设备） |
| Runtime 一直 `Downloading` | 镜像返回挑战页 / 网络被代理拦截 |
| 解压后首次 WebUI 很久才开 | 正常现象：`__pycache__` 被剥离，首次启动重建字节码，可能超过 90 秒 |
| 覆盖安装后配置消失 | 换了签名，实际是卸载重装 |
