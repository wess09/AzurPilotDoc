---
title: Privileged Service & Native Bridge
description: Built-in ADB, Root, and external Shizuku backends, AIDL interfaces, JNI ABI, virtual displays, and SDK dialog repatriation.
updated: 2026-10-20
---

# Privileged Service & Native Bridge

Without elevated privileges, the host cannot automate gameplay: creating virtual displays, capturing framebuffers, and injecting touch events all require shell-level permissions.

## <DocIcon name="box" /> Privileged Backends

| Backend | Launch Mechanism | Authorization | Lifecycle |
| --- | --- | --- | --- |
| Built-in ADB | `adb shell app_process` | Wireless pairing + RSA key | Active boot session |
| Root | `su -c app_process` | Superuser permission | Persistent |
| External Shizuku | Shizuku user service binder | External manager approval | Determined by manager |

`PermissionManager` exposes a **Binder-free state projection**: UI components consume status states (`NotActivated`, `Activating`, `Ready`, `Failed`) without retaining direct Binder references. Dead connections are discarded by identity.

### Implementation of Built-in ADB

Ported from [shizuku-m](https://github.com/wess09/shizuku-m) (Apache-2.0, commit `bcb2b62`):

```text
Wireless Debugging Pairing (SPAKE2)
  → Generate / reuse RSA credentials (Keystore AES-GCM encrypted)
    → adb connect 127.0.0.1:5555
      → app_process launches RemoteServiceImpl
        → Binder returns via bootstrap ContentProvider
          → Validates shell UID + single-use token
```

Architectural decisions:

- **No generic Shizuku server exposed**: The service uses shell access exclusively to launch internal automation components; it authorizes no third-party apps.
- **Context-only initialization**: `ShellServiceStarter` bypasses MediaTek injections into `LoadedApk.makeApplication`, preventing crashes on MTK devices.
- **Detached `setsid` and stdio**: Spawns in an independent session to prevent command completion from terminating the worker.
- **Single-use tokens**: Tokens are revoked upon cancellation, timeouts, or disconnection. App termination destroys child processes.

::: danger Security Risks of Port 5555
When adbd listens on port 5555, it may bind across LAN interfaces. While adbd enforces RSA key authorization and the client connects to `127.0.0.1`, avoid leaving wireless debugging enabled indefinitely on public Wi-Fi networks.
:::

### Root Pipeline

`RootServiceStarter` spawns services via `app_process`. The Binder callback strictly accepts root/shell UIDs with matching ephemeral tokens.

`RootUserService` retains a security-exempt Context that **must exist exclusively inside the privileged child process**. Passing this Context back into the main application process constitutes a critical security vulnerability.

## <DocIcon name="plug" /> IPC Interfaces & Native Bridge

```text
Main Process ──AIDL──▶ Privileged Process (RemoteServiceImpl)
                         ├── Virtual Display Management
                         ├── Window / Power Controls
                         ├── Native Frame Capture (libbridge.so)
                         └── Touch Input Injection (libbridge.so)
```

| Boundary | Enforcement |
| --- | --- |
| AIDL | App calls services via interface stubs; never accesses hidden APIs directly |
| JNI | `libbridge.so` executes exclusively within the privileged process |
| Frame Locks | `GetLockedPixels` and `UnlockPixels` must be strictly paired |
| Input | Opcodes and JNI registration signatures form an immutable cross-language ABI |
| Launcher | `launcher.c` must compile to `liblauncher.so` to land in `nativeLibraryDir` |

::: warning Pointer Invalidation on Unlock
Pointers returned by `GetLockedPixels` become invalid immediately upon calling `UnlockPixels`. Caching pointers across frame intervals causes crashes or memory corruption.
:::

## <DocIcon name="monitor" /> Virtual Displays

Virtual displays provide background automation capabilities:

- Game Activities execute on an independent display while physical screens remain free.
- Frame buffers stream back via shared memory (Unix abstract domain sockets transferring descriptors over `SCM_RIGHTS`).
- Input injection maps coordinates directly into the virtual display surface.

Benchmarked latency: Anonymous SharedMemory transfers in ~15.6 ms (compared to 47.2 ms over TCP). Frame data transfers entirely within RAM without flash writes.

### SDK Dialog Repatriation

Certain vendor distributions redirect third-party login, age verification, and payment Activities to the default primary display. `SdkTaskRepatriator` detects these dialogs and moves them back to the virtual display surface to prevent workflow interruption.

Because this addresses OEM-specific behavior, modifications must be verified on physical hardware.

## <DocIcon name="shield" /> Security Boundaries

| Attack Vector | Countermeasure |
| --- | --- |
| Binder Callback Spoofing | Validates root/shell UID matching single-use ephemeral token |
| Pairing Codes | Retained in transient memory only; excluded from storage and logs |
| RSA Private Key | Encrypted via Keystore AES-GCM; excluded from backups and transfers |
| External Services | Operates strictly within granted scopes |
| Debug Port | Connects exclusively to loopback addresses |

## <DocIcon name="circle-check" /> Verification Suite

```bash
cd app

# Compile Kotlin classes
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime

# Unit test ADB runtime engine
./gradlew :adb-runtime:testDebugUnitTest

# Connected instrumented device tests
./gradlew :app:connectedDebugAndroidTest -PembeddedAdbTestsOnly=true

# Compile native bridge
./gradlew assembleDebug -Pazurpilot.slimApk=true
```

Instrumented test coverage includes: key encryption persistence, TLS exporters, SPAKE2 pairing validation, shell UID checks, native bridge bindings, virtual display allocation, and recovery from process death.

## <DocIcon name="clipboard" /> Engineering Checklist

- [ ] Connect new backends to the unified state machine via `PermissionManager`
- [ ] Confirm Binder callbacks validate UID and single-use token
- [ ] Verify `GetLockedPixels` and `UnlockPixels` calls are balanced
- [ ] Ensure input opcodes and method signatures remain unchanged
- [ ] Verify native libraries follow `lib*.so` naming conventions
- [ ] Validate changes on physical devices rather than relying on emulators
- [ ] Check for OEM-specific regressions across MediaTek, Xiaomi, and Huawei devices
