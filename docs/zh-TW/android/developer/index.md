---
title: Android 開發者入口
description: 從零構建 Android 宿主：需要的 JDK 與 NDK 版本、首次構建命令、自檢與驗證方式、Logcat 調試技巧，以及各模組在倉庫中的位置。
updated: 2026-10-20
---

# Android 開發者入口

這個倉庫是 **Android 宿主**，不是遊戲邏輯。改宿主時你要同時考慮 Kotlin/Compose、JNI、PRoot 會話與 Runtime 鏡像四層。

## <DocIcon name="laptop" /> 環境

| 工具 | 版本 / 說明 |
| --- | --- |
| Android Studio | 打開與調試 |
| JDK | 17（JVM target） |
| Android SDK | `compileSdk 37` / `targetSdk 36` / `minSdk 28` |
| NDK + CMake | 3.22.1，編譯 `libbridge.so` |
| Git | **必須完整歷史**，版本號取自提交計數，淺克隆會算錯 |
| uv | 跑 Python 腳本與 rootfs 測試 |
| adb | 安裝、日誌、連接埠轉發 |

Windows 注意：

- `python3` 可能是 Microsoft Store 的佔位程序，先用 `python --version` 探測。
- Python `subprocess` 裡的 `bash` 會落到 WSL，不是 Git Bash；Python 腳本用 `uv run`。
- shell 腳本在 Git Bash 執行，`tools/watch-android-logs.ps1` 在 PowerShell 執行。

## <DocIcon name="package" /> 首次構建

```bash
git clone https://github.com/wess09/AzurPilot-for-Android.git
cd AzurPilot-for-Android/app

# 只编译 Kotlin，跳过 rootfs 校验
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime

# 精简 debug 包（无 rootfs）
./gradlew assembleDebug -Pazurpilot.slimApk=true
```

產物在 `app/app/build/outputs/apk/debug/`。

### 為什麼構建會失敗

`verifyBundledAzurPilotRuntime` 會檢查 `app/app/src/main/assets/rootfs/` 下的 `rootfs.tar.xz`（300 MB+）與 `BUILD_MANIFEST`。這兩個是 CI 產物，不入庫。本地缺失時所有 `package*` / `assemble*` 都會明確失敗——這是為了避免打出沒有執行時的殘缺包。

兩種解法：

- 從 CI 下載 `rootfs-<abi>` 產物，放進 `assets/rootfs/`。
- 用 `-Pazurpilot.slimApk=true` 跳過。

x86_64 的 proot 庫同樣不入庫，需要時：

```bash
bash app/scripts/fetch-proot-libs.sh
```

只想編 arm64 時，在 `app/local.properties` 寫 `build.debugAbi=arm64-v8a`。

## <DocIcon name="circle-check" /> 日常驗證

| 改動 | 命令 |
| --- | --- |
| Kotlin / Compose / AIDL | `cd app && ./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime` |
| 原生橋 / CMake | `cd app && ./gradlew assembleDebug -Pazurpilot.slimApk=true` |
| rootfs 覆蓋層 | `uv run --with psutil python -m unittest discover -s rootfs/tests` |
| 文案 | `python app/scripts/check_i18n_strings.py` |
| Shell / PowerShell 工具 | 先語法檢查，再在授權設備上只讀或受控執行 |

::: danger 不要執行 `:app:testDebugUnitTest`
測試源集裡有孤兒測試，編譯不過。Kotlin 的正確性用 `compileDebugKotlin` 驗證。這是倉庫明確寫下的約定。
:::

## <DocIcon name="smartphone" /> 安裝與調試

```bash
adb install -r -d app/app/build/outputs/apk/debug/app-debug.apk

# logcat
adb logcat -v time --pid=$(adb shell pidof com.azurpilot.ghio)

# 转发 WebUI
adb forward tcp:25548 tcp:25548
```

日誌位置：

