---
title: 安裝
description: 通過桌面啟動器、Android APK、Docker 或源碼安裝 AzurPilot，並驗證安裝結果。
updated: 2026-10-20
---

# 安裝

裝之前請先確認[環境與兼容性](/zh-HK/guide/requirements)。下面四條路徑按「推薦程度」排序，普通用戶優先看啟動器。

## <DocIcon name="download" /> 桌面啟動器（推薦）

### 下載

從 [官網下載頁](https://azurpilot.com/download.html) 或 [GitHub Releases](https://github.com/wess09/AzurPilotLauncher/releases/latest) 獲取對應系統與 CPU 架構的壓縮包。國內網絡選擇帶 `-cn` 的鏡像版。

### 解壓縮與運行

<Steps>
<Step title="解壓縮到固定目錄">

啟動器會在自身目錄下建立 `.venv`、拉取核心倉庫並儲存配置。不要放在臨時目錄或只讀位置，也不要放在中文路徑兼容性差的同步盤裏。

</Step>
<Step title="運行啟動器">

- <DocIcon name="monitor" /> **Windows**：雙擊 `alas-launcher.exe`，需要管理員權限（安裝 ADB 與寫入系統目錄）。會彈 UAC。
- <DocIcon name="laptop" /> **macOS**：打開 `AzurPilot.app`。未簽名程序可能被 Gatekeeper 攔截，見下方説明。
- <DocIcon name="wrench" /> **Linux**：`chmod +x alas-launcher && ./alas-launcher`。

</Step>
<Step title="等待環境初始化">

啟動畫面會顯示：建立 `.venv` → 下載 Python 3.14.6 → 更新倉庫 → `uv sync --frozen`。首次啟動需要聯網，耗時取決於網絡，通常幾分鐘。

</Step>
<Step title="進入 WebUI">

窗口打開時已經完成登入，直接進入 AzurPilot WebUI。預設連接埠 `22267`（啟動器會指定連接埠，核心程序自身的預設連接埠是 `25548`）。

</Step>
</Steps>

::: warning macOS 首次打開失敗
程序未經 Apple 開發者簽名。若提示「無法驗證開發者」，在終端執行：

```bash
xattr -dr com.apple.quarantine /Applications/AzurPilot.app
```

然後重新打開。不要從「系統設定 → 隱私與安全性」反覆點擊「仍要打開」。
:::

::: tip Windows 缺少 WebView2
Tauri 依賴 WebView2。Windows 11 已內置；Windows 10 若提示缺失，安裝 [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) 後重試。
:::

## <DocIcon name="smartphone" /> Android

完整步驟見 [Android 安裝與架構選擇](/zh-HK/android/user/install)。簡要流程：

1. <DocIcon name="clipboard" /> 確認設備為 Android 9.0+、ARM64 或 x86_64。
2. <DocIcon name="download" /> 下載與架構匹配的**完整版 APK**（內置 Runtime）或**輕量增量 APK**（首次啟動下載約 1 GB Runtime）。
3. <DocIcon name="clock" /> 安裝並啟動，等待 rootfs 解壓縮（1–3 分鐘）。
4. <DocIcon name="lock" /> 按提示啟用 ADB（內置無線配對）或使用 Root。
5. <DocIcon name="settings" /> 在應用內打開 AzurPilot 控制台配置實例。

## <DocIcon name="box" /> Docker

適合 NAS、伺服器與無桌面環境。容器只跑 WebUI 與調度器，模擬器仍在宿主機：

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
docker compose up -d --build
```

`docker-compose.yml` 使用 `network_mode: host`，容器內以 `.venv/bin/python gui.py` 啟動。國內構建可把 Dockerfile 換成 `deploy/docker/Dockerfile.cn`，並通過 `UV_INDEX_URL` 指定鏡像。

::: tip 首次啟動較慢
鏡像分兩階段構建：Node 24 構建前端，Python 3.14 安裝運行時依賴。首次 `--build` 會下載較多內容，後續重建會複用快取。
:::

## <DocIcon name="laptop" /> 源碼運行

適用於開發、調試與自定義修改。

### 依賴

- <DocIcon name="circle-check" /> Python **3.14**（版本要求以 `pyproject.toml` 為準）
- <DocIcon name="circle-check" /> [uv](https://github.com/astral-sh/uv)
- <DocIcon name="circle-check" /> Node.js（前端構建；`gui.py` 會在 `frontend/dist` 缺失時自動安裝依賴並構建）

### 步驟

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
uv sync --frozen --no-dev
uv run python gui.py
```

瀏覽器訪問 `http://127.0.0.1:25548`。預設監聽 `0.0.0.0`，連接埠與監聽地址來自 `config/deploy.yaml` 的 `WebuiHost` / `WebuiPort`。

常用啟動參數：

```bash
uv run python gui.py --port 25548 --host 127.0.0.1 --key "your-password"
```

| 參數 | 作用 |
| --- | --- |
| `--host` | 覆蓋 `WebuiHost` |
| `-p, --port` | 覆蓋 `WebuiPort` |
| `-k, --key` | 設定訪問密碼 |
| `--ssl-key` / `--ssl-cert` | 啟用 HTTPS |
| `--run <实例名>` | 啟動時直接運行指定實例 |

### 驗證安裝

```bash
# 导入冒烟检查：不连接模拟器，只验证模块可加载
uv run python -m dev_tools.import_smoke_test

# Python 单元测试
uv run python -m unittest discover -s tests
```

WebUI 能打開、任務列表能渲染、日誌無 traceback，就説明後端裝好了。設備連接是下一步。

## <DocIcon name="circle-check" /> 安裝完成之後

<ul class="ap-linklist">
<li><a href="/zh-HK/guide/first-run">第一次運行<span class="desc">連接模擬器並跑通一個任務</span></a></li>
<li><a href="/zh-HK/azurpilot/user/device">連接模擬器與 ADB<span class="desc">Serial、截圖方案與控制方案</span></a></li>
<li><a href="/zh-HK/troubleshooting/">疑難排解<span class="desc">初始化失敗與環境損壞</span></a></li>
</ul>
