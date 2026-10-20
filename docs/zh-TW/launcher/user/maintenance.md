---
title: 更新、修復與解除安裝
description: 核心程式與啟動器兩條更新線的關係、環境損壞的修復方式、日誌與快取位置，以及遷移到新機器和完整解除安裝的步驟。
updated: 2026-10-20
---

# 更新、修復與解除安裝

啟動器有兩個獨立版本：**啟動器自身**和**核心程式**。搞清楚誰更新了誰，才能判斷「為什麼介面變了但功能沒變」。

## <DocIcon name="refresh" /> 兩條更新線

| | 核心程式 | 啟動器 |
| --- | --- | --- |
| 更新方式 | 啟動時 `git pull` + `uv sync --frozen` | 自更新（mTLS + 多鏡像） |
| 頻率 | 跟隨 `master`，每天可能有提交 | 帶版本號的 Release |
| 影響 | 遊戲功能、WebUI、API | 外殼、啟動流程、處理程序管理 |
| 回滾 | `git checkout <sha>` | 換回舊版壓縮包 |

### 更新核心後會發生什麼

1. 啟動器下次啟動時 `git pull` 拉到新程式碼。
2. `uv sync --frozen` 按新 `uv.lock` 調整依賴。
3. `gui.py` 的 `ensure_frontend()` 檢查 `frontend/dist`，必要時重新構建（需要 Node.js）。
4. WebUI 刷新即生效；正在執行的實例會被停止並重新啟動。

::: warning 前端構建需要 Node
Windows 上啟動器會檢測系統級 Node.js，缺失時可自動下載安裝（SHA-256 校驗）。Linux / macOS 需要自備 Node，否則核心更新後前端可能構建失敗。
:::

### 更新啟動器後會發生什麼

- 啟動器二進制被替換，`.venv`、`config/`、`log/` 保留。
- 新版本可能要求不同的 Python 版本或工具鏈，此時會重新自舉 `.venv`（較慢，但配置不動）。
- 不會回退核心程式碼。

### 版本兼容

| 組合 | 結果 |
| --- | --- |
| 新啟動器 + 舊核心 | 通常可用；若新啟動器依賴核心的新介面，會提示更新 |
| 舊啟動器 + 新核心 | 可能缺少新協議支援（如免密登入、處理程序回收標記） |
| 兩者都舊 | 功能可用，但可能缺少修復 |

判斷依據是倉庫的 `CHANGELOG.md` 與發佈說明，不要憑版本號大小猜。

## <DocIcon name="wrench" /> 修復環境

### 依賴損壞

症狀：啟動報 `ModuleNotFoundError`、`ImportError`，或 `uv sync` 失敗。

```bash
# 在项目根目录
uv sync --frozen
```

如果仍失敗：

```bash
# 删除虚拟环境后让启动器重建（会重新下载依赖）
rm -rf .venv          # Windows: rmdir /s /q .venv
```

::: danger 刪 .venv 不會刪配置
`.venv` 只裝執行環境，`config/` 與日誌在別處。但重建需要聯網，耗時幾分鐘。
:::

### Git 倉庫損壞

症狀：更新失敗、`fatal: not a git repository`、衝突。

```bash
git status
git stash            # 有本地修改时先暂存
git pull --rebase
```

不要用 `git reset --hard` 清理——會丟掉你改過的配置模板或本地補丁。

### 連接埠被佔用

預設連接埠 `22267`。啟動器會結束佔用該連接埠的處理程序。若你同時執行了原始碼版實例（預設 `25548`），不會衝突；但兩個啟動器實例會。

### 快取

| 目錄 | 內容 | 能否刪除 |
| --- | --- | --- |
| `cache/` | 執行時快取、圖片等 | 可以，會重新生成 |
| `frontend/node_modules` | 前端依賴 | 可以，構建時重裝 |
| `frontend/dist` | 前端產物 | 可以，`gui.py` 會重建 |
| `log/` | 日誌 | 可以，但疑難排解前別刪 |

### 日誌

| 日誌 | 位置 |
| --- | --- |
| 啟動器 | `log/<日期>_launcher.txt` |
| 核心程式 | `log/<日期>_<实例>.txt` |
| 錯誤現場 | `log/error/<实例>/<时间戳>/` |

啟動器日誌記錄了每個階段的命令與退出碼；核心日誌記錄任務邊界與識別過程。提 Issue 時兩個都要。

## <DocIcon name="laptop" /> 遷移到新機器

<Steps>
<Step title="舊機器停止實例">

先停排程，避免複製時配置還在寫。

</Step>
<Step title="複製 config">

`config/` 整個目錄，含 `deploy.yaml`。帳號保險庫綁定設備，換機後需要重新錄入。

</Step>
<Step title="新機器安裝並首次啟動">

讓啟動器完成環境自舉，然後關閉。

</Step>
<Step title="覆蓋配置">

把舊 `config/` 覆蓋進去，啟動檢查實例列表與任務開關。

</Step>
<Step title="重配設備相關項">

模擬器 Serial、ADB 路徑、截圖方案按新機器調整。

</Step>
</Steps>

## <DocIcon name="circle-off" /> 解除安裝

1. 退出啟動器（系統匣 → 退出），確認沒有 `gui.py` 殘留。
2. 備份 `config/` 與 `AzurPilot_Data_Backup/`。
3. 刪除整個目錄。
4. 如果設定過開機自啟，在系統設定裡解除安裝對應項（啟動器解除安裝時通常會自動清理）。

## <DocIcon name="circle-alert" /> 疑難排解速查

| 現象 | 檢查 |
| --- | --- |
| 啟動畫面卡在「下載 Python」 | 網路 / 鏡像；換 `-cn` 版或改 `deploy.yaml` |
| 卡在「更新倉庫」 | 代理、分支名、GitHub 可達性；`--skip-update` 試啟動 |
| 卡在「同步依賴」 | PyPI 鏡像；`uv.lock` 與程式碼是否同版本 |
| 打開視窗空白 | WebView2 / libwebkit2gtk |
| 提示連接埠被佔用 | 另一個啟動器實例或佔用處理程序 |
| 關閉視窗後任務繼續 | 正常：最小化到系統匣 |
| 系統匣退出後仍有 python | 處理程序回收異常，查啟動器日誌裡的處理程序掃描記錄 |
| 更新後 WebUI 打不開 | 前端構建失敗，查 `frontend/dist` 與 Node |
| macOS 提示已損壞 | `xattr -dr com.apple.quarantine` |

更細的處理程序問題見[後端處理程序生命週期](/zh-TW/launcher/developer/backend-lifecycle)。
