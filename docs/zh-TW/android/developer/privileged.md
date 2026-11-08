---
title: 特權服務與原生橋
description: 內置 ADB、Root 與外部 Shizuku 三種後端，AIDL 介面、TCP 22301 線協議、JNI 幀與輸入 ABI、共享記憶體截幀與虛擬螢幕管理。
updated: 2026-11-08
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
                    ├── 输入注入（libbridge.so）
                    └── 原生桥服务（BridgeServer, 127.0.0.1:22301）
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

## <DocIcon name="network" /> 特權橋線協議（TCP 22301）

橋服務由 `BridgeServer.kt` 承載，只監聽 `127.0.0.1:22301`，供 PRoot 內的 Python 執行時連接。該介面僅限本機迴環，嚴禁對外暴露或連接埠映射。特權處理程序具備全套截圖、輸入與 shell 注入能力，任何協議改動都必須滿足最小權限約束。

### 幀格式

1. 客戶端發送單行 UTF-8 JSON，並以 `\n` 結尾；單行上限為 64 KiB，超限連接立即關閉。
2. 伺服端在成功或錯誤響應中回顯請求攜帶的可選 `id` 字段（缺失時回顯 `null`）。
3. 文本響應為單行 UTF-8 JSON + `\n`。
4. `screencap` 成功時先輸出一行 JSON 元數據，隨後緊接寫入 `length` 字節的原始 BGR888 像素數據。客戶端必須嚴格讀完指定字節後才能處理下一條指令。

### 核心端點

| 端點 | 參數 | 成功響應 | 約束與說明 |
| --- | --- | --- | --- |
| `ping` | 無 | `ok`、`pong`、`displayId`、`capture`、`uptime`、`capabilities` | 返回當前虛擬螢幕狀態與能力字典，如 `equipmentCode`、`sharedMemoryScreencap`、`nativeGameResolution`、`appFocus`。 |
| `screencap` | 無 | 元數據行（`width`、`height`、`channels=3`、`length`、`frames`）+ 原始 BGR888 字節 | `frames` 記錄幀序號，值不變代表畫面凍結（例如被 ROM 處理程序凍結）。尺寸不符時返回錯誤 JSON，不發送字節流。 |
| `click` | `x`、`y` | `ok=true` | 注入至當前虛擬螢幕，無活動虛擬螢幕時返回錯誤。 |
| `swipe` | `x1`、`y1`、`x2`、`y2` | `ok=true` | 可選 `duration`（毫秒），負數按 0 處理。 |
| `equipment_code_read` | 無 | `ok=true`、`code` | 從系統剪貼板首項讀取裝備碼，無有效碼返回 `code=null`，不展開 URI。 |
| `equipment_code_input` | `code` | `ok=true` | 僅接受 16–4096 字符的合規 Base64 裝備碼。在虛擬螢幕已聚焦輸入框注入 Ctrl+A、Delete、文本與 Enter，序列預算 10 秒。 |
| `shell` | `cmd` | `ok`、`code`、`stdout`、`stderr` | 可選 `timeout`（秒）；每個輸出流至多保留 64 KiB。 |
| `app_prepare` | `package`、`displayId` | `ok=true` | 要求 `nativeGameResolution=true`；在當前 1280×720 虛擬螢幕關閉目標包的標準及 APS 兼容縮放，回讀驗證並在 APS 設備上強停舊處理程序。 |
| `app_focus` | `package`、`displayId` | `ok=true`、`displayId` | 要求 `appFocus=true`；在虛擬螢幕頂層視窗注入 down/cancel 觸摸事件恢復焦點，不觸發點擊，重試預算 3 秒。 |

### 併發與鎖邊界

- `screencap`、`click`、`swipe` 與裝備碼介面共享特權處理程序的設備互斥鎖，彼此互斥串行。
- `shell` 不佔用設備鎖。
- 客戶端仍須自行維護單個設備操作序列有序，不應利用伺服端執行緒細節進行併發請求。

## <DocIcon name="monitor" /> 虛擬螢幕與共享記憶體截幀

虛擬螢幕是後臺掛機的核心：

- 遊戲 Activity 執行在獨立 Display 上，主螢幕可以正常使用。
- 截幀通道分為 **共享記憶體截幀 v1** 與 **TCP 字節流**。
- 輸入通過橋接注入到虛擬螢幕，不干擾主螢幕觸控。

### 共享記憶體截幀 v1

`ping` 返回 `capabilities.sharedMemoryScreencap=true` 時啟用：

1. 抽象 Unix 套接字 `com.azurpilot.ghio.frames.v1` 監聽同 UID 連接。
2. 主應用接受連接後，通過固定 Binder 事務 78（`openSharedFrameChannel`）向特權服務交付連接 FD（設定 60 秒超時），避免跨 SELinux 域的連接埠監聽限制。
3. 客戶端發送 `{"method":"open","version":1}`，伺服端通過 `SCM_RIGHTS` 交付僅限只讀 mmap 的匿名記憶體 FD。
4. 隨後發送 `{"method":"screencap"}`，響應僅包含元數據（`transport="shared_memory"`），無像素尾隨，像素在響應前由 native 完成 memcpy。
5. **截幀不佔輸入鎖**：共享記憶體截幀與滑動/點擊互不阻塞。每個連接獨立擁有映射，最多支援 8 個連接，單映射上限 32 MiB。

