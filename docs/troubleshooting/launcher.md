---
title: 启动器故障排查
description: 环境自举失败、端口冲突、代理与镜像、macOS/Linux 依赖、进程残留的处理。
updated: 2026-10-20
---

# 启动器故障排查

启动器的报错分两类：**自举失败**（环境没搭好）和**运行时失败**（后端起来了但连不上）。错误页会给出阶段，先按阶段定位。

## <DocIcon name="rocket" /> 自举阶段

| 阶段 | 现象 | 原因 | 处理 |
| --- | --- | --- | --- |
| 创建 `.venv` | 卡住/权限错误 | 目录只读、路径含特殊字符 | 换到用户目录 |
| 下载 Python | 超时/校验失败 | 镜像不可用 | 换 `-cn` 版或网络 |
| 更新仓库 | `git` 失败 | 代理、分支不存在、磁盘满 | 查 `deploy.yaml`；`--skip-update` 试启动 |
| 同步依赖 | `uv sync` 失败 | PyPI 不可达、锁文件不匹配 | 换镜像；确认代码与 `uv.lock` 同版本 |
| 启动后端 | 立即退出 | 端口占用、Python 崩溃 | 看后端日志与端口 |
| 打开窗口 | 空白 | WebView 运行时缺失 | 装 WebView2 / webkit2gtk |

### 常用修复

```bash
# 跳过仓库更新启动
./alas-launcher --skip-update

# 重新同步依赖
uv sync --frozen

# 彻底重建环境（会重新下载）
rm -rf .venv
```

::: danger 删除 .venv 不会丢配置
配置在 `config/`，日志在 `log/`。但重建需要联网，耗时几分钟。
:::

## <DocIcon name="plug" /> 端口

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 提示端口被占用 | 另一个启动器/后端占用 22267 | 关掉旧进程 |
| 后端起不来但端口空闲 | 启动器与核心端口配置不一致 | 查 `deploy.yaml` 的 `WebuiPort` |
| 改了端口仍打不开 | WebView 仍指向旧地址 | 重启启动器 |

启动器启动前会清理占用端口的进程。如果你同时跑源码版（25548），两者不冲突。

## <DocIcon name="cloud" /> 网络与代理

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 更新仓库超时 | GitHub 不可达 | CN 版 / 配 `GitProxy` |
| Python 下载慢 | 默认源不通 | 换网络或手动配镜像 |
| 依赖安装 403 | 企业代理拦截 | 配 PyPI 镜像或代理白名单 |
| 后端连不上但浏览器能开 | 系统代理拦了回环 | 启动器已用 `--no-proxy-server`；检查全局代理软件 |

## <DocIcon name="laptop" /> macOS

| 现象 | 处理 |
| --- | --- |
| 「应用已损坏」 | `xattr -dr com.apple.quarantine /Applications/AzurPilot.app` |
| 打开后无窗口 | 看 Console.app 的崩溃日志；确认架构匹配 |
| 托盘图标不显示 | 菜单栏空间不足，移除其他图标 |

## <DocIcon name="wrench" /> Linux

| 现象 | 处理 |
| --- | --- |
| `libwebkit2gtk-4.1` 缺失 | `apt install libwebkit2gtk-4.1-0` |
| `GLIBC_2.xx not found` | 发行版太旧；用源码运行核心 |
| 托盘不显示 | 需要 AppIndicator 扩展 |
| 无沙箱权限 | 不要用 Flatpak/Snap 包裹，直接跑二进制 |

## <DocIcon name="monitor" /> Windows

| 现象 | 处理 |
| --- | --- |
| UAC 被拒 | 必须以管理员运行 |
| SmartScreen 拦截 | 更多信息 → 仍要运行 |
| 缺少 WebView2 | 安装 Evergreen Runtime |
| 杀软隔离 `git.exe` | 把 `.venv` 加入白名单 |
| 中文路径异常 | 换纯英文路径 |

## <DocIcon name="circle-alert" /> 进程残留

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 退出后仍有 `python.exe` | 回收异常 | 看启动器日志的进程扫描；重启系统 |
| 模拟器被一起关掉 | Job 继承 | 确认后端与启动器都支持 breakaway |
| 重复启动出现两个后端 | 单实例失效 | 关掉所有实例再启动 |

细节见[后端进程生命周期](/launcher/developer/backend-lifecycle)。

## <DocIcon name="scroll" /> 日志

```text
log/<日期>_launcher.txt
```

包含每个自举阶段的命令、退出码、耗时。定位不到时，把最后 100 行附到 Issue。

## <DocIcon name="refresh" /> 回滚

1. 下载上一版压缩包。
2. 覆盖可执行文件（保留 `.venv`、`config/`）。
3. 若新版改过 `.venv` 结构，删除 `.venv` 让它重建。

核心代码回滚与启动器无关：

```bash
git log --oneline -5
git checkout <sha>
uv sync --frozen
```
