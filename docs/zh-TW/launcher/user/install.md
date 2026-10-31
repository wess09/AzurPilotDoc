---
title: 安裝啟動器
description: Windows、macOS、Linux 的下載、解壓縮、權限與執行步驟，以及 WebView 依賴、安裝器安全策略和首次啟動檢查。
updated: 2026-10-31
---

# 安裝啟動器

Windows 提供安裝嚮導（如 `AzurPilot_Setup_3.0.4.exe`、`NTEP-Launcher-Windows-x64-Setup.exe`）和便攜壓縮包；macOS 與 Linux 提供帶獨立執行時環境的平臺壓縮包（`.tar.xz`）。首次執行或點擊「部署」時，啟動器會確保執行組件與 Python 環境就緒，並取得核心程式碼。

## <DocIcon name="download" /> 下載

| 渠道 | 地址 |
| --- | --- |
| GitHub Releases | `github.com/wess09/AzurPilotLauncher/releases/latest` |
| 官網下載頁 | `azurpilot.com/download.html` |
| 國內鏡像 | Releases 鏡像源或 CNB 歸檔 |

選擇**對應系統與 CPU 架構**的包：

| 檔案名稱特徵 | 適用平臺與說明 |
| --- | --- |
| `Windows-x64-Setup.exe` | 絕大多數 64 位 Windows PC（含兼容執行 x64 的 ARM 設備） |
| `Windows-arm64-Setup.exe` | 原生 Windows 11 on ARM 設備 |
| `macOS-*.tar.xz` | macOS（含 Apple Silicon 與 Intel 架構） |
| `Linux-x86_64.tar.xz` / `Linux-aarch64.tar.xz` | Linux 對應架構 |
| 帶 `-cn` 標記 | 預置國內鏡像源（PyPI / Git 鏡像）配置 |

::: tip 國際版與 CN 版的區別
兩者的啟動器二進制相同，區別在部署配置裡的下載源：`-cn` 使用國內程式碼與依賴鏡像。網路環境不同就選不同版本，啟動後也可以在「設定」中手動切換下載源。
:::

## <DocIcon name="folder" /> 解壓縮與安裝位置

若使用便攜版或解壓縮包，應選擇一個**固定、可寫、路徑簡單**的目錄：

- ✅ `D:\AzurPilot\` 或 `D:\Apps\NTEPilot\`
- ✅ `~/Applications/AzurPilot/` 或 `/Applications/AzurPilot.app`
- ❌ `C:\Program Files\`（手動解壓縮普通用戶無直接寫權限）
- ❌ 中文路徑 + 特殊符號混用（部分底層工具鏈兼容性差）
- ❌ 同步盤（OneDrive / iCloud 會鎖定 `.venv` 內部檔案）

::: danger 不要放在系統臨時目錄
啟動器管理的核心倉庫、`.venv`、配置與日誌均位於工作區中。放在臨時目錄會被系統清理工具誤刪，導致配置丟失。
:::

## <DocIcon name="monitor" /> Windows

Windows 提供圖形化安裝程序與便攜版兩種安裝方式：

<Steps>
<Step title="執行安裝嚮導或解壓縮">

- **安裝嚮導版（推薦）**：執行 Setup 安裝程序。安裝嚮導內置簡體中文語言檔案（`installer/ChineseSimplified.isl`），提供全中文圖形介面。
  - 預設安裝位置為 `{autopf}\NTEPilot`（或 `AzurPilot`）。
  - 安裝程序會自動對安裝目錄及內部 `.venv`、`log` 目錄賦予普通用戶可寫權限（`users-modify`），無需後續手動提權即可正常記錄日誌與執行環境自舉。
  - **安裝路徑安全保護**：嚮導會自動校驗安裝路徑，禁止安裝到 `C:\Windows` 等系統關鍵目錄、裸 Program Files 根目錄或硬碟根目錄（如 `D:\`）。若選擇了上級目錄，嚮導會自動追加子目錄防止誤操作。
  - **處理程序安全清理**：若覆蓋安裝或更新，安裝程序會自動檢查並終止可能佔用的舊版啟動器或 Python 子處理程序（`pythonw.exe` / `python.exe`）。
- **便攜壓縮包**：先用 7-Zip 或系統解壓縮到獨立資料夾，切勿直接在壓縮包內雙擊打開。

</Step>
<Step title="允許管理員權限">

啟動器的 manifest 聲明瞭管理員權限請求（用於設定底層網路與安裝 ADB 工具鏈等），啟動時若彈出 UAC 提權提示，請點擊「允許」。

</Step>
<Step title="處理 SmartScreen">

如果 SmartScreen 攔截下載檔案，先確認檔案來自官方發佈渠道並檢查發行者/簽名資訊；確認無誤後點擊「更多資訊」→「仍要執行」。

</Step>
<Step title="確認 WebView2 執行時">

Windows 11 系統已內置 WebView2。Windows 10 若彈出缺失提示，下載並安裝 [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) 即可。

</Step>
</Steps>

## <DocIcon name="laptop" /> macOS

macOS 發佈包為 `.tar.xz` 格式，解壓縮後得到標準的 `.app` 應用程序包（如 `NTEP Launcher.app` 或 `AzurPilot.app`）。

```bash
# 解压并移动至系统应用程序目录
tar -xf NTEP-Launcher-macOS-$(uname -m).tar.xz
mv "NTEP Launcher.app" /Applications/

