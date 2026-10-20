---
title: 配置系统
description: 从 YAML 定义到 args.json、config_generated.py 与运行时属性绑定的完整链路，以及新增配置字段的正确做法。
updated: 2026-10-20
---

# 配置系统

配置系统要同时服务四个角色：游戏代码读属性、调度器读任务队列、WebUI 渲染表单、开发者声明式扩展。它的答案是「**YAML 定义 → 生成器 → 运行时绑定**」三段式。

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

## <DocIcon name="file" /> 定义层：六个 YAML

| 文件 | 职责 | 谁可以改 |
| --- | --- | --- |
| `task.yaml` | 任务、选项组映射、菜单结构 | 开发者 |
| `argument.yaml` | 参数类型、默认值、选项、校验 | 开发者 |
| `default.yaml` | 任务特定的可修改默认值 | 开发者 |
| `override.yaml` | 强制覆盖值、`display`、`type` | 开发者 |
| `gui.yaml` | WebUI 文案翻译键 | 开发者 |
| `dashboard.yaml` | 仪表盘资源定义 | 开发者 |

`default.yaml` 与 `override.yaml` 的区别很重要：

- `default.yaml` 只是**默认值**，用户可以在 WebUI 改。
- `override.yaml` 是**强制覆盖**，用户改不了，通常用于「某任务下这个参数必须固定」或隐藏字段。

## <DocIcon name="eye" /> 参数定义长什么样

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
| `value` | 默认值 |
| `type` | 控件类型：`checkbox`、`input`、`textarea`、`datetime`、`stored` 等 |
| `option` | 下拉选项 |
| `validate` | 数值范围 `[min, max]` |
| `display` | `hide` 隐藏，`stored` 表示内部状态 |
| `valuetype` | 值类型转换（如 `str`） |

## <DocIcon name="refresh" /> 生成层

```bash
uv run -m module.config.config_updater
```

生成的产物：

| 产物 | 消费方 |
| --- | --- |
| `module/config/argument/args.json` | WebUI 的选项树 + 后端校验 |
| `module/config/argument/menu.json` | WebUI 侧边栏 |
| `module/config/config_generated.py` | 运行时属性默认值 |
| `config/template.json` | 新建实例模板 |
| `module/config/i18n/*.json` | 五语言翻译 |
| `config/deploy.template*.yaml` | 部署模板 |

::: danger 生成文件不要手改
CI 会重新生成并 diff。手改会在 CI 直接失败，而且下次生成就被覆盖。唯一例外是 `i18n/*.json`：生成器保留已有翻译，但新增的键只会写成键路径（如 `Campaign.Event.name`），需要人工补齐 `zh-CN`、`zh-TW`、`en-US`、`ja-JP`、`zh-MIAO` 五份文案。
:::

## <DocIcon name="settings" /> 运行时：AzurLaneConfig

### 路径与属性

配置路径是 `<Task>.<Group>.<Argument>`，绑定任务后通过下划线属性访问：

```python
# 配置里的 Campaign.Name
name = self.config.Campaign_Name

# 写入即修改内存并标记待保存
self.config.Campaign_Name = '12-4'
```

`bind(task)` 只把当前任务的参数挂到实例上。这也是为什么业务模块**不能**在任务 A 里读任务 B 的私有参数——跨任务读取要用 `cross_get`。

### 保存与事务

配置写入不是立即落盘，而是进入 `modified` 队列，由事务层合并后原子写入。多进程场景（调度器 worker + WebUI 后端）共用一把文件锁：

```text
worker 修改 → modified 队列 → 事务锁 → 原子写 config/<实例>.json
WebUI 修改 → config.patch（带 revision）→ 冲突检测 → 同一把锁
```

WebUI 的 `revision` 是乐观并发控制：两个页面同时改同一实例，后提交者会收到冲突，需要刷新后重试。

### 加载与迁移

加载时的顺序：

1. 读 `config/<实例>.json`。
2. 与 `config_generated.py` 的默认值合并（缺字段补默认）。
3. 按 `redirect_utils/` 的规则做版本迁移（改名、类型转换、选项映射）。
4. 类型规整（字符串数字转 int、时间格式统一）。
5. 生成属性。

`AzurLaneConfig` 初始化**可能触发一次保存**（写入迁移结果）。测试时务必使用临时配置目录，否则会污染真实配置。

## <DocIcon name="zap" /> 热重载

调度器不监听文件系统事件，而是在两个检查点比较 mtime：

- `wait_until()` 的 5 秒轮询里；
- 每轮任务结束、丢弃 `config` 缓存后。

命中变更就整体重建 `AzurLaneConfig`，不做字段级合并。任务执行中途不会切换配置；需要中途感知的模块用 `check_task_switch()`。

## <DocIcon name="circle-plus" /> 新增一个配置字段

<Steps>
<Step title="改 argument.yaml">

在对应选项组下加字段，写清 `value`、`type`、`option` / `validate`。字段名用大驼峰，会直接成为属性名的一部分。

</Step>
<Step title="决定是否覆盖">

如果该字段在某任务下必须固定，写进 `override.yaml`；只是默认值不同，写 `default.yaml`。

</Step>
<Step title="挂到任务">

在 `task.yaml` 对应任务的选项组列表里加入该组（如果新建了组）。顺序决定 WebUI 里的显示顺序。

</Step>
<Step title="补翻译">

运行生成器后，编辑 `i18n/*.json` 补五份文案。选项值（`option` 的每个值）也需要翻译。

</Step>
<Step title="运行生成器">

```bash
uv run -m module.config.config_updater
```

检查 `args.json` 与 `template.json` 的 diff 是否只包含预期变更。

</Step>
<Step title="验证">

```bash
uv run python -m unittest tests.test_config_transaction tests.test_config_batch
uv run python -m dev_tools.import_smoke_test
```

启动 WebUI，确认字段出现在正确的页面，修改后能保存并重新加载。

</Step>
</Steps>

## <DocIcon name="circle-alert" /> 常见错误

| 现象 | 原因 |
| --- | --- |
| WebUI 字段不显示 | 没挂到 `task.yaml`，或 `display: hide` |
| 改了值又变回去 | 字段被 `override.yaml` 强制覆盖 |
| 属性访问报 `AttributeError` | 字段名拼错，或该任务没有绑定这个组 |
| 配置迁移后值丢失 | `redirect_utils` 缺少对应规则 |
| 中文显示成键路径 | 生成后没补 `i18n` 翻译 |
| CI 报生成产物 diff | 改了 YAML 没运行生成器，或手改了生成文件 |

## <DocIcon name="map" /> 相关代码

| 文件 | 作用 |
| --- | --- |
| `module/config/config.py` | `AzurLaneConfig`：加载、绑定、保存、调度原语 |
| `module/config/config_updater.py` | 生成器与迁移 |
| `module/config/transaction.py` | 跨进程写事务 |
| `module/config/task_priority.py` | 优先级文本解析 |
| `module/config/server.py` | 服务器与包名映射 |
| `module/api/config_service.py` | WebUI 侧的白名单校验 |
