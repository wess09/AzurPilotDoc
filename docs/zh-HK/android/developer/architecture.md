---
title: 宿主架構與模組
description: App 殼層、PRoot Runtime、特權服務、原生橋協議、網關與 Docker 上報微服務的分層架構及源碼地圖。
updated: 2026-10-31
---

# 宿主架構與模組

<AndroidStack />

## <DocIcon name="box" /> 分層

| 層 | 進程 / 載體 | 關鍵類與位置 | 職責 |
| --- | --- | --- | --- |
| App 殼層 | 主進程 | `AzurPilotApp`、`MainActivity`、`AppRoot` | 初始化、Compose UI、Runtime 控制 |
| 部署 | 主進程 | `RootfsProvisioner` | 首次部署、更新、校驗、切換 |
| PRoot | 子進程 | `ProotHost` | 拉起會話、崩潰退避、stdin 保活 |
| 網關 | 主進程 | `AzurPilotGateway` | 唯一的 `/api/v1/ws` 訂閲者 |
| 特權與原生橋 | 獨立進程 | `RemoteServiceImpl`、`BridgeServer`、`libbridge.so` | 虛擬熒幕、TCP 22301 線協議、共享記憶體截幀、輸入注入 |
| OCR | `:ocr` | 私有綁定服務 | LiteRT/MNN 推理 API |
| 機型上報服務 | 騰訊雲 Docker 容器 | `server/device-report/` | 接收簽名上報、持久化去重、寫入 GitHub Issue #1 評論 |

## <DocIcon name="rocket" /> 啟動順序

```text
Application.onCreate
  → 仅主进程执行完整初始化（:daemon 只启动最小组件）
  → 加载设置（DataStore）
  → postCreate 按依赖顺序启动常驻服务
      → 日志
      → 权限管理器（探测 ADB / Root / Shizuku）
      → Runtime 控制（若已有 rootfs）
      → 悬浮窗 / 保活 / 前台服务
```

Activity 只管理 splash、edge-to-edge 與保持亮屏。業務狀態來自 ViewModel / repository / 狀態流，不放在 Activity。

## <DocIcon name="settings" /> 依賴注入

Koin 組合根按領域拆分：

| 模組 | 綁定 |
| --- | --- |
| `CoreModule` | 應用級單例、時鐘、調度器 |
| `HostModule` | 宿主服務、設定 |
| `LogModule` | 日誌寫入器 |
| `OverlayModule` | 懸浮窗與熒幕保護 |
| `PrivilegedModule` | 權限管理器、遠程服務 |
| `ProvisionModule` | 部署器 |
| `ProotModule` | PRoot 會話與倉庫 |
| `ViewModelModule` | 頁面 VM |

新增依賴先定義介面或連接埠，再在所屬模組綁定。`AppCoroutineScope` 是進程級監督 scope，**不能**放 UI 生命週期的工作。

## <DocIcon name="map" /> 源碼地圖

### Runtime 與 PRoot

| 職責 | 入口 | 約束 |
| --- | --- | --- |
| 首次部署與升級 | `provision/RootfsProvisioner.kt`、`RuntimeArch.kt` | rootfs 是不可變工件，按 ABI 發佈 |
| PRoot 會話 | `proot/ProotHost.kt` | App 持有 stdin；關閉 stdin = 通知 Runtime 清理進程組 |
| 運行控制 | `proot/AzurPilotRunController.kt` | 啟動/停止狀態機 |
| 網關 | `proot/AzurPilotGateway.kt` | 唯一訂閲者（上游訂閲是整體替換語義） |
| 配置編輯 | `proot/AzurPilotConfigEditor.kt` | 寫入遠端配置 |
| 覆蓋層與種子 | `rootfs/overlays/`、`rootfs/seeds/` | 只處理兼容差異，不覆蓋用戶配置 |

### 特權與原生

