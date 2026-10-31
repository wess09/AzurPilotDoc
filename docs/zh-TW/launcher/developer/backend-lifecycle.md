---
title: 後端處理程序生命週期
description: Windows Job Object、模擬器脫離、環境標記兜底、Unix 處理程序組以及安裝器/重建清理：退出啟動器時哪些處理程序應該死，哪些必須活。
updated: 2026-10-31
---

# 後端處理程序生命週期

啟動器退出或重新安裝時最容易出的兩個錯誤是：**該殺的沒殺**（`gui.py` / `main.py` 或後臺 worker 洩漏鎖死連接埠）和**不該殺的殺了**（遊戲模擬器被連帶關閉）。本說明文件解析多平臺下處理程序樹管理、生命週期邊界與清理機制。

## <DocIcon name="box" /> 處理程序樹與生命週期邊界

```text
alas-launcher / ntep-launcher（启动器主进程）
└── gui.py / main.py（后端主服务）
    ├── instance worker（调度器/任务工作进程）
    └── 模拟器（由 worker 启动，但必须脱离后端生命周期）
```

不同階段的目標要求：

| 處理程序類型 | 正常退出啟動器時 | 安裝器覆蓋/解除安裝時 | 環境重建清理時 |
| --- | --- | --- | --- |
| `gui.py` / `main.py` | **必須結束** | **必須結束** | **必須結束** |
| instance worker / Python 子處理程序 | **必須結束** | **必須結束** | **必須結束** |
| 模擬器（MuMu / 雷電等） | **必須保留** | 保留 | 保留 |

## <DocIcon name="monitor" /> Windows：Job Object 與脫離機制

在 Windows 平臺上，啟動器為後端根處理程序建立專用 Windows Job Object，並配置以下限制：

| Job Object 限制標誌 | 作用與要求 |
| --- | --- |
| `JOB_OBJECT_LIMIT_BREAKAWAY_OK` | 允許具有脫離權限的特定子處理程序（如模擬器）顯式請求脫離當前 Job |
| `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` | 最後一個 Job 句柄關閉或啟動器退出時，自動回收屬於該 Job 的普通 worker 處理程序 |

::: danger 禁止使用 SILENT_BREAKAWAY
若配置 `JOB_OBJECT_LIMIT_SILENT_BREAKAWAY_OK`，所有普通 Python worker 也會靜默脫離 Job，導致啟動器退出後後臺子處理程序大面積洩漏。必須嚴格堅持「顯式聲明與請求才允許脫離」。
:::

### 模擬器防止誤殺協議

Windows 系統預設會將父處理程序的 Job 歸屬沿後代繼承。若不顯式處理，後端通過 `subprocess` 或 `start` 啟動的模擬器仍屬於後端 Job，啟動器退出或 `TerminateJobObject` 時會導致模擬器被誤關。

解決方案為雙向協同協議：

1. **啟動器聲明支援脫離**：啟動器向後端環境注入 `ALAS_LAUNCHER_JOB_BREAKAWAY=1`。
2. **後端顯式請求脫離**：後端在檢測到該環境變數時，使用 `CREATE_BREAKAWAY_FROM_JOB` 標誌建立模擬器處理程序。
3. **清洗環境變數**：在模擬器子處理程序的環境中，顯式剝離 `ALAS_LAUNCHER_PID`、`ALAS_LAUNCHER_JOB_BREAKAWAY` 與 `ALAS_WEBUI_TRUST_SECRET`，避免模擬器命中殘留處理程序掃描邏輯。

### 根處理程序建立與句柄生命週期

1. 啟動器以掛起狀態（`CREATE_SUSPENDED`）建立 Python 根處理程序。
2. 將該根處理程序句柄加入 Job Object。
3. 恢復根處理程序執行（`ResumeThread`）。
4. 若加入 Job 或恢復執行失敗，立即終止並清理根處理程序，避免啟動競態。Job 句柄由 RAII 封裝，退出或異常展開時確保句柄關閉。

