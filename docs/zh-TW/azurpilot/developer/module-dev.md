---
title: 新增一個任務
description: 從配置定義到 alas.py 分發、業務實現、測試與說明文件的完整新增任務流程，含可直接照抄的程式碼。
updated: 2026-10-20
---

# 新增一個任務

新增任務的本質是**三處同名**：`task.yaml` 定義、`alas.py` 方法、業務模組類。下面用一個虛構但結構真實的 `MyFeature` 走完整條鏈路。

## <DocIcon name="lightbulb" /> 0. 先想清楚

| 問題 | 為什麼重要 |
| --- | --- |
| 它需要哪些參數？ | 決定 `argument.yaml` 的組與字段 |
| 它什麼時候跑？ | 決定 `Scheduler` 的預設間隔與優先級 |
| 失敗後能自動恢復嗎？ | 決定異常類型，而不是把異常吞掉 |
| 它產出統計嗎？ | 決定是否寫 `Storage` |

## <DocIcon name="pencil" /> 1. 註冊任務與菜單

`module/config/argument/task.yaml`，加在合適的菜單組下：

```yaml
Reward:
  menu: collapse
  page: setting
  tasks:
    MyFeature:
      - Scheduler
      - MyFeature
      - Storage
```

- 列表順序就是 WebUI 裡的參陣列順序。
- `Scheduler` 組提供啟用、下次執行、間隔等通用字段。
- `Storage` 組決定統計寫入哪張表。

## <DocIcon name="settings" /> 2. 定義參數

`module/config/argument/argument.yaml`：

```yaml
MyFeature:
  Mode:
    value: normal
    option: [normal, deep]
  TargetCount:
    value: 3
    validate: [1, 20]
  EnableExtra:
    type: checkbox
    value: false
    option: [true, false]
```

| 字段 | 說明 |
| --- | --- |
| `value` | 預設值 |
| `option` | 下拉選項 |
| `validate` | `[min, max]` |
| `type` | 控件類型；不寫會根據值推斷 |

如果某個任務下參數要不同的預設值，寫 `default.yaml`：

```yaml
MyFeature:
  MyFeature:
    TargetCount: 5
```

如果某任務下參數必須固定、用戶不能改，寫 `override.yaml`：

```yaml
MyFeature:
  MyFeature:
    Mode:
      value: normal
      option: [normal]
```

## <DocIcon name="message-text" /> 3. 補翻譯

執行生成器後，`module/config/i18n/zh-CN.json` 會出現新鍵。補齊五份：

```json
{
  "Task": {
    "MyFeature": {
      "name": "我的功能",
      "help": "一句话说明它做什么，以及前置条件。"
    }
  },
  "MyFeature": {
    "_info": { "name": "我的功能", "help": "" },
    "Mode": {
      "name": "运行模式",
      "help": "normal 为常规模式，deep 会多花时间换取更彻底的处理。",
      "normal": "常规",
      "deep": "深度"
    },
    "TargetCount": { "name": "目标次数", "help": "单次运行最多处理的次数。" },
    "EnableExtra": { "name": "启用额外处理", "help": "" }
  }
}
```

選項值（`normal` / `deep`）也要翻譯。繁體用詞需要人工校對，不要假設生成器完成。

## <DocIcon name="box" /> 4. 實現業務模組

`module/my_feature/my_feature.py`：

```python
from module.base.base import ModuleBase
from module.exception import RequestHumanTakeover
from module.logger import logger


class MyFeature(ModuleBase):
    """执行我的功能。

    Pages:
        in: page_main
        out: page_main
    """

    def run(self):
        logger.hr('My Feature', level=1)
        self.ui_ensure(page_main)

        count = 0
        while count < self.config.MyFeature_TargetCount:
            if self.config.MyFeature_Mode == 'deep':
                self._deep_step()
            else:
                self._normal_step()
            count += 1

        self.config.task_delay(success=True)

    def _normal_step(self):
        """一次常规处理。

        Pages:
            in: page_main
            out: page_main
        """
        self.device.screenshot()
        if self.appear_then_click(MY_FEATURE_ENTRY, interval=2):
            pass
        # ... 状态循环

    def _deep_step(self):
        ...
```

### 必須遵守的寫法

```python
def some_step(self, skip_first_screenshot=True):
    while True:
        if skip_first_screenshot:
            skip_first_screenshot = False
        else:
            self.device.screenshot()

        if self.appear(MY_END_CONDITION):
            break
        if self.appear_then_click(MY_BUTTON, interval=2):
            continue
        if self.handle_popup():
            continue
```

| 規則 | 原因 |
| --- | --- |
| 用 `appear()` 判退出，不設 `interval` | 退出檢測要每幀都看 |
| 操作用 `appear_then_click(interval=2~5)` | 防止連擊 |
| 不在循環裡 `sleep()` | 睡眠會錯過狀態變化 |
| 不用負面條件控制循環 | 「沒看到 X 就繼續」會在未知頁面死循環 |
| 不嵌套狀態循環 | 把分支合併到父循環 |
| `handle_*()` 返回 `bool` | `True` 表示已操作、需要新截圖 |