| 職責 | 入口 | 約束 |
| --- | --- | --- |
| 後端選擇與授權 | `privileged/PermissionManager.kt` | 統一狀態機，過期連接按 Binder 身份丟棄 |
| Shizuku 連接 | `privileged/RemoteServiceManager.kt` | 外部/內置兩條路徑 |
| root 啟動 | `root/RootServiceStarter.kt` | `app_process` + 一次性 token 回投 |
| 特權 IPC | `remote/RemoteServiceImpl.kt` | 擁有虛擬熒幕、窗口/電源控制 |
| 特權橋線協議 | `remote/internal/BridgeServer.kt` | 監聽 `127.0.0.1:22301`，8 個協議端點 |
| 共享記憶體通道 | `remote/internal/SharedFrameServer.kt` | Unix 抽象套接字 `com.azurpilot.ghio.frames.v1`，Binder 事務 78 |
| JNI 幀與輸入 | `bridge/`、`native/bridge.h` | 幀鎖與輸入操作碼是 ABI |
| root 啟動器 | `native/launcher.c` | 必須輸出 `liblauncher.so` |

### 伺服端與機型上報

| 職責 | 入口 | 約束 |
| --- | --- | --- |
| Go 報告服務 | `server/device-report/main.go` | 無獨立 DB，記憶體目標 48 MiB，正文簽名驗證 |
| Docker 編排 | `server/device-report/deploy/compose.yaml` | 單核調度、96 MiB 硬限、掛載持久化狀態目錄 |
| 上報客戶端 | `app/.../report/DeviceReportClient.kt` | 構造帶時間戳/nonce 的 SHA256withRSA 正文簽名 |

### 設定與介面

| 職責 | 入口 | 約束 |
| --- | --- | --- |
| 應用設定 | `settings/AppSettings.kt` | `@PrefSchema` 生成 snake_case 鍵 |
| 用戶配置 | `config/UserConfigurationStore.kt` | 獨立的 JSON DataStore，不與設定混用 |
| Compose 頁面 | `ui/settings/`、`ui/azurpilot/`、`ui/logs/` | 狀態由 VM/repository 提供 |
| 懸浮窗與熒幕保護 | `overlay/` | 獨立 Window，不能讀 Activity 配置 |
| 小組件 | `widget/` | 用顯式 drawable，不依賴 `?attr` |

### 保活與日誌

| 職責 | 入口 |
| --- | --- |
| 前台服務 | `service/RunForegroundService.kt` |
| 多路徑保活 | `keepalive/KeepAliveManager.kt` |
| 日誌 | `log/`、`constant/AppPaths.kt` |

保活子系統必須可重複啟停，設定開關是最終裁決。接收器和服務可能在無 DI 的路徑上啟動，因此使用受控的進程級管理器入口。

## <DocIcon name="plug" /> 網關協議

Runtime 在 `127.0.0.1:25548` 暴露三類介面：

| 介面 | 鑑權 | 用途 |
| --- | --- | --- |
| `/api/v1/ws` | 會話令牌 | 實例、總覽、配置、日誌、統計 |
| `/android/*` | `X-AzurPilot-Android-Token` | App 專用薄介面 |
| `/healthz` | 無 | 就緒探測 |

連接埠來自 `deploy.yaml` 的 `WebuiPort`，修改後 App 在下次啟動 Runtime 時讀取並一起切換網關、控制與更新介面。

為什麼只能有一個 WebSocket 訂閲者：上游的訂閲是**整體替換**語義，兩個訂閲者會互相清空主題。所有 UI 與業務通過 `AzurPilotRepository` 的狀態流消費。

## <DocIcon name="refresh" /> 兩條更新通道

| 通道 | 內容 | 載體 |
| --- | --- | --- |
| App | 宿主代碼 | 輕量 APK（雙 ABI、無 rootfs） |
| Runtime | rootfs、Python、依賴 | `rootfs-<abi>.tar.xz` |

另有第三條「腳本熱更」，只換上游源碼與前端，要求 `uv.lock` 不變。

## <DocIcon name="cloud" /> 機型上報與 Docker 微服務

