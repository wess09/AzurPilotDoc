---
title: WebUI 介面導覽
description: AzurPilot WebUI 的頁面結構、任務配置表單、調度編輯器、統計與系統設定逐項説明。
updated: 2026-10-20
---

# WebUI 介面導覽

WebUI 是 React + Vite 構建的控制台，通過 `/api/v1/ws` 與後端通信。它不直接操作遊戲，所有動作都轉化為調度器指令或配置寫入。

![WebUI 運行總覽](/img/webui-overview.png)

<Figure caption="運行總覽：左側頁面導航，中部資源卡片與實時日誌，右側調度器與任務計劃。" />

## <DocIcon name="map" /> 頁面地圖

| 頁面 | 路徑 | 用途 |
| --- | --- | --- |
| 首頁 | `/` | 實例列表、啟動/停止、公告 |
| 總覽 | `/i/<实例>/overview` | 當前任務、資源、實時日誌、快捷操作 |
| 任務配置 | `/i/<实例>/task/<任务>` | 由配置 schema 自動生成的表單 |
| 統計 | `/i/<实例>/statistics` | 資源、出擊、大世界、委託、倉庫報表 |
| 交易所 | `/i/<实例>/stock-exchange` | 獨立的交易記錄模組 |
| 調度程序 | `/i/<实例>/task/SchedulerProgram` | 圖形化編排（原調度 / 增強 / 接管） |
| 心智計算器 | `/i/<实例>/task/MindCalculator` | 船塢掃描與心智單元費用 |
| 艦隊科技 | `/i/<实例>/task/FleetTechnology` | 科技點掃描與統計 |
| 已安裝配置 | `/configs` | 匯入、匯出、複製、刪除實例 |
| 設定 | `/settings` | 賬戶、遠程訪問、更新、介面 |
| 更新 | `/updater` | 拉取提交、應用更新 |
| 公告 | `/announcement` | 版本公告與提示 |

## <DocIcon name="monitor" /> 總覽頁

總覽把「現在在幹什麼」壓縮到一屏：

- <DocIcon name="clock" /> **當前任務**：調度器通過 `set_task()` 推送的任務名與狀態。
- <DocIcon name="badge-dollar" /> **資源**：石油、物資、鑽石、行動力等，來自統計與截圖讀取。
- <DocIcon name="scroll" /> **日誌尾**：worker 的實時日誌，按級別着色。
- <DocIcon name="zap" /> **快捷操作**：啟動 / 停止 / 重新啟動、立即執行某任務、打開截圖。

日誌裏的任務邊界形如：

```text
[AzurPilot] 调度器: 开始任务
──────────────── 科研 ────────────────
[AzurPilot] 调度器: 结束任务
```

## <DocIcon name="file-pen" /> 任務配置頁

左側是任務分組（出擊、活動、大世界……），右側是當前任務的表單。表單由 `argument.yaml` 的類型定義動態渲染，不是手寫頁面。

### <DocIcon name="clipboard" /> 表單結構

| 區塊 | 含義 |
| --- | --- |
| 任務説明 | 任務名旁的問號，來自 `i18n` 的 `help` |
| 調度設定 | 啟用、推送、下一次運行時間、成功/失敗間隔、敏感任務 |
| 任務參數 | 該玩法的具體選項，如關卡、艦隊、停止條件 |
| 存儲 | 該任務結果寫入哪張統計表 |

### <DocIcon name="pencil" /> 值的類型

| 控件 | 對應類型 | 注意 |
| --- | --- | --- |
| 複選框 | `checkbox` | 布爾，儲存即生效 |
| 下拉選單 | `select` / `option` | 選項值可能是字符串或數字 |
| 輸入框 | `input` / `textarea` | 部分字段有正則校驗 |
| 時間 | `datetime` / `time` | 清空表示「立即到期」 |

::: tip 儲存是異步的
編輯器會把修改排隊提交（`config.patch`），並用 `revision` 做衝突檢測。看到「已儲存」再離開頁面。多人同時編輯同一實例時，後提交者會收到衝突提示。
:::

### <DocIcon name="warning" /> 敏感任務

