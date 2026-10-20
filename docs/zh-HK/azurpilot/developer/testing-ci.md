---
title: 測試與 CI
description: Python 單元測試、前端 Vitest 與 Playwright、匯入冒煙、生成產物校驗，以及 GitHub Actions 的五個作業。
updated: 2026-10-20
---

# 測試與 CI

這個倉庫的測試策略是「**便宜的檢查每次跑，昂貴的檢查按範圍跑**」。CI 負責保證生成產物一致、模組可匯入、關鍵鏈路不迴歸；真機識別效果仍然只能人工驗證。

## <DocIcon name="box" /> 測試分層

| 層 | 工具 | 數量級 | 特點 |
| --- | --- | --- | --- |
| Python 單元測試 | `unittest` | 200+ 檔案 | 不連設備，使用夾具與臨時配置 |
| Python 專項 | `pytest` | `tests/shop_event` 等 | 參數化場景 |
| 前端單元 | Vitest | 組件、hooks、工具 | jsdom 環境 |
| 前端端到端 | Playwright | 真實後端 / mock 兩套 | 覆蓋關鍵交互 |
| 匯入冒煙 | 自研腳本 | 遍歷 `module/`、`deploy/` | 子進程匯入，白名單已知失敗 |
| 生成產物校驗 | git diff | 全量 | 配置、按鈕、API 契約 |

## <DocIcon name="laptop" /> 本地跑測試

```bash
# 全量 Python 单元测试
uv run python -m unittest discover -s tests

# 单个模块
uv run python -m unittest tests.test_api

# pytest 专项
uv run pytest tests/shop_event

# 导入冒烟（不连设备）
uv run python -m dev_tools.import_smoke_test

# 基础 lint
uv run ruff check . --select E9,F63,F7,F82 --ignore F821,F722
```

前端：

```bash
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run test:e2e:mock --prefix frontend
```

::: tip 不要每次改一行就跑全量
AGENTS.md 的約定是：優先跑與改動直接相關的測試；只有行為影響三個以上模組或大規模重構時才跑全量。生成檔案、翻譯、文檔不計入「行為模組」數量。
:::

## <DocIcon name="cloud" /> CI 作業

`.github/workflows/ci.yml`，在 push 與 PR 時觸發，同一分支併發會取消舊運行。

| 作業 | 運行環境 | 內容 |
| --- | --- | --- |
| `game-data` | Ubuntu / Windows / macOS-14 矩陣 | 身份持久化、交易所、歷史認證、賬戶恢復、部署遷移 |
| `frontend` | Ubuntu + Node 24 | 鎖檔案下載源、API 契約 diff、API/運行時/島嶼/心智/艦隊科技測試、前端構建與 Vitest、Playwright |
| `ruff` | Ubuntu | `E9,F63,F7,F82`（忽略 `F821,F722`） |
| `button-config-check` | Ubuntu | 重跑 `button_extract` 與 `config_updater`，`git diff --exit-code` |
| `import-smoke` | Ubuntu | 全量匯入 + `tests.test_ci_import`，上傳彙總 |

另有兩條協作工作流：

- `ci-report-placeholder.yml`：PR 提交時建立佔位評論。
- `ci-report.yml`：CI 完成後把佔位評論更新為結果報告。

### 為什麼 macOS 只跑 `macos-14`
`macos-15-intel` 沒有 llvmlite 的 x86_64 wheel，`uv sync` 會必然失敗。矩陣因此只包含 Apple Silicon 的 `macos-14`。

### API 契約校驗

```bash
uv run python -m dev_tools.export_api_schema
git diff --exit-code -- frontend/src/api/generated.ts frontend/src/api/contract.json
```

改了後端參數模型卻沒匯出契約，CI 直接失敗。

### 生成產物校驗

```bash
uv run -m dev_tools.button_extract
uv run -m module.config.config_updater
git diff --exit-code
```

這條檢查攔住兩類問題：改了 YAML 沒生成，以及手改了生成檔案。

## <DocIcon name="settings" /> 前端 e2e 的三種配置

| 命令 | 配置 | 用途 |
| --- | --- | --- |
| `npm run test:e2e` | 預設 | 連真實後端，覆蓋主流程 |
| `npm run test:e2e:mock` | `playwright.mock.config.ts` | 模擬服務，介面改動首選 |
| `npx playwright test --config playwright.mind.config.ts` | 心智專項 | 心智計算器流程 |

CI 裏會安裝 Chromium 依賴並依次運行。

## <DocIcon name="shield" /> 寫測試的邊界

| 能測 | 不能測 |
| --- | --- |
| 配置遷移、參數校驗 | 真實識別準確率 |
| 調度狀態機、恢復矩陣 | 模擬器兼容性 |
| API 契約與會話鑑權 | 遊戲活動機制 |
| 前端交互與表單儲存 | OEM 系統上的懸浮窗行為 |

::: warning 靜態驗證不等於真機驗證
文檔裏會明確區分「源碼靜態驗證」與「真實設備驗證」。編譯通過、單測通過、甚至 CI 全綠，都不能説明某個識別在真機上可用。
:::

## <DocIcon name="circle-check" /> 提交前自檢

- [ ] 改動相關的 Python 測試通過
- [ ] `ruff` 通過
- [ ] 前端改動用 `typecheck` + `vitest` 驗證
- [ ] 改了 YAML → 跑過 `config_updater`
- [ ] 改了按鈕 → 跑過 `button_extract`
- [ ] 改了 API → 跑過 `export_api_schema`
- [ ] 生成產物與源碼一起提交
- [ ] PR 描述寫清驗證方式與未驗證部分
- [ ] 未執行的檢查不要勾選

## <DocIcon name="medal" /> 發佈相關

| 工作流 | 觸發 | 作用 |
| --- | --- | --- |
| `docker-publish.yml` | tag / master | 構建並推送鏡像 |
| `sync-cnb.yml` | 推送 | 同步到 CNB |
| `git-over-cdn-*.yml` | 定時 / 手動 | 國內鏡像分發 |
| `ai-issue-labeler.yml` | Issue | 自動打標籤 |

發佈流程見[發佈與版本](/zh-HK/contributing/release)。
