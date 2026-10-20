---
title: React 前端
description: WebUI 前端的目錄結構、路由與頁面清單、與後端共享的 API 契約、狀態管理方式、國際化約定，以及本地開發與測試流程。
updated: 2026-10-20
---

# React 前端

前端是純靜態的 React 應用，構建產物由 `gui.py` 本地代管。它沒有伺服端渲染，也不需要單獨的 Node 服務。

## <DocIcon name="wrench" /> 技術棧

| 依賴 | 版本 | 用途 |
| --- | --- | --- |
| React | 19.3 | UI |
| React Router | 7.18 | 路由 |
| Vite | 6.x | 構建 |
| TypeScript | 5.x | 類型 |
| ECharts | 6.1 | 統計圖表 |
| @xyflow/react | 12.x | 排程畫布 |
| motion | 13.x | 動效 |
| CodeMirror | 6.x | YAML / JSON 編輯 |
| lucide-react | 1.45 | 圖標 |

Node.js 要求 `>=22.12.0`（見 `frontend/package.json` 的 `engines`）。

## <DocIcon name="folder" /> 目錄

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

| 路徑 | 頁面 |
| --- | --- |
| `/` | 首頁（實例列表） |
| `/announcement` | 公告 |
| `/interface` | 介面設定 |
| `/remote` | 遠端訪問 |
| `/settings` | 系統設定 |
| `/updater` | 更新 |
| `/configs` | 配置管理 |
| `/dev` | 開發控件 |
| `/i/:instance/overview` | 實例總覽 |
| `/i/:instance/task/:task` | 任務配置 |
| `/i/:instance/statistics` | 統計 |
| `/i/:instance/stock-exchange` | 交易所 |
| `/i/:instance/task/SchedulerProgram` | 排程程序 |
| `/i/:instance/task/MindCalculator` | 心智計算器 |
| `/i/:instance/task/FleetTechnology` | 艦隊科技 |

舊路徑（`/logs`、`/resources`、`/scheduler`、`/mind-calculator`）會重定向到新位置，避免書籤失效。

## <DocIcon name="plug" /> API 契約

```ts
import { api } from '../api/client'

const list = await api.request('instances.list', {})
```

- `frontend/src/api/generated.ts` 由 `dev_tools.export_api_schema` 生成，包含每個方法的名與參數類型。
- `frontend/src/api/contract.json` 是完整 JSON Schema，用於校驗與測試。
- **不要手改生成檔案**。後端改參數模型後重新匯出。

`api.request` 負責：請求 ID 生成、超時、錯誤碼到提示的映射、連接斷開時的重連提示。

## <DocIcon name="box" /> 狀態管理

沒有引入 Redux 或 Zustand。狀態分三類：

| 類型 | 載體 | 例子 |
| --- | --- | --- |
| 伺服器狀態 | 訂閱 + 請求結果 | 實例列表、總覽、統計 |
| 編輯狀態 | `config/EditQueue.ts` | 配置表單的待提交修改 |
| 介面偏好 | localStorage + 頂欄偏好 | 主題、佈局、上次路徑 |

### 儲存佇列

配置編輯不是每次輸入都發請求：

1. 輸入進入 `EditQueue`。
2. 合併同一路徑的連續修改。
3. 帶 `revision` 批量 `config.patch`。
4. 衝突時提示刷新，不覆蓋他人的修改。

頁面解除安裝前會等待佇列清空，避免「改完就切頁」丟配置。

## <DocIcon name="message-text" /> 國際化

- `i18n.resources.ts` 是執行時文案，`zh-CN` 為源。
- `i18n.dev.ts` / `i18n.test.ts` 提供開發與測試用的缺失鍵提示。
- 配置項的中文文案不在這裡，而在 Python 側的 `module/config/i18n/*.json`，由 `schema.get` 下發。

新增介面文案時，至少補 `zh-CN` 與 `en-US`；缺失鍵在開發模式下會顯式顯示，不會靜默回退。

## <DocIcon name="zap" /> 排程畫布

`src/scheduler/` 是自定義排程編輯器的核心：

- 節點與連接埠由 `module/scheduler/` 的模型驅動，前端只負責渲染與編輯。
- 方形連接埠控制執行順序，圓形連接埠傳數據；不兼容類型不能連線。
- 拖拽由 React Flow 管理，鬆手後提交一次說明文件變更。
- 儲存前調用 `scheduler.program.validate`，執行前調用 `apply`。

## <DocIcon name="rainbow" /> 樣式

- 全局變數在 `styles/`，組件樣式就近。
- 主題切換通過 CSS 變數，不在組件裡寫死顏色。
- 移動端斷點會讓側邊欄摺疊、表單單列。

## <DocIcon name="laptop" /> 本地開發

```bash
npm ci --prefix frontend
npm run dev --prefix frontend        # 需要后端在 25548
npm run dev:mock --prefix frontend   # 使用 mock 服务，不连真实后端
```

Vite 開發伺服器監聽 `127.0.0.1`，通過代理訪問後端。`dev:mock` 適合只改介面的場景，不會觸碰真實配置。

## <DocIcon name="flask" /> 測試

| 類型 | 命令 | 覆蓋 |
| --- | --- | --- |
| 類型檢查 | `npm run typecheck --prefix frontend` | 全部 TS/TSX |
| 單元測試 | `npm test --prefix frontend` | 組件、hooks、工具函數 |
| 端到端 | `npm run test:e2e --prefix frontend` | 真實後端 |
| 端到端（mock） | `npm run test:e2e:mock --prefix frontend` | 模擬服務 |
| 交易所專項 | `npm run test:e2e:stock --prefix frontend` | 交易所流程 |

::: tip 先跑 mock
真實 e2e 需要模擬器與實例，跑一次成本高。改介面時優先 `test:e2e:mock`，確認交互無誤後再跑真實鏈路。
:::

## <DocIcon name="package" /> 構建

```bash
npm run build --prefix frontend
```

- 先 `tsc -b` 再 `vite build`，類型錯誤會直接失敗。
- 產物寫入 `frontend/dist`，由後端靜態代管。
- `gui.py` 在 `dist` 缺失時會自動構建，但生產部署建議預構建，避免首次啟動等待。

## <DocIcon name="shield" /> 修改前須知

| 事項 | 約定 |
| --- | --- |
| 新增 API | 先改 Python 契約並匯出，再寫前端 |
| 配置字段 | 不改前端表單程式碼，schema 驅動自動渲染 |
| 主題色 | 用 CSS 變數，不要新增硬編碼色值 |
| 圖標 | 統一用 `lucide-react` |
| 文案 | 補 `zh-CN` 與 `en-US` |
| 大組件 | 拆到 `components/`，頁面只做編排 |
