---
title: 配置系統
description: 從 YAML 定義到 args.json、config_generated.py 與運行時屬性綁定的完整鏈路，以及新增配置字段的正確做法。
updated: 2026-10-20
---

# 配置系統

配置系統要同時服務四個角色：遊戲代碼讀屬性、調度器讀任務隊列、WebUI 渲染表單、開發者聲明式擴展。它的答案是「**YAML 定義 → 生成器 → 運行時綁定**」三段式。

```text
task.yaml  argument.yaml  default.yaml  override.yaml  gui.yaml  dashboard.yaml
      │            │             │            │           │          │
      └────────────┴─────────────┴────────────┴───────────┴──────────┘
                                   │
                    uv run -m module.config.config_updater
                                   │
     ┌──────────────┬──────────────┼──────────────┬──────────────┐
     ▼              ▼              ▼              ▼              ▼
  args.json     menu.json   config_generated.py  template.json  i18n/*.json
     │              │              │
     ▼              ▼              ▼
  WebUI 表单    侧边栏菜单    Python 默认值类
                                   │
                                   ▼
                          AzurLaneConfig（运行时）
```

## <DocIcon name="file" /> 定義層：六個 YAML

| 檔案 | 職責 | 誰可以改 |
| --- | --- | --- |
| `task.yaml` | 任務、選項組映射、菜單結構 | 開發者 |
| `argument.yaml` | 參數類型、預設值、選項、校驗 | 開發者 |
| `default.yaml` | 任務特定的可修改預設值 | 開發者 |
| `override.yaml` | 強制覆蓋值、`display`、`type` | 開發者 |
| `gui.yaml` | WebUI 文案翻譯鍵 | 開發者 |
| `dashboard.yaml` | 儀表盤資源定義 | 開發者 |

`default.yaml` 與 `override.yaml` 的區別很重要：

- `default.yaml` 只是**預設值**，用戶可以在 WebUI 改。
- `override.yaml` 是**強制覆蓋**，用戶改不了，通常用於「某任務下這個參數必須固定」或隱藏字段。

## <DocIcon name="eye" /> 參數定義長什麼樣

```yaml
Campaign:
  Name: 12-4
  Mode:
    value: normal
    option: [normal, hard]
  UseAutoSearch: true
```

| 字段 | 作用 |
| --- | --- |
| `value` | 預設值 |
| `type` | 控件類型：`checkbox`、`input`、`textarea`、`datetime`、`stored` 等 |
| `option` | 下拉選項 |
| `validate` | 數值範圍 `[min, max]` |
| `display` | `hide` 隱藏，`stored` 表示內部狀態 |
| `valuetype` | 值類型轉換（如 `str`） |

## <DocIcon name="refresh" /> 生成層

```bash
uv run -m module.config.config_updater
```

生成的產物：

| 產物 | 消費方 |
| --- | --- |
| `module/config/argument/args.json` | WebUI 的選項樹 + 後端校驗 |
| `module/config/argument/menu.json` | WebUI 側邊欄 |
| `module/config/config_generated.py` | 運行時屬性預設值 |
| `config/template.json` | 新建實例模板 |
| `module/config/i18n/*.json` | 五語言翻譯 |
| `config/deploy.template*.yaml` | 部署模板 |

::: danger 生成檔案不要手改
CI 會重新生成並 diff。手改會在 CI 直接失敗，而且下次生成就被覆蓋。唯一例外是 `i18n/*.json`：生成器保留已有翻譯，但新增的鍵只會寫成鍵路徑（如 `Campaign.Event.name`），需要人工補齊 `zh-CN`、`zh-TW`、`en-US`、`ja-JP`、`zh-MIAO` 五份文案。
:::

## <DocIcon name="settings" /> 運行時：AzurLaneConfig

### 路徑與屬性

配置路徑是 `<Task>.<Group>.<Argument>`，綁定任務後通過下劃線屬性訪問：

```python
# 配置里的 Campaign.Name
name = self.config.Campaign_Name

# 写入即修改内存并标记待保存
self.config.Campaign_Name = '12-4'
```

