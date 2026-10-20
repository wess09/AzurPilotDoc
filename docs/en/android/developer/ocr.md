---
title: OCR & Vision Pipeline
description: "Isolated :ocr process, tensor APIs, LiteRT/MNN backends, vendor NPU acceleration, CPU fallback, and frame channel latency."
updated: 2026-10-20
---

# OCR & Vision Pipeline

The Android host executes OCR outside the Python environment inside an isolated `:ocr` process. This guarantees that model crashes do not take down the main user interface and isolates proprietary vendor NPU libraries.

## <DocIcon name="zap" /> Inference Pipeline

```text
AzurPilot inside PRoot (Python)
  → ONNX session factory inside module/ocr is proxied by android_ocr.py
    → Validates model identity against SHA-256 whitelist
      → Sends preprocessed NCHW tensors with auth token to 127.0.0.1:22302
        → :ocr process executes hardware inference
          → Returns raw output logits
            → Python processes CTC decoding and post-processing
```

Division of responsibilities:

| Stage | Execution Location |
| --- | --- |
| ROI cropping, image thresholding | Python (upstream OCR engine) |
| Neural network inference | Android `:ocr` service |
| Dictionary lookup, CTC decoding, error correction | Python |
| Model weights | Packaged inside the host APK |

The inference service binds privately and **requires neither Root nor Shizuku**.

## <DocIcon name="brain" /> Model Formats

The application uses Model Format 2:

- Bundles **5 recognition models + 1 detection model** converted to LiteRT FP32.
- Maintains 4 MNN models for HiSilicon devices.
- Deprecates legacy ONNX, NCNN, and older CnOCR weights from distribution packages.
- CPU inference uses LiteRT; terminal Softmax operations can execute on GPU.

Upstream weight modifications **require an updated APK**. The host validates model identity against SHA-256 whitelists and refuses mismatched conversions.

## <DocIcon name="settings" /> Hardware Acceleration Backends

| Hardware Target | Implementation | Requirements |
| --- | --- | --- |
| Qualcomm Snapdragon | LiteRT → QNN HTP | Android 12+, ARM64; embeds versioned Skel/Stub binaries |
| MediaTek Dimensity | LiteRT → NeuroPilot | Android 12+, ARM64; requires compatible vendor APU drivers |
| HiSilicon Kirin | MNN → HiAI NPU | Android 10+, ARM64; operators must map cleanly to NPU |
| Samsung Exynos | CPU fallback | Excluded due to AI LiteCore AOT compilation failures |
| Google Tensor | CPU fallback | Requires external beta SDKs |
| Xiaomi Custom SoCs | CPU fallback | Lacks compatible toolchains and runtimes |
| Android 9 / x86_64 | LiteRT CPU | Baseline compatibility fallback |

::: warning Hardware Support Depends on SoCs, Not Brands
NPU acceleration depends on the chipset and driver version rather than device brand. Devices from the same manufacturer may run QNN or fall back to CPU depending on the installed processor.
:::

### Vendor Library Isolation

The host creates vendor-specific library directories containing symlinks to application directories, preventing conflicting offline compilers from intercepting inference requests. Symlinks are refreshed following APK updates.

The manifest specifies `required=false` for vendor RPC, NeuroPilot, and HiAI libraries. Devices lacking these libraries install cleanly and fall back to CPU inference.

## <DocIcon name="refresh" /> Fallback & Recovery

- Initialization errors or inference crashes trigger automatic fallback to LiteRT CPU.
- If a specific model fails on NPU, the host rebinds the service and **disables NPU acceleration for that model** to prevent crash loops.
- Active backends and operational status are logged and inspectable in Settings.

## <DocIcon name="clock" /> Threading & Concurrency

- OCR sessions limit intra-op threading by default to avoid thread exhaustion from multi-instance concurrency.
- Configurable via `AZURPILOT_OCR_THREADS=1..16`, capped by logical CPU cores.
- Applies to new sessions; running workers update upon task restart.

## <DocIcon name="eye" /> Frame Capture Pipeline

Frame capture operates outside ADB:

```text
Game (Virtual Display)
  → Native bridge acquires framebuffer in privileged process
    → Anonymous SharedMemory (ashmem / memfd)
      → Passes descriptor over Unix domain socket via SCM_RIGHTS
        → Host reads buffer
```

| Metric | Shared Memory | TCP Stream |
| --- | --- | --- |
| Average Latency | 15.6 ms | 47.2 ms |
| Disk Writes | Zero | Zero |

Buffers exist purely within volatile memory. Frame pointers must be released via `UnlockPixels` immediately after processing.

## <DocIcon name="flask" /> Benchmarking Tools

| Benchmark | Method |
| --- | --- |
| OCR Acceleration | In-app benchmark / `tools/benchmark_*` |
| Virtual Display Throughput | `tools/benchmark_virtual_display.py` |
| Frame Transport Latency | `tools/benchmark_capture_transport.py` |
| Template Matching Performance | `tools/test_template_matching.py` |

On-device Python tasks include `OcrBenchmark` to evaluate comparative latency across CPU, GPU, and NPU.

## <DocIcon name="shield" /> Implementation Guidelines

| Forbidden Pattern | Justification |
| --- | --- |
| Instantiating ONNX sessions directly in Python | Attempts to load non-existent model files |
| Altering models without updating APK | Rejected by SHA-256 whitelist validation |
| Moving CTC decoding into `:ocr` | Violates interface boundary with Python |
| Assuming universal NPU support | Driver and operator support varies significantly |
| Caching frame pointers across intervals | Pointers dangle immediately upon unlock |

## <DocIcon name="circle-check" /> Verification Commands

```bash
# Compile host OCR bindings
cd app && ./gradlew :app:compileDebugKotlin -x verifyBundledAzurPilotRuntime

# Run display benchmark
uv run python tools/benchmark_virtual_display.py --help
```

Compilation verifies interface signatures; real-world recognition accuracy requires physical hardware testing with actual game screenshots.