| 檔案 | 內容 |
| --- | --- |
| `files/log/app.log` | 殼層全量（Timber） |
| `files/log/proot/session.log` | PRoot stdout/stderr 與 WebUI 訪問 |
| `debug/embedded_adb_launch.log` | 內置 ADB 啟動鏈 |

設備路徑：`/sdcard/Android/data/com.azurpilot.ghio/files/log/`。

## <DocIcon name="folder" /> 倉庫結構

```text
AzurPilot-for-Android/
├── app/
│   ├── app/                 # 主模块：Compose UI、proot、privileged、bridge
│   ├── adb-runtime/         # 内置 Shizuku-m 的 ADB 运行时
│   ├── download-core/       # OkHttp 下载器（分段、校验）
│   ├── build-logic/         # Gradle 约定插件（SDK、ABI、签名、R8）
│   ├── annotation-api/      # @PrefSchema
│   ├── ksp-processor/       # 设置访问器生成
│   ├── hidden-api/          # 编译期 hidden API 桩
│   ├── navigation-runtime/  # 导航动效
│   └── miuix-runtime/       # Miuix 外观适配
├── rootfs/                  # overlay、seeds、构建脚本、客户机测试
├── server/                  # device-report、remote-access 网关
├── tools/                   # 真机测试与基准脚本
├── doc/                     # 设计与协议文档
└── docs/screenshots/        # 官方截图
```

## <DocIcon name="shield" /> 硬約定

| 約定 | 原因 |
| --- | --- |
| 原生庫必須命名為 `lib*.so` 並放 `jniLibs` / `prootLibs` | targetSdk 35+ 唯一保證可 `execve` 的位置 |
| PRoot 會話必須保持 stdin 打開 | 關閉 stdin 是父處理程序死亡協議 |
| `GetLockedPixels` 與 `UnlockPixels` 嚴格配對 | 鎖定的幀指針在解鎖後失效 |
| 輸入操作碼與 JNI 註冊名不可隨意改 | 跨語言 ABI |
| 設定鍵 `camelToSnakeCase`，遷移用 snake_case | `@PrefSchema` 生成規則 |
| 新增文案先改 `values/`（zh-CN 源） | 其他語言從它派生 |
| 新依賴先定義介面/連接埠再在 DI 模組綁定 | 不讓 Compose/JNI 互相直連 |

## <DocIcon name="map" /> 說明文件地圖

| 說明文件 | 主題 |
| --- | --- |
| [宿主架構](/zh-TW/android/developer/architecture) | 分層、模組、處理程序邊界 |
| [Runtime 與 PRoot](/zh-TW/android/developer/runtime) | 會話、部署狀態機、熱更事務 |
| [特權服務與原生橋](/zh-TW/android/developer/privileged) | ADB/Root、AIDL、JNI、虛擬螢幕 |
| [OCR 與圖像鏈路](/zh-TW/android/developer/ocr) | `:ocr` 處理程序、NPU、共享記憶體 |
| [構建與發佈](/zh-TW/android/developer/build-release) | 版本、簽名、CI、發佈清單 |

倉庫內還有一份更細的 `doc/`：

```text
doc/architecture.md             分层与网关
doc/module-reference.md         按职责的源码地图
doc/privileged-bridge-protocol.md
doc/runtime-provisioning.md
doc/hot-update.md
doc/release-channel.md
doc/multi-arch.md
doc/ocr-acceleration.md
doc/development-guide.md
```

## <DocIcon name="flask" /> 修改後的最小驗證

| 範圍 | 不能省 |
| --- | --- |
| Kotlin / Koin / Compose | `compileDebugKotlin` |
| 原生橋 / CMake | `assembleDebug -Pazurpilot.slimApk=true` |
| rootfs Python | `unittest discover -s rootfs/tests` |
| 文案 | `check_i18n_strings.py` |
| 特權 / 懸浮窗 / 小組件 / 保活 | **真機全量回歸 + 逐張審查截圖** |

模擬器通過、編譯通過，都不能覆蓋 OEM 行為差異。
