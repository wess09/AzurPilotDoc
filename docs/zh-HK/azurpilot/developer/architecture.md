---
title: 系統架構
description: AzurPilot 的分層結構、進程模型、模組邊界與數據流，以及修改代碼前必須知道的約束。
updated: 2026-10-31
---

# 系統架構

<CoreArchDiagram />

<Figure caption="上層依賴下層。業務模組之間不互相調用，跨任務協作通過配置與調度原語完成。" />

## <DocIcon name="box" /> 進程模型

```text
gui.py（父进程）
├── HTTP / WebSocket 服务（uvicorn）
├── 静态前端（frontend/dist）
├── 实例 worker × N（multiprocessing.Process）
│    └── AzurLaneAutoScript.loop()
└── TaskHandler（WebUI 自用的后台任务：更新检查、远程保活）
```

| 進程 | 生命週期 | 職責 |
| --- | --- | --- |
| `gui.py` | 常駐 | 提供介面與 API，建立、監督、回收 worker |
| worker | 隨實例啟停 | 調度循環與全部遊戲操作 |
| `mcp_server_sse.py` | 可選獨立進程 | MCP 工具，複用 WebUI 密碼 |

幾個容易誤解的點：

- **worker 不是守護進程**。它由 `ProcessManager` 建立，父進程退出會一起收尾。
- **`TaskHandler` 不是遊戲調度器**。它只服務 WebUI 的定時任務，不接觸設備。
- **每個實例獨佔一個 worker**。兩個 worker 操作同一台模擬器，行為未定義。

## <DocIcon name="settings" /> 分層與邊界

### 入口層

| 檔案 | 入口 | 説明 |
| --- | --- | --- |
| `alas.py` | `AzurLaneAutoScript.loop()`、`run(command)` | 唯一調度者 |
| `gui.py` | `main()` | 參數解析、前端構建檢查、啟動 uvicorn、監督 worker |
| `mcp_server_sse.py` | `main()` | SSE 傳輸的 MCP 服務 |
| `tui.py` | `main()` | 終端介面，複用同一套配置 |

### 運行時層

| 路徑 | 職責 |
| --- | --- |
| `module/api/router.py` | 顯式方法註冊表，參數校驗與分發 |
| `module/api/socket.py` | WebSocket 會話、鑑權、訂閲 |
| `module/runtime/process_manager.py` | worker 生命週期、停止信號 |
| `module/runtime/updater.py` | 更新檢查、拉取、應用 |
| `module/runtime/remote_*.py` | Cloudflare Tunnel 與配對 |
| `module/runtime/account_*.py` | 帳號保險庫 |

### 業務層

每個玩法一個包，入口類實現 `run()`。業務層通過 `ModuleBase` 獲得：

- `self.device`：截圖、點擊、應用控制
- `self.config`：綁定到當前任務的配置
- `self.appear()` / `appear_then_click()`：識別與操作原語
- `self.ui_ensure()` / `ui_goto()`：頁面導航

### 基礎層

| 模組 | 關鍵抽象 | 邊界 |
| --- | --- | --- |
| `module/base` | `ModuleBase`、`Button`、`Template`、`Timer`、`Filter` | 不包含具體玩法 |
| `module/device` | `Device`、`Connection`、`Screenshot`、`Control` | 不做恢復決策 |
| `module/ui` | `UI`、`Page`、頁面圖 | 不做業務判斷 |
| `module/ocr` | 模型、推理封裝、基準 | 不關心調用方 |
| `module/map` | `Map`、網格感知、尋路 | 不含戰鬥策略 |
| `module/combat` | 戰鬥循環、結算、陣容 | 不含關卡選擇 |

## <DocIcon name="zap" /> 一次任務的數據流

```text
WebUI 配置修改
  → config/<实例>.json
    → 调度器在任务边界丢弃 config 缓存
      → get_next() 选出任务
        → bind(task)：self.config.<Group>_<Argument>
          → run(command)
            → 业务模块截图 / 识别 / 点击
              → task_delay() 写回 NextRun
                → 返回 True / 'recoverable' / False
```

**調度狀態完全落在設定檔的 `Scheduler.NextRun` 裏**。記憶體中的失敗計數只輔助恢復決策，進程重新啟動後調度隊列原樣保留。

## <DocIcon name="pencil" /> 任務註冊機制

調度器只認識字符串：

1. `task.yaml` 定義任務、菜單與參數組。
2. `alas.py` 提供同名方法（命令駝峯轉下劃線）。
3. 方法內惰性匯入實現類並調用 `run()`。

