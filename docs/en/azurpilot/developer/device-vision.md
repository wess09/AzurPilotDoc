---
title: Device, Vision & Combat
description: Device backends, screenshot normalization, UI page graph, OCR inference, map detection, and combat loops.
updated: 2026-10-20
---

# Device, Vision & Combat

This subsystem handles visual perception and touch input injection. It acts as the shared foundation for all gameplay modules; coordinate shifts here propagate across all automated tasks.

## <DocIcon name="smartphone" /> Device Layer

`module/device/` unifies ADB communication, frame capture backends, touch input injection, application lifecycle controls, and emulator management into a unified `Device` abstraction.

```text
Device
├── Connection        # adb paths, serials, port forwarding
├── Screenshot mixin  # routes to screenshot_* backend per configuration
├── Control mixin     # click / swipe / drag operations
├── AppControl        # start, stop, foreground detection, view hierarchy dump
└── Platform          # emulator discovery and lifecycle per OS
```

### Backend Routing

Screenshot and control backends are implemented as mixin classes. `Screenshot` and `Control` route calls via lookup tables:

```python
# Runtime dispatch
func = self.screenshot_methods[self.config.Emulator_ScreenshotMethod]
image = func(self)
```

Capture and input backends operate independently and can be paired arbitrarily (e.g. `nemu_ipc` capture paired with `MaaTouch` control).

### Universal Frame Normalization

Frames returned from all backends undergo standardized normalization:

1. Resolution normalization: Frames deviating from 1280×720 are scaled back to reference space.
2. Orientation correction.
3. Optional temporal de-dithering (`Emulator.ScreenshotDedithering`).
4. Black-frame and resolution validation checks.

::: danger Resolution Invariant: 1280×720
All recognition assets, button bounds, and OCR regions are anchored to 1280×720. Altering normalization corrupts visual recognition across all tasks.
:::

### Stability Watchdogs

| Detection | Mechanism | Raised Exception |
| --- | --- | --- |
| Screen Freeze | Compares perceptual hashes across frames with timeout | `GameStuckError` |
| Rapid Clicking | Analyzes frequency over trailing 15 clicks | `GameTooManyClickError` |
| Button Spam | Consecutive clicks on identical button exceeding 12 times | `GameTooManyClickError` |

The device layer raises exceptions to the scheduler without making recovery decisions; recovery logic resides in `alas.py`.

## <DocIcon name="map" /> Page Graph Navigation

### Page Graph

`module/ui/page.py` registers all known game screens and directional links on import:

```python
page_main.link(button=MAIN_GOTO_CAMPAIGN, destination=page_campaign)
```

Adding a new screen requires:

1. Instantiating `Page(check_button=...)`.
2. Defining incoming and outgoing edges using `link()`.
3. Verifying that `check_button` appears reliably on that screen.

### Navigation APIs

| API | Function |
| --- | --- |
| `ui_goto(page)` | Navigates to target screen via shortest graph path; raises on failure |
| `ui_ensure(page)` | Navigates to screen and confirms arrival |
| `ui_back()` | Injects back button input |
| `ui_ensure_index()` | Scrolls paginated lists to find target index |
| `ui_get_current_page()` | Identifies active screen |
| `ui_additional()` | Clears transient event popups during navigation |

Pathfinding uses breadth-first search (BFS) over the page graph. **Avoid hardcoding click sequences**; graph navigation adapts to UI updates with simple edge additions.

### Unknown Page Recovery

If active screens fail to match any known page node:

1. Taps the top-right HOME button.
2. Checks for dialog popups (maintenance, login, announcements, network drop).
3. Restarts the game to execute full login sequences.

## <DocIcon name="eye" /> Optical Character Recognition (OCR)

`module/ocr/` provides declarative character recognition APIs:

```python
count = self.ocr_quantity(OCR_SHOP_ITEM, amount=1)
```

### Preprocessing Pipeline

Frames undergo deterministic preprocessing rather than raw grayscale inference:

1. Crop bounding box defined by target `Button`.
2. Extract text colors (defaulting to white), generating high-contrast binarized images.
3. Pass processed tensors into inference models.

