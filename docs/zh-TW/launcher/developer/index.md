---
title: 啟動器開發者入口
description: Tauri 2 + Rust 專案的模組劃分、版本基線（3.0.4/0.0.0）、構建命令、構建期環境變數與跨平臺約定。
updated: 2026-10-31
---

# 啟動器開發者入口

啟動器基於 **Tauri 2 + Rust** 構建，集成了輕量 Webview 渲染、處理程序代管與系統級集成；負責自舉獨立 Python 執行時、同步核心依賴與管理後端服務。

## <DocIcon name="laptop" /> 開發環境與工具鏈

| 工具 | 版本 / 要求 | 說明 |
| --- | --- | --- |
| Rust | stable（edition 2021） | 編譯啟動器核心邏輯與 Tauri 原生橋接 |
| Node.js | v20+（CI 使用 Node 22） | 執行前端構建與打包工具 |
| Inno Setup | Inno Setup 6 / 7 | **僅 Windows**：構建 Setup 安裝程序（CI 通過 choco 安裝） |
| 系統底層庫 | 三平臺對應依賴 | Windows：WebView2；Linux：`libwebkit2gtk-4.1`、`libgtk-3`、`libappindicator3`、`librsvg2`、`patchelf`、`rdfind`；macOS：`rdfind`、Xcode CLI |

基礎開發與編譯命令：

```bash
cargo build              # debug 编译
cargo build --release    # 生产编译（开启 LTO 与 strip）
cargo tauri dev          # 开发调试运行
cargo test               # 单元测试与集成测试
cargo check              # 快速编译语法检查
```

Windows 下編譯 Inno Setup 安裝包（可在本地測試安裝程序）：

```powershell
ISCC.exe install.iss /DTargetArch=x64 /DAppVersion=3.0.4
# 或 ARM64
ISCC.exe install.iss /DTargetArch=arm64 /DAppVersion=3.0.4
```

::: warning Windows 需要管理員終端
啟動器 manifest 聲明瞭 `requireAdministrator`。未提權時完整測試程序可能以錯誤 740 啟動失敗，`cargo test` 也會受影響。
:::

## <DocIcon name="box" /> 核心模組結構

| 原始碼路徑 | 職責與能力 |
| --- | --- |
| `src/main.rs` | Tauri 應用程序入口：主視窗與啟動畫面（splash window）控制、系統系統匣管理、錯誤頁、全局命令與時間炸彈控制 |
| `src/setup.rs` | 執行時環境自舉：Python 3.14.3 安裝（多鏡像回退）、建立 relocatable `.venv`、`uv sync` 依賴同步（最大 20 次重試）、取消狀態控制與環境安全清理 |
| `src/backend.rs` | 後端服務子處理程序生命週期管理、連接埠佔用探測與清理、心跳健康檢查與處理程序回收 |
| `src/window_util.rs` | **Windows**：封裝 `CREATE_NO_WINDOW` 處理程序建立標記，避免子處理程序彈出黑框控制台 |
| `src/notify.rs` | SSE 通知流監聽（`/api/notify_stream`）與各操作系統原生通知推送 |
| `src/i18n.rs` | 國際化語言解析：支援 `--lang`、`--locale`、`/lang`、`/locale` 命令行覆蓋與系統 locale 自動識別 |
| `locales/` | 4 種語言定義檔案：`zh-CN.yml`（簡體中文基準）、`zh-TW.yml`、`ja.yml`、`en.yml`（英文回退） |
| `install.iss` | Windows Inno Setup 安裝包工程腳本，支援 x64 與 ARM64 雙架構，集成目錄安全權限配置與處理程序清理 |
| `installer/ChineseSimplified.isl` | 倉庫內嵌的 Inno Setup 簡體中文官方語言包，確保在任意 CI Runner 均能穩定編譯中文安裝嚮導 |

## <DocIcon name="scale" /> 版本基線機制：3.0.4 與 0.0.0

