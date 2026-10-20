---
title: 排程器生命週期
description: alas.py 的主循環、任務選擇、異常分級、執行緒模型與快取策略；修改排程行為前必讀。
updated: 2026-10-20
---

# 排程器生命週期

`alas.py` 是執行時的心臟。它不實現任何遊戲操作，只負責「選出下一個任務 → 綁定配置 → 執行 → 按結果安排下次」。

<SchedulerFlow />

## <DocIcon name="rocket" /> 入口

| 入口 | 用途 |
| --- | --- |
| `uv run python alas.py [实例名]` | 命令行；不傳實例名時用預設 `ap`，實例名非法直接退出碼 2 |
| `AzurLaneAutoScript(config_name).loop()` | worker 主入口 |
| `AzurLaneAutoScript.run(command)` | 單任務入口（WebUI「立即執行」） |
| `config.task_call('Restart')` | 跨任務注入恢復 |
| `AzurLaneAutoScript.stop_event` | 跨處理程序停止事件代理 |

## <DocIcon name="refresh" /> 主循環做了什麼

每輪固定六步：

1. **停止檢查**：`stop_event` 置位則退出，走正常收尾。
2. **維護等待**：`checker.wait_until_available()`；伺服器恢復瞬間刷新配置並注入 `Restart`。
3. **計劃重新啟動**：距上次重新啟動超過 `RestartIntervalHours`（預設 4 小時）時，在任務間隙重新啟動模擬器。
4. **選任務**：`get_next_task()`。
5. **執行**：刷新 `device.config`、清空卡死與連點記錄、啟用執行監護，調用 `run(command)`。
6. **結算**：更新失敗計數、判斷敏感任務、按結果重置計數器。

### 選任務的細節

`config.get_next()` 優先取「已到期且已啟用」的任務中優先級最高的；沒有則取等待佇列裡最近到期的，並給返回副本的 `next_run` 加上囤積時長。

兩個佇列都為空時拋 `RequestHumanTakeover`——提示至少啟用一個任務。

等待超過 3 小時且開啟 `CloseEmulatorDuringLongWait` 時，會關閉模擬器並在醒來後重新拉起。預熱開啟時則相反：提前啟動並登入到主介面。

### wait_until 與熱重載

```python
def wait_until(self, future):
    while True:
        if self.stop_event.is_set():
            exit(0)          # 由父进程归类为「更新退出」
        if self.config.should_reload():
            return False     # 外层丢掉 config 缓存，重新选择任务
        ...
```

每 5 秒檢查一次停止事件與設定檔 mtime。這就是空閒期的配置熱重載：**不做增量合併，直接丟棄整個 config 對象**。

## <DocIcon name="circle-check" /> run() 的三態返回

| 返回 | 含義 | 失敗計數 |
| --- | --- | --- |
| `True` | 成功（含 `TaskEnd`） | 清零 |
| `'recoverable'` | 失敗但已就地安排恢復 | 不變 |
| `False` | 不可恢復失敗 | +1 |

為什麼可恢復失敗不計數：失敗計數驅動的是「強制重新啟動模擬器」這種高代價動作。可恢復錯誤已經各自觸發過針對性恢復，再升級會重複懲罰。

## <DocIcon name="circle-alert" /> 異常矩陣

所有分支的第一動作都是 `_check_sensitive_exit()`：嚴格重新啟動開啟且該任務標記敏感時，儲存現場、推送並 `exit(1)`。

| 異常 | 恢復動作 | 返回 |
| --- | --- | --- |
| `TaskEnd` | 視為正常結束 | `True` |
| `GameNotRunningError` | 注入 `Restart` | `recoverable` |
| `GameStuckError` / `GameTooManyClickError` | 連續達閾值重新啟動模擬器，否則 10 秒後重新啟動遊戲 | `recoverable` |
| `GameBugError` | 重新啟動遊戲 | `recoverable` |
| `GamePageUnknownError` | 查伺服器：可用則重新啟動遊戲，維護中則等待 | `recoverable` / `False` |
| `ScriptError` | 3 次內注入 `Restart`，第 3 次退出 | `recoverable` / `exit(1)` |
| `EmulatorNotRunningError` | 重新啟動模擬器（不放棄，只拉長間隔）+ `Restart` | `recoverable` |
| `RequestHumanTakeover` | 先嚐試重新啟動模擬器自動恢復 | `recoverable` |
| `MindCalculatorScanError` | 記錄原因與截圖，保留舊清單，不重新啟動 | `False` |
| `AutoSearchSetError` | 重新啟動遊戲 | `recoverable` |
| 其他 `Exception` | 連續達閾值升級為重新啟動模擬器 | `recoverable` |

最外層 `except` 是最後防線：上報日誌、重新啟動模擬器、注入 `Restart`，按 `min(300, 20 × 2^(n-1))` 秒退避後重試。

### 終止路徑只有四條

1. `ScriptError` 連續 3 次。
2. 敏感任務失敗。
3. `stop_event`。
4. 配置或設備初始化失敗。

新增分支時不要主動退出。7×24 的前提就是「永不因故障退出」。

