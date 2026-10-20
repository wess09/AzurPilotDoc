---
title: Scheduler Lifecycle
description: Main loop of alas.py, task selection algorithms, tiered exception recovery, thread architecture, and cache policies.
updated: 2026-10-20
---

# Scheduler Lifecycle

`alas.py` forms the core of the automation engine. It implements no game actions directly; its role is selecting the next due task, binding configuration schemas, executing the routine, and scheduling subsequent runs based on the outcome.

<SchedulerFlow />

## <DocIcon name="rocket" /> Entry Points

| Invocation | Purpose |
| --- | --- |
| `uv run python alas.py [instance]` | CLI entry point (defaults to `ap`; invalid names exit with code 2) |
| `AzurLaneAutoScript(config_name).loop()` | Primary worker process loop |
| `AzurLaneAutoScript.run(command)` | Direct single-task runner (WebUI "Run Now") |
| `config.task_call('Restart')` | Injects recovery task into queue |
| `AzurLaneAutoScript.stop_event` | Cross-process termination signal |

## <DocIcon name="refresh" /> Main Loop Execution Steps

Each scheduling loop executes six distinct phases:

1. **Termination Check**: If `stop_event` is set, exit cleanly.
2. **Maintenance Probe**: Invokes `checker.wait_until_available()`; upon maintenance conclusion, flushes configuration and injects `Restart`.
3. **Scheduled Restarts**: If the elapsed duration exceeds `RestartIntervalHours` (default 4 hours), reboots the emulator during task intervals.
4. **Task Selection**: Invokes `get_next_task()`.
5. **Execution**: Refreshes `device.config`, clears stuck counters, engages watchdogs, and calls `run(command)`.
6. **Post-Execution Settlement**: Updates failure metrics, validates sensitive mode rules, and resets counters on success.

### Task Selection Algorithm

`config.get_next()` selects the highest-priority task among those that are both enabled and due. If none are ready, it selects the earliest pending task and adds the configured hoarding delay to its execution timestamp.

If both queues are empty, it raises `RequestHumanTakeover` to notify the user that at least one task must be enabled.

If the wait duration exceeds 3 hours and `CloseEmulatorDuringLongWait` is active, the emulator shuts down, rebooting when the task becomes due. If pre-execution warmup is active, the emulator launches early to arrive at the game main screen ahead of schedule.

### `wait_until` and Hot Reloads

```python
def wait_until(self, future):
    while True:
        if self.stop_event.is_set():
            exit(0)          # Classified by parent process as an update exit
        if self.config.should_reload():
            return False     # Drops cached config and re-selects task
        ...
```

The loop checks termination signals and configuration file modification timestamps (`mtime`) every 5 seconds. Configuration hot-reloading drops the entire `config` object rather than calculating incremental diffs.

## <DocIcon name="circle-check" /> Three-State Return Values from `run()`

| Return Value | Meaning | Impact on Failure Counter |
| --- | --- | --- |
| `True` | Successful completion (including `TaskEnd`) | Cleared to zero |
| `'recoverable'` | Handled error with in-place recovery scheduled | Counter unchanged |
| `False` | Unrecoverable error | Incremented (+1) |

Recoverable errors do not increment the failure counter because the counter governs high-cost remediation actions like forced emulator reboots. Recoverable errors have already executed targeted recovery.

## <DocIcon name="circle-alert" /> Exception Recovery Matrix

All error branches begin by invoking `_check_sensitive_exit()`: if strict restart is active and the task is marked sensitive, the engine captures error state, sends a notification, and terminates with `exit(1)`.

| Exception Type | Recovery Action | Return Value |
| --- | --- | --- |
| `TaskEnd` | Treated as normal task completion | `True` |
| `GameNotRunningError` | Injects `Restart` task | `recoverable` |
| `GameStuckError` / `GameTooManyClickError` | Reboots emulator if threshold is met; otherwise restarts game after 10s | `recoverable` |
| `GameBugError` | Restarts game application | `recoverable` |
| `GamePageUnknownError` | Probes server: restarts game if online, pauses if under maintenance | `recoverable` / `False` |
| `ScriptError` | Injects `Restart` for first 2 attempts; exits on 3rd attempt | `recoverable` / `exit(1)` |
| `EmulatorNotRunningError` | Reboots emulator (expands backoff delay) and injects `Restart` | `recoverable` |
| `RequestHumanTakeover` | Attempts emulator reboot before halting | `recoverable` |
| `MindCalculatorScanError` | Logs diagnostic frames; retains existing scan data; does not reboot | `False` |
| `AutoSearchSetError` | Restarts game application | `recoverable` |
| General `Exception` | Reboots emulator if consecutive failure limit is met | `recoverable` |

