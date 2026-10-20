---
title: 首次啟動與 Runtime
description: Runtime 部署狀態機、首次啟動為什麼慢、必要權限、建立實例並啟動第一個任務。
updated: 2026-10-20
---

# 首次啟動與 Runtime

Android 版的首次啟動分兩段：先把 Linux Runtime 部署到應用私有目錄，再啟動 Runtime 裏的 AzurPilot。兩段都可能失敗，但錯誤資訊是分開的。

## <DocIcon name="settings" /> 部署狀態機

| 狀態 | 含義 | 下一步 |
| --- | --- | --- |
| `Checking` | 檢查已裝版本 | 自動繼續 |
| `NotInstalled` | 尚未部署 | 主頁點「下載 Runtime」 |
| `NotBundled` | 輕量包且 Release 無本架構 | 換完整包 |
| `LowDisk` | 剩餘不足 2 GB | 清理空間 |
| `Downloading` | 下載中（按壓縮字節計） | 等待 |
| `Extracting` | 解壓縮中（同樣按壓縮字節計） | 等待 |
| `Ready` | 就位 | 啟動 |
| `Failed` | 異常 | 看 `reason` 重試 |

部署不會自動開始：完整包內置 rootfs，但依然要你點一下「下載 Runtime」才會解壓縮。這是為了避免在存儲不足時靜默失敗。

### <DocIcon name="box" /> 部署做了什麼

1. 若存在 `rootfs.previous`（上次中斷），先恢復。
2. 校驗 `.provisioned` 標記、`BUILD_MANIFEST` 與設備 ABI 是否一致。
3. 解壓縮到 `rootfs.tmp`，成功後**原子改名**為 `rootfs`——半途失敗不會留下半成品。
4. 保留 `config/`（含 SQLite、實例目錄）、`password.txt`、`log/`。
5. 寫入新標記，完成。

下載支援四連接分段（≥8 MiB 時先做 `Range` 探測），失敗自動回退單連接重試一次。完成後校驗大小與 SHA-256，任一不符進入 `Failed`。

## <DocIcon name="clock" /> 為什麼第一次打開 WebUI 很慢

解壓縮時會剝離 `__pycache__`。新 rootfs 第一次啟動要重建全部字節碼，WebUI 可能超過 90 秒才就緒。日誌裏會出現：

```text
AzurPilot WebUI not ready within 90000ms
```

這是**預期警告**，不是錯誤。服務隨後會自然就緒，第二次啟動恢復正常速度。

::: tip 不要在這個階段強殺應用
強殺會留下未完成的會話與鎖。等它自己起來，或者用應用內的「停止 Runtime」走正常收尾。
:::

## <DocIcon name="lock-keyhole" /> 必要權限

| 權限 | 用途 | 不給會怎樣 |
| --- | --- | --- |
| 通知 | 前台服務、配對碼、任務狀態 | 無法用通知完成無線配對 |
| 電池優化白名單 | 後台保活 | 息屏後進程可能被回收 |
| 懸浮窗 | 全局控制面板 | 無法在其他應用上操作 |
| 安裝未知應用 | 應用內更新 APK | 只能手動下載安裝 |
| 所有檔案訪問（可選） | 匯出日誌到公共目錄 | 匯出到應用私有目錄 |

不同廠商還有額外的「自啟動」「後台彈出視窗」「省電策略」開關。Android 12+ 的「精確鬧鐘」與本應用無關，不需要給。

## <DocIcon name="lock" /> 啟用權限

本地運行必須啟用特權服務，否則無法建立虛擬熒幕、截圖與注入觸控。三種方式：

| 方式 | 適用 | 入口 |
| --- | --- | --- |
| 內置 ADB（推薦） | Android 11+ | 設定 → 運行與安全 → 內置 Shizuku |
| Root | 已 root 設備 | 同一頁面選擇 Root |
| 外部 Shizuku / Sui | 已裝管理器 | 同一頁面選擇外部服務 |

詳細步驟見[權限啟用](/zh-HK/android/user/activation)。

## <DocIcon name="rocket" /> 啟動 Runtime

1. 主頁確認 Runtime 為 `Ready`。
2. 點擊「啟動」。
3. 等待狀態變為運行中；首次啟動可能較慢。
4. 打開「控制台」，進入內嵌 WebUI。

內嵌 WebUI 與桌面版是同一套前端，連接埠 `25548`，由 Runtime 監聽在 `127.0.0.1`。宿主的 `AzurPilotGateway` 是唯一的 `/api/v1/ws` 訂閲者。

## <DocIcon name="circle-plus" /> 建立第一個實例

<Steps>
<Step title="新建配置">

控制台 → 已安裝配置 → 新建。名稱用 `ap` 或自定義。

</Step>
<Step title="確認伺服器">

模擬器/本機上的遊戲包名。Android 宿主通常就是國服 `com.bilibili.azurlane`，渠道服按實際選擇。

</Step>
<Step title="截圖方案固定">

Android 宿主必須使用 `azurpilot_android` 截圖與控制方案。其他方案走 ADB，無法訪問虛擬熒幕。

</Step>
<Step title="啟用一個短任務">

先開「科研」或「收穫」，把下一次運行時間設為現在。

</Step>
<Step title="啟動並觀察">

掛機頁能看到畫面變化，日誌出現任務開始/結束，就説明整條鏈路通了。

</Step>
</Steps>

## <DocIcon name="circle-check" /> 驗證清單

| 檢查 | 通過標準 |
| --- | --- |
| Runtime 狀態 | 運行中，無反覆重新啟動 |
| 畫面推流 | 掛機頁能看到遊戲畫面 |
| 控制台 | 實例列表、任務頁可打開 |
| 任務 | 日誌有完整開始/結束，遊戲內狀態變化 |
| 後台 | 切到其他應用 5 分鐘後回來，任務仍在跑 |

## <DocIcon name="map" /> 下一步

<ul class="ap-linklist">
<li><a href="/zh-HK/android/user/activation">權限啟用<span class="desc">配對、Root、斷網重連</span></a></li>
<li><a href="/zh-HK/android/user/console">控制台與懸浮窗<span class="desc">日常操作在哪</span></a></li>
<li><a href="/zh-HK/android/user/maintenance">更新與疑難排解<span class="desc">熱更、整包、日誌</span></a></li>
</ul>
