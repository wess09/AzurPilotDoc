---
title: 構建、簽名與發佈
description: Android 宿主的版本規則、簽名配置、CI 構建矩陣、發佈清單字段與國內鏡像分發。
updated: 2026-10-20
---

# 構建、簽名與發佈

Android 版的發佈是「一套原始碼，多種產物」：按 ABI 的完整 APK、雙 ABI 輕量 APK、按 ABI 的 Runtime 包，全部掛在同一個固定 Release 下。

## <DocIcon name="package" /> 構建產物

| 產物 | 構建參數 | 內容 |
| --- | --- | --- |
| 完整 APK（單 ABI） | `assembleRelease -Pazurpilot.releaseAbi=<abi>` | 內置對應 rootfs |
| 完整 APK（雙 ABI） | `assembleRelease` | 省略 ABI 參數 |
| 輕量 APK | `assembleDebug/Release -Pazurpilot.slimApk=true` | 無 rootfs，雙 ABI |
| Runtime | CI `rootfs.yml` | `rootfs-<abi>.tar.xz` + `BUILD_MANIFEST` |

```bash
cd app
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime
./gradlew assembleDebug -Pazurpilot.slimApk=true
./gradlew assembleRelease -Pazurpilot.releaseAbi=arm64-v8a
```

Release 開啟 R8 混淆，`assembleRelease` 末尾自動跑 `verifyReleaseR8Keeps`，確認反射與 JNI 入口沒被裁掉。

## <DocIcon name="medal" /> 版本規則

| 項 | 規則 |
| --- | --- |
| `versionCode` | 本倉 HEAD 提交時間戳；事故時可用 `APP_VERSION_CODE` 手釘 |
| `versionName` | `1.<series>.<X>`，`X = 提交计数 − 基线` |
| 基線 | 定義在 `GitVersion.kt`，CI 的 `resolve` 步使用同一公式 |

::: warning 兩處必須同步
`GitVersion.kt` 的基線與 `.github/workflows/rootfs.yml` 的正則/公式必須一起改。只改一處會導致本地與 CI 版本號漂移。倉庫說明文件中出現過不同基線的歷史記錄，**以當前 `GitVersion.kt` 為準**，不要照抄舊數字。
:::

CI 用 `git diff --quiet "$app_commit" HEAD -- app` 判斷 Android 工程輸入是否變化：

- 未變 → 沿用已發佈 app 版本，可只發 Runtime。
- 變了 → `versionCode = max(旧值 + 1, HEAD 时间戳)`，`versionName` 按公式計算。

「app 版本沒變」不等於「不需要重建 Runtime」——`rootfs` 與工作流變化同樣會觸發產物重建。

## <DocIcon name="key" /> 簽名

| 場景 | 密鑰 | 說明 |
| --- | --- | --- |
| Release | 倉庫外 keystore（CI Secrets） | v1 + v2 + v3 全開 |
| Debug | 倉內固定 `debug.keystore` | 保證所有機器產出的 debug 包可互相覆蓋 |

四項配置：`KEYSTORE_PATH` / `KEYSTORE_PASSWORD` / `KEY_ALIAS` / `KEY_PASSWORD`。環境變數優先，`app/local.properties` 兜底。

沒有 keystore 時 release 保持未簽名，構建不失敗，但產物裝不上，只用於編譯驗證。

::: danger 簽名不一致 = 只能解除安裝重裝
`INSTALL_FAILED_UPDATE_INCOMPATIBLE` 意味著數據全丟。debug 與 release 互切前先匯出配置。
:::

## <DocIcon name="cloud" /> CI 流程

`.github/workflows/rootfs.yml`，推送 `main` 或手動 dispatch 觸發：

| 階段 | 內容 |
| --- | --- |
| `resolve` | 取上游 AzurPilot dev head；比較輸入，決定是否跳過構建 |
| `build` | 按 ABI 矩陣在原生 runner 構建 rootfs（`rootfs/build/build-azurpilot.sh`） |
| `apk` | 先 `fetch-proot-libs.sh`，再出按架構完整包與通用輕量包 |
| `publish` | 上傳固定 Release `azurpilot-android-latest`，更新 `latest.json` |

另有 `.github/workflows/check-upstream.yml` 跟蹤上游變化。

### 本地復刻 release

1. 從成功的 CI run 下載 `rootfs-<abi>` 產物。
2. 把 `rootfs.tar.xz` 與 `BUILD_MANIFEST` 放進 `app/app/src/main/assets/rootfs/`。
3. 配好 `KEYSTORE_*`。
4. `cd app && ./gradlew assembleRelease -Pazurpilot.releaseAbi=arm64-v8a`。

## <DocIcon name="clipboard" /> 發佈清單

固定 Release 的 `latest.json`：

| 字段 | 說明 |
| --- | --- |
| `versionCode` / `versionName` | App 更新 |
| `appCommit` | 上次真正構建 APK 的提交 |
| `azurpilotCommit` | Runtime 內的上游提交 |
| `androidHostCommit` | 構建 Runtime 的本倉提交 |
| `apkUrl` / `apkSha256` / `apkSize` | 通用輕量包 |
| `updateApks.<abi>` | 按架構輕量包 |
| `runtimes.<abi>` | 按架構 Runtime |
| `fullApks.<abi>` | 按架構完整 APK |
| `rootfs*` | 兼容字段，恒指向 arm64 |

兼容規則：舊版 App 只讀扁平 `rootfs*` 字段，所以它們必須始終有效。新版按 ABI 選 `updateApks`，防止 MuMu 把通用包切成 ARM 轉譯。

## <DocIcon name="smartphone" /> 多架構

| ABI | 用途 | 說明 |
| --- | --- | --- |
| `arm64-v8a` | 真機 | 主目標 |
| `x86_64` | 模擬器 | proot 庫需單獨獲取 |

不支援 32 位：Runtime 依賴 64 位 Linux 二進制。詳見 `doc/multi-arch.md`。

## <DocIcon name="download" /> 鏡像與下載源

- GitHub 與 CNB 都維護固定標籤，大小與 SHA-256 一致。
- 新安裝預設 `cnb`；已儲存的選擇不變。
- 內置五個 ghproxy 形態鏡像，設定裡也可填自定義前綴（非法輸入回落直連）。
- 實測 `gh-proxy.net` 會返回挑戰頁，**不可用於下載**。

## <DocIcon name="settings" /> 構建配置（build profiles）

`doc/build-profiles.md` 描述了 PI 打包配方、身份覆蓋與驗證方式。帶包名後綴的 profile 需要同步修改 `tools/watch-android-logs.ps1` 裡的 `$package`。

## <DocIcon name="circle-check" /> 發佈檢查清單

- [ ] `GitVersion.kt` 與 CI 公式一致
- [ ] `Cargo.toml` / `tauri.conf.json` 不涉及（那是啟動器）
- [ ] `CHANGELOG.md` 已更新
- [ ] rootfs 按 ABI 構建成功
- [ ] 完整包與輕量包都產出
- [ ] 簽名驗證通過（apksigner 分檔）
- [ ] `latest.json` 字段完整、兼容字段指向 arm64
- [ ] 在至少一臺 ARM64 真機與一臺 x86_64 模擬器上安裝驗證
- [ ] 熱更介面返回符合預期（`enabled` / `requiresRuntimeUpdate`）
