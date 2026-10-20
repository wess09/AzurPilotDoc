---
title: Connect Emulator & ADB
description: Configure emulator serials, game packages, screenshot and control backends, auto-restart routines, and SSH management.
updated: 2026-10-20
---

# Connect Emulator & ADB

The device abstraction layer handles all I/O between AzurPilot and the game: connecting via ADB, capturing screenshots, injecting touch inputs, and supervising the game application.

## <DocIcon name="plug" /> Architecture

```text
gui.py / alas.py
   └── Device
        ├── Connection (adb paths, serials, port forwardings)
        ├── Screenshot (routes to configured capture backend)
        ├── Control (tap / swipe / drag operations)
        └── Platform (emulator discovery and lifecycle)
```

When initialized standalone, `Device` can spawn the emulator (up to 4 attempts), run benchmarks, and preheat input backends. In contrast, instances within the scheduler initialize with `auto_start_emulator=False`—**emulator restarts are governed strictly by the scheduler rather than device layers**.

## <DocIcon name="clipboard" /> Required Configuration Options

| Option | Configuration Key | Description |
| --- | --- | --- |
| Emulator Serial | `Emulator.Serial` | ADB target address or `auto` |
| Game Server | `Emulator.PackageName` | Target client package name (defaults to `auto`) |
| Screenshot Method | `Emulator.ScreenshotMethod` | Defaults to `auto` |
| Control Method | `Emulator.ControlMethod` | Recommended: `MaaTouch` |
| In-game Server | `Emulator.ServerName` | Maintenance detection target; can be disabled |

### <DocIcon name="smartphone" /> Configuring Serials

| Scenario | Serial Value |
| --- | --- |
| Single active emulator | `auto` |
| Multiple emulators running concurrently | Explicit `host:port` address |
| MuMu Player 12 | `127.0.0.1:16384` (increments ports for multi-instance) |
| LDPlayer | `emulator-5554` or `127.0.0.1:5555` |
| BlueStacks Hyper-V | `bluestacks5-hyperv` (append `-1`, `-2` for extra instances) |

To find your serial, locate `adb.exe` inside the emulator installation folder and execute `adb devices`. The status must report `device`; `offline` indicates version mismatches or hung sockets, while `unauthorized` indicates missing USB debugging approval.

### <DocIcon name="cloud" /> Game Server Packages

| Server Region | Package Identifier |
| --- | --- |
| CN (Bilibili / Official) | `com.bilibili.azurlane` |
| Global (EN) | `com.YoStarEN.AzurLane` |
| Japan (JP) | `com.YoStarJP.AzurLane` |
| Taiwan (TW) | `com.hkmanjuu.azurlane.gp` |

Chinese channel stores (Huawei, Xiaomi, OPPO, vivo, Tencent MyApp, 4399) use distinct package names selectable in the dropdown. If multiple game clients are installed, specify the target package explicitly rather than relying on `auto`.

## <DocIcon name="eye" /> Screenshot Backends

Capture performance dictates overall automation speed: standard `adb exec-out screencap` requires 300–500 ms per frame, whereas internal emulator channels capture frames in tens of milliseconds.

| Backend | Platform | Description |
| --- | --- | --- |
| `auto` | Default | Runs startup benchmark to select fastest available backend |
| `DroidCast_raw` | Generic | Fast and reliable; requires installing companion apk |
| `ADB_nc` | Generic | Netcat stream; broad compatibility |
| `ADB` | Fallback | Slowest but universally supported |
| `uiautomator2` | Fallback | Reuses uiautomator server connection |
| `aScreenCap` / `aScreenCap_nc` | Generic | Pushes native screen-capture binary |
| `nemu_ipc` | MuMu Player 12 | Direct IPC channel; ultra-low latency |
| `ldopengl` | LDPlayer | Reads directly from host OpenGL buffers |
| `azurpilot_android` | Android Host | Shared memory frame channel; mandatory on mobile host |

::: warning Limitations of nemu_ipc Touch Controls
Capturing via `nemu_ipc` pairs best with corresponding touch backends. On underpowered CPUs, swipes may drop steps or hang during drag operations. If swiping is unreliable, switch the control method back to `MaaTouch`.
:::

