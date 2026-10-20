---
title: Runtime & PRoot
description: Immutable rootfs artifacts, PRoot session contracts, provisioning state machines, and transactional script hot updates.
updated: 2026-10-20
---

# Runtime & PRoot

The Runtime is an **immutable Ubuntu 24.04 root filesystem** compiled and distributed per ABI. PRoot provides the rootless translation layer enabling this filesystem to execute on Android.

## <DocIcon name="lightbulb" /> Why PRoot is Used

Standard Android security policies prevent regular applications from executing `execve` on files inside private directories or using `chroot`. PRoot intercepts system calls via `ptrace`, rewriting path requests to a user-space root directory to emulate a standard Linux environment.

Key technical requirements:

- **Executable Placement**: The PRoot toolchain is packaged as `lib*.so` binaries inside the APK's `jniLibs`, installing to `nativeLibraryDir`—the sole directory permitting `execve` under targetSdk 35+.
- **Loader Path**: `PROOT_LOADER` references loaders inside `nativeLibraryDir` to bypass private storage execution restrictions.
- **SELinux Compatibility**: Android lacks standard `/dev/shm` mounts and disallows hard link creation. PRoot binds private shared memory directories and enables `--link2symlink` for Python multiprocessing and IPC queues.

## <DocIcon name="handshake" /> Session Contract

```text
App Shell (Parent) ──stdin pipe──▶ proot wrapper ──▶ Runtime Process Group
```

- **stdin must remain open**. When the parent application dies and closes the pipe (EOF), the wrapper immediately terminates the child process group to eliminate orphan workers.
- Canceling the `ProotHost` observer coroutine **only ceases waiting**; it must throw `CancellationException` without wiping the active `session` handle, which is needed to close stdin and await process group termination.
- Employs exponential backoff on crashes and purges stale lockfiles before restarting.

::: danger Never Spawn via Background Daemon Wrappers
Spawning processes via background wrappers like `nohup` breaks the parent-child relationship. Orphaned runtimes will continue running in the background, conflicting over configurations and SQLite database locks on subsequent boots.
:::

## <DocIcon name="settings" /> Provisioning State Machine

`ProvisionState`:

| State | Description |
| --- | --- |
| `Checking` | Verifying installed rootfs version |
| `NotInstalled` | Not deployed; awaiting user initiation |
| `NotBundled` | Thin APK used; release lacks matching ABI |
| `LowDisk` | Free storage is below 2 GB |
| `Downloading` | Downloading payload (measured in compressed bytes) |
| `Extracting` | Unpacking payload (measured in compressed bytes) |
| `Ready` | Provisioning verified and ready |
| `Failed` | Deployment failure with user-facing `reason` |

### Installation Validation

`isInstalled()` validates three conditions simultaneously:

1. The version in `.provisioned` matches `BUILD_MANIFEST` inside `opt/azurpilot/`.
2. The `rootfs_arch` matches the host device ABI.
3. The Python interpreter binary exists and is executable.

Installed runtimes prompt for updates when new versions appear, but **never replace files automatically**.

### Segmented Download Engine

- Payloads ≥ 8 MiB initiate an HTTP `bytes=0-0` range probe before opening 4 parallel connections downloading non-overlapping ranges.
- Each chunk validates HTTP 206 responses, `Content-Range` headers, byte lengths, and version tags; compression is disabled.
- Failure in any segment cancels the pool, waits for thread shutdown, flushes partial files, and retries once via a single stream.
- Mirror switches poll `shouldAbort` every 100 ms to discard partial downloads before re-downloading from the new host.
- Verified first against byte sizes, then against SHA-256 hashes.

### Stream Extraction Pipeline

1. Unpacks into `rootfs.tmp`, performing an **atomic rename** upon completion.
2. Implements a pure-Java streaming pipeline (commons-compress tar + tukaani xz), avoiding busybox tar bugs with forward hard-link references.
3. Maps symlinks via `Os.symlink`; materializes hard links as duplicates with second-pass resolution for forward references.
4. Rejects path traversal attempts and entries referencing symlink targets outside root.
5. Reconstructs POSIX executable permissions from tar header modes.
6. Preserves `config/`, `password.txt`, and `log/`; updates templates and seeds from the incoming image.
7. Writes the `.provisioned` marker and commits directory rename.

## <DocIcon name="clock" /> Initial Boot Performance

Stripping `__pycache__` minimizes payload sizes. On first boot, the Python interpreter compiles all modules to bytecode, often requiring over 90 seconds. `ProotHost` logs:

```text
AzurPilot WebUI not ready within 90000ms
```

This is an expected warning; subsequent boots start at normal speeds.

## <DocIcon name="clipboard" /> Manifest Metadata

The `BUILD_MANIFEST` file defines runtime provenance:

| Property | Purpose |
| --- | --- |
| `azurpilot_commit` | Embedded upstream core commit SHA |
| `rootfs_version` | `<upstream-12>-<input-hash-10>` identifier |
| `rootfs_arch` | Target ABI architecture |
| `android_host_commit` | Host repository commit used during build |
| `node_version` | Bundled Node.js toolchain version |
| `hot_update_mode=local` | Signals support for on-device frontend compilation |

The `rootfs_version` hash encompasses build scripts, overlays, seeds, and toolchains. If the hash changes, a full update is required; if the hash matches while commits differ, a script hot-update suffices.

## <DocIcon name="refresh" /> Transactional Hot-Updates

```text
Query /android/update/status
  → Shallow clone target commit to /opt/azurpilot-update/source
    → Compare uv.lock
       ├── Differing → requiresRuntimeUpdate=true (abort hot-update)
       └── Matching → npm ci && npm run build (600s timeout)
            → Write transaction log config/android-update-transaction.json
              → Stop instances → Backup dist → Swap source → Install dist → Update manifest
                → Supervisor reloads and restores instances
```

Rollback mechanisms:

- Pre-swap failure: Candidate directory is pruned; active source and dist remain untouched.
- Mid-swap failure: Restores previous source, dist, and manifest from backup.
- Unclean termination: `android_host.py` checks the transaction log on boot and rolls back state; if rollback fails, it halts boot to avoid corruption.

## <DocIcon name="folder" /> Overlays and Seed Files

| Directory | Purpose | Rule |
| --- | --- | --- |
| `rootfs/overlays/` | Resolves Android/PRoot compatibility gaps | Never overwrites user configurations |
| `rootfs/seeds/` | First-boot configuration templates | Written exclusively during initial setup |
| `rootfs/build/` | `build-azurpilot.sh` build scripts | Must execute on target ABI native runners |

Overlay tests reside under `rootfs/tests/`:

```bash
uv run --with psutil python -m unittest discover -s rootfs/tests
```

## <DocIcon name="zap" /> Storage and Memory Footprint

| Component | Storage Size |
| --- | --- |
| rootfs Compressed Payload | 300–450 MB |
| Unpacked Installation | 1.5–2.5 GB |
| Hot-Update Staging Directory | Several hundred MB |
| Frontend `node_modules` | Several hundred MB (pruned post-build) |

On-device compilation consumes CPU, RAM, and storage; insufficient resources automatically abort builds while keeping older assets active.
