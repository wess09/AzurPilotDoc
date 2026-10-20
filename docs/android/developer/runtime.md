---
title: Runtime 与 PRoot
description: rootfs 工件、PRoot 会话契约、部署状态机、解压流水线与事务式热更新。
updated: 2026-10-20
---

# Runtime 与 PRoot

Runtime 是一个**不可变的 Ubuntu 24.04 根文件系统**，按 ABI 构建与发布。PRoot 负责在没有 root 的情况下让这个文件系统跑起来。

## <DocIcon name="lightbulb" /> 为什么用 PRoot

Android 不允许普通应用 `execve` 私有目录里的文件，也不允许 `chroot`。PRoot 用 `ptrace` 拦截系统调用，把路径重写到一个用户态根目录，从而实现「看起来像 chroot」的环境。

关键约束：

- **可执行位置**：proot 九件套以 `lib*.so` 形式打进 APK 的 `jniLibs`，安装后落在 `nativeLibraryDir`——targetSdk 35 下唯一保证可 `execve` 的位置。
- **loader 路径**：`PROOT_LOADER` 指向 `nativeLibraryDir` 中的 loader，绕开私有目录限制。
- **SELinux**：Android 的 `/dev` 缺 `/dev/shm`，且拒绝创建硬链接。PRoot 命令绑定应用私有共享内存目录并启用 `--link2symlink`，供 Python 事件、队列与监督器使用。

## <DocIcon name="handshake" /> 会话契约

```text
App（父） ──stdin 管道──▶ proot wrapper ──▶ Runtime 进程组
```

- **stdin 必须保持打开**。App 进程退出导致 EOF 时，wrapper 自行杀掉进程组，避免孤儿链路。
- 取消 `ProotHost` 的守望协程**只停止等待**，必须继续抛 `CancellationException`。不能把它当作进程退出并清空 `session`——停机仍需要这个句柄关闭 stdin、等待并回收。
- 崩溃退避重拉，启动前清理残留锁。

::: danger 不要改成「后台启动」
`nohup` 式启动会切断父子关系，父进程死亡后 Runtime 继续跑，下次启动会争抢同一份配置与数据库。
:::

## <DocIcon name="settings" /> 部署状态机

`ProvisionState`：

| 状态 | 含义 |
| --- | --- |
| `Checking` | 检查已装版本 |
| `NotInstalled` | 未部署，等待用户 |
| `NotBundled` | 轻量包且 Release 无本架构 |
| `LowDisk` | 剩余 < 2 GB |
| `Downloading` | 下载中（压缩字节） |
| `Extracting` | 解压中（压缩字节） |
| `Ready` | 就位 |
| `Failed` | 异常，`reason` 面向用户 |

### 安装判定

`isInstalled()` 同时满足：

1. `.provisioned` 标记的版本与 rootfs 内 `opt/azurpilot/BUILD_MANIFEST` 一致；
2. `rootfs_arch` 与设备 ABI 匹配（旧包无此字段按 arm64）；
3. Python 入口存在。

在位时只提示更新，**不会自动替换**。

### 下载

- 清单 ≥ 8 MiB：先 `bytes=0-0` 探测，再四连接下载互不重叠区间。
- 每段校验 HTTP 206、`Content-Range`、长度与版本标识；禁用响应压缩。
- 分段失败：取消全部、等待写线程退出、进度归零、单连接重试一次。
- 换源：100 ms 轮询 `shouldAbort`，删除半成品，按新源重下。
- 完成后先比大小，再比 SHA-256。

### 解压

1. 解到 `rootfs.tmp`，成功后**原子改名**。
2. 纯 Java 流式解（commons-compress tar + tukaani xz）。不用 busybox tar——ubuntu-base 的硬链接前向引用会解坏。
3. 符号链接用 `Os.symlink`；硬链接物化为副本，前向引用二次补齐。
4. 拒绝越界路径与穿过已解符号链接的条目。
5. 按 tar mode 还原可执行位（proot 与 python 依赖）。
6. 保留 `config/`、`password.txt`、`log/`；模板与种子用新镜像版本。
7. 写 `.provisioned`，换名。

## <DocIcon name="clock" /> 首次启动为什么慢

解压剥离 `__pycache__`，新 rootfs 首次启动要重建全部字节码。WebUI 可能超过 90 秒，`ProotHost` 会打：

```text
AzurPilot WebUI not ready within 90000ms
```

这是预期警告。第二次启动恢复正常。

## <DocIcon name="clipboard" /> 构建清单

`BUILD_MANIFEST` 是 Runtime 的身份证：

| 字段 | 用途 |
| --- | --- |
| `azurpilot_commit` | 内置的上游源码版本 |
| `rootfs_version` | `<提交前12位>-<输入哈希前10位>` |
| `rootfs_arch` | 目标 ABI |
| `android_host_commit` | 构建时的本仓提交 |
| `node_version` | 内置工具链 |
| `hot_update_mode=local` | 支持设备端构建前端 |

`rootfs_version` 的哈希包含构建脚本、overlay、种子与工具链。哈希变 → 整包；哈希同、提交变 → 可热更。

## <DocIcon name="refresh" /> 热更新事务

```text
检查 /android/update/status
  → 浅拉目标提交到 /opt/azurpilot-update/source
    → 比较 uv.lock
       ├── 不同 → requiresRuntimeUpdate=true（结束）
       └── 相同 → npm ci && npm run build（600s）
            → 写事务日志 config/android-update-transaction.json
              → 停实例 → 备份 dist → 切换源码 → 装 dist → 更新清单
                → supervisor 重载并恢复实例
```

失败恢复：

- 切换前失败：候选目录丢弃，正式源码与 dist 不变。
- 切换中失败：恢复旧源码、dist、清单。
- 进程中断：`android_host.py` 在下次启动 WebUI 前按日志恢复；恢复失败则保留日志与备份并阻止启动。

热更与整包共用 App 侧流水线锁；忙时轮询只读本地进度，不反复联网。

::: warning 依赖安装被关闭
这是刻意的：未经构建与 OCR 验证的依赖环境不能进入正式版本。`uv.lock` 一变就必须整包。
:::

## <DocIcon name="folder" /> 覆盖层与种子

| 目录 | 作用 | 约束 |
| --- | --- | --- |
| `rootfs/overlays/` | 处理 Android / PRoot 兼容差异 | 不改用户配置 |
| `rootfs/seeds/` | 首启模板 | 只在首次部署写入 |
| `rootfs/build/` | `build-azurpilot.sh` 等 | 必须在目标 ABI 的原生环境执行 |

覆盖层里已有 `android_process_compat.py` 等兼容逻辑，测试在 `rootfs/tests/`：

```bash
uv run --with psutil python -m unittest discover -s rootfs/tests
```

## <DocIcon name="zap" /> 空间与性能

| 项 | 量级 |
| --- | --- |
| rootfs 压缩包 | 数百 MB |
| 解压后 | 1.5–2.5 GB |
| 热更候选目录 | 额外数百 MB |
| 前端 `node_modules` | 数百 MB（构建后可清） |

设备前端构建会消耗 CPU、内存与网络；空间不足或构建失败会保留旧版。
