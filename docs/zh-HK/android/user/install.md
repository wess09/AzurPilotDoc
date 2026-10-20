---
title: 安裝與架構選擇
description: 選擇正確的 APK 架構與安裝包類型，從 GitHub 或 CNB 下載，處理簽名衝突與存儲不足。
updated: 2026-10-20
---

# 安裝與架構選擇

Android 版有兩個容易選錯的地方：**CPU 架構**和**完整包 / 輕量包**。選錯的後果分別是「裝上了但 Runtime 起不來」和「多下一次 1 GB」。

## <DocIcon name="clipboard" /> 1. 確認架構

| 架構 | 典型設備 | 説明 |
| --- | --- | --- |
| `arm64-v8a` | 絕大多數手機、平板 | 首選 |
| `x86_64` | 安卓模擬器、少數 x86 平板 | MuMu 等模擬器用這個 |

查看方法：

- 設定 → 關於手機 → 處理器，通常寫 `arm64-v8a`。
- 或安裝任意設備資訊應用查看 `ABI`。
- 模擬器在建立實例時就能看到架構，選 x86_64。

::: danger 32 位設備不支援
Runtime 依賴 64 位 Linux 二進制。`armeabi-v7a` 設備無法運行，沒有降級方案。
:::

## <DocIcon name="package" /> 2. 選包

| 包 | 大小量級 | 首次啟動 | 什麼時候用 |
| --- | --- | --- | --- |
| 完整版 APK | 大（內置 rootfs） | 本地解壓縮 1–3 分鐘，**無需聯網** | 第一次安裝 |
| 輕量增量 APK | 小（無 rootfs） | 下載約 1 GB Runtime | 已裝完整版，只更新宿主 |

首次安裝請選完整包。輕量包的價值在於後續宿主更新：覆蓋安裝不會重新解壓縮 Runtime，配置和實例都保留。

## <DocIcon name="download" /> 3. 下載

| 渠道 | 地址 | 適用 |
| --- | --- | --- |
| GitHub Releases | `github.com/wess09/AzurPilot-for-Android/releases/latest` | 國際網絡 |
| CNB | `cnb.cool/azurpilot/AzurPilot-for-Android/-/releases` | 國內網絡，新安裝預設源 |

兩個渠道的清單與附件是同一版本，大小與 SHA-256 一致。應用內也可以在設定裏切換下載源：

| 源 | 説明 |
| --- | --- |
| `cnb` | 國內直連，預設 |
| `direct` | GitHub 直連 |
| 內置鏡像 | ghproxy 形態的五個前綴 |
| 自定義 | 自行填寫 ghproxy 形態前綴，非法輸入回落直連 |

::: tip 鏡像不是都可用
內置列表中 `gh-proxy.net` 會對無 JS 引擎的下載器返回挑戰頁，**不能用於下載**。實測較穩的是 `gh.ddlc.top`、`ghfast.top`。切換源不會改變版本與校驗值。
:::

## <DocIcon name="smartphone" /> 4. 安裝

<Steps>
<Step title="允許安裝未知來源">

系統會提示「禁止安裝未知應用」。在設定中為檔案管理器或瀏覽器授予「安裝未知應用」權限。

</Step>
<Step title="處理簽名衝突">

如果之前裝過別的簽名版本（例如自行編譯的 debug 包），覆蓋安裝會報 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`。需要先移除舊版——**移除會刪除應用數據，包括 Runtime 與配置**，先匯出日誌與配置。

</Step>
<Step title="安裝並首次啟動">

安裝完成後打開應用。首次啟動先做權限引導，再進入 Runtime 部署。

</Step>
<Step title="等待 Runtime 就位">

完整包：解壓縮 1–3 分鐘。
輕量包：下載約 1 GB，再解壓縮。建議 Wi-Fi。

</Step>
</Steps>

## <DocIcon name="circle-check" /> 5. 驗證安裝

| 檢查 | 期望 |
| --- | --- |
| 主頁 Runtime 狀態 | `Ready` / 已就緒 |
| 存儲佔用 | 增加約 1.5–2.5 GB |
| 掛機頁 | 能看到畫面推流（啟用權限後） |
| 控制台 | 能打開內嵌 WebUI |

如果狀態停在 `Failed`，點開錯誤詳情看 `reason`：

| 狀態 | 原因 | 處理 |
| --- | --- | --- |
| `NotBundled` | 輕量包 + Release 無本架構 Runtime | 換完整包 |
| `LowDisk` | 剩餘空間不足 2 GB | 清理空間 |
| `Downloading` 卡住 | 網絡或鏡像不可用 | 換下載源 |
| `Failed` | 校驗失敗或解壓縮異常 | 重試；仍失敗則重新下載 |

## <DocIcon name="circle-off" /> 6. 移除與數據

移除應用會刪除：

- Runtime（`rootfs` 目錄）
- 全部實例配置與統計資料庫
- 日誌與截圖

不會保留任何雲端副本。需要保留時，先在應用內匯出日誌/配置，或用 ADB 備份應用私有目錄（需要 root 或 `adb backup` 兼容性支援）。

## <DocIcon name="message" /> 常見問題

| 現象 | 原因 |
| --- | --- |
| 安裝時報「解析包錯誤」 | 下載不完整或架構不符 |
| 裝上了但一啟動就閃退 | 架構不符（x86 包裝到 ARM 設備） |
| Runtime 一直 `Downloading` | 鏡像返回挑戰頁 / 網絡被代理攔截 |
| 解壓縮後首次 WebUI 很久才開 | 正常現象：`__pycache__` 被剝離，首次啟動重建字節碼，可能超過 90 秒 |
| 覆蓋安裝後配置消失 | 換了簽名，實際是移除重裝 |
