---
title: OCR 与图像链路
description: 独立 :ocr 进程、张量 API、LiteRT/MNN 后端、厂商 NPU 适配、CPU 回退与帧通道延迟。
updated: 2026-10-20
---

# OCR 与图像链路

Android 版的 OCR 不在 Python 进程里跑，而是交给一个独立的 `:ocr` 工作进程。这样做有两个直接好处：推理崩溃不拖垮主界面；厂商 NPU 的库可以按进程隔离。

## <DocIcon name="zap" /> 调用链

```text
PRoot 内的 AzurPilot（Python）
  → module/ocr 的 ONNX 会话工厂被 android_ocr.py 代理
    → 校验模型身份（源 SHA-256 白名单）
      → 通过 127.0.0.1:22302 发送预处理后的 NCHW 张量（带口令）
        → :ocr 工作进程推理
          → 返回 logits
            → Python 侧做 CTC 解码与后处理
```

分工很明确：

| 环节 | 位置 |
| --- | --- |
| 区域裁剪、字色预处理 | Python（上游 OCR） |
| 模型推理 | Android `:ocr` |
| 字典、CTC 解码、纠错 | Python |
| 模型文件 | APK 内置 |

接口是私有绑定的工作进程，**不需要 root 或 Shizuku**。

## <DocIcon name="brain" /> 模型

自 2026-10-09 起使用模型格式 2：

- APK 内置 **5 个识别器 + 1 个检测器** 的 LiteRT FP32 模型。
- 海思另保留 4 个 MNN 转换。
- 原始 ONNX、NCNN 与旧 CnOCR 权重不再随 APK 或 rootfs 发布。
- CPU 复用 LiteRT；末尾 Softmax 可在 GPU 执行。

上游改变权重时**必须更新 APK**。宿主按模型身份文件中的源 SHA-256 匹配白名单，匹配不上不会误用旧转换，也不会静默回退到原始权重。

## <DocIcon name="settings" /> 后端与厂商

| 平台 | 实现 | 条件 |
| --- | --- | --- |
| 高通 | LiteRT → QNN HTP | Android 12+、ARM64；内置多个 Skel/Stub 版本 |
| 联发科 | LiteRT → NeuroPilot | Android 12+、ARM64；系统需开放兼容 APU 驱动 |
| 海思 / 麒麟 | MNN → HiAI NPU | Android 10+、ARM64；算子必须全部被后端接受 |
| 三星 Exynos | CPU 回退 | AI LiteCore 的 AOT 编译未通过 |
| Google Tensor | CPU 回退 | 需要外部 Beta SDK |
| 小米玄戒 | CPU 回退 | 缺少匹配的运行库与转换器 |
| Android 9 / x86_64 | LiteRT CPU | 保留安装范围 |

::: warning 不要按品牌承诺 NPU
是否启用看 SoC 与驱动，不看手机品牌。同一品牌不同机型可能一个走 QNN、一个回退 CPU。准确结论只能来自设备的实际初始化结果。
:::

### 厂商库隔离

宿主为当前厂商创建独立库目录，只放指向安装目录的符号链接，防止另一厂商的离线编译器抢先接管模型。APK 更新后会刷新链接。

Manifest 以 `required=false` 请求厂商公开的 RPC / NeuroPilot / HiAI 系统库。Android 12+ 要求显式声明非 NDK 库；缺少库的平台仍能安装并走 CPU。

## <DocIcon name="refresh" /> 回退与状态

- 初始化失败或推理异常 → 回退 LiteRT CPU。
- 某个模型在 NPU 上失败 → 主进程重新绑定，并**禁用该模型的 NPU**，避免反复崩溃。
- 状态与原因写日志，可在设置页查看当前后端。

## <DocIcon name="clock" /> 线程与资源

- 每个 OCR 会话默认限制 intra-op 线程，避免多实例按整机核数创建线程池。
- 环境变量 `AZURPILOT_OCR_THREADS=1..16` 可调，最终不超过逻辑 CPU 数。
- 只对新会话生效；已有 worker 需在任务允许时重启。

## <DocIcon name="eye" /> 图像链路

截帧不走 ADB：

```text
游戏（虚拟屏）
  → 特权进程 native 桥获取帧缓冲
    → 匿名 SharedMemory（ashmem / memfd）
      → Unix 抽象域套接字 + SCM_RIGHTS 传句柄
        → 宿主读取
```

| 指标 | 共享内存 | TCP |
| --- | --- | --- |
| 平均延迟 | 15.6 ms | 47.2 ms |
| 落盘 | 无 | 无 |

数据只在 RAM 流转，不写 Flash。帧指针的锁定与释放必须严格配对。

## <DocIcon name="flask" /> 基准与验证

| 项目 | 方法 |
| --- | --- |
| OCR 后端 | 应用内 OCR 测试 / `tools/benchmark_*` |
| 虚拟屏性能 | `tools/benchmark_virtual_display.py` |
| 截帧传输 | `tools/benchmark_capture_transport.py` |
| 模板匹配 | `tools/test_template_matching.py` |

设备端 Python 侧还有 `OcrBenchmark` 任务，可用于比较 CPU/GPU/NPU 的实际耗时。

## <DocIcon name="shield" /> 修改注意

| 不要 | 原因 |
| --- | --- |
| 在 Python 侧绕过 `android_ocr.py` 直接建 ONNX 会话 | 会加载不存在的权重 |
| 修改模型却不更新 APK | SHA-256 白名单会拒绝 |
| 在 `:ocr` 里做后处理 | 字典与 CTC 属于 Python 侧契约 |
| 假设所有设备都能用 NPU | 驱动与算子支持差异很大 |
| 把帧指针缓存跨帧 | 解锁后失效 |

## <DocIcon name="circle-check" /> 测试

```bash
# 宿主侧 OCR 相关（示例）
cd app && ./gradlew :app:compileDebugKotlin -x verifyBundledAzurPilotRuntime

# 真机 OCR 基准
uv run python tools/benchmark_virtual_display.py --help
```

静态编译通过不代表识别准确。识别效果必须在目标机型上用真实截图验证。
