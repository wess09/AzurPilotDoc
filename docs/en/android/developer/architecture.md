---
title: Host Architecture & Modules
description: Application shell, PRoot runtime, privileged services, and gateway protocol layering, plus module-level source maps.
updated: 2026-10-20
---

# Host Architecture & Modules

<AndroidStack />

## <DocIcon name="box" /> Architectural Layers

| Layer | Process | Key Classes | Responsibilities |
| --- | --- | --- | --- |
| App Shell | Main Process | `AzurPilotApp`, `MainActivity`, `AppRoot` | Initialization, Compose UI, Runtime lifecycle |
| Provisioning | Main Process | `RootfsProvisioner` | Initial extraction, updates, hash validation |
| PRoot | Child Process | `ProotHost` | Session spawning, crash backoff, stdin keep-alive |
| Gateway | Main Process | `AzurPilotGateway` | Exclusive subscriber to `/api/v1/ws` |
| Privileged | Isolated Process | `RemoteServiceImpl`, `bridge/` | Virtual display, frame capture, input injection |
| OCR | `:ocr` | Private Bound Service | Hardware-accelerated inference API |

## <DocIcon name="rocket" /> Initialization Sequence

```text
Application.onCreate
  → Complete initialization on main process only (:daemon runs minimal components)
  → Load configuration (DataStore)
  → postCreate spawns persistent services in dependency order:
      → Logging subsystems
      → PermissionManager (evaluates ADB / Root / Shizuku)
      → Runtime Controller (if rootfs is provisioned)
      → Overlay controller / Keep-alive / Foreground services
```

Activity handles splash screens, edge-to-edge rendering, and wake locks. Business state resides inside ViewModels and StateFlow streams rather than Activity lifecycles.

## <DocIcon name="settings" /> Dependency Injection

Koin modules are divided by domain:

| Module | Bindings |
| --- | --- |
| `CoreModule` | App-wide singletons, clocks, dispatchers |
| `HostModule` | Host services, settings management |
| `LogModule` | Diagnostic log appenders |
| `OverlayModule` | Floating controller and screensaver |
| `PrivilegedModule` | Permission management, remote bridge services |
| `ProvisionModule` | Deployment manager |
| `ProotModule` | PRoot session management and repositories |
| `ViewModelModule` | Presentation ViewModels |

New dependencies must define interface contracts before binding in their respective modules. `AppCoroutineScope` serves as an application-level supervisor scope and **must never** host UI-bound coroutines.

## <DocIcon name="map" /> Source Code Organization

### Runtime & PRoot

| Responsibility | Entry Point | Constraints |
| --- | --- | --- |
| Provisioning & Upgrades | `provision/RootfsProvisioner.kt`, `RuntimeArch.kt` | rootfs is an immutable artifact distributed per ABI |
| PRoot Session | `proot/ProotHost.kt` | Host holds stdin; closing stdin signals process group termination |
| Run Supervision | `proot/AzurPilotRunController.kt` | Start/stop state machine |
| Gateway | `proot/AzurPilotGateway.kt` | Exclusive subscriber (upstream subscriptions overwrite existing topics) |
| Config Editor | `proot/AzurPilotConfigEditor.kt` | Writes settings to remote instances |
| Overlays & Seeds | `rootfs/overlays/`, `rootfs/seeds/` | Resolves compatibility without overwriting user configs |

### Privileged Services & Native Bridge

| Responsibility | Entry Point | Constraints |
| --- | --- | --- |
| Backend Selection | `privileged/PermissionManager.kt` | Unified state machine; drops dead connections by Binder identity |
| Shizuku Connection | `privileged/RemoteServiceManager.kt` | Supports internal and external pipelines |
| Root Launch | `root/RootServiceStarter.kt` | Spawns `app_process` with single-use callback tokens |
| Privileged IPC | `remote/RemoteServiceImpl.kt` | Manages virtual displays and window controls |
| JNI Bridge | `bridge/`, `native/bridge.h` | Frame locking and input opcodes form a stable ABI |
| Root Launcher | `native/launcher.c` | Must output to `liblauncher.so` |

### Settings & User Interface

| Responsibility | Entry Point | Constraints |
| --- | --- | --- |
| App Settings | `settings/AppSettings.kt` | `@PrefSchema` generates snake_case keys |
| User Settings | `config/UserConfigurationStore.kt` | Isolated JSON DataStore |
| Compose UI | `ui/settings/`, `ui/azurpilot/`, `ui/logs/` | State supplied via ViewModels and repositories |
| Floating Overlay | `overlay/` | Isolated Window; cannot read Activity configuration |
| Widgets | `widget/` | Explicit drawables; no `?attr` dependencies |

### Keep-Alive & Diagnostics

| Responsibility | Entry Point |
| --- | --- |
| Foreground Service | `service/RunForegroundService.kt` |
| Multi-Path Keep-Alive | `keepalive/KeepAliveManager.kt` |
| Logging | `log/`, `constant/AppPaths.kt` |

Keep-alive components must support repeated start/stop cycles, respecting user toggles as the ultimate authority.

## <DocIcon name="plug" /> Gateway Protocol

The Runtime exposes three endpoint categories on `127.0.0.1:25548`:

| Endpoint | Authentication | Purpose |
| --- | --- | --- |
| `/api/v1/ws` | Session Token | Instances, dashboard, settings, logs, analytics |
| `/android/*` | `X-AzurPilot-Android-Token` | Mobile host thin interface |
| `/healthz` | None | Readiness probe |

Ports are loaded from `WebuiPort` in `deploy.yaml`. Modifying ports triggers gateway and control interface switching on subsequent boots.

Only one WebSocket subscriber can exist: upstream topics follow **replacement semantics**, meaning a secondary subscriber wipes previous topic registrations. All UI views consume state through `AzurPilotRepository`.

## <DocIcon name="refresh" /> Dual Update Tracks

| Track | Content | Artifact |
| --- | --- | --- |
| App | Host APK code | Lightweight Thin APK (dual ABI, no rootfs) |
| Runtime | rootfs, Python, dependencies | `rootfs-<abi>.tar.xz` |

A third track handles transactional script hot-updates, swapping upstream source code provided `uv.lock` remains unchanged.

## <DocIcon name="shield" /> Architectural Boundaries

| Forbidden Pattern | Justification |
| --- | --- |
| Compose calling JNI or `app_process` directly | Bypasses interface boundaries, complicating rollbacks and tests |
| Spawning PRoot in background daemon mode | Breaches process death protocol, leaving orphan workers |
| Leaking security-exempt Context to main process | Causes privilege escalation vulnerabilities |
| Modifying input opcodes or JNI symbols | Destabilizes cross-language binary contracts |
| Assuming overlays read Activity configurations | Overlays execute in an independent Window |

## <DocIcon name="circle-plus" /> Adding New Features

1. Identify relevant architectural boundaries (ports, repositories, state flows).
2. Implement backend capabilities.
3. Expose functionality to the UI via existing contracts.
4. Verify with minimal checks: Kotlin build, native build, hardware regression testing.
