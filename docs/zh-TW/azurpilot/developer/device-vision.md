---
title: 設備、識別與戰鬥
description: 設備後端、截圖歸一化、頁面圖導航、OCR 推理、地圖檢測與戰鬥循環的程式碼入口與擴展方式。
updated: 2026-10-20
---

# 設備、識別與戰鬥

這一層負責「看到什麼、點哪裡」。它是所有玩法的共同底座，也是最容易被誤改的地方——一個座標偏移會讓所有任務一起失效。

## <DocIcon name="smartphone" /> 設備層

`module/device/` 把 ADB、截圖後端、控制後端、應用管理與模擬器啟停組合成一個 `Device`。

```text
Device
├── Connection        # adb 路径、serial、端口转发
├── Screenshot mixin  # 按配置分发到 screenshot_xxx
├── Control mixin     # click / swipe / drag
├── AppControl        # 启动、停止、前台检测、层级 dump
└── Platform          # 模拟器发现与启停（按操作系统）
```

### 後端分發

每種截圖/控制技術都是一個 mixin，`Screenshot` / `Control` 通過方法表按配置取函數：

```python
# 伪代码：运行时按配置分发
func = self.screenshot_methods[self.config.Emulator_ScreenshotMethod]
image = func(self)
```

截圖與控制互相獨立，可以自由混搭（如 `nemu_ipc` 截圖 + `MaaTouch` 控制）。

### 統一後處理

所有後端返回的圖都要經過同一套處理：

1. 解析度歸一化：非 1280×720 時縮放回資源空間。
2. 方向旋轉。
3. 可選去抖動（`Emulator.ScreenshotDedithering`）。
4. 黑屏與解析度校驗。

::: danger 不要改 1280×720
識別資源、座標、OCR 區域全部基於這個尺寸。改歸一化邏輯等於讓所有模板失準。
:::

### 穩定性檢測

| 檢測 | 實現 | 觸發 |
| --- | --- | --- |
| 卡死 | 截圖指紋 + 等待計時器雙通道 | `GameStuckError` |
| 連點 | 最近 15 次點擊統計 | `GameTooManyClickError` |
| 單按鈕連擊 | 閾值 12 次（`EXP_INFO_S` 放寬到 15） | 同上 |

恢復策略不在這層：設備層只負責把異常拋給排程器（`EmulatorNotRunningError` 等），重新啟動決策在 `alas.py`。

## <DocIcon name="map" /> 頁面導航

### 頁面圖

`module/ui/page.py` 在匯入時聲明全部頁面與邊：

```python
page_main.link(button=MAIN_GOTO_CAMPAIGN, destination=page_campaign)
```

截至審計版本約 63 個頁面。新增頁面只需要：

1. 定義 `Page(check_button=...)`。
2. 用 `link()` 聲明至少一條入邊和出邊。
3. 確認 `check_button` 在該頁面穩定出現。

### 導航 API

| API | 用途 |
| --- | --- |
| `ui_goto(page)` | 導航到目標頁，失敗拋異常 |
| `ui_ensure(page)` | 導航並確認所在頁面 |
| `ui_back()` | 返回上一頁 |
| `ui_ensure_index()` | 在頁內索引中翻到指定項 |
| `ui_get_current_page()` | 識別當前頁面 |
| `ui_additional()` | 切換途中清理彈出視窗 |

導航用 BFS 在頁面圖上找最短路。**不要寫死點擊序列**——頁面改版會讓固定序列直接失效，而圖導航只需要補一條邊。

### 未知頁面恢復

識別不到任何已知頁面時，按遞進策略恢復：

1. 點擊右上角 HOME。
2. 巡檢彈出視窗（登入、公告、活動、網路錯誤）。
3. 重新啟動遊戲走登入流程。

這就是「7×24 執行」的兜底：寧可重新啟動，也不要卡在一個無法識別的畫面上。

## <DocIcon name="eye" /> OCR

`module/ocr/` 把「識別哪裡、什麼類型、什麼顏色」收斂成聲明式介面：

```python
# 业务代码只关心结果
count = self.ocr_quantity(OCR_SHOP_ITEM, amount=1)
```

### 預處理

不直接灰度識別，而是：

1. 按 `Button` 區域裁剪。
2. 按已知字色（預設白色）提取文字，生成黑字白底二值圖。
3. 送入識別模型。

這屏蔽了描邊、漸變和背景干擾，讓同一套模型覆蓋所有 UI。

### 模型與後端