為收集 Android 生態下不同機型與定製系統上的實際兼容情況，宿主設計了客戶端機型上報與伺服端 Docker 收集微服務（`server/device-report/`）：

```text
Android 客户端（设置 → 提交机型）
  → 本地只读检测厂商属性与 Google 机型目录
    → SHA256withRSA / PKCS#1 v1.5 私钥对正文签名
      → POST https://afa-api.azurpilot.com/v1/device-reports
        → Cloudflare 边缘（mTLS 终止与限流）
          → Nginx 反代 → 本机 127.0.0.1:18882
            → Docker 容器（afa-api，Go 标准库实现）
              ├── 校验时间戳（±5 分钟）与 32 字符 Hex nonce 防重放
              ├── 校验客户端公钥签名与 8 KiB 正文长度
              ├── 原子比对持久化去重状态 state.json
              └── 持有服务端专用 GITHUB_TOKEN → POST Issue #1 评论
```

### 微服務架構設計與約束

1. **公網端點**：`https://afa-api.azurpilot.com/v1/device-reports`。生產目錄為 `/srv/agentdock/AgentDock/afa-api`。
2. **認證分層**：Cloudflare 邊緣執行客戶端 TLS 驗證；Docker 伺服端使用已釘住的公開證書（`client-cert.pem`）獨立校驗 HTTP 正文簽名（`X-Report-Timestamp`、`X-Report-Nonce`、`X-Report-Signature`）。
3. **極簡低資源開銷**：Go 標準庫靜態二進制，以非 root 用戶在 Docker 內運行；設定 `GOMEMLIMIT=48MiB` 記憶體軟目標、96 MiB 容器硬上限與 `cpus: "1.0"` 單核配額。
4. **狀態與去重機制**：無獨立資料庫進程，掛載外部目錄 `/srv/agentdock/AgentDock/afa-api-state/state.json`。只記錄報告哈希、建立時間、評論 ID 與連結，**不持久化報告正文、不記錄 IP**。容量上限 10,000 條，寫操作前持久化待確認狀態，併發重試時利用 Issue #1 隱藏標記對齊，防止因 GitHub 延遲導致刷評。
5. **權限隔離**：GitHub API Token 僅在伺服端 `deploy/private/service.env`（權限 0600）提供，目標限定在 `wess09/AzurPilot-for-Android` 的固定 Issue #1，永遠不進入 APK。

## <DocIcon name="shield" /> 修改時的邊界

| 不要 | 因為 |
| --- | --- |
| 讓 Compose 直接調 JNI 或 `app_process` | 越過連接埠邊界，測試與回滾都會失控 |
| 用後台啟動替代 PRoot 父子關係 | 失去父進程死亡協議，會留孤兒 |
| 在普通進程使用忽略安全檢查的 Context | 權限擴散 |
| 重編號輸入操作碼 / 改 JNI 註冊名 | 跨語言 ABI |
| 假設懸浮窗能讀 Activity 狀態 | 它是獨立 Window |
| 把伺服端 GITHUB_TOKEN 打進 APK | 造成 GitHub 憑據泄露 |
| 僅憑靜態編譯通過就認定設備功能就緒 | 虛擬熒幕、OEM 觸控注入與 SPAKE2 配對具有強硬件與 ROM 依賴 |

## <DocIcon name="circle-plus" /> 新功能放哪裏

1. 先找現有邊界（連接埠、倉庫、狀態流、微服務）。
2. 在實現側添加能力。
3. 通過已有連接埠暴露給 UI。
4. 嚴格執行雙層驗證：
   - **靜態驗證**：Gradle `compileDebugKotlin`、Go 測試與 vet、Python 覆蓋層單測；
   - **真機驗證**：在實體 ARM64 設備上驗證虛擬熒幕生命週期、輸入穿透與斷電/重新啟動表現。

如果必須新增邊界，先寫清楚生命週期與執行緒約束的 KDoc，再實現。
