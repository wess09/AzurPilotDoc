---
title: Tauri 與 Rust 架構
description: AzurPilot Launcher 的 Tauri 2 + Rust 原生橋、工作區探測、狀態機與取消控制、i18n 國際化以及跨平台進程邊界。
updated: 2026-11-12
---

# Tauri 與 Rust 架構

啟動器基於 **Tauri 2 + Rust** 桌面框架開發，負責在不同桌面操作系統上提供啟動畫面、自舉 Python 運行環境、同步代碼與依賴、管理後端子進程並與 WebUI 橋接。

## 核心代碼與架構分工

| 路徑 | 核心模組 | 職責與平台特性 |
| --- | --- | --- |
| `src/main.rs` | 應用程序生命週期 | Tauri 2 Builder 配置、啟動畫面（splash window）與主窗口路由、系統托盤管理、開機自啟動與時間炸彈檢查 |
| `src/setup.rs` | 環境自舉狀態機 | 跨平台工作區識別、Python 3.14.3 獨立管理（多鏡像源）、relocatable `.venv` 建立、`uv sync` 依賴同步、任務取消信號處理與環境安全清理 |
| `src/backend.rs` | 後端服務託管 | 子進程啟動與重定向、連接埠衝突檢測、心跳探活與退出時全進程回收 |
| `src/window_util.rs` | 窗口屬性封裝 | **Windows**：為子進程附加 `CREATE_NO_WINDOW` 標記，避免彈出黑色命令行控制台 |
| `src/i18n.rs` | 國際化語言引擎 | 基於 `rust-i18n` 與 `sys-locale`，集成啟動參數（`--lang`/`--locale`）與系統 locale 探測 |
| `src/notify.rs` | 通知與通信流 | SSE 流（`/api/notify_stream`）監聽與系統原生通知中心橋接 |
| `install.iss` | Windows 安裝器配置 | Inno Setup 腳本，支援 x64 與 ARM64 雙架構，集成目錄權限賦予與安全路徑攔截 |
| `installer/ChineseSimplified.isl` | 安裝嚮導語言包 | 內嵌簡體中文嚮導語言檔案，保證 CI 與離線環境編譯穩定性 |

## 工作區發現與跨平台目錄解析

啟動器需要定位後端代碼和虛擬環境。不同操作系統的目錄結構存在差異，`setup.rs` 實現了自適應候選目錄探測機制：

```text
# Windows / Linux：同级工作区
[exe_dir]
├── alas-launcher.exe / alas-launcher
└── main.py / pyproject.toml / uv.lock (.venv/)

# macOS：App Bundle 内部嵌入工作区
[AzurPilot.app / NTEP Launcher.app]
└── Contents/
    ├── MacOS/ (exe_dir)
    ├── Resources/
    ├── Info.plist
    └── AzurPilot / NTEPilot/ (工作区: main.py / pyproject.toml / uv.lock / .venv/)
```

探測流程：
1. 獲取當前可執行程序所在路徑 `executable_dir()`。
2. **macOS 平台**：若 `exe_dir.file_name()` 為 `MacOS`，自動檢查 `Contents/AzurPilot` 或 `Contents/NTEPilot` 目錄。
3. **Windows / Linux 平台**：檢查 `exe_dir` 同級目錄。
4. 校驗目標目錄下必須同時具備三個基準檔案：`main.py`（或 `gui.py`）、`pyproject.toml` 與 `uv.lock`。

## 啟動狀態機、取消與安全清理

啟動器在啟動階段通過 `setup_workspace` 推進狀態流：

```text
打开启动器 → 检查工作区完整性
  → 准备环境 (ensure_runtime_tools)
      ├─ 检查/下载 Python 3.14.3 (npmmirror / nju / 官方源轮询)
      └─ 创建 relocatable .venv (Scripts/ 或 bin/)
  → uv sync --frozen --no-dev --no-install-project (最多重试 20 次)
  → 启动后端进程 (Windows Job Object / Unix 进程组)
  → 端口就绪，打开 WebUI (免密直达)
```

