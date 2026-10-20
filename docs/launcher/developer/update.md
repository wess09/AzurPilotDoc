---
title: 更新链路与镜像
description: 核心仓库的 git 更新、uv 依赖同步、启动器 mTLS 自更新、镜像与回退策略。
updated: 2026-10-20
---

# 更新链路与镜像

启动器有两条更新线，走完全不同的协议：核心代码用 git，启动器自身用 mTLS + 静态清单。

## <DocIcon name="refresh" /> 核心仓库更新

```text
git pull
  ├── 成功 → uv sync --frozen
  └── 失败 → 指数退避重试（至多 20 次）
```

重试 20 次不是为了「等网络恢复」，而是为了扛住国内访问 GitHub 的间歇性失败。超过次数后进入错误页，不会带着半更新的代码启动。

### 部署配置

`deploy.<platform>[-cn].yaml` 控制更新行为：

| 字段 | 说明 |
| --- | --- |
| `Git.Repository` | 仓库地址 |
| `Git.Branch` | 默认 `master` |
| `Git.GitExecutable` | `.venv` 内 git 的路径 |
| `Git.GitProxy` | HTTP / SOCKS5 代理 |
| `Git.SSLVerify` | 是否校验证书 |
| `Python.PypiMirror` | PyPI 镜像 |

六个变体：

| 平台 | 国际 | 国内 |
| --- | --- | --- |
| Windows | `deploy.windows.yaml` | `deploy.windows-cn.yaml` |
| macOS | `deploy.mac.yaml` | `deploy.mac-cn.yaml` |
| Linux / Unix | `deploy.unix.yaml` | `deploy.unix-cn.yaml` |

CN 版把仓库地址换成 `git://git.pull/AzurPilot`，并优先国内 PyPI。

### 依赖同步

```bash
uv sync --frozen
```

- 严格按 `uv.lock`，不重新解析版本。
- 依赖安装失败 → 错误页，不启动后端。
- `.venv` 是可重定位的，整个目录随项目移动。

### Python 下载源

`setup.rs` 按顺序尝试：

```text
1. registry.npmmirror.com/-/binary/python-build-standalone/
2. mirror.nju.edu.cn/github-release/astral-sh/python-build-standalone/
3. python-standalone.org/mirror/astral-sh/python-build-standalone/
4. github.com/astral-sh/python-build-standalone/releases/download/
```

PyPI 依次使用阿里云、腾讯云、CERNET，最后官方源。

## <DocIcon name="medal" /> 启动器自更新

| 项 | 值 |
| --- | --- |
| 默认清单 | `https://launcher-api.azurpilot.com/updata/stable.json` |
| 覆盖变量 | `LAUNCHER_UPDATE_URL` |
| 传输 | mTLS（客户端证书由 CI 注入） |
| 载荷 | R2 + CNB Release |
| 清单托管 | Cloudflare 静态资源（无自定义 Worker 脚本） |
| 下载入口 | `launcher-download.azurpilot.com` 做 302 |

::: tip 为什么用静态资源而不是 Worker
Cloudflare Worker 按请求计费，也会引入「每次请求都执行」的运行时依赖。清单是静态 JSON，放在静态资源上即可，不消耗 Workers 配额。
:::

### 校验

1. 通过 mTLS 建立连接，确认服务端身份。
2. 拉取 `stable.json`，比较版本。
3. 下载载荷，校验大小与摘要。
4. 替换可执行文件并重启。

失败时回退到下一个镜像；全部失败则保留当前版本，不阻断使用。

## <DocIcon name="handshake" /> 两条线的交互

| 事件 | 核心 | 启动器 |
| --- | --- | --- |
| 更新核心 | 代码与依赖变化 | 不变 |
| 更新启动器 | 不变 | 二进制变化 |
| 启动器要求新 Python | 不变 | 重建 `.venv` |
| 核心要求新依赖 | `uv sync` 处理 | 不变 |

::: warning 不要同时更新两者
先更新启动器到能支持新核心的版本，再更新核心；或者反过来确认新启动器兼容当前核心。同时更新出问题时，很难判断是哪一边导致的。
:::

## <DocIcon name="cloud" /> 代理与直连

启动器在以下场景**绕过系统代理**：

- 更新代码、内置 Python、uv 与依赖安装。
- WebView 连接本地 WebUI（`--no-proxy-server`）。

原因：本地回环不该走代理；下载链路已有自己的镜像与重试策略，系统代理反而增加失败点。

需要代理时，写在 `deploy.yaml` 的 `Git.GitProxy`，不要让系统代理介入全部流量。

## <DocIcon name="settings" /> 私有部署

| 需求 | 做法 |
| --- | --- |
| 用自己的核心 fork | 改 `Git.Repository` 与 `Branch` |
| 用自己的更新源 | 构建时设 `LAUNCHER_UPDATE_URL` |
| 内网镜像 | 部署 `stable.json` 与载荷，保持字段结构一致 |
| 离线环境 | 首次在有网环境完成自举，之后 `--skip-update` 启动 |
