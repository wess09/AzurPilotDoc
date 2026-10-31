---
title: AzurPilot Launcher
description: 基於 Tauri 2 + Rust 的跨平臺桌面啟動器：內置 uv 與 Python、自動拉取核心程式碼、代管後端處理程序。
updated: 2026-10-31
---

# AzurPilot Launcher

啟動器解決的是「裝 Python、配依賴、拉程式碼、起服務」這四件事。它不包含遊戲邏輯，只負責把核心程式跑起來，並把它包裝成一個正常的桌面應用。

<div class="ap-meta">
<span><b>倉庫</b> wess09/AzurPilotLauncher</span>
<span><b>分支</b> main</span>
<span><b>框架</b> Tauri 2 + Rust</span>
<span><b>執行時</b> Python 3.14.3（內置/獨立管理）</span>
<span><b>許可證</b> GPL-3.0</span>
</div>

![啟動器正在更新 AzurPilot](/img/launcher-update.jpg)

<Figure caption="啟動器更新畫面：顯示目標版本、部署配置與進度，更新完成後自動進入主介面。" />

## <DocIcon name="wrench" /> 它到底做了什麼

```text
解压/安装 → 启动器进程 → 启动画面 → 环境自举（uv/Python/git/adb）
     → git 更新核心仓库 → uv sync --frozen --no-dev --no-install-project
       → 启动 gui.py → 打开 WebUI（免密直达）→ 托盘常驻
```

| 能力 | 實現 |
| --- | --- |
| 環境自舉 | 內嵌 uv，自動下載獨立 Python 3.14.3，建立可重定位 `.venv` |
| 工具鏈 | git、adb 集中收攏並管理，不汙染宿主全局環境 |
| 程式碼更新 | `git pull`，失敗重試至多 20 次 |
| 依賴同步 | `uv sync --frozen --no-dev --no-install-project`，按 `uv.lock` 嚴格鎖定 |
| 後端代管 | 清理連接埠佔用、注入環境標記、退出時全處理程序表回收（Windows Job Object / Unix 處理程序組） |
| 自更新 | mTLS 校驗 + 多鏡像回退機制 |
| 系統集成 | 系統匣、原生通知、單實例執行、開機自啟 |
| 國際化 | 簡中 / 繁中 / 日語 / 英語四語支援；系統 locale 自動識別，Windows 安裝嚮導內置簡體中文語言包 |

## <DocIcon name="handshake" /> 與核心程式的關係

| | 啟動器 | 核心程式 |
| --- | --- | --- |
| 倉庫 | AzurPilotLauncher | AzurPilot |
| 語言 | Rust / Tauri 2 | Python / React |
| 版本線 | 獨立版本號（發佈版基線 3.0.4，原始碼模板 0.0.0） | 跟隨 `master` 滾動 |
| 更新 | 啟動器自更新（mTLS / 清單回退） | `git pull` + `uv sync` |
| 包含遊戲邏輯 | 否 | 是 |

::: tip 兩個版本號不是一回事與 0.0.0 說明
啟動器版本與核心程式完全解耦，啟動器 3.x / 1.x 可以配任意核心提交。更新啟動器不會回退核心程式碼，更新核心也不會改變啟動器二進制。
在原始碼倉庫中，`Cargo.toml`、`tauri.conf.json` 與 `Info.plist` 統一固定為 `0.0.0` 模板基線；實際發佈版本（如穩定的 **3.0.4**）由 CI 工作流在打包時動態解析 Git Tag 或輸入參數並注入，避免多檔案硬編碼版本漂移。
:::

## <DocIcon name="clipboard" /> 環境要求

| 維度 | 要求 |
| --- | --- |
| 系統 | Windows 10+（x64 / ARM64）、macOS 12+、Linux（Ubuntu 22.04+ 或同等較新 glibc 發行版） |
| WebView | Windows 需 WebView2；macOS 使用系統 WKWebView；Linux 需 `libwebkit2gtk-4.1` 與 `libgtk-3` |
| 權限 | Windows 安裝器與部分功能需管理員權限（安裝 ADB、寫系統目錄與連接埠綁定） |
| 網路 | 首次啟動或部署需聯網下載 Python 與專案依賴（支援國內鏡像回退） |
| 硬碟 | 約 3–5 GB（含獨立 .venv 與核心程式碼倉庫） |

## <DocIcon name="folder" /> 目錄結構

跨平臺打包提供了統一規範的目錄組織形式：

```text
# Windows / Linux 目录结构
AzurLaneAutoScript/                 # 根工作区目录
├── alas-launcher.exe / alas-launcher  # 启动器可执行文件
├── .venv/                          # Python 3.14.3 + uv + 依赖环境
│   ├── Scripts/ (Windows) 或 bin/ (Linux)
│   └── python/                     # standalone Python 安装目录
├── config/                         # 实例配置与 deploy.yaml
├── frontend/                       # 核心 WebUI 前端产物
├── log/                            # 运行日志
└── AzurPilot_Data_Backup/          # 每日备份

# macOS 应用包结构 (App Bundle)
AzurPilot.app/
└── Contents/
    ├── MacOS/
    │   └── AzurPilot               # 启动器主入口二进制
    ├── Resources/
    │   └── icon.icns               # 应用图标
    ├── Info.plist                  # 应用属性与版本配置
    └── AzurLaneAutoScript/         # 独立工作区（含 .venv/bin、配置与日志）
```

啟動器會向子處理程序追加環境變數：

| 平臺 | PATH 追加 |
| --- | --- |
| Unix | `.venv/bin` |
| Windows | `.venv/Scripts`、`.venv/Scripts/git/cmd`（若使用內嵌 git） |

## <DocIcon name="scale" /> 與原版啟動器的差異

| 項 | 本啟動器 |
| --- | --- |
| 平臺 | Windows（x64 / ARM64）、macOS、Linux |
| 更新策略 | 只更新 git 倉庫，依賴用 `.venv` 內的 uv 同步 |
| 依賴鎖定 | `uv.lock` 精確鎖定，預設自動同步 |
| adb | 不強行重新啟動、不強行替換 |
| 工具位置 | 全部收進 `.venv` 或專用工具目錄 |
| 多語言 | 簡中、繁中、日、英四語，安裝嚮導內置中文語言檔案 |

## <DocIcon name="map" /> 繼續閱讀

<ul class="ap-linklist">
<li><a href="/zh-TW/launcher/user/install">安裝<span class="desc">三平臺步驟與依賴</span></a></li>
<li><a href="/zh-TW/launcher/user/first-run">首次啟動<span class="desc">環境初始化做了什麼</span></a></li>
<li><a href="/zh-TW/launcher/user/maintenance">更新、修復與解除安裝<span class="desc">環境損壞怎麼辦</span></a></li>
<li><a href="/zh-TW/launcher/developer/architecture">Tauri 與 Rust 架構<span class="desc">原始碼入口</span></a></li>
</ul>
