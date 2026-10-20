---
title: 启动器开发者入口
description: Tauri 2 + Rust 项目的模块划分、构建命令、构建期环境变量与必须遵守的跨平台约定。
updated: 2026-10-20
---

# 启动器开发者入口

启动器没有前端目录：所有「页面」都是内嵌 HTML，通过自定义 URI 协议加载。改界面等于改 Rust 里嵌入的资源，不是改一个 React 项目。

## <DocIcon name="laptop" /> 环境

| 工具 | 版本 |
| --- | --- |
| Rust | stable（edition 2021） |
| Node.js | 仅用于 Tauri CLI（`cargo tauri`） |
| 系统依赖 | Windows：WebView2；Linux：`libwebkit2gtk-4.1`、`libgtk-3`；macOS：Xcode CLI |

```bash
cargo build              # debug
cargo build --release    # LTO + strip
cargo tauri dev          # 开发运行
cargo test               # 全部测试
cargo check              # 只检查编译
```

::: warning Windows 需要管理员终端
manifest 声明了 `requireAdministrator`。未提权时完整测试程序会以错误 740 启动失败，`cargo test` 也会受影响。
:::

## <DocIcon name="box" /> 模块

| 模块 | 职责 |
| --- | --- |
| `main.rs` | Tauri 入口：splash/主窗口、托盘、标题栏注入、错误页、命令注册、时间炸弹 |
| `setup.rs` | 环境自举：Python/uv/adb/git 安装、git 更新（重试 20 次）、`uv sync`、`deploy.yaml` 迁移 |
| `backend.rs` | `gui.py` 子进程生命周期、端口清理、环境标记兜底回收 |
| `backend_process.rs` | Windows Job Object 与 Unix 进程组 |
| `nodejs.rs` | **仅 Windows**：检测系统 Node，缺失时下载安装（SHA256 校验） |
| `notify.rs` | SSE 通知流（`/api/notify_stream`）与平台原生通知 |
| `launcher_control.rs` | 反向控制流（`/api/launcher/stream`）：后端下发的退出/重启/自启指令 |
| `autostart.rs` | 开机自启（Windows 写注册表 Run 键，带 `--start-minimized`） |
| `i18n.rs` | locale 检测：`--lang` > 系统 locale > `en` |
| `window_util.rs` | Windows `CREATE_NO_WINDOW`，子进程不弹控制台 |

## <DocIcon name="settings" /> 构建期环境变量

`build.rs` 在编译时读取：

| 变量 | 作用 | 缺省 |
| --- | --- | --- |
| `ALAS_BOOTSTRAP_UV` | 要内嵌的 uv 二进制 | 空占位符，运行时回退 PATH |
| `ALAS_LAUNCHER_MTLS_IDENTITY_PEM_B64` | 自更新 mTLS 客户端证书 | 读仓库根的 `证书.txt`（不入库） |
| `LAUNCHER_UPDATE_URL` | 覆盖自更新源 | `https://launcher-api.azurpilot.com/updata/stable.json` |

::: danger 不要把证书提交进仓库
`证书.txt` 与 base64 的 PEM 都是私密材料。CI 从 Secrets 注入，本地开发不要提交。
:::

## <DocIcon name="key" /> 关键常量

| 常量 | 值 |
| --- | --- |
| WebUI 端口 | `22267` |
| Python | `3.14.6` |
| 后端就绪等待 | 60 秒 |
| SSE 重连 | 3 秒 |
| Tauri identifier | `moe.taiho.alas-launcher` |
| 产品名 | `AzurPilot` |

时间炸弹配置在 `Cargo.toml` 的 `[package.metadata.alas-launcher.time-bomb]`，当前 `enabled = false`。

## <DocIcon name="shield" /> 约定

| 约定 | 说明 |
| --- | --- |
| i18n | 4 个 `locales/{zh-CN,zh-TW,ja,en}.yml`，`zh-CN.yml` 为基准；新增字符串要同时加 4 个文件 |
| 平台分支 | 进程/窗口/通知/路径必须考虑三平台，用 `#[cfg(target_os)]` |
| 子进程 | 一律套 `CreateNoWindow`（Windows），避免黑窗 |
| 日志 | 用 `tracing`，写入 `log/{date}_launcher.txt`，不要 `println!` |
| 版本号 | 发布需同步 `Cargo.toml`、`tauri.conf.json`、`CHANGELOG.md` |
| 部署配置 | 六个 `deploy.*.yaml` 是运行时配置，改安装逻辑要兼顾 `-cn` 变体 |

## <DocIcon name="flask" /> 测试

```bash
cargo check --locked --all-targets
cargo test --locked --all-targets
cargo test --locked backend_process::tests
```

`test.yml` 在 Linux、macOS、Windows x64/ARM64 上跑，不需要发布密钥。

## <DocIcon name="map" /> 文档地图

<ul class="ap-linklist">
<li><a href="/launcher/developer/architecture">Tauri 与 Rust 架构<span class="desc">窗口、协议、托盘</span></a></li>
<li><a href="/launcher/developer/backend-lifecycle">后端进程生命周期<span class="desc">Job Object 与回收</span></a></li>
<li><a href="/launcher/developer/update">更新链路与镜像<span class="desc">git、uv、mTLS</span></a></li>
<li><a href="/launcher/developer/build-release">构建与发布<span class="desc">三平台矩阵</span></a></li>
</ul>
