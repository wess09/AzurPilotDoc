---
title: 宿主架構與模組
description: App 殼層、PRoot Runtime、特權服務與網關協議的分層，以及按職責劃分的原始碼地圖。
updated: 2026-10-20
---

# 宿主架構與模組

<AndroidStack />

## <DocIcon name="box" /> 分層

| 層 | 處理程序 | 關鍵類 | 職責 |
| --- | --- | --- | --- |
| App 殼層 | 主處理程序 | `AzurPilotApp`、`MainActivity`、`AppRoot` | 初始化、Compose UI、Runtime 控制 |
| 部署 | 主處理程序 | `RootfsProvisioner` | 首次部署、更新、校驗、切換 |
| PRoot | 子處理程序 | `ProotHost` | 拉起會話、崩潰退避、stdin 保活 |
| 網關 | 主處理程序 | `AzurPilotGateway` | 唯一的 `/api/v1/ws` 訂閱者 |
| 特權 | 獨立處理程序 | `RemoteServiceImpl`、`bridge/` | 虛擬螢幕、截圖、注入 |
| OCR | `:ocr` | 私有綁定服務 | 推理 API |

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
| `CoreModule` | 應用級單例、時鐘、排程器 |
| `HostModule` | 宿主服務、設定 |
| `LogModule` | 日誌寫入器 |
| `OverlayModule` | 懸浮窗與螢幕保護 |
| `PrivilegedModule` | 權限管理器、遠端服務 |
| `ProvisionModule` | 部署器 |
| `ProotModule` | PRoot 會話與倉庫 |
| `ViewModelModule` | 頁面 VM |

新增依賴先定義介面或連接埠，再在所屬模組綁定。`AppCoroutineScope` 是處理程序級監督 scope，**不能**放 UI 生命週期的工作。

## <DocIcon name="map" /> 原始碼地圖

### Runtime 與 PRoot

| 職責 | 入口 | 約束 |
| --- | --- | --- |
| 首次部署與升級 | `provision/RootfsProvisioner.kt`、`RuntimeArch.kt` | rootfs 是不可變工件，按 ABI 發佈 |
| PRoot 會話 | `proot/ProotHost.kt` | App 持有 stdin；關閉 stdin = 通知 Runtime 清理處理程序組 |
| 執行控制 | `proot/AzurPilotRunController.kt` | 啟動/停止狀態機 |
| 網關 | `proot/AzurPilotGateway.kt` | 唯一訂閱者（上游訂閱是整體替換語義） |
| 配置編輯 | `proot/AzurPilotConfigEditor.kt` | 寫入遠端配置 |
| 覆蓋層與種子 | `rootfs/overlays/`、`rootfs/seeds/` | 只處理兼容差異，不覆蓋用戶配置 |

### 特權與原生

| 職責 | 入口 | 約束 |
| --- | --- | --- |
| 後端選擇與授權 | `privileged/PermissionManager.kt` | 統一狀態機，過期連接按 Binder 身份丟棄 |
| Shizuku 連接 | `privileged/RemoteServiceManager.kt` | 外部/內置兩條路徑 |
| root 啟動 | `root/RootServiceStarter.kt` | `app_process` + 一次性 token 回投 |
| 特權 IPC | `remote/RemoteServiceImpl.kt` | 擁有虛擬螢幕、視窗/電源、橋接服務 |
| JNI | `bridge/`、`native/bridge.h` | 幀鎖與輸入操作碼是 ABI |
| root 啟動器 | `native/launcher.c` | 必須輸出 `liblauncher.so` |

### 設定與介面

| 職責 | 入口 | 約束 |
| --- | --- | --- |
| 應用設定 | `settings/AppSettings.kt` | `@PrefSchema` 生成 snake_case 鍵 |
| 用戶配置 | `config/UserConfigurationStore.kt` | 獨立的 JSON DataStore，不與設定混用 |
| Compose 頁面 | `ui/settings/`、`ui/azurpilot/`、`ui/logs/` | 狀態由 VM/repository 提供 |
| 懸浮窗與螢幕保護 | `overlay/` | 獨立 Window，不能讀 Activity 配置 |
| 小組件 | `widget/` | 用顯式 drawable，不依賴 `?attr` |

### 保活與日誌

| 職責 | 入口 |
| --- | --- |
| 前臺服務 | `service/RunForegroundService.kt` |
| 多路徑保活 | `keepalive/KeepAliveManager.kt` |
| 日誌 | `log/`、`constant/AppPaths.kt` |

保活子系統必須可重複啟停，設定開關是最終裁決。接收器和服務可能在無 DI 的路徑上啟動，因此使用受控的處理程序級管理器入口。

## <DocIcon name="plug" /> 網關協議

Runtime 在 `127.0.0.1:25548` 暴露三類介面：

| 介面 | 鑑權 | 用途 |
| --- | --- | --- |
| `/api/v1/ws` | 會話令牌 | 實例、總覽、配置、日誌、統計 |
| `/android/*` | `X-AzurPilot-Android-Token` | App 專用薄介面 |
| `/healthz` | 無 | 就緒探測 |

連接埠來自 `deploy.yaml` 的 `WebuiPort`，修改後 App 在下次啟動 Runtime 時讀取並一起切換網關、控制與更新介面。

為什麼只能有一個 WebSocket 訂閱者：上游的訂閱是**整體替換**語義，兩個訂閱者會互相清空主題。所有 UI 與業務通過 `AzurPilotRepository` 的狀態流消費。

## <DocIcon name="refresh" /> 兩條更新通道

| 通道 | 內容 | 載體 |
| --- | --- | --- |
| App | 宿主程式碼 | 輕量 APK（雙 ABI、無 rootfs） |
| Runtime | rootfs、Python、依賴 | `rootfs-<abi>.tar.xz` |

另有第三條「腳本熱更」，只換上游原始碼與前端，要求 `uv.lock` 不變。

## <DocIcon name="shield" /> 修改時的邊界

| 不要 | 因為 |
| --- | --- |
| 讓 Compose 直接調 JNI 或 `app_process` | 越過連接埠邊界，測試與回滾都會失控 |
| 用後臺啟動替代 PRoot 父子關係 | 失去父處理程序死亡協議，會留孤兒 |
| 在普通處理程序使用忽略安全檢查的 Context | 權限擴散 |
| 重編號輸入操作碼 / 改 JNI 註冊名 | 跨語言 ABI |
| 假設懸浮窗能讀 Activity 狀態 | 它是獨立 Window |

## <DocIcon name="circle-plus" /> 新功能放哪裡

1. 先找現有邊界（連接埠、倉庫、狀態流）。
2. 在實現側添加能力。
3. 通過已有連接埠暴露給 UI。
4. 補最小驗證：Kotlin 編譯、原生構建、真機迴歸。

如果必須新增邊界，先寫清楚生命週期與執行緒約束的 KDoc，再實現。
