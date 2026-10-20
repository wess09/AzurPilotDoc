---
title: 任務總覽
description: AzurPilot 102 個任務命令的中文名、分組與用途速查，以及任務手冊的閲讀方法。
updated: 2026-10-20
---

# 任務總覽

核心程序的每個可調度功能都對應一個**任務命令**。命令是英文標識（如 `OpsiHazard1Leveling`），WebUI 裏顯示的是中文名（如「侵蝕1練級」）。

下表由 `module/config/argument/args.json`、`module/config/i18n/zh-CN.json` 與 `task.yaml` 在構建期生成，可以直接搜尋。

<TaskTable />

## <DocIcon name="map" /> 分組與手冊

| 分組 | 任務數 | 手冊 | 説明 |
| --- | --- | --- | --- |
| 系統 | 4 | [輔助工具任務](/zh-HK/azurpilot/user/tasks/tools) | 模擬器、錯誤處理、備份、日報 |
| 出擊 | 6 | [出擊與活動](/zh-HK/azurpilot/user/tasks/campaign) | 主線圖、緊急委託、三油低耗 |
| 活動 | 12 | [出擊與活動](/zh-HK/azurpilot/user/tasks/campaign) | 活動圖、共鬥、作戰檔案 |
| 活動每日 | 7 | [出擊與活動](/zh-HK/azurpilot/user/tasks/campaign) | 每日 A/B/C/D/SP |
| 日常 | 11 | [日常與資源](/zh-HK/azurpilot/user/tasks/daily) | 委託、科研、後宅、指揮喵 |
| 每日任務 | 11 | [日常與資源](/zh-HK/azurpilot/user/tasks/daily) | 每日、困難圖、演習、商店 |
| 大世界 | 19 | [大型作戰](/zh-HK/azurpilot/user/tasks/opsi) | 開荒、隱秘、深淵、智能調度 |
| 島嶼 | 17 | [島嶼計劃](/zh-HK/azurpilot/user/tasks/island) | 農田、牧場、餐廳、製造 |
| 艦隊管理 / 運行參數 / 工具 | 15 | [輔助工具任務](/zh-HK/azurpilot/user/tasks/tools) | 掃描、基準測試、半自動 |

數字來自當前審計版本的 `args.json`（共 102 個任務鍵）。活動適配會增刪任務，以你 WebUI 裏看到的為準。

## <DocIcon name="clipboard" /> 每個任務的通用結構

所有任務共享同一套調度字段，位於任務頁頂部的「調度設定」：

| 字段 | 含義 | 預設 |
| --- | --- | --- |
| 啟用該功能 | 加入調度隊列 | 關 |
| 推送通知 | 任務結束推送結果 | 關 |
| 下一次運行時間 | 到期即運行 | 2020-01-01（立即） |
| 運行成功後推遲 | 下次間隔（分鐘） | 任務自定義 |
| 運行失敗後推遲 | 失敗間隔（分鐘） | 120 |
| 伺服器刷新時間 | 每日基準 | 00:00 |
| 敏感任務 | 出錯停止而非重新啟動 | 部分大世界任務開啟 |

除此之外，每個任務還有自己的參數組。手冊裏只講**會影響結果**的字段，其餘保持預設即可。

## <DocIcon name="eye" /> 怎麼讀一個任務頁

以「科研」為例，推薦按這個順序：

1. **用途**：它替你點哪些按鈕、產出什麼。
2. **前置條件**：需要解鎖什麼、需要多少隊列、是否消耗石油。
3. **關鍵配置**：選項目、隊列策略、是否用鑽石加速。
4. **推薦配置**：一組可以直接抄的值。
5. **驗證**：跑完後看哪裏確認成功。
6. **限制**：哪些版本/伺服器不適用。

## <DocIcon name="lightbulb" /> 保守起步建議

新帳號或剛接手的環境，建議只開這些：

```text
Restart           # 每日重启，清理内存
Reward            # 一键收获
Commission        # 委托
Research          # 科研
Dorm              # 后宅
Daily             # 每日任务
```

穩定運行幾天、確認日誌無反覆失敗後，再逐步加入出擊、活動、大世界。大世界與活動是配置複雜度最高的兩塊，不要和初次安裝同一天做。
