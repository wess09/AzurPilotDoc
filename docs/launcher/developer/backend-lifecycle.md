---
title: 后端进程生命周期
description: Windows Job Object、模拟器脱离、环境标记兜底、Unix 进程组、子进程 PATH 隔离以及 3.0.5 重建清理：退出启动器时哪些进程应该死，哪些必须活。
updated: 2026-10-31
---

# 后端进程生命周期

启动器退出或重新安装时最容易出的两个错误是：**该杀的没杀**（`gui.py` / `main.py` 或后台 worker 泄漏锁死端口）和**不该杀的杀了**（游戏模拟器被连带关闭）。本文档解析多平台下进程树管理、生命周期边界与清理机制。

## <DocIcon name="box" /> 进程树与生命周期边界

```text
AzurPilot / ntep-launcher（启动器主进程）
├── [构建阶段短暂子进程: deploy.app / npm 构建 (仅注入独立 Node.js PATH)]
└── gui.py / main.py（后端主服务）
    ├── instance worker（调度器/任务工作进程）
    └── 模拟器（由 worker 启动，但必须脱离后端生命周期）
```

不同阶段的目标要求：

| 进程类型 | 正常退出启动器时 | 安装器覆盖/卸载时 | 环境重建清理时 |
| --- | --- | --- | --- |
| `gui.py` / `main.py` | **必须结束** | **必须结束** | **必须结束** |
| instance worker / Python 子进程 | **必须结束** | **必须结束** | **必须结束** |
| 前端构建 Node.js/npm 子进程 | **瞬态结束**（任务退出即销毁） | 必须结束 | 必须结束 |
| 模拟器（MuMu / 雷电等） | **必须保留** | 保留 | 保留 |

## <DocIcon name="monitor" /> Windows：Job Object 与脱离机制

在 Windows 平台上，启动器为后端根进程创建专用 Windows Job Object，并配置以下限制：

| Job Object 限制标志 | 作用与要求 |
| --- | --- |
| `JOB_OBJECT_LIMIT_BREAKAWAY_OK` | 允许具有脱离权限的特定子进程（如模拟器）显式请求脱离当前 Job |
| `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` | 最后一个 Job 句柄关闭或启动器退出时，自动回收属于该 Job 的普通 worker 进程 |

::: danger 禁止使用 SILENT_BREAKAWAY
若配置 `JOB_OBJECT_LIMIT_SILENT_BREAKAWAY_OK`，所有普通 Python worker 也会静默脱离 Job，导致启动器退出后后台子进程大面积泄漏。必须严格坚持「显式声明与请求才允许脱离」。
:::

### 模拟器防止误杀协议

Windows 系统默认会将父进程的 Job 归属沿后代继承。若不显式处理，后端通过 `subprocess` 或 `start` 启动的模拟器仍属于后端 Job，启动器退出或 `TerminateJobObject` 时会导致模拟器被误关。

解决方案为双向协同协议：

1. **启动器声明支持脱离**：启动器向后端环境注入 `ALAS_LAUNCHER_JOB_BREAKAWAY=1`。
2. **后端显式请求脱离**：后端在检测到该环境变量时，使用 `CREATE_BREAKAWAY_FROM_JOB` 标志创建模拟器进程。
3. **清洗环境变量**：在模拟器子进程的环境中，显式剥离 `ALAS_LAUNCHER_PID`、`ALAS_LAUNCHER_JOB_BREAKAWAY` 与 `ALAS_WEBUI_TRUST_SECRET`，避免模拟器命中残留进程扫描逻辑。

### 根进程创建与句柄生命周期

1. 启动器以挂起状态（`CREATE_SUSPENDED`）创建 Python 根进程。
2. 将该根进程句柄加入 Job Object。
3. 恢复根进程运行（`ResumeThread`）。
4. 若加入 Job 或恢复执行失败，立即终止并清理根进程，避免启动竞态。Job 句柄由 RAII 封装，退出或异常展开时确保句柄关闭。

### 显式退出等待与确认

在用户请求退出或后端主动停止时：
- 启动器除等待根进程退出外，还会轮询 Job 的活动进程计数（Active Processes），最长等待 5 秒确认普通 worker 全部退出。
- 只有确认计数清零后才宣告清理完成，不能将「根进程先退出」误当作「整组子进程已安全回收」。

## <DocIcon name="laptop" /> Unix：进程组隔离

在 macOS 与 Linux 平台上，系统不具备原生 Windows Job Object：

- 后端在独立的进程组（Process Group，通过 `setpgid`）中启动。
- 启动器退出时，向该进程组发送 `SIGTERM`（超时后 `SIGKILL`）批量回收子进程。
- 模拟器等外部应用通过独立会话（`setsid`）启动，脱离当前进程组生命周期。

## <DocIcon name="wrench" /> 安装与重建清理策略

除了日常运行退出，安装器与环境自举模块也实现了安全进程清理逻辑：

### 1. Inno Setup 安装与卸载清理 (`install.iss`)

在 Windows 下执行安装、更新或卸载时，若旧版进程未退出，会导致可执行文件被锁定无法覆盖。`install.iss` 内置 `StopRunningProcesses` 过程：

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

在安装前（`PrepareToInstall`）与卸载前（`CurUninstallStepChanged`）自动调用，强制终止残留启动器与 Python 进程，杜绝文件占用报错。

### 2. 运行时重建清理 (`setup.rs` 中的 `kill_runtime_processes`)

当用户触发「环境修复」或重新自举时，`setup.rs` 执行安全回收：

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

- 精准定位：仅终止可执行文件路径或工作目录**位于当前工作区内部**的进程，绝不误杀系统其他 Python 进程或工作区外部程序。
- 终止后等待句柄释放，确保随后的 `.venv` 删除与重建不受干扰。
- 3.0.5 修复流程进一步联动 `components::download_deploy_bootstrap(..., repair: true)`，在进程回收后重新下载并替换全部引导脚本与系统模板，确保损坏的旧脚本不会再次触发异常。

## <DocIcon name="shield" /> 兜底机制：环境变量扫描

作为最后防线，启动器在退出前还会扫描系统进程表，核对继承了 `ALAS_LAUNCHER_PID` 的子进程并执行最终回收。这也是模拟器在启动时必须清除该变量的原因。

## <DocIcon name="flask" /> 验证与测试

```bash
cargo check --locked --all-targets
cargo test --locked --all-targets
```

测试验证了三种核心边界路径：
1. 显式退出 → 后端与工作进程退出，脱离的模拟器持续存活。
2. 异常关闭 Job 句柄 → 所有附属子进程全部回收。
3. 根进程异常崩溃 → 挂靠在 Job 内的子代工作进程依然被连带回收，无僵尸进程残留。

详见[Tauri 与 Rust 架构](/launcher/developer/architecture)与[构建与发布](/launcher/developer/build-release)。
