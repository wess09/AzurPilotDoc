---
title: 安裝啟動器
description: Windows、macOS、Linux 的下載、解壓縮、權限與執行步驟，以及 WebView 依賴和首次啟動檢查。
updated: 2026-10-20
---

# 安裝啟動器

啟動器是綠色壓縮包，沒有安裝嚮導。真正的「安裝」發生在首次啟動：它會在目錄裡建立 `.venv`、下載 Python、拉取核心倉庫。

## <DocIcon name="download" /> 下載

| 渠道 | 地址 |
| --- | --- |
| GitHub Releases | `github.com/wess09/AzurPilotLauncher/releases/latest` |
| 官網下載頁 | `azurpilot.com/download.html` |
| CNB | 國內鏡像 |

選擇**對應系統與 CPU 架構**的包：

| 檔案名稱特徵 | 適用 |
| --- | --- |
| `windows-x64` | 絕大多數 Windows |
| `windows-arm64` | Windows on ARM |
| `macos` | Apple Silicon / Intel（按發佈說明） |
| `linux-x64` / `linux-arm64` | 對應架構 |
| 帶 `-cn` | 國內鏡像版部署配置 |

::: tip 國際版與 CN 版的區別
兩者的啟動器二進制相同，區別在部署配置裡的下載源：`-cn` 使用 `git://git.pull/AzurPilot` 與國內 PyPI / Python 鏡像。網路環境不同就選不同版本，之後也可以手動改配置。
:::

## <DocIcon name="folder" /> 解壓縮位置

解壓縮到一個**固定、可寫、路徑簡單**的目錄：

- ✅ `D:\AzurPilot\`
- ✅ `~/Applications/AzurPilot/`
- ❌ `C:\Program Files\`（需要管理員寫權限）
- ❌ 中文路徑 + 特殊符號混用（部分工具鏈兼容性差）
- ❌ 同步盤（OneDrive / iCloud 會鎖定 `.venv` 裡的檔案）

::: danger 不要放在臨時目錄
啟動器把核心倉庫、`.venv`、配置、日誌全部放在自己的目錄下。放臨時目錄會被清理工具刪掉，等於丟配置。
:::

## <DocIcon name="monitor" /> Windows

<Steps>
<Step title="解壓縮">

用 7-Zip 或系統自帶解壓縮。不要直接在壓縮包裡雙擊執行。

</Step>
<Step title="允許管理員權限">

`alas-launcher.exe` 的 manifest 聲明瞭 `requireAdministrator`，啟動會彈 UAC。這是為了安裝 ADB 與寫入系統目錄。

</Step>
<Step title="處理 SmartScreen">

未簽名的可執行檔案可能被 SmartScreen 攔截。選擇「更多資訊 → 仍要執行」。

</Step>
<Step title="確認 WebView2">

Windows 11 已內置。Windows 10 若提示缺失，安裝 [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) 後重試。

</Step>
</Steps>

## <DocIcon name="laptop" /> macOS

```bash
# 解压后放到 Applications
xattr -dr com.apple.quarantine /Applications/AzurPilot.app
open /Applications/AzurPilot.app
```

程序未經 Apple 開發者簽名，直接雙擊會被 Gatekeeper 攔截。`xattr` 命令解除安裝隔離標記後再打開。

::: warning 不要用「右鍵 → 打開」反覆嘗試
部分 macOS 版本會記住拒絕狀態。用 `xattr` 清一次最省事。
:::

## <DocIcon name="wrench" /> Linux

```bash
tar -xf azurpilot-launcher-linux-x64.tar.xz
cd AzurPilot
chmod +x alas-launcher
./alas-launcher
```

依賴：

| 依賴 | 說明 |
| --- | --- |
| `libwebkit2gtk-4.1` | WebView |
| 較新 glibc | CI 使用 Ubuntu 22.04 構建 |
| `libgtk-3` | 視窗 |

Debian / Ubuntu：

```bash
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0
```

如果發行版太舊導致啟動器無法執行，核心程式仍可以用命令行方式執行：進入目錄後 `uv run python gui.py`（需要系統 Python 3.14 與 uv）。

## <DocIcon name="circle-check" /> 首次啟動檢查

首次啟動會執行完整的環境自舉，耗時取決於網路。判斷成功的標準：

| 檢查 | 期望 |
| --- | --- |
| 啟動畫面 | 依次顯示建立 `.venv`、下載 Python、更新倉庫、同步依賴 |
| 視窗 | 打開後直接進入 WebUI，無需登入 |
| 連接埠 | 預設 `22267` |
| 目錄 | 出現 `.venv/`、`config/`、`frontend/`、`log/` |

## <DocIcon name="file-pen" /> 命令行參數

| 參數 | 作用 |
| --- | --- |
| `--lang <zh-CN\|zh-TW\|ja\|en>` | 強制介面語言 |
| `--skip-update` | 跳過倉庫更新（斷網或疑難排解更新問題時） |
| `--preview-crash` | 預覽錯誤頁 |
| `--start-minimized` | 啟動後最小化到系統匣（開機自啟使用） |

## <DocIcon name="circle-off" /> 解除安裝

刪除整個目錄即可。啟動器不寫註冊表（除開機自啟項），也不在系統目錄留下執行庫。

**刪除前先備份 `config/`**，否則實例配置、統計與帳號保險庫全部丟失。

```text
需要保留：config/、AzurPilot_Data_Backup/
可以删除：.venv/、frontend/、log/、cache/
```

## <DocIcon name="message" /> 常見安裝問題

| 現象 | 原因 |
| --- | --- |
| 雙擊沒反應 | 未通過 UAC，或被安全軟體攔截 |
| 提示缺少 WebView2 | 未安裝執行時 |
| macOS「應用已損壞」 | 隔離標記未解除安裝 |
| Linux 報 `libwebkit2gtk` 缺失 | 未安裝 4.1 版本 |
| 解壓縮後路徑含空格導致異常 | 換到無空格路徑 |
| 啟動器反覆重新啟動 | 環境初始化失敗，見[首次啟動](/zh-TW/launcher/user/first-run#初始化失敗) |
