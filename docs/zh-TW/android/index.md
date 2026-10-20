---
title: AzurPilot for Android
description: 在手機上本地執行 AzurPilot：Kotlin 宿主 + PRoot Linux Runtime + 虛擬螢幕，或作為遠端客戶端連接其他實例。
updated: 2026-10-20
---

# AzurPilot for Android

Android 版不是「手機端的精簡版」——它把**完整的核心程式**（含 Python 3.14、依賴、OCR 模型、前端）裝進 APK，通過 PRoot 在免 Root 環境下執行，再用虛擬螢幕把遊戲放到後臺。

<div class="ap-meta">
<span><b>倉庫</b> wess09/AzurPilot-for-Android</span>
<span><b>分支</b> main</span>
<span><b>系統</b> Android 9.0+（API 28）</span>
<span><b>架構</b> ARM64-v8a / x86_64</span>
<span><b>許可證</b> AGPL-3.0</span>
</div>

![AzurPilot for Android 主頁](/img/android-home.jpg)

<Figure caption="Android 宿主主頁：Runtime 狀態、安裝入口與本地/遠端模式切換。截圖來自 Android 倉庫 docs/screenshots。" />

## <DocIcon name="smartphone" /> 兩種完全不同的用法

| 模式 | 遊戲跑在哪 | 本機 Runtime | 權限 | 適用 |
| --- | --- | --- | --- | --- |
| **本地執行** | 手機上 | 需要 | 需要內置 ADB / Root 啟用 | 沒有電腦，或用舊手機專職掛機 |
| **遠端客戶端** | 其他機器上 | 不需要 | 不需要 | 用手機查看、控制家裡電腦的實例 |

::: warning 不要混淆
遠端客戶端模式不會啟動本機 Runtime，也不需要 Shizuku。它是把 `AzurPilotGateway` 指向另一個實例的固定入口，複用原生控制台。詳見[作為遠端客戶端](/zh-TW/android/user/remote-client)。
:::

## <DocIcon name="box" /> 分層結構

<AndroidStack />

<Figure caption="App 殼層持有 Runtime 的 stdin；關閉 stdin 即觸發 Runtime 處理程序組回收，避免孤兒處理程序。" />

| 層 | 技術 | 職責 |
| --- | --- | --- |
| App 殼層 | Kotlin + Compose (Material / Miuix) | 介面、Runtime 部署、網關訂閱、懸浮窗 |
| PRoot | jniLibs 九件套 | 免 Root 的系統調用映射 |
| Runtime | Ubuntu 24.04 + Python 3.14 | 上游核心程式與 WebUI |
| 特權服務 | app_process + AIDL + JNI | 虛擬螢幕、截圖、觸控注入 |
| OCR 工作處理程序 | `:ocr` 獨立處理程序 | 推理 API（`127.0.0.1:22302`） |

三個處理程序邊界：

- <DocIcon name="monitor" /> **主處理程序**：Compose UI、配置、網關。
- <DocIcon name="brain" /> **`:ocr`**：承載 LiteRT / MNN 推理庫，崩潰不影響主介面。
- <DocIcon name="lock-keyhole" /> **特權處理程序**：通過內置 ADB、Shizuku 或 root 拉起，持有虛擬顯示與原生橋。

## <DocIcon name="zap" /> 能力清單

| 能力 | 說明 |
| --- | --- |
| 後臺虛擬螢幕 | 遊戲在獨立 Virtual Display 執行，主螢幕可正常使用 |
| 懸浮控制 | 全局浮窗啟停任務、看佇列、滾日誌 |
| 內置控制台 | 設備端完整 WebUI，無需電腦 |
| OCR 硬體加速 | 高通 QNN、聯發科 NeuroPilot、海思 HiAI；失敗回退 CPU |
| 幀通道 | 匿名共享記憶體 + SCM_RIGHTS，實測 15.6 ms（TCP 47.2 ms） |
| 螢幕保護防燒屏 | 黑色低亮度，30 秒後每 10 秒上下漂移 16dp |
| 雙軌更新 | APK 與 Runtime 獨立；腳本可事務級熱更 |
| 日誌匯出 | 宿主與業務日誌分離，7 天輪轉，一鍵打包 |

## <DocIcon name="clipboard" /> 環境要求

| 維度 | 最低 | 推薦 |
| --- | --- | --- |
| 系統 | Android 9.0（API 28） | Android 12–15 |
| 架構 | ARM64-v8a / x86_64 | 同上 |
| 存儲 | 2.5 GB 可用 | 5 GB |
| 記憶體 | 4 GB | 6 GB 以上 |
| 權限 | 內置 ADB 配對 / Root / 外部 Shizuku | 內置 ADB |

32 位設備不支援。x86_64 主要用於模擬器；真機幾乎都是 ARM64。

## <DocIcon name="download" /> 安裝包怎麼選

| 包 | 內含 Runtime | 首次啟動 | 適用 |
| --- | --- | --- | --- |
| 完整版 APK | 是 | 本地解壓縮 1–3 分鐘，無需聯網 | 首次安裝，推薦 |
| 輕量增量 APK | 否 | 下載約 1 GB Runtime | 已裝過完整版，只更新宿主程式碼 |

輕量包覆蓋安裝不會重新解壓縮 Runtime，配置與實例保留。

## <DocIcon name="monitor" /> 介面

![AzurPilot for Android 總覽](/img/android-overview.jpg)

<Figure caption="Runtime 總覽：實例狀態、排程與 WebUI 入口。" />

| 頁面 | 內容 |
| --- | --- |
| 主頁 | Runtime 狀態、下載/解壓縮、啟動與停止 |
| 掛機 | 畫面推流、實例、開始/停止 |
| 控制台 | 內嵌 WebUI |
| 日誌 | 宿主與業務日誌、匯出 |
| 設定 | 外觀、下載源、保活、OCR、螢幕保護、遠端 |

深色主題與 Material / Miuix 兩套外觀都受支援。截圖見 [控制台、懸浮窗與螢幕保護](/zh-TW/android/user/console)。

## <DocIcon name="map" /> 繼續閱讀

<ul class="ap-linklist">
<li><a href="/zh-TW/android/user/install">安裝與架構選擇<span class="desc">APK、架構、下載源</span></a></li>
<li><a href="/zh-TW/android/user/first-run">首次啟動與 Runtime<span class="desc">解壓縮、權限、首個實例</span></a></li>
<li><a href="/zh-TW/android/user/activation">權限啟用<span class="desc">內置 ADB、Root、外部 Shizuku</span></a></li>
<li><a href="/zh-TW/android/developer/architecture">宿主架構<span class="desc">模組與處理程序邊界</span></a></li>
</ul>
