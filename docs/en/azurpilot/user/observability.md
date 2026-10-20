---
title: Notifications, Logs & Metrics
description: Log file organization, crash dump locations, OnePush notifications, LLM error diagnostics, daily summaries, and metrics.
updated: 2026-10-20
---

# Notifications, Logs & Metrics

Unattended 24/7 automation requires reliable observability. The core program implements three observability tiers: structured disk logs, automated crash dumps, and proactive push notifications.

## <DocIcon name="scroll" /> Log Files

| Content | Location |
| --- | --- |
| Instance Execution Log | `log/<date>_<instance>.txt` |
| Launcher Tracer Log | `log/<date>_launcher.txt` (in launcher repo) |
| Diagnostic Crash Dumps | `log/error/<instance>/<timestamp>/` |
| Internal Debug Server | Bound to localhost when `ALAS_DEBUG_SERVER=1` is set |

Logs append daily, separating task boundaries with visual dividers:

```text
2026-10-20 09:00:12.345 | INFO | [AzurPilot] Scheduler: Start task
2026-10-20 09:00:12.346 | INFO | ──────────────── Research ────────────────
2026-10-20 09:02:41.002 | INFO | [AzurPilot] Scheduler: End task
```

### <DocIcon name="circle-alert" /> Crash Dumps

When an unhandled exception occurs, AzurPilot captures recent screenshots alongside truncated `log.txt` snippets, masking account identifiers:

| Setting | Default | Description |
| --- | --- | --- |
| `Error.SaveError` | Enabled | Master toggle for error snapshots |
| `Error.ScreenshotLength` | Configurable | Number of historical frames retained |
| `Error.SaveErrorRetentionDays` | Configurable | Days before snapshots are pruned (0 = indefinite) |
| `Error.SaveErrorBackUpMethod` | Configurable | Action on expiry: delete, move, or compress |
| `Error.SaveErrorZipMethod` | `zip` | Compression algorithm (`bz2`, `gzip`, `xz`, `zip`) |

::: tip Filing Bug Reports
Include `log.txt` and screenshot images from `log/error/<instance>/<timestamp>/` alongside details of your emulator, capture backend, and control method. Never attach `deploy.yaml` or `remote-access.json`.
:::

## <DocIcon name="megaphone" /> Notifications

### <DocIcon name="send" /> OnePush Integration

`Error.OnePushConfig` uses the OnePush notification format to dispatch alerts across multiple providers (Telegram, ServerChan, WeChat Work, Pushplus, Discord, etc.):

| Pipeline | Trigger Condition |
| --- | --- |
| Task Completion | Enabled via `Scheduler.PushNotification` on individual tasks |
| Error Alerts | Triggered when unrecoverable errors halt execution |

### <DocIcon name="clock" /> Low-Volume Alert Mode

Enabling `Error.LowPushMode` suppresses alerts for self-healing transient errors (game not running, emulator offline, UI stuck) while continuing to send notifications for errors requiring manual intervention.

### <DocIcon name="monitor" /> WebUI Notifications

Even without OnePush, the WebUI streams real-time alerts via Server-Sent Events (SSE). Native desktop launcher notifications and Android host foreground notifications hook directly into this stream.

## <DocIcon name="brain" /> LLM Error Diagnostics

`Error.LlmAnalysis` evaluates error dumps against OpenAI-compatible APIs to provide root-cause diagnostics:

| Property | Description |
| --- | --- |
| `LlmApiKey` | Provider API secret key |
| `LlmApiBase` | OpenAI-compatible endpoint URL |
| `LlmModel` | Model name |

Analysis outputs append to execution logs without executing remediation code.

::: warning Privacy Considerations
LLM analysis transmits sanitized error log snippets to your configured model endpoint. If you do not want logs sent to third-party endpoints, keep `LlmAnalysis` disabled.
:::

## <DocIcon name="calendar" /> Daily Summaries

`Alas.DailySummary.Enable` compiles daily metrics (tasks completed, resources spent, drops recorded) and dispatches a digest at `TriggerTime` (default 20:00).

The summary worker thread operates independently of the scheduling thread, reading an isolated configuration snapshot without contending for worker locks.

## <DocIcon name="eye" /> Statistics & Metrics

Data collected in the SQLite database powers the Statistics view:

| Category | Telemetry Tracked |
| --- | --- |
| Resources | Historical progression curves for oil, coins, gems, cubes, and action points |
| Sorties | Stage clears, run counts, oil consumption, ship drops |
| Operation Siren | Corrosion cycles, sector clears, action point economy |
| Commissions | Commission types, counts, and completion frequency |
| Research | Projects completed, durations, and blueprints obtained |
| Ships | Acquisition logs and drop timestamps |
| Warehouse | Item inventories and consumption rates |

The Resource Management view renders Sankey diagrams tracking resource inflows and outflows, linking oil caps to `General.OilControl`.

::: tip Statistics Depend on Active Runs
Resource levels are captured when tasks run and complete battles, rather than through polling loops. If an instance idles, statistics graphs will plateau.
:::

## <DocIcon name="plug" /> External Monitoring Integrations

- <DocIcon name="plug" /> **MCP Service**: MCP clients can call `get_status`, `get_resources`, and `get_recent_logs`; see [MCP Server](/en/api/mcp).
- <DocIcon name="zap" /> **WebSocket**: Subscribe to `overview`, `logs`, and `statistics` topics to build custom dashboards; see [WebSocket API](/en/api/websocket).
- <DocIcon name="scroll" /> **Log Streaming**: Monitor `log/<date>_<instance>.txt` with standard log aggregation agents (Fluentd, Promtail, Vector).

## <DocIcon name="clipboard" /> Diagnostic Checklist

Gather these artifacts when reporting bugs:

1. Active task state and the trailing 100 log lines from the WebUI Overview.
2. The latest `log.txt` and frame images from `log/error/`.
3. Emulator brand, resolution, capture engine, and input backend.
4. Exported instance configuration JSON (with sensitive keys removed).
5. Recent update history for core code, launcher, or Android runtime.
