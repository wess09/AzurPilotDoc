# AzurPilot 文档站

AzurPilot 三个仓库的统一文档门户：核心程序、Android 宿主、桌面启动器。

- 框架：VitePress 1.6.4 + Vue 3 + TypeScript
- 输出：纯静态站点（无服务端、无数据库、无 Worker）
- 语言：简体中文（English 尚未发布，见[版本索引](docs/reference/versions.md)）
- 页面：68 个内容页 + 404

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 构建到 docs/.vitepress/dist
npm run preview    # 预览构建产物
npm run check      # 链接 / 覆盖 / SEO 检查
npm run test:e2e   # Playwright 验收
npm run shots      # 46 张截图 + 112 个断点组合体检（自动拉起预览服务）
```

> 本项目在 Windows 上安装依赖时，若 esbuild 报 `winmm.dll not found`，确认使用 Node 22+ 且 `node_modules` 完整；本仓库在 `package.json` 中把 esbuild 固定为 `0.25.12`。

## 目录

```text
docs/
├── .vitepress/
│   ├── config.mts        # 导航、侧边栏、SEO、搜索（中文二元分词）
│   ├── data/             # 由源码生成的任务 / 接口 / 配置索引
│   └── theme/            # 主题、11 个组件、tokens、样式
├── guide/                # 开始使用（7）
├── azurpilot/            # 核心程序（1 + 7 用户 + 6 任务 + 9 开发）
├── android/              # Android（1 + 6 用户 + 6 开发）
├── launcher/             # 启动器（1 + 3 用户 + 5 开发）
├── api/                  # 接口（4）
├── reference/            # 查表（5）
├── troubleshooting/      # 排障（4）
└── contributing/         # 贡献（3）
```

设计与写作规范见 [DESIGN.md](DESIGN.md) 与 [AGENTS.md](AGENTS.md)。

## 数据生成

任务表、API 表与配置索引从源码快照生成，避免手抄：

```bash
python scripts/extract-tasks.py   ../_audit_src/AzurPilot <commit>
python scripts/extract-api.py     ../_audit_src/AzurPilot <commit>
python scripts/extract-config.py  ../_audit_src/AzurPilot <commit>
python scripts/gen-task-reference.py  ../_audit_src/AzurPilot
python scripts/gen-config-reference.py
```

生成结果保存在 `docs/.vitepress/data/`，随源码一起提交。

## 部署

构建产物是纯静态目录，可部署到任意静态托管：

```bash
npm run build
# 上传 docs/.vitepress/dist
```

- Cloudflare Pages：构建命令 `npm run build`，输出目录 `docs/.vitepress/dist`
- GitHub Pages：同样输出目录；若部署在子路径，需设置 `base`
- Nginx：`root /path/to/dist; try_files $uri $uri/ $uri.html =404;`
- 站点域名：构建时用 `DOCS_SITE_URL` 覆盖 canonical / sitemap 的 hostname
- 编辑链接分支：默认 `main`，仓库默认分支不同时用 `DOCS_EDIT_BRANCH` 覆盖

**未在未经确认的情况下部署到 `azurpilot.com` 或任何现有生产域名。**

## 审计与验收

| 文件 | 内容 |
| --- | --- |
| `docs-audit/source-inventory.md` | 三仓库审计范围 |
| `docs-audit/coverage-matrix.md` | 功能 → 源码 → 文档 → 验证 |
| `docs-audit/source-versions.json` | 版本记录 |
| `docs-audit/unresolved-items.md` | 待核实事项 |
| `docs-audit/validation-report.md` | 构建、浏览器、SEO 结果 |

## 许可

文档内容以 Apache-2.0 发布。引用的截图与 Logo 来自对应 GPL-3.0 / AGPL-3.0 仓库，版权归原项目。
