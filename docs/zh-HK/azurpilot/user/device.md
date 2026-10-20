---
title: 連接模擬器與 ADB
description: 配置模擬器 Serial、遊戲伺服器、截圖與控制方案，以及自動重新啟動、SSH 遠程管理和性能測試。
updated: 2026-10-20
---

# 連接模擬器與 ADB

設備層是核心程序與遊戲之間唯一的 I/O 通道。它只做四件事：連上 ADB、拿到截圖、注入點擊、管理遊戲應用。理解這四件事，就能定位絕大多數「連不上 / 識別錯 / 點不準」的問題。

## <DocIcon name="plug" /> 連接鏈路

```text
gui.py / alas.py
   └── Device
        ├── Connection（adb 路径、serial、端口转发）
        ├── Screenshot（按配置分发到具体后端）
        ├── Control（点击 / 滑动 / 拖拽）
        └── Platform（模拟器发现与启停）
```

`Device` 在首次構造時會自動啟動模擬器（最多 4 次）、跑一次簡化基準測試，並預熱控制後端。調度器裏的 `Device` 則以 `auto_start_emulator=False` 建立——**模擬器該不該重新啟動由調度器決定，不由設備層決定**。

## <DocIcon name="clipboard" /> 必填項

| 配置項 | 字段 | 説明 |
| --- | --- | --- |
| 模擬器 Serial | `Emulator.Serial` | ADB 地址或 `auto` |
| 遊戲伺服器 | `Emulator.PackageName` | 遊戲包名，預設 `auto` |
| 截圖方案 | `Emulator.ScreenshotMethod` | 預設 `auto` |
| 控制方案 | `Emulator.ControlMethod` | 推薦 `MaaTouch` |
| 遊戲內伺服器 | `Emulator.ServerName` | 用於維護檢測，可禁用 |

### <DocIcon name="smartphone" /> Serial 怎麼填

| 場景 | 填法 |
| --- | --- |
| 只有一台模擬器 | `auto` |
| 多開，或同時開了多個模擬器 | 明確的 `host:port` |
| MuMu 12 | `127.0.0.1:16384`（多開依次遞增） |
| 雷電 | `emulator-5554` 或 `127.0.0.1:5555` |
| 藍疊 Hyper-V | `bluestacks5-hyperv`，多開加 `-1`、`-2` |

查詢真實 Serial：在模擬器安裝目錄找到 `adb.exe`，執行 `adb devices`。狀態必須是 `device`；`offline` 表示 ADB 版本不匹配或連接卡死，`unauthorized` 表示設備未授權。

### <DocIcon name="cloud" /> 遊戲伺服器

| 伺服器 | 包名 |
| --- | --- |
| 國服 | `com.bilibili.azurlane` |
| 國際服 | `com.YoStarEN.AzurLane` |
| 日服 | `com.YoStarJP.AzurLane` |
| 台服 | `com.hkmanjuu.azurlane.gp` |

渠道服使用各自的包名（華為、小米、OPPO、vivo、應用寶、4399 等），完整列表在配置下拉選單中。模擬器裏裝了多個客戶端時必須手動指定，否則 `auto` 可能選錯。

## <DocIcon name="eye" /> 截圖方案

截圖速度直接決定狀態循環的節奏：通用 `adb exec-out screencap` 一張要 300–500 ms，而模擬器內部通道只要幾十毫秒。

| 方案 | 適用 | 説明 |
| --- | --- | --- |
| `auto` | 預設 | 跑一次基準測試後選最快 |
| `DroidCast_raw` | 通用 | 通常最快，需要模擬器允許安裝配套應用 |
| `ADB_nc` | 通用 | netcat 通道，兼容性好 |
| `ADB` | 兜底 | 最慢但最穩 |
| `uiautomator2` | 兜底 | 與控件操作共用連接 |
| `aScreenCap` / `aScreenCap_nc` | 部分設備 | 需要推送二進制 |
| `nemu_ipc` | MuMu 12 | 走模擬器 IPC，低延遲 |
| `ldopengl` | 雷電 | 直讀 OpenGL 緩衝 |
| `azurpilot_android` | Android 宿主 | 共享記憶體幀通道，必須選這個 |

::: warning nemu_ipc 的觸控限制
`nemu_ipc` 截圖需要搭配對應觸控實現。它在低性能機器上滑動容易丟步、拖拽容易變形，偶發調用掛死會丟點擊。滑動異常時改回 `MaaTouch`。
:::

## <DocIcon name="hand" /> 控制方案

