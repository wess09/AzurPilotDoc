---
title: 後端處理程序生命週期
description: Windows Job Object、模擬器脫離、環境標記兜底與 Unix 處理程序組：退出啟動器時哪些處理程序應該死，哪些必須活。
updated: 2026-10-20
---

# 後端處理程序生命週期

啟動器退出時最容易出的兩個錯誤是：**該殺的沒殺**（`gui.py` 洩漏）和**不該殺的殺了**（模擬器被一起關閉）。這一頁解釋兩者如何用同一套機制區分。

## <DocIcon name="box" /> 處理程序樹

```text
alas-launcher（启动器）
└── gui.py（后端）
    ├── instance worker（调度器）
    └── 模拟器（由 worker 启动，但应脱离后端生命周期）
```

目標很明確：

| 處理程序 | 退出啟動器時 |
| --- | --- |
| `gui.py` | 必須結束 |
| instance worker | 必須結束 |
| 模擬器 | **保留** |

## <DocIcon name="monitor" /> Windows：Job Object

`backend_process.rs` 為後端建立一個 Job，設定：

| 限制 | 作用 |
| --- | --- |
| `JOB_OBJECT_LIMIT_BREAKAWAY_OK` | 允許子處理程序顯式請求脫離 |
| `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` | 最後一個 Job 句柄關閉時回收普通 worker |

::: danger 不能用 SILENT_BREAKAWAY
`JOB_OBJECT_LIMIT_SILENT_BREAKAWAY_OK` 會讓普通 Python worker 也自動脫離，導致退出後處理程序洩漏。必須是「顯式請求才能脫離」。
:::

### 為什麼模擬器會被誤殺

Windows 會把 Job 歸屬傳給後代。即使後端用短命的 `cmd /c start` 斷開處理程序樹，模擬器仍在原來的 Job 裡，`TerminateJobObject` 會連帶關閉它。

解決方案是雙方協議：

1. 啟動器向後端注入 `ALAS_LAUNCHER_JOB_BREAKAWAY=1`，聲明「我支援脫離」。
2. 後端的 `PlatformWindows.execute(wait=False)` 檢測到該變數後，給啟動命令加 `CREATE_BREAKAWAY_FROM_JOB`。
3. 同時從複製的環境中解除安裝 `ALAS_LAUNCHER_PID`、`ALAS_LAUNCHER_JOB_BREAKAWAY`、`ALAS_WEBUI_TRUST_SECRET`。

這樣模擬器既不屬於後端 Job，也不會被殘留處理程序掃描誤殺。

::: warning 協議必須兩邊一起更新
舊版後端不會請求脫離，舊啟動器不允許脫離。只改一邊就宣稱修復，結果是「要麼模擬器被關，要麼 worker 洩漏」。
:::

### 根處理程序的建立順序

1. 以掛起狀態建立 Python 根處理程序。
2. 登記到 Job。
3. 恢復執行。

登記或恢復失敗時終止並回收根處理程序，避免啟動競態和殘留。Job 句柄由 `OwnedHandle` 持有，初始化失敗、正常退出、錯誤展開都會釋放。

### 顯式終止

除等待根處理程序外，還查詢 Job 的活動處理程序數，最多等 5 秒確認普通 worker 全部退出。超時或查詢失敗返回錯誤——**不能把根處理程序退出誤報為整組清理完成**。

## <DocIcon name="laptop" /> Unix：處理程序組

Unix 沒有 Job Object，使用處理程序組：

- 後端在獨立處理程序組中啟動。
- 退出時向處理程序組發信號，等待回收。
- 模擬器的脫離依賴啟動方式（例如 `setsid`），與 Windows 的能力聲明是兩套邏輯。

## <DocIcon name="key" /> 兜底：環境標記

即便 Job/處理程序組都不生效，啟動器還會在退出時掃描處理程序表，查找繼承了 `ALAS_LAUNCHER_PID` 的處理程序並回收。

這就是為什麼模擬器啟動前要**解除安裝**該環境變數——否則它會命中兜底清理。

## <DocIcon name="flask" /> 測試

```bash
cargo test --locked backend_process::tests
```

測試程序自己充當後端、worker 和模擬器，檢查三條路徑：

1. 顯式終止 → 根處理程序與普通 worker 退出，脫離的模擬器存活。
2. 丟棄 Job 句柄 → 同上。
3. 根處理程序提前退出 → 後代仍被回收。

測試通過已打開的專用處理程序句柄清理偽模擬器，不操作真實模擬器。

核心倉庫的 `tests.test_emulator_process_lifetime` 驗證能力判斷、環境清理、同步管理命令與失敗分支。

::: tip Windows 本地測試
manifest 要求管理員權限。未提權時完整測試程序會因錯誤 740 無法啟動。可以在臨時 Cargo 測試專案裡通過 `#[path]` 加載 `backend_process.rs` 與 `window_util.rs` 執行同一組測試——但這隻隔離了測試殼，**不能當作全部啟動器測試通過**。完整編譯另用 `cargo check --locked --all-targets`。
:::

## <DocIcon name="clipboard" /> 修改檢查清單

- [ ] 新子處理程序是否繼承了不該繼承的環境變數
- [ ] 模擬器啟動路徑是否請求了 breakaway
- [ ] 退出路徑是否既等根處理程序、又確認 worker 退出
- [ ] Job 句柄是否在所有分支釋放
- [ ] Unix 分支是否仍然有效
- [ ] 三平臺測試是否都跑過
- [ ] 是否在真機上確認「退出啟動器後模擬器仍在」

## <DocIcon name="file" /> 參考

- [Microsoft Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
- 倉庫內 `docs/backend-lifecycle.md`