## <DocIcon name="hand" /> Touch Control Backends

| Backend | Speed | Characteristics |
| --- | --- | --- |
| `MaaTouch` | Fast | Recommended; supports modern Android versions |
| `minitouch` | Fast | May crash on newer Android releases |
| `ADB` | Moderate | Injects `input tap/swipe`; universally compatible |
| `uiautomator2` | Slow | Dependent on Accessibility services |
| `Hermit` | Moderate | Specialized environments |
| `azurpilot_android` | Fast | Direct JNI bridge injection on Android host |

Taps are randomized within target button bounding boxes, and swipes follow Bézier curves with procedural jitter to mimic human finger movement. These behaviors are built into the engine and require no manual configuration.

## <DocIcon name="settings" /> Emulator Supervision

Registering the emulator type, executable path, and instance name under "System Settings → Emulator Settings" unlocks automated supervision:

- <DocIcon name="clock" /> **Scheduled Restart**: When `Alas.EmulatorManagement.ScheduledEmulatorRestart` is enabled, the emulator restarts at task intervals every `RestartIntervalHours` (default 4 hours).
- <DocIcon name="zap" /> **Forced Scheduled Restart**: `ForceScheduledRestart` allows restarts even while a task is mid-execution.
- <DocIcon name="wrench" /> **Fault Recovery Restart**: Automatically restarts the emulator when ADB hangs or crashes reach configured thresholds.
- <DocIcon name="refresh" /> **Deep Restart**: `DeepRestartAfterFailures` (defaults to 0, disabled) triggers deep process tree purges for MuMu instances following consecutive failures.

### <DocIcon name="key" /> SSH Remote Supervision

If your emulator runs on an external server, NAS, or virtual machine, enable `EnableRemoteSSH` to execute management commands remotely:

| Property | Purpose |
| --- | --- |
| `RemoteSSHHost` / `Port` / `User` | SSH connection credentials |
| `RemoteSSHPublicKey` | Private key payload |
| `RemoteStartCommand` / `RemoteStopCommand` | Commands to start or stop containerized emulators |

This setup is ideal for Dockerized emulators, where restarts execute via `docker restart <container>`.

::: danger Keep SSH Keys Secure
Private SSH keys are stored in plaintext in the instance configuration. Remove this field before sharing configs or filing issue tickets.
:::

## <DocIcon name="shield" /> Server Maintenance Detection

Selecting your server in `Emulator.ServerName` enables pre-flight maintenance checks:

- <DocIcon name="clock" /> Maintenance detected → Pauses execution without restarting the game in loops.
- <DocIcon name="refresh" /> Maintenance concluded → Reloads configuration and schedules an immediate `Restart` task.
- <DocIcon name="circle-alert" /> Probe API unreachable → Falls back to direct ping against game gateways.

If you are unsure of your server or encounter network timeouts, choose "Do not use detection".

## <DocIcon name="zap" /> Performance Benchmarks

The "Tool → Performance Benchmark" utility evaluates all available screenshot and control backends and writes optimal choices to your configuration. Run full benchmarks if you suspect a backend is creating execution lag.

A dedicated `OcrBenchmark` utility evaluates CPU vs. GPU inference performance.

## <DocIcon name="message" /> Common Troubleshooting

| Issue | Root Cause | Solution |
| --- | --- | --- |
| `adb devices` is empty | ADB debugging disabled in emulator | Enable ADB debugging in emulator preferences |
| Device reports `offline` | ADB daemon version mismatch | Use emulator's internal adb binary or restart adb server |
| Screenshot renders black | Mismatched graphics backend | Switch backend to `DroidCast_raw` or `nemu_ipc` |
| Clicks miss UI buttons | Resolution is not 1280×720 | Reset emulator resolution to exactly 1280×720 at standard DPI |
| Frequent `GameStuckError` | Frame rate too low | Set emulator frame rate to 60 FPS |
| Emulator restart fails | Emulator path unregistered | Fill in `EmulatorInfo.name` and `EmulatorInfo.path` |

For complete diagnostic checklists, read [Troubleshooting: Core Program](/en/troubleshooting/azurpilot).
