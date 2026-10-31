---
title: 更新鏈路與鏡像
description: 啟動器的三層更新機制、Python 獨立運行時多鏡像輪詢、uv 依賴鎖定同步、Stable／Canary 通道與載荷安全校驗。
updated: 2026-10-31
---

# 更新鏈路與鏡像

啟動器的更新體系由**三個彼此獨立、分層解耦的環節**組成：
1. **運行引導組件與獨立環境準備**；
2. **核心代碼拉取與依賴精確同步**；
3. **啟動器二進制自更新與通道切換**。

不能將這三者混為一談，也不應將所有更新過程簡單概括為單一的命令行調用。

## 運行引導組件與獨立 Python 準備

啟動器在首次運行或執行環境重構時，負責準備外部運行時工具鏈與獨立 Python：

- **外部工具組件**：從公開清單 `stable.json` 的 `runtime` 部分（schema 2）拉取對應平台的 Git、ADB 獨立壓縮包，解壓縮部署至工具目錄並建立校驗哈希，不污染宿主全局環境。
- **獨立 Python 3.14.3 管理**：
  - 啟動器內嵌 uv，自動在 `.venv/python` 目錄下安裝獨立管理的 CPython 3.14.3（`uv python install --managed-python 3.14.3`）。
  - **多鏡像輪詢機制**：內置預設輪詢鏡像列表：
    1. `https://registry.npmmirror.com/-/binary/python-build-standalone/`（首選國內鏡像）
    2. `https://mirror.nju.edu.cn/github-release/astral-sh/python-build-standalone/`（備用高校鏡像）
    3. `https://python-standalone.org/mirror/astral-sh/python-build-standalone/`（官方鏡像源）
  - 用戶亦可通過環境變數 `UV_PYTHON_INSTALL_MIRROR` 自定義覆蓋下載源。
  - 下載失敗時自動向用戶展示當前鏡像與回退狀態，避免單點故障導致環境初始化中斷。
- **可重定位虛擬環境**：通過 `uv venv --allow-existing --relocatable --python ... .venv` 建立獨立的虛擬環境。

## 核心程序代碼與依賴同步

在每次啟動或更新核心時，啟動器調度部署邏輯：

- **核心代碼更新**：通過 `git pull` 更新核心倉庫代碼，內置失敗重試機制（`MAX_SYNC_RETRIES = 20`，每次間隔 1 秒），有效應對偶發網絡丟包或連接抖動。
- **依賴精確同步**：
  - 啟動器調用內置 uv 執行同步：
    ```bash
    uv sync --frozen --no-dev --no-install-project
    ```
  - `--frozen` 嚴格遵守核心倉庫的 `uv.lock` 依賴鎖，防止拉取未經驗證的次級新版依賴；
  - `--no-dev` 與 `--no-install-project` 避免在生產環境引入開發測試依賴或將核心自身作為可安裝包安裝。
- **進度監聽與解析**：啟動器實時流式捕獲 uv 的輸出，自動解析 `Resolved`、`Downloading`、`Prepared`、`Installed` 等關鍵字並計算進度百分比，配合 19 條 Tips 輪播展示。

## 啟動器正式版與 Canary 通道

啟動器自身的更新機制與核心程序完全獨立：

- **源碼與發佈版本解耦**：
  - 源碼倉庫設定檔（`Cargo.toml`、`tauri.conf.json`、`Info.plist`）統一設為 `0.0.0` 模板基線；
  - CI 在 Tag 推送或手動觸發時動態替換為真實 SemVer（當前穩定發佈基線為 **3.0.4**）。
- **更新清單公開獲取**：
  - 啟動器從編譯期配置的 `LAUNCHER_UPDATE_URL`（或備用源 `https://ap.launcher-update.nanoda.work/updata/stable.json`）拉取更新清單，清單拉取公開透明，無需 mTLS 憑證。
- **更新通道劃分**：
  - `stable`（正式版，預設）：對應最新已發佈的穩定版本（如 3.0.4）。
  - `canary`（測試構建）：對應快速迭代的測試構建，清單中無可用 Canary 項時不觸發提示。
  - 兩個通道獨立判斷版本，避免同版本號在正式與測試通道間循環升級。
- **更新載荷源與回退策略**：
  - `updateSource` 可在「設定」中配置：`auto`（預設）、`official`、`github`、`cloudflare`。
  - 自動模式在檢測到簡體中文與北京時間環境下優先使用官方鏡像，否則優先 GitHub 或 Cloudflare CDN。
  - 當遭遇網絡異常或 HTTP 429 限流時，按配置順序自動降級並執行指數退避。
- **載荷完整性與 mTLS 安全校驗**：
  - 所有下載載荷必須通過 SHA-256 哈希校驗；
  - 若配置了非 GitHub 官方源的更新請求，客戶端在請求更新載荷時可附帶編譯期嵌入的 mTLS 證書完成雙向認證。
  - 更新載荷下載或校驗失敗時，啟動器會完整保留當前運行環境，絕不進行半途替換。

## 定時檢查與錯誤回滾

- 啟動器在後台約每 10 分鐘執行一次非阻塞的輕量更新檢查，發現新版本時在介面呈現更新提示，且針對同一版本不會重複彈出騷擾。
- 若更新替換過程中被用戶點擊取消（通過 `cancel_requested`），啟動器安全終止下載或解壓縮子執行緒，並清理臨時下載檔案。

詳見[構建與發佈](/zh-HK/launcher/developer/build-release)、[Tauri 與 Rust 架構](/zh-HK/launcher/developer/architecture)與[更新、修復與移除](/zh-HK/launcher/user/maintenance)。
