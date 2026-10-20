---
title: WebUI 界面导览
description: AzurPilot WebUI 的页面结构、任务配置表单、调度编辑器、统计与系统设置逐项说明。
updated: 2026-10-20
---

# WebUI 界面导览

WebUI 是 React + Vite 构建的控制台，通过 `/api/v1/ws` 与后端通信。它不直接操作游戏，所有动作都转化为调度器指令或配置写入。

![WebUI 运行总览](/img/webui-overview.png)

<Figure caption="运行总览：左侧页面导航，中部资源卡片与实时日志，右侧调度器与任务计划。" />

## <DocIcon name="map" /> 页面地图

| 页面 | 路径 | 用途 |
| --- | --- | --- |
| 首页 | `/` | 实例列表、启动/停止、公告 |
| 总览 | `/i/<实例>/overview` | 当前任务、资源、实时日志、快捷操作 |
| 任务配置 | `/i/<实例>/task/<任务>` | 由配置 schema 自动生成的表单 |
| 统计 | `/i/<实例>/statistics` | 资源、出击、大世界、委托、仓库报表 |
| 交易所 | `/i/<实例>/stock-exchange` | 独立的交易记录模块 |
| 调度程序 | `/i/<实例>/task/SchedulerProgram` | 图形化编排（原调度 / 增强 / 接管） |
| 心智计算器 | `/i/<实例>/task/MindCalculator` | 船坞扫描与心智单元费用 |
| 舰队科技 | `/i/<实例>/task/FleetTechnology` | 科技点扫描与统计 |
| 已安装配置 | `/configs` | 导入、导出、复制、删除实例 |
| 设置 | `/settings` | 账户、远程访问、更新、界面 |
| 更新 | `/updater` | 拉取提交、应用更新 |
| 公告 | `/announcement` | 版本公告与提示 |

## <DocIcon name="monitor" /> 总览页

总览把「现在在干什么」压缩到一屏：

- <DocIcon name="clock" /> **当前任务**：调度器通过 `set_task()` 推送的任务名与状态。
- <DocIcon name="badge-dollar" /> **资源**：石油、物资、钻石、行动力等，来自统计与截图读取。
- <DocIcon name="scroll" /> **日志尾**：worker 的实时日志，按级别着色。
- <DocIcon name="zap" /> **快捷操作**：启动 / 停止 / 重启、立即执行某任务、打开截图。

日志里的任务边界形如：

```text
[AzurPilot] 调度器: 开始任务
──────────────── 科研 ────────────────
[AzurPilot] 调度器: 结束任务
```

## <DocIcon name="file-pen" /> 任务配置页

左侧是任务分组（出击、活动、大世界……），右侧是当前任务的表单。表单由 `argument.yaml` 的类型定义动态渲染，不是手写页面。

### <DocIcon name="clipboard" /> 表单结构

| 区块 | 含义 |
| --- | --- |
| 任务说明 | 任务名旁的问号，来自 `i18n` 的 `help` |
| 调度设置 | 启用、推送、下一次运行时间、成功/失败间隔、敏感任务 |
| 任务参数 | 该玩法的具体选项，如关卡、舰队、停止条件 |
| 存储 | 该任务结果写入哪张统计表 |

### <DocIcon name="pencil" /> 值的类型

| 控件 | 对应类型 | 注意 |
| --- | --- | --- |
| 复选框 | `checkbox` | 布尔，保存即生效 |
| 下拉框 | `select` / `option` | 选项值可能是字符串或数字 |
| 输入框 | `input` / `textarea` | 部分字段有正则校验 |
| 时间 | `datetime` / `time` | 清空表示「立即到期」 |

::: tip 保存是异步的
编辑器会把修改排队提交（`config.patch`），并用 `revision` 做冲突检测。看到「已保存」再离开页面。多人同时编辑同一实例时，后提交者会收到冲突提示。
:::

### <DocIcon name="warning" /> 敏感任务