`Scheduler.Sensitive` 打開後，該任務出錯會**停止整個實例**而不是重新啟動遊戲。預設對 `OpsiCrossMonth`、`OpsiObscure`、`OpsiAbyssal` 生效，因為在這些環節反覆重新啟動可能造成數據損壞。

## <DocIcon name="zap" /> 調度程序（自定義調度）

「任務配置 → 系統 → 自定義調度」提供一個節點畫布：

- 卡片左側是執行入口，右側是出口；方形連接埠控制順序，圓形連接埠傳數據。
- 支援框選、多選、複製粘貼、撤銷重做、全選、刪除連線。
- 常用參數（資源、任務、運算符、等待時間、變數）可直接在卡片上編輯，詳細參數在右側屬性面板。
- 應用前由後端校驗；運行中的實例在任務安全邊界生效。

三種模式：

| 模式 | 行為 |
| --- | --- |
| 原調度 | 保留既有優先級與時間表；額外支援通用設定裏的石油自動控制 |
| 增強調度 | 程序只能從「已啟用且已到期」的任務中選擇，並可設定本次參數 |
| 完全接管 | 程序決定業務任務，包括未在原配置中啟用的任務；系統恢復仍走現有通道 |

::: warning 先模擬再應用
編輯器提供模擬器（`scheduler.program.simulate`），用模擬時間、資源與任務結果跑圖，不連接設備、不寫真實配置。打開編輯器或儲存草稿都不會啟用方案，必須點「應用方案」。
:::

## <DocIcon name="eye" /> 統計與資源

統計頁把 SQLite 總庫裏的記錄變成報表：資源曲線、出擊次數、掉落、大世界收益、委託、科研、倉庫。資源管理視圖額外提供桑基圖與石油控制線。

## <DocIcon name="brain" /> 心智計算器與艦隊科技

- <DocIcon name="brain" /> **心智計算器**：掃描船塢識別艦船與等級，人工核對後計算心智單元費用，支援 JSON / CSV / XLSX 匯入匯出。
- <DocIcon name="medal" /> **艦隊科技**：獨立記錄艦船身份與等級，統計科技點，不按心智計費條件排除。

兩者都需要 `MindCalculatorScan` / `FleetTechScan` 任務產出數據。掃描會重置船塢篩選，完成前保留舊數據。

## <DocIcon name="settings" /> 系統設定

| 分區 | 內容 |
| --- | --- |
| 賬戶 | 帳號保險庫：建立、解鎖、綁定 TPM / 本機密鑰、切換設定檔 |
| 遠程訪問 | Cloudflare Quick Tunnel 開關、配對碼、已授權客戶端、撤銷 |
| 更新 | 當前提交、可用提交、拉取與應用 |
| 介面 | 主題、語言、背景圖庫、佈局密度 |
| 配置管理 | 匯入匯出、刪除、複製實例 |

## <DocIcon name="rainbow" /> 語言與主題

- <DocIcon name="message-text" /> 介面語言支援 `zh-CN`、`zh-TW`、`ja-JP`、`en-US`，以及一個彩蛋語言 `zh-MIAO`。配置項的中文説明來自 `module/config/i18n/*.json`。
- <DocIcon name="monitor" /> 主題跟隨部署設定或介面設定，支援亮色 / 深色。
- <DocIcon name="smartphone" /> 移動端佈局會摺疊側邊欄，任務表單變為單列。

## <DocIcon name="search" /> 快速鍵與搜尋

- <DocIcon name="search" /> 頂部搜尋框可以搜尋配置項與任務名，支援 `Ctrl/Cmd + K` 聚焦。
- <DocIcon name="settings" /> 調度畫布內：`Ctrl/Cmd + Z` 撤銷、`Shift + Z` 重做、`Ctrl/Cmd + A` 全選、`Esc` 取消選擇、空格 + 拖動平移。

## <DocIcon name="rocket" /> 下一步

<ul class="ap-linklist">
<li><a href="/zh-HK/azurpilot/user/device">連接模擬器與 ADB<span class="desc">先把畫面接上</span></a></li>
<li><a href="/zh-HK/azurpilot/user/scheduler">調度器與任務編排<span class="desc">什麼時候跑什麼</span></a></li>
<li><a href="/zh-HK/api/websocket">WebSocket API<span class="desc">介面背後的協議</span></a></li>
</ul>