### 顯式退出等待與確認

在用戶請求退出或後端主動停止時：
- 啟動器除等待根處理程序退出外，還會輪詢 Job 的活動處理程序計數（Active Processes），最長等待 5 秒確認普通 worker 全部退出。
- 只有確認計數清零後才宣告清理完成，不能將「根處理程序先退出」誤當作「整組子處理程序已安全回收」。

## <DocIcon name="laptop" /> Unix：處理程序組隔離

在 macOS 與 Linux 平臺上，系統不具備原生 Windows Job Object：

- 後端在獨立的處理程序組（Process Group，通過 `setpgid`）中啟動。
- 啟動器退出時，向該處理程序組發送 `SIGTERM`（超時後 `SIGKILL`）批量回收子處理程序。
- 模擬器等外部應用通過獨立會話（`setsid`）啟動，脫離當前處理程序組生命週期。

## <DocIcon name="wrench" /> 安裝與重建清理策略

除了日常執行退出，安裝器與環境自舉模組也實現了安全處理程序清理邏輯：

### 1. Inno Setup 安裝與解除安裝清理 (`install.iss`)

在 Windows 下執行安裝、更新或解除安裝時，若舊版處理程序未退出，會導致可執行檔案被鎖定無法覆蓋。`install.iss` 內置 `StopRunningProcesses` 過程：

```pascal
procedure KillProcessByImageName(const ImageName: String);
var ResultCode: Integer;
begin
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /T /IM ' + ImageName, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

procedure StopRunningProcesses;
begin
  KillProcessByImageName('{#AppExeName}');
  KillProcessByImageName('pythonw.exe');
  KillProcessByImageName('python.exe');
  Sleep(1000);
end;
```

在安裝前（`PrepareToInstall`）與解除安裝前（`CurUninstallStepChanged`）自動調用，強制終止殘留啟動器與 Python 處理程序，杜絕檔案佔用報錯。

### 2. 執行時重建清理 (`setup.rs` 中的 `kill_runtime_processes`)

當用戶觸發「環境修復」或重新自舉時，`setup.rs` 執行安全回收：

```rust
fn kill_runtime_processes(workspace: &Path) {
    let current_pid = std::process::id();
    let sys = sysinfo::System::new_all();
    for (pid, process) in sys.processes() {
        if pid.as_u32() == current_pid { continue; }
        let should_kill = process.exe().map(|exe| path_is_inside(exe, workspace)).unwrap_or(false)
            || process.cwd().map(|cwd| path_is_inside(cwd, workspace)).unwrap_or(false);
        if should_kill {
            let _ = process.kill();
        }
    }
}
```

- 精準定位：僅終止可執行檔案路徑或工作目錄**位於當前工作區內部**的處理程序，絕不誤殺系統其他 Python 處理程序或工作區外部程序。
- 終止後等待句柄釋放，確保隨後的 `.venv` 刪除與重建不受干擾。

## <DocIcon name="shield" /> 兜底機制：環境變數掃描

作為最後防線，啟動器在退出前還會掃描系統處理程序表，核對繼承了 `ALAS_LAUNCHER_PID` 的子處理程序並執行最終回收。這也是模擬器在啟動時必須清除該變數的原因。

## <DocIcon name="flask" /> 驗證與測試

```bash
cargo check --locked --all-targets
cargo test --locked --all-targets
```

測試驗證了三種核心邊界路徑：
1. 顯式退出 → 後端與工作處理程序退出，脫離的模擬器持續存活。
2. 異常關閉 Job 句柄 → 所有附屬子處理程序全部回收。
3. 根處理程序異常崩潰 → 掛靠在 Job 內的子代工作處理程序依然被連帶回收，無殭屍處理程序殘留。

詳見[Tauri 與 Rust 架構](/zh-TW/launcher/developer/architecture)與[構建與發佈](/zh-TW/launcher/developer/build-release)。
