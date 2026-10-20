---
title: Adding a New Task
description: Complete step-by-step tutorial for authoring a new automation task, from configuration schemas to alas.py dispatch and tests.
updated: 2026-10-20
---

# Adding a New Task

Authoring a new automation task requires **three matching identifiers**: the declaration in `task.yaml`, the dispatch method on `alas.py`, and the implementation class. This guide uses an example `MyFeature` to illustrate the entire workflow.

## <DocIcon name="lightbulb" /> 0. Pre-Flight Design

| Consideration | Rationale |
| --- | --- |
| What parameters are required? | Determines groups and fields in `argument.yaml` |
| When should the task execute? | Determines default `Scheduler` intervals and priority |
| Can failures recover automatically? | Guides exception types rather than catching errors silently |
| Does the task generate metrics? | Determines whether to hook into `Storage` |

## <DocIcon name="pencil" /> 1. Register Task & Menu Hierarchies

Edit `module/config/argument/task.yaml` and place the task under the appropriate menu group:

```yaml
Reward:
  menu: collapse
  page: setting
  tasks:
    MyFeature:
      - Scheduler
      - MyFeature
      - Storage
```

- Group order determines display ordering in the WebUI.
- The `Scheduler` group injects common scheduling fields (enable, intervals, next run).
- The `Storage` group routes analytics to designated database tables.

## <DocIcon name="settings" /> 2. Define Schema Parameters

Edit `module/config/argument/argument.yaml`:

```yaml
MyFeature:
  Mode:
    value: normal
    option: [normal, deep]
  TargetCount:
    value: 3
    validate: [1, 20]
  EnableExtra:
    type: checkbox
    value: false
    option: [true, false]
```

| Property | Description |
| --- | --- |
| `value` | Default value |
| `option` | Enumerated dropdown values |
| `validate` | Numeric range limits `[min, max]` |
| `type` | Explicit form input control type |

To configure task-specific default values, edit `default.yaml`:

```yaml
MyFeature:
  MyFeature:
    TargetCount: 5
```

To lock parameters to immutable values for specific tasks, edit `override.yaml`:

```yaml
MyFeature:
  MyFeature:
    Mode:
      value: normal
      option: [normal]
```

## <DocIcon name="message-text" /> 3. Add Translations

Compile the schemas, then open `module/config/i18n/zh-CN.json` and supply localized strings across all five language files:

```json
{
  "Task": {
    "MyFeature": {
      "name": "My Feature",
      "help": "Summary of feature functionality and prerequisites."
    }
  },
  "MyFeature": {
    "_info": { "name": "My Feature", "help": "" },
    "Mode": {
      "name": "Run Mode",
      "help": "normal runs standard sweeps; deep spends extra time for thorough checks.",
      "normal": "Normal",
      "deep": "Deep"
    },
    "TargetCount": { "name": "Target Count", "help": "Maximum operations executed per run." },
    "EnableExtra": { "name": "Enable Extra Processing", "help": "" }
  }
}
```

## <DocIcon name="box" /> 4. Implement Feature Module

Create `module/my_feature/my_feature.py`:

```python
from module.base.base import ModuleBase
from module.exception import RequestHumanTakeover
from module.logger import logger


class MyFeature(ModuleBase):
    """Executes My Feature automation.

    Pages:
        in: page_main
        out: page_main
    """

    def run(self):
        logger.hr('My Feature', level=1)
        self.ui_ensure(page_main)

        count = 0
        while count < self.config.MyFeature_TargetCount:
            if self.config.MyFeature_Mode == 'deep':
                self._deep_step()
            else:
                self._normal_step()
            count += 1

        self.config.task_delay(success=True)

    def _normal_step(self):
        """Standard execution step.

        Pages:
            in: page_main
            out: page_main
        """
        self.device.screenshot()
        if self.appear_then_click(MY_FEATURE_ENTRY, interval=2):
            pass
        # ... state loop

    def _deep_step(self):
        ...
```

### State Loop Construction Rules

