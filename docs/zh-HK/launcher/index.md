---
title: AzurPilot Launcher
description: 基於 Tauri 2 + Rust 的跨平台桌面啟動器：內置 uv 與 Python、自動拉取核心代碼、託管後端進程。
updated: 2026-10-20
---

# AzurPilot Launcher

啟動器解決的是「裝 Python、配依賴、拉代碼、起服務」這四件事。它不包含遊戲邏輯，只負責把核心程序跑起來，並把它包裝成一個正常的桌面應用。

<div class="ap-meta">
<span><b>倉庫</b> wess09/AzurPilotLauncher</span>
<span><b>分支</b> main</span>
<span><b>框架</b> Tauri 2 + Rust</span>
<span><b>運行時</b> Python 3.14.6（內置）</span>
<span><b>許可證</b> GPL-3.0</span>
</div>

![啟動器正在更新 AzurPilot](/img/launcher-update.jpg)

<Figure caption="啟動器更新畫面：顯示目標版本、部署配置與進度，更新完成後自動進入主介面。" />

## <DocIcon name="wrench" /> 它到底做了什麼

```text
解压 → 启动器进程 → 启动画面 → 环境自举（uv/Python/git/adb）
     → git 更新核心仓库 → uv sync --frozen
       → 启动 gui.py → 打开 WebUI（免密直达）→ 托盘常驻
```

| 能力 | 實現 |
| --- | --- |
| 環境自舉 | 內嵌 uv，下載 Python 3.14.6，建立可重定位 `.venv` |
| 工具鏈 | git、adb 一併裝進 `.venv`，不污染系統 |
| 代碼更新 | `git pull`，失敗重試至多 20 次 |
| 依賴同步 | `uv sync --frozen`，按 `uv.lock` 鎖定 |
| 後端託管 | 清理連接埠佔用、注入環境標記、退出時全進程表回收 |
| 自更新 | mTLS 校驗 + 多鏡像回退 |
| 系統集成 | 托盤、原生通知、單實例、開機自啟 |
| 國際化 | 簡中 / 繁中 / 日語 / 英語，按系統 locale |

## <DocIcon name="handshake" /> 與核心程序的關係

| | 啟動器 | 核心程序 |
| --- | --- | --- |
| 倉庫 | AzurPilotLauncher | AzurPilot |
| 語言 | Rust / Tauri | Python / React |
| 版本線 | 獨立版本號 | 跟隨 `master` 滾動 |
| 更新 | 自更新（mTLS） | `git pull` + `uv sync` |
| 包含遊戲邏輯 | 否 | 是 |

::: tip 兩個版本號不是一回事
啟動器 1.x 可以配任意核心提交。更新啟動器不會回退核心代碼，更新核心也不會改啟動器。
:::

## <DocIcon name="clipboard" /> 環境要求

| 維度 | 要求 |
| --- | --- |
| 系統 | Windows 10+、macOS、Linux（較新 glibc） |
| WebView | Windows 需 WebView2；macOS 用系統 WKWebView；Linux 需 `libwebkit2gtk-4.1` |
| 權限 | Windows 需要管理員（安裝 ADB、寫系統目錄） |
| 網絡 | 首次啟動需聯網下載 Python 與依賴 |
| 磁盤 | 約 3–5 GB（含 .venv 與倉庫） |

## <DocIcon name="folder" /> 目錄結構

```text
AzurLaneAutoScript/                 # Windows / Linux 根目录
AzurPilot.app/Contents/AzurLaneAutoScript/   # macOS

├── alas-launcher.exe / alas-launcher
├── .venv/                          # Python + uv + git + adb
├── config/                         # 实例配置与 deploy.yaml
├── frontend/                       # 核心仓库的前端
├── log/                            # 运行日志
└── AzurPilot_Data_Backup/          # 每日备份
```

啟動器會向子進程追加環境變數：

| 平台 | PATH 追加 |
| --- | --- |
| Unix | `.venv/bin` |
| Windows | `.venv/Scripts`、`.venv/Scripts/git/cmd` |

## <DocIcon name="scale" /> 與原版啟動器的差異

| 項 | 本啟動器 |
| --- | --- |
| 平台 | Windows / macOS / Linux |
| 更新策略 | 只更新 git 倉庫，依賴用 `.venv` 內的 uv 同步 |
| 依賴鎖定 | `uv.lock` 精確鎖定，預設自動同步 |
| adb | 不重新啟動、不替換 |
| 工具位置 | 全部收進 `.venv` |
| Node.js | 僅 Windows：檢測系統 Node，缺失時可自動安裝（SHA-256 校驗） |

## <DocIcon name="map" /> 繼續閲讀

<ul class="ap-linklist">
<li><a href="/zh-HK/launcher/user/install">安裝<span class="desc">三平台步驟與依賴</span></a></li>
<li><a href="/zh-HK/launcher/user/first-run">首次啟動<span class="desc">環境初始化做了什麼</span></a></li>
<li><a href="/zh-HK/launcher/user/maintenance">更新、修復與移除<span class="desc">環境損壞怎麼辦</span></a></li>
<li><a href="/zh-HK/launcher/developer/architecture">Tauri 與 Rust 架構<span class="desc">源碼入口</span></a></li>
</ul>
