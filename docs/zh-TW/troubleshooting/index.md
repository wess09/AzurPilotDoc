---
title: 疑難排解方法
description: 從現象到根因的定位順序：先分層確認問題出在設備、識別還是排程，再取證日誌與截圖，最後每次只改一處並驗證一處。
updated: 2026-10-20
---

# 疑難排解方法

自動化系統的故障往往不是「壞了」，而是「某一步沒按預期發生」。按層疑難排解比逐條試配置快得多。

## <DocIcon name="box" /> 先分層

```text
第 0 层：启动器 / APK 本身能不能起来
第 1 层：后端能不能起来（端口、密码、前端）
第 2 层：设备能不能连（ADB、截图、点击）
第 3 层：识别对不对（页面、按钮、OCR）
第 4 层：任务逻辑与调度（选任务、排期、恢复）
第 5 层：游戏机制与活动适配
```

從下往上查。第 2 層沒通，改第 4 層的配置毫無意義。

## <DocIcon name="clipboard" /> 取證清單

| 證據 | 位置 |
| --- | --- |
| 當前任務與狀態 | WebUI 總覽 |
| 最近日誌 | `log/<日期>_<实例>.txt` |
| 錯誤現場 | `log/error/<实例>/<时间戳>/`（截圖 + log.txt） |
| 啟動器日誌 | `log/<日期>_launcher.txt` |
| Android 宿主日誌 | `log/app.log`、`log/proot/session.log` |
| 設備狀態 | `adb devices`、截圖測試 |
| 版本 | 核心提交、啟動器版本、Runtime 版本 |

::: danger 分享前先脫敏
配置匯出裡有模擬器 Serial、SSH 私鑰、WebUI 密碼、遠端身份。發 Issue 前刪掉這些字段。
:::

## <DocIcon name="search" /> 常見現象與第一檢查點

| 現象 | 先看 |
| --- | --- |
| WebUI 打不開 | 處理程序是否存活、連接埠是否被佔、監聽地址 |
| 截圖全黑 | 截圖方案、解析度、模擬器渲染後端 |
| 點不動 | 控制方案、虛擬螢幕、權限 |
| 識別錯位 | 解析度是否 1280×720、皮膚/裝備遮擋 |
| 任務反覆失敗 | 日誌裡的異常類型，不是「失敗」兩個字 |
| 任務不執行 | `Enable`、`NextRun`、優先級、敏感任務停機 |
| 配置改了沒生效 | 是否在任務執行中、是否被 override |
| 更新後崩潰 | 回滾、看生成產物差異、依賴是否同步 |

## <DocIcon name="scale" /> 隔離變數

一次只改一個東西，並記錄改前/改後：

1. 換截圖方案 → 只換截圖，不動控制。
2. 換控制方案 → 只換控制。
3. 換關卡/艦隊 → 只動任務參數。
4. 換實例 → 確認是配置問題還是環境問題。

同時改三處，最後你不知道是哪一處生效。

## <DocIcon name="hand" /> 什麼時候該停下來

| 情況 | 建議 |
| --- | --- |
| 敏感任務（跨月、隱秘、深淵）出錯 | 不要反覆重試，先儲存現場 |
| 帳號出現異常登入/風控提示 | 立即停止所有自動化 |
| 日誌出現憑據或個人資訊 | 停止分享，先脫敏 |
| 連續重新啟動模擬器超過閾值 | 檢查模擬器本身，而不是加大重試 |

## <DocIcon name="send" /> 提 Issue 的正確姿勢

包含：

- 版本（核心提交 / 啟動器 / Runtime）
- 平臺與模擬器（或手機型號、Android 版本）
- 復現步驟（從哪個頁面、點了什麼）
- 期望結果 vs 實際結果
- 日誌片段與錯誤截圖
- 已嘗試的疑難排解

不包含：

- `deploy.yaml`、`password.txt`、`remote-access.json`
- 完整帳號截圖
- 「不能用」三個字

## <DocIcon name="map" /> 分平臺入口

<ul class="ap-linklist">
<li><a href="/zh-TW/troubleshooting/azurpilot">核心程式<span class="desc">設備、識別、排程、遠端</span></a></li>
<li><a href="/zh-TW/troubleshooting/android">Android<span class="desc">Runtime、權限、熱更、保活</span></a></li>
<li><a href="/zh-TW/troubleshooting/launcher">啟動器<span class="desc">初始化、連接埠、三平臺</span></a></li>
</ul>
