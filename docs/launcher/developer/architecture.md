---
title: Tauri 与 Rust 架构
description: 双窗口、自定义 URI 协议、启动状态机、托盘与通知，以及 WebView 与 Rust 的通信边界。
updated: 2026-10-20
---

# Tauri 与 Rust 架构

启动器是一个「有窗口的安装器 + 进程监督器」。它没有前端工程，WebView 加载的是 Rust 内嵌的 HTML，通过 `tauri://` 之外的自定义协议提供。

## <DocIcon name="monitor" /> 窗口

| 窗口 | 尺寸 | 特性 |
| --- | --- | --- |
| `main` | 1280×880 | 可缩放，初始不可见，等后端就绪后显示 |
| `splash` | 800×450 | 无边框、不可缩放，先于主窗口创建 |

WebView 参数刻意关掉了一些默认行为：

```text
--enable-features=msWebView2EnableDraggableRegions
--disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection
--no-proxy-server
```

- `--no-proxy-server`：连接本地 WebUI 不走系统代理，避免代理拦截 `127.0.0.1`。
- 关闭 SmartScreen 保护：内嵌页面不是外部站点，不需要该拦截。

::: tip macOS 的 WKWebView
Windows 的 `additionalBrowserArgs` 在 macOS 上无效。平台差异用 `#[cfg]` 处理，不要假设参数通用。
:::

## <DocIcon name="plug" /> 自定义协议

| 协议 | 内容 |
| --- | --- |
| `alas-splash://` | 启动画面（进度、阶段文案） |
| `alas-error://` | 错误页（原因、日志路径、重试） |

页面由 Rust 内嵌字符串 + `splash-progress.js` 驱动。进度通过 Tauri 事件从 Rust 推到 WebView，JS 只负责渲染。

改界面的正确方式：

1. 改 `main.rs` 里的 HTML 模板或 `splash-progress.js`。
2. 补 4 个语言的 `locales/*.yml`。
3. 用 `--preview-crash` 预览错误页。
4. 三平台各截一次图确认。

## <DocIcon name="rocket" /> 启动状态机

```text
Idle
 → Splash（显示窗口）
   → Provisioning（环境自举）
     → Updating（git pull + uv sync）
       → StartingBackend（清理端口、起 gui.py）
         → Waiting（最多 60 秒）
           → Ready（显示主窗口、注入登录态）
             → Running（托盘常驻）
```

任一步失败 → `Error` 状态 → `alas-error://` 页面，保留日志路径与重试按钮。

## <DocIcon name="handshake" /> WebView 与 Rust 的通信

| 方向 | 机制 | 用途 |
| --- | --- | --- |
| Rust → WebView | Tauri event | 启动进度、错误、主题 |
| WebView → Rust | `#[tauri::command]` | 重试、打开日志、退出 |
| 后端 → 启动器 | HTTP SSE `/api/notify_stream` | 任务通知 |
| 后端 → 启动器 | HTTP `/api/launcher/stream` | 退出、重启、开机自启指令 |

后端不能直接调用启动器函数：它只能通过 HTTP 流发指令，启动器解析后执行。这条边界避免了「后端拿到启动器句柄乱杀进程」。

## <DocIcon name="box" /> 托盘与通知

| 能力 | 实现 |
| --- | --- |
| 托盘 | `tauri` tray-icon feature |
| 菜单 | 显示主窗口、重启后端、打开日志、退出 |
| 通知 | Windows Toast / macOS / Linux 原生通知 |
| 单实例 | 重复启动聚焦已有窗口 |
| 开机自启 | Windows 注册表 Run 键 + `--start-minimized` |

通知内容来自 SSE 流，语言跟随启动器当前 locale。

## <DocIcon name="message-text" /> 国际化

```text
locales/zh-CN.yml   # 基准
locales/zh-TW.yml
locales/ja.yml
locales/en.yml
```

代码中用 `t!("module.key")`，带参数用 `t!("k", p = v)` 并在 YAML 里写 `%{p}`。新增文案必须同时补四份；缺键会回退到 key 本身，界面上会直接露出来。

## <DocIcon name="shield" /> 安全边界

| 面 | 措施 |
| --- | --- |
| 管理员权限 | Windows manifest `requireAdministrator` |
| 自更新 | mTLS 客户端证书，证书不打进仓库 |
| 本地 WebUI | `--no-proxy-server`，一次性登录令牌 |
| 子进程 | `CREATE_NO_WINDOW`，不弹控制台 |
| 进程回收 | 环境标记 + Job Object，退出时全表扫描 |
| 日志 | 不输出令牌与密码 |

## <DocIcon name="shield" /> 修改时的注意

| 不要 | 因为 |
| --- | --- |
| 在 macOS 上依赖 `additionalBrowserArgs` | WKWebView 不支持 |
| 用 `println!` 记日志 | 无窗口程序看不到，且不进日志文件 |
| 直接 `kill` 后端进程 | 跳过 Job/进程组回收，会留孤儿 |
| 只改一个语言的 yml | 其他语言会显示键名 |
| 把 uv 路径写死 | 内嵌 uv 缺失时要回退 PATH |

## <DocIcon name="map" /> 相关文档

<ul class="ap-linklist">
<li><a href="/launcher/developer/backend-lifecycle">后端进程生命周期<span class="desc">最容易被改坏的部分</span></a></li>
<li><a href="/launcher/developer/update">更新链路<span class="desc">git、uv、mTLS</span></a></li>
<li><a href="/launcher/developer/build-release">构建与发布<span class="desc">三平台产物</span></a></li>
</ul>
