---
title: 更新、備份與疑難排解
description: APK、Runtime 與腳本熱更三條通道的區別，整包與熱更的判定，以及數據備份和常見故障處理。
updated: 2026-10-20
---

# 更新、備份與疑難排解

Android 版有三條獨立的更新通道。分不清它們，就會出現「點了更新但功能沒變」或者「只想換介面卻重下了 1 GB」。

## <DocIcon name="refresh" /> 三條通道

| 通道 | 更新什麼 | 觸發 | 保留數據 |
| --- | --- | --- | --- |
| App（APK） | Kotlin 宿主、原生橋、UI | 應用內檢查 / 覆蓋安裝 | 是 |
| Runtime（整包） | Ubuntu rootfs、Python、依賴、OCR | 設定頁整包更新 | 是（config / log 保留） |
| 腳本熱更 | 上游 AzurPilot 原始碼 + 前端 dist | 自動（空閒時）/ 手動 | 是 |

### <DocIcon name="smartphone" /> App 更新

- 輕量增量 APK 雙 ABI、無 rootfs，下載量小。
- 下載完成後校驗大小與 SHA-256，再交給系統安裝器。
- **簽名必須一致**：debug 與 release 不能互相覆蓋，否則 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`，只能解除安裝重裝（數據全丟）。
- 版本碼回落時用 `adb install -r -d`。

### <DocIcon name="package" /> Runtime 整包更新

判定依據是 `BUILD_MANIFEST.rootfs_version`：

```text
<上游提交前 12 位>-<构建输入哈希前 10 位>
```

- 哈希相同、提交不同 → 設定 `commitOnly`，優先熱更。
- 哈希不同 → 必須整包重部署（Python、系統庫、overlay、依賴變了）。

整包更新會保留 `config/`（含 SQLite、實例目錄）、`password.txt` 與 `log/`；模板與部署種子用新鏡像的版本。

### <DocIcon name="zap" /> 腳本熱更

熱更只換原始碼與前端，不換 Python 與系統庫。流程：

1. 檢查目標提交（預設跟隨構建清單記錄的分支）。
2. 淺拉確切提交到 `/opt/azurpilot-update/source`（優先 CNB，失敗回退 GitHub 鏡像）。
3. **比較 `uv.lock`**：不同則返回 `requiresRuntimeUpdate=true`，不熱更，交給整包。
4. 在候選目錄 `npm ci` + `npm run build`（超時 600 秒）。
5. 構建成功後記錄事務日誌，安全停止實例。
6. 備份舊 dist → 切換原始碼 → 安裝新 dist → 原子更新清單 → 重載並恢復實例。
7. 任一步失敗，恢復舊原始碼、dist 與清單。

::: warning 熱更不會裝依賴
依賴安裝被刻意關閉，避免未經構建與 OCR 驗證的環境進入正式版本。`uv.lock` 一變，就必須整包。
:::

自動熱更只在排程器與工具空閒時應用；手動更新會恢復原有的實例執行狀態。熱更與整包共用同一把流水線鎖。

## <DocIcon name="compass" /> 什麼時候該用哪種

| 你的情況 | 應該 |
| --- | --- |
| 只是上游腳本更新（無依賴變化） | 熱更 |
| 上游改了依賴 / Python 版本 | 整包 |
| 宿主介面或原生橋變化 | APK |
| 換手機、重裝 | 完整版 APK + 恢復配置 |
| 更新後啟動崩潰 | 看事務日誌，回滾；仍失敗則整包 |

## <DocIcon name="drive" /> 備份

| 內容 | 位置 | 說明 |
| --- | --- | --- |
| 實例配置 | Runtime `config/*.json` | 最重要 |
| 部署配置 | `config/deploy.yaml` | 含密碼，勿外傳 |
| 統計資料庫 | `config/azurpilot.db` | 歷史數據 |
| 日誌 | `log/` 與 `proot/session.log` | 疑難排解用，7 天輪轉 |
| 遠端身份 | `config/remote-access.json` | 需要保留固定入口時 |

匯出方式：

1. 設定 → 日誌 → 匯出（zip）。
2. 或 `adb pull /sdcard/Android/data/com.azurpilot.ghio/files/`（部分檔案需 root）。

::: danger 解除安裝即清空
解除安裝應用會刪除 Runtime、配置、統計與日誌，沒有云端副本。升級前先匯出。
:::

## <DocIcon name="wrench" /> 疑難排解

### <DocIcon name="circle-alert" /> Runtime 起不來

| 現象 | 檢查 |
| --- | --- |
| 狀態 `NotInstalled` | 是否點了「下載 Runtime」 |
| 狀態 `LowDisk` | 可用空間是否 ≥ 2 GB |
| 狀態 `NotBundled` | 是否裝了輕量包但 Release 無本架構 |
| `Failed` | 展開 `reason`；換下載源重試 |
| WebUI 90 秒未就緒 | 首次啟動重建字節碼，屬預期；等待 |

### <DocIcon name="circle-alert" /> 啟動後閃退

- 架構不符（x86 包裝到 ARM 機）。
- 外部存儲未掛載（應用會快速失敗）。
- 簽名衝突導致實際沒裝上。

### <DocIcon name="lock" /> 權限被系統回收

廠商 ROM 會在後臺清理權限：

- 懸浮窗權限被撤銷 → 浮窗消失。
- 電池最佳化白名單被重置 → 息屏後處理程序被殺。
- 調試授權被撤銷 → 特權服務失效，需重新啟用。

處理：重新授權，並把應用加入自啟動/後臺白名單。

### <DocIcon name="circle-alert" /> 任務中斷

| 線索 | 可能原因 |
| --- | --- |
| 日誌突然截斷，無異常棧 | 處理程序被系統殺死 |
| `EmulatorNotRunningError` | 虛擬螢幕或特權服務失效 |
| `ScriptError` 連續 3 次 | 程式碼缺陷，需更新 |
| 熱更後啟動崩潰 | 事務回滾失敗，查 `config/android-update-transaction.json` |
| 構建前端超時 | 設備性能不足或網路差，保持舊版重試 |

### <DocIcon name="clipboard" /> 收集診斷資訊

```bash
# 应用日志
adb logcat -v time --pid=$(adb shell pidof com.azurpilot.ghio)

# Runtime 会话
adb shell tail -n 200 /sdcard/Android/data/com.azurpilot.ghio/files/log/proot/session.log

# 转发 WebUI 端口
adb forward tcp:25548 tcp:25548
```

Windows 可用倉庫的 `tools/watch-android-logs.ps1`，預設跟蹤 `com.azurpilot.ghio`。

提 Issue 時附：設備型號、Android 版本、架構、Runtime 版本、操作步驟、日誌片段。**不要附 `deploy.yaml`、`password.txt`、`remote-access.json`。**
