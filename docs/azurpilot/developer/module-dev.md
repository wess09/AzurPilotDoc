---
title: 新增一个任务
description: 从配置定义到 alas.py 分发、业务实现、测试与文档的完整新增任务流程，含可直接照抄的代码。
updated: 2026-10-20
---

# 新增一个任务

新增任务的本质是**三处同名**：`task.yaml` 定义、`alas.py` 方法、业务模块类。下面用一个虚构但结构真实的 `MyFeature` 走完整条链路。

## <DocIcon name="lightbulb" /> 0. 先想清楚

| 问题 | 为什么重要 |
| --- | --- |
| 它需要哪些参数？ | 决定 `argument.yaml` 的组与字段 |
| 它什么时候跑？ | 决定 `Scheduler` 的默认间隔与优先级 |
| 失败后能自动恢复吗？ | 决定异常类型，而不是把异常吞掉 |
| 它产出统计吗？ | 决定是否写 `Storage` |

## <DocIcon name="pencil" /> 1. 注册任务与菜单

`module/config/argument/task.yaml`，加在合适的菜单组下：

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

- 列表顺序就是 WebUI 里的参数组顺序。
- `Scheduler` 组提供启用、下次运行、间隔等通用字段。
- `Storage` 组决定统计写入哪张表。

## <DocIcon name="settings" /> 2. 定义参数

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

| 字段 | 说明 |
| --- | --- |
| `value` | 默认值 |
| `option` | 下拉选项 |
| `validate` | `[min, max]` |
| `type` | 控件类型；不写会根据值推断 |

如果某个任务下参数要不同的默认值，写 `default.yaml`：

```yaml
MyFeature:
  MyFeature:
    TargetCount: 5
```

如果某任务下参数必须固定、用户不能改，写 `override.yaml`：

```yaml
MyFeature:
  MyFeature:
    Mode:
      value: normal
      option: [normal]
```

## <DocIcon name="message-text" /> 3. 补翻译

运行生成器后，`module/config/i18n/zh-CN.json` 会出现新键。补齐五份：

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

选项值（`normal` / `deep`）也要翻译。繁体用词需要人工校对，不要假设生成器完成。

## <DocIcon name="box" /> 4. 实现业务模块

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

### 必须遵守的写法

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

| 规则 | 原因 |
| --- | --- |
| 用 `appear()` 判退出，不设 `interval` | 退出检测要每帧都看 |
| 操作用 `appear_then_click(interval=2~5)` | 防止连击 |
| 不在循环里 `sleep()` | 睡眠会错过状态变化 |
| 不用负面条件控制循环 | 「没看到 X 就继续」会在未知页面死循环 |
| 不嵌套状态循环 | 把分支合并到父循环 |
| `handle_*()` 返回 `bool` | `True` 表示已操作、需要新截图 |

### 异常怎么抛

| 情况 | 抛什么 |
| --- | --- |
| 画面长期无变化 | `GameStuckError` |
| 同一按钮反复点 | `GameTooManyClickError` |
| 无法安全判断 | `RequestHumanTakeover` |
| 需要重启游戏 | 直接调用 `self.config.task_call('Restart')` 后返回 |

不要用 `try/except: pass` 包住识别失败——上层恢复机制依赖异常类型。

### 结束与排期

```python
self.config.task_delay(success=True)     # 按 SuccessInterval
self.config.task_delay(success=False)    # 按 FailureInterval
self.config.task_delay(minute=30)        # 指定分钟
```

不调用 `task_delay` 的任务会保持「已到期」，下一轮立刻再次被选中。

## <DocIcon name="plug" /> 5. 在 alas.py 注册分发

```python
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

- 方法名 = 任务命令的驼峰转下划线。
- 必须惰性导入。
- 必须委托给业务模块，不要在 `alas.py` 里写业务逻辑。

## <DocIcon name="refresh" /> 6. 生成配置产物

```bash
uv run -m module.config.config_updater
```

会更新 `args.json`、`menu.json`、`config_generated.py`、`template.json`、`i18n/*.json`。把这些和 YAML 一起提交。

## <DocIcon name="crown" /> 7. 默认优先级（可选）

如果任务需要在多个到期任务中优先执行，在 `module/config/config_manual.py` 的 `_DEFAULT_SCHEDULER_PRIORITY` 插入命令。用户仍可通过「自定义任务优先级」覆盖。

## <DocIcon name="folder" /> 8. 资源与按钮

新按钮需要模板图：

1. 按 1280×720 截图并裁剪出按钮区域。
2. 放到 `assets/<服务器>/`。
3. 在三服/四服都补齐（`cn` / `en` / `jp` / `tw`）。
4. 运行 `uv run -m dev_tools.button_extract` 生成 `assets.py`。
5. 用真实截图做离线识别验证。

## <DocIcon name="flask" /> 9. 测试

```bash
# 导入冒烟：确认模块能被加载
uv run python -m dev_tools.import_smoke_test

# 配置生成是否稳定
uv run python -m unittest tests.test_config_batch

# 你的模块单测
uv run python -m unittest tests.test_my_feature
```

单测建议覆盖：

| 用例 | 断言 |
| --- | --- |
| 参数默认值 | 未配置时取预期值 |
| 结束条件 | 达到目标后调用 `task_delay` |
| 异常传播 | 识别失败抛对应异常，不被吞掉 |
| 配置不污染 | 使用临时配置目录 |

::: warning 不要用真实账号跑测试
真实游戏任务会消耗资源、改变账号状态。测试使用截图夹具、模拟设备与临时配置。需要真机验证时，明确指定实例与任务范围。
:::

## <DocIcon name="file" /> 10. 文档

- 在 `docs/modules/` 下补模块文档（20 节结构，见 `WRITING-GUIDE.md`）。
- 在 `docs/modules/README.md` 索引里加一行。
- 如果是对用户可见的新玩法，在本站的任务手册对应页面补充用途、前置条件、关键配置与验证方式。

## <DocIcon name="circle-check" /> 检查清单

- [ ] `task.yaml` 注册，参数组顺序合理
- [ ] `argument.yaml` 字段有类型、默认值与校验
- [ ] 五语言 i18n 补齐（含选项值）
- [ ] `alas.py` 方法名与命令一致，惰性导入
- [ ] 业务模块实现 `run()`，使用状态循环
- [ ] 异常类型正确，没有吞异常
- [ ] 结束调用 `task_delay`
- [ ] 运行过 `config_updater`，生成产物一并提交
- [ ] 按钮资源四服齐全，`button_extract` 已运行
- [ ] 单测与导入冒烟通过
- [ ] 模块文档与索引已更新

## <DocIcon name="circle-alert" /> 常见坑

| 现象 | 原因 |
| --- | --- |
| WebUI 没有新任务 | 没运行生成器，或 `task.yaml` 缩进错误 |
| 任务执行报 `AttributeError` | `alas.py` 方法名与命令不一致 |
| 配置读不到 | 没在 `task.yaml` 挂对应组，或拼错字段名 |
| 任务无限重复 | 忘记 `task_delay` |
| 点击连发 | `appear_then_click` 没设 `interval` |
| CI 报生成产物差异 | 改了 YAML 没重新生成 |
