---
title: 構建與發佈
description: 啟動器的三平臺構建流程、構建期環境變數、CI 打包矩陣、版本號同步方式與最終發佈產物。
updated: 2026-10-20
---

# 構建與發佈

啟動器的發佈包不是簡單的二進制：它把 Python、uv、git、adb 一起塞進壓縮包，做到「解壓縮即用」。這是 CI 裡最重的一步。

## <DocIcon name="laptop" /> 本地構建

```bash
cargo build              # debug
cargo build --release    # LTO + strip，体积优先
cargo tauri dev          # 开发运行
cargo check --locked --all-targets
cargo test --locked --all-targets
```

### 構建期注入

| 變數 | 作用 | 不設定的後果 |
| --- | --- | --- |
| `ALAS_BOOTSTRAP_UV` | 內嵌 uv 二進制 | 執行時回退 PATH 中的 uv |
| `ALAS_LAUNCHER_MTLS_IDENTITY_PEM_B64` | 自更新證書 | 回退讀 `证书.txt`，缺失則自更新不可用 |
| `LAUNCHER_UPDATE_URL` | 覆蓋更新源 | 用預設 `launcher-api.azurpilot.com` |

本地開發通常只設 `ALAS_BOOTSTRAP_UV`，自更新不測試。

::: danger Windows 本地執行會彈 UAC
manifest 在 `build.rs` 裡內嵌 `requireAdministrator`，這不是可選項。測試處理程序管理相關程式碼時必須在管理員終端。
:::

## <DocIcon name="cloud" /> CI 打包

`.github/workflows/package.yml`，tag push 或手動觸發：

| 階段 | 內容 |
| --- | --- |
| 版本解析 | tag 必須形如 `2.0.6`，不接受 `v2.0.6`；手動觸發可傳版本 |
| 依賴準備 | 按平臺快取 Python、git、adb、uv |
| 構建 | `cargo build --release`（每個 runner 獨立快取） |
| 打包 | `tar.xz`，preset 9 + extreme |
| 發佈 | 上傳 Release，併發布更新清單與載荷 |

矩陣覆蓋三個平臺，產物按 `OS` 與架構命名，國際版與 `-cn` 版各一份：

```text
AP-<OS>-<arch>.tar.xz
AP-CN-<OS>-<arch>.tar.xz
```

Windows 另有 Inno Setup 安裝器（`install.iss`，管理員權限、簡體中文）。

## <DocIcon name="flask" /> 測試工作流

`.github/workflows/test.yml` 在 `main` 推送、PR 和手動觸發時執行：

| 平臺 | 命令 |
| --- | --- |
| Linux / macOS / Windows x64 / ARM64 | `cargo check --locked --all-targets` |
| 同上 | `cargo test --locked --all-targets` |

不需要發佈密鑰，所以 fork 也能跑。

## <DocIcon name="refresh" /> 版本同步

發佈前必須同步三處：

```text
Cargo.toml           version = "2.2.5"
tauri.conf.json      "version": "2.2.5"
CHANGELOG.md         对应条目
```

::: warning 版本不一致的後果
`tauri.conf.json` 的版本會進入安裝包元數據與自更新比較。只改 `Cargo.toml` 會導致「更新後仍提示有新版」或「裝了新版但版本號沒變」。
:::

CI 的 tag 校驗會拒絕 `v` 前綴。打 tag 時用 `2.2.5`，不是 `v2.2.5`。

## <DocIcon name="package" /> 發佈產物

| 產物 | 用途 |
| --- | --- |
| `AP-*.tar.xz` | 國際版，解壓縮即用 |
| `AP-CN-*.tar.xz` | 國內鏡像版 |
| Windows 安裝器 | 可選，帶開始菜單與解除安裝 |
| `stable.json` | 自更新清單 |
| 啟動器載荷 | R2 + CNB Release |

清單代管在 Cloudflare 靜態資源，不跑 Worker；下載入口用 302 指向實際載荷。

## <DocIcon name="circle-check" /> 發佈檢查清單

- [ ] `Cargo.toml` / `tauri.conf.json` / `CHANGELOG.md` 版本一致
- [ ] `cargo check --locked --all-targets` 通過
- [ ] `cargo test --locked --all-targets` 通過（或在管理員終端）
- [ ] 三平臺各啟動一次，確認環境自舉成功
- [ ] Windows 確認 UAC 與系統匣
- [ ] macOS 確認 `xattr` 後的首次打開
- [ ] Linux 確認 `libwebkit2gtk-4.1` 依賴
- [ ] 國際版與 CN 版各驗證一次下載源
- [ ] 自更新：舊版本能檢測到新版本並完成替換
- [ ] 回滾：舊包覆蓋後仍能啟動
- [ ] 退出啟動器後模擬器仍在（處理程序生命週期）
- [ ] 解除安裝後無殘留註冊表項（除自啟）

## <DocIcon name="megaphone" /> 發佈後

| 動作 | 說明 |
| --- | --- |
| 更新 `stable.json` | 自更新才會看到新版本 |
| 上傳 R2 與 CNB | 兩個下載入口都要有 |
| 驗證 302 | `launcher-download` 指向正確載荷 |
| 觀察 Issue | 新版本首日的啟動失敗報告 |

## <DocIcon name="monitor" /> 多平臺注意事項

| 平臺 | 注意 |
| --- | --- |
| Windows | WebView2、UAC、Toast 通知、`CREATE_NO_WINDOW` |
| macOS | 未簽名、WKWebView、無 `additionalBrowserArgs` |
| Linux | glibc 版本、webkit2gtk-4.1、系統匣實現差異 |

三平臺的處理程序/視窗/通知分支都必須在真機或對應 runner 上驗證，不能只靠 `cargo check`。
