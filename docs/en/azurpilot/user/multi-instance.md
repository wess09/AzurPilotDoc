---
title: Multi-Instance & Config Management
description: "Manage multiple instances in parallel: directory layout, memory overhead, staggered schedules, and the account vault."
updated: 2026-10-20
---

# Multi-Instance & Config Management

One instance = one configuration file + one scheduler worker process + one controlled emulator window. Running two accounts concurrently requires two distinct configurations and two emulators.

## <DocIcon name="folder" /> Directory Structure & Isolation

```text
AzurPilot/
├── config/
│   ├── ap.json              # Configuration for instance 'ap'
│   ├── ap-2.json            # Configuration for instance 'ap-2'
│   ├── deploy.yaml          # Host-level settings (shared across instances)
│   └── remote-access.json   # Remote access identity (shared)
├── AzurPilot_Data_Backup/   # Automated daily backups organized by date
├── log/
│   ├── 2026-10-20_ap.txt
│   └── 2026-10-20_ap-2.txt
└── cache/
```

Instances share core code, asset templates, and the WebUI backend while maintaining:

- <DocIcon name="circle-check" /> Independent `config/<instance>.json` files
- <DocIcon name="circle-check" /> Dedicated worker child processes
- <DocIcon name="circle-check" /> Separate log files
- <DocIcon name="circle-check" /> Partitioned rows inside the SQLite database indexed by instance name

::: tip Instance Names Form Primary Keys
Do not rename configuration files in the file explorer. Use WebUI export/import or duplicate an instance and delete the old one. Renaming files directly breaks historical database associations.
:::

## <DocIcon name="circle-plus" /> Adding a Second Instance

<Steps>
<Step title="Configure second emulator">

Clone an emulator instance in MuMu or LDPlayer, ensuring each instance binds to a distinct ADB port. Never assign the same serial to both instances.

</Step>
<Step title="Create new configuration">

WebUI → Installed Configs → New. Enter `ap-2`. You can clone from `ap` to inherit task toggles and parameters.

</Step>
<Step title="Update device serial">

Update `Emulator.Serial` with the new port. If the two emulators target different server regions, update `PackageName` as well.

</Step>
<Step title="Stagger execution times">

Set differing `NextRun` times on resource-intensive tasks, or use randomized daily restart delays to prevent simultaneous logins. Concurrent screenshots on a shared CPU create frame capture latency.

</Step>
<Step title="Start instances sequentially">

Launch the first instance, confirm stability, and then start the second. Starting multiple emulators simultaneously creates cold-boot CPU contention.

</Step>
</Steps>

## <DocIcon name="drive" /> Resource Overhead

| Resource | Typical Footprint per Instance | Notes |
| --- | --- | --- |
| RAM | Python process ~200–400 MB + Emulator 2–4 GB | Emulators account for the vast majority of memory |
| CPU | Spikes on active template matching | Frame captures and OpenCV matching drive utilization |
| Storage | Logs consume several MBs daily | Managed via `Error.SaveErrorRetentionDays` |
| Network | Periodic update checks and telemetry | Minimal impact on game latency |

A machine with 16 GB RAM comfortably hosts 2 emulator instances. Hosting additional instances depends on single-core CPU throughput and SSD I/O. The Android host is constrained by mobile RAM and is recommended for a single instance only.

## <DocIcon name="lock" /> Account Vault

"Settings → Account" manages encrypted credentials:

| Action | Function |
| --- | --- |
| Create | Initializes an encrypted account profile |
| Lock / Unlock | Controls profile decryption state |
| Bind TPM | Encrypts keys via hardware TPM (where available) |
| Bind Machine | Encrypts keys via OS-level APIs (Windows DPAPI) |
| Apply | Assigns profile credentials to the active instance |
| Delete | Purges stored profile |

Account vault keys are tied to the local device: moving to a new computer or reinstalling the OS invalidates stored keys, requiring re-entry. This is by design.

## <DocIcon name="file" /> Importing & Exporting Configurations

| Objective | Procedure |
| --- | --- |
| Backup single instance | Export JSON from task configuration view |
| Migrate all instances | Copy `config/*.json` files |
| Share templates | Export JSON and remove device serials, SSH keys, and local paths |
| Restore deleted instances | Restore files from `AzurPilot_Data_Backup/<date>/` |

The import process validates and migrates configuration schemas. When importing across major version jumps, missing keys receive defaults while deprecated keys are discarded. Review key toggles after importing.

## <DocIcon name="circle-alert" /> Common Multi-Instance Issues

| Symptom | Root Cause |
| --- | --- |
| Two instances cross-click screens | Both instances are configured with the same ADB serial |
| Only one instance can capture frames | The screenshot backend targets default instances only (e.g. `nemu_ipc`) |
| Frequent ADB disconnects | Multiple adb server processes contending for port 5037 |
| 100% CPU usage and timeouts | Multiple intensive tasks running concurrently on insufficient CPU cores |
| Log streams interleave | The same instance name was spawned across multiple processes |

::: warning Only One Worker Process per Instance Name
`alas.py <instance>` lacks global singleton locks. Manually executing the command for an active instance spawns two workers operating on the same emulator simultaneously. Always verify process states in the WebUI before invoking CLI commands.
:::