| 方案 | 速度 | 説明 |
| --- | --- | --- |
| `MaaTouch` | 快 | 推薦；兼容新安卓 |
| `minitouch` | 快 | 部分新設備不穩定 |
| `ADB` | 中 | 用 `input tap/swipe`，最兼容 |
| `uiautomator2` | 慢 | 依賴無障礙服務 |
| `Hermit` | 中 | 特定環境使用 |
| `azurpilot_android` | 快 | Android 宿主橋接注入 |

點擊不是「點座標」這麼簡單：設備層會在按鈕區域內隨機取點、滑動使用貝塞爾曲線並加入抖動，以接近人手軌跡。這些是內置行為，沒有配置項。

## <DocIcon name="settings" /> 模擬器管理

「系統設定 → 模擬器設定」裏可以登記模擬器類型、安裝路徑與實例名。登記正確後，調度器才能執行：

- <DocIcon name="clock" /> **計劃重新啟動**：`Alas.EmulatorManagement.ScheduledEmulatorRestart` 開啟後，按 `RestartIntervalHours`（預設 4 小時）在任務間隙重新啟動模擬器。
- <DocIcon name="zap" /> **強制計劃重新啟動**：`ForceScheduledRestart` 允許在任務運行中打斷。
- <DocIcon name="wrench" /> **故障重新啟動**：連續卡死或 ADB 離線達到閾值後自動重新啟動；失敗不放棄，只拉長間隔。
- <DocIcon name="refresh" /> **深度重新啟動**：`DeepRestartAfterFailures`（預設 0，關閉）連續失敗 N 次後對 MuMu 執行深度重新啟動，清理僵死進程。

### <DocIcon name="key" /> SSH 遠程管理

模擬器跑在另一台機器（NAS、伺服器、雲主機）上時，可以開啟 `EnableRemoteSSH`，在重新啟動模擬器前後執行遠程命令：

| 字段 | 用途 |
| --- | --- |
| `RemoteSSHHost` / `Port` / `User` | SSH 連接資訊 |
| `RemoteSSHPublicKey` | 私鑰內容（注意保管） |
| `RemoteStartCommand` / `RemoteStopCommand` | 啟動 / 停止容器或服務的命令 |

這適合「模擬器跑在 Docker 裏」的場景：重新啟動動作實際是 `docker restart <容器>`。

::: danger 私鑰不要外泄
SSH 私鑰以明文儲存在實例配置中。匯出配置或提交 Issue 前，確認已刪除該字段。
:::

## <DocIcon name="shield" /> 伺服器維護檢測

`Emulator.ServerName` 選擇遊戲內伺服器後，調度器會在每輪開始前檢查伺服器狀態：

- <DocIcon name="clock" /> 維護中 → 阻塞等待，不反覆重新啟動遊戲。
- <DocIcon name="refresh" /> 恢復瞬間 → 刷新配置並注入 `Restart`，因為阻塞期間遊戲狀態已經失效。
- <DocIcon name="circle-alert" /> 狀態 API 不可達 → 回退直連遊戲網關；仍不可用則按不可用處理。

不知道自己在哪個服，或狀態 API 經常超時，就選「不使用檢測」。

## <DocIcon name="zap" /> 性能測試

「工具 → 性能測試」會逐一嘗試截圖與控制方案並記錄耗時，結果寫回配置。首次連接時的簡化基準只測常用方案；懷疑某個方案拖慢整體節奏時，跑一次完整測試。

OCR 也有獨立的基準任務（`OcrBenchmark`），用於選擇 CPU / GPU 推理設備。

## <DocIcon name="message" /> 常見問題

| 現象 | 原因 | 處理 |
| --- | --- | --- |
| `adb devices` 為空 | 模擬器未開 ADB 調試 | 在模擬器設定中開啟「ADB 調試」 |
| 設備 `offline` | ADB 版本衝突 | 用模擬器自帶的 adb，或重新啟動 adb server |
| 截圖全黑 | 模擬器使用獨立渲染後端 | 換 `DroidCast_raw` 或 `nemu_ipc` |
| 點擊偏移 | 解像度不是 1280×720 | 調整模擬器解像度與 DPI |
| 頻繁 `GameStuckError` | 幀率過低或動畫被跳過 | 遊戲幀數設 60，關閉加速跳過 |
| 重新啟動模擬器無效 | 未登記安裝路徑 | 填寫 `EmulatorInfo.name` 與 `path` |

更完整的疑難排解順序見[疑難排解 · 核心程序](/zh-HK/troubleshooting/azurpilot)。
