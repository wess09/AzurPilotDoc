---
title: 构建与发布
description: Launcher 3.0.6 与 0.0.0 版本机制、macOS/Linux/Windows 跨平台 CI 打包矩阵、单点前端构建复用、Inno Setup 安装器与 Release 归集发布链路。
updated: 2026-10-31
---

# 构建与发布

启动器仓库采用 **Tauri 2 + Rust** 架构，并由 GitHub Actions 实现跨平台持续集成与发布自动化。本文档详述版本管理机制（3.0.6 与 0.0.0）、跨平台打包流程、Inno Setup 安装器配置与 Release 发布流程。

## 版本基线机制：3.0.6 与 0.0.0

启动器仓库对版本号管理采用「源码模板占位 + 构建期动态注入」的方案：

1. **源码树统一基线为 `0.0.0`**：
   - 仓库内的 `Cargo.toml`（`version = "0.0.0"`）、`tauri.conf.json`（`"version": "0.0.0"`）以及 `Info.plist`（`CFBundleShortVersionString` 与 `CFBundleVersion` 为 `0.0.0`）统一设为基准占位符。
   - 这避免了在日常开发中因手动修改版本号导致跨文件漂移或 Git 提交冲突。
2. **CI 动态注入版本（`Resolve release version`）**：
   - 当推送 Git Tag（如 `3.0.6`、`3.0.5`）或通过 `workflow_dispatch` 手动输入版本时，CI 工作流自动解析规范的 SemVer（移除可能存在的前导 `v`）。
   - 工作流自动重写 `Cargo.toml`、`tauri.conf.json` 与 `Info.plist`，将目标版本写入配置文件。
   - 同时将版本注入环境变量 `RELEASE_VERSION`，并作为 `/DAppVersion` 参数传递给 Inno Setup 编译器。
3. **当前稳定版基线**：
   - 当前官方发布的稳定版本基线为 **3.0.6**（3.0.5 修复环境重建时的 deploy 引导脚本替换，3.0.6 恢复 Node.js 24 便携运行时自动下载安装与独立镜像源）。源码树中的 `0.0.0` 不影响发布版本的语义，开发者在阅读源码配置文件时应将其理解为 CI 驱动的动态版本占位。
4. **金丝雀构建版本规则**：
   - 当向 `main` 分支推送提交时，自动触发 Canary 构建。
   - 版本号规则为将 Cargo 基础版本的 patch 加 1，并追加金丝雀标识：`{major}.{minor}.{patch+1}-canary.{commit_hash}.{timestamp}`。这确保旧正式版用户能够按 SemVer 正常检测到更新。

## 本地编译与验证

在提交代码前，应在本地环境执行语法检查与自动化测试：

```bash
# 启动器 Rust 代码检查与测试
cargo check --locked --all-targets
cargo test --locked --all-targets

# 生产级发布编译（启用 LTO 与 strip）
cargo build --verbose --release
```

Windows 平台本地测试 Inno Setup 安装包编译：

```powershell
# 编译 x64 安装包
ISCC.exe install.iss /DTargetArch=x64 /DAppVersion=3.0.6

# 编译 ARM64 安装包
ISCC.exe install.iss /DTargetArch=arm64 /DAppVersion=3.0.6
```

## 跨平台 CI 打包工作流 (`package.yml`)

`.github/workflows/package.yml` 实现了 Linux、macOS、Windows x64 与 Windows ARM64 四大构建目标的全自动化打包：

### 1. 构建矩阵与单点前端构建优化

CI 针对打包耗时进行了单点构建优化：
- **单点独立构建前端**：在 `frontend-dist` job（基于 Ubuntu）中统一使用 Node 22 编译生成 `frontend/dist` 静态资源，构建一次并上传构件。
- **跨平台复用产物**：四个平台的打包任务直接下载复用预编译的 `frontend/dist`，彻底避免了在 Windows ARM64 等平台上重复执行缓慢的 npm 构建，大幅缩短 CI 总流水线时间。

```yaml
jobs:
  frontend-dist:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm --prefix frontend ci && npm --prefix frontend run build
  package:
    needs: frontend-dist
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-22.04, macos-latest, windows-latest, windows-11-arm]
```

- **Ubuntu 22.04**：安装 `libwebkit2gtk-4.1-dev`、`libappindicator3-dev`、`librsvg2-dev`、`patchelf` 以及 `rdfind`。
- **macOS**：通过 Homebrew 安装 `rdfind`。
- **Windows**：通过 Chocolatey 安装 `innosetup`（自动适配 Inno Setup 6 / 7 编译器）。
- **独立 Python 准备**：
  - 使用 `setup-uv` 安装最新版 uv 并暴露可执行文件路径。
  - 运行 `uv python install --install-dir .venv/python --no-bin --managed-python 3.14.3`。
  - 创建可重定位虚拟环境 `uv venv --allow-existing --relocatable --python ... .venv`。
  - 复制 uv 二进制至虚拟环境的 `bin/uv` 或 `Scripts/uv.exe`。

