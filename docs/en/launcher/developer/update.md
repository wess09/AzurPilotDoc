---
title: Update Pipelines & Mirrors
description: Launcher 3.x component bootstrap, core deploy scripts, Stable/Canary updates, mTLS payloads and mirror failover.
updated: 2026-10-31
---

# Update Pipelines & Mirrors

There are **three distinct processes**: deploying Git/ADB bootstrap components, updating the AzurPilot core, and updating the launcher itself.

## Components and core

The public `stable.json` manifest includes `runtime` schema 2 with Git/ADB component metadata and `deploy/**` bootstrap files. Components live under `.azurpilot/tools/`. **Deploy** only installs these bootstrap files.

**Start** uses embedded uv for Python 3.14.x, then deploy scripts to update the core, synchronize Python dependencies and build the WebUI. The deploy implementation uses `uv sync --no-dev --no-install-project` with mirror fallbacks; the old claim that it always runs `uv sync --frozen` is incorrect. Explicit **Repair** redownloads tools and rebuilds `.venv` while retaining user configuration.

## Stable, Canary and mirrors

The build-time `LAUNCHER_UPDATE_URL` selects the public manifest URL; `https://ap.launcher-update.nanoda.work/updata/stable.json` is a fallback. **The manifest does not require mTLS.** Non-GitHub payload downloads may present an embedded client identity and are checked with SHA-256.

`updateChannel` is `stable` (default) or `canary`. `updateSource` is `auto`, `official`, `github`, or `cloudflare`, and changes payload priority only. Auto prefers the official source when the original system language is Simplified Chinese and the time zone is Beijing; otherwise it prefers GitHub, Cloudflare, then official. HTTP 429 can trigger reduced concurrency and Retry-After backoff; partial transfers can resume.

Launcher checks for new versions periodically (roughly every 10 minutes). The manifest's runtime, stable launcher and Canary fields are independently updated.

See [First Run](/en/launcher/user/first-run) and [Build & Release](/en/launcher/developer/build-release).
