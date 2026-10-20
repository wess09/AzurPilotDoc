---
title: 更新鏈路與鏡像
description: 核心倉庫的 git 更新、uv 依賴同步、啟動器 mTLS 自更新、鏡像與回退策略。
updated: 2026-10-20
---

# 更新鏈路與鏡像

啟動器有兩條更新線，走完全不同的協議：核心代碼用 git，啟動器自身用 mTLS + 靜態清單。

## <DocIcon name="refresh" /> 核心倉庫更新

```text
git pull
  ├── 成功 → uv sync --frozen
  └── 失败 → 指数退避重试（至多 20 次）
```

重試 20 次不是為了「等網絡恢復」，而是為了扛住國內訪問 GitHub 的間歇性失敗。超過次數後進入錯誤頁，不會帶着半更新的代碼啟動。

### 部署配置

`deploy.<platform>[-cn].yaml` 控制更新行為：

| 字段 | 説明 |
| --- | --- |
| `Git.Repository` | 倉庫地址 |
| `Git.Branch` | 預設 `master` |
| `Git.GitExecutable` | `.venv` 內 git 的路徑 |
| `Git.GitProxy` | HTTP / SOCKS5 代理 |
| `Git.SSLVerify` | 是否校驗證書 |
| `Python.PypiMirror` | PyPI 鏡像 |

六個變體：

| 平台 | 國際 | 國內 |
| --- | --- | --- |
| Windows | `deploy.windows.yaml` | `deploy.windows-cn.yaml` |
| macOS | `deploy.mac.yaml` | `deploy.mac-cn.yaml` |
| Linux / Unix | `deploy.unix.yaml` | `deploy.unix-cn.yaml` |

CN 版把倉庫地址換成 `git://git.pull/AzurPilot`，並優先國內 PyPI。

### 依賴同步

```bash
uv sync --frozen
```

- 嚴格按 `uv.lock`，不重新解析版本。
- 依賴安裝失敗 → 錯誤頁，不啟動後端。
- `.venv` 是可重定位的，整個目錄隨項目移動。

### Python 下載源

`setup.rs` 按順序嘗試：

```text
1. registry.npmmirror.com/-/binary/python-build-standalone/
2. mirror.nju.edu.cn/github-release/astral-sh/python-build-standalone/
3. python-standalone.org/mirror/astral-sh/python-build-standalone/
4. github.com/astral-sh/python-build-standalone/releases/download/
```

PyPI 依次使用阿里雲、騰訊雲、CERNET，最後官方源。

## <DocIcon name="medal" /> 啟動器自更新

| 項 | 值 |
| --- | --- |
| 預設清單 | `https://launcher-api.azurpilot.com/updata/stable.json` |
| 覆蓋變數 | `LAUNCHER_UPDATE_URL` |
| 傳輸 | mTLS（客戶端證書由 CI 注入） |
| 載荷 | R2 + CNB Release |
| 清單託管 | Cloudflare 靜態資源（無自定義 Worker 腳本） |
| 下載入口 | `launcher-download.azurpilot.com` 做 302 |

::: tip 為什麼用靜態資源而不是 Worker
Cloudflare Worker 按請求計費，也會引入「每次請求都執行」的運行時依賴。清單是靜態 JSON，放在靜態資源上即可，不消耗 Workers 配額。
:::

### 校驗

1. 通過 mTLS 建立連接，確認伺服端身份。
2. 拉取 `stable.json`，比較版本。
3. 下載載荷，校驗大小與摘要。
4. 替換可執行檔案並重新啟動。

失敗時回退到下一個鏡像；全部失敗則保留當前版本，不阻斷使用。

## <DocIcon name="handshake" /> 兩條線的交互

| 事件 | 核心 | 啟動器 |
| --- | --- | --- |
| 更新核心 | 代碼與依賴變化 | 不變 |
| 更新啟動器 | 不變 | 二進制變化 |
| 啟動器要求新 Python | 不變 | 重建 `.venv` |
| 核心要求新依賴 | `uv sync` 處理 | 不變 |

::: warning 不要同時更新兩者
先更新啟動器到能支援新核心的版本，再更新核心；或者反過來確認新啟動器兼容當前核心。同時更新出問題時，很難判斷是哪一邊導致的。
:::

## <DocIcon name="cloud" /> 代理與直連

啟動器在以下場景**繞過系統代理**：

- 更新代碼、內置 Python、uv 與依賴安裝。
- WebView 連接本地 WebUI（`--no-proxy-server`）。

原因：本地迴環不該走代理；下載鏈路已有自己的鏡像與重試策略，系統代理反而增加失敗點。

需要代理時，寫在 `deploy.yaml` 的 `Git.GitProxy`，不要讓系統代理介入全部流量。

## <DocIcon name="settings" /> 私有部署

| 需求 | 做法 |
| --- | --- |
| 用自己的核心 fork | 改 `Git.Repository` 與 `Branch` |
| 用自己的更新源 | 構建時設 `LAUNCHER_UPDATE_URL` |
| 內網鏡像 | 部署 `stable.json` 與載荷，保持字段結構一致 |
| 離線環境 | 首次在有網環境完成自舉，之後 `--skip-update` 啟動 |
