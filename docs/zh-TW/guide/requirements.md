---
title: 環境與兼容性
description: 執行 AzurPilot 所需的操作系統、模擬器、解析度、網路條件與遊戲內設定清單。
updated: 2026-10-20
---

# 環境與兼容性

這一頁只列**會導致直接失敗**的條件。性能建議放在後面，硬性要求放在前面。

## <DocIcon name="clipboard" /> 硬性要求

<table>
<thead>
<tr><th>維度</th><th>桌面（啟動器 / 原始碼）</th><th>Android 宿主</th></tr>
</thead>
<tbody>
<tr><td>操作系統</td><td>Windows 10+、macOS、Linux（較新 glibc）</td><td>Android 9.0+（API 28）</td></tr>
<tr><td>架構</td><td>x64 / ARM64</td><td>ARM64-v8a 或 x86_64，不支援 32 位</td></tr>
<tr><td>執行時</td><td>啟動器自帶 Python 3.14.6；原始碼需要 Python 3.14 + uv</td><td>內置 Ubuntu 24.04 + Python 3.14</td></tr>
<tr><td>記憶體</td><td>建議 8 GB 以上（模擬器 + 後端）</td><td>最低 4 GB，建議 6 GB 以上</td></tr>
<tr><td>存儲</td><td>約 5 GB（依賴 + 資源 + 日誌）</td><td>最低 2.5 GB，建議 5 GB</td></tr>
<tr><td>顯示</td><td>WebUI 需要現代瀏覽器</td><td>—</td></tr>
<tr><td>遊戲解析度</td><td colspan="2"><strong>1280×720</strong>（識別資源基準，不可更改）</td></tr>
</tbody>
</table>

::: warning Linux 上的啟動器依賴
啟動器需要 `libwebkit2gtk-4.1` 與較新的 glibc（CI 使用 Ubuntu 22.04 構建）。如果發行版太舊導致啟動器無法執行，核心程式通常仍可以用命令行方式執行。
:::

## <DocIcon name="monitor" /> 模擬器

核心程式通過 ADB 連接模擬器。以下是配置中內置的預設 Serial，可直接填入「模擬器 Serial」：

| 模擬器 | 預設 Serial | 備註 |
| --- | --- | --- |
| MuMu 模擬器 12 | `127.0.0.1:16384` | 多開依次遞增 |
| MuMu 模擬器 / MuMu X | `127.0.0.1:7555` | — |
| MuMu Pro（macOS） | `127.0.0.1:16384` | 多開為 16416、16448… |
| 雷電模擬器 | `emulator-5554` 或 `127.0.0.1:5555` | 另有 `ldopengl` 專用截圖方案 |
| 夜神模擬器 | `127.0.0.1:62001` | 64 位為 `127.0.0.1:59865` |
| 藍疊模擬器 | `127.0.0.1:5555` | Hyper-V 版填 `bluestacks5-hyperv` |
| 逍遙模擬器 | `127.0.0.1:21503` | — |

不知道 Serial 時，可以在模擬器安裝目錄的 `adb` 中執行 `adb devices` 查詢；也可以在設定裡填 `auto` 自動檢測，但**多個模擬器同時執行時不適用**。

::: tip 截圖與控制方案
預設「自動選擇」會跑一次性能測試挑選最快的截圖方案。常見速度排序：`DroidCast_raw` > `aScreenCap_nc` > `ADB_nc` > `aScreenCap` ≈ `uiautomator2`。MuMu 與雷電有專用方案（`nemu_ipc`、`ldopengl`）。控制方案推薦 `MaaTouch`。
:::

## <DocIcon name="cloud" /> 網路

| 場景 | 需要能訪問 |
| --- | --- |
| 啟動器首次啟動 | GitHub（拉取核心倉庫）、PyPI 或鏡像、npmmirror（Python standalone） |
| Android 完整包 | 無需聯網即可解壓縮 Runtime；更新需要 GitHub / CNB |
| Android 輕量包 | GitHub Release 或 CNB（下載約 1 GB Runtime） |
| 執行時 | 遊戲伺服器、更新檢查、可選的遠端訪問服務 |