### 2. macOS 打包流程

macOS 作业构建出标准的 macOS 应用程序包（App Bundle）：

1. 组织 App 目录结构：
   - `AzurPilot.app/Contents/MacOS/AzurPilot`（二进制可执行文件）
   - `AzurPilot.app/Contents/Resources/icon.icns`（应用图标）
   - `AzurPilot.app/Contents/Info.plist`（动态注入版本后的属性表）
   - `AzurPilot.app/Contents/AzurPilot`（嵌入的完整后端源码、工具链与独立 Python 3.14.3 `.venv` 环境）
2. **硬链接去重**：执行 `rdfind -minsize 128 -makehardlinks true "AzurPilot.app"`，将 App 内部重复文件转换为硬链接，显著降低包体积。
3. **极限压缩归档**：使用 Python `tarfile` 配合 `lzma.PRESET_EXTREME`（preset 9）极限压缩，生成 `AzurPilot-macOS-$(uname -m).tar.xz`。

### 3. Linux 打包流程

Linux 作业构建出开箱即用的 Linux 归档包：

1. 组织工作区目录 `package-root/AzurPilot`，包含后端代码、`AzurPilot` 二进制与独立的 `.venv`（包含 Python 3.14.3 与 `bin/uv`）。
2. 执行 `rdfind` 硬链接去重优化。
3. 使用 Python `tarfile` 配合 `lzma.PRESET_EXTREME` 极限压缩，生成 `AzurPilot-Linux-$(uname -m).tar.xz`。

### 4. Windows 打包流程与 Inno Setup 脚本

Windows 作业支持 `x64`（兼容 x64 与 WoA）与 `arm64`（原生 ARM64）双架构：

1. 使用 `robocopy` 准备后端工作区，安装独立的 Python 3.14.3 `.venv`，复制 `AzurPilot.exe`。
2. 动态搜索系统中的 Inno Setup 编译器路径（支持 Inno Setup 6 / 7 以及 32/64 位安装路径）：
   ```powershell
   & $iscc install.iss "/DTargetArch=$installerArch" "/DAppVersion=$env:RELEASE_VERSION"
   ```
3. **Inno Setup 特性与保护机制 (`install.iss`)**：
   - **语言支持**：使用仓库内嵌的 `installer\ChineseSimplified.isl`，脱离对 Runner 主机系统是否预装中文语言包的依赖，保证编译始终成功。
   - **架构限制**：arm64 包限制 `ArchitecturesAllowed=arm64`；x64 包使用 `x64compatible`。
   - **目录权限**：默认安装至 `{autopf}\AzurPilot`，安装程序自动为 `{app}`、`{app}\.venv`、`{app}\log` 赋予普通用户修改权限（`Permissions: users-modify`），解决无管理员权限运行时的环境自举与日志写入问题。
   - **路径安全检测**：`NextButtonClick` 与 `PrepareToInstall` 阶段禁止安装到 Windows 目录、裸 Program Files 或磁盘根目录；选择容器目录时自动补齐子目录。
   - **运行前清理**：调用 `taskkill` 强制终止可能残留的启动器、`pythonw.exe` 和 `python.exe` 进程，防止安装中断。
   - **卸载交互保护**：卸载时弹出交互对话框，询问用户是否保留本地运行环境与配置数据。

## Release 归集与资产发布

打包步骤完成后，CI 执行资产归集：

1. 将生成的平台包放入 `release-assets/`：
   - `AzurPilot-macOS-*.tar.xz`
   - `AzurPilot-Linux-*.tar.xz`
   - `AzurPilot-Windows-x64-Setup.exe`
   - `AzurPilot-Windows-arm64-Setup.exe`
2. 上传至 GitHub Actions Artifacts。
3. 若触发事件为 Git Tag 推送，工作流自动通过 `action-gh-release` 将 `release-assets/*` 全部发布至 GitHub Release。

## 发布检查清单

- [ ] 验证 Git Tag 符合 SemVer 规范（如 `3.0.6`）。
- [ ] 确认工作流中 `Resolve release version` 成功替换各配置文件版本。
- [ ] 确认 `frontend-dist` 单点构建产物被 4 个平台打包任务成功复用。
- [ ] 检查 Linux / macOS / Windows x64 / Windows ARM64 四项作业均构建成功。
- [ ] 验证 Windows 安装程序具备 `installer\ChineseSimplified.isl` 语言支持与目录权限。
- [ ] 检查 macOS App Bundle 隔离属性移除后可正常启动。
- [ ] 确认发布的 Release 资产包含各平台压缩包与安装程序。

详见[Tauri 与 Rust 架构](/launcher/developer/architecture)与[更新链路与镜像](/launcher/developer/update)。
