---
title: Configuration System
description: From YAML schemas to args.json, config_generated.py, and runtime attribute bindings, plus steps for adding options.
updated: 2026-10-20
---

# Configuration System

The configuration system serves four requirements: game modules reading runtime properties, schedulers managing task queues, the WebUI generating forms, and developers extending options declaratively. It achieves this through a three-stage pipeline: **YAML schemas → Code generator → Runtime binding**.

```text
task.yaml  argument.yaml  default.yaml  override.yaml  gui.yaml  dashboard.yaml
      │            │             │            │           │          │
      └────────────┴─────────────┴────────────┴───────────┴──────────┘
                                   │
                    uv run -m module.config.config_updater
                                   │
     ┌──────────────┬──────────────┼──────────────┬──────────────┐
     ▼              ▼              ▼              ▼              ▼
  args.json     menu.json   config_generated.py  template.json  i18n/*.json
     │              │              │
     ▼              ▼              ▼
  WebUI Forms   Sidebar Menus  Python Defaults
                                   │
                                   ▼
                          AzurLaneConfig (Runtime)
```

## <DocIcon name="file" /> Schema Definitions: Six YAML Files

| Schema File | Purpose | Authoring Role |
| --- | --- | --- |
| `task.yaml` | Task definitions, parameter group bindings, menu hierarchies | Developers |
| `argument.yaml` | Parameter types, defaults, options, and validations | Developers |
| `default.yaml` | Task-specific default value overrides (user-modifiable) | Developers |
| `override.yaml` | Enforced overrides, display toggles, and locked types | Developers |
| `gui.yaml` | WebUI localization keys | Developers |
| `dashboard.yaml` | Resource telemetry definitions | Developers |

Distinction between `default.yaml` and `override.yaml`:

- `default.yaml` specifies initial defaults that users can modify in the WebUI.
- `override.yaml` enforces locked values that cannot be altered in the WebUI, used for task-mandated invariants or hidden internal states.

## <DocIcon name="eye" /> Parameter Schema Syntax

```yaml
Campaign:
  Name: 12-4
  Mode:
    value: normal
    option: [normal, hard]
  UseAutoSearch: true
```

| Field | Function |
| --- | --- |
| `value` | Default value |
| `type` | Form input type: `checkbox`, `input`, `textarea`, `datetime`, `stored`, etc. |
| `option` | Selectable dropdown enumeration |
| `validate` | Numeric range bounds `[min, max]` |
| `display` | Visibility flag: `hide` suppresses display; `stored` tracks internal state |
| `valuetype` | Explicit type coercion (e.g. `str`) |

## <DocIcon name="refresh" /> Schema Compilation

```bash
uv run -m module.config.config_updater
```

Generated compilation artifacts:

| Output | Consumer |
| --- | --- |
| `module/config/argument/args.json` | WebUI form generation and server-side validation |
| `module/config/argument/menu.json` | WebUI navigation sidebar |
| `module/config/config_generated.py` | Python default property classes |
| `config/template.json` | New instance template |
| `module/config/i18n/*.json` | 5-language localization dictionaries |
| `config/deploy.template*.yaml` | Server deployment templates |

::: danger Never Edit Generated Artifacts Manually
CI validates schema compilation via `git diff`. Manual changes will be overwritten on the next compile pass. The sole exception is `i18n/*.json`: the compiler preserves existing translations while inserting new keys as untranslated path strings that require manual translation across all five supported locales.
:::

## <DocIcon name="settings" /> Runtime: AzurLaneConfig

### Parameter Paths & Property Access

Parameter paths follow `<Task>.<Group>.<Argument>`. Once bound to an active task, options are accessed via snake_case attributes:

```python
# Reads Campaign.Name
name = self.config.Campaign_Name

# Modifies memory and marks state dirty
self.config.Campaign_Name = '12-4'
```

`bind(task)` exposes only the parameters belonging to the active task. Business modules cannot access private parameters of other tasks directly; cross-task queries require explicit `cross_get` calls.

### Transactional File Persistence

Configuration changes are not written immediately to disk; they queue inside a `modified` list and commit atomically under cross-process file locks:

```text
Worker modification → modified queue → Transaction lock → Atomic write to config/<instance>.json
WebUI edit → config.patch (with revision) → Concurrency check → Same lock
```

WebUI edits utilize optimistic concurrency tracking: conflicting concurrent edits fail with conflict alerts, requiring users to refresh.

### Schema Loading & Migrations

Loading follows a strict pipeline:

1. Parse `config/<instance>.json`.
2. Merge with defaults from `config_generated.py` (filling missing fields).
3. Apply migration rules from `redirect_utils/` (renames, type changes, option mappings).
4. Coerce types (string numerals to integers, normalize datetime formats).
5. Generate runtime properties.

Initializing `AzurLaneConfig` **may write to disk** to persist migration results. Test harnesses must use temporary configuration paths to prevent altering production settings.

## <DocIcon name="zap" /> Hot Reloading

The scheduler checks file modification times (`mtime`) at two points:

- During the 5-second polling interval in `wait_until()`;
- Following task completion, when the `config` cache is cleared.

Detected modifications trigger complete reconstruction of the `AzurLaneConfig` object. In-flight tasks do not switch configurations mid-execution; tasks requiring mid-flight detection invoke `check_task_switch()`.

## <DocIcon name="circle-plus" /> Adding a Configuration Option

<Steps>
<Step title="Update argument.yaml">

Add the property under the target group, defining `value`, `type`, and `option` / `validate`. Use CamelCase naming, which translates into property attribute names.

</Step>
<Step title="Configure defaults and overrides">

If the property requires custom defaults on specific tasks, update `default.yaml`; if it must be immutable on specific tasks, update `override.yaml`.

</Step>
<Step title="Assign group to tasks">

Add the group to target task lists in `task.yaml`. Entry order governs display order in the WebUI.

</Step>
<Step title="Add localization strings">

Run the compiler, then populate translations across all five files in `module/config/i18n/*.json` (including select option labels).

</Step>
<Step title="Compile schemas">

```bash
uv run -m module.config.config_updater
```

Inspect git diffs on `args.json` and `template.json` to verify changes match expectations.

</Step>
<Step title="Validate changes">

```bash
uv run python -m unittest tests.test_config_transaction tests.test_config_batch
uv run python -m dev_tools.import_smoke_test
```

Launch the WebUI and confirm the option appears in forms, saves properly, and reloads cleanly.

</Step>
</Steps>

## <DocIcon name="circle-alert" /> Common Configuration Pitfalls

| Issue | Root Cause |
| --- | --- |
| Field missing from WebUI | Group not assigned in `task.yaml`, or configured with `display: hide` |
| Value reverts after editing | Value is locked in `override.yaml` |
| Attribute raises `AttributeError` | Property name misspelled, or group is not bound to active task |
| Value vanishes after migration | Missing migration rule in `redirect_utils/` |
| UI renders raw schema keys | Missing translations in `i18n/*.json` |
| CI fails on schema diff | Modified YAML without compiling, or manually edited generated files |

## <DocIcon name="map" /> Source Code References

| File | Core Responsibility |
| --- | --- |
| `module/config/config.py` | `AzurLaneConfig`: loading, binding, atomic persistence, scheduler primitives |
| `module/config/config_updater.py` | Schema compiler and version migration engine |
| `module/config/transaction.py` | Cross-process file locking transactions |
| `module/config/task_priority.py` | Priority parser |
| `module/config/server.py` | Server package mappings |
| `module/api/config_service.py` | WebUI configuration validation services |