在原始碼倉庫中，所有設定檔（`Cargo.toml`、`tauri.conf.json`、`Info.plist`）統一將版本號固定為 `0.0.0` 模板基線：

- **為什麼原始碼固定為 `0.0.0`**：啟動器包含多個跨平臺設定檔，若在原始碼中手動更新版本，極易出現跨檔案版本號不一致或提交衝突。
- **CI 動態解析與注入**：`.github/workflows/package.yml` 中的 `Resolve release version` 步驟會在檢測到 Git Tag（例如 `v3.0.4`）或手動發佈觸發時，自動驗證 SemVer 規範，並批量重寫 `Cargo.toml`、`tauri.conf.json`、`Info.plist` 中的版本字段，並以 `/DAppVersion` 編譯參數注入 Inno Setup。
- **當前發佈基線**：當前公開的穩定發佈版本為 **3.0.4**。原始碼樹中的 `0.0.0` 屬於模板佔位符，不代表處於未定義狀態。

## <DocIcon name="settings" /> 構建期環境變數與關鍵常量

`build.rs` 與工作流支援以下編譯期與執行時配置：

| 常量 / 變數 | 說明與預設值 |
| --- | --- |
| `PYTHON_VERSION` | `3.14.3`（獨立 managed Python 構建版本） |
| `DEFAULT_UV_PYTHON_INSTALL_MIRRORS` | 預設 Python 安裝鏡像列表：npmmirror、南京大學鏡像、官方 python-standalone |
| `UV_PYTHON_INSTALL_MIRROR` | 可選環境變數，用戶覆蓋自定義 Python 下載源 |
| `WebUI 端口` | 預設 `22267` |
| `MAX_SYNC_RETRIES` | 依賴同步重試次數，預設 20 次 |
| `TIPS_COUNT` | 啟動畫面 Tips 總數（19 條） |
| `时间炸弹` | `Cargo.toml` 中 `[package.metadata.ntep-launcher.time-bomb]`，預設 `enabled = false` |

## <DocIcon name="shield" /> 編碼與貢獻約定

1. **多語言對齊**：新增介面文本時，需在 `locales/` 下的 4 個語言檔案（`zh-CN.yml`、`zh-TW.yml`、`ja.yml`、`en.yml`）同時添加對應翻譯鍵，程式碼中使用 `t!("...")` 宏調用。
2. **多平臺兼容**：系統特性（如 Windows Job Object、Unix 處理程序組、macOS App Bundle 路徑）必須通過 `#[cfg(target_os = "...")]` 或 `#[cfg(windows)]` / `#[cfg(unix)]` 嚴格隔離。
3. **隱藏控制台黑窗**：所有子處理程序調用統一通過 `window_util::CreateNoWindow` 附加無視窗標記。
4. **統一日誌記錄**：使用 `tracing` 框架記錄日誌，不要直接在生產邏輯中使用 `println!`。
5. **保護用戶數據**：任何清理或重置函數必須校驗工作區歸屬，禁止刪除用戶 `config/` 配置與備份目錄。

## <DocIcon name="flask" /> 測試與檢查

```bash
cargo check --locked --all-targets
cargo test --locked --all-targets
```

## <DocIcon name="map" /> 說明文件地圖

<ul class="ap-linklist">
<li><a href="/zh-TW/launcher/developer/architecture">Tauri 與 Rust 架構<span class="desc">視窗、協議、系統匣</span></a></li>
<li><a href="/zh-TW/launcher/developer/backend-lifecycle">後端處理程序生命週期<span class="desc">Job Object 與回收</span></a></li>
<li><a href="/zh-TW/launcher/developer/update">更新鏈路與鏡像<span class="desc">git、uv、mTLS</span></a></li>
<li><a href="/zh-TW/launcher/developer/build-release">構建與發佈<span class="desc">三平臺矩陣</span></a></li>
</ul>
