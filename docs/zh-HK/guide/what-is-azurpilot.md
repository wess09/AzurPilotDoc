---
title: AzurPilot 是什麼
description: AzurPilot 的定位、技術實現、支援範圍與明確不做的事情，基於核心倉庫源碼與 README 核實。
updated: 2026-10-20
---

# AzurPilot 是什麼

<DocIcon name="bot" /> AzurPilot 是《碧藍航線》的自動化框架。它通過 ADB 連接安卓模擬器或設備，循環執行「截圖 → 識別 → 操作」，把日常、出擊、大世界等重複流程交給程序。

它不是遊戲輔助插件，也不修改遊戲客戶端：所有操作都發生在熒幕層面，和玩家手動點擊走的是同一條輸入鏈路。

## <DocIcon name="settings" /> 技術構成

| 層 | 實現 | 説明 |
| --- | --- | --- |
| 調度 | `alas.py` | 每個實例一個進程，串行執行任務，失敗後分級恢復 |
| 識別 | OpenCV 模板匹配 + OCR + 地圖網格檢測 | 資源按 1280×720 製作，分 CN / EN / JP / TW 四套 |
| 控制 | uiautomator2 / ADB / minitouch / MaaTouch | 截圖與控制方式可在設定中切換 |
| 介面 | React + TypeScript + Vite | 瀏覽器訪問，預設連接埠 25548 |
| 通信 | WebSocket RPC（`/api/v1/ws`） | 前端、Android 宿主與外部工具共用 |
| 擴展 | MCP SSE 服務 | 18 個工具，供支援 MCP 的客戶端調用 |

## <DocIcon name="compass" /> 支援範圍

- <DocIcon name="cloud" /> **伺服器**：國服（含 B 服與多個渠道服）、國際服、日服、台服。渠道服通過包名區分，列表見[設備連接](/zh-HK/azurpilot/user/device#遊戲伺服器)。
- <DocIcon name="laptop" /> **運行平台**：Windows、macOS、Linux（啟動器）；Android 9.0+（宿主）；任何能運行 Python 3.14 的環境（源碼）。
- <DocIcon name="monitor" /> **遊戲解像度**：1280×720。這是硬約束，不是建議值。
- <DocIcon name="ban" /> **不支援真機直連**（核心程序側）。Android 版通過虛擬熒幕把手機變成「被控制端」，屬於另一條鏈路。

## <DocIcon name="shield" /> 明確不做的事

- <DocIcon name="ban" /> 不破解、不注入、不修改遊戲記憶體或資源。
- <DocIcon name="ban" /> 不提供帳號代練、交易或共享服務。
- <DocIcon name="ban" /> 不繞過遊戲的反作弊與風控。自動化本身存在封號風險。
- <DocIcon name="ban" /> 不保證所有活動圖都能自動開荒。活動機制變化頻繁，部分玩法需要人工完成前置。

## <DocIcon name="zap" /> 一次任務到底發生了什麼

以「科研」為例：

1. WebUI 把 `Research.Scheduler.NextRun` 寫進 `config/<实例>.json`。
2. 調度器選出到期任務，把該任務的參數綁定到 `self.config.Research_*`。
3. `run('research')` 調用 `alas.py` 上的同名方法，方法惰性匯入 `module/research/research.py`。
4. 模組通過 `device.screenshot()` 截圖，用模板與 OCR 判斷當前頁面，再調用 `device.click()` 推進流程。
5. 結束後調用 `task_delay()` 寫入下一次運行時間，調度器進入下一輪。

完整生命週期（含異常分級與恢復）見[調度器生命週期](/zh-HK/azurpilot/developer/scheduler)。

## <DocIcon name="rocket" /> 下一步

<ul class="ap-linklist">
<li><a href="/zh-HK/guide/ecosystem">三個項目的關係<span class="desc">該下載哪一個</span></a></li>
<li><a href="/zh-HK/guide/requirements">環境與兼容性<span class="desc">裝之前先核對</span></a></li>
<li><a href="/zh-HK/azurpilot/user/webui">WebUI 介面導覽<span class="desc">裝好之後看這裏</span></a></li>
</ul>
