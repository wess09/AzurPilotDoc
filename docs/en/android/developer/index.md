---
title: Android Developer Portal
description: "Build the Android host from source: JDK/NDK toolchain, build flags, verification steps, logcat debugging, and directory layout."
updated: 2026-10-20
---

# Android Developer Portal

This repository houses the **Android host**, not game automation logic. Working on the host requires navigating four architectural tiers: Kotlin / Compose, JNI, PRoot sessions, and the rootfs distribution image.

## <DocIcon name="laptop" /> Development Toolchain

| Tool | Version / Details |
| --- | --- |
| Android Studio | Primary IDE and debugger |
| JDK | JDK 17 (JVM compilation target) |
| Android SDK | `compileSdk 37` / `targetSdk 36` / `minSdk 28` |
| NDK + CMake | CMake 3.22.1 for compiling `libbridge.so` |
| Git | **Full Git history required**; version strings derive from commit counts |
| uv | Executes Python test harnesses and rootfs validation suites |
| adb | Device deployment, log streaming, port forwarding |

Windows development notes:

- Windows `python3` may invoke Microsoft Store aliases; verify via `python --version`.
- `subprocess` calls to `bash` trigger WSL rather than Git Bash; invoke Python tools using `uv run`.
- Shell scripts run within Git Bash; execute `tools/watch-android-logs.ps1` within PowerShell.

## <DocIcon name="package" /> Initial Build

```bash
git clone https://github.com/wess09/AzurPilot-for-Android.git
cd AzurPilot-for-Android/app

# Compile Kotlin classes, bypassing rootfs validation
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime

# Build thin debug APK (without embedded rootfs)
./gradlew assembleDebug -Pazurpilot.slimApk=true
```

Build outputs reside in `app/app/build/outputs/apk/debug/`.

### Why Builds May Fail Locally

The Gradle task `verifyBundledAzurPilotRuntime` checks for `rootfs.tar.xz` (300 MB+) and `BUILD_MANIFEST` inside `app/app/src/main/assets/rootfs/`. These are generated CI artifacts and are excluded from Git. Local builds without these assets fail by design to prevent generating broken APKs missing runtimes.

Remediation paths:

- Download the `rootfs-<abi>` CI artifact and place it into `assets/rootfs/`.
- Pass `-Pazurpilot.slimApk=true` to build thin APK variants.

To retrieve unbundled x86_64 proot libraries:

```bash
bash app/scripts/fetch-proot-libs.sh
```

To compile ARM64 targets exclusively, specify `build.debugAbi=arm64-v8a` in `app/local.properties`.

## <DocIcon name="circle-check" /> Routine Code Verification

| Change Target | Verification Command |
| --- | --- |
| Kotlin / Compose / AIDL | `cd app && ./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime` |
| Native Bridge / CMake | `cd app && ./gradlew assembleDebug -Pazurpilot.slimApk=true` |
| rootfs Overlays | `uv run --with psutil python -m unittest discover -s rootfs/tests` |
| Localization Keys | `python app/scripts/check_i18n_strings.py` |
| Shell / PowerShell Utilities | Run syntax linting; execute controlled tests on authorized devices |

::: danger Avoid Running :app:testDebugUnitTest
The test sourceset contains unmaintained unit test classes that do not compile. Validate Kotlin correctness via `compileDebugKotlin`. This is a documented project convention.
:::

## <DocIcon name="smartphone" /> Deployment & Debugging

```bash
adb install -r -d app/app/build/outputs/apk/debug/app-debug.apk

# Stream application logcat
adb logcat -v time --pid=$(adb shell pidof com.azurpilot.ghio)

# Forward WebUI dashboard to host browser
adb forward tcp:25548 tcp:25548
```

Diagnostic log outputs:

| File | Content |
| --- | --- |
| `files/log/app.log` | Host application logging (Timber) |
| `files/log/proot/session.log` | PRoot stdout/stderr and WebUI requests |
| `debug/embedded_adb_launch.log` | Built-in ADB pairing and process bootstrap |

Device path: `/sdcard/Android/data/com.azurpilot.ghio/files/log/`.

## <DocIcon name="folder" /> Repository Architecture

```text
AzurPilot-for-Android/
├── app/
│   ├── app/                 # Main module: Compose UI, proot, privileged, bridge
│   ├── adb-runtime/         # Built-in Shizuku-m ADB runtime engine
│   ├── download-core/       # OkHttp segmented download manager
│   ├── build-logic/         # Gradle convention plugins (SDK, ABI, signing, R8)
│   ├── annotation-api/      # @PrefSchema annotations
│   ├── ksp-processor/       # Settings accessor code generator
│   ├── hidden-api/          # Hidden Android API stubs for compile-time linking
│   ├── navigation-runtime/  # Compose navigation transitions
│   └── miuix-runtime/       # Miuix design theme adapters
├── rootfs/                  # Linux overlays, seeds, build scripts, guest tests
├── server/                  # device-report and remote-access gateway services
├── tools/                   # Hardware benchmarks and device test scripts
├── doc/                     # Internal engineering specifications
└── docs/screenshots/        # Canonical documentation screenshots
```

## <DocIcon name="shield" /> Strict Architecture Rules

| Convention | Architectural Justification |
| --- | --- |
| Native libraries must follow `lib*.so` in `jniLibs` / `prootLibs` | Sole directory permitting `execve` under targetSdk 35+ |
| PRoot sessions must retain open stdin pipes | Closing stdin signals parent process termination |
| Pair `GetLockedPixels` and `UnlockPixels` strictly | Locked frame pointers become dangling pointers immediately on unlock |
| Preserve input opcodes and JNI symbols | Cross-language ABI contracts |
| Generate settings keys via `camelToSnakeCase` | Enforced by `@PrefSchema` generator |
| Author strings in `values/` (zh-CN) first | Primary locale from which secondary translations derive |
| Decouple dependencies via interfaces before DI binding | Prevents direct coupling between Compose and JNI |

## <DocIcon name="map" /> Documentation Map

| Guide | Core Content |
| --- | --- |
| [Host Architecture](/en/android/developer/architecture) | Layering, modules, and process boundaries |
| [Runtime & PRoot](/en/android/developer/runtime) | PRoot sessions, deployment state machine, hot updates |
| [Privileged Service & Native Bridge](/en/android/developer/privileged) | ADB/Root backends, AIDL, JNI, virtual displays |
| [OCR & Vision Pipeline](/en/android/developer/ocr) | `:ocr` process, NPU acceleration, shared memory buffers |
| [Build, Sign & Release](/en/android/developer/build-release) | Versioning formulas, signing keys, CI, manifest schemas |

Additional detailed references inside `doc/`:

```text
doc/architecture.md             Layering and gateway design
doc/module-reference.md         Source directory map
doc/privileged-bridge-protocol.md
doc/runtime-provisioning.md
doc/hot-update.md
doc/release-channel.md
doc/multi-arch.md
doc/ocr-acceleration.md
doc/development-guide.md
```

## <DocIcon name="flask" /> Minimal Verification Checklist

| Modified Area | Mandatory Verification Step |
| --- | --- |
| Kotlin / Koin / Compose | `compileDebugKotlin` |
| Native Bridge / CMake | `assembleDebug -Pazurpilot.slimApk=true` |
| rootfs Python Scripts | `unittest discover -s rootfs/tests` |
| UI Strings | `check_i18n_strings.py` |
| Privileged / Overlays / Keep-Alive | **Physical hardware execution + screenshot inspection** |

Emulator runs and clean builds do not capture proprietary vendor OEM behavior.
