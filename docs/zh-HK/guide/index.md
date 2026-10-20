---
title: 選擇你的運行方式
description: AzurPilot 三種運行形態的適用場景、前置條件與後續閲讀路徑，幫助你在安裝前做出正確選擇。
updated: 2026-10-20
---

# 選擇你的運行方式

AzurPilot 有三條使用路徑，它們運行的是**同一套核心程序**，區別只在「誰來準備 Python 環境、誰託管後端進程、遊戲跑在哪裏」。

| 運行方式 | 遊戲跑在哪 | 需要電腦常開 | 適用場景 |
| --- | --- | --- | --- |
| 桌面啟動器 | Windows / macOS / Linux 上的模擬器 | 是 | 長時間掛機、多開、性能最好 |
| Android 本地運行 | 手機上的遊戲客戶端 | 否 | 沒有常開電腦，或想用舊手機專職掛機 |
| 源碼運行 | 任意支援 Python 3.14 的環境 | 是 | 開發、調試、自定義修改 |
| 遠程客戶端 | 其他機器上的實例 | 否（客戶端側） | 用手機查看、控制家裏電腦上的實例 |

## <DocIcon name="info" /> 先回答三個問題

<DocIcon name="smartphone" /> **1. 你打算讓遊戲跑在哪裏？**
模擬器（MuMu、雷電、藍疊、夜神等）適合桌面路徑；手機本地運行需要 Android 9.0 以上、ARM64 或 x86_64、至少 4 GB 記憶體與 2.5 GB 可用空間。

<DocIcon name="clock" /> **2. 這台機器能長期開機嗎？**
調度器的設計目標是 7×24 運行。如果電腦每晚關機，任務會在下次啟動時繼續，但大世界、委託這類按時間推進的玩法收益會下降。

<DocIcon name="wrench" /> **3. 你願意碰命令行嗎？**
不願意 → 啟動器或 APK。願意，或需要改代碼 → 源碼運行，參見[開發者入口](/zh-HK/azurpilot/developer/)。

## <DocIcon name="compass" /> 三條路徑的具體入口

<div class="ap-grid ap-grid--3">
<div>

#### 桌面啟動器
下載壓縮包，解壓縮後運行。啟動器會自建 `.venv`、拉取代碼、同步依賴並打開 WebUI。
[安裝啟動器 →](/zh-HK/launcher/user/install)
</div>
<div>

#### Android 宿主
安裝 APK，等待 Runtime 解壓縮，啟用 ADB 或 Root，然後在應用內配置實例。
[安裝 Android 版 →](/zh-HK/android/user/install)
</div>
<div>

#### 源碼運行
需要 Python 3.14 與 uv，執行 `uv sync --frozen` 後運行 `gui.py`。適合開發與疑難排解。
[源碼運行 →](/zh-HK/guide/install#源碼運行)
</div>
</div>

## <DocIcon name="clipboard" /> 無論哪條路徑，都繞不開的三件事

1. <DocIcon name="settings" /> **遊戲內設定**必須按推薦值調整，否則識別會失敗。清單見[環境與兼容性](/zh-HK/guide/requirements#遊戲內設定)。
2. <DocIcon name="monitor" /> **截圖解像度固定為 1280×720**。這是識別資源的製作基準，不是 UI 尺寸。
3. <DocIcon name="cloud" /> **首次運行必須聯網**。啟動器要下載 Python 與依賴，Android 輕量包要下載 Runtime，核心程序要拉取代碼。

::: warning 帳號風險自負
自動化操作違反遊戲用戶協議，存在封號風險。AzurPilot 不提供任何規避檢測的能力，也不會代替你承擔帳號後果。建議不要在主力帳號上做未經驗證的高風險操作。
:::

## <DocIcon name="map" /> 接下來讀什麼

<ul class="ap-linklist">
<li><a href="/zh-HK/guide/what-is-azurpilot">AzurPilot 是什麼<span class="desc">能力邊界與工作原理</span></a></li>
<li><a href="/zh-HK/guide/ecosystem">三個項目的關係<span class="desc">下載前先分清倉庫</span></a></li>
<li><a href="/zh-HK/guide/requirements">環境與兼容性<span class="desc">模擬器、系統與遊戲設定</span></a></li>
<li><a href="/zh-HK/guide/install">安裝<span class="desc">三條路徑的完整步驟</span></a></li>
</ul>
