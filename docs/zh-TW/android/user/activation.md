---
title: 權限啟用
description: 內置 ADB 無線配對、Root 與外部 Shizuku 三種啟用方式，斷網重連、失效條件與安全邊界。
updated: 2026-10-20
---

# 權限啟用

虛擬螢幕、截圖與觸控注入都需要 shell 級權限。Android 版提供三條路徑，**推薦內置 ADB**：不需要電腦、不需要 Root、不需要另裝管理器。

| 方式 | 前提 | 重新啟動後 | 安全面 |
| --- | --- | --- | --- |
| 內置 ADB | Android 11+（9–10 需先 `adb tcpip 5555`） | 需重新啟用 | 僅迴環連接，RSA 認證 |
| Root | 已 root（Magisk 等） | 通常自動可用 | 授予 root 權限 |
| 外部 Shizuku | 已安裝 Shizuku / Sui | 取決於管理器 | 複用其授權 |

## <DocIcon name="smartphone" /> 內置 ADB

內置實現移植自 [shizuku-m](https://github.com/wess09/shizuku-m)（Apache-2.0），包含無線配對、離線重連與加密密鑰存儲。

### <DocIcon name="refresh" /> Android 11 及以上

<Steps>
<Step title="開啟開發者選項">

設定 → 關於手機 → 連續點擊版本號 7 次。然後在「系統 → 開發者選項」中打開**無線調試**。

</Step>
<Step title="進入配對頁">

應用內：設定 → 執行與安全 → 內置 Shizuku → 開始配對。

</Step>
<Step title="獲取配對碼">

在系統的「使用配對碼配對設備」頁面選擇「配對碼配對」。系統會顯示六位配對碼與連接埠。

- 通知可用：直接在應用彈出的通知裡輸入配對碼。
- 通知不可用：用分螢幕，把系統配對頁與應用並排，展開「設備配對 → 手動輸入配對碼」，填寫連接埠與六位碼。

</Step>
<Step title="確認調試授權">

如果系統彈出「允許 USB 調試嗎」，勾選「始終允許」並確定。這一步容易被忽略，漏掉會表現為「配對成功但服務起不來」。

</Step>
<Step title="等待啟用">

成功後啟動頁顯示狀態與「返回應用」，配對錶單自動收起。配對碼不會被儲存。

</Step>
</Steps>

### <DocIcon name="settings" /> Android 9–10

系統沒有無線調試配對介面，需要先借助電腦把 adbd 切到 TCP 模式：

```bash
adb devices            # 确认设备已连接
adb tcpip 5555         # 让 adbd 监听 5555
```

之後在應用內連接 `127.0.0.1:5555`。USB 線可以拔掉，但設備重新啟動後需要重新執行。

### <DocIcon name="cloud" /> 斷網與重連

啟用後，**本次開機內**即使斷網、開飛行模式，也能重新連接。失效條件：

- 設備重新啟動
- 撤銷調試授權
- 關閉開發者選項 / 無線調試
- 清除應用數據

以上任一情況都需要重新啟用。

::: danger 5555 連接埠
系統 adbd 監聽 5555，可能對區域網路開放。應用客戶端只連接 `127.0.0.1`，且 adbd 仍要求系統認可的 RSA 密鑰。但請不要在公共網路下長期開啟無線調試，也不要在不認識的設備上點「允許調試」。
:::

### <DocIcon name="key" /> 密鑰存儲

RSA 私鑰由 Android Keystore 的 AES-GCM 密鑰加密後儲存在應用私有偏好中，排除雲備份與設備遷移。配對碼只用於當前操作，不落盤、不寫日誌。

## <DocIcon name="lock-keyhole" /> Root

已 root 設備可以選擇 Root 後端：

1. 在啟用頁選擇 Root。
2. 授予超級用戶權限（Magisk / KernelSU 等會彈出視窗）。
3. 應用通過 `app_process` 拉起特權服務，Binder 回投時校驗 root/shell UID 與一次性 token。

Root 路徑與 ADB 路徑完全獨立：`RootUserService` 的忽略安全檢查 Context 只存在於特權子處理程序，不會擴散到普通 app 處理程序。

::: warning Root 不是「更高級的 ADB」
Root 提供的是不同的啟動鏈路與權限上下文。遇到 ADB 路徑失敗時，切 Root 可能繞過問題，但不代表問題消失。
:::

## <DocIcon name="plug" /> 外部 Shizuku

已經裝了 Shizuku / Sui 並授權的用戶：

1. 啟用頁選擇外部服務。
2. 確認 Shizuku 正在執行且已授權本應用。
3. 應用複用其用戶服務路徑。

如果同時存在內置認證，`SHIZUKU` 後端**優先使用內置連接**；沒有內置認證時才回退外部服務。已連接的外部服務會繼續執行，重新綁定後走內置路徑。

## <DocIcon name="compass" /> 選擇邏輯

```text
后端选择
├── 内置 ADB 已激活 → 使用内置
├── 外部 Shizuku 已授权 → 使用外部
└── Root 可用 → 使用 Root
```

實際優先級由 `PermissionManager` 的狀態機決定：Shizuku 與 root 連接器只暴露無 Binder 的狀態投影，過期連接與死亡回調按 Binder 身份丟棄。

## <DocIcon name="circle-check" /> 驗證啟用成功

| 檢查 | 期望 |
| --- | --- |
| 啟用頁狀態 | 已就緒 / Ready |
| 掛機頁 | 能建立虛擬螢幕並顯示畫面 |
| 啟動任務 | 能截圖、點擊，任務推進 |
| 日誌 | 無 `Binder` 超時、無 `SecurityException` |

## <DocIcon name="wrench" /> 失敗疑難排解

| 現象 | 原因 | 處理 |
| --- | --- | --- |
| 配對碼輸入後無反應 | 未確認 USB 調試授權 | 重新配對，注意系統彈出視窗 |
| 「配對成功但服務未啟動」 | 5555 未監聽 / 被系統回收 | 重開無線調試；Android 9–10 重跑 `adb tcpip 5555` |
| Binder 超時 | 特權處理程序被殺 | 關閉電池最佳化，重試 |
| 聯發科設備啟動即崩 | `LoadedApk.makeApplication` 注入 | 應用已用 Context-only 路徑規避；仍失敗請附日誌 |
| 重新啟動後失效 | 正常行為 | 重新啟用 |
| 外部 Shizuku 連不上 | 管理器未執行 / 授權被撤 | 打開管理器重新授權 |

啟動失敗與 Binder 超時可以查看應用私有目錄下的：

```text
debug/embedded_adb_launch.log
```

## <DocIcon name="shield" /> 安全邊界

| 項 | 設計 |
| --- | --- |
| 服務發佈 | 內置路徑不發佈通用 Shizuku 服務，不為其他應用授權 |
| 回投校驗 | 只接受 root/shell UID + 一次性 token，超時/取消即撤銷 |
| 處理程序死亡 | App 處理程序死亡會銷燬特權子處理程序 |
| 連接埠 | 客戶端只連回環；不對區域網路發起連接 |
| 日誌 | 配對碼不寫入日誌 |
