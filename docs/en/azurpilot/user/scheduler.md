---
title: Scheduler & Task Orchestration
description: Task execution schedules, priority rules, recovery mechanisms, intervals, hoarding, warmup, and sensitive tasks.
updated: 2026-10-20
---

# Scheduler & Task Orchestration

The scheduler addresses one fundamental question: **which task should execute right now**. It contains no in-game logic and executes tasks strictly one at a time within each instance.

<SchedulerFlow />

<Figure caption="Configurations reload from disk at every loop iteration. Hot reloads occur at task boundaries rather than during active task execution." />

## <DocIcon name="clipboard" /> Task Lifecycle States

Tasks depend on three primary configuration parameters:

| Parameter | Meaning |
| --- | --- |
| `Scheduler.Enable` | Whether the task is admitted into the scheduler queue |
| `Scheduler.NextRun` | Timestamp when the task is next eligible to execute (persisted in configuration) |
| `Scheduler.Command` | Internal task identifier corresponding to a method on `alas.py` |

When `NextRun` is earlier than current time and the task is enabled, it joins the ready set. The scheduler selects the highest-priority task from this set; if no tasks are ready, it sleeps until the earliest `NextRun` timestamp.

::: tip Clearing NextRun Triggers Immediate Execution
Clearing the "Next Run Time" input field sets the timestamp to the past, forcing immediate execution on the next scheduling loop.
:::

## <DocIcon name="crown" /> Priority Rules

Default task priorities are defined in `_DEFAULT_SCHEDULER_PRIORITY` inside `module/config/config_manual.py`. Users can override this order:

> System Settings → General Settings → **Custom Task Priority**

List task command identifiers one per line in descending priority:

```text
Restart
Commission
Research
Reward
OpsiScheduling
Main
```

Unlisted tasks follow behind in their default relative order.

::: warning Priorities Only Break Ties
Priority ordering only determines which task begins when multiple tasks are ready simultaneously. Tasks cannot be preempted mid-execution; configure a task's own stopping conditions if you want it to conclude sooner.
:::

## <DocIcon name="clock" /> Timing Intervals

| Property | Description |
| --- | --- |
| `SuccessInterval` | Minutes to delay next run upon successful completion (0 allows task self-scheduling) |
| `FailureInterval` | Minutes to delay next run upon failure (defaults to 120) |
| `ServerUpdate` | Daily server reset time, serving as the scheduling baseline for daily tasks |

Tasks invoke `task_delay(success=True/False)` to persist their next run timestamp. Frequencies vary widely: commissions run every 15–30 minutes, research projects run every few hours, and daily missions schedule once per day following server resets.

### <DocIcon name="package" /> Task Hoarding

When `Optimization.TaskHoardingDuration` is greater than 0, due tasks are postponed by the hoarding duration. For example, a task due at 12:00 with a 10-minute hoarding duration executes no earlier than 12:10.

Hoarding batches multiple dispersed tasks together, minimizing emulator wake-up cycles at the expense of strict timing precision.

### <DocIcon name="zap" /> Pre-Execution Warmup

When `Optimization.WarmupEnable` is active, the scheduler launches the emulator and boots the game to the home screen ahead of scheduled task execution. The lead time derives from historical launch duration + 2 minutes, falling back to `WarmupMinutes` (default 15 minutes) if unmeasured.

This avoids launch delays on slower machines, ensuring the game is interactive the moment tasks become due.

## <DocIcon name="circle" /> Idle Queue Handling

When no tasks are due, the engine follows `Optimization.WhenTaskQueueEmpty`:

| Value | Behavior |
| --- | --- |
| `goto_main` | Navigates to the game main screen and idles (default) |
| `close_game` | Terminates game application to conserve RAM |
| `stay_there` | Remains on the current screen |

If the wait duration exceeds 3 hours and `CloseEmulatorDuringLongWait` is enabled, the scheduler shuts down the emulator, rebooting and re-authenticating when tasks become due. Wireless ADB and SSH remote devices bypass this optimization.

## <DocIcon name="wrench" /> Fault Recovery & Error Tiers

The scheduler handles failures as expected operating conditions, categorizing errors into tiered recovery responses:

