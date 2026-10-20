---
title: 特權服務與原生橋
description: 內置 ADB、Root 與外部 Shizuku 三種後端，AIDL 介面、JNI 幀/輸入 ABI、虛擬螢幕與 SDK 彈出視窗搬回。
updated: 2026-10-20
---

# 特權服務與原生橋

沒有特權，宿主只能看不能動：建立虛擬螢幕、讀取幀緩衝、注入觸控都需要 shell 級權限。這一層是整個 Android 版最敏感、也最容易改出安全問題的地方。

## <DocIcon name="box" /> 三種後端

| 後端 | 啟動方式 | 憑據 | 生命週期 |
| --- | --- | --- | --- |
| 內置 ADB | `adb shell app_process` | 系統配對 + RSA | 本次開機 |
| Root | `su -c app_process` | root 授權 | 常駐 |
| 外部 Shizuku | Shizuku 用戶服務 | 管理器授權 | 由管理器決定 |

`PermissionManager` 暴露一個**無 Binder 的狀態投影**：UI 只看到「未啟用 / 啟用中 / 就緒 / 失敗」，看不到 Binder 對象，也不會誤持過期連接。死亡回調按 Binder 身份丟棄。

### 內置 ADB 的實現

移植自 [shizuku-m](https://github.com/wess09/shizuku-m)（Apache-2.0，commit `bcb2b62`）：

```text
无线调试配对（SPAKE2）
  → 生成/复用 RSA 身份（Keystore AES-GCM 加密）
    → adb connect 127.0.0.1:5555
      → app_process 拉起 RemoteServiceImpl
        → Binder 经 bootstrap provider 回投
          → 校验 shell UID + 一次性 token
```

幾個關鍵決策：

- **不發佈通用 Shizuku 服務**。它只用已認證的 shell 啟動本專案自己的服務，不為其他應用授權。
- **Context-only 初始化**。`ShellServiceStarter` 避開聯發科對 `LoadedApk.makeApplication` 的注入，這是 MTK 設備啟動崩潰的根因。
- **`setsid` 與標準流分離後才返回**。否則 adb 命令結束會清理掉剛啟動的服務。
- **一次性 token**。超時、取消、解綁都會撤銷；App 處理程序死亡會銷燬特權子處理程序。

::: danger 5555 連接埠
系統 adbd 監聽 5555，可能對區域網路開放。客戶端只連 `127.0.0.1`，但 adbd 仍要求系統認可的 RSA 密鑰。不要在公共網路長期開啟無線調試。
:::

### Root

`RootServiceStarter` 通過 `app_process` 啟動服務，Binder 回投只接受 root/shell UID 與一次性 token。

`RootUserService` 持有一個忽略安全檢查的 Context，但它**只存在於特權子處理程序**，不能擴散到普通 app 處理程序。改這段程式碼時，任何把該 Context 傳回主處理程序的行為都是安全漏洞。

## <DocIcon name="plug" /> 處理程序與介面

```text
主进程 ──AIDL──▶ 特权进程（RemoteServiceImpl）
                    ├── 虚拟显示管理
                    ├── 窗口 / 电源控制
                    ├── 桥接截屏（libbridge.so）
                    └── 输入注入（libbridge.so）
```

| 邊界 | 規則 |
| --- | --- |
| AIDL | app 側只通過連接埠調用，不直接訪問 hidden API |
| JNI | `libbridge.so` 只執行在特權處理程序 |
| 幀鎖 | `GetLockedPixels` 與 `UnlockPixels` 必須嚴格配對 |
| 輸入 | 操作碼與 JNI 註冊名是跨語言 ABI，不能重編號或隨意改名 |
| 啟動器 | `launcher.c` 必須輸出 `liblauncher.so`，才能落到 `nativeLibraryDir` |

::: warning 幀指針會失效
`GetLockedPixels` 返回的指針在 `UnlockPixels` 之後立即失效。把它快取起來跨幀使用會讀到髒數據或崩潰。
:::

## <DocIcon name="monitor" /> 虛擬螢幕

虛擬螢幕是後臺掛機的核心：

- 遊戲 Activity 執行在獨立 Display 上，主螢幕可以正常使用。
- 幀通過共享記憶體通道送回宿主（Unix 抽象域套接字 + `SCM_RIGHTS` 傳句柄）。
- 輸入通過橋接注入到虛擬螢幕，不干擾主螢幕觸控。

實測幀延遲：匿名共享記憶體約 15.6 ms，TCP 通道約 47.2 ms。數據只在 RAM 流轉，不落 Flash。

### SDK 彈出視窗搬回

部分定製 ROM 會把廠商/渠道 SDK 的登入、實名、支付 Activity 重定向到預設顯示器。`SdkTaskRepatriator` 在遊戲執行期間把這些頁面搬回虛擬螢幕，否則腳本會「看到」一個不屬於遊戲的介面。

這是與 OEM 行為強相關的補丁，改動必須真機驗證，模擬器覆蓋不到。

## <DocIcon name="shield" /> 安全邊界

| 攻擊面 | 防護 |
| --- | --- |
| Binder 回投 | 只接受 root/shell UID + 一次性 token |
| 配對碼 | 僅當前操作，不持久化、不寫日誌 |
| RSA 私鑰 | Keystore AES-GCM 加密，排除雲備份與設備遷移 |
| 外部服務 | 複用其授權，不擴大權限 |
| 調試連接埠 | 客戶端只連回環；提示用戶關閉無線調試 |

## <DocIcon name="circle-check" /> 驗證

```bash
cd app

# Kotlin 编译
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime

# ADB 运行时单测
./gradlew :adb-runtime:testDebugUnitTest

# 设备测试（需要真机）
./gradlew :app:connectedDebugAndroidTest -PembeddedAdbTestsOnly=true

# 原生桥构建
./gradlew assembleDebug -Pazurpilot.slimApk=true
```

設備測試覆蓋：加密密鑰持久化、平臺 TLS exporter、SPAKE2 正確配對與錯誤碼拒絕、shell UID、原生橋、虛擬螢幕建立、解綁重連、服務死亡恢復。

2026-10-13 在 Redmi Note 10 Pro（Android 11 / API 30）驗證通過真實系統配對與虛擬螢幕建立；整機重新啟動後的重新啟用仍需人工驗收。

## <DocIcon name="clipboard" /> 修改檢查清單

- [ ] 新後端是否接入統一狀態機，而不是繞過 `PermissionManager`
- [ ] Binder 回投是否校驗 UID 與 token
- [ ] 幀鎖是否成對釋放
- [ ] 輸入操作碼是否保持不變
- [ ] 原生庫是否命名為 `lib*.so`
- [ ] 是否在真機上驗證（不是隻編譯）
- [ ] 是否檢查了 MTK / 小米 / 華為等 OEM 差異
