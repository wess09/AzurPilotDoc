---
title: 啟動器開發者入口
description: Tauri 2 + Rust 項目的模組劃分、構建命令、構建期環境變數與必須遵守的跨平台約定。
updated: 2026-10-20
---

# 啟動器開發者入口

啟動器沒有前端目錄：所有「頁面」都是內嵌 HTML，通過自定義 URI 協議加載。改介面等於改 Rust 裏嵌入的資源，不是改一個 React 項目。

## <DocIcon name="laptop" /> 環境

| 工具 | 版本 |
| --- | --- |
| Rust | stable（edition 2021） |
| Node.js | 僅用於 Tauri CLI（`cargo tauri`） |
| 系統依賴 | Windows：WebView2；Linux：`libwebkit2gtk-4.1`、`libgtk-3`；macOS：Xcode CLI |

```bash
cargo build              # debug
cargo build --release    # LTO + strip
cargo tauri dev          # 开发运行
cargo test               # 全部测试
cargo check              # 只检查编译
```

::: warning Windows 需要管理員終端
manifest 聲明瞭 `requireAdministrator`。未提權時完整測試程序會以錯誤 740 啟動失敗，`cargo test` 也會受影響。
:::

## <DocIcon name="box" /> 模組

| 模組 | 職責 |
| --- | --- |
| `main.rs` | Tauri 入口：splash/主窗口、托盤、標題欄注入、錯誤頁、命令註冊、時間炸彈 |
| `setup.rs` | 環境自舉：Python/uv/adb/git 安裝、git 更新（重試 20 次）、`uv sync`、`deploy.yaml` 遷移 |
| `backend.rs` | `gui.py` 子進程生命週期、連接埠清理、環境標記兜底回收 |
| `backend_process.rs` | Windows Job Object 與 Unix 進程組 |
| `nodejs.rs` | **僅 Windows**：檢測系統 Node，缺失時下載安裝（SHA256 校驗） |
| `notify.rs` | SSE 通知流（`/api/notify_stream`）與平台原生通知 |
| `launcher_control.rs` | 反向控制流（`/api/launcher/stream`）：後端下發的退出/重新啟動/自啟指令 |
| `autostart.rs` | 開機自啟（Windows 寫註冊表 Run 鍵，帶 `--start-minimized`） |
| `i18n.rs` | locale 檢測：`--lang` > 系統 locale > `en` |
| `window_util.rs` | Windows `CREATE_NO_WINDOW`，子進程不彈控制台 |

## <DocIcon name="settings" /> 構建期環境變數

`build.rs` 在編譯時讀取：

| 變數 | 作用 | 缺省 |
| --- | --- | --- |
| `ALAS_BOOTSTRAP_UV` | 要內嵌的 uv 二進制 | 空佔位符，運行時回退 PATH |
| `ALAS_LAUNCHER_MTLS_IDENTITY_PEM_B64` | 自更新 mTLS 客戶端證書 | 讀倉庫根的 `证书.txt`（不入庫） |
| `LAUNCHER_UPDATE_URL` | 覆蓋自更新源 | `https://launcher-api.azurpilot.com/updata/stable.json` |

::: danger 不要把證書提交進倉庫
`证书.txt` 與 base64 的 PEM 都是私密材料。CI 從 Secrets 注入，本地開發不要提交。
:::

## <DocIcon name="key" /> 關鍵常量

| 常量 | 值 |
| --- | --- |
| WebUI 連接埠 | `22267` |
| Python | `3.14.6` |
| 後端就緒等待 | 60 秒 |
| SSE 重連 | 3 秒 |
| Tauri identifier | `moe.taiho.alas-launcher` |
| 產品名 | `AzurPilot` |

時間炸彈配置在 `Cargo.toml` 的 `[package.metadata.alas-launcher.time-bomb]`，當前 `enabled = false`。

## <DocIcon name="shield" /> 約定

| 約定 | 説明 |
| --- | --- |
| i18n | 4 個 `locales/{zh-CN,zh-TW,ja,en}.yml`，`zh-CN.yml` 為基準；新增字符串要同時加 4 個檔案 |
| 平台分支 | 進程/窗口/通知/路徑必須考慮三平台，用 `#[cfg(target_os)]` |
| 子進程 | 一律套 `CreateNoWindow`（Windows），避免黑窗 |
| 日誌 | 用 `tracing`，寫入 `log/{date}_launcher.txt`，不要 `println!` |
| 版本號 | 發佈需同步 `Cargo.toml`、`tauri.conf.json`、`CHANGELOG.md` |
| 部署配置 | 六個 `deploy.*.yaml` 是運行時配置，改安裝邏輯要兼顧 `-cn` 變體 |

## <DocIcon name="flask" /> 測試

```bash
cargo check --locked --all-targets
cargo test --locked --all-targets
cargo test --locked backend_process::tests
```

`test.yml` 在 Linux、macOS、Windows x64/ARM64 上跑，不需要發佈密鑰。

## <DocIcon name="map" /> 文檔地圖

<ul class="ap-linklist">
<li><a href="/zh-HK/launcher/developer/architecture">Tauri 與 Rust 架構<span class="desc">窗口、協議、托盤</span></a></li>
<li><a href="/zh-HK/launcher/developer/backend-lifecycle">後端進程生命週期<span class="desc">Job Object 與回收</span></a></li>
<li><a href="/zh-HK/launcher/developer/update">更新鏈路與鏡像<span class="desc">git、uv、mTLS</span></a></li>
<li><a href="/zh-HK/launcher/developer/build-release">構建與發佈<span class="desc">三平台矩陣</span></a></li>
</ul>
