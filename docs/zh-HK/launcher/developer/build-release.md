---
title: 構建與發佈
description: Launcher 3.0.4 與 0.0.0 版本機制、macOS/Linux/Windows 跨平台 CI 打包矩陣、Inno Setup 安裝器與 Release 歸集發佈鏈路。
updated: 2026-10-31
---

# 構建與發佈

啟動器倉庫採用 **Tauri 2 + Rust** 架構，並由 GitHub Actions 實現跨平台持續集成與發佈自動化。本文檔詳述版本管理機制（3.0.4 與 0.0.0）、跨平台打包流程、Inno Setup 安裝器配置與 Release 發佈流程。

## 版本基線機制：3.0.4 與 0.0.0

啟動器倉庫對版本號管理採用「源碼模板佔位 + 構建期動態注入」的方案：

1. **源碼樹統一基線為 `0.0.0`**：
   - 倉庫內的 `Cargo.toml`（`version = "0.0.0"`）、`tauri.conf.json`（`"version": "0.0.0"`）以及 `Info.plist`（`CFBundleShortVersionString` 與 `CFBundleVersion` 為 `0.0.0`）統一設為基準佔位符。
   - 這避免了在日常開發中因手動修改版本號導致跨檔案漂移或 Git 提交衝突。
2. **CI 動態注入版本（`Resolve release version`）**：
   - 當推送 Git Tag（如 `v3.0.4`）或通過 `workflow_dispatch` 手動輸入版本時，CI 工作流自動解析規範的 SemVer（移除前導 `v`）。
   - 工作流自動重寫 `Cargo.toml`、`tauri.conf.json` 與 `Info.plist`，將目標版本寫入設定檔。
   - 同時將版本注入環境變數 `RELEASE_VERSION`，並作為 `/DAppVersion` 參數傳遞給 Inno Setup 編譯器。
3. **當前穩定版基線**：
   - 當前官方發佈的穩定版本基線為 **3.0.4**。源碼樹中的 `0.0.0` 不影響發佈版本的語義，開發者在閲讀源碼設定檔時應將其理解為 CI 驅動的動態版本佔位。

## 本地編譯與驗證

在提交代碼前，應在本地環境執行語法檢查與自動化測試：

```bash
# 启动器 Rust 代码检查与测试
cargo check --locked --all-targets
cargo test --locked --all-targets

# 生产级发布编译（启用 LTO 与 strip）
cargo build --verbose --release
```

Windows 平台本地測試 Inno Setup 安裝包編譯：

```powershell
# 编译 x64 安装包
ISCC.exe install.iss /DTargetArch=x64 /DAppVersion=3.0.4

# 编译 ARM64 安装包
ISCC.exe install.iss /DTargetArch=arm64 /DAppVersion=3.0.4
```

## 跨平台 CI 打包工作流 (`package.yml`)

`.github/workflows/package.yml` 實現了 Linux、macOS、Windows x64 與 Windows ARM64 四大構建目標的全自動化打包：

### 1. 構建矩陣與依賴環境

```yaml
jobs:
  package:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-22.04, macos-latest, windows-latest, windows-11-arm]
```

- **Ubuntu 22.04**：安裝 `libwebkit2gtk-4.1-dev`、`libappindicator3-dev`、`librsvg2-dev`、`patchelf` 以及 `rdfind`。
- **macOS**：通過 Homebrew 安裝 `rdfind`。
- **Windows**：通過 Chocolatey 安裝 `innosetup`（自動適配 Inno Setup 6 / 7 編譯器）。
- **前端構建**：Node 22 環境下單次構建 `frontend/dist`，構建後自動清理 `node_modules` 保持乾淨環境。
- **獨立 Python 準備**：
  - 使用 `setup-uv` 安裝最新版 uv 並暴露可執行檔案路徑。
  - 運行 `uv python install --install-dir .venv/python --no-bin --managed-python 3.14.3`。
  - 建立可重定位虛擬環境 `uv venv --allow-existing --relocatable --python ... .venv`。
  - 複製 uv 二進制至虛擬環境的 `bin/uv` 或 `Scripts/uv.exe`。

### 2. macOS 打包流程

macOS 作業構建出標準的 macOS 應用程序包（App Bundle）：

1. 組織 App 目錄結構：
   - `NTEP Launcher.app/Contents/MacOS/ntep-launcher`（二進制可執行檔案）
   - `NTEP Launcher.app/Contents/Resources/icon.icns`（應用圖標）
   - `NTEP Launcher.app/Contents/Info.plist`（動態注入版本後的屬性表）
   - `NTEP Launcher.app/Contents/NTEPilot`（嵌入的完整後端源碼與獨立 Python 3.14.3 `.venv` 環境）
