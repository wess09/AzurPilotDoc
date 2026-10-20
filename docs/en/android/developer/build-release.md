---
title: Android Build, Sign & Release
description: Versioning formulas, signing key configurations, CI matrices, release manifest schemas, and regional mirrors.
updated: 2026-10-20
---

# Android Build, Sign & Release

The Android release produces multiple artifacts from a single repository: architecture-specific Full APKs, universal Thin APKs, and rootfs Runtime archives, published under a persistent release tag.

## <DocIcon name="package" /> Build Artifacts

| Deliverable | Gradle Command | Content |
| --- | --- | --- |
| Full APK (Single ABI) | `assembleRelease -Pazurpilot.releaseAbi=<abi>` | Bundles architecture-specific rootfs |
| Full APK (Universal) | `assembleRelease` | Universal packaging |
| Thin APK | `assembleRelease -Pazurpilot.slimApk=true` | Excludes rootfs; dual ABI |
| Runtime Archive | CI workflow `rootfs.yml` | `rootfs-<abi>.tar.xz` + `BUILD_MANIFEST` |

```bash
cd app
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime
./gradlew assembleDebug -Pazurpilot.slimApk=true
./gradlew assembleRelease -Pazurpilot.releaseAbi=arm64-v8a
```

Release builds run R8 optimization and execute `verifyReleaseR8Keeps` to confirm JNI symbols and reflection points are retained.

## <DocIcon name="medal" /> Versioning Formula

| Parameter | Calculation Rule |
| --- | --- |
| `versionCode` | Commit timestamp of HEAD; can be manually overridden via `APP_VERSION_CODE` |
| `versionName` | Formatted as `1.<series>.<X>`, where `X = commit_count - baseline` |
| Baseline | Defined in `GitVersion.kt` and mirrored in CI resolve formulas |

::: warning Synchronize Version Formulas
The baseline in `GitVersion.kt` must match the calculation regex in `.github/workflows/rootfs.yml`. Desynchronization causes discrepancies between local builds and CI releases. Always verify against current values in `GitVersion.kt`.
:::

CI runs `git diff --quiet "$app_commit" HEAD -- app` to check for changes to the Android app sources:

- Unchanged → Retains the current app release, triggering rootfs builds only.
- Changed → Sets `versionCode = max(old + 1, HEAD timestamp)` and recalculates `versionName`.

Note that an unchanged app version does not mean the Runtime is skipped—modifications to rootfs scripts trigger runtime rebuilds independently.

## <DocIcon name="key" /> Signing Configuration

| Configuration | Key Source | Details |
| --- | --- | --- |
| Release | Secure external keystore via CI Secrets | Enables v1, v2, and v3 signature schemes |
| Debug | Embedded `debug.keystore` | Ensures local builds from all developers can overwrite each other |

Configured through four properties: `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, and `KEY_PASSWORD`. Environment variables take precedence over `app/local.properties`.

Without signing credentials, release builds complete unsigned for compilation verification.

::: danger Signature Mismatches Force Full Reinstallations
`INSTALL_FAILED_UPDATE_INCOMPATIBLE` requires complete uninstallation, wiping all local data. Export configurations before alternating between debug and release builds.
:::

## <DocIcon name="cloud" /> CI Workflow Pipelines

Configured in `.github/workflows/rootfs.yml`, triggered on pushes to `main` or manual dispatch:

| Stage | Responsibility |
| --- | --- |
| `resolve` | Evaluates upstream commits and input diffs to determine whether to skip builds |
| `build` | Builds rootfs on native architecture runners via `rootfs/build/build-azurpilot.sh` |
| `apk` | Runs `fetch-proot-libs.sh` and compiles Full and Thin APK variants |
| `publish` | Updates the persistent release `azurpilot-android-latest` and updates `latest.json` |

Upstream repository activity is monitored via `.github/workflows/check-upstream.yml`.

### Reproducing Releases Locally

1. Download `rootfs-<abi>` artifacts from a completed CI workflow run.
2. Place `rootfs.tar.xz` and `BUILD_MANIFEST` into `app/app/src/main/assets/rootfs/`.
3. Configure `KEYSTORE_*` signing variables.
4. Run `cd app && ./gradlew assembleRelease -Pazurpilot.releaseAbi=arm64-v8a`.

## <DocIcon name="clipboard" /> Release Manifest (`latest.json`)

Hosted under the persistent release:

| Field | Purpose |
| --- | --- |
| `versionCode` / `versionName` | App update metadata |
| `appCommit` | Commit hash of the current APK release |
| `azurpilotCommit` | Commit hash of upstream core program bundled inside rootfs |
| `androidHostCommit` | Commit hash of host repository when rootfs was compiled |
| `apkUrl` / `apkSha256` / `apkSize` | Universal Thin APK artifact details |
| `updateApks.<abi>` | Architecture-specific Thin APKs |
| `runtimes.<abi>` | Architecture-specific rootfs packages |
| `fullApks.<abi>` | Architecture-specific Full APKs |
| `rootfs*` | Legacy compatibility fields pointing to ARM64 |

Legacy app versions consume flat `rootfs*` properties, which must remain populated. Newer versions parse `updateApks` per ABI to prevent emulators from falling back to ARM translation.

## <DocIcon name="smartphone" /> Multi-Architecture Support

| ABI Target | Device Category | Notes |
| --- | --- | --- |
| `arm64-v8a` | Physical hardware | Primary target |
| `x86_64` | Android emulators | Requires dedicated proot library retrieval |

32-bit hardware is unsupported due to 64-bit Linux runtime dependencies. Details are available in `doc/multi-arch.md`.

## <DocIcon name="download" /> Mirrors & Distribution Channels

- GitHub Releases and CNB host identical payloads with matching SHA-256 hashes.
- New installations default to the `cnb` mirror; existing choices persist across updates.
- Five pre-configured ghproxy endpoints are available, with support for custom prefixes.
- The endpoint `gh-proxy.net` presents challenge verification pages and **cannot be used for downloads**.

## <DocIcon name="settings" /> Build Profiles

The `doc/build-profiles.md` document describes package recipes, identity overrides, and validation steps. Profiles that customize package names must update the `$package` variable inside `tools/watch-android-logs.ps1` accordingly.

## <DocIcon name="circle-check" /> Release Verification Checklist

- [ ] Baseline in `GitVersion.kt` matches the CI formula
- [ ] Release notes added to `CHANGELOG.md`
- [ ] rootfs compiles across all configured ABIs
- [ ] Both Full and Thin APKs generate successfully
- [ ] Signatures validate via apksigner across v1, v2, and v3
- [ ] `latest.json` is populated and legacy compatibility keys point to ARM64
- [ ] Installation verified on physical ARM64 hardware and x86_64 emulators
- [ ] Hot-update endpoint returns expected states (`enabled` / `requiresRuntimeUpdate`)