```python
def some_step(self, skip_first_screenshot=True):
    while True:
        if skip_first_screenshot:
            skip_first_screenshot = False
        else:
            self.device.screenshot()

        if self.appear(MY_END_CONDITION):
            break
        if self.appear_then_click(MY_BUTTON, interval=2):
            continue
        if self.handle_popup():
            continue
```

| Rule | Rationale |
| --- | --- |
| Use `appear()` without intervals for exit checks | Exit conditions must be evaluated every frame |
| Use `appear_then_click(interval=2~5)` | Prevents rapid repeated clicking |
| Avoid `sleep()` inside loops | Sleeping causes missed screen transitions |
| Avoid negative loop conditions | Gating loops on "if not seeing X" risks infinite loops on unexpected screens |
| Avoid nested state loops | Flatten branching paths into the parent loop |
| `handle_*()` must return a `bool` | Returning `True` signals that an action occurred and requires a fresh frame |

### Exception Handling Standards

| Game Condition | Appropriate Exception |
| --- | --- |
| Screen unchanged over prolonged period | `GameStuckError` |
| Same button tapped repeatedly without response | `GameTooManyClickError` |
| Ambiguous screen requiring user intervention | `RequestHumanTakeover` |
| Game requires reboot | Call `self.config.task_call('Restart')` and return |

Never suppress recognition failures with silent `try/except: pass` blocks.

### Task Scheduling

```python
self.config.task_delay(success=True)     # Delay per SuccessInterval
self.config.task_delay(success=False)    # Delay per FailureInterval
self.config.task_delay(minute=30)        # Delay for explicit duration
```

Tasks that omit `task_delay` remain due immediately and will be selected again on the next loop.

## <DocIcon name="plug" /> 5. Register Dispatch Method in alas.py

```python
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

- Method name matches the task command identifier converted to snake_case.
- Must use lazy imports.
- Must delegate execution directly to the feature class; avoid business logic inside `alas.py`.

## <DocIcon name="refresh" /> 6. Compile Configuration Artifacts

```bash
uv run -m module.config.config_updater
```

Compiles `args.json`, `menu.json`, `config_generated.py`, `template.json`, and `i18n/*.json`. Commit these artifacts together with your YAML changes.

## <DocIcon name="crown" /> 7. Configure Default Priority (Optional)

If the task requires prioritized scheduling when multiple tasks are ready, insert its command identifier into `_DEFAULT_SCHEDULER_PRIORITY` inside `module/config/config_manual.py`.

## <DocIcon name="folder" /> 8. Button Templates & Assets

When authoring new UI buttons:

1. Capture reference frames at 1280×720 and crop target buttons.
2. Place cropped assets into `assets/<server>/`.
3. Provide assets across all servers (`cn`, `en`, `jp`, `tw`).
4. Execute `uv run -m dev_tools.button_extract` to generate `assets.py`.
5. Verify recognition against saved screenshots.

## <DocIcon name="flask" /> 9. Testing

```bash
# Import smoke test: validates module loadability
uv run python -m dev_tools.import_smoke_test

# Validate schema compilation stability
uv run python -m unittest tests.test_config_batch

# Run feature unit tests
uv run python -m unittest tests.test_my_feature
```

## <DocIcon name="file" /> 10. Documentation

- Add internal module documentation under `docs/modules/` adhering to `WRITING-GUIDE.md`.
- Update the index table in `docs/modules/README.md`.
- If the task is user-facing, document its purpose, options, and verification steps in the relevant task manual.

## <DocIcon name="circle-check" /> Verification Checklist

- [ ] Registered in `task.yaml` with logical group ordering
- [ ] Options configured with types, defaults, and bounds in `argument.yaml`
- [ ] 5-language localization keys populated in `i18n/*.json`
- [ ] Matching dispatch method added to `alas.py` using lazy imports
- [ ] Feature class inherits `ModuleBase` and implements state loops
- [ ] Exceptions raised cleanly without silent suppression
- [ ] Completion invokes `task_delay`
- [ ] Compiled via `config_updater` with artifacts staged
- [ ] Button templates generated across all server directories
- [ ] Smoke tests and unit tests pass cleanly
