---
title: 构建、签名与发布
description: Android 宿主的版本规则、签名与 CI 密钥、构建矩阵、上游定时同步检查、发布清单与国内镜像分发。
updated: 2026-10-31
---

# 构建、签名与发布

Android 版的发布是「一套源码，多种产物」：按 ABI 的完整 APK、双 ABI 轻量 APK、按 ABI 的 Runtime 包，全部挂在同一个固定 Release 下。

## <DocIcon name="package" /> 构建产物

| 产物 | 构建参数 | 内容 |
| --- | --- | --- |
| 完整 APK（单 ABI） | `assembleRelease -Pazurpilot.releaseAbi=<abi>` | 内置对应 rootfs |
| 完整 APK（双 ABI） | `assembleRelease` | 省略 ABI 参数 |
| 轻量 APK | `assembleDebug/Release -Pazurpilot.slimApk=true` | 无 rootfs，双 ABI |
| Runtime | CI `rootfs.yml` | `rootfs-<abi>.tar.xz` + `BUILD_MANIFEST` |

```bash
cd app
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime
./gradlew assembleDebug -Pazurpilot.slimApk=true
./gradlew assembleRelease -Pazurpilot.releaseAbi=arm64-v8a
```

Release 开启 R8 混淆，`assembleRelease` 末尾自动跑 `verifyReleaseR8Keeps`，确认反射与 JNI 入口没被裁掉。

## <DocIcon name="medal" /> 版本规则

| 项 | 规则 |
| --- | --- |
| `versionCode` | 本仓 HEAD 提交时间戳；事故时可用 `APP_VERSION_CODE` 手钉 |
| `versionName` | `1.<series>.<X>`，`X = 提交计数 − 基线` |
| 基线 | 定义在 `GitVersion.kt`，CI 的 `resolve` 步使用同一公式 |

::: warning 两处必须同步
`GitVersion.kt` 的基线与 `.github/workflows/rootfs.yml` 的正则/公式必须一起改。只改一处会导致本地与 CI 版本号漂移。仓库文档中出现过不同基线的历史记录，**以当前 `GitVersion.kt` 为准**，不要照抄旧数字。
:::

CI 用 `git diff --quiet "$app_commit" HEAD -- app` 判断 Android 工程输入是否变化：

- 未变 → 沿用已发布 app 版本，可只发 Runtime。
- 变了 → `versionCode = max(旧值 + 1, HEAD 时间戳)`，`versionName` 按公式计算。

「app 版本没变」不等于「不需要重建 Runtime」——`rootfs` 与工作流变化同样会触发产物重建。

## <DocIcon name="key" /> 签名与 CI 密钥

| 场景 | 密钥 / Secret | 说明 |
| --- | --- | --- |
| Release APK 签名 | 仓库外 keystore（CI Secrets） | v1 + v2 + v3 全开 |
| Debug APK 签名 | 仓内固定 `debug.keystore` | 保证所有机器产出的 debug 包可互相覆盖 |
| 机型上报客户端证书 | `AZURPILOT_DEVICE_REPORT_CERT_BASE64` | 客户端 PEM 证书的 Base64，用于 HTTP 请求正文 RSA 验签 |
| 机型上报客户端私钥 | `AZURPILOT_DEVICE_REPORT_KEY_BASE64` | PKCS#8 PEM 私钥的 Base64，注入 APK assets |

APK 签名四项配置：`KEYSTORE_PATH` / `KEYSTORE_PASSWORD` / `KEY_ALIAS` / `KEY_PASSWORD`。环境变量优先，`app/local.properties` 兜底。没有 keystore 时 release 保持未签名，构建不失败，但产物装不上。

::: danger 签名不一致 = 只能卸载重装
`INSTALL_FAILED_UPDATE_INCOMPATIBLE` 意味着数据全丢。debug 与 release 互切前先导出配置。
:::

### 机型上报凭据注入与轮换

`rootfs.yml` 在构建阶段将两个上报 Secret 解码至受 Git 忽略的临时目录 `.tmp/report-credentials/`：

1. **有效性核验**：检查证书有效期以及公私钥匹配性，随后由 Gradle 生成 `assets/device-report/`。
2. **构建缓存安全**：CI 显式禁用凭据生成任务的输出缓存，防止私钥资产泄露至共享构建缓存；构建结束后立即清理临时文件与生成目录。
3. **打包验收**：CI 调用 `verify_device_report_assets.py` 验证所有最终 APK 压缩目录中包含可读的公开机型目录（约 502 KiB），且证书/私钥与 CI 输入完全一致。本地验证运行同一脚本时则强制要求 APK **不含**提交凭据。
4. **凭据同步轮换**：若需轮换上报私钥，**必须同时**更新 GitHub Actions Secrets 和腾讯云 Docker 服务端公开证书 `deploy/private/client-cert.pem`。
5. **服务器令牌隔离**：用于向 Issue #1 提交评论的 GitHub Token 仅保存在 Docker 生产服务器 `deploy/private/service.env`（权限 0600），绝对不进入任何 APK。

## <DocIcon name="cloud" /> CI 流水线与定时同步检查

Android 宿主由两条核心 GitHub Actions 工作流驱动：

### 1. 发布构建工作流（`rootfs.yml`）

推送 `main` 分支、打标签或手动 dispatch 触发：

