---
title: Android 开发者入口
description: 从零构建 Android 宿主：需要的 JDK 与 NDK 版本、首次构建命令、自检与验证方式、Logcat 调试技巧，以及各模块在仓库中的位置。
updated: 2026-10-20
---

# Android 开发者入口

这个仓库是 **Android 宿主**，不是游戏逻辑。改宿主时你要同时考虑 Kotlin/Compose、JNI、PRoot 会话与 Runtime 镜像四层。

## <DocIcon name="laptop" /> 环境

| 工具 | 版本 / 说明 |
| --- | --- |
| Android Studio | 打开与调试 |
| JDK | 17（JVM target） |
| Android SDK | `compileSdk 37` / `targetSdk 36` / `minSdk 28` |
| NDK + CMake | 3.22.1，编译 `libbridge.so` |
| Git | **必须完整历史**，版本号取自提交计数，浅克隆会算错 |
| uv | 跑 Python 脚本与 rootfs 测试 |
| adb | 安装、日志、端口转发 |

Windows 注意：

- `python3` 可能是 Microsoft Store 的占位程序，先用 `python --version` 探测。
- Python `subprocess` 里的 `bash` 会落到 WSL，不是 Git Bash；Python 脚本用 `uv run`。
- shell 脚本在 Git Bash 运行，`tools/watch-android-logs.ps1` 在 PowerShell 运行。

## <DocIcon name="package" /> 首次构建

```bash
git clone https://github.com/wess09/AzurPilot-for-Android.git
cd AzurPilot-for-Android/app

# 只编译 Kotlin，跳过 rootfs 校验
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime

# 精简 debug 包（无 rootfs）
./gradlew assembleDebug -Pazurpilot.slimApk=true
```

产物在 `app/app/build/outputs/apk/debug/`。

### 为什么构建会失败

`verifyBundledAzurPilotRuntime` 会检查 `app/app/src/main/assets/rootfs/` 下的 `rootfs.tar.xz`（300 MB+）与 `BUILD_MANIFEST`。这两个是 CI 产物，不入库。本地缺失时所有 `package*` / `assemble*` 都会明确失败——这是为了避免打出没有运行时的残缺包。

两种解法：

- 从 CI 下载 `rootfs-<abi>` 产物，放进 `assets/rootfs/`。
- 用 `-Pazurpilot.slimApk=true` 跳过。

x86_64 的 proot 库同样不入库，需要时：

```bash
bash app/scripts/fetch-proot-libs.sh
```

只想编 arm64 时，在 `app/local.properties` 写 `build.debugAbi=arm64-v8a`。

## <DocIcon name="circle-check" /> 日常验证

| 改动 | 命令 |
| --- | --- |
| Kotlin / Compose / AIDL | `cd app && ./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime` |
| 原生桥 / CMake | `cd app && ./gradlew assembleDebug -Pazurpilot.slimApk=true` |
| rootfs 覆盖层 | `uv run --with psutil python -m unittest discover -s rootfs/tests` |
| 文案 | `python app/scripts/check_i18n_strings.py` |
| Shell / PowerShell 工具 | 先语法检查，再在授权设备上只读或受控执行 |

::: danger 不要运行 `:app:testDebugUnitTest`
测试源集里有孤儿测试，编译不过。Kotlin 的正确性用 `compileDebugKotlin` 验证。这是仓库明确写下的约定。
:::

## <DocIcon name="smartphone" /> 安装与调试

```bash
adb install -r -d app/app/build/outputs/apk/debug/app-debug.apk

# logcat
adb logcat -v time --pid=$(adb shell pidof com.azurpilot.ghio)

# 转发 WebUI
adb forward tcp:25548 tcp:25548
```

日志位置：

| 文件 | 内容 |
| --- | --- |
| `files/log/app.log` | 壳层全量（Timber） |
| `files/log/proot/session.log` | PRoot stdout/stderr 与 WebUI 访问 |
| `debug/embedded_adb_launch.log` | 内置 ADB 启动链 |

设备路径：`/sdcard/Android/data/com.azurpilot.ghio/files/log/`。

## <DocIcon name="folder" /> 仓库结构

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

## <DocIcon name="shield" /> 硬约定

| 约定 | 原因 |
| --- | --- |
| 原生库必须命名为 `lib*.so` 并放 `jniLibs` / `prootLibs` | targetSdk 35+ 唯一保证可 `execve` 的位置 |
| PRoot 会话必须保持 stdin 打开 | 关闭 stdin 是父进程死亡协议 |
| `GetLockedPixels` 与 `UnlockPixels` 严格配对 | 锁定的帧指针在解锁后失效 |
| 输入操作码与 JNI 注册名不可随意改 | 跨语言 ABI |
| 设置键 `camelToSnakeCase`，迁移用 snake_case | `@PrefSchema` 生成规则 |
| 新增文案先改 `values/`（zh-CN 源） | 其他语言从它派生 |
| 新依赖先定义接口/端口再在 DI 模块绑定 | 不让 Compose/JNI 互相直连 |

## <DocIcon name="map" /> 文档地图

| 文档 | 主题 |
| --- | --- |
| [宿主架构](/android/developer/architecture) | 分层、模块、进程边界 |
| [Runtime 与 PRoot](/android/developer/runtime) | 会话、部署状态机、热更事务 |
| [特权服务与原生桥](/android/developer/privileged) | ADB/Root、AIDL、JNI、虚拟屏 |
| [OCR 与图像链路](/android/developer/ocr) | `:ocr` 进程、NPU、共享内存 |
| [构建与发布](/android/developer/build-release) | 版本、签名、CI、发布清单 |

仓库内还有一份更细的 `doc/`：

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

## <DocIcon name="flask" /> 修改后的最小验证

| 范围 | 不能省 |
| --- | --- |
| Kotlin / Koin / Compose | `compileDebugKotlin` |
| 原生桥 / CMake | `assembleDebug -Pazurpilot.slimApk=true` |
| rootfs Python | `unittest discover -s rootfs/tests` |
| 文案 | `check_i18n_strings.py` |
| 特权 / 悬浮窗 / 小组件 / 保活 | **真机全量回归 + 逐张审查截图** |

模拟器通过、编译通过，都不能覆盖 OEM 行为差异。
