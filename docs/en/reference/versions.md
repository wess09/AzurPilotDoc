---
title: Source Version Index
description: Repository commits, branches, audit timestamps, unverified items, and asset licensing baselines.
updated: 2026-10-20
---

# Source Version Index

The documentation on this site reflects read-only code audits of the current repository branches rather than paraphrasing historical documentation.

## <DocIcon name="clipboard" /> Audited Repository Baselines

| Project Name | Remote Repository | Default Branch | Audited Commit SHA | Commit Timestamp |
| --- | --- | --- | --- | --- |
| Core Program | `wess09/AzurPilot` | `master` | `7de6bb914da5798e76ef34a85a75648a526d319f` | 2026-10-20 |
| Android Host | `wess09/AzurPilot-for-Android` | `main` | `1235c0a6d2d1f1bc334545e246eee2d93db756fa` | 2026-10-20 |
| Desktop Launcher | `wess09/AzurPilotLauncher` | `main` | `44a8715afef5c5be02184d9c7a08bf10a7b6c89f` | 2026-10-19 |

::: warning Discrepancies in Default Branch Names
The core program repository uses `master`, while the Android host and desktop launcher use `main`. Links pointing to `/blob/main/` on the core repository return HTTP 404.
:::

## <DocIcon name="search" /> Audit Methodology

- Cloned shallow repositories (`--depth 1`) for all three projects at current HEAD.
- Parsed `AGENTS.md`, `CLAUDE.md`, and multilingual README documentation.
- Scanned repository trees across `module/`, `frontend/`, `app/`, `rootfs/`, `server/`, and `src/`.
- Reviewed 54 internal architecture specifications in `docs/modules/` and 32 design documents across `doc/`.
- Validated configurations against `task.yaml`, `argument.yaml`, `args.json`, and `contract.json`.
- Inspected CI pipelines in `.github/workflows/` and `.cnb/`.
- Extracted task matrix (102 commands) and API schemas (72 methods) using automated extraction scripts.

## <DocIcon name="badge-dollar" /> Telemetry and Counts

| Dimension | Measured Count | Extraction Source |
| --- | --- | --- |
| Task Commands | 102 | `args.json` |
| Parameter Groups | 167 | `argument.yaml` |
| WebSocket RPC Methods | 72 | `frontend/src/api/contract.json` |
| Model Context Protocol Tools | 18 | `mcp_server_sse.py` |
| Core Architectural Specifications | 54 documents | `docs/modules/` |
| Python Unit Test Modules | 209 files | `tests/` |

## <DocIcon name="circle-check" /> Verified vs. Unverified Items

### Verified (Static Source Analysis)

- Consistency across module boundaries, parameter paths, API contracts, and CI matrices.
- Code snippets and CLI flags cross-referenced with repository automation scripts.
- Documentation site health: VitePress build, TypeScript typechecks, link integrity, SEO metadata, 31 browser test cases, 112 breakpoint permutations, 5 accessibility scans. Full metrics are documented in `docs-audit/validation-report.md`.

### Unverified (Requires Live Hardware Testing)

| Item | Reason Unverified |
| --- | --- |
| Live in-game task execution | Requires active accounts, emulators, and game clients; consumes game resources |
| Comprehensive emulator compatibility | Requires physical testing across all commercial emulator brands |
| Full Android hardware regression | Requires physical testing across diverse OEM vendor skins; documented tests cover Redmi Note 10 Pro only |
| Real-world NPU inference performance | Dependent on device SoC and vendor driver versions; requires on-device initialization |
| Quick Tunnel throughput limits | Dependent on Cloudflare network topology and edge availability |
| Cross-platform desktop launcher behavior | CI validates compilation and unit tests; physical multi-OS testing requires manual execution |

::: warning Documentation Excludes Speculation
Unverified behavior is explicitly marked as "unverified" or "requires testing" rather than asserting unconfirmed functionality.
:::

## <DocIcon name="scale" /> Conflict Resolution Hierarchy

| Discrepancy Context | Authoritative Source |
| --- | --- |
| Source Code vs. README | Source code takes precedence |
| Configuration Schema / Tests vs. Documentation | Schemas and test suites take precedence |
| Conflicting Inter-Repository Documentation | Code takes precedence (e.g. Android versioning baseline formulas) |

## <DocIcon name="folder" /> Asset Provenance & Licensing

| Asset Category | Source Location | License |
| --- | --- | --- |
| Android Screenshots | `AzurPilot-for-Android/docs/screenshots/` | AGPL-3.0 |
| Launcher Screenshots | `AzurPilotLauncher/screenshots/` | GPL-3.0 |
| WebUI Screenshots | `AzurPilot/doc/GUI.png` | GPL-3.0 |
| Project Logo Mark | `AzurPilot/doc/logo.webp` | GPL-3.0 |
| Architectural Diagrams | Original Documentation SVG | Apache-2.0 |
| Iconography | Original SVG / Lucide Icons | ISC |

No proprietary in-game artwork is hosted. Game interface elements captured in screenshots remain the intellectual property of the game publisher.
