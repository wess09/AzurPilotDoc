
---
title: MCP 服务
description: 25 个 azurpilot_ 工具、SSE 接入、鉴权、设备控制租约和兼容入口边界。
updated: 2026-11-08
---

# MCP 服务

MCP（Model Context Protocol）让支持该协议的客户端和 Agent 直接查询、管理及操作 AzurPilot。它是面向 AI 客户端的语义接口，不是 WebSocket API 的替代品。

## 端点与鉴权

| 方式 | 端点 | 说明 |
| --- | --- | --- |
| 随 WebUI 挂载 | `http://<host>:25548/mcp/sse` | 默认方式，与 WebUI 共用运行时和实例 |
| 独立服务 | `uv run python mcp_server_sse.py`，默认端口 22268 | 独立部署或调试 |

独立 MCP 服务与 OCR 服务默认都使用 22268 端口；同机运行时必须修改其中一个端口。MCP 使用 WebUI 密码：推荐 `Authorization: Bearer <WebUI 密码>`，兼容 `X-API-Key: <WebUI 密码>`；只有客户端无法设置请求头时才使用 `?key=<WebUI 密码>`。修改密码后需要重启 WebUI。

::: danger 不要把密码放进 URL
查询参数可能进入访问日志、历史记录或截图。优先使用 Authorization Header，不要分享带密码的 MCP URL。
:::

## 默认工具目录：25 个工具

默认端点只公开以下 25 个 **azurpilot_** 工具。旧名称不再默认暴露，只有显式创建兼容入口时才提供映射。

| 分组 | 工具 | 用途 |
| --- | --- | --- |
| 实例 | **azurpilot_list_instances**、**azurpilot_get_context**、**azurpilot_start_instance**、**azurpilot_stop_instance** | 实例列表、运行上下文、启动和停止 |
| 任务 | **azurpilot_search_tasks**、**azurpilot_get_task_schema**、**azurpilot_set_task_schedule** | 搜索任务、读取 Schema、设置启用状态和下次运行时间 |
| 配置 | **azurpilot_get_config**、**azurpilot_patch_config** | 读取配置与 revision；校验 revision 后原子修改，支持 dry_run |
| 日志 / 统计 | **azurpilot_get_logs**、**azurpilot_get_statistics**、**azurpilot_get_statistics_schema** | 日志、概览 / 资源 / 大世界 / 委托 / 科研统计及指标定义 |
| 设备 | **azurpilot_observe_device**、**azurpilot_acquire_device_control**、**azurpilot_release_device_control** | 截图、获取和释放设备控制租约 |
| 设备输入 | **azurpilot_click**、**azurpilot_swipe**、**azurpilot_long_press**、**azurpilot_input_text**、**azurpilot_press_key**、**azurpilot_adb_shell** | 点击、滑动、长按、文本、按键和受控 ADB Shell |
| 操作查询 | **azurpilot_get_operation** | 查询写操作状态与最终结果 |
| 维护 / 更新 | **azurpilot_restart_emulator**、**azurpilot_restart_adb**、**azurpilot_update_application** | 重启模拟器、ADB 或请求更新核心程序 |

## 设备控制与写操作语义

- 直接控制设备前，先用 **azurpilot_acquire_device_control** 获取租约；结束后用 **azurpilot_release_device_control** 释放。
- 先用 **azurpilot_observe_device** 获取当前画面和 frame_id。坐标操作可以携带 frame_id，避免画面尺寸或方向变化后继续使用过期坐标。
- 输入工具区分「命令已下发」和「画面是否变化」。**命令已下发不代表界面已响应，更不代表任务完成。**
- 写操作可用 request_id 去重并返回 operation_id。超时且结果不确定时，先调用 **azurpilot_get_operation** 查询，不要盲目重试。
- **azurpilot_patch_config** 使用 revision 防止覆盖并发修改；修改前先读取配置，必要时使用 dry_run。
- **azurpilot_set_task_schedule** 只表示调度已修改，不代表游戏内操作成功。

默认目录不包含 get_status、get_resources、get_recent_logs、trigger_task 和 clear_scheduler_queue 等旧名称。旧名称只在显式创建的兼容入口中映射。

典型调用顺序：先用 **azurpilot_list_instances** 选择实例，再用 **azurpilot_get_context** 检查状态；修改配置前读取 **azurpilot_get_config**；直接控制设备时先观测画面并取得租约；对结果不确定的写操作使用 **azurpilot_get_operation** 核实。

MCP 是面向 Agent 的窄接口；WebSocket 是面向 WebUI、Android 宿主和自建客户端的完整接口。完整方法见 [WebSocket API](/api/websocket)。
