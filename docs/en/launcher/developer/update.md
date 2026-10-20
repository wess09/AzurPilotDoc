---
title: Update Pipelines & Mirrors
description: Core repository Git updates, uv dependency synchronization, launcher mTLS self-updates, and mirror failover strategies.
updated: 2026-10-20
---

# Update Pipelines & Mirrors

The launcher employs two separate update pipelines operating over distinct protocols: the core program updates via Git, while the launcher binary updates over mTLS using static manifests.

## <DocIcon name="refresh" /> Core Repository Updates

```text
git pull
  ├── Success → uv sync --frozen
  └── Failure → Exponential backoff retry (up to 20 attempts)
```

The 20-retry loop accommodates transient network latency when reaching GitHub from restrictive networks. Exceeding the retry limit directs users to the diagnostic error view rather than booting partially updated code.

### Deployment Configurations

The `deploy.<platform>[-cn].yaml` files govern update operations:

| Property | Description |
| --- | --- |
| `Git.Repository` | Remote Git repository URL |
| `Git.Branch` | Target branch (defaults to `master`) |
| `Git.GitExecutable` | Path to Git binary within `.venv` |
| `Git.GitProxy` | HTTP / SOCKS5 proxy URL |
| `Git.SSLVerify` | Toggle SSL certificate verification |
| `Python.PypiMirror` | Configured PyPI mirror index |

Six configuration variants:

| Platform | Global Profile | Mainland China Profile |
| --- | --- | --- |
| Windows | `deploy.windows.yaml` | `deploy.windows-cn.yaml` |
| macOS | `deploy.mac.yaml` | `deploy.mac-cn.yaml` |
| Linux / Unix | `deploy.unix.yaml` | `deploy.unix-cn.yaml` |

The CN configuration switches the repository URL to `git://git.pull/AzurPilot` and prioritizes regional PyPI mirrors.

### Dependency Synchronization

```bash
uv sync --frozen
```

- Locks strictly to `uv.lock` without recalculating versions.
- If dependency synchronization fails, the launcher halts at the error screen.
- `.venv` is fully relocatable, enabling folder migration across paths.

### Python Binary Mirrors

`setup.rs` iterates through download mirrors sequentially:

```text
1. registry.npmmirror.com/-/binary/python-build-standalone/
2. mirror.nju.edu.cn/github-release/astral-sh/python-build-standalone/
3. python-standalone.org/mirror/astral-sh/python-build-standalone/
4. github.com/astral-sh/python-build-standalone/releases/download/
```

PyPI packages query Aliyun, Tencent Cloud, and CERNET before trying upstream indexes.

## <DocIcon name="medal" /> Launcher Self-Updates

| Property | Value |
| --- | --- |
| Default Manifest | `https://launcher-api.azurpilot.com/updata/stable.json` |
| Override Variable | `LAUNCHER_UPDATE_URL` |
| Transport Protocol | mTLS (client certificates injected by CI) |
| Binary Storage | Cloudflare R2 + CNB Releases |
| Manifest Hosting | Cloudflare Pages / Static Assets (no Worker overhead) |
| Download Redirection | `launcher-download.azurpilot.com` via HTTP 302 |

::: tip Why Static Assets Instead of Cloudflare Workers
Cloudflare Workers incur per-request billing and introduce runtime dependencies. Because update manifests are static JSON files, hosting them as static assets costs zero worker quota.
:::

### Integrity Validation Flow

1. Establishes an mTLS connection, validating server identity.
2. Fetches `stable.json` and evaluates version semver strings.
3. Downloads the release payload, validating byte size and SHA-256 hashes.
4. Replaces the active executable binary and restarts the process.

If downloads fail, the updater fails over to secondary mirrors; if all fail, it retains the existing binary without interrupting operation.

## <DocIcon name="handshake" /> Cross-Track Interactions

| Event | Core Program | Desktop Launcher |
| --- | --- | --- |
| Update Core Program | Source and dependencies change | Binary remains unchanged |
| Update Launcher | Unchanged | Binary executable is replaced |
| Launcher requires newer Python | Unchanged | Rebuilds `.venv` automatically |
| Core requires updated packages | Handled via `uv sync` | Unchanged |

::: warning Avoid Updating Both Simultaneously
Update the launcher first to confirm compatibility with newer core architectures, then update the core program. Updating both at the same time makes it difficult to diagnose regressions.
:::

## <DocIcon name="cloud" /> Proxy Bypass Policies

The launcher explicitly **bypasses system proxies** during these operations:

- Updating source repositories, downloading embedded Python, uv, and dependencies.
- Connecting the WebView to the local WebUI (`--no-proxy-server`).

Local loopback connections must never traverse proxies, and download pipelines already embed dedicated mirrors and retry logic. System proxies add unnecessary points of failure.

If a proxy is strictly required, configure it inside `Git.GitProxy` in `deploy.yaml` rather than routing global system traffic.

## <DocIcon name="settings" /> Private Deployments

| Requirement | Approach |
| --- | --- |
| Use custom core fork | Update `Git.Repository` and `Git.Branch` in `deploy.yaml` |
| Use custom launcher updates | Compile launcher with custom `LAUNCHER_UPDATE_URL` |
| Internal network mirror | Host `stable.json` and binaries matching standard schema |
| Air-gapped environments | Complete bootstrap once online, then launch with `--skip-update` |
