---
title: Releases & Versioning
description: Release cadence across the three repositories, pre-release checklists, and updating documentation alongside codebases.
updated: 2026-10-20
---

# Releases & Versioning

The three repositories release on independent schedules without a unified version identifier.

## <DocIcon name="medal" /> Versioning Models

| Project | Versioning Model | Distribution Format |
| --- | --- | --- |
| Core Program | Rolling `master` branch commits | Git commits / Docker images |
| Desktop Launcher | Semantic versioning (e.g. `2.2.5`) | Release archives + update manifests |
| Android Host | `versionCode` timestamp + `versionName` commit count | Persistent Release + `latest.json` |
| Documentation | Pinned to audited commit SHAs | Static site |

## <DocIcon name="zap" /> Core Program

- Releases correspond to HEAD on `master`; no stable tags are published.
- Docker containers build from tags and master pushes.
- The WebUI Update view displays commit logs.

Pre-release validation:

- [ ] `ruff` linting passes
- [ ] Related unit tests pass
- [ ] No diffs on `config_updater`, `button_extract`, or `export_api_schema`
- [ ] Import smoke test passes
- [ ] Frontend builds and Vitest suites pass

## <DocIcon name="rocket" /> Desktop Launcher

| Aspect | Rule |
| --- | --- |
| Version Numbers | Synchronize across `Cargo.toml`, `tauri.conf.json`, and `CHANGELOG.md` |
| Git Tag | Semantic format (e.g. `2.2.5`; reject `v2.2.5`) |
| Deliverables | Cross-platform `tar.xz` archives, Global + `-cn` mirror |
| Self-Updater | Publish `stable.json` with mTLS payloads |

See the [Release Checklist](/en/launcher/developer/build-release#release-checklist).

## <DocIcon name="smartphone" /> Android Host

| Aspect | Rule |
| --- | --- |
| `versionCode` | Commit timestamp of HEAD (`max(old + 1, timestamp)`) |
| `versionName` | `1.<series>.<X>`; baseline synchronized in `GitVersion.kt` and CI |
| App Packages | Full APK (per ABI) + Thin APK (universal) |
| Runtime | `rootfs-<abi>.tar.xz` + `BUILD_MANIFEST` |
| Manifest | Persistent release manifest `latest.json` |

::: warning Verify Version Baseline
Always verify against current values in `GitVersion.kt`.
:::

## <DocIcon name="file" /> Documentation Site

The documentation site produces a static directory tracking audited commit SHAs:

1. Re-run data extraction scripts after upstream code changes.
2. Update commit SHAs and dates in `reference/versions.md`.
3. Execute `npm run check` and `npm run test:e2e`.
4. Compile static build and verify HTML metadata and sitemaps.

## <DocIcon name="shield" /> Inter-Component Compatibility

| Configuration | Compatibility Guarantee |
| --- | --- |
| New Launcher + Old Core | Best effort; may prompt to update core |
| Old Launcher + New Core | Uncertified; may fail if newer IPC protocols are missing |
| New APK + Old Runtime | Usually functional; prompts for full update if dependencies shift |
| Old APK + New Runtime | Uncertified; host IPC contracts may desynchronize |

When unexpected errors arise across mixed versions, standardize all three components to commits released on the same calendar date before debugging.
