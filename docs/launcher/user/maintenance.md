---
title: 更新、修复与卸载
description: 核心程序与启动器两条更新线的关系、环境损坏的修复方式、日志与缓存位置，以及迁移到新机器和完整卸载的步骤。
updated: 2026-10-20
---

# 更新、修复与卸载

启动器有两个独立版本：**启动器自身**和**核心程序**。搞清楚谁更新了谁，才能判断「为什么界面变了但功能没变」。

## <DocIcon name="refresh" /> 两条更新线

| | 核心程序 | 启动器 |
| --- | --- | --- |
| 更新方式 | 启动时 `git pull` + `uv sync --frozen` | 自更新（mTLS + 多镜像） |
| 频率 | 跟随 `master`，每天可能有提交 | 带版本号的 Release |
| 影响 | 游戏功能、WebUI、API | 外壳、启动流程、进程管理 |
| 回滚 | `git checkout <sha>` | 换回旧版压缩包 |

### 更新核心后会发生什么

1. 启动器下次启动时 `git pull` 拉到新代码。
2. `uv sync --frozen` 按新 `uv.lock` 调整依赖。
3. `gui.py` 的 `ensure_frontend()` 检查 `frontend/dist`，必要时重新构建（需要 Node.js）。
4. WebUI 刷新即生效；正在运行的实例会被停止并重启。

::: warning 前端构建需要 Node
Windows 上启动器会检测系统级 Node.js，缺失时可自动下载安装（SHA-256 校验）。Linux / macOS 需要自备 Node，否则核心更新后前端可能构建失败。
:::

### 更新启动器后会发生什么

- 启动器二进制被替换，`.venv`、`config/`、`log/` 保留。
- 新版本可能要求不同的 Python 版本或工具链，此时会重新自举 `.venv`（较慢，但配置不动）。
- 不会回退核心代码。

### 版本兼容

| 组合 | 结果 |
| --- | --- |
| 新启动器 + 旧核心 | 通常可用；若新启动器依赖核心的新接口，会提示更新 |
| 旧启动器 + 新核心 | 可能缺少新协议支持（如免密登录、进程回收标记） |
| 两者都旧 | 功能可用，但可能缺少修复 |

判断依据是仓库的 `CHANGELOG.md` 与发布说明，不要凭版本号大小猜。

## <DocIcon name="wrench" /> 修复环境

### 依赖损坏

症状：启动报 `ModuleNotFoundError`、`ImportError`，或 `uv sync` 失败。

```bash
# 在项目根目录
uv sync --frozen
```

如果仍失败：

```bash
# 删除虚拟环境后让启动器重建（会重新下载依赖）
rm -rf .venv          # Windows: rmdir /s /q .venv
```

::: danger 删 .venv 不会删配置
`.venv` 只装运行环境，`config/` 与日志在别处。但重建需要联网，耗时几分钟。
:::

### Git 仓库损坏

症状：更新失败、`fatal: not a git repository`、冲突。

```bash
git status
git stash            # 有本地修改时先暂存
git pull --rebase
```

不要用 `git reset --hard` 清理——会丢掉你改过的配置模板或本地补丁。

### 端口被占用

默认端口 `22267`。启动器会结束占用该端口的进程。若你同时运行了源码版实例（默认 `25548`），不会冲突；但两个启动器实例会。

### 缓存

| 目录 | 内容 | 能否删除 |
| --- | --- | --- |
| `cache/` | 运行时缓存、图片等 | 可以，会重新生成 |
| `frontend/node_modules` | 前端依赖 | 可以，构建时重装 |
| `frontend/dist` | 前端产物 | 可以，`gui.py` 会重建 |
| `log/` | 日志 | 可以，但排障前别删 |

### 日志

| 日志 | 位置 |
| --- | --- |
| 启动器 | `log/<日期>_launcher.txt` |
| 核心程序 | `log/<日期>_<实例>.txt` |
| 错误现场 | `log/error/<实例>/<时间戳>/` |

启动器日志记录了每个阶段的命令与退出码；核心日志记录任务边界与识别过程。提 Issue 时两个都要。

## <DocIcon name="laptop" /> 迁移到新机器

<Steps>
<Step title="旧机器停止实例">

先停调度，避免复制时配置还在写。

</Step>
<Step title="复制 config">

`config/` 整个目录，含 `deploy.yaml`。账号保险库绑定设备，换机后需要重新录入。

</Step>
<Step title="新机器安装并首次启动">

让启动器完成环境自举，然后关闭。

</Step>
<Step title="覆盖配置">

把旧 `config/` 覆盖进去，启动检查实例列表与任务开关。

</Step>
<Step title="重配设备相关项">

模拟器 Serial、ADB 路径、截图方案按新机器调整。

</Step>
</Steps>

## <DocIcon name="circle-off" /> 卸载

1. 退出启动器（托盘 → 退出），确认没有 `gui.py` 残留。
2. 备份 `config/` 与 `AzurPilot_Data_Backup/`。
3. 删除整个目录。
4. 如果设置过开机自启，在系统设置里移除对应项（启动器卸载时通常会自动清理）。

## <DocIcon name="circle-alert" /> 排障速查

| 现象 | 检查 |
| --- | --- |
| 启动画面卡在「下载 Python」 | 网络 / 镜像；换 `-cn` 版或改 `deploy.yaml` |
| 卡在「更新仓库」 | 代理、分支名、GitHub 可达性；`--skip-update` 试启动 |
| 卡在「同步依赖」 | PyPI 镜像；`uv.lock` 与代码是否同版本 |
| 打开窗口空白 | WebView2 / libwebkit2gtk |
| 提示端口被占用 | 另一个启动器实例或占用进程 |
| 关闭窗口后任务继续 | 正常：最小化到托盘 |
| 托盘退出后仍有 python | 进程回收异常，查启动器日志里的进程扫描记录 |
| 更新后 WebUI 打不开 | 前端构建失败，查 `frontend/dist` 与 Node |
| macOS 提示已损坏 | `xattr -dr com.apple.quarantine` |

更细的进程问题见[后端进程生命周期](/launcher/developer/backend-lifecycle)。