國內網路可使用啟動器的 `-cn` 鏡像版部署配置，或 Android 設定中的 CNB 下載源。啟動器在更新程式碼、安裝依賴與連接本地 WebUI 時會繞過系統代理，避免代理干擾本地迴環。

## <DocIcon name="settings" /> 遊戲內設定

以下設定直接影響識別與流程推進，**必須在開始任務前完成**。

路徑：主介面 → 右下角設定 → 左側邊欄。

| 設定項 | 推薦值 | 影響 |
| --- | --- | --- |
| 幀數設定 | 60 幀 | 幀率過低會導致動畫未結束就截圖 |
| 大型作戰 · 減少 TB 引導 | 開 | 減少大世界進入時的引導彈出視窗 |
| 大型作戰 · 自律時自動提交道具 | 開 | 避免揹包滿導致自律中斷 |
| 大型作戰 · 安全海域預設開啟自律 | 關 | 腳本需要自行決定是否自律 |
| 劇情自動播放 | 開啟 | 否則劇情會卡住 |
| 劇情自動播放速度 | 特快 | 縮短等待 |
| 待機模式 | 關 | 待機畫面會干擾識別 |
| 重複角色獲得提示 | 關 | 彈出視窗會打斷流程 |
| 快速更換二次確認 | 關 | 減少一次點擊 |
| 展示結算角色 | 關 | 結算畫面遮擋 |

### 大型作戰：潛艇支援

路徑：大型作戰 → 右上角雷達 → 指令模組 → 潛艇支援。**取消勾選「X 消耗時潛艇出擊」**。

### 一鍵退役

路徑：主介面 → 建造 → 退役 → 齒輪 → 一鍵退役設定。

| 設定項 | 推薦值 |
| --- | --- |
| 選擇優先級 1 / 2 / 3 | R / SR / N |
| 有滿星同名艦船時保留 | 不保留 |
| 無滿星同名艦船時保留 | 滿星所需或不保留 |

## <DocIcon name="eye" /> 圖像識別注意事項

以下內容會讓模板匹配失準，建議在掛機帳號上去除：

- <DocIcon name="circle-alert" /> 角色設備裝備（會改變立繪區域）
- <DocIcon name="circle-alert" /> 角色皮膚
- <DocIcon name="circle-alert" /> 任何遮擋介面元素的自定義顯示內容

如果識別持續失敗，先恢復預設皮膚與裝備，再疑難排解解析度與縮放。

## <DocIcon name="lock" /> 帳號與安全

- <DocIcon name="lock" /> WebUI 預設只監聽本機。開放到區域網路或公網前必須設定密碼，否則任何人拿到地址都能操作你的帳號。
- <DocIcon name="key" /> 遠端訪問使用獨立配對憑據，不暴露 WebUI 主密碼；撤銷配對不會影響主密碼。
- <DocIcon name="ban" /> 不要把 `config/remote-access.json`、`config/deploy.yaml`、`password.txt` 提交到 Git 或發給他人。
- <DocIcon name="lock-keyhole" /> 帳號保險庫使用系統級密鑰（Windows DPAPI / TPM）加密，綁定設備；換機器後需要重新錄入。

## <DocIcon name="rocket" /> 下一步

<ul class="ap-linklist">
<li><a href="/zh-TW/guide/install">安裝<span class="desc">按平臺選擇步驟</span></a></li>
<li><a href="/zh-TW/guide/first-run">第一次執行<span class="desc">從連接到第一個任務</span></a></li>
<li><a href="/zh-TW/troubleshooting/">疑難排解<span class="desc">裝不上、連不上、識別失敗</span></a></li>
</ul>
