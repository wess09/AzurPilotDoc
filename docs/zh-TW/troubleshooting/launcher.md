---
title: 啟動器疑難排解
description: 環境自舉失敗、連接埠衝突、代理與鏡像、macOS/Linux 依賴、處理程序殘留的處理。
updated: 2026-10-20
---

# 啟動器疑難排解

啟動器的報錯分兩類：**自舉失敗**（環境沒搭好）和**執行時失敗**（後端起來了但連不上）。錯誤頁會給出階段，先按階段定位。

## <DocIcon name="rocket" /> 自舉階段

| 階段 | 現象 | 原因 | 處理 |
| --- | --- | --- | --- |
| 建立 `.venv` | 卡住/權限錯誤 | 目錄只讀、路徑含特殊字符 | 換到用戶目錄 |
| 下載 Python | 超時/校驗失敗 | 鏡像不可用 | 換 `-cn` 版或網路 |
| 更新倉庫 | `git` 失敗 | 代理、分支不存在、硬碟滿 | 查 `deploy.yaml`；`--skip-update` 試啟動 |
| 同步依賴 | `uv sync` 失敗 | PyPI 不可達、鎖檔案不匹配 | 換鏡像；確認程式碼與 `uv.lock` 同版本 |
| 啟動後端 | 立即退出 | 連接埠佔用、Python 崩潰 | 看後端日誌與連接埠 |
| 打開視窗 | 空白 | WebView 執行時缺失 | 裝 WebView2 / webkit2gtk |

### 常用修復

```bash
# 跳过仓库更新启动
./alas-launcher --skip-update

# 重新同步依赖
uv sync --frozen

# 彻底重建环境（会重新下载）
rm -rf .venv
```

::: danger 刪除 .venv 不會丟配置
配置在 `config/`，日誌在 `log/`。但重建需要聯網，耗時幾分鐘。
:::

## <DocIcon name="plug" /> 連接埠

| 現象 | 原因 | 處理 |
| --- | --- | --- |
| 提示連接埠被佔用 | 另一個啟動器/後端佔用 22267 | 關掉舊處理程序 |
| 後端起不來但連接埠空閒 | 啟動器與核心連接埠配置不一致 | 查 `deploy.yaml` 的 `WebuiPort` |
| 改了連接埠仍打不開 | WebView 仍指向舊地址 | 重新啟動啟動器 |

啟動器啟動前會清理佔用連接埠的處理程序。如果你同時跑原始碼版（25548），兩者不衝突。

## <DocIcon name="cloud" /> 網路與代理

| 現象 | 原因 | 處理 |
| --- | --- | --- |
| 更新倉庫超時 | GitHub 不可達 | CN 版 / 配 `GitProxy` |
| Python 下載慢 | 預設源不通 | 換網路或手動配鏡像 |
| 依賴安裝 403 | 企業代理攔截 | 配 PyPI 鏡像或代理白名單 |
| 後端連不上但瀏覽器能開 | 系統代理攔了迴環 | 啟動器已用 `--no-proxy-server`；檢查全局代理軟體 |

## <DocIcon name="laptop" /> macOS

| 現象 | 處理 |
| --- | --- |
| 「應用已損壞」 | `xattr -dr com.apple.quarantine /Applications/AzurPilot.app` |
| 打開後無視窗 | 看 Console.app 的崩潰日誌；確認架構匹配 |
| 系統匣圖標不顯示 | 菜單欄空間不足，解除安裝其他圖標 |

## <DocIcon name="wrench" /> Linux

| 現象 | 處理 |
| --- | --- |
| `libwebkit2gtk-4.1` 缺失 | `apt install libwebkit2gtk-4.1-0` |
| `GLIBC_2.xx not found` | 發行版太舊；用原始碼執行核心 |
| 系統匣不顯示 | 需要 AppIndicator 擴展 |
| 無沙箱權限 | 不要用 Flatpak/Snap 包裹，直接跑二進制 |

## <DocIcon name="monitor" /> Windows

| 現象 | 處理 |
| --- | --- |
| UAC 被拒 | 必須以管理員執行 |
| SmartScreen 攔截 | 更多資訊 → 仍要執行 |
| 缺少 WebView2 | 安裝 Evergreen Runtime |
| 殺軟隔離 `git.exe` | 把 `.venv` 加入白名單 |
| 中文路徑異常 | 換純英文路徑 |

## <DocIcon name="circle-alert" /> 處理程序殘留

| 現象 | 原因 | 處理 |
| --- | --- | --- |
| 退出後仍有 `python.exe` | 回收異常 | 看啟動器日誌的處理程序掃描；重新啟動系統 |
| 模擬器被一起關掉 | Job 繼承 | 確認後端與啟動器都支援 breakaway |
| 重複啟動出現兩個後端 | 單實例失效 | 關掉所有實例再啟動 |

細節見[後端處理程序生命週期](/zh-TW/launcher/developer/backend-lifecycle)。

## <DocIcon name="scroll" /> 日誌

```text
log/<日期>_launcher.txt
```

包含每個自舉階段的命令、退出碼、耗時。定位不到時，把最後 100 行附到 Issue。

## <DocIcon name="refresh" /> 回滾

1. 下載上一版壓縮包。
2. 覆蓋可執行檔案（保留 `.venv`、`config/`）。
3. 若新版改過 `.venv` 結構，刪除 `.venv` 讓它重建。

核心程式碼回滾與啟動器無關：

```bash
git log --oneline -5
git checkout <sha>
uv sync --frozen
```