# 移除隔离标记
xattr -dr com.apple.quarantine "/Applications/NTEP Launcher.app"
open "/Applications/NTEP Launcher.app"
```

由於社區開源構建未加入 Apple 付費開發者簽名，首次打開前需通過 `xattr` 命令解除安裝 macOS Gatekeeper 的 quarantine 隔離標記，即可正常執行。

::: tip 內部結構與空間最佳化
macOS 應用包內部包含了 `Contents/MacOS` 主程序與 `Contents/NTEPilot`（或 `AzurPilot`）獨立工作區，CI 打包時使用 `rdfind` 硬連結去重與 xz 極限壓縮，減小了應用體積。
:::

## <DocIcon name="wrench" /> Linux

Linux 提供包含獨立 `.venv` 與二進制的 `.tar.xz` 歸檔：

```bash
tar -xf NTEP-Launcher-Linux-x86_64.tar.xz
cd NTEPilot
chmod +x ntep-launcher
./ntep-launcher
```

系統執行依賴：

| 依賴庫 | 說明 |
| --- | --- |
| `libwebkit2gtk-4.1` | Tauri 2 所需的 WebKit 渲染引擎 |
| `libgtk-3` | 視窗系統支援 |
| `libappindicator3` | 系統系統匣與狀態指示支援 |
| 較新 glibc | CI 基於 Ubuntu 22.04 構建 |

在 Debian / Ubuntu 上安裝依賴：

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0 libappindicator3-1
```

如果系統缺少 GUI 環境或庫版本過舊，核心程式也可以直接在控制台啟動：進入工作區後使用 `.venv/bin/python main.py`（或 `gui.py`）。

## <DocIcon name="circle-check" /> 首次啟動檢查

首次啟動時，啟動器會執行初始化檢查與環境自舉。判斷執行正常的標準：

| 檢查項 | 正常表現 |
| --- | --- |
| 啟動畫面 | 實時顯示進度條、狀態副標題與 19 條貼心 Tips 輪播 |
| 依賴安裝 | 依次顯示準備環境、下載/複用 Python 3.14.3、`uv sync` 依賴同步 |
| 主視窗 | 啟動完成後自動載入 WebUI 介面，通過單次登入憑據免密訪問 |
| 預設連接埠 | 預設監聽本機 `22267` |
| 目錄就緒 | 工作區內生成 `.venv/`、`config/`、`log/` 等必要子目錄 |

## <DocIcon name="file-pen" /> 命令行參數

啟動器支援通過命令行傳參覆蓋執行設定與介面語言：

| 參數 | 格式 / 別名 | 作用 |
| --- | --- | --- |
| `--lang` / `--locale` | `--lang <zh-CN\|zh-TW\|ja\|en>`、`/lang <locale>`、`--lang=zh-CN` | 強制指定介面語言，優先級高於系統自動識別 |
| `--skip-update` | `--skip-update` | 跳過核心倉庫與執行組件的聯網更新檢查 |
| `--preview-crash` | `--preview-crash` | 調試用：直接預覽崩潰/錯誤提示介面 |
| `--start-minimized` | `--start-minimized` | 啟動後自動最小化到系統系統匣（開機自啟動時調用） |

## <DocIcon name="circle-off" /> 解除安裝

- **Windows 安裝程序版**：在系統「設定」→「已安裝的應用」中找到啟動器並點擊解除安裝。解除安裝嚮導會自動清理處理程序，並**彈出對話框交互詢問是否保留本地執行環境與配置數據**。選擇「是」將保留數據方便日後重裝；選擇「否」將完全解除安裝安裝目錄。
- **便攜版與 macOS / Linux**：退出啟動器後，先備份 `config/` 與統計數據，然後直接刪除應用資料夾或 `.app` 包。

```text
建议保留：config/、AzurPilot_Data_Backup/
可随应用删除：.venv/、frontend/dist/、log/、cache/
```

## <DocIcon name="message" /> 常見安裝問題

| 現象 | 原因與解決方案 |
| --- | --- |
| 雙擊啟動無反應 | 未通過 UAC 授權，或被第三方殺毒軟體攔截；檢查管理員權限 |
| Windows 提示缺少 WebView2 | 從微軟官網下載安裝 Evergreen 獨立安裝包 |
| macOS 提示「應用已損壞」 | Gatekeeper 攔截未簽名應用，使用 `xattr -dr com.apple.quarantine` 解除安裝屬性 |
| Linux 報 `libwebkit2gtk-4.1` 缺失 | 確認安裝了 `4.1` 版本而非舊版 `4.0` |
| 語言顯示不是中文 | 系統 locale 識別為外語；可通過啟動參數 `--lang zh-CN` 強制指定 |
| 覆蓋安裝提示檔案被佔用 | 安裝程序會自動 `taskkill`，若手動解壓縮請確認已在系統匣完全退出啟動器和 Python 處理程序 |