### 異常怎麼拋

| 情況 | 拋什麼 |
| --- | --- |
| 畫面長期無變化 | `GameStuckError` |
| 同一按鈕反覆點 | `GameTooManyClickError` |
| 無法安全判斷 | `RequestHumanTakeover` |
| 需要重新啟動遊戲 | 直接調用 `self.config.task_call('Restart')` 後返回 |

不要用 `try/except: pass` 包住識別失敗——上層恢復機制依賴異常類型。

### 結束與排期

```python
self.config.task_delay(success=True)     # 按 SuccessInterval
self.config.task_delay(success=False)    # 按 FailureInterval
self.config.task_delay(minute=30)        # 指定分钟
```

不調用 `task_delay` 的任務會保持「已到期」，下一輪立刻再次被選中。

## <DocIcon name="plug" /> 5. 在 alas.py 註冊分發

```python
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

- 方法名 = 任務命令的駝峰轉下劃線。
- 必須惰性匯入。
- 必須委託給業務模組，不要在 `alas.py` 裡寫業務邏輯。

## <DocIcon name="refresh" /> 6. 生成配置產物

```bash
uv run -m module.config.config_updater
```

會更新 `args.json`、`menu.json`、`config_generated.py`、`template.json`、`i18n/*.json`。把這些和 YAML 一起提交。

## <DocIcon name="crown" /> 7. 預設優先級（可選）

如果任務需要在多個到期任務中優先執行，在 `module/config/config_manual.py` 的 `_DEFAULT_SCHEDULER_PRIORITY` 插入命令。用戶仍可通過「自定義任務優先級」覆蓋。

## <DocIcon name="folder" /> 8. 資源與按鈕

新按鈕需要模板圖：

1. 按 1280×720 截圖並裁剪出按鈕區域。
2. 放到 `assets/<服务器>/`。
3. 在三服/四服都補齊（`cn` / `en` / `jp` / `tw`）。
4. 執行 `uv run -m dev_tools.button_extract` 生成 `assets.py`。
5. 用真實截圖做離線識別驗證。

## <DocIcon name="flask" /> 9. 測試

```bash
# 导入冒烟：确认模块能被加载
uv run python -m dev_tools.import_smoke_test

# 配置生成是否稳定
uv run python -m unittest tests.test_config_batch

# 你的模块单测
uv run python -m unittest tests.test_my_feature
```

單測建議覆蓋：

| 用例 | 斷言 |
| --- | --- |
| 參數預設值 | 未配置時取預期值 |
| 結束條件 | 達到目標後調用 `task_delay` |
| 異常傳播 | 識別失敗拋對應異常，不被吞掉 |
| 配置不汙染 | 使用臨時配置目錄 |

::: warning 不要用真實帳號跑測試
真實遊戲任務會消耗資源、改變帳號狀態。測試使用截圖夾具、模擬設備與臨時配置。需要真機驗證時，明確指定實例與任務範圍。
:::

## <DocIcon name="file" /> 10. 說明文件

- 在 `docs/modules/` 下補模組說明文件（20 節結構，見 `WRITING-GUIDE.md`）。
- 在 `docs/modules/README.md` 索引里加一行。
- 如果是對用戶可見的新玩法，在本站的任務手冊對應頁面補充用途、前置條件、關鍵配置與驗證方式。

## <DocIcon name="circle-check" /> 檢查清單

- [ ] `task.yaml` 註冊，參陣列順序合理
- [ ] `argument.yaml` 字段有類型、預設值與校驗
- [ ] 五語言 i18n 補齊（含選項值）
- [ ] `alas.py` 方法名與命令一致，惰性匯入
- [ ] 業務模組實現 `run()`，使用狀態循環
- [ ] 異常類型正確，沒有吞異常
- [ ] 結束調用 `task_delay`
- [ ] 執行過 `config_updater`，生成產物一併提交
- [ ] 按鈕資源四服齊全，`button_extract` 已執行
- [ ] 單測與匯入冒煙通過
- [ ] 模組說明文件與索引已更新

## <DocIcon name="circle-alert" /> 常見坑

| 現象 | 原因 |
| --- | --- |
| WebUI 沒有新任務 | 沒執行生成器，或 `task.yaml` 縮進錯誤 |
| 任務執行報 `AttributeError` | `alas.py` 方法名與命令不一致 |
| 配置讀不到 | 沒在 `task.yaml` 掛對應組，或拼錯字段名 |
| 任務無限重複 | 忘記 `task_delay` |
| 點擊連發 | `appear_then_click` 沒設 `interval` |
| CI 報生成產物差異 | 改了 YAML 沒重新生成 |
