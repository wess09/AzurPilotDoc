---
title: 參與貢獻
description: 提交 Issue 與 PR 的規範：什麼該進 Issue、什麼該進 PR、代碼與文檔的分工邊界，以及哪些改動不會被接受。
updated: 2026-10-20
---

# 參與貢獻

這三個倉庫都是社區維護的開源項目。貢獻不只有寫代碼：復現問題、補文檔、驗證設備兼容性同樣有價值。

## <DocIcon name="gift" /> 可以貢獻什麼

| 類型 | 價值 | 入口 |
| --- | --- | --- |
| 復現 Bug 並給出日誌 | 高 | Issue |
| 補充/修正文檔 | 高 | 本站或倉庫 `docs/` |
| 適配新活動圖 | 高 | `campaign/` |
| 修復識別/調度問題 | 高 | PR |
| 設備兼容性驗證 | 中 | Issue 附設備資訊 |
| 翻譯 | 中 | `i18n/*.json`、`locales/*.yml` |
| 新功能 | 需先討論 | Issue 提案 |

## <DocIcon name="circle-alert" /> 提交 Issue

一個能修的 Issue 至少包含：

```text
版本：核心 7de6bb9 / 启动器 2.2.5 / 无 Android
环境：Windows 11 + MuMu12 16384 + 1280×720
复现：设置 → 任务 → 科研 → 启用 → 立即执行
期望：完成收取
实际：卡在「科研项目列表」，日志最后 20 行如下
证据：log/error/ap/2026-10-20_10-00-00/ 截图与 log.txt
已试：换截图方案、重启模拟器、换关卡
```

::: danger 不要貼憑據
`config/deploy.yaml`、`password.txt`、`remote-access.json`、SSH 私鑰、帳號截圖都不要發。維護者不會向你要這些。
:::

## <DocIcon name="handshake" /> 提交 PR

### 流程

1. Fork，從預設分支拉分支（核心是 `master`，另外兩個是 `main`）。
2. 改動聚焦單一主題。
3. 跑與改動相關的測試與生成器。
4. 按 `.github/PULL_REQUEST_TEMPLATE.md` 填寫。
5. 確保 CI 通過。

### 核心倉庫的額外要求

| 改動 | 必須 |
| --- | --- |
| 配置 YAML | 運行 `config_updater`，提交生成產物 |
| 按鈕資源 | 運行 `button_extract` |
| API 參數 | 運行 `export_api_schema` |
| 新任務 | 補 i18n 五語言、模組文檔、索引 |
| 模組行為 | 更新 `docs/modules/` 對應文檔 |

### 不要做的事

- 不要手改 `args.json`、`menu.json`、`config_generated.py`、`generated.ts`、`contract.json`。
- 不要用 `--no-verify` 跳過鈎子。
- 不要把格式化無關改動混進功能 PR。
- 不要在 PR 裏提交 `config/`、`log/`、`.venv/`。
- 不要在未驗證的情況下勾選「已測試」。

## <DocIcon name="pencil" /> 代碼風格

| 語言 | 約定 |
| --- | --- |
| Python | 4 空格；中文註釋；標識符英文；遵循現有模組結構 |
| TypeScript | 嚴格模式；組件就近；不引入新狀態庫 |
| Rust | `cargo fmt`；平台分支用 `#[cfg]`；日誌用 `tracing` |
| Kotlin | 4 空格；KDoc 記錄執行緒與生命週期約束 |
| Markdown | 中文技術寫作，短句，先結論後細節 |

## <DocIcon name="file" /> 文檔貢獻

見[文檔維護](/zh-HK/contributing/docs)。原則只有一條：**事實來自源碼或可復現的實驗**，不來自印象。

## <DocIcon name="shield" /> 安全

如果你發現的是安全問題（憑據泄露、越權、注入），不要公開提 Issue。通過倉庫 Security 頁面或維護者郵箱私下報告。

| 類型 | 例子 |
| --- | --- |
| 憑據泄露 | 日誌打印密碼、配置明文提交 |
| 越權 | 非本機請求訪問 `/android/*`、Binder 回投未校驗 |
| 注入 | 配置值進入 shell 命令 |
| 供應鏈 | 依賴被替換、下載未校驗 |

## <DocIcon name="scale" /> 許可證

| 倉庫 | 許可證 | 注意 |
| --- | --- | --- |
| 核心 | GPL-3.0 | 分發修改版需開源 |
| Android | AGPL-3.0 | 網絡服務也需提供源碼 |
| 啟動器 | GPL-3.0 | 同上 |

提交即表示你同意以對應許可證分發你的貢獻。不要提交來源不明或授權不兼容的代碼與素材。