| Fault Condition | Recovery Strategy |
| --- | --- |
| Game app not running | Relaunch game client |
| Game UI stuck / click timeouts | Restart game; restart emulator if failure threshold is reached |
| Page unrecognized | Check server status; restart game if server is online, pause if under maintenance |
| Emulator offline | Reboot emulator (retries indefinitely with expanding backoff) |
| Code exception (`ScriptError`) | Terminate process after 3 consecutive occurrences |
| Sensitive task failure | Immediately halt instance, capture diagnostic snapshot, and dispatch notification |

Only four conditions permanently halt the scheduler:

1. <DocIcon name="circle-x" /> Consecutive `ScriptError` exceptions reaching 3 occurrences (indicates upstream code defects).
2. <DocIcon name="warning" /> Failures during sensitive tasks (prevents data corruption).
3. <DocIcon name="hand" /> Receipt of stop or update signals.
4. <DocIcon name="circle-alert" /> Unrecoverable errors during initial configuration or device initialization.

All other issues recover automatically under exponential backoff (starting at 20 seconds, capped at 300 seconds).

### <DocIcon name="warning" /> Sensitive Tasks

`Scheduler.Sensitive` defaults to enabled on high-risk operations:

- <DocIcon name="warning" /> `OpsiCrossMonth` (monthly Operation Siren transition)
- <DocIcon name="warning" /> `OpsiObscure` (obscure coordinate zones)
- <DocIcon name="warning" /> `OpsiAbyssal` (abyssal coordinate zones)

Unexpected errors during these tasks halt the instance rather than rebooting the game, preventing lost coordinates or state corruption.

### <DocIcon name="refresh" /> Task Restart Limits

`Error.TaskRestartLimit` (defaults to 3; 0 disables limit) caps consecutive recovery attempts for a single task. Once exceeded:

1. <DocIcon name="clock" /> Pushes the task's `NextRun` timestamp to the next daily server reset.
2. <DocIcon name="megaphone" /> Dispatches error notifications and WebUI alerts.
3. <DocIcon name="refresh" /> Resumes normal scheduling for remaining queue tasks.

The counter clears upon any successful task run. The `Restart` task is exempt from this limit to prevent queue deadlocks.

## <DocIcon name="eye" /> Watchdog Supervision

When tasks loop indefinitely (such as unskippable story sequences or pathfinding cycles), the scheduler loop remains active and undetected. Watchdogs resolve this:

| Setting | Default | Purpose |
| --- | --- | --- |
| `Error.WatchdogEnable` | Disabled | Master watchdog toggle |
| `Error.WatchdogTaskEnable` | Disabled | Task timeout detection toggle |
| `Error.WatchdogTaskTimeout` | 120 minutes | Restarts emulator if a single task exceeds duration |

Watchdogs poll every 30 seconds and activate only during active task runs, ensuring idle waits are not misinterpreted as hung tasks.

## <DocIcon name="badge-dollar" /> Automated Oil Threshold Management

`General.OilControl.Enable` defaults to disabled with a target cap of 24,000 (configurable between 1,000 and 24,999).

When active under **Legacy Scheduling**, exceeding oil thresholds triggers automated spending routines:

- <DocIcon name="rocket" /> Prioritizes due campaign farming stages;
- <DocIcon name="badge-dollar" /> If no stages are due, purchases snacks in the Dormitory;
- <DocIcon name="circle-check" /> Resumes normal queue ordering once oil falls below the threshold.

This mechanism does not alter configured priority tables and does not apply to Enhanced or Takeover scheduling modes.

## <DocIcon name="refresh" /> Daily Restart Randomization

`Alas.Restart.RandomDelay` introduces a randomized delay following server resets (specified as a single value or range, e.g. `5, 50` minutes) to stagger logins across multiple accounts. Set to `0` to disable.

`Restart.ClearCache` wipes the external cache directory (`/sdcard/Android/data/<package>/cache/`) during reboots, resolving login desynchronization issues on specific channel servers.

## <DocIcon name="rocket" /> Next Steps

<ul class="ap-linklist">
<li><a href="/en/azurpilot/user/tasks/">Task Manual<span class="desc">Configuration guides per gameplay mode</span></a></li>
<li><a href="/en/azurpilot/user/multi-instance">Multi-Instance & Config Management<span class="desc">Parallel automation setups</span></a></li>
<li><a href="/en/azurpilot/developer/scheduler">Scheduler Lifecycle<span class="desc">Deep-dive engine implementation details</span></a></li>
</ul>