```python
# alas.py
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

新增任務不需要註冊表，`run()` 通過 `getattr(self, command)()` 分發。這也意味着**方法名寫錯不會在啟動時報錯**，只會在任務執行時拋 `AttributeError`。

## <DocIcon name="drive" /> 持久化

| 數據 | 位置 | 説明 |
| --- | --- | --- |
| 實例配置 | `config/<实例>.json` | 用戶可見、可匯出 |
| 部署配置 | `config/deploy.yaml` | 後端級 |
| 業務數據 | SQLite 總庫 | 統計、掉落、調度程序、安全歷史 |
| 掉落記錄 | `log/drop/` 等 | 按類別與保留策略 |
| 錯誤現場 | `log/error/<实例>/<时间戳>/` | 截圖 + 截斷日誌 |

業務資料庫由 `module/persistence` 統一管理：首次遷移先備份、轉換、檢查，失敗停止啟動並保留舊源。**模組匯入不建立資料庫**，只有運行入口初始化。

## <DocIcon name="handshake" /> 橫切約定

### 異常

`module/exception.py` 定義全部業務異常。調度器按類型決定恢復力度，業務模組不要吞異常：

| 異常 | 語義 |
| --- | --- |
| `GameStuckError` | 畫面長期無推進 |
| `GameTooManyClickError` | 同一按鈕反覆點擊 |
| `GameNotRunningError` | 遊戲進程不存在 |
| `EmulatorNotRunningError` | 設備離線 |
| `RequestHumanTakeover` | 無法安全自動判斷 |
| `ScriptError` | 代碼缺陷 |
| `TaskEnd` | 任務主動正常結束 |

### 日誌

- `logger.hr()` 標記階段，`logger.attr()` 記錄狀態。
- 日誌寫入 `log/<日期>_<实例>.txt`。
- 不要在日誌裏輸出帳號、密鑰、截圖路徑中的用戶名。

### 資源

- 四服資源在 `assets/{cn,en,jp,tw}/`，按 1280×720 座標製作。
- 模板對象以 `TEMPLATE_` 前綴命名。
- 改按鈕後運行 `uv run -m dev_tools.button_extract`，提交生成的 `assets.py`。

### 配置

- 先改 `module/config/argument/*.yaml`，再運行生成器。
- 配置路徑是 `<Task>.<Group>.<Argument>`，業務裏通過 `self.config.Group_Argument` 訪問。
- 新增字段必須補 `i18n/*.json` 的翻譯，生成器不會自動翻譯。

### 網絡傳輸（HTTP/3 優先）

`module/base/http.py` 與 `deploy/http.py` 提供統一的 HTTP/3-first 傳輸層，基於 `niquests` 庫及全局 `QuicSharedCache(max_size=12288)`：

- **服務域路由**：對 `SERVICE_DOMAINS`（`azurpilot.com`、`nanoda.work`）自動預熱並建立 QUIC 連接，顯著降低版本檢查、掉落與模板提交、交易所與雲端隧道的握手時延。
- **漸進降級**：本地環境不支援 UDP 443 或網絡受限時，自動無感知回退至 HTTP/2 與 HTTP/1.1。
- **更新傳輸分離**：運行時更新（`RuntimeGitOverCdnClient`）複用該 HTTP/3 傳輸層從 CDN 下載 Git 打包對象，而啟動引導階段保留無外部依賴的輕量 Requests 回退。

### 控制節流與輸入節奏

`module/device/control.py` 引入 `control_interval()` 作用域控制：

- 在智能換船等操作中通過 `ContextVar` 注入 0.1–0.3 秒隨機間隔，覆蓋點擊、拖動與滑動，抑制低性能或高延遲客戶端上的操作積壓。
- 不影響卡死和連點檢測，調用結束後在 `finally` 中嚴格恢復原節奏；頁面就緒依然通過截圖狀態機判斷，不以等待時間充當就緒標記。

## <DocIcon name="circle-alert" /> 已知的技術債

| 位置 | 問題 |
| --- | --- |
| `run()` / `loop()` | 數百行長方法，異常矩陣靠內聯分支，新增異常容易漏對稱處理 |
| 返回值 | `True / False / 'recoverable'` 是弱類型協議，重構需全局搜尋 |
| `failure_record` | 只存記憶體，進程重新啟動清零，敏感任務的連續失敗保護會被重新啟動重置 |
| `EmulatorManager` 任務 | 內聯 SSH 邏輯，是唯一不遵循「委託業務模組」形態的任務方法 |
| `GameManager` | 未完成，不要依賴 |

## <DocIcon name="map" /> 相關文檔

<ul class="ap-linklist">
<li><a href="/zh-HK/azurpilot/developer/scheduler">調度器生命週期<span class="desc">loop / run / 恢復矩陣</span></a></li>
<li><a href="/zh-HK/azurpilot/developer/config">配置系統<span class="desc">YAML 到運行時的鏈路</span></a></li>
<li><a href="/zh-HK/azurpilot/developer/webui-backend">WebUI 後端<span class="desc">API 與進程管理</span></a></li>
<li><a href="/zh-HK/azurpilot/developer/module-dev">新增一個任務<span class="desc">完整示例</span></a></li>
</ul>