`Scheduler.Sensitive` 打开后，该任务出错会**停止整个实例**而不是重启游戏。默认对 `OpsiCrossMonth`、`OpsiObscure`、`OpsiAbyssal` 生效，因为在这些环节反复重启可能造成数据损坏。

## <DocIcon name="zap" /> 调度程序（自定义调度）

「任务配置 → 系统 → 自定义调度」提供一个节点画布：

- 卡片左侧是执行入口，右侧是出口；方形端口控制顺序，圆形端口传数据。
- 支持框选、多选、复制粘贴、撤销重做、全选、删除连线。
- 常用参数（资源、任务、运算符、等待时间、变量）可直接在卡片上编辑，详细参数在右侧属性面板。
- 应用前由后端校验；运行中的实例在任务安全边界生效。

三种模式：

| 模式 | 行为 |
| --- | --- |
| 原调度 | 保留既有优先级与时间表；额外支持通用设置里的石油自动控制 |
| 增强调度 | 程序只能从「已启用且已到期」的任务中选择，并可设置本次参数 |
| 完全接管 | 程序决定业务任务，包括未在原配置中启用的任务；系统恢复仍走现有通道 |

::: warning 先模拟再应用
编辑器提供模拟器（`scheduler.program.simulate`），用模拟时间、资源与任务结果跑图，不连接设备、不写真实配置。打开编辑器或保存草稿都不会启用方案，必须点「应用方案」。
:::

## <DocIcon name="eye" /> 统计与资源

统计页把 SQLite 总库里的记录变成报表：资源曲线、出击次数、掉落、大世界收益、委托、科研、仓库。资源管理视图额外提供桑基图与石油控制线。

## <DocIcon name="brain" /> 心智计算器与舰队科技

- <DocIcon name="brain" /> **心智计算器**：扫描船坞识别舰船与等级，人工核对后计算心智单元费用，支持 JSON / CSV / XLSX 导入导出。
- <DocIcon name="medal" /> **舰队科技**：独立记录舰船身份与等级，统计科技点，不按心智计费条件排除。

两者都需要 `MindCalculatorScan` / `FleetTechScan` 任务产出数据。扫描会重置船坞筛选，完成前保留旧数据。

## <DocIcon name="settings" /> 系统设置

| 分区 | 内容 |
| --- | --- |
| 账户 | 账号保险库：创建、解锁、绑定 TPM / 本机密钥、切换配置文件 |
| 远程访问 | Cloudflare Quick Tunnel 开关、配对码、已授权客户端、撤销 |
| 更新 | 当前提交、可用提交、拉取与应用 |
| 界面 | 主题、语言、背景图库、布局密度 |
| 配置管理 | 导入导出、删除、复制实例 |

## <DocIcon name="rainbow" /> 语言与主题

- <DocIcon name="message-text" /> 界面语言支持 `zh-CN`、`zh-TW`、`ja-JP`、`en-US`，以及一个彩蛋语言 `zh-MIAO`。配置项的中文说明来自 `module/config/i18n/*.json`。
- <DocIcon name="monitor" /> 主题跟随部署设置或界面设置，支持亮色 / 深色。
- <DocIcon name="smartphone" /> 移动端布局会折叠侧边栏，任务表单变为单列。

## <DocIcon name="search" /> 快捷键与搜索

- <DocIcon name="search" /> 顶部搜索框可以搜索配置项与任务名，支持 `Ctrl/Cmd + K` 聚焦。
- <DocIcon name="settings" /> 调度画布内：`Ctrl/Cmd + Z` 撤销、`Shift + Z` 重做、`Ctrl/Cmd + A` 全选、`Esc` 取消选择、空格 + 拖动平移。

## <DocIcon name="rocket" /> 下一步

<ul class="ap-linklist">
<li><a href="/azurpilot/user/device">连接模拟器与 ADB<span class="desc">先把画面接上</span></a></li>
<li><a href="/azurpilot/user/scheduler">调度器与任务编排<span class="desc">什么时候跑什么</span></a></li>
<li><a href="/api/websocket">WebSocket API<span class="desc">界面背后的协议</span></a></li>
</ul>
