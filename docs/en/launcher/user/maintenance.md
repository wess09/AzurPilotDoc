---
title: Update, Repair & Uninstall
description: Launcher 3.x Stable and Canary settings, component and Python environment repair, log export, data retention and troubleshooting.
updated: 2026-10-31
---

# Update, Repair & Uninstall

**Launcher binaries, Git/ADB components and the AzurPilot core update independently.** A launcher self-update does not reinstall the core.

## Updates and settings

Select the **Stable** (default) or **Canary** update channel in Settings. Download source priority can be Auto, Official, GitHub or Cloudflare CDN, with fallback and integrity verification. Settings also control component/Python/PyPI mirrors, background music (off by default), reduced motion, sleep prevention and autostart. The background video pauses when the window is hidden; preventing system sleep does not require keeping the screen on.

## Repair versus deploy

| Action | Effect |
| --- | --- |
| Deploy | Installs Git/ADB and deploy scripts |
| Start | Sets up Python, core and WebUI, then starts the backend |
| Repair | Redownloads runtime tools and rebuilds `.venv`; retains source, `config/` and `log/` |
| Launcher update | Replaces the launcher executable, not user configuration |

Do not wipe the installation directory or run destructive Git commands just to recover from a failed download. Stop the backend first and use **Repair**. The launcher can export a ZIP of diagnostic logs in the background. Include the log ZIP and reproduction details in bug reports instead of screenshots alone; review logs for sensitive information before sharing.

On macOS, newer builds use `AzurPilot.app/Contents/AzurPilot` for application data and attempt to migrate older layouts. Back up `config/` and statistics before moving machines or uninstalling.

See [First Run](/en/launcher/user/first-run) and [Update Pipeline](/en/launcher/developer/update).
