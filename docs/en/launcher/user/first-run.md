---
title: First Run & Runtime Setup
description: "Launcher 3.x two-stage deployment and startup: component downloads, Python bootstrap, core synchronization and WebUI login."
updated: 2026-10-31
---

# First Run & Runtime Setup

Launcher 3.x separates **Deploy** from **Start**. You do not need to install Git, ADB, uv or Python before running the launcher.

## Deploy components

On a fresh installation, select **Deploy**. The launcher reads `stable.json.runtime` (schema 2), downloads and verifies Git and ADB archives, installs them in `.azurpilot/tools/`, and retrieves the required `deploy/**` scripts and platform templates. When this finishes the home button changes to **Start**. Deploy alone does **not** install Python or build the WebUI.

## Start the application

1. Embedded uv installs Python 3.14.x and prepares `.venv` and the deploy bootstrap dependency.
2. `deploy.git` obtains or updates AzurPilot's core repository.
3. The deploy workflow synchronizes dependencies from `uv.lock` and builds the WebUI (Node.js may be required).
4. The launcher starts `gui.py` (default local port `22267`), opens a protected WebSocket v2 channel and issues a one-time ticket for WebUI sign-in.

Git/ADB tools are outside `.venv` and survive a Python environment rebuild.

## Controls and troubleshooting

The home page offers deploy, start, stop, update checks, environment repair, and log archive export. A running operation needs a second click to confirm cancellation. Settings include Stable/Canary, mirrors, background audio, reduced motion, sleep prevention and startup preferences.

| Symptom | What to check |
| --- | --- |
| Component download failed | Network, selected component mirror, free disk space |
| Missing `pyproject.toml` | Incomplete core checkout; use **Repair** |
| Dependency sync or build failed | PyPI mirror, `uv.lock`, Node.js, build logs |
| Backend timeout | Port `22267`, launcher/backend logs |
| Need to report a bug | Export the ZIP of logs; do not send only screenshots |

See [Maintenance](/en/launcher/user/maintenance) and [Architecture](/en/launcher/developer/architecture).
