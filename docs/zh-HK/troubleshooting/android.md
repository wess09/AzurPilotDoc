---
title: Android 疑難排解
description: Runtime 部署失敗、Shizuku 權限失效、虛擬熒幕黑屏、後台被系統殺死、熱更新回滾與性能不足的處理順序。
updated: 2026-10-20
---

# Android 疑難排解

## <DocIcon name="compass" /> 按階段定位

| 階段 | 表現 | 先看 |
| --- | --- | --- |
| 安裝 | 解析包錯誤、閃退 | 架構、簽名 |
| 部署 | 停在 Checking / Downloading / Extracting | 網絡、空間、ABI |
| 啟動 | Runtime 起不來 | 日誌、WebUI 就緒 |
| 啟用 | 配對了但服務沒起來 | USB 調試授權、5555 |
| 運行 | 虛擬熒幕黑屏、點不動 | 特權服務、截圖方案 |
| 後台 | 息屏後停止 | 電池優化、保活 |
| 更新 | 熱更失敗、啟動崩潰 | 事務日誌、回滾 |

## <DocIcon name="package" /> 安裝與部署

| 現象 | 原因 | 處理 |
| --- | --- | --- |
| 解析包錯誤 | 下載不完整/架構不符 | 重新下載對應 ABI |
| 一啟動就閃退 | 32 位設備 / 架構錯 | 換 64 位設備 |
| 狀態 `NotBundled` | 輕量包且無本架構 Runtime | 換完整包 |
| 狀態 `LowDisk` | 剩餘 < 2 GB | 清理空間 |
| 下載卡住 | 鏡像返回挑戰頁、代理攔截 | 換下載源 |
| 校驗失敗 | 半成品或源不一致 | 刪除重下 |
| 解壓縮失敗 | 空間不足或中斷 | 重試；仍失敗換完整包 |

::: tip 首次 WebUI 慢是正常的
`__pycache__` 被剝離，首次啟動重建字節碼，可能超過 90 秒。日誌裏的 `WebUI not ready within 90000ms` 是預期警告。
:::

## <DocIcon name="lock" /> 權限與啟用

| 現象 | 原因 | 處理 |
| --- | --- | --- |
| 配對成功但服務未啟動 | 未確認 USB 調試授權 | 重新配對，勾選「始終允許」 |
| 重新啟動後失效 | adbd 授權未持久化 | 重新啟用（正常行為） |
| `Binder` 超時 | 特權進程被殺 | 關電池優化，重試 |
| 外部 Shizuku 連不上 | 管理器未運行/授權撤銷 | 打開管理器重新授權 |
| 聯發科設備啟動崩潰 | ROM 注入 | 應用已用 Context-only 路徑；仍失敗附日誌 |
| 斷網後不能重連 | 系統回收了調試 | 本次開機內應可重連；重新啟動後需重啟用 |

## <DocIcon name="monitor" /> 虛擬熒幕與畫面

| 現象 | 原因 | 處理 |
| --- | --- | --- |
| 掛機頁黑屏 | 未啟用特權服務 | 檢查啟用狀態 |
| 有畫面但點擊無效 | 控制方案不是 `azurpilot_android` | 改成宿主方案 |
| 畫面卡住 | 遊戲進程無響應 | 重新啟動遊戲/實例 |
| 主熒幕被佔用 | 遊戲跑到主熒幕 | 檢查虛擬熒幕是否建立成功 |
| SDK 登入頁跑到主熒幕 | OEM 重定向 | 依賴 `SdkTaskRepatriator`；異常時手動搬回 |

## <DocIcon name="zap" /> 後台被殺

| 線索 | 原因 | 處理 |
| --- | --- | --- |
| 日誌突然截斷 | 系統殺進程 | 電池優化設為不受限制 |
| 息屏幾分鐘後停止 | 省電策略 | 加自啟動/後台白名單 |
| 只在某 ROM 上發生 | 廠商策略 | 單獨配置該 ROM 的白名單 |
| 前台通知消失 | 前台服務被停 | 重新啟動 Runtime |

::: warning 保活不能對抗所有 ROM
極端省電模式下，系統仍可能強殺。重要任務不要只依賴手機長期掛機。
:::

## <DocIcon name="refresh" /> 熱更與整包

| 現象 | 原因 | 處理 |
| --- | --- | --- |
| 熱更提示需要整包 | `uv.lock` 變化 | 走整包更新 |
| 熱更後啟動崩潰 | 事務回滾失敗 | 查 `config/android-update-transaction.json` |
| 前端構建超時 | 設備性能/網絡 | 保持舊版，換時間重試 |
| 整包後配置丟失 | 異常中斷 | 從備份恢復 `config/` |
| App 更新裝不上 | 簽名不一致 | 移除重裝（先匯出數據） |

## <DocIcon name="smartphone" /> 遠程客戶端

| 現象 | 原因 | 處理 |
| --- | --- | --- |
| 掃碼無反應 | 二維碼過期 | 重新生成 |
| 連上但一直轉圈 | WebSocket 阻斷 | 換網絡 |
| `UNAUTHORIZED` | 配對撤銷 | 重新配對 |
| 切後台斷開 | 後台網絡限制 | 允許後台運行 |

## <DocIcon name="scroll" /> 日誌與匯出

```bash
adb logcat -v time --pid=$(adb shell pidof com.azurpilot.ghio)
adb shell tail -n 200 /sdcard/Android/data/com.azurpilot.ghio/files/log/proot/session.log
adb forward tcp:25548 tcp:25548
```

應用內「日誌 → 匯出」會打包 zip。匯出前確認不含憑據檔案。

## <DocIcon name="circle-alert" /> 兼容性邊界

| 設備 | 狀態 |
| --- | --- |
| Android 12–15 ARM64 主流機型 | 推薦 |
| Android 9–10 | 可用，配對需 `adb tcpip 5555` |
| x86_64 模擬器 | 可用，需對應 Runtime |
| 32 位設備 | 不支援 |
| 部分定製 ROM | 懸浮窗/保活/彈出視窗行為需實測 |
| 三星 Exynos / Tensor | OCR 走 CPU 回退 |