`bind(task)` 只把當前任務的參數掛到實例上。這也是為什麼業務模組**不能**在任務 A 裏讀任務 B 的私有參數——跨任務讀取要用 `cross_get`。

### 儲存與事務

配置寫入不是立即落盤，而是進入 `modified` 隊列，由事務層合併後原子寫入。多進程場景（調度器 worker + WebUI 後端）共用一把檔案鎖：

```text
worker 修改 → modified 队列 → 事务锁 → 原子写 config/<实例>.json
WebUI 修改 → config.patch（带 revision）→ 冲突检测 → 同一把锁
```

WebUI 的 `revision` 是樂觀併發控制：兩個頁面同時改同一實例，後提交者會收到衝突，需要刷新後重試。

### 加載與遷移

加載時的順序：

1. 讀 `config/<实例>.json`。
2. 與 `config_generated.py` 的預設值合併（缺字段補預設）。
3. 按 `redirect_utils/` 的規則做版本遷移（改名、類型轉換、選項映射）。
4. 類型規整（字符串數字轉 int、時間格式統一）。
5. 生成屬性。

`AzurLaneConfig` 初始化**可能觸發一次儲存**（寫入遷移結果）。測試時務必使用臨時配置目錄，否則會污染真實配置。

## <DocIcon name="zap" /> 熱重載

調度器不監聽檔案系統事件，而是在兩個檢查點比較 mtime：

- `wait_until()` 的 5 秒輪詢裏；
- 每輪任務結束、丟棄 `config` 快取後。

命中變更就整體重建 `AzurLaneConfig`，不做字段級合併。任務執行中途不會切換配置；需要中途感知的模組用 `check_task_switch()`。

## <DocIcon name="circle-plus" /> 新增一個配置字段

<Steps>
<Step title="改 argument.yaml">

在對應選項組下加字段，寫清 `value`、`type`、`option` / `validate`。字段名用大駝峯，會直接成為屬性名的一部分。

</Step>
<Step title="決定是否覆蓋">

如果該字段在某任務下必須固定，寫進 `override.yaml`；只是預設值不同，寫 `default.yaml`。

</Step>
<Step title="掛到任務">

在 `task.yaml` 對應任務的選項組列表里加入該組（如果新建了組）。順序決定 WebUI 裏的顯示順序。

</Step>
<Step title="補翻譯">

運行生成器後，編輯 `i18n/*.json` 補五份文案。選項值（`option` 的每個值）也需要翻譯。

</Step>
<Step title="運行生成器">

```bash
uv run -m module.config.config_updater
```

檢查 `args.json` 與 `template.json` 的 diff 是否只包含預期變更。

</Step>
<Step title="驗證">

```bash
uv run python -m unittest tests.test_config_transaction tests.test_config_batch
uv run python -m dev_tools.import_smoke_test
```

啟動 WebUI，確認字段出現在正確的頁面，修改後能儲存並重新加載。

</Step>
</Steps>

## <DocIcon name="circle-alert" /> 常見錯誤

| 現象 | 原因 |
| --- | --- |
| WebUI 字段不顯示 | 沒掛到 `task.yaml`，或 `display: hide` |
| 改了值又變回去 | 字段被 `override.yaml` 強制覆蓋 |
| 屬性訪問報 `AttributeError` | 字段名拼錯，或該任務沒有綁定這個組 |
| 配置遷移後值丟失 | `redirect_utils` 缺少對應規則 |
| 中文顯示成鍵路徑 | 生成後沒補 `i18n` 翻譯 |
| CI 報生成產物 diff | 改了 YAML 沒運行生成器，或手改了生成檔案 |

## <DocIcon name="map" /> 相關代碼

| 檔案 | 作用 |
| --- | --- |
| `module/config/config.py` | `AzurLaneConfig`：加載、綁定、儲存、調度原語 |
| `module/config/config_updater.py` | 生成器與遷移 |
| `module/config/transaction.py` | 跨進程寫事務 |
| `module/config/task_priority.py` | 優先級文本解析 |
| `module/config/server.py` | 伺服器與包名映射 |
| `module/api/config_service.py` | WebUI 側的白名單校驗 |