- 模型：PP-OCRv6 系列（lite / standard / pro 三檔），各語言用不同字典。
- 舊模型：`alocr_en_v2_6`、`alocr_cn_v3` 作為 `auto` 檔預設值保留。
- 後端：ONNX Runtime（RapidOCR）、NCNN；Windows 支援 DirectML / QNN / OpenVINO，macOS 支援 CoreML ANE。
- 本地推理預設跳過檢測模型（`RecOnlyOCR`），因為 UI 文字區域已知。

多實例資源控制：

```bash
# 每个 OCR 会话的 intra-op 线程上限，1..16，最终不超过逻辑 CPU 数
AZURPILOT_OCR_THREADS=2
```

只對新建立的會話生效，已有 worker 需要重新啟動才能採用。

### 模型版本

`Optimization.OcrModelVersion*` 按語言分別配置。升級模型前先跑 `OcrBenchmark`，比較準確率與耗時。

## <DocIcon name="target" /> 地圖與戰鬥

| 模組 | 職責 | 入口 |
| --- | --- | --- |
| `module/map` | 網格感知、透視、尋路 | `Map` |
| `module/map_detection` | 地圖格子識別 | `map_detection` |
| `module/combat` | 戰鬥循環、結算、陣容 | `Combat` |
| `module/campaign` | 關卡選擇、進圖、`CampaignRun` | `CampaignRun` |
| `campaign/` | 具體關卡的地圖與戰鬥定義 | Python 檔案 |

### 戰鬥循環

```text
检测战斗界面 → 等待结算 → 读取结果
  ├── 胜利 → 继续寻敌 / 退出
  ├── 失败 → DefeatWithdraw 策略（撤退 / 换队 / 停止）
  └── 异常 → GameStuckError → 上层恢复
```

戰敗處理是跨模組的：`module/defeat_handling.py` 統一處理 C/D 共用畫面、自動換隊與心情政策。改戰鬥邏輯時先讀它，不要在每個玩法裡各寫一份。

### 活動圖

`campaign/` 下是**玩家編寫的 Python 地圖定義**，不是通用 YAML：

- 每張圖定義格子、敵人、機關、boss。
- 活動適配參考相近活動，不要套用統一模板。
- 新活動需要提交地圖與戰鬥策略，腳本不會「自動理解」新機制。

## <DocIcon name="compass" /> 大世界導航

`module/os/` 是淺包深鏈：

```text
OSMap(MapEventResumeMixin, OSFleet, Map, GlobeCamera, StorageHandler, StrategicSearchHandler)
```

- `globe_goto(zone)` 跨區域移動，把球面圖與海域圖統一成可編程空間。
- `OSGrid` 替換普通網格感知，球面單應性參數固定（大世界視角不變）。
- 17 個玩法任務放在 `tasks/`，繼承 `OSMap` 獲得全部導航能力。

改大世界邏輯前，先看[大型作戰](/zh-TW/azurpilot/user/tasks/opsi)的用戶側語義，再看 `docs/modules/os/index.md`。

## <DocIcon name="pencil" /> 常見修改

### 換一個按鈕資源

1. 按 1280×720 截取局部圖。
2. 放到 `assets/<服务器>/`。
3. 在 `assets.py` 對應的 `Button` 上引用（或由 `button_extract` 生成）。
4. 執行離線識別驗證。

```bash
uv run -m dev_tools.button_extract
```

### 新增一個頁面

```python
page_my_feature = Page(check_button=OCR_MY_FEATURE_TITLE)
page_main.link(button=MAIN_GOTO_MY_FEATURE, destination=page_my_feature)
page_my_feature.link(button=BACK_ARROW, destination=page_main)
```

### 調整 OCR 區域

區域由 `Button` 的 `area` 決定。改區域等於改識別輸入，必須用真實截圖驗證，不要憑感覺調。

## <DocIcon name="flask" /> 測試

| 範圍 | 命令 |
| --- | --- |
| 匯入冒煙 | `uv run python -m dev_tools.import_smoke_test` |
| 地圖/戰鬥單測 | `uv run python -m unittest tests.test_combat_results tests.test_auto_search_defeat tests.test_opsi_map_event_resume` |
| OCR 配置與執行緒 | `uv run python -m unittest tests.test_ocr_settings tests.test_ocr_thread_limits` |
| OCR 基準 | WebUI「工具 → OCR 性能測試」 |

真實識別效果只能在設備上驗證。靜態測試通過不等於識別準確。
