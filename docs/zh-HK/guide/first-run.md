---
title: 第一次運行
description: 從打開 WebUI 到跑通第一個自動化任務：建立實例、連接模擬器、配置任務與驗證運行結果。
updated: 2026-10-20
---

# 第一次運行

假設你已經完成[安裝](/zh-HK/guide/install)，並且模擬器裏裝好了遊戲、按[遊戲內設定](/zh-HK/guide/requirements#遊戲內設定)調整完畢。

## <DocIcon name="monitor" /> 1. 打開 WebUI

啟動器會直接打開窗口。源碼或 Docker 部署則訪問：

```text
http://127.0.0.1:25548
```

首次訪問如果要求輸入密碼，説明部署配置裏已經設定了 `Password`，或者監聽地址不是迴環、程序自動生成了密碼。自動生成的密碼在項目根目錄的 `password.txt`。

::: danger 不要裸奔在公網
WebUI 可以啟停任務、讀取截圖、修改配置。監聽 `0.0.0.0` 且沒有密碼，等於把帳號交給整個網絡。開放前務必在[部署設定](#部署設定)裏設定強密碼。
:::

## <DocIcon name="circle-plus" /> 2. 建立實例

「實例」= 一份獨立的用戶配置 + 一個調度器進程。預設實例名是 `ap`，可以建立 `ap-2`、`ap-3` 用於多開。

<Steps>
<Step title="新建配置">

在 WebUI 的實例列表點擊新建，選擇空白模板或從已有實例複製。複製會連同任務開關和調度時間一起帶走。

</Step>
<Step title="確認實例目錄">

配置寫入 `config/<实例名>.json`。實例名只允許字母、數字、下劃線與短橫線，重命名請通過 WebUI 匯出再匯入，不要直接改檔案名。

</Step>
<Step title="選擇語言與伺服器">

WebUI 語言與遊戲伺服器是兩件不同的事。前者影響介面文案（`zh-CN` / `en-US` / `ja-JP` / `zh-TW`），後者在「系統設定 → 模擬器設定 → 遊戲伺服器」裏選擇包名。

</Step>
</Steps>

## <DocIcon name="smartphone" /> 3. 連接模擬器

進入「系統 → 模擬器設定」：

| 字段 | 填什麼 |
| --- | --- |
| 模擬器 Serial | 模擬器 ADB 地址，例如 `127.0.0.1:16384`；不確定就填 `auto` |
| 遊戲伺服器 | 通常留 `auto`；多客戶端時手動選包名 |
| 遊戲內伺服器 | 用於維護檢測。不知道就選「不使用檢測」 |
| 截圖方案 | 先留「自動選擇最快的」 |
| 控制方案 | 推薦 `MaaTouch` |

儲存後回到總覽，點擊**截圖測試**。能顯示遊戲畫面就説明 ADB、截圖方案、解像度三項都通了。

::: tip `auto` 不是萬能的
同時開着兩個模擬器時，`auto` 無法判斷你要控制哪一個。此時必須手填 Serial。查詢方法：在模擬器自帶 adb 目錄執行 `adb devices`。
:::

### 畫面是黑的 / 截圖超時

按順序疑難排解：

1. <DocIcon name="monitor" /> 模擬器是否真的啟動了遊戲（不是啟動器介面）。
2. <DocIcon name="smartphone" /> `adb devices` 是否能看到設備且狀態為 `device`（不是 `offline` / `unauthorized`）。
3. <DocIcon name="eye" /> 截圖方案換一個再試（例如從 `DroidCast_raw` 換到 `ADB_nc`）。
4. <DocIcon name="settings" /> 解像度是否為 1280×720。平板模式或自定義 DPI 會導致識別與截圖異常。

## <DocIcon name="zap" /> 4. 跑通第一個任務

不要一上來就開大世界。先用一個短週期、低風險的任務驗證整條鏈路：

<Steps>
<Step title="啟用「科研」或「委託」">

在任務列表找到「科研」，打開「啟用該功能」。這兩個任務不消耗石油、失敗代價低，適合驗證。

</Step>
<Step title="把下一次運行時間設為現在">

任務的 `Scheduler.NextRun` 預設是 2020-01-01（即「立即到期」）。啟用後如果顯示未來時間，清空該字段即可立即運行。

</Step>
<Step title="啟動調度器">

回到總覽點擊啟動。日誌會依次出現：加載配置 → 連接設備 → 截圖 → 進入科研 → 收取/開始研究 → 安排下次運行。

</Step>
<Step title="確認結果">

遊戲內科研隊列確實發生變化；WebUI 總覽的「當前任務」顯示該任務；日誌結尾出現「任務結束」；下次運行時間被推到合理區間（科研通常是數小時）。

</Step>
</Steps>

### 如果日誌一直停在「連接設備」

説明調度器進程沒拿到設備。檢查模擬器是否被其他程序佔用 ADB（例如另一個腳本、Android Studio），以及 Serial 是否寫錯。必要時在「模擬器設定」裏開啟「在檢測不到設備的時候嘗試重新啟動 adb」。

## <DocIcon name="settings" /> 5. 部署設定

`config/deploy.yaml` 控制後端本身的行為，改動通常需要重新啟動：

| 字段 | 預設 | 説明 |
| --- | --- | --- |
| `WebuiHost` | `0.0.0.0` | 監聽地址；僅本機用 `127.0.0.1` |
| `WebuiPort` | `25548` | WebUI 連接埠 |
| `WebuiPassword` | 空 | 訪問密碼；空且監聽公網時會自動生成 |
| `Language` | `zh-CN` | WebUI 語言 |
| `Theme` | `default` | 亮色 / 深色 |
| `OcrServerPort` | `22268` | 獨立 OCR 伺服連接埠 |

## <DocIcon name="rocket" /> 6. 接下來

- <DocIcon name="map" /> 想把任務排得更合理：[調度器與任務編排](/zh-HK/azurpilot/user/scheduler)
- <DocIcon name="map" /> 想多開：[多實例與配置管理](/zh-HK/azurpilot/user/multi-instance)
- <DocIcon name="map" /> 想用手機看：[遠程訪問與設備配對](/zh-HK/azurpilot/user/remote-access)
- <DocIcon name="wrench" /> 任務失敗：[疑難排解](/zh-HK/troubleshooting/azurpilot)