The outermost `except` block captures residual exceptions: logs diagnostics, reboots the emulator, injects `Restart`, and retries under exponential backoff (`min(300, 20 × 2^(n-1))` seconds).

### Four Termination Conditions

1. Three consecutive `ScriptError` exceptions.
2. Failure during sensitive tasks.
3. Explicit `stop_event` signal.
4. Unrecoverable failures during initial configuration or device setup.

## <DocIcon name="refresh" /> Task Restart Limits

`Error.TaskRestartLimit` (default 3; 0 disables) tracks failures per task using `task_restart_record`:

- Increments across `recoverable`, `False`, and global exceptions during task execution;
- Resets to zero **only when that specific task succeeds**;
- When the threshold is reached, updates the task's `NextRun` timestamp to server reset time and dispatches an alert while remaining tasks continue;
- The `Restart` task is exempt from this limit.

## <DocIcon name="clock" /> Threading Model

| Thread | Creation Condition | Responsibility |
| --- | --- | --- |
| Main Thread | Process boot | Executes `loop()` and task routines |
| `alas-watchdog` | Any watchdog feature enabled | Evaluates task timeouts and scheduled reboots every 30s |
| `daily-summary-scheduler-<name>` | Daily summary enabled | Evaluates trigger windows every second |
| Emulator Worker | During start/stop operations | Runs emulator management with 600s timeout |

Key threading conventions:

- **Watchdogs activate exclusively during active `run()` execution**; idle waits are never flagged as timeouts.
- **Watchdogs terminate the emulator process rather than killing threads**: Python cannot safely terminate threads blocked inside native C bindings.
- **Emulator operations must traverse `_emulator_op_with_timeout`** to prevent deadlocks and race conditions.
- **Process termination events** use `State.manager.Event()` across process boundaries.
- **Daily summary threads read configuration snapshots**, avoiding reads on mutated in-flight configurations.

## <DocIcon name="drive" /> Cache Invalidation

| Cached Asset | Storage Location | Invalidation Point |
| --- | --- | --- |
| `config` / `device` / `checker` | `cached_property` | `del_cached_property` on task end, error recovery, maintenance end, or reboot |
| `failure_record` | Memory | Cleared on success or worker process restart |
| `_warmup_measured_*` | Instance attribute | Overwritten following successful warmup runs |
| `_i18n_task_names` | Module scope | Loaded once per process |

Note that `deep_iter_diff` in `module/config/deep.py` is currently unused—reloading relies on file `mtime` checks and full reconstruction.

## <DocIcon name="circle-plus" /> Adding Schedulable Tasks

1. Register task and menu entries in `task.yaml`; define schema in `argument.yaml` (including `Scheduler` group).
2. Implement feature logic in `module/<feature>/` providing a `run()` method.
3. Implement matching dispatch method on `alas.py`.
4. Optionally insert default priorities in `_DEFAULT_SCHEDULER_PRIORITY` in `config_manual.py`.
5. Add localized strings in `i18n/*.json`.
6. Compile schemas via `uv run -m module.config.config_updater`.

## <DocIcon name="shield" /> Implementation Guardrails

::: danger Invariants
1. Never omit `_check_sensitive_exit()` within error branches.
2. Do not restore the legacy `RESTART_SENSITIVE_TASKS` constant; sensitivity is determined dynamically from configuration.
3. Do not terminate the main `loop()` unexpectedly inside error handlers.
4. Never call emulator lifecycle methods directly; always use `_emulator_op_with_timeout`.
5. Never replace image confirmation checks with `sleep()` in state loops.
:::

## <DocIcon name="wrench" /> Debugging

| Technique | Description |
| --- | --- |
| Log Inspection | Search for `[AzurPilot]` in logs to trace decision trees |
| Crash Snapshots | Review frame captures in `log/error/<instance>/<timestamp>/` |
| Watchdog Toggles | Enable `WatchdogEnable` + `WatchdogTaskEnable` to catch infinite loops |
| Direct Run | Use WebUI "Run Now" to invoke `run(command)` directly, bypassing the queue |
| External Schedulers | Interface via standard CLI and configuration contracts |

### External Scheduler Contract

External orchestrators (such as AUTO-MAS) treat AzurPilot as a modular black box:

| Boundary | Contract |
| --- | --- |
| Execution | `uv run python alas.py <instance>` executed from repository root |
| Settings | Read and write `config/<instance>.json` adhering to config schemas |
| Telemetry | Stream `log/<date>_<instance>.txt` using start/end dividers as boundaries |
| Termination | Terminate process tree directly; no lock files are required |

`module/logger.py` changes the working directory to the project root on import, ensuring path consistency.