| 阶段 | 内容 |
| --- | --- |
| `resolve` | 查询上游 AzurPilot dev HEAD 与当前已发布版本；比较输入差异，决定是否跳过构建 |
| `build` | 按 ABI 矩阵在原生 runner 构建 rootfs 镜像（`rootfs/build/build-azurpilot.sh`） |
| `apk` | 先执行 `fetch-proot-libs.sh`，再构建按架构完整包与通用轻量包，注入凭据并验收 |
| `publish` | 上传至固定 Release `azurpilot-android-latest`，原子更新 `latest.json` |

### 2. 上游同步检查（`check-upstream.yml`）

为及时跟进上游核心改动并保持计划工作流活跃，仓库配置了定时自动化检查：

- **避峰触发周期**：Cron 设定为 `17,47 * * * *`（每小时第 17 与 47 分钟运行），避开整点 GitHub Actions 排队高峰。
- **差异比对**：通过 `git ls-remote` 获取 `https://github.com/wess09/AzurPilot.git` 的 `refs/heads/dev` 最新提交，下载 `latest.json` 比对已发布的 `azurpilotCommit`。
- **活跃心跳记录**：若上游未发生变化，工作流更新 `.github/schedule-heartbeat.txt`（UTC 时间戳）与 `.github/azurpilot-upstream.txt`，以 `github-actions[bot]` 提交 `chore: check AzurPilot upstream <commit> [skip ci]`。该提交防止 GitHub 因仓库无活跃而自动停用定时工作流。
- **自动触发构建与镜像同步**：
  - 无论是否需要构建，均调度 `sync-cnb.yml` 保持国内 CNB 源码镜像同步（不触发冗余构建）。
  - 若检测到上游 `dev` 分支有新提交，自动向 `rootfs.yml` 派发构建事件（参数 `publish_update=true` 与最新 `azurpilot_ref`），实现全自动构建与发布。

### 本地复刻 release

1. 从成功的 CI run 下载 `rootfs-<abi>` 产物。
2. 把 `rootfs.tar.xz` 与 `BUILD_MANIFEST` 放进 `app/app/src/main/assets/rootfs/`。
3. 配好 `KEYSTORE_*`。
4. `cd app && ./gradlew assembleRelease -Pazurpilot.releaseAbi=arm64-v8a`。

## <DocIcon name="clipboard" /> 发布清单

固定 Release 的 `latest.json`：

| 字段 | 说明 |
| --- | --- |
| `versionCode` / `versionName` | App 更新 |
| `appCommit` | 上次真正构建 APK 的提交 |
| `azurpilotCommit` | Runtime 内的上游提交 |
| `androidHostCommit` | 构建 Runtime 的本仓提交 |
| `apkUrl` / `apkSha256` / `apkSize` | 通用轻量包 |
| `updateApks.<abi>` | 按架构轻量包 |
| `runtimes.<abi>` | 按架构 Runtime |
| `fullApks.<abi>` | 按架构完整 APK |
| `rootfs*` | 兼容字段，恒指向 arm64 |

兼容规则：旧版 App 只读扁平 `rootfs*` 字段，所以它们必须始终有效。新版按 ABI 选 `updateApks`，防止 MuMu 把通用包切成 ARM 转译。

## <DocIcon name="smartphone" /> 多架构

| ABI | 用途 | 说明 |
| --- | --- | --- |
| `arm64-v8a` | 真机 | 主目标 |
| `x86_64` | 模拟器 | proot 库需单独获取 |

不支持 32 位：Runtime 依赖 64 位 Linux 二进制。详见 `doc/multi-arch.md`。

## <DocIcon name="download" /> 镜像与下载源

- GitHub 与 CNB 都维护固定标签，大小与 SHA-256 一致。
- 新安装默认 `cnb`；已保存的选择不变。
- 内置五个 ghproxy 形态镜像，设置里也可填自定义前缀（非法输入回落直连）。
- 实测 `gh-proxy.net` 会返回挑战页，**不可用于下载**。

## <DocIcon name="settings" /> 构建配置（build profiles）

`doc/build-profiles.md` 描述了 PI 打包配方、身份覆盖与验证方式。带包名后缀的 profile 需要同步修改 `tools/watch-android-logs.ps1` 里的 `$package`。

## <DocIcon name="circle-check" /> 发布检查清单

- [ ] `GitVersion.kt` 与 CI 公式一致
- [ ] `Cargo.toml` / `tauri.conf.json` 不涉及（那是启动器）
- [ ] `CHANGELOG.md` 已更新
- [ ] rootfs 按 ABI 构建成功
- [ ] 完整包与轻量包都产出
- [ ] 签名验证通过（apksigner 分档）
- [ ] `latest.json` 字段完整、兼容字段指向 arm64
- [ ] 机型上报 Secrets（`AZURPILOT_DEVICE_REPORT_*`）已注入且经 `verify_device_report_assets.py` 校验
- [ ] 上报证书若轮换，服务端 `client-cert.pem` 已同步更新
- [ ] `check-upstream.yml` 定时心跳与 CNB 镜像分发正常
- [ ] 在至少一台 ARM64 真机与一台 x86_64 模拟器上安装验证（真机验证无法被静态分析替代）
- [ ] 热更接口返回符合预期（`enabled` / `requiresRuntimeUpdate`）
