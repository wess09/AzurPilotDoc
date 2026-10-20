---
title: Contribution Guide
description: "Guidelines for issues and pull requests: triage scope, code vs. documentation boundaries, and unaccepted changes."
updated: 2026-10-20
---

# Contribution Guide

All three AzurPilot projects are community-maintained open-source repositories. Contributions beyond writing code—such as reproducing bugs, refining documentation, and testing emulator compatibility—are equally valuable.

## <DocIcon name="gift" /> Contribution Opportunities

| Contribution Type | Impact | Submission Channel |
| --- | --- | --- |
| Reproducing bugs with full logs | High | GitHub Issues |
| Refining and translating documentation | High | Documentation repository or `docs/` |
| Authoring new event campaign scripts | High | `campaign/` |
| Fixing vision or scheduling defects | High | Pull Requests |
| Verifying emulator compatibility | Moderate | GitHub Issues with device details |
| Localizing UI and schemas | Moderate | `i18n/*.json`, `locales/*.yml` |
| Proposing novel features | Requires RFC | Issue proposals |

## <DocIcon name="circle-alert" /> Submitting Issues

An actionable issue report includes:

```text
Version: Core 7de6bb9 / Launcher 2.2.5 / None (Android)
Environment: Windows 11 + MuMu12 16384 + 1280x720
Reproduction: Settings → Tasks → Research → Enable → Run Now
Expected: Claims completed project and starts new queue
Actual: Stalled at "Research Project List"; trailing 20 log lines attached
Evidence: Screenshot and log.txt from log/error/ap/2026-10-20_10-00-00/
Troubleshooting Attempted: Switched capture backend, rebooted emulator
```

::: danger Never Attach Private Credentials
Never post `config/deploy.yaml`, `password.txt`, `remote-access.json`, private SSH keys, or unredacted account screenshots. Maintainers will never ask for credentials.
:::

## <DocIcon name="handshake" /> Submitting Pull Requests

### Workflow

1. Fork the repository and branch from the default branch (`master` for core; `main` for Android and launcher).
2. Keep changes scoped to a single topic.
3. Run relevant unit tests and schema compilers.
4. Fill out `.github/PULL_REQUEST_TEMPLATE.md`.
5. Ensure all CI checks pass cleanly.

### Core Repository Invariants

| Target Area | Mandatory Requirement |
| --- | --- |
| Configuration YAML | Execute `config_updater` and commit generated artifacts |
| Button Assets | Execute `button_extract` |
| API Schemas | Execute `export_api_schema` |
| New Automation Tasks | Add 5-language i18n entries, module docs, and index references |
| Module Behavior | Update matching specifications under `docs/modules/` |

### Unaccepted Changes

- Never manually edit `args.json`, `menu.json`, `config_generated.py`, `generated.ts`, or `contract.json`.
- Do not use `--no-verify` to bypass pre-commit hooks.
- Avoid mixing unrelated formatting adjustments into functional pull requests.
- Never commit `config/`, `log/`, or `.venv/` files.
- Do not check off test checklist items without running the tests.

## <DocIcon name="pencil" /> Code Style Standards

| Language | Conventions |
| --- | --- |
| Python | 4-space indentation; English identifiers; adhere to existing module structure |
| TypeScript | Strict mode; colocate components; avoid introducing secondary state libraries |
| Rust | `cargo fmt`; platform logic partitioned via `#[cfg]`; logging via `tracing` |
| Kotlin | 4-space indentation; KDoc detailing threading and lifecycle rules |
| Markdown | Concise technical prose; state conclusions first before technical details |

## <DocIcon name="file" /> Documentation Contributions

Read [Documentation Maintenance](/en/contributing/docs). Core principle: **facts derive from source code and reproducible experiments**, never assumptions.

## <DocIcon name="shield" /> Security Disclosures

If you discover security vulnerabilities (credential leakage, privilege escalation, command injection), do not open public issues. Report them privately through the repository's GitHub Security Advisory page or directly to maintainers.

## <DocIcon name="scale" /> Licensing

| Repository | License | Requirement |
| --- | --- | --- |
| Core Program | GPL-3.0 | Distributed modifications must remain open source |
| Android Host | AGPL-3.0 | Networked services must make source available |
| Desktop Launcher | GPL-3.0 | Distributed modifications must remain open source |

Contributing confirms agreement to license contributions under the corresponding repository license.
