---
title: React 前端
description: WebUI 前端的目录结构、路由与页面清单、与后端共享的 API 契约、状态管理方式、国际化约定，以及本地开发与测试流程。
updated: 2026-10-20
---

# React 前端

前端是纯静态的 React 应用，构建产物由 `gui.py` 本地托管。它没有服务端渲染，也不需要单独的 Node 服务。

## <DocIcon name="wrench" /> 技术栈

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| React | 19.3 | UI |
| React Router | 7.18 | 路由 |
| Vite | 6.x | 构建 |
| TypeScript | 5.x | 类型 |
| ECharts | 6.1 | 统计图表 |
| @xyflow/react | 12.x | 调度画布 |
| motion | 13.x | 动效 |
| CodeMirror | 6.x | YAML / JSON 编辑 |
| lucide-react | 1.45 | 图标 |

Node.js 要求 `>=22.12.0`（见 `frontend/package.json` 的 `engines`）。

## <DocIcon name="folder" /> 目录

```text
frontend/src/
├── main.tsx           # 路由与入口
├── app/               # 布局、顶栏、搜索目标、偏好
├── pages/             # 页面级组件
├── components/        # 通用组件
├── api/               # 客户端、类型、生成契约
├── config/            # 配置表单模型与保存队列
├── scheduler/         # 调度画布的节点、端口、布局
├── mind/              # 心智计算器
├── fleet-tech/        # 舰队科技
├── resources/         # 资源管理
├── stock/             # 交易所
├── remote/            # 远程访问
├── i18n*.ts           # 国际化资源与开发工具
└── styles/            # 全局样式与变量
```

## <DocIcon name="map" /> 路由

| 路径 | 页面 |
| --- | --- |
| `/` | 首页（实例列表） |
| `/announcement` | 公告 |
| `/interface` | 界面设置 |
| `/remote` | 远程访问 |
| `/settings` | 系统设置 |
| `/updater` | 更新 |
| `/configs` | 配置管理 |
| `/dev` | 开发控件 |
| `/i/:instance/overview` | 实例总览 |
| `/i/:instance/task/:task` | 任务配置 |
| `/i/:instance/statistics` | 统计 |
| `/i/:instance/stock-exchange` | 交易所 |
| `/i/:instance/task/SchedulerProgram` | 调度程序 |
| `/i/:instance/task/MindCalculator` | 心智计算器 |
| `/i/:instance/task/FleetTechnology` | 舰队科技 |

旧路径（`/logs`、`/resources`、`/scheduler`、`/mind-calculator`）会重定向到新位置，避免书签失效。

## <DocIcon name="plug" /> API 契约

```ts
import { api } from '../api/client'

const list = await api.request('instances.list', {})
```

- `frontend/src/api/generated.ts` 由 `dev_tools.export_api_schema` 生成，包含每个方法的名与参数类型。
- `frontend/src/api/contract.json` 是完整 JSON Schema，用于校验与测试。
- **不要手改生成文件**。后端改参数模型后重新导出。

`api.request` 负责：请求 ID 生成、超时、错误码到提示的映射、连接断开时的重连提示。

## <DocIcon name="box" /> 状态管理

没有引入 Redux 或 Zustand。状态分三类：

| 类型 | 载体 | 例子 |
| --- | --- | --- |
| 服务器状态 | 订阅 + 请求结果 | 实例列表、总览、统计 |
| 编辑状态 | `config/EditQueue.ts` | 配置表单的待提交修改 |
| 界面偏好 | localStorage + 顶栏偏好 | 主题、布局、上次路径 |

### 保存队列

配置编辑不是每次输入都发请求：

1. 输入进入 `EditQueue`。
2. 合并同一路径的连续修改。
3. 带 `revision` 批量 `config.patch`。
4. 冲突时提示刷新，不覆盖他人的修改。

页面卸载前会等待队列清空，避免「改完就切页」丢配置。

## <DocIcon name="message-text" /> 国际化

- `i18n.resources.ts` 是运行时文案，`zh-CN` 为源。
- `i18n.dev.ts` / `i18n.test.ts` 提供开发与测试用的缺失键提示。
- 配置项的中文文案不在这里，而在 Python 侧的 `module/config/i18n/*.json`，由 `schema.get` 下发。

新增界面文案时，至少补 `zh-CN` 与 `en-US`；缺失键在开发模式下会显式显示，不会静默回退。

## <DocIcon name="zap" /> 调度画布

`src/scheduler/` 是自定义调度编辑器的核心：

- 节点与端口由 `module/scheduler/` 的模型驱动，前端只负责渲染与编辑。
- 方形端口控制执行顺序，圆形端口传数据；不兼容类型不能连线。
- 拖拽由 React Flow 管理，松手后提交一次文档变更。
- 保存前调用 `scheduler.program.validate`，运行前调用 `apply`。

## <DocIcon name="rainbow" /> 样式

- 全局变量在 `styles/`，组件样式就近。
- 主题切换通过 CSS 变量，不在组件里写死颜色。
- 移动端断点会让侧边栏折叠、表单单列。

## <DocIcon name="laptop" /> 本地开发

```bash
npm ci --prefix frontend
npm run dev --prefix frontend        # 需要后端在 25548
npm run dev:mock --prefix frontend   # 使用 mock 服务，不连真实后端
```

Vite 开发服务器监听 `127.0.0.1`，通过代理访问后端。`dev:mock` 适合只改界面的场景，不会触碰真实配置。

## <DocIcon name="flask" /> 测试

| 类型 | 命令 | 覆盖 |
| --- | --- | --- |
| 类型检查 | `npm run typecheck --prefix frontend` | 全部 TS/TSX |
| 单元测试 | `npm test --prefix frontend` | 组件、hooks、工具函数 |
| 端到端 | `npm run test:e2e --prefix frontend` | 真实后端 |
| 端到端（mock） | `npm run test:e2e:mock --prefix frontend` | 模拟服务 |
| 交易所专项 | `npm run test:e2e:stock --prefix frontend` | 交易所流程 |

::: tip 先跑 mock
真实 e2e 需要模拟器与实例，跑一次成本高。改界面时优先 `test:e2e:mock`，确认交互无误后再跑真实链路。
:::

## <DocIcon name="package" /> 构建

```bash
npm run build --prefix frontend
```

- 先 `tsc -b` 再 `vite build`，类型错误会直接失败。
- 产物写入 `frontend/dist`，由后端静态托管。
- `gui.py` 在 `dist` 缺失时会自动构建，但生产部署建议预构建，避免首次启动等待。

## <DocIcon name="shield" /> 修改前须知

| 事项 | 约定 |
| --- | --- |
| 新增 API | 先改 Python 契约并导出，再写前端 |
| 配置字段 | 不改前端表单代码，schema 驱动自动渲染 |
| 主题色 | 用 CSS 变量，不要新增硬编码色值 |
| 图标 | 统一用 `lucide-react` |
| 文案 | 补 `zh-CN` 与 `en-US` |
| 大组件 | 拆到 `components/`，页面只做编排 |
