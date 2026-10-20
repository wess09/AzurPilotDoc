---
title: 设备、识别与战斗
description: 设备后端、截图归一化、页面图导航、OCR 推理、地图检测与战斗循环的代码入口与扩展方式。
updated: 2026-10-20
---

# 设备、识别与战斗

这一层负责「看到什么、点哪里」。它是所有玩法的共同底座，也是最容易被误改的地方——一个坐标偏移会让所有任务一起失效。

## <DocIcon name="smartphone" /> 设备层

`module/device/` 把 ADB、截图后端、控制后端、应用管理与模拟器启停组合成一个 `Device`。

```text
Device
├── Connection        # adb 路径、serial、端口转发
├── Screenshot mixin  # 按配置分发到 screenshot_xxx
├── Control mixin     # click / swipe / drag
├── AppControl        # 启动、停止、前台检测、层级 dump
└── Platform          # 模拟器发现与启停（按操作系统）
```

### 后端分发

每种截图/控制技术都是一个 mixin，`Screenshot` / `Control` 通过方法表按配置取函数：

```python
# 伪代码：运行时按配置分发
func = self.screenshot_methods[self.config.Emulator_ScreenshotMethod]
image = func(self)
```

截图与控制互相独立，可以自由混搭（如 `nemu_ipc` 截图 + `MaaTouch` 控制）。

### 统一后处理

所有后端返回的图都要经过同一套处理：

1. 分辨率归一化：非 1280×720 时缩放回资源空间。
2. 方向旋转。
3. 可选去抖动（`Emulator.ScreenshotDedithering`）。
4. 黑屏与分辨率校验。

::: danger 不要改 1280×720
识别资源、坐标、OCR 区域全部基于这个尺寸。改归一化逻辑等于让所有模板失准。
:::

### 稳定性检测

| 检测 | 实现 | 触发 |
| --- | --- | --- |
| 卡死 | 截图指纹 + 等待计时器双通道 | `GameStuckError` |
| 连点 | 最近 15 次点击统计 | `GameTooManyClickError` |
| 单按钮连击 | 阈值 12 次（`EXP_INFO_S` 放宽到 15） | 同上 |

恢复策略不在这层：设备层只负责把异常抛给调度器（`EmulatorNotRunningError` 等），重启决策在 `alas.py`。

## <DocIcon name="map" /> 页面导航

### 页面图

`module/ui/page.py` 在导入时声明全部页面与边：

```python
page_main.link(button=MAIN_GOTO_CAMPAIGN, destination=page_campaign)
```

截至审计版本约 63 个页面。新增页面只需要：

1. 定义 `Page(check_button=...)`。
2. 用 `link()` 声明至少一条入边和出边。
3. 确认 `check_button` 在该页面稳定出现。

### 导航 API

| API | 用途 |
| --- | --- |
| `ui_goto(page)` | 导航到目标页，失败抛异常 |
| `ui_ensure(page)` | 导航并确认所在页面 |
| `ui_back()` | 返回上一页 |
| `ui_ensure_index()` | 在页内索引中翻到指定项 |
| `ui_get_current_page()` | 识别当前页面 |
| `ui_additional()` | 切换途中清理弹窗 |

导航用 BFS 在页面图上找最短路。**不要写死点击序列**——页面改版会让固定序列直接失效，而图导航只需要补一条边。

### 未知页面恢复

识别不到任何已知页面时，按递进策略恢复：

1. 点击右上角 HOME。
2. 巡检弹窗（登录、公告、活动、网络错误）。
3. 重启游戏走登录流程。

这就是「7×24 运行」的兜底：宁可重启，也不要卡在一个无法识别的画面上。

## <DocIcon name="eye" /> OCR

`module/ocr/` 把「识别哪里、什么类型、什么颜色」收敛成声明式接口：

```python
# 业务代码只关心结果
count = self.ocr_quantity(OCR_SHOP_ITEM, amount=1)
```

### 预处理

不直接灰度识别，而是：

1. 按 `Button` 区域裁剪。
2. 按已知字色（默认白色）提取文字，生成黑字白底二值图。
3. 送入识别模型。

这屏蔽了描边、渐变和背景干扰，让同一套模型覆盖所有 UI。

### 模型与后端

