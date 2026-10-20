---
title: OCR 與圖像鏈路
description: 獨立 :ocr 處理程序、張量 API、LiteRT/MNN 後端、廠商 NPU 適配、CPU 回退與幀通道延遲。
updated: 2026-10-20
---

# OCR 與圖像鏈路

Android 版的 OCR 不在 Python 處理程序裡跑，而是交給一個獨立的 `:ocr` 工作處理程序。這樣做有兩個直接好處：推理崩潰不拖垮主介面；廠商 NPU 的庫可以按處理程序隔離。

## <DocIcon name="zap" /> 調用鏈

```text
PRoot 内的 AzurPilot（Python）
  → module/ocr 的 ONNX 会话工厂被 android_ocr.py 代理
    → 校验模型身份（源 SHA-256 白名单）
      → 通过 127.0.0.1:22302 发送预处理后的 NCHW 张量（带口令）
        → :ocr 工作进程推理
          → 返回 logits
            → Python 侧做 CTC 解码与后处理
```

分工很明確：

| 環節 | 位置 |
| --- | --- |
| 區域裁剪、字色預處理 | Python（上游 OCR） |
| 模型推理 | Android `:ocr` |
| 字典、CTC 解碼、糾錯 | Python |
| 模型檔案 | APK 內置 |

介面是私有綁定的工作處理程序，**不需要 root 或 Shizuku**。

## <DocIcon name="brain" /> 模型

自 2026-10-09 起使用模型格式 2：

- APK 內置 **5 個識別器 + 1 個檢測器** 的 LiteRT FP32 模型。
- 海思另保留 4 個 MNN 轉換。
- 原始 ONNX、NCNN 與舊 CnOCR 權重不再隨 APK 或 rootfs 發佈。
- CPU 複用 LiteRT；末尾 Softmax 可在 GPU 執行。

上游改變權重時**必須更新 APK**。宿主按模型身份檔案中的源 SHA-256 匹配白名單，匹配不上不會誤用舊轉換，也不會靜默回退到原始權重。

## <DocIcon name="settings" /> 後端與廠商

| 平臺 | 實現 | 條件 |
| --- | --- | --- |
| 高通 | LiteRT → QNN HTP | Android 12+、ARM64；內置多個 Skel/Stub 版本 |
| 聯發科 | LiteRT → NeuroPilot | Android 12+、ARM64；系統需開放兼容 APU 驅動 |
| 海思 / 麒麟 | MNN → HiAI NPU | Android 10+、ARM64；算子必須全部被後端接受 |
| 三星 Exynos | CPU 回退 | AI LiteCore 的 AOT 編譯未通過 |
| Google Tensor | CPU 回退 | 需要外部 Beta SDK |
| 小米玄戒 | CPU 回退 | 缺少匹配的執行庫與轉換器 |
| Android 9 / x86_64 | LiteRT CPU | 保留安裝範圍 |

::: warning 不要按品牌承諾 NPU
是否啟用看 SoC 與驅動，不看手機品牌。同一品牌不同機型可能一個走 QNN、一個回退 CPU。準確結論只能來自設備的實際初始化結果。
:::

### 廠商庫隔離

宿主為當前廠商建立獨立庫目錄，只放指向安裝目錄的符號連結，防止另一廠商的離線編譯器搶先接管模型。APK 更新後會刷新連結。

Manifest 以 `required=false` 請求廠商公開的 RPC / NeuroPilot / HiAI 系統庫。Android 12+ 要求顯式聲明非 NDK 庫；缺少庫的平臺仍能安裝並走 CPU。

## <DocIcon name="refresh" /> 回退與狀態

- 初始化失敗或推理異常 → 回退 LiteRT CPU。
- 某個模型在 NPU 上失敗 → 主處理程序重新綁定，並**禁用該模型的 NPU**，避免反覆崩潰。
- 狀態與原因寫日誌，可在設定頁查看當前後端。

## <DocIcon name="clock" /> 執行緒與資源

- 每個 OCR 會話預設限制 intra-op 執行緒，避免多實例按整機核數建立執行緒池。
- 環境變數 `AZURPILOT_OCR_THREADS=1..16` 可調，最終不超過邏輯 CPU 數。
- 只對新會話生效；已有 worker 需在任務允許時重新啟動。

## <DocIcon name="eye" /> 圖像鏈路

截幀不走 ADB：

```text
游戏（虚拟屏）
  → 特权进程 native 桥获取帧缓冲
    → 匿名 SharedMemory（ashmem / memfd）
      → Unix 抽象域套接字 + SCM_RIGHTS 传句柄
        → 宿主读取
```

| 指標 | 共享記憶體 | TCP |
| --- | --- | --- |
| 平均延遲 | 15.6 ms | 47.2 ms |
| 落盤 | 無 | 無 |

數據只在 RAM 流轉，不寫 Flash。幀指針的鎖定與釋放必須嚴格配對。

## <DocIcon name="flask" /> 基準與驗證

| 專案 | 方法 |
| --- | --- |
| OCR 後端 | 應用內 OCR 測試 / `tools/benchmark_*` |
| 虛擬螢幕性能 | `tools/benchmark_virtual_display.py` |
| 截幀傳輸 | `tools/benchmark_capture_transport.py` |
| 模板匹配 | `tools/test_template_matching.py` |

設備端 Python 側還有 `OcrBenchmark` 任務，可用於比較 CPU/GPU/NPU 的實際耗時。

## <DocIcon name="shield" /> 修改注意

| 不要 | 原因 |
| --- | --- |
| 在 Python 側繞過 `android_ocr.py` 直接建 ONNX 會話 | 會加載不存在的權重 |
| 修改模型卻不更新 APK | SHA-256 白名單會拒絕 |
| 在 `:ocr` 裡做後處理 | 字典與 CTC 屬於 Python 側契約 |
| 假設所有設備都能用 NPU | 驅動與算子支援差異很大 |
| 把幀指針快取跨幀 | 解鎖後失效 |

## <DocIcon name="circle-check" /> 測試

```bash
# 宿主侧 OCR 相关（示例）
cd app && ./gradlew :app:compileDebugKotlin -x verifyBundledAzurPilotRuntime

# 真机 OCR 基准
uv run python tools/benchmark_virtual_display.py --help
```

靜態編譯通過不代表識別準確。識別效果必須在目標機型上用真實截圖驗證。
