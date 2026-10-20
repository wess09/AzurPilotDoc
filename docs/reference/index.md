---
title: 参考索引
description: 任务命令表、配置字段索引、命令行与环境变量、源码版本索引的入口，内容全部由脚本从源码生成后校对。
updated: 2026-10-20
---

# 参考索引

这一栏是「查表」用的，不是教程。需要理解行为时回到对应的手册页。

| 文档 | 内容 | 适合 |
| --- | --- | --- |
| [任务命令总表](/reference/tasks) | 102 个任务的中文名、命令、参数组 | 找命令、对日志、写脚本 |
| [配置参考](/reference/config) | 167 个选项组的字段索引、生效时机 | 查字段、排「改了没生效」 |
| [命令行、端口与环境变量](/reference/cli) | 所有入口参数、端口、路径、环境变量 | 部署、排障、集成 |
| [源码版本索引](/reference/versions) | 审计时的 commit、分支、覆盖范围 | 核对文档时效 |

## <DocIcon name="zap" /> 常用速查

### 端口

| 端口 | 服务 |
| --- | --- |
| `25548` | WebUI / WebSocket（核心默认） |
| `22267` | 启动器打开的 WebUI |
| `22268` | 独立 MCP / OCR |
| `22302` | Android OCR 张量 API |
| `22300` / `22400` | 旧版宿主进程探测 |

### 路径

| 路径 | 内容 |
| --- | --- |
| `config/<实例>.json` | 实例配置 |
| `config/deploy.yaml` | 后端设置 |
| `log/<日期>_<实例>.txt` | 运行日志 |
| `log/error/<实例>/<时间戳>/` | 错误现场 |
| `AzurPilot_Data_Backup/<日期>/` | 每日备份 |
| `frontend/dist` | 前端产物 |
| `.venv/` | Python 环境（启动器） |

### 命令

```bash
uv run python gui.py            # WebUI
uv run python alas.py <实例>    # 调度器
uv run python tui.py            # 终端界面
uv run python mcp_server_sse.py # 独立 MCP
```

### 文档工具

```bash
npm run dev        # 本站开发
npm run build      # 构建静态产物
npm run check      # 链接 / 导航 / SEO 检查
npm run test:e2e   # 浏览器验收
```