- 模型：PP-OCRv6 系列（lite / standard / pro 三档），各语言用不同字典。
- 旧模型：`alocr_en_v2_6`、`alocr_cn_v3` 作为 `auto` 档默认值保留。
- 后端：ONNX Runtime（RapidOCR）、NCNN；Windows 支持 DirectML / QNN / OpenVINO，macOS 支持 CoreML ANE。
- 本地推理默认跳过检测模型（`RecOnlyOCR`），因为 UI 文字区域已知。

多实例资源控制：

```bash
# 每个 OCR 会话的 intra-op 线程上限，1..16，最终不超过逻辑 CPU 数
AZURPILOT_OCR_THREADS=2
```

只对新创建的会话生效，已有 worker 需要重启才能采用。

### 模型版本

`Optimization.OcrModelVersion*` 按语言分别配置。升级模型前先跑 `OcrBenchmark`，比较准确率与耗时。

## <DocIcon name="target" /> 地图与战斗

| 模块 | 职责 | 入口 |
| --- | --- | --- |
| `module/map` | 网格感知、透视、寻路 | `Map` |
| `module/map_detection` | 地图格子识别 | `map_detection` |
| `module/combat` | 战斗循环、结算、阵容 | `Combat` |
| `module/campaign` | 关卡选择、进图、`CampaignRun` | `CampaignRun` |
| `campaign/` | 具体关卡的地图与战斗定义 | Python 文件 |

### 战斗循环

```text
检测战斗界面 → 等待结算 → 读取结果
  ├── 胜利 → 继续寻敌 / 退出
  ├── 失败 → DefeatWithdraw 策略（撤退 / 换队 / 停止）
  └── 异常 → GameStuckError → 上层恢复
```

战败处理是跨模块的：`module/defeat_handling.py` 统一处理 C/D 共用画面、自动换队与心情政策。改战斗逻辑时先读它，不要在每个玩法里各写一份。

### 活动图

`campaign/` 下是**玩家编写的 Python 地图定义**，不是通用 YAML：

- 每张图定义格子、敌人、机关、boss。
- 活动适配参考相近活动，不要套用统一模板。
- 新活动需要提交地图与战斗策略，脚本不会「自动理解」新机制。

## <DocIcon name="compass" /> 大世界导航

`module/os/` 是浅包深链：

```text
OSMap(MapEventResumeMixin, OSFleet, Map, GlobeCamera, StorageHandler, StrategicSearchHandler)
```

- `globe_goto(zone)` 跨区域移动，把球面图与海域图统一成可编程空间。
- `OSGrid` 替换普通网格感知，球面单应性参数固定（大世界视角不变）。
- 17 个玩法任务放在 `tasks/`，继承 `OSMap` 获得全部导航能力。

改大世界逻辑前，先看[大型作战](/azurpilot/user/tasks/opsi)的用户侧语义，再看 `docs/modules/os/index.md`。

## <DocIcon name="pencil" /> 常见修改

### 换一个按钮资源

1. 按 1280×720 截取局部图。
2. 放到 `assets/<服务器>/`。
3. 在 `assets.py` 对应的 `Button` 上引用（或由 `button_extract` 生成）。
4. 运行离线识别验证。

```bash
uv run -m dev_tools.button_extract
```

### 新增一个页面

```python
page_my_feature = Page(check_button=OCR_MY_FEATURE_TITLE)
page_main.link(button=MAIN_GOTO_MY_FEATURE, destination=page_my_feature)
page_my_feature.link(button=BACK_ARROW, destination=page_main)
```

### 调整 OCR 区域

区域由 `Button` 的 `area` 决定。改区域等于改识别输入，必须用真实截图验证，不要凭感觉调。

## <DocIcon name="flask" /> 测试

| 范围 | 命令 |
| --- | --- |
| 导入冒烟 | `uv run python -m dev_tools.import_smoke_test` |
| 地图/战斗单测 | `uv run python -m unittest tests.test_combat_results tests.test_auto_search_defeat tests.test_opsi_map_event_resume` |
| OCR 配置与线程 | `uv run python -m unittest tests.test_ocr_settings tests.test_ocr_thread_limits` |
| OCR 基准 | WebUI「工具 → OCR 性能测试」 |

真实识别效果只能在设备上验证。静态测试通过不等于识别准确。