- **實時進度解析**：啟動器捕獲 `uv` 的標準輸出，實時識別 `Resolved`、`Downloading`、`Prepared`、`Installed` 等階段並更新 `SplashUpdate` 結構。
- **Tips 輪播**：內置 19 條貼心 Tips，在啟動與等待期間展示温馨提示與疑難排解技巧。
- **原子取消與狀態回滾**：支援通過 `cancel_requested: Arc<AtomicBool>` 響應用戶取消操作，主動向子進程發送終止信號並清理臨時檔案，防止產生半初始化的損壞環境。
- **安全清理防護**：運行時重建函數 `cleanup_runtime_for_rebuild` 會強制比對工作區路徑是否確實屬於當前啟動器，避免跨目錄誤刪。

## 國際化與語言解析架構

啟動器支援 `zh-CN`（簡體中文）、`zh-TW`（繁體中文）、`ja`（日本語）和 `en`（English）四種語言：

- **優先級**：命令行覆蓋參數 > 系統檢測 locale > 英語預設回退。
- **命令行參數識別**：`i18n.rs` 支援 `--lang <locale>`、`--locale <locale>`、`/lang <locale>`、`/locale <locale>` 以及 `--lang=zh-CN`、`--locale=zh-CN` 形式。
- **智能語言歸一化**：
  - 含有 `tw`、`hk`、`hant` 或 `zht` 歸為 `zh-TW`；
  - 其他 `zh` 開頭歸為 `zh-CN`；
  - `ja` 或 `jp` 歸為 `ja`；
  - 其他未識別標識回退至 `en`。
- **Inno Setup 安裝器**：內嵌 `installer/ChineseSimplified.isl`，解決 Windows 安裝階段的語言本地化，無需依賴主機系統或 CI Runner 預裝中文語言包。

## 進程託管與退出安全邊界

- **Windows 平台**：使用 Windows Job Object（`JOB_OBJECT_LIMIT_BREAKAWAY_OK` 與 `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`）管理後端。模擬器啟動時聲明 Breakaway 機制，使得啟動器退出時能夠徹底回收 Python 後端和 worker，同時保持模擬器獨立運行。
- **Unix 平台**：通過獨立進程組（Process Group）與信號機制回收子進程。
- **控制台無窗口化**：Windows 平台統一附加 `CREATE_NO_WINDOW` 標記，徹底杜絕子進程彈黑窗。

## 托盤與上下文選單實作

| 模組 | 原始碼入口 | 職責 |
| --- | --- | --- |
| 托盤事件 | `src/main.rs`、`src/launcher.rs` | 註冊托盤事件、平台分支、選單動作與 IPC 命令 |
| Windows 托盤彈窗 | `src/tray_menu.rs`、`frontend/src/TrayMenu.tsx` | 預先建立透明 WebView 視窗，按 DPI 和指標位置定位；提供首頁、顯示 / 隱藏、退出 |
| 頁面右鍵選單 | `frontend/src/ContextMenu.tsx`、`frontend/src/contextMenu.module.css` | 取代 WebView 預設選單，按選取文字與輸入焦點啟用重新整理、複製、貼上、全選 |
| 權限與測試 | `capabilities/tray-menu.json`、`frontend/src/menus.test.tsx`、`frontend/src/focusRing.css` | 限制托盤視窗 IPC 權限、覆蓋選單互動並顯示鍵盤焦點 |

Windows 使用自繪 Fluent 托盤彈窗；macOS 保留原生 NSMenu；Linux 目前不會建立系統托盤圖示。Windows 彈窗會在啟動時預先建立並隱藏，右鍵後貼近指標顯示；失焦、Esc 或短時間內再次右鍵會收起。兩個平台共用 `handle_tray_menu_action`。

頁面內右鍵選單會取代 WebView2 / WKWebView 的瀏覽器預設選單。只有存在文字選取時才啟用複製；貼上和全選要求輸入框或文字區域取得焦點。點擊選單外、視窗失焦或按 Esc 會關閉。

目前 main 分支的功能狀態與使用方式見[更新、修復與移除](/zh-HK/launcher/user/maintenance)。

## 驗證與測試命令

```bash
npm --prefix frontend test
npm --prefix frontend run build
cargo check --locked --all-targets
cargo test --locked --all-targets
```

詳見[構建與發佈](/zh-HK/launcher/developer/build-release)、[後端進程生命週期](/zh-HK/launcher/developer/backend-lifecycle)與[更新鏈路與鏡像](/zh-HK/launcher/developer/update)。