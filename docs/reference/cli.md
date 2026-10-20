---
title: 命令行、端口与环境变量
description: gui.py、alas.py、tui.py、MCP 服务的启动参数，端口占用，路径约定与影响行为的环境变量。
updated: 2026-10-20
---

# 命令行、端口与环境变量

## <DocIcon name="rocket" /> 入口

| 入口 | 作用 | 是否常驻 |
| --- | --- | --- |
| `gui.py` | WebUI 后端 + 进程监督 | 是 |
| `alas.py` | 单实例调度器 | 是（实例运行期间） |
| `tui.py` | 终端界面 | 交互式 |
| `mcp_server_sse.py` | 独立 MCP SSE 服务 | 是 |

## <DocIcon name="monitor" /> gui.py

```bash
uv run python gui.py [options]
```

| 参数 | 作用 | 默认 |
| --- | --- | --- |
| `--host` | 监听地址 | `deploy.yaml` 的 `WebuiHost`，再回退 `0.0.0.0` |
| `-p, --port` | 监听端口 | `WebuiPort`，再回退 `25548` |
| `-k, --key` | 访问密码 | `deploy.yaml` 的 `Password` |
| `--ssl-key` | HTTPS 私钥 | 无 |
| `--ssl-cert` | HTTPS 证书 | 无 |
| `--run <实例...>` | 启动时运行指定实例 | 无 |
| `--electron` | 由 Electron 客户端运行 | 关闭 |
| `--cdn` | 已废弃 | — |

示例：

```bash
uv run python gui.py --host 127.0.0.1 -p 25548 -k "your-password"
uv run python gui.py --ssl-key key.pem --ssl-cert cert.pem
```

::: warning 端口来自三处
命令行 > `deploy.yaml` > 代码默认值。改不动端口时，先确认是不是被部署配置覆盖了。
:::

## <DocIcon name="zap" /> alas.py

```bash
uv run python alas.py [实例名]
```

| 行为 | 说明 |
| --- | --- |
| 不传实例名 | 使用默认 `ap` |
| 实例名不存在 | 退出码 2，**不会**回退到默认实例 |
| 停止 | 终止进程；没有停止文件或信号接口 |
| 工作目录 | `module/logger.py` 导入时会切到项目根 |

外部调度器集成契约见[调度器生命周期](/azurpilot/developer/scheduler#外部调度器契约)。

## <DocIcon name="file-pen" /> tui.py

终端界面，复用同一套配置与设备层。适合无浏览器环境或快速查看状态。

## <DocIcon name="plug" /> mcp_server_sse.py

```bash
uv run python mcp_server_sse.py
```

默认独立端口 `22268`。与 OCR 服务同端口，同机运行需改其一。

## <DocIcon name="plug" /> 端口

| 端口 | 用途 | 可配置 |
| --- | --- | --- |
| `25548` | WebUI / WS | ✅ `WebuiPort` |
| `22267` | 启动器 WebUI | 启动器内部 |
| `22268` | 独立 MCP / OCR | ✅ `OcrServerPort` |
| `22302` | Android OCR | Android 内部 |
| `22300` / `22400` | 旧版宿主进程探测 | ❌ |

## <DocIcon name="key" /> 环境变量

| 变量 | 作用 | 默认 |
| --- | --- | --- |
| `ALAS_DEBUG_SERVER` | 设为 `1` 时启动仅本机的调试服务 | 关闭 |
| `AZURPILOT_OCR_THREADS` | OCR 会话 intra-op 线程上限（1–16） | 自动 |
| `AZURPILOT_ANDROID` | 设为 `1` 时注册 `/android/*` 路由 | 关闭 |
| `ALAS_LAUNCHER_PID` | 启动器注入，标记子进程归属 | 无 |
| `ALAS_LAUNCHER_JOB_BREAKAWAY` | 启动器注入，声明支持 Job 脱离 | 无 |
| `ALAS_WEBUI_TRUST_SECRET` | 启动器注入的一次性登录令牌 | 无 |
| `AZURPILOT_ANDROID_DIST_BASE` | 旧版 Android 预构建前端下载基址 | 无 |
| `AZURPILOT_ANDROID_GIT_MIRROR` | Android GitHub 回退镜像前缀 | 无 |
| `AZURPILOT_REPO` / `AZURPILOT_REF` | 构建 Android Runtime 时的源码指向 | 无 |

::: danger 不要手动设置启动器的内部变量
`ALAS_LAUNCHER_PID` 会让进程被启动器的兜底清理扫到；`ALAS_WEBUI_TRUST_SECRET` 是免密登录凭据。手动设置会破坏安全边界。
:::

## <DocIcon name="folder" /> 路径

| 路径 | 内容 | 是否可删 |
| --- | --- | --- |
| `config/` | 实例配置、`deploy.yaml`、`remote-access.json` | ❌ |
| `azurpilot.db` | 统计与持久化 | ❌ |
| `log/` | 日志与错误现场 | 排障后再删 |
| `cache/` | 运行时缓存 | ✅ |
| `AzurPilot_Data_Backup/` | 每日备份 | 按保留策略 |
| `.venv/` | Python 环境 | 可重建 |
| `frontend/dist` | 前端产物 | 可重建 |

数据目录的实际位置由运行入口决定；Android Runtime 中位于 rootfs 的 `/opt/azurpilot`。

## <DocIcon name="circle-alert" /> 退出语义

`gui.py` 的监督循环区分几类退出：

| 退出类型 | 触发 |
| --- | --- |
| 更新退出 | `stop_event` 置位后 worker 正常收尾 |
| 配置/初始化失败 | 启动阶段即失败，不重启 |
| 敏感任务停止 | 调度器 `exit(1)`，父进程感知 |
| 用户停止 | WebUI 停止按钮，终止进程树 |

具体退出码映射见 `module/runtime/process_manager.py` 与 `gui.py` 的监督循环，文档不复制容易变化的数字。

## <DocIcon name="wrench" /> 文档站命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发 |
| `npm run build` | 构建到 `docs/.vitepress/dist` |
| `npm run preview` | 预览构建产物 |
| `npm run check` | 链接 + 导航 + SEO 检查 |
| `npm run test:e2e` | Playwright 验收 |
| `npm run shots` | 多分辨率截图 |