This eliminates gradients, outlines, and dynamic background interference.

### Model Weights & Backends

- Models: PP-OCRv6 series (lite / standard / pro) utilizing language-specific dictionaries.
- Legacy models: `alocr_en_v2_6` and `alocr_cn_v3` retained for compatibility.
- Backends: ONNX Runtime (RapidOCR) and NCNN; Windows supports DirectML, QNN, OpenVINO; macOS supports CoreML ANE.
- Standard inference uses recognition-only mode (`RecOnlyOCR`), bypassing text detection networks on fixed UI regions.

Thread allocation controls:

```bash
# Caps intra-op thread pools per OCR session (1..16, bounded by CPU cores)
AZURPILOT_OCR_THREADS=2
```

### Version Benchmarking

Evaluate accuracy and latency with `OcrBenchmark` before switching models.

## <DocIcon name="target" /> Map Perception & Combat

| Module | Scope | Entry Point |
| --- | --- | --- |
| `module/map` | Grid perception, perspective transformations, pathfinding | `Map` |
| `module/map_detection` | Map tile recognition and classification | `map_detection` |
| `module/combat` | Combat loops, victory detection, fleet assignment | `Combat` |
| `module/campaign` | Stage selection, battle entry, `CampaignRun` | `CampaignRun` |
| `campaign/` | Specific stage map scripts and battle definitions | Python source files |

### Combat Sequence

```text
Detect combat screen → Await post-battle victory screen → Parse combat drops
  ├── Victory → Continue pathfinding / exit
  ├── Defeat → Execute DefeatWithdraw strategy (withdraw / switch fleet / stop)
  └── Freeze → GameStuckError → Trigger recovery
```

Defeat handling is standardized inside `module/defeat_handling.py`, coordinating retreats and morale limits across campaign and event stages.

### Campaign Stage Scripts

Files under `campaign/` are **custom Python stage scripts** rather than static YAML files:

- Each file models tiles, enemies, puzzle mechanics, and boss behaviors.
- Event stages adapt neighboring event patterns.
- New events require custom map code; the engine does not solve novel mechanics automatically.

## <DocIcon name="compass" /> Operation Siren Navigation

`module/os/` provides specialized coordinate mapping:

```text
OSMap(MapEventResumeMixin, OSFleet, Map, GlobeCamera, StorageHandler, StrategicSearchHandler)
```

- `globe_goto(zone)` unifies globe-view navigation and sector exploration.
- `OSGrid` handles perspective transforms with fixed homography parameters for Operation Siren camera angles.
- Feature routines inherit from `OSMap` to access navigation primitives.

Review [Operation Siren](/en/azurpilot/user/tasks/opsi) and internal specifications in `docs/modules/os/index.md`.

## <DocIcon name="pencil" /> Routine Development Workflows

### Updating Button Assets

1. Capture a reference screenshot at 1280×720.
2. Save the cropped button asset into `assets/<server>/`.
3. Reference the template on the `Button` definition.
4. Extract assets via:

```bash
uv run -m dev_tools.button_extract
```

### Adding a UI Page

```python
page_my_feature = Page(check_button=OCR_MY_FEATURE_TITLE)
page_main.link(button=MAIN_GOTO_MY_FEATURE, destination=page_my_feature)
page_my_feature.link(button=BACK_ARROW, destination=page_main)
```

### Adjusting OCR Bounding Boxes

Bounding boxes are governed by `Button.area`. Validate adjustments against real hardware screenshots.

## <DocIcon name="flask" /> Testing

| Scope | Verification Command |
| --- | --- |
| Import Smoke Tests | `uv run python -m dev_tools.import_smoke_test` |
| Map & Combat Unit Tests | `uv run python -m unittest tests.test_combat_results tests.test_auto_search_defeat tests.test_opsi_map_event_resume` |
| OCR Settings & Threading | `uv run python -m unittest tests.test_ocr_settings tests.test_ocr_thread_limits` |
| OCR Benchmarks | WebUI "Tool → OCR Performance Benchmark" |

Visual recognition accuracy must be confirmed on live hardware.
