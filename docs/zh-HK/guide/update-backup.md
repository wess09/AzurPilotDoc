---
title: 更新、備份與遷移
description: 核心程序、啟動器與 Android 宿主的更新通道，配置備份位置、恢復方法與換機遷移步驟。
updated: 2026-10-20
---

# 更新、備份與遷移

三個組件的版本線互相獨立。理解這一點，才能判斷「點了更新之後到底更新了什麼」。

## <DocIcon name="refresh" /> 誰在更新什麼

| 組件 | 更新方式 | 更新內容 | 需要重新啟動什麼 |
| --- | --- | --- | --- |
| 核心程序 | WebUI 更新頁（`updater.*`） | `git pull` 源碼 + 依賴同步 | 停止並重新啟動實例 worker |
| 啟動器 | 啟動器自更新（mTLS + 鏡像） | 啟動器二進制本身 | 啟動器 |
| Android App | 系統安裝器覆蓋安裝 | 宿主 Kotlin/C++ 代碼 | App |
| Android Runtime | 宿主內 Runtime 更新 | rootfs 鏡像（含核心源碼與前端 dist） | Runtime |
| Android 核心腳本 | 熱更新通道 | 上游源碼 + 本地構建前端 | Runtime |

::: warning 更新前先備份
任何更新都可能引入不兼容的配置變更。更新前把 `config/` 整個目錄複製一份，比事後回滾省事得多。
:::

## <DocIcon name="zap" /> 核心程序

WebUI 的「更新」頁會列出上游提交、當前提交與差異。流程是：

1. <DocIcon name="search" /> 檢查更新（`updater.status` / `updater.commits`）。
2. <DocIcon name="download" /> 拉取（`updater.fetch`）。
3. <DocIcon name="zap" /> 應用（`updater.apply`）：先停止所有 worker，再切換代碼並同步依賴，最後按需重新啟動。

更新頁支援取消（`updater.cancel`）。如果你在容器裏運行，也可以宿主機手動 `git pull` + `uv sync --frozen` 後重新啟動容器。

### 更新後配置不兼容

配置由 `module/config/config_updater.py` 生成新模板，舊配置在加載時遷移。遇到字段缺失：

1. <DocIcon name="search" /> 對比 `config/<实例>.json` 與 `config/template.json`。
2. <DocIcon name="ban" /> 不要手改 `args.json`、`menu.json`、`config_generated.py`——它們是生成產物。
3. <DocIcon name="refresh" /> 遷移失敗時用備份回滾，再單獨疑難排解是哪個任務組出錯。

## <DocIcon name="rocket" /> 啟動器

啟動器啟動時會先更新核心倉庫（`git pull`，失敗重試至多 20 次），然後 `uv sync --frozen`。啟動器**自身**的更新走獨立通道：

- <DocIcon name="cloud" /> 預設清單地址：`https://launcher-api.azurpilot.com/updata/stable.json`。
- <DocIcon name="file-pen" /> 可用 `LAUNCHER_UPDATE_URL` 覆蓋，供測試或私有部署使用。
- <DocIcon name="lock" /> 載荷通過 mTLS 校驗，並支援多鏡像回退。

啟動參數 `--skip-update` 可以跳過倉庫更新，用於斷網或疑難排解「更新後啟動失敗」。

## <DocIcon name="smartphone" /> Android

Android 有三條獨立通道，見[更新、備份與疑難排解](/zh-HK/android/user/maintenance)。簡要區分：

- <DocIcon name="smartphone" /> **只改宿主代碼** → 下載輕量增量 APK 覆蓋安裝，Runtime 與配置保留。
- <DocIcon name="package" /> **改了 Runtime（依賴、Python 版本、前端構建方式）** → 更新 rootfs 鏡像，停服務後替換，保留 `/config`。
- <DocIcon name="refresh" /> **只改上游腳本** → 熱更新：比較 `uv.lock`，依賴未變則拉源碼並在本地構建前端；失敗自動回滾。

## <DocIcon name="drive" /> 備份

### 自動備份

核心程序預設開啟每日備份（`Alas.Backup.Enable`，保留 7 天）。備份寫入項目根目錄：

```text
AzurPilot_Data_Backup/
└── 2026-10-20/
    ├── azurpilot.db
    ├── ap.json
    ├── ap-2.json
    └── backup_info.json
```

備份包含 SQLite 總庫與全部實例配置。資料庫通過 SQLite 備份介面匯出，包含已提交的 WAL。

| 配置項 | 預設 | 説明 |
| --- | --- | --- |
| `Alas.Backup.Enable` | 開 | 每日首次進入調度循環時執行 |
| `Alas.Backup.KeepDays` | 7 | 超過天數的目錄會被清理 |

### 手動備份什麼

| 路徑 | 內容 | 是否必須 |
| --- | --- | --- |
| `config/*.json` | 實例配置（含任務開關與下次運行時間） | 必須 |
| `config/deploy.yaml` | 後端監聽、密碼、語言 | 建議 |
| `config/remote-access.json` | 遠程訪問設備身份與配對摘要 | 需要保留固定入口時 |
| `azurpilot.db`（數據目錄） | 統計、掉落、資源歷史 | 需要歷史數據時 |
| `log/` | 運行日誌與錯誤現場 | 疑難排解時 |
| `AzurPilot_Data_Backup/` | 自動備份 | 可選 |

::: danger 不要備份進 Git
`config/remote-access.json`、`config/deploy.yaml`、`password.txt` 含憑據。把它們提交到公開倉庫等於公開你的實例入口。
:::

## <DocIcon name="laptop" /> 遷移到另一台機器

<Steps>
<Step title="在舊機器上停止調度">

先停止所有實例，避免遷移過程中配置還在被寫入。

</Step>
<Step title="複製 config 目錄">

連同 `deploy.yaml` 一起復制。新機器的路徑可以不同，配置裏不寫絕對路徑。

</Step>
<Step title="在新機器上安裝">

裝啟動器或源碼環境，先啟動一次讓 `.venv` 與依賴就緒，然後關閉。

</Step>
<Step title="覆蓋配置並啟動">

把 `config/` 覆蓋進新項目根目錄，啟動 WebUI。檢查實例列表是否完整、任務開關是否保留。

</Step>
<Step title="重新處理設備相關項">

模擬器 Serial、ADB 路徑、截圖方案可能需要按新機器調整。帳號保險庫綁定設備密鑰，換機後需要重新解鎖或錄入。

</Step>
</Steps>

## <DocIcon name="refresh" /> 回滾

- <DocIcon name="refresh" /> **核心程序**：`git log` 找到上一個可用提交，`git checkout <sha>`，再 `uv sync --frozen`。不要用 `git reset --hard` 清掉本地修改。
- <DocIcon name="drive" /> **配置**：從 `AzurPilot_Data_Backup/<日期>/` 複製回 `config/`。
- <DocIcon name="smartphone" /> **Android Runtime**：宿主保留上一版 rootfs 目錄，熱更新失敗會自動回滾；手動回滾見 Android 維護頁。
- <DocIcon name="medal" /> **啟動器**：重新下載上一版壓縮包，覆蓋可執行檔案即可；`.venv` 與配置不受影響。
