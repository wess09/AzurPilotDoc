---
title: Testing & CI
description: Python unit testing, Vitest and Playwright suites, import smoke tests, schema diff checks, and GitHub Actions CI jobs.
updated: 2026-10-20
---

# Testing & CI

AzurPilot adheres to a layered testing philosophy: **low-cost checks execute on every commit, while resource-intensive end-to-end checks run within specific scopes**. CI verifies schema consistency, module importability, and regression safety; visual recognition on live hardware requires manual verification.

## <DocIcon name="box" /> Testing Layers

| Testing Tier | Framework | Scope | Characteristics |
| --- | --- | --- | --- |
| Python Unit Tests | `unittest` | 200+ test suites | Device-independent; uses mock frames and temporary configs |
| Scenario Tests | `pytest` | `tests/shop_event`, etc. | Parameterized feature matrices |
| Frontend Unit Tests | Vitest | Components, hooks, utilities | Executed inside jsdom environments |
| Frontend E2E Tests | Playwright | Live server and mock suites | Validates core interaction workflows |
| Import Smoke Tests | Internal script | Scans `module/` and `deploy/` | Subprocess imports with whitelisted failures |
| Artifact Validation | `git diff` | Universal | Detects uncommitted schema and contract drift |

## <DocIcon name="laptop" /> Running Tests Locally

```bash
# Full Python unit test suite
uv run python -m unittest discover -s tests

# Run isolated test suite
uv run python -m unittest tests.test_api

# Pytest scenario tests
uv run pytest tests/shop_event

# Import smoke test (offline)
uv run python -m dev_tools.import_smoke_test

# Fast linter
uv run ruff check . --select E9,F63,F7,F82 --ignore F821,F722
```

Frontend validation:

```bash
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run test:e2e:mock --prefix frontend
```

::: tip Run Targeted Suites First
Project guidelines prioritize running tests directly related to modified modules. Full regression sweeps are reserved for cross-cutting changes affecting three or more subsystems.
:::

## <DocIcon name="cloud" /> GitHub Actions CI Jobs

Configured in `.github/workflows/ci.yml`, triggered on pushes and PRs:

| Job | Environment Matrix | Validation Scope |
| --- | --- | --- |
| `game-data` | Ubuntu / Windows / macOS-14 | Identity persistence, stock exchange, auth migration, deployment upgrades |
| `frontend` | Ubuntu + Node 24 | Lockfile sources, API schema diffs, unit/e2e tests, production builds |
| `ruff` | Ubuntu | Evaluates syntax rules `E9,F63,F7,F82` (ignoring `F821,F722`) |
| `button-config-check` | Ubuntu | Re-executes `button_extract` and `config_updater`, evaluating `git diff --exit-code` |
| `import-smoke` | Ubuntu | Full module imports + `tests.test_ci_import` |

Associated workflows:

- `ci-report-placeholder.yml`: Posts placeholder PR comments upon submission.
- `ci-report.yml`: Updates placeholder comments with execution metrics upon CI conclusion.

### macOS Platform Matrix

Workflows run on Apple Silicon (`macos-14`). `macos-15-intel` is excluded because `llvmlite` lacks x86_64 prebuilt wheels for that target, causing unavoidable `uv sync` failures.

### API Contract Validation

```bash
uv run python -m dev_tools.export_api_schema
git diff --exit-code -- frontend/src/api/generated.ts frontend/src/api/contract.json
```

Modifying backend Pydantic models without exporting updated contracts fails CI immediately.

### Schema Artifact Validation

```bash
uv run -m dev_tools.button_extract
uv run -m module.config.config_updater
git diff --exit-code
```

This check prevents two common errors: modifying YAML definitions without recompiling, and committing manual edits to generated files.

## <DocIcon name="settings" /> End-to-End Configurations

| Command | Configuration | Purpose |
| --- | --- | --- |
| `npm run test:e2e` | Default | Connects to live backend; verifies full operational flows |
| `npm run test:e2e:mock` | `playwright.mock.config.ts` | Runs against mock services; recommended for UI adjustments |
| `npx playwright test --config playwright.mind.config.ts` | Mind Calculator | Dedicated dock scanning and calculation verification |

## <DocIcon name="shield" /> Testing Boundaries

| Automated Test Coverage | Manual Verification Required |
| --- | --- |
| Schema migrations and parameter validation | Live visual recognition accuracy |
| Scheduler state machines and recovery tiers | Real-world emulator timing quirks |
| API contracts and WebSocket authentication | Transient in-game event mechanics |
| Frontend form interactions and edit queues | OEM-specific Android overlay permissions |

::: warning Static Code Passing Does Not Prove Device Reliability
Documentation must distinguish static code validation from live hardware verification. Passing CI suites does not prove visual recognition functions on live game screens.
:::

## <DocIcon name="circle-check" /> Pre-Submission Checklist

- [ ] Unit tests covering modified modules pass
- [ ] `ruff` lint checks pass cleanly
- [ ] Frontend changes verified via `typecheck` and `vitest`
- [ ] YAML changes recompiled via `config_updater`
- [ ] Button template updates processed via `button_extract`
- [ ] Backend API adjustments exported via `export_api_schema`
- [ ] Generated schema files committed alongside source changes
- [ ] PR descriptions document test methodologies and unverified components
