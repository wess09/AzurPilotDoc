---
title: Backend Process Lifecycle
description: Windows Job Objects, emulator breakaway mechanisms, environment markers, and Unix process groups during application exit.
updated: 2026-10-20
---

# Backend Process Lifecycle

Terminating the launcher commonly faces two failure modes: **under-killing** (orphan `gui.py` processes remain active) and **over-killing** (the emulator process is terminated along with the backend). This guide explains how both are resolved through a unified lifecycle mechanism.

## <DocIcon name="box" /> Process Hierarchy

```text
alas-launcher (Desktop Launcher)
└── gui.py (Backend Web Server)
    ├── instance worker (Task Scheduler)
    └── emulator (Spawned by worker, but decoupled from backend lifecycle)
```

Expected termination behavior on launcher exit:

| Process | On Launcher Exit |
| --- | --- |
| `gui.py` | **Must terminate** |
| instance worker | **Must terminate** |
| emulator | **Must remain running** |

## <DocIcon name="monitor" /> Windows: Job Objects

`backend_process.rs` creates a dedicated Windows Job Object for the backend with the following limits:

| Limit Flag | Behavior |
| --- | --- |
| `JOB_OBJECT_LIMIT_BREAKAWAY_OK` | Allows child processes to break away explicitly |
| `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` | Terminates standard worker processes when the last Job handle closes |

::: danger Avoid SILENT_BREAKAWAY
Using `JOB_OBJECT_LIMIT_SILENT_BREAKAWAY_OK` allows ordinary Python workers to break away silently, resulting in orphan processes on exit. Breakaway must require explicit invocation.
:::

### Preventing Unintended Emulator Termination

Windows automatically propagates Job Object membership to descendants. Even if the backend attempts to decouple an emulator using a transient `cmd /c start` wrapper, the emulator inherits the Job Object, causing `TerminateJobObject` to terminate the game.

The resolution relies on an explicit mutual handshake:

1. The launcher injects `ALAS_LAUNCHER_JOB_BREAKAWAY=1` into the backend environment, signaling capability support.
2. When `PlatformWindows.execute(wait=False)` detects this flag, it appends the `CREATE_BREAKAWAY_FROM_JOB` creation flag to the emulator launch command.
3. It simultaneously scrubs `ALAS_LAUNCHER_PID`, `ALAS_LAUNCHER_JOB_BREAKAWAY`, and `ALAS_WEBUI_TRUST_SECRET` from the spawned emulator's environment.

This ensures the emulator escapes the Job Object and avoids subsequent process table scans.

::: warning Protocol Changes Require Dual Updates
Older backends will not request breakaway, and older launchers disallow breakaway. Updating only one side results in either terminated emulators or leaked worker processes.
:::

### Root Process Creation Sequence

1. Spawn the root Python process in a suspended state.
2. Assign the process handle into the Job Object.
3. Resume process execution.

If assignment or resumption fails, terminate and clean up the root process immediately to eliminate race conditions. The Job handle is wrapped in an `OwnedHandle` to ensure automatic cleanup on panics, errors, or graceful exits.

### Explicit Termination Flow

In addition to awaiting the root process exit, the launcher monitors the Job Object's active process count for up to 5 seconds to ensure all workers have exited. It returns an error if queries fail or timeouts elapse; **root process termination alone must never be mistaken for complete process tree cleanup**.

## <DocIcon name="laptop" /> Unix: Process Groups

Unix systems use process groups in place of Job Objects:

- The backend spawns within a dedicated process group.
- On exit, termination signals are broadcast to the entire process group.
- Emulator decoupling relies on Unix conventions (such as `setsid`), maintaining separation from Windows capability flags.

## <DocIcon name="key" /> Fallback: Environment Markers

If Job Objects or process groups fail to clean up processes, the launcher performs a fallback process table scan on exit, searching for processes inheriting the `ALAS_LAUNCHER_PID` marker.

This is why the emulator launch flow must **scrub** this environment variable before execution—otherwise, the fallback scan will terminate the emulator.

## <DocIcon name="flask" /> Automated Testing

```bash
cargo test --locked backend_process::tests
```

The test harness mocks the backend, worker, and emulator processes, verifying three execution paths:

1. Explicit termination → Root process and workers terminate; decoupled emulator mock survives.
2. Dropping Job handle → Same outcome.
3. Premature root process exit → Descendant workers are still cleaned up.

Tests clean up mock emulators using dedicated process handles without affecting actual emulators on the host.

The core repository's `tests.test_emulator_process_lifetime` tests capability detection, environment variable sanitization, and error paths.

::: tip Local Windows Testing
The launcher manifest requires Administrator privileges. Running tests without elevation fails with Error 740. You can run unit tests in an isolated test harness loading `backend_process.rs` and `window_util.rs` via `#[path]`—though full validation requires executing `cargo check --locked --all-targets` in an elevated terminal.
:::

## <DocIcon name="clipboard" /> Modification Checklist

- [ ] Ensure new child processes do not inherit inappropriate environment variables
- [ ] Verify emulator launch code requests explicit breakaway
- [ ] Confirm termination flow awaits root exit and verifies worker termination
- [ ] Validate Job handles are dropped across all control flow branches
- [ ] Ensure Unix process group logic remains functional
- [ ] Execute tests across Windows, macOS, and Linux
- [ ] Confirm on real hardware that exiting the launcher leaves running emulators untouched

## <DocIcon name="file" /> References

- [Microsoft Job Objects Documentation](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
- Repository guide: `docs/backend-lifecycle.md`
