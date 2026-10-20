---
title: Android 故障排查
description: Runtime 部署失败、Shizuku 权限失效、虚拟屏黑屏、后台被系统杀死、热更新回滚与性能不足的处理顺序。
updated: 2026-10-20
---

# Android 故障排查

## <DocIcon name="compass" /> 按阶段定位

| 阶段 | 表现 | 先看 |
| --- | --- | --- |
| 安装 | 解析包错误、闪退 | 架构、签名 |
| 部署 | 停在 Checking / Downloading / Extracting | 网络、空间、ABI |
| 启动 | Runtime 起不来 | 日志、WebUI 就绪 |
| 激活 | 配对了但服务没起来 | USB 调试授权、5555 |
| 运行 | 虚拟屏黑屏、点不动 | 特权服务、截图方案 |
| 后台 | 息屏后停止 | 电池优化、保活 |
| 更新 | 热更失败、启动崩溃 | 事务日志、回滚 |

## <DocIcon name="package" /> 安装与部署

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 解析包错误 | 下载不完整/架构不符 | 重新下载对应 ABI |
| 一启动就闪退 | 32 位设备 / 架构错 | 换 64 位设备 |
| 状态 `NotBundled` | 轻量包且无本架构 Runtime | 换完整包 |
| 状态 `LowDisk` | 剩余 < 2 GB | 清理空间 |
| 下载卡住 | 镜像返回挑战页、代理拦截 | 换下载源 |
| 校验失败 | 半成品或源不一致 | 删除重下 |
| 解压失败 | 空间不足或中断 | 重试；仍失败换完整包 |

::: tip 首次 WebUI 慢是正常的
`__pycache__` 被剥离，首次启动重建字节码，可能超过 90 秒。日志里的 `WebUI not ready within 90000ms` 是预期警告。
:::

## <DocIcon name="lock" /> 权限与激活

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 配对成功但服务未启动 | 未确认 USB 调试授权 | 重新配对，勾选「始终允许」 |
| 重启后失效 | adbd 授权未持久化 | 重新激活（正常行为） |
| `Binder` 超时 | 特权进程被杀 | 关电池优化，重试 |
| 外部 Shizuku 连不上 | 管理器未运行/授权撤销 | 打开管理器重新授权 |
| 联发科设备启动崩溃 | ROM 注入 | 应用已用 Context-only 路径；仍失败附日志 |
| 断网后不能重连 | 系统回收了调试 | 本次开机内应可重连；重启后需重激活 |

## <DocIcon name="monitor" /> 虚拟屏与画面

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 挂机页黑屏 | 未激活特权服务 | 检查激活状态 |
| 有画面但点击无效 | 控制方案不是 `azurpilot_android` | 改成宿主方案 |
| 画面卡住 | 游戏进程无响应 | 重启游戏/实例 |
| 主屏被占用 | 游戏跑到主屏 | 检查虚拟屏是否创建成功 |
| SDK 登录页跑到主屏 | OEM 重定向 | 依赖 `SdkTaskRepatriator`；异常时手动搬回 |

## <DocIcon name="zap" /> 后台被杀

| 线索 | 原因 | 处理 |
| --- | --- | --- |
| 日志突然截断 | 系统杀进程 | 电池优化设为不受限制 |
| 息屏几分钟后停止 | 省电策略 | 加自启动/后台白名单 |
| 只在某 ROM 上发生 | 厂商策略 | 单独配置该 ROM 的白名单 |
| 前台通知消失 | 前台服务被停 | 重新启动 Runtime |

::: warning 保活不能对抗所有 ROM
极端省电模式下，系统仍可能强杀。重要任务不要只依赖手机长期挂机。
:::

## <DocIcon name="refresh" /> 热更与整包

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 热更提示需要整包 | `uv.lock` 变化 | 走整包更新 |
| 热更后启动崩溃 | 事务回滚失败 | 查 `config/android-update-transaction.json` |
| 前端构建超时 | 设备性能/网络 | 保持旧版，换时间重试 |
| 整包后配置丢失 | 异常中断 | 从备份恢复 `config/` |
| App 更新装不上 | 签名不一致 | 卸载重装（先导出数据） |

## <DocIcon name="smartphone" /> 远程客户端

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 扫码无反应 | 二维码过期 | 重新生成 |
| 连上但一直转圈 | WebSocket 阻断 | 换网络 |
| `UNAUTHORIZED` | 配对撤销 | 重新配对 |
| 切后台断开 | 后台网络限制 | 允许后台运行 |

## <DocIcon name="scroll" /> 日志与导出

```bash
adb logcat -v time --pid=$(adb shell pidof com.azurpilot.ghio)
adb shell tail -n 200 /sdcard/Android/data/com.azurpilot.ghio/files/log/proot/session.log
adb forward tcp:25548 tcp:25548
```

应用内「日志 → 导出」会打包 zip。导出前确认不含凭据文件。

## <DocIcon name="circle-alert" /> 兼容性边界

| 设备 | 状态 |
| --- | --- |
| Android 12–15 ARM64 主流机型 | 推荐 |
| Android 9–10 | 可用，配对需 `adb tcpip 5555` |
| x86_64 模拟器 | 可用，需对应 Runtime |
| 32 位设备 | 不支持 |
| 部分定制 ROM | 悬浮窗/保活/弹窗行为需实测 |
| 三星 Exynos / Tensor | OCR 走 CPU 回退 |
