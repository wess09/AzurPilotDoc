---
title: 后端进程生命周期
description: Windows Job Object、模拟器脱离、环境标记兜底与 Unix 进程组：退出启动器时哪些进程应该死，哪些必须活。
updated: 2026-10-20
---

# 后端进程生命周期

启动器退出时最容易出的两个错误是：**该杀的没杀**（`gui.py` 泄漏）和**不该杀的杀了**（模拟器被一起关闭）。这一页解释两者如何用同一套机制区分。

## <DocIcon name="box" /> 进程树

```text
alas-launcher（启动器）
└── gui.py（后端）
    ├── instance worker（调度器）
    └── 模拟器（由 worker 启动，但应脱离后端生命周期）
```

目标很明确：

| 进程 | 退出启动器时 |
| --- | --- |
| `gui.py` | 必须结束 |
| instance worker | 必须结束 |
| 模拟器 | **保留** |

## <DocIcon name="monitor" /> Windows：Job Object

`backend_process.rs` 为后端创建一个 Job，设置：

| 限制 | 作用 |
| --- | --- |
| `JOB_OBJECT_LIMIT_BREAKAWAY_OK` | 允许子进程显式请求脱离 |
| `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` | 最后一个 Job 句柄关闭时回收普通 worker |

::: danger 不能用 SILENT_BREAKAWAY
`JOB_OBJECT_LIMIT_SILENT_BREAKAWAY_OK` 会让普通 Python worker 也自动脱离，导致退出后进程泄漏。必须是「显式请求才能脱离」。
:::

### 为什么模拟器会被误杀

Windows 会把 Job 归属传给后代。即使后端用短命的 `cmd /c start` 断开进程树，模拟器仍在原来的 Job 里，`TerminateJobObject` 会连带关闭它。

解决方案是双方协议：

1. 启动器向后端注入 `ALAS_LAUNCHER_JOB_BREAKAWAY=1`，声明「我支持脱离」。
2. 后端的 `PlatformWindows.execute(wait=False)` 检测到该变量后，给启动命令加 `CREATE_BREAKAWAY_FROM_JOB`。
3. 同时从复制的环境中移除 `ALAS_LAUNCHER_PID`、`ALAS_LAUNCHER_JOB_BREAKAWAY`、`ALAS_WEBUI_TRUST_SECRET`。

这样模拟器既不属于后端 Job，也不会被残留进程扫描误杀。

::: warning 协议必须两边一起更新
旧版后端不会请求脱离，旧启动器不允许脱离。只改一边就宣称修复，结果是「要么模拟器被关，要么 worker 泄漏」。
:::

### 根进程的创建顺序

1. 以挂起状态创建 Python 根进程。
2. 登记到 Job。
3. 恢复运行。

登记或恢复失败时终止并回收根进程，避免启动竞态和残留。Job 句柄由 `OwnedHandle` 持有，初始化失败、正常退出、错误展开都会释放。

### 显式终止

除等待根进程外，还查询 Job 的活动进程数，最多等 5 秒确认普通 worker 全部退出。超时或查询失败返回错误——**不能把根进程退出误报为整组清理完成**。

## <DocIcon name="laptop" /> Unix：进程组

Unix 没有 Job Object，使用进程组：

- 后端在独立进程组中启动。
- 退出时向进程组发信号，等待回收。
- 模拟器的脱离依赖启动方式（例如 `setsid`），与 Windows 的能力声明是两套逻辑。

## <DocIcon name="key" /> 兜底：环境标记

即便 Job/进程组都不生效，启动器还会在退出时扫描进程表，查找继承了 `ALAS_LAUNCHER_PID` 的进程并回收。

这就是为什么模拟器启动前要**移除**该环境变量——否则它会命中兜底清理。

## <DocIcon name="flask" /> 测试

```bash
cargo test --locked backend_process::tests
```

测试程序自己充当后端、worker 和模拟器，检查三条路径：

1. 显式终止 → 根进程与普通 worker 退出，脱离的模拟器存活。
2. 丢弃 Job 句柄 → 同上。
3. 根进程提前退出 → 后代仍被回收。

测试通过已打开的专用进程句柄清理伪模拟器，不操作真实模拟器。

核心仓库的 `tests.test_emulator_process_lifetime` 验证能力判断、环境清理、同步管理命令与失败分支。

::: tip Windows 本地测试
manifest 要求管理员权限。未提权时完整测试程序会因错误 740 无法启动。可以在临时 Cargo 测试项目里通过 `#[path]` 加载 `backend_process.rs` 与 `window_util.rs` 运行同一组测试——但这只隔离了测试壳，**不能当作全部启动器测试通过**。完整编译另用 `cargo check --locked --all-targets`。
:::

## <DocIcon name="clipboard" /> 修改检查清单

- [ ] 新子进程是否继承了不该继承的环境变量
- [ ] 模拟器启动路径是否请求了 breakaway
- [ ] 退出路径是否既等根进程、又确认 worker 退出
- [ ] Job 句柄是否在所有分支释放
- [ ] Unix 分支是否仍然有效
- [ ] 三平台测试是否都跑过
- [ ] 是否在真机上确认「退出启动器后模拟器仍在」

## <DocIcon name="file" /> 参考

- [Microsoft Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
- 仓库内 `docs/backend-lifecycle.md`