## <DocIcon name="refresh" /> 同一任務連續重新啟動上限

`Error.TaskRestartLimit`（預設 3，0 關閉）用獨立的 `task_restart_record` 計數：

- 累計 `recoverable`、`False` 和選出任務後的全局異常；
- 只有**該任務成功**才清零（其他任務成功、`Restart` 成功都不清）；
- 達到上限後把 `NextRun` 寫到伺服器次日零點，發錯誤推送，其他任務繼續；
- `Restart` 豁免，不計入也不被阻擋。

## <DocIcon name="clock" /> 執行緒模型

| 執行緒 | 建立條件 | 職責 |
| --- | --- | --- |
| 主執行緒 | 處理程序啟動 | `loop()` 與任務執行 |
| `alas-watchdog` | 任一監護子功能開啟 | 每 30 秒檢查任務超時、強制定時重新啟動 |
| `daily-summary-scheduler-<name>` | 日報開啟 | 每秒檢查觸發視窗 |
| 模擬器啟停 worker | 每次啟停操作 | 執行 stop/start，600 秒硬超時 |

關鍵約定：

- **監護只在 `run()` 前後啟用**，空閒等待不會誤判。
- **監護殺模擬器而不是殺執行緒**：主執行緒可能阻塞在 ADB/uiautomator2 的 C 調用裡，Python 層無法安全中斷。
- **啟停必須經 `_emulator_op_with_timeout`**。超時放棄的執行緒仍持有平臺鎖，後來的請求會收到 `EmulatorOpBusy` 並被跳過，防止踩踏。
- **跨處理程序停止信號**由 `State.manager.Event()` 建立，普通 `threading.Event` 不能替代。
- **日報執行緒不訪問 `self.config`**，只讀設定檔快照，避免讀到任務中途綁定的參數。

## <DocIcon name="drive" /> 快取與失效

| 數據 | 位置 | 失效時機 |
| --- | --- | --- |
| `config` / `device` / `checker` | `cached_property` | `del_cached_property`：任務結束、錯誤恢復、伺服器恢復、模擬器重新啟動 |
| `failure_record` | 記憶體 | 成功清零，處理程序重新啟動清零 |
| `_warmup_measured_*` | 實例屬性 | 每次預熱成功後覆蓋 |
| `_i18n_task_names` | 模組級 | 處理程序內加載一次 |

注意 `module/config/deep.py` 的 `deep_iter_diff` 目前沒有調用方——熱重載不是基於差異比較，而是 mtime + 整體重建。

## <DocIcon name="circle-plus" /> 擴展：新增可排程任務

1. `task.yaml` 註冊任務與菜單；`argument.yaml` 定義參數（含 `Scheduler` 組）。
2. `module/<功能>/` 實現 `run()`。
3. `alas.py` 添加同名方法。
4. 需要時在 `config_manual.py` 的 `_DEFAULT_SCHEDULER_PRIORITY` 插入預設優先級。
5. 補 `i18n/*.json` 的任務名翻譯。
6. 執行 `uv run -m module.config.config_updater`。

不需要任何註冊動作。業務模組內部通過 `config.check_task_switch()` 感知任務切換，排程器不會中斷正在執行的任務。

## <DocIcon name="shield" /> 修改注意事項

::: danger 五個不要
1. 不要漏掉異常分支裡的 `_check_sensitive_exit()`——敏感任務會在該停機時被自動重新啟動。
2. 不要恢復 `RESTART_SENSITIVE_TASKS` 常量，敏感任務已是動態配置。
3. 不要讓 `loop()` 在新分支裡主動退出。
4. 不要繞過 `_emulator_op_with_timeout` 直接調用平臺啟停。
5. 不要在狀態循環裡 `sleep()` 代替截圖確認。
:::

## <DocIcon name="wrench" /> 調試

| 手段 | 說明 |
| --- | --- |
| 日誌 | 搜 `[AzurPilot]` 看排程決策鏈 |
| 錯誤現場 | `log/error/<实例>/<时间戳>/` |
| 執行監護 | 臨時開 `WatchdogEnable` + `WatchdogTaskEnable` 驗證是否邏輯死循環 |
| 單任務 | WebUI「立即執行」走 `run(command)`，跳過排程 |
| 外部排程器 | 只用啟動命令、配置、日誌、處理程序終止四個面，見[外部契約](#外部排程器契約) |

### 外部排程器契約

AUTO-MAS 一類外部工具把 AzurPilot 當黑箱：

| 面 | 約定 |
| --- | --- |
| 啟動 | `uv run python alas.py <实例名>`，工作目錄為專案根 |
| 配置 | 讀寫 `config/<实例名>.json`，字段語義歸配置系統 |
| 日誌 | `log/<日期>_<实例名>.txt`，以「開始任務 / 結束任務」為邊界 |
| 停止 | 終止處理程序樹；沒有停止檔案 |

`module/logger.py` 在匯入時會把工作目錄切到專案根，所以外部工具不需要設定 cwd，但一個實例必須獨佔一個處理程序。
