---
title: Runtime 與 PRoot
description: rootfs 工件、PRoot 會話契約、部署狀態機、解壓縮流水線與事務式熱更新。
updated: 2026-10-20
---

# Runtime 與 PRoot

Runtime 是一個**不可變的 Ubuntu 24.04 根檔案系統**，按 ABI 構建與發佈。PRoot 負責在沒有 root 的情況下讓這個檔案系統跑起來。

## <DocIcon name="lightbulb" /> 為什麼用 PRoot

Android 不允許普通應用 `execve` 私有目錄裡的檔案，也不允許 `chroot`。PRoot 用 `ptrace` 攔截系統調用，把路徑重寫到一個用戶態根目錄，從而實現「看起來像 chroot」的環境。

關鍵約束：

- **可執行位置**：proot 九件套以 `lib*.so` 形式打進 APK 的 `jniLibs`，安裝後落在 `nativeLibraryDir`——targetSdk 35 下唯一保證可 `execve` 的位置。
- **loader 路徑**：`PROOT_LOADER` 指向 `nativeLibraryDir` 中的 loader，繞開私有目錄限制。
- **SELinux**：Android 的 `/dev` 缺 `/dev/shm`，且拒絕建立硬連結。PRoot 命令綁定應用私有共享記憶體目錄並啟用 `--link2symlink`，供 Python 事件、佇列與監督器使用。

## <DocIcon name="handshake" /> 會話契約

```text
App（父） ──stdin 管道──▶ proot wrapper ──▶ Runtime 进程组
```

- **stdin 必須保持打開**。App 處理程序退出導致 EOF 時，wrapper 自行殺掉處理程序組，避免孤兒鏈路。
- 取消 `ProotHost` 的守望協程**只停止等待**，必須繼續拋 `CancellationException`。不能把它當作處理程序退出並清空 `session`——停機仍需要這個句柄關閉 stdin、等待並回收。
- 崩潰退避重拉，啟動前清理殘留鎖。

::: danger 不要改成「後臺啟動」
`nohup` 式啟動會切斷父子關係，父處理程序死亡後 Runtime 繼續跑，下次啟動會爭搶同一份配置與資料庫。
:::

## <DocIcon name="settings" /> 部署狀態機

`ProvisionState`：

| 狀態 | 含義 |
| --- | --- |
| `Checking` | 檢查已裝版本 |
| `NotInstalled` | 未部署，等待用戶 |
| `NotBundled` | 輕量包且 Release 無本架構 |
| `LowDisk` | 剩餘 < 2 GB |
| `Downloading` | 下載中（壓縮字節） |
| `Extracting` | 解壓縮中（壓縮字節） |
| `Ready` | 就位 |
| `Failed` | 異常，`reason` 面向用戶 |

### 安裝判定

`isInstalled()` 同時滿足：

1. `.provisioned` 標記的版本與 rootfs 內 `opt/azurpilot/BUILD_MANIFEST` 一致；
2. `rootfs_arch` 與設備 ABI 匹配（舊包無此字段按 arm64）；
3. Python 入口存在。

在位時只提示更新，**不會自動替換**。

### 下載

- 清單 ≥ 8 MiB：先 `bytes=0-0` 探測，再四連接下載互不重疊區間。
- 每段校驗 HTTP 206、`Content-Range`、長度與版本標識；禁用響應壓縮。
- 分段失敗：取消全部、等待寫執行緒退出、進度歸零、單連接重試一次。
- 換源：100 ms 輪詢 `shouldAbort`，刪除半成品，按新源重下。
- 完成後先比大小，再比 SHA-256。

### 解壓縮

1. 解到 `rootfs.tmp`，成功後**原子改名**。
2. 純 Java 流式解（commons-compress tar + tukaani xz）。不用 busybox tar——ubuntu-base 的硬連結前向引用會解壞。
3. 符號連結用 `Os.symlink`；硬連結物化為副本，前向引用二次補齊。
4. 拒絕越界路徑與穿過已解符號連結的條目。
5. 按 tar mode 還原可執行位（proot 與 python 依賴）。
6. 保留 `config/`、`password.txt`、`log/`；模板與種子用新鏡像版本。
7. 寫 `.provisioned`，換名。

## <DocIcon name="clock" /> 首次啟動為什麼慢

解壓縮剝離 `__pycache__`，新 rootfs 首次啟動要重建全部字節碼。WebUI 可能超過 90 秒，`ProotHost` 會打：

```text
AzurPilot WebUI not ready within 90000ms
```

這是預期警告。第二次啟動恢復正常。

## <DocIcon name="clipboard" /> 構建清單

`BUILD_MANIFEST` 是 Runtime 的身份證：

| 字段 | 用途 |
| --- | --- |
| `azurpilot_commit` | 內置的上游原始碼版本 |
| `rootfs_version` | `<提交前12位>-<输入哈希前10位>` |
| `rootfs_arch` | 目標 ABI |
| `android_host_commit` | 構建時的本倉提交 |
| `node_version` | 內置工具鏈 |
| `hot_update_mode=local` | 支援設備端構建前端 |

`rootfs_version` 的哈希包含構建腳本、overlay、種子與工具鏈。哈希變 → 整包；哈希同、提交變 → 可熱更。

## <DocIcon name="refresh" /> 熱更新事務

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

失敗恢復：

- 切換前失敗：候選目錄丟棄，正式原始碼與 dist 不變。
- 切換中失敗：恢復舊原始碼、dist、清單。
- 處理程序中斷：`android_host.py` 在下次啟動 WebUI 前按日誌恢復；恢復失敗則保留日誌與備份並阻止啟動。

熱更與整包共用 App 側流水線鎖；忙時輪詢只讀本地進度，不反覆聯網。

::: warning 依賴安裝被關閉
這是刻意的：未經構建與 OCR 驗證的依賴環境不能進入正式版本。`uv.lock` 一變就必須整包。
:::

## <DocIcon name="folder" /> 覆蓋層與種子

| 目錄 | 作用 | 約束 |
| --- | --- | --- |
| `rootfs/overlays/` | 處理 Android / PRoot 兼容差異 | 不改用戶配置 |
| `rootfs/seeds/` | 首啟模板 | 只在首次部署寫入 |
| `rootfs/build/` | `build-azurpilot.sh` 等 | 必須在目標 ABI 的原生環境執行 |

覆蓋層裡已有 `android_process_compat.py` 等兼容邏輯，測試在 `rootfs/tests/`：

```bash
uv run --with psutil python -m unittest discover -s rootfs/tests
```

## <DocIcon name="zap" /> 空間與性能

| 項 | 量級 |
| --- | --- |
| rootfs 壓縮包 | 數百 MB |
| 解壓縮後 | 1.5–2.5 GB |
| 熱更候選目錄 | 額外數百 MB |
| 前端 `node_modules` | 數百 MB（構建後可清） |

設備前端構建會消耗 CPU、記憶體與網路；空間不足或構建失敗會保留舊版。