實測幀延遲：匿名共享記憶體約 15.6 ms，TCP 通道約 47.2 ms。數據只在 RAM 流轉，不落 Flash。

### 執行時覆蓋層自動同步

Runtime 鏡像中的 `rootfs/overlays/` 包含以下與特權橋配合的兼容層：

- `android_equipment.py`：裝備碼讀寫適配，通過 `equipment_code_*` 橋端點工作，不啟用 FastInputIME 也不回退主螢幕。
- `android_device.py`：虛擬螢幕前臺檢測，精確解析 `Display: mDisplayId=…` 匹配橋返回的 ID，僅查詢目標屏視窗與恢復的 Activity。
- `android_capture.py`：優先連接共享記憶體截幀通道，失敗時平滑回退到 TCP 22301。
- `android_app_launch.py`：拉起遊戲並調用 `app_prepare` 與 `app_focus`。

APK 在**每次 Runtime 啟動前**自動將這些覆蓋層檔案同步至執行時目錄，確保上游原始碼熱更不會覆蓋或破壞特權橋補丁。

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

## <DocIcon name="circle-check" /> 靜態原始碼檢查與真機驗證

特權層涉及 Linux 系統調用與 OEM 定製行為，**必須嚴格區分靜態驗證與真機驗證**：

### 1. 靜態原始碼與離線單測

在開發機或 CI 上執行，不依賴物理設備連接：

```bash
cd app

# Kotlin 语法与类型校验（必跑）
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime

# ADB 运行时加密与协议单测
./gradlew :adb-runtime:testDebugUnitTest

# 原生桥与打包流水线编译
./gradlew assembleDebug -Pazurpilot.slimApk=true

# 特权桥覆盖层 Python 单测（前台探测、装备码协议、拉起聚焦）
cd ..
uv run --with psutil --with numpy --with pyyaml python -m unittest \
  rootfs/tests/test_android_device.py \
  rootfs/tests/test_android_equipment.py \
  rootfs/tests/test_android_app_launch.py
```

### 2. 真機集成驗證（不可由靜態分析替代）

下列專案涉及內核 IPC、DisplayManager 與廠商 ROM 特殊行為，靜態測試通過**不代表真機功能正常**：

- **系統無線調試配對**：SPAKE2 握手、RSA 密鑰存入 Android Keystore（AES-GCM）、通知欄填碼與分螢幕填碼。
- **虛擬螢幕建立與生命週期**：不同 Android 版本的 VirtualDisplay 私有標誌、Activity 綁定與黑屏恢復。
- **觸控與輸入注入**：逐鍵發送 Ctrl+A、Delete、Base64 裝備碼文本與 Enter 的實際生效情況。
- **OEM 彈出視窗搬回**：小米/華為等系統在登入與支付時將 SDK 視窗強制彈出至主螢幕，需實測 `SdkTaskRepatriator` 搬回。
- **整機重新啟動後的重新啟用**：驗證重新啟動後調試狀態失效能否被應用優雅捕獲並引導。

2026-10-13 在 Redmi Note 10 Pro（Android 11 / API 30）驗證通過真實系統配對與虛擬螢幕建立；整機重新啟動後的重新啟用仍需人工驗收。

```bash
# 设备自动化测试（需要已连接 ADB 的真机）
./gradlew :app:connectedDebugAndroidTest -PembeddedAdbTestsOnly=true
```

## <DocIcon name="clipboard" /> 修改檢查清單

- [ ] 新後端是否接入統一狀態機，而不是繞過 `PermissionManager`
- [ ] Binder 回投是否校驗 UID 與 token
- [ ] 幀鎖是否成對釋放，共享記憶體映射是否正確關閉
- [ ] 輸入操作碼與線協議字段是否保持向後兼容
- [ ] 原生庫是否命名為 `lib*.so`
- [ ] 靜態 `compileDebugKotlin` 與覆蓋層單測均已通過
- [ ] 是否在真機上驗證（不是隻看靜態編譯通過）
- [ ] 是否檢查了 MTK / 小米 / 華為等 OEM 差異


## 首幀未就緒時的有限重試

虛擬螢幕剛建立或重建後，遊戲可能尚未繪製第一幀。共享記憶體截圖通道會進行有限等待：

- 等待預算約 **3 秒**，每隔 **200 ms** 重試。
- 等待只占用目前連線的用戶端執行緒，不會阻塞影格產生執行緒或其他連線。
- 真正沒有畫面的虛擬螢幕仍會在預算耗盡後回傳錯誤；這不是無限等待，也不能取代虛擬螢幕建立成功檢查。
- 預算短於用戶端 5 秒 socket timeout，用來吸收螢幕重建後的瞬時首幀競態。

TCP 截圖通道也有有限重試。若持續逾時，仍應檢查虛擬螢幕狀態、遊戲是否啟動及特權橋能力。
