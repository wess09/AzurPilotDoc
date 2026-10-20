---
title: 更新、备份与迁移
description: 核心程序、启动器与 Android 宿主的更新通道，配置备份位置、恢复方法与换机迁移步骤。
updated: 2026-10-20
---

# 更新、备份与迁移

三个组件的版本线互相独立。理解这一点，才能判断「点了更新之后到底更新了什么」。

## <DocIcon name="refresh" /> 谁在更新什么

| 组件 | 更新方式 | 更新内容 | 需要重启什么 |
| --- | --- | --- | --- |
| 核心程序 | WebUI 更新页（`updater.*`） | `git pull` 源码 + 依赖同步 | 停止并重启实例 worker |
| 启动器 | 启动器自更新（mTLS + 镜像） | 启动器二进制本身 | 启动器 |
| Android App | 系统安装器覆盖安装 | 宿主 Kotlin/C++ 代码 | App |
| Android Runtime | 宿主内 Runtime 更新 | rootfs 镜像（含核心源码与前端 dist） | Runtime |
| Android 核心脚本 | 热更新通道 | 上游源码 + 本地构建前端 | Runtime |

::: warning 更新前先备份
任何更新都可能引入不兼容的配置变更。更新前把 `config/` 整个目录复制一份，比事后回滚省事得多。
:::

## <DocIcon name="zap" /> 核心程序

WebUI 的「更新」页会列出上游提交、当前提交与差异。流程是：

1. <DocIcon name="search" /> 检查更新（`updater.status` / `updater.commits`）。
2. <DocIcon name="download" /> 拉取（`updater.fetch`）。
3. <DocIcon name="zap" /> 应用（`updater.apply`）：先停止所有 worker，再切换代码并同步依赖，最后按需重启。

更新页支持取消（`updater.cancel`）。如果你在容器里运行，也可以宿主机手动 `git pull` + `uv sync --frozen` 后重启容器。

### 更新后配置不兼容

配置由 `module/config/config_updater.py` 生成新模板，旧配置在加载时迁移。遇到字段缺失：

1. <DocIcon name="search" /> 对比 `config/<实例>.json` 与 `config/template.json`。
2. <DocIcon name="ban" /> 不要手改 `args.json`、`menu.json`、`config_generated.py`——它们是生成产物。
3. <DocIcon name="refresh" /> 迁移失败时用备份回滚，再单独排查是哪个任务组出错。

## <DocIcon name="rocket" /> 启动器

启动器启动时会先更新核心仓库（`git pull`，失败重试至多 20 次），然后 `uv sync --frozen`。启动器**自身**的更新走独立通道：

- <DocIcon name="cloud" /> 默认清单地址：`https://launcher-api.azurpilot.com/updata/stable.json`。
- <DocIcon name="file-pen" /> 可用 `LAUNCHER_UPDATE_URL` 覆盖，供测试或私有部署使用。
- <DocIcon name="lock" /> 载荷通过 mTLS 校验，并支持多镜像回退。

启动参数 `--skip-update` 可以跳过仓库更新，用于断网或排查「更新后启动失败」。

## <DocIcon name="smartphone" /> Android

Android 有三条独立通道，见[更新、备份与排障](/android/user/maintenance)。简要区分：

- <DocIcon name="smartphone" /> **只改宿主代码** → 下载轻量增量 APK 覆盖安装，Runtime 与配置保留。
- <DocIcon name="package" /> **改了 Runtime（依赖、Python 版本、前端构建方式）** → 更新 rootfs 镜像，停服务后替换，保留 `/config`。
- <DocIcon name="refresh" /> **只改上游脚本** → 热更新：比较 `uv.lock`，依赖未变则拉源码并在本地构建前端；失败自动回滚。

## <DocIcon name="drive" /> 备份

### 自动备份

核心程序默认开启每日备份（`Alas.Backup.Enable`，保留 7 天）。备份写入项目根目录：

```text
AzurPilot_Data_Backup/
└── 2026-10-20/
    ├── azurpilot.db
    ├── ap.json
    ├── ap-2.json
    └── backup_info.json
```

备份包含 SQLite 总库与全部实例配置。数据库通过 SQLite 备份接口导出，包含已提交的 WAL。

| 配置项 | 默认 | 说明 |
| --- | --- | --- |
| `Alas.Backup.Enable` | 开 | 每日首次进入调度循环时执行 |
| `Alas.Backup.KeepDays` | 7 | 超过天数的目录会被清理 |

### 手动备份什么

| 路径 | 内容 | 是否必须 |
| --- | --- | --- |
| `config/*.json` | 实例配置（含任务开关与下次运行时间） | 必须 |
| `config/deploy.yaml` | 后端监听、密码、语言 | 建议 |
| `config/remote-access.json` | 远程访问设备身份与配对摘要 | 需要保留固定入口时 |
| `azurpilot.db`（数据目录） | 统计、掉落、资源历史 | 需要历史数据时 |
| `log/` | 运行日志与错误现场 | 排障时 |
| `AzurPilot_Data_Backup/` | 自动备份 | 可选 |

::: danger 不要备份进 Git
`config/remote-access.json`、`config/deploy.yaml`、`password.txt` 含凭据。把它们提交到公开仓库等于公开你的实例入口。
:::

## <DocIcon name="laptop" /> 迁移到另一台机器

<Steps>
<Step title="在旧机器上停止调度">

先停止所有实例，避免迁移过程中配置还在被写入。

</Step>
<Step title="复制 config 目录">

连同 `deploy.yaml` 一起复制。新机器的路径可以不同，配置里不写绝对路径。

</Step>
<Step title="在新机器上安装">

装启动器或源码环境，先启动一次让 `.venv` 与依赖就绪，然后关闭。

</Step>
<Step title="覆盖配置并启动">

把 `config/` 覆盖进新项目根目录，启动 WebUI。检查实例列表是否完整、任务开关是否保留。

</Step>
<Step title="重新处理设备相关项">

模拟器 Serial、ADB 路径、截图方案可能需要按新机器调整。账号保险库绑定设备密钥，换机后需要重新解锁或录入。

</Step>
</Steps>

## <DocIcon name="refresh" /> 回滚

- <DocIcon name="refresh" /> **核心程序**：`git log` 找到上一个可用提交，`git checkout <sha>`，再 `uv sync --frozen`。不要用 `git reset --hard` 清掉本地修改。
- <DocIcon name="drive" /> **配置**：从 `AzurPilot_Data_Backup/<日期>/` 复制回 `config/`。
- <DocIcon name="smartphone" /> **Android Runtime**：宿主保留上一版 rootfs 目录，热更新失败会自动回滚；手动回滚见 Android 维护页。
- <DocIcon name="medal" /> **启动器**：重新下载上一版压缩包，覆盖可执行文件即可；`.venv` 与配置不受影响。