2. **硬連結去重**：執行 `rdfind -minsize 128 -makehardlinks true "NTEP Launcher.app"`，將 App 內部重複檔案轉換為硬連結，顯著降低包體積。
3. **極限壓縮歸檔**：使用 Python `tarfile` 配合 `lzma.PRESET_EXTREME`（preset 9）極限壓縮，生成 `NTEP-Launcher-macOS-$(uname -m).tar.xz`。

### 3. Linux 打包流程

Linux 作業構建出開箱即用的 Linux 歸檔包：

1. 組織工作區目錄 `package-root/NTEPilot`，包含後端代碼、`ntep-launcher` 二進制與獨立的 `.venv`（包含 Python 3.14.3 與 `bin/uv`）。
2. 執行 `rdfind` 硬連結去重優化。
3. 使用 Python `tarfile` 配合 `lzma.PRESET_EXTREME` 極限壓縮，生成 `NTEP-Launcher-Linux-$(uname -m).tar.xz`。

### 4. Windows 打包流程與 Inno Setup 腳本

Windows 作業支援 `x64`（兼容 x64 與 WoA）與 `arm64`（原生 ARM64）雙架構：

1. 使用 `robocopy` 準備後端工作區，安裝獨立的 Python 3.14.3 `.venv`，複製 `ntep-launcher.exe`。
2. 動態搜尋系統中的 Inno Setup 編譯器路徑（支援 Inno Setup 6 / 7 以及 32/64 位安裝路徑）：
   ```powershell
   & $iscc install.iss "/DTargetArch=$installerArch" "/DAppVersion=$env:RELEASE_VERSION"
   ```
3. **Inno Setup 特性與保護機制 (`install.iss`)**：
   - **語言支援**：使用倉庫內嵌的 `installer\ChineseSimplified.isl`，脱離對 Runner 主機系統是否預裝中文語言包的依賴，保證編譯始終成功。
   - **架構限制**：arm64 包限制 `ArchitecturesAllowed=arm64`；x64 包使用 `x64compatible`。
   - **目錄權限**：預設安裝至 `{autopf}\NTEPilot`，安裝程序自動為 `{app}`、`{app}\.venv`、`{app}\log` 賦予普通用戶修改權限（`Permissions: users-modify`），解決無管理員權限運行時的環境自舉與日誌寫入問題。
   - **路徑安全檢測**：`NextButtonClick` 與 `PrepareToInstall` 階段禁止安裝到 Windows 目錄、裸 Program Files 或磁盤根目錄；選擇容器目錄時自動補齊子目錄。
   - **運行前清理**：調用 `taskkill` 強制終止可能殘留的啟動器、`pythonw.exe` 和 `python.exe` 進程，防止安裝中斷。
   - **移除交互保護**：移除時彈出交互對話框，詢問用戶是否保留本地運行環境與配置數據。

## Release 歸集與資產發佈

打包步驟完成後，CI 執行資產歸集：

1. 將生成的平台包放入 `release-assets/`：
   - `NTEP-Launcher-macOS-*.tar.xz`
   - `NTEP-Launcher-Linux-*.tar.xz`
   - `NTEP-Launcher-Windows-x64-Setup.exe`
   - `NTEP-Launcher-Windows-arm64-Setup.exe`
2. 上傳至 GitHub Actions Artifacts。
3. 若觸發事件為 Git Tag 推送，工作流自動通過 `action-gh-release` 將 `release-assets/*` 全部發布至 GitHub Release。

## 發佈檢查清單

- [ ] 驗證 Git Tag 符合 SemVer 規範（如 `v3.0.4`）。
- [ ] 確認工作流中 `Resolve release version` 成功替換各設定檔版本。
- [ ] 檢查 Linux / macOS / Windows x64 / Windows ARM64 四項作業均構建成功。
- [ ] 驗證 Windows 安裝程序具備 `installer\ChineseSimplified.isl` 語言支援與目錄權限。
- [ ] 檢查 macOS App Bundle 隔離屬性移除後可正常啟動。
- [ ] 確認發佈的 Release 資產包含各平台壓縮包與安裝程序。

詳見[Tauri 與 Rust 架構](/zh-HK/launcher/developer/architecture)與[更新鏈路與鏡像](/zh-HK/launcher/developer/update)。
