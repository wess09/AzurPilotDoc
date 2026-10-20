import { defineConfig, type DefaultTheme } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import llmstxt from 'vitepress-plugin-llms'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * 把源 Markdown 原样拷进 dist（目录 index 折叠成 <dir>.md），
 * 供页面右上角「复制当前页 Markdown」直接抓取。
 */
function copySourceMarkdown(): Plugin {
  const entries: { from: string; to: string }[] = []
  const SKIP = new Set(['.vitepress', 'node_modules', 'public'])
  function walk(dir: string, base = ''): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP.has(entry.name)) continue
        walk(path.join(dir, entry.name), `${base}${entry.name}/`)
      } else if (entry.name.endsWith('.md')) {
        const rel = `${base}${entry.name}`
        const to = rel === 'index.md' ? 'index.md' : rel.replace(/(^|\/)index\.md$/, '$1.md')
        entries.push({ from: path.join(dir, entry.name), to })
      }
    }
  }
  walk(DOCS_ROOT)
  return {
    name: 'ap-copy-source-markdown',
    apply: 'build',
    generateBundle() {
      for (const { from, to } of entries) {
        this.emitFile({ type: 'asset', fileName: to, source: fs.readFileSync(from) })
      }
    },
  }
}


const SITE_URL = process.env.DOCS_SITE_URL || 'https://docs.azurpilot.com'
const REPO = 'https://github.com/wess09'
const SRC = {
  core: `${REPO}/AzurPilot`,
  android: `${REPO}/AzurPilot-for-Android`,
  launcher: `${REPO}/AzurPilotLauncher`,
}

/** 侧边栏：按板块组织，每个分组都对应真实存在的页面。 */
const sidebar: DefaultTheme.SidebarMulti = {
  '/guide/': [
    {
      text: '开始使用',
      items: [
        { text: '选择你的运行方式', link: '/guide/' },
        { text: 'AzurPilot 是什么', link: '/guide/what-is-azurpilot' },
        { text: '三个项目的关系', link: '/guide/ecosystem' },
        { text: '环境与兼容性', link: '/guide/requirements' },
        { text: '安装', link: '/guide/install' },
        { text: '第一次运行', link: '/guide/first-run' },
        { text: '更新、备份与迁移', link: '/guide/update-backup' },
      ],
    },
    {
      text: '继续阅读',
      items: [
        { text: '核心程序使用手册', link: '/azurpilot/' },
        { text: 'Android 使用手册', link: '/android/' },
        { text: '启动器使用手册', link: '/launcher/' },
      ],
    },
  ],
  '/azurpilot/': [
    {
      text: '核心程序',
      items: [
        { text: '概览', link: '/azurpilot/' },
        { text: 'WebUI 界面导览', link: '/azurpilot/user/webui' },
        { text: '连接模拟器与 ADB', link: '/azurpilot/user/device' },
        { text: '调度器与任务编排', link: '/azurpilot/user/scheduler' },
        { text: '多实例与配置管理', link: '/azurpilot/user/multi-instance' },
        { text: '远程访问与设备配对', link: '/azurpilot/user/remote-access' },
        { text: '通知、日志与统计', link: '/azurpilot/user/observability' },
      ],
    },
    {
      text: '任务手册',
      collapsed: false,
      items: [
        { text: '任务总览', link: '/azurpilot/user/tasks/' },
        { text: '出击与活动', link: '/azurpilot/user/tasks/campaign' },
        { text: '日常与资源', link: '/azurpilot/user/tasks/daily' },
        { text: '大型作战', link: '/azurpilot/user/tasks/opsi' },
        { text: '岛屿计划', link: '/azurpilot/user/tasks/island' },
        { text: '辅助工具任务', link: '/azurpilot/user/tasks/tools' },
      ],
    },
    {
      text: '开发者文档',
      collapsed: true,
      items: [
        { text: '开发者入口', link: '/azurpilot/developer/' },
        { text: '系统架构', link: '/azurpilot/developer/architecture' },
        { text: '调度器生命周期', link: '/azurpilot/developer/scheduler' },
        { text: '配置系统', link: '/azurpilot/developer/config' },
        { text: '设备、识别与战斗', link: '/azurpilot/developer/device-vision' },
        { text: 'WebUI 后端', link: '/azurpilot/developer/webui-backend' },
        { text: 'React 前端', link: '/azurpilot/developer/frontend' },
        { text: '新增一个任务', link: '/azurpilot/developer/module-dev' },
        { text: '测试与 CI', link: '/azurpilot/developer/testing-ci' },
      ],
    },
  ],
  '/android/': [
    {
      text: 'AzurPilot for Android',
      items: [
        { text: '概览', link: '/android/' },
        { text: '安装与架构选择', link: '/android/user/install' },
        { text: '首次启动与 Runtime', link: '/android/user/first-run' },
        { text: '权限激活（ADB / Root）', link: '/android/user/activation' },
        { text: '控制台、悬浮窗与屏保', link: '/android/user/console' },
        { text: '作为远程客户端', link: '/android/user/remote-client' },
        { text: '更新、备份与排障', link: '/android/user/maintenance' },
      ],
    },
    {
      text: '开发者文档',
      collapsed: true,
      items: [
        { text: '开发者入口', link: '/android/developer/' },
        { text: '宿主架构与模块', link: '/android/developer/architecture' },
        { text: 'Runtime 与 PRoot', link: '/android/developer/runtime' },
        { text: '特权服务与原生桥', link: '/android/developer/privileged' },
        { text: 'OCR 与图像链路', link: '/android/developer/ocr' },
        { text: '构建、签名与发布', link: '/android/developer/build-release' },
      ],
    },
  ],
  '/launcher/': [
    {
      text: 'AzurPilot Launcher',
      items: [
        { text: '概览', link: '/launcher/' },
        { text: '安装', link: '/launcher/user/install' },
        { text: '首次启动与环境初始化', link: '/launcher/user/first-run' },
        { text: '更新、修复与卸载', link: '/launcher/user/maintenance' },
      ],
    },
    {
      text: '开发者文档',
      collapsed: true,
      items: [
        { text: '开发者入口', link: '/launcher/developer/' },
        { text: 'Tauri 与 Rust 架构', link: '/launcher/developer/architecture' },
        { text: '后端进程生命周期', link: '/launcher/developer/backend-lifecycle' },
        { text: '更新链路与镜像', link: '/launcher/developer/update' },
        { text: '构建与发布', link: '/launcher/developer/build-release' },
      ],
    },
  ],
  '/api/': [
    {
      text: '接口参考',
      items: [
        { text: '接口总览', link: '/api/' },
        { text: 'WebSocket API v1', link: '/api/websocket' },
        { text: 'Android 薄接口', link: '/api/android' },
        { text: 'MCP 服务', link: '/api/mcp' },
      ],
    },
  ],
  '/reference/': [
    {
      text: '参考',
      items: [
        { text: '参考索引', link: '/reference/' },
        { text: '任务命令总表', link: '/reference/tasks' },
        { text: '配置参考', link: '/reference/config' },
        { text: '命令行、端口与环境变量', link: '/reference/cli' },
        { text: '源码版本索引', link: '/reference/versions' },
      ],
    },
  ],
  '/troubleshooting/': [
    {
      text: '故障排查',
      items: [
        { text: '排查方法', link: '/troubleshooting/' },
        { text: '核心程序', link: '/troubleshooting/azurpilot' },
        { text: 'Android', link: '/troubleshooting/android' },
        { text: '启动器', link: '/troubleshooting/launcher' },
      ],
    },
  ],
  '/contributing/': [
    {
      text: '参与贡献',
      items: [
        { text: '贡献指南', link: '/contributing/' },
        { text: '文档维护', link: '/contributing/docs' },
        { text: '发布与版本', link: '/contributing/release' },
      ],
    },
  ],
}

/** 香港繁體導航 */
const zhHkNav: DefaultTheme.NavItem[] = [
  { text: '開始使用', link: '/zh-HK/guide/', activeMatch: '^/zh-HK/guide/' },
  { text: '核心程序', link: '/zh-HK/azurpilot/', activeMatch: '^/zh-HK/azurpilot/' },
  { text: 'Android', link: '/zh-HK/android/', activeMatch: '^/zh-HK/android/' },
  { text: '啟動器', link: '/zh-HK/launcher/', activeMatch: '^/zh-HK/launcher/' },
  { text: '開發', link: '/zh-HK/azurpilot/developer/', activeMatch: '^/zh-HK/.*developer' },
  {
    text: '參考',
    activeMatch: '^/zh-HK/(api|reference|troubleshooting|contributing)/',
    items: [
      { text: '介面總覽', link: '/zh-HK/api/' },
      { text: 'WebSocket API', link: '/zh-HK/api/websocket' },
      { text: 'MCP 服務', link: '/zh-HK/api/mcp' },
      { text: '設定參考', link: '/zh-HK/reference/config' },
      { text: '任務命令總表', link: '/zh-HK/reference/tasks' },
      { text: '疑難排解', link: '/zh-HK/troubleshooting/' },
      { text: '參與貢獻', link: '/zh-HK/contributing/' },
    ],
  },
  { text: '官網', link: 'https://azurpilot.com/' },
]

/** 香港繁體側邊欄 */
const zhHkSidebar: DefaultTheme.SidebarMulti = {
  '/zh-HK/guide/': [
    {
      text: '開始使用',
      items: [
        { text: '選擇你的運行方式', link: '/zh-HK/guide/' },
        { text: 'AzurPilot 是什麼', link: '/zh-HK/guide/what-is-azurpilot' },
        { text: '三個項目的關係', link: '/zh-HK/guide/ecosystem' },
        { text: '環境與兼容性', link: '/zh-HK/guide/requirements' },
        { text: '安裝', link: '/zh-HK/guide/install' },
        { text: '第一次運行', link: '/zh-HK/guide/first-run' },
        { text: '更新、備份與遷移', link: '/zh-HK/guide/update-backup' },
      ],
    },
    {
      text: '繼續閲讀',
      items: [
        { text: '核心程序使用手冊', link: '/zh-HK/azurpilot/' },
        { text: 'Android 使用手冊', link: '/zh-HK/android/' },
        { text: '啟動器使用手冊', link: '/zh-HK/launcher/' },
      ],
    },
  ],
  '/zh-HK/azurpilot/': [
    {
      text: '核心程序',
      items: [
        { text: '概覽', link: '/zh-HK/azurpilot/' },
        { text: 'WebUI 介面導覽', link: '/zh-HK/azurpilot/user/webui' },
        { text: '連接模擬器與 ADB', link: '/zh-HK/azurpilot/user/device' },
        { text: '調度器與任務編排', link: '/zh-HK/azurpilot/user/scheduler' },
        { text: '多實例與配置管理', link: '/zh-HK/azurpilot/user/multi-instance' },
        { text: '遠程訪問與設備配對', link: '/zh-HK/azurpilot/user/remote-access' },
        { text: '通知、日誌與統計', link: '/zh-HK/azurpilot/user/observability' },
      ],
    },
    {
      text: '任務手冊',
      collapsed: false,
      items: [
        { text: '任務總覽', link: '/zh-HK/azurpilot/user/tasks/' },
        { text: '出擊與活動', link: '/zh-HK/azurpilot/user/tasks/campaign' },
        { text: '日常與資源', link: '/zh-HK/azurpilot/user/tasks/daily' },
        { text: '大型作戰', link: '/zh-HK/azurpilot/user/tasks/opsi' },
        { text: '島嶼計劃', link: '/zh-HK/azurpilot/user/tasks/island' },
        { text: '輔助工具任務', link: '/zh-HK/azurpilot/user/tasks/tools' },
      ],
    },
    {
      text: '開發者文檔',
      collapsed: true,
      items: [
        { text: '開發者入口', link: '/zh-HK/azurpilot/developer/' },
        { text: '系統架構', link: '/zh-HK/azurpilot/developer/architecture' },
        { text: '調度器生命週期', link: '/zh-HK/azurpilot/developer/scheduler' },
        { text: '配置系統', link: '/zh-HK/azurpilot/developer/config' },
        { text: '設備、識別與戰鬥', link: '/zh-HK/azurpilot/developer/device-vision' },
        { text: 'WebUI 後端', link: '/zh-HK/azurpilot/developer/webui-backend' },
        { text: 'React 前端', link: '/zh-HK/azurpilot/developer/frontend' },
        { text: '新增一個任務', link: '/zh-HK/azurpilot/developer/module-dev' },
        { text: '測試與 CI', link: '/zh-HK/azurpilot/developer/testing-ci' },
      ],
    },
  ],
  '/zh-HK/android/': [
    {
      text: 'AzurPilot for Android',
      items: [
        { text: '概覽', link: '/zh-HK/android/' },
        { text: '安裝與架構選擇', link: '/zh-HK/android/user/install' },
        { text: '首次啟動與 Runtime', link: '/zh-HK/android/user/first-run' },
        { text: '權限啟用（ADB / Root）', link: '/zh-HK/android/user/activation' },
        { text: '控制台、懸浮窗與熒幕保護', link: '/zh-HK/android/user/console' },
        { text: '作為遠程客戶端', link: '/zh-HK/android/user/remote-client' },
        { text: '更新、備份與疑難排解', link: '/zh-HK/android/user/maintenance' },
      ],
    },
    {
      text: '開發者文檔',
      collapsed: true,
      items: [
        { text: '開發者入口', link: '/zh-HK/android/developer/' },
        { text: '宿主架構與模組', link: '/zh-HK/android/developer/architecture' },
        { text: 'Runtime 與 PRoot', link: '/zh-HK/android/developer/runtime' },
        { text: '特權服務與原生橋', link: '/zh-HK/android/developer/privileged' },
        { text: 'OCR 與圖像鏈路', link: '/zh-HK/android/developer/ocr' },
        { text: '構建、簽名與發佈', link: '/zh-HK/android/developer/build-release' },
      ],
    },
  ],
  '/zh-HK/launcher/': [
    {
      text: 'AzurPilot Launcher',
      items: [
        { text: '概覽', link: '/zh-HK/launcher/' },
        { text: '安裝', link: '/zh-HK/launcher/user/install' },
        { text: '首次啟動與環境初始化', link: '/zh-HK/launcher/user/first-run' },
        { text: '更新、修復與移除', link: '/zh-HK/launcher/user/maintenance' },
      ],
    },
    {
      text: '開發者文檔',
      collapsed: true,
      items: [
        { text: '開發者入口', link: '/zh-HK/launcher/developer/' },
        { text: 'Tauri 與 Rust 架構', link: '/zh-HK/launcher/developer/architecture' },
        { text: '後端進程生命週期', link: '/zh-HK/launcher/developer/backend-lifecycle' },
        { text: '更新鏈路與鏡像', link: '/zh-HK/launcher/developer/update' },
        { text: '構建與發佈', link: '/zh-HK/launcher/developer/build-release' },
      ],
    },
  ],
  '/zh-HK/api/': [
    {
      text: '介面參考',
      items: [
        { text: '介面總覽', link: '/zh-HK/api/' },
        { text: 'WebSocket API v1', link: '/zh-HK/api/websocket' },
        { text: 'Android 薄介面', link: '/zh-HK/api/android' },
        { text: 'MCP 服務', link: '/zh-HK/api/mcp' },
      ],
    },
  ],
  '/zh-HK/reference/': [
    {
      text: '參考',
      items: [
        { text: '參考索引', link: '/zh-HK/reference/' },
        { text: '任務命令總表', link: '/zh-HK/reference/tasks' },
        { text: '配置參考', link: '/zh-HK/reference/config' },
        { text: '命令行、連接埠與環境變數', link: '/zh-HK/reference/cli' },
        { text: '源碼版本索引', link: '/zh-HK/reference/versions' },
      ],
    },
  ],
  '/zh-HK/troubleshooting/': [
    {
      text: '疑難排解',
      items: [
        { text: '疑難排解方法', link: '/zh-HK/troubleshooting/' },
        { text: '核心程序', link: '/zh-HK/troubleshooting/azurpilot' },
        { text: 'Android', link: '/zh-HK/troubleshooting/android' },
        { text: '啟動器', link: '/zh-HK/troubleshooting/launcher' },
      ],
    },
  ],
  '/zh-HK/contributing/': [
    {
      text: '參與貢獻',
      items: [
        { text: '貢獻指南', link: '/zh-HK/contributing/' },
        { text: '文檔維護', link: '/zh-HK/contributing/docs' },
        { text: '發佈與版本', link: '/zh-HK/contributing/release' },
      ],
    },
  ],
}



/** 繁體中文導覽列 */
const twNav: DefaultTheme.NavItem[] = [
  { text: '開始使用', link: '/zh-TW/guide/', activeMatch: '^/zh-TW/guide/' },
  { text: '核心程式', link: '/zh-TW/azurpilot/', activeMatch: '^/zh-TW/azurpilot/' },
  { text: 'Android', link: '/zh-TW/android/', activeMatch: '^/zh-TW/android/' },
  { text: '啟動器', link: '/zh-TW/launcher/', activeMatch: '^/zh-TW/launcher/' },
  { text: '開發', link: '/zh-TW/azurpilot/developer/', activeMatch: '^/zh-TW/.*developer/' },
  {
    text: '參考',
    activeMatch: '^/zh-TW/(api|reference|troubleshooting|contributing)/',
    items: [
      { text: '介面總覽', link: '/zh-TW/api/' },
      { text: 'WebSocket API', link: '/zh-TW/api/websocket' },
      { text: 'MCP 服務', link: '/zh-TW/api/mcp' },
      { text: '設定參考', link: '/zh-TW/reference/config' },
      { text: '任務命令總表', link: '/zh-TW/reference/tasks' },
      { text: '疑難排解', link: '/zh-TW/troubleshooting/' },
      { text: '參與貢獻', link: '/zh-TW/contributing/' },
    ],
  },
  { text: '官網', link: 'https://azurpilot.com/' },
]

/** 繁體中文側邊欄：全68頁一一對應 */
const twSidebar: DefaultTheme.SidebarMulti = {
  '/zh-TW/guide/': [
    {
      text: '開始使用',
      items: [
        { text: '選擇你的執行方式', link: '/zh-TW/guide/' },
        { text: 'AzurPilot 是什麼', link: '/zh-TW/guide/what-is-azurpilot' },
        { text: '三個專案的關係', link: '/zh-TW/guide/ecosystem' },
        { text: '環境與相容性', link: '/zh-TW/guide/requirements' },
        { text: '安裝', link: '/zh-TW/guide/install' },
        { text: '第一次執行', link: '/zh-TW/guide/first-run' },
        { text: '更新、備份與遷移', link: '/zh-TW/guide/update-backup' },
      ],
    },
    {
      text: '繼續閱讀',
      items: [
        { text: '核心程式使用手冊', link: '/zh-TW/azurpilot/' },
        { text: 'Android 使用手冊', link: '/zh-TW/android/' },
        { text: '啟動器使用手冊', link: '/zh-TW/launcher/' },
      ],
    },
  ],
  '/zh-TW/azurpilot/': [
    {
      text: '核心程式',
      items: [
        { text: '概覽', link: '/zh-TW/azurpilot/' },
        { text: 'WebUI 介面導覽', link: '/zh-TW/azurpilot/user/webui' },
        { text: '連接模擬器與 ADB', link: '/zh-TW/azurpilot/user/device' },
        { text: '排程器與任務編排', link: '/zh-TW/azurpilot/user/scheduler' },
        { text: '多實例與設定管理', link: '/zh-TW/azurpilot/user/multi-instance' },
        { text: '遠端存取與裝置配對', link: '/zh-TW/azurpilot/user/remote-access' },
        { text: '通知、日誌與統計', link: '/zh-TW/azurpilot/user/observability' },
      ],
    },
    {
      text: '任務手冊',
      collapsed: false,
      items: [
        { text: '任務總覽', link: '/zh-TW/azurpilot/user/tasks/' },
        { text: '出擊與活動', link: '/zh-TW/azurpilot/user/tasks/campaign' },
        { text: '日常與資源', link: '/zh-TW/azurpilot/user/tasks/daily' },
        { text: '大型作戰', link: '/zh-TW/azurpilot/user/tasks/opsi' },
        { text: '島嶼計畫', link: '/zh-TW/azurpilot/user/tasks/island' },
        { text: '輔助工具任務', link: '/zh-TW/azurpilot/user/tasks/tools' },
      ],
    },
    {
      text: '開發者說明文件',
      collapsed: true,
      items: [
        { text: '開發者入口', link: '/zh-TW/azurpilot/developer/' },
        { text: '系統架構', link: '/zh-TW/azurpilot/developer/architecture' },
        { text: '排程器生命週期', link: '/zh-TW/azurpilot/developer/scheduler' },
        { text: '設定系統', link: '/zh-TW/azurpilot/developer/config' },
        { text: '裝置、辨識與戰鬥', link: '/zh-TW/azurpilot/developer/device-vision' },
        { text: 'WebUI 後端', link: '/zh-TW/azurpilot/developer/webui-backend' },
        { text: 'React 前端', link: '/zh-TW/azurpilot/developer/frontend' },
        { text: '新增一個任務', link: '/zh-TW/azurpilot/developer/module-dev' },
        { text: '測試與 CI', link: '/zh-TW/azurpilot/developer/testing-ci' },
      ],
    },
  ],
  '/zh-TW/android/': [
    {
      text: 'AzurPilot for Android',
      items: [
        { text: '概覽', link: '/zh-TW/android/' },
        { text: '安裝與架構選擇', link: '/zh-TW/android/user/install' },
        { text: '首次啟動與 Runtime', link: '/zh-TW/android/user/first-run' },
        { text: '權限啟用（ADB / Root）', link: '/zh-TW/android/user/activation' },
        { text: '主控台、懸浮視窗與螢幕保護程式', link: '/zh-TW/android/user/console' },
        { text: '作為遠端客戶端', link: '/zh-TW/android/user/remote-client' },
        { text: '更新、備份與排障', link: '/zh-TW/android/user/maintenance' },
      ],
    },
    {
      text: '開發者說明文件',
      collapsed: true,
      items: [
        { text: '開發者入口', link: '/zh-TW/android/developer/' },
        { text: '宿主架構與模組', link: '/zh-TW/android/developer/architecture' },
        { text: 'Runtime 與 PRoot', link: '/zh-TW/android/developer/runtime' },
        { text: '特權服務與原生橋', link: '/zh-TW/android/developer/privileged' },
        { text: 'OCR 與圖像鏈路', link: '/zh-TW/android/developer/ocr' },
        { text: '建置、簽署與發布', link: '/zh-TW/android/developer/build-release' },
      ],
    },
  ],
  '/zh-TW/launcher/': [
    {
      text: 'AzurPilot Launcher',
      items: [
        { text: '概覽', link: '/zh-TW/launcher/' },
        { text: '安裝', link: '/zh-TW/launcher/user/install' },
        { text: '首次啟動與環境初始化', link: '/zh-TW/launcher/user/first-run' },
        { text: '更新、修復與解除安裝', link: '/zh-TW/launcher/user/maintenance' },
      ],
    },
    {
      text: '開發者說明文件',
      collapsed: true,
      items: [
        { text: '開發者入口', link: '/zh-TW/launcher/developer/' },
        { text: 'Tauri 與 Rust 架構', link: '/zh-TW/launcher/developer/architecture' },
        { text: '後端處理程序生命週期', link: '/zh-TW/launcher/developer/backend-lifecycle' },
        { text: '更新鏈路與鏡像', link: '/zh-TW/launcher/developer/update' },
        { text: '建置與發布', link: '/zh-TW/launcher/developer/build-release' },
      ],
    },
  ],
  '/zh-TW/api/': [
    {
      text: '介面參考',
      items: [
        { text: '介面總覽', link: '/zh-TW/api/' },
        { text: 'WebSocket API v1', link: '/zh-TW/api/websocket' },
        { text: 'Android 薄介面', link: '/zh-TW/api/android' },
        { text: 'MCP 服務', link: '/zh-TW/api/mcp' },
      ],
    },
  ],
  '/zh-TW/reference/': [
    {
      text: '參考',
      items: [
        { text: '參考索引', link: '/zh-TW/reference/' },
        { text: '任務命令總表', link: '/zh-TW/reference/tasks' },
        { text: '設定參考', link: '/zh-TW/reference/config' },
        { text: '命令列、連接埠與環境變數', link: '/zh-TW/reference/cli' },
        { text: '原始碼版本索引', link: '/zh-TW/reference/versions' },
      ],
    },
  ],
  '/zh-TW/troubleshooting/': [
    {
      text: '疑難排解',
      items: [
        { text: '疑難排解方法', link: '/zh-TW/troubleshooting/' },
        { text: '核心程式', link: '/zh-TW/troubleshooting/azurpilot' },
        { text: 'Android', link: '/zh-TW/troubleshooting/android' },
        { text: '啟動器', link: '/zh-TW/troubleshooting/launcher' },
      ],
    },
  ],
  '/zh-TW/contributing/': [
    {
      text: '參與貢獻',
      items: [
        { text: '貢獻指南', link: '/zh-TW/contributing/' },
        { text: '說明文件維護', link: '/zh-TW/contributing/docs' },
        { text: '發布與版本', link: '/zh-TW/contributing/release' },
      ],
    },
  ],
}

/** 日本語ナビゲーション */
const jaNav: DefaultTheme.NavItem[] = [
  { text: 'ガイド', link: '/ja/guide/', activeMatch: '^/ja/guide/' },
  { text: 'コアプログラム', link: '/ja/azurpilot/', activeMatch: '^/ja/azurpilot/' },
  { text: 'Android', link: '/ja/android/', activeMatch: '^/ja/android/' },
  { text: 'ランチャー', link: '/ja/launcher/', activeMatch: '^/ja/launcher/' },
  { text: '開発', link: '/ja/azurpilot/developer/', activeMatch: '^/ja/azurpilot/developer/' },
  {
    text: 'リファレンス',
    activeMatch: '^/ja/(api|reference|troubleshooting|contributing)/',
    items: [
      { text: 'API 概要', link: '/ja/api/' },
      { text: 'WebSocket API', link: '/ja/api/websocket' },
      { text: 'MCP サービス', link: '/ja/api/mcp' },
      { text: '設定リファレンス', link: '/ja/reference/config' },
      { text: 'タスクコマンド一覧', link: '/ja/reference/tasks' },
      { text: 'トラブルシューティング', link: '/ja/troubleshooting/' },
      { text: '貢献ガイド', link: '/ja/contributing/' },
    ],
  },
  { text: '公式サイト', link: 'https://azurpilot.com/' },
]

/** 日本語サイドバー：全68ページに対応 */
const jaSidebar: DefaultTheme.SidebarMulti = {
  '/ja/guide/': [
    {
      text: '利用ガイド',
      items: [
        { text: '実行方式の選択', link: '/ja/guide/' },
        { text: 'AzurPilot とは', link: '/ja/guide/what-is-azurpilot' },
        { text: '3つのプロジェクトの関係', link: '/ja/guide/ecosystem' },
        { text: '動作環境と互換性', link: '/ja/guide/requirements' },
        { text: 'インストール', link: '/ja/guide/install' },
        { text: '初回実行', link: '/ja/guide/first-run' },
        { text: '更新・バックアップ・移行', link: '/ja/guide/update-backup' },
      ],
    },
    {
      text: '関連マニュアル',
      items: [
        { text: 'コアプログラムマニュアル', link: '/ja/azurpilot/' },
        { text: 'Android 利用マニュアル', link: '/ja/android/' },
        { text: 'ランチャー利用マニュアル', link: '/ja/launcher/' },
      ],
    },
  ],
  '/ja/azurpilot/': [
    {
      text: 'コアプログラム',
      items: [
        { text: '概要', link: '/ja/azurpilot/' },
        { text: 'WebUI ガイド', link: '/ja/azurpilot/user/webui' },
        { text: 'エミュレーターと ADB の接続', link: '/ja/azurpilot/user/device' },
        { text: 'スケジューラーとタスク編成', link: '/ja/azurpilot/user/scheduler' },
        { text: 'マルチインスタンスと設定管理', link: '/ja/azurpilot/user/multi-instance' },
        { text: 'リモートアクセスとデバイスペアリング', link: '/ja/azurpilot/user/remote-access' },
        { text: '通知・ログ・統計', link: '/ja/azurpilot/user/observability' },
      ],
    },
    {
      text: 'タスクマニュアル',
      collapsed: false,
      items: [
        { text: 'タスク一覧', link: '/ja/azurpilot/user/tasks/' },
        { text: '出撃とイベント', link: '/ja/azurpilot/user/tasks/campaign' },
        { text: 'デイリーとリソース', link: '/ja/azurpilot/user/tasks/daily' },
        { text: 'セイレーン作戦（大世界）', link: '/ja/azurpilot/user/tasks/opsi' },
        { text: '島開発計画', link: '/ja/azurpilot/user/tasks/island' },
        { text: 'ユーティリティタスク', link: '/ja/azurpilot/user/tasks/tools' },
      ],
    },
    {
      text: '開発者ドキュメント',
      collapsed: true,
      items: [
        { text: '開発者ポータル', link: '/ja/azurpilot/developer/' },
        { text: 'システムアーキテクチャ', link: '/ja/azurpilot/developer/architecture' },
        { text: 'スケジューラーのライフサイクル', link: '/ja/azurpilot/developer/scheduler' },
        { text: '設定システム', link: '/ja/azurpilot/developer/config' },
        { text: 'デバイス・認識・戦闘', link: '/ja/azurpilot/developer/device-vision' },
        { text: 'WebUI バックエンド', link: '/ja/azurpilot/developer/webui-backend' },
        { text: 'React フロントエンド', link: '/ja/azurpilot/developer/frontend' },
        { text: '新規タスクの追加', link: '/ja/azurpilot/developer/module-dev' },
        { text: 'テストと CI', link: '/ja/azurpilot/developer/testing-ci' },
      ],
    },
  ],
  '/ja/android/': [
    {
      text: 'AzurPilot for Android',
      items: [
        { text: '概要', link: '/ja/android/' },
        { text: 'インストールとアーキテクチャ選択', link: '/ja/android/user/install' },
        { text: '初回起動と Runtime', link: '/ja/android/user/first-run' },
        { text: '権限のアクティベーション（ADB / Root）', link: '/ja/android/user/activation' },
        { text: 'コンソール・フローティング・スクリーンセーバー', link: '/ja/android/user/console' },
        { text: 'リモートクライアントとしての利用', link: '/ja/android/user/remote-client' },
        { text: '更新・バックアップ・トラブルシューティング', link: '/ja/android/user/maintenance' },
      ],
    },
    {
      text: '開発者ドキュメント',
      collapsed: true,
      items: [
        { text: '開発者ポータル', link: '/ja/android/developer/' },
        { text: 'ホストアーキテクチャとモジュール', link: '/ja/android/developer/architecture' },
        { text: 'Runtime と PRoot', link: '/ja/android/developer/runtime' },
        { text: '特権サービスとネイティブブリッジ', link: '/ja/android/developer/privileged' },
        { text: 'OCR と画像認識パイプライン', link: '/ja/android/developer/ocr' },
        { text: 'ビルド・署名・リリース', link: '/ja/android/developer/build-release' },
      ],
    },
  ],
  '/ja/launcher/': [
    {
      text: 'AzurPilot Launcher',
      items: [
        { text: '概要', link: '/ja/launcher/' },
        { text: 'インストール', link: '/ja/launcher/user/install' },
        { text: '初回起動と環境初期化', link: '/ja/launcher/user/first-run' },
        { text: '更新・修復・アンインストール', link: '/ja/launcher/user/maintenance' },
      ],
    },
    {
      text: '開発者ドキュメント',
      collapsed: true,
      items: [
        { text: '開発者ポータル', link: '/ja/launcher/developer/' },
        { text: 'Tauri と Rust アーキテクチャ', link: '/ja/launcher/developer/architecture' },
        { text: 'バックエンドプロセスのライフサイクル', link: '/ja/launcher/developer/backend-lifecycle' },
        { text: '更新パイプラインとミラー', link: '/ja/launcher/developer/update' },
        { text: 'ビルドとリリース', link: '/ja/launcher/developer/build-release' },
      ],
    },
  ],
  '/ja/api/': [
    {
      text: 'API リファレンス',
      items: [
        { text: 'API 概要', link: '/ja/api/' },
        { text: 'WebSocket API v1', link: '/ja/api/websocket' },
        { text: 'Android 薄型インターフェース', link: '/ja/api/android' },
        { text: 'MCP サービス', link: '/ja/api/mcp' },
      ],
    },
  ],
  '/ja/reference/': [
    {
      text: 'リファレンス',
      items: [
        { text: 'リファレンス目次', link: '/ja/reference/' },
        { text: 'タスクコマンド一覧', link: '/ja/reference/tasks' },
        { text: '設定リファレンス', link: '/ja/reference/config' },
        { text: 'CLI・ポート・環境変数', link: '/ja/reference/cli' },
        { text: 'ソースコードバージョン索引', link: '/ja/reference/versions' },
      ],
    },
  ],
  '/ja/troubleshooting/': [
    {
      text: 'トラブルシューティング',
      items: [
        { text: 'トラブルシューティング手法', link: '/ja/troubleshooting/' },
        { text: 'コアプログラム', link: '/ja/troubleshooting/azurpilot' },
        { text: 'Android', link: '/ja/troubleshooting/android' },
        { text: 'ランチャー', link: '/ja/troubleshooting/launcher' },
      ],
    },
  ],
  '/ja/contributing/': [
    {
      text: '貢献ガイド',
      items: [
        { text: 'コントリビューションガイド', link: '/ja/contributing/' },
        { text: 'ドキュメントメンテナンス', link: '/ja/contributing/docs' },
        { text: 'リリースとバージョン管理', link: '/ja/contributing/release' },
      ],
    },
  ],
}

/** 英文站：只覆盖已翻译的页面，未翻译的内容在页面上明确标注。 */
const enNav: DefaultTheme.NavItem[] = [
  { text: 'Guide', link: '/en/guide/', activeMatch: '^/en/guide/' },
  { text: 'Core', link: '/en/azurpilot/', activeMatch: '^/en/azurpilot/' },
  { text: 'Android', link: '/en/android/', activeMatch: '^/en/android/' },
  { text: 'Launcher', link: '/en/launcher/', activeMatch: '^/en/launcher/' },
  { text: 'Development', link: '/en/azurpilot/developer/', activeMatch: '/developer/' },
  {
    text: 'Reference',
    activeMatch: '^/en/(api|reference|contributing)/',
    items: [
      { text: 'API Overview', link: '/en/api/' },
      { text: 'WebSocket API', link: '/en/api/websocket' },
      { text: 'MCP Server', link: '/en/api/mcp' },
      { text: 'Configuration Reference', link: '/en/reference/config' },
      { text: 'Task Command Matrix', link: '/en/reference/tasks' },
      { text: 'Troubleshooting', link: '/en/troubleshooting/' },
      { text: 'Contributing', link: '/en/contributing/' },
    ],
  },
  { text: 'Official Site', link: 'https://azurpilot.com/' },
]

const enSidebar: DefaultTheme.SidebarMulti = {
  '/en/guide/': [
    {
      text: 'Getting Started',
      items: [
        { text: 'Choose Your Runtime', link: '/en/guide/' },
        { text: 'What is AzurPilot', link: '/en/guide/what-is-azurpilot' },
        { text: 'The Three Projects', link: '/en/guide/ecosystem' },
        { text: 'Environment & Compatibility', link: '/en/guide/requirements' },
        { text: 'Installation', link: '/en/guide/install' },
        { text: 'First Run', link: '/en/guide/first-run' },
        { text: 'Update, Backup & Migration', link: '/en/guide/update-backup' },
      ],
    },
    {
      text: 'Continue Reading',
      items: [
        { text: 'Core Program Manual', link: '/en/azurpilot/' },
        { text: 'Android Host Manual', link: '/en/android/' },
        { text: 'Launcher Manual', link: '/en/launcher/' },
      ],
    },
  ],
  '/en/azurpilot/': [
    {
      text: 'Core Program',
      items: [
        { text: 'Overview', link: '/en/azurpilot/' },
        { text: 'WebUI Tour', link: '/en/azurpilot/user/webui' },
        { text: 'Connect Emulator & ADB', link: '/en/azurpilot/user/device' },
        { text: 'Scheduler & Task Orchestration', link: '/en/azurpilot/user/scheduler' },
        { text: 'Multi-Instance & Config Management', link: '/en/azurpilot/user/multi-instance' },
        { text: 'Remote Access & Device Pairing', link: '/en/azurpilot/user/remote-access' },
        { text: 'Notifications, Logs & Metrics', link: '/en/azurpilot/user/observability' },
      ],
    },
    {
      text: 'Task Manual',
      collapsed: false,
      items: [
        { text: 'Task Overview', link: '/en/azurpilot/user/tasks/' },
        { text: 'Campaign & Events', link: '/en/azurpilot/user/tasks/campaign' },
        { text: 'Dailies & Resources', link: '/en/azurpilot/user/tasks/daily' },
        { text: 'Operation Siren', link: '/en/azurpilot/user/tasks/opsi' },
        { text: 'Cruise & Island Missions', link: '/en/azurpilot/user/tasks/island' },
        { text: 'Utility Tasks', link: '/en/azurpilot/user/tasks/tools' },
      ],
    },
    {
      text: 'Developer Guide',
      collapsed: true,
      items: [
        { text: 'Developer Portal', link: '/en/azurpilot/developer/' },
        { text: 'System Architecture', link: '/en/azurpilot/developer/architecture' },
        { text: 'Scheduler Lifecycle', link: '/en/azurpilot/developer/scheduler' },
        { text: 'Configuration System', link: '/en/azurpilot/developer/config' },
        { text: 'Device, Vision & Combat', link: '/en/azurpilot/developer/device-vision' },
        { text: 'WebUI Backend', link: '/en/azurpilot/developer/webui-backend' },
        { text: 'React Frontend', link: '/en/azurpilot/developer/frontend' },
        { text: 'Adding a New Task', link: '/en/azurpilot/developer/module-dev' },
        { text: 'Testing & CI', link: '/en/azurpilot/developer/testing-ci' },
      ],
    },
  ],
  '/en/android/': [
    {
      text: 'AzurPilot for Android',
      items: [
        { text: 'Overview', link: '/en/android/' },
        { text: 'Installation & Architecture', link: '/en/android/user/install' },
        { text: 'First Launch & Runtime', link: '/en/android/user/first-run' },
        { text: 'Privilege Activation (ADB / Root)', link: '/en/android/user/activation' },
        { text: 'Console, Floating Window & Screensaver', link: '/en/android/user/console' },
        { text: 'Using as Remote Client', link: '/en/android/user/remote-client' },
        { text: 'Update, Backup & Maintenance', link: '/en/android/user/maintenance' },
      ],
    },
    {
      text: 'Developer Guide',
      collapsed: true,
      items: [
        { text: 'Developer Portal', link: '/en/android/developer/' },
        { text: 'Host Architecture & Modules', link: '/en/android/developer/architecture' },
        { text: 'Runtime & PRoot', link: '/en/android/developer/runtime' },
        { text: 'Privileged Service & Native Bridge', link: '/en/android/developer/privileged' },
        { text: 'OCR & Vision Pipeline', link: '/en/android/developer/ocr' },
        { text: 'Build, Sign & Release', link: '/en/android/developer/build-release' },
      ],
    },
  ],
  '/en/launcher/': [
    {
      text: 'AzurPilot Launcher',
      items: [
        { text: 'Overview', link: '/en/launcher/' },
        { text: 'Installation', link: '/en/launcher/user/install' },
        { text: 'First Launch & Environment Setup', link: '/en/launcher/user/first-run' },
        { text: 'Update, Repair & Uninstall', link: '/en/launcher/user/maintenance' },
      ],
    },
    {
      text: 'Developer Guide',
      collapsed: true,
      items: [
        { text: 'Developer Portal', link: '/en/launcher/developer/' },
        { text: 'Tauri & Rust Architecture', link: '/en/launcher/developer/architecture' },
        { text: 'Backend Process Lifecycle', link: '/en/launcher/developer/backend-lifecycle' },
        { text: 'Update Pipeline & Mirrors', link: '/en/launcher/developer/update' },
        { text: 'Build & Release', link: '/en/launcher/developer/build-release' },
      ],
    },
  ],
  '/en/api/': [
    {
      text: 'API Reference',
      items: [
        { text: 'API Overview', link: '/en/api/' },
        { text: 'WebSocket API v1', link: '/en/api/websocket' },
        { text: 'Android Thin Interface', link: '/en/api/android' },
        { text: 'MCP Server', link: '/en/api/mcp' },
      ],
    },
  ],
  '/en/reference/': [
    {
      text: 'Reference',
      items: [
        { text: 'Reference Index', link: '/en/reference/' },
        { text: 'Task Command Matrix', link: '/en/reference/tasks' },
        { text: 'Configuration Reference', link: '/en/reference/config' },
        { text: 'CLI, Ports & Environment Variables', link: '/en/reference/cli' },
        { text: 'Source Version Index', link: '/en/reference/versions' },
      ],
    },
  ],
  '/en/troubleshooting/': [
    {
      text: 'Troubleshooting',
      items: [
        { text: 'Troubleshooting Methodology', link: '/en/troubleshooting/' },
        { text: 'Core Program', link: '/en/troubleshooting/azurpilot' },
        { text: 'Android Host', link: '/en/troubleshooting/android' },
        { text: 'Desktop Launcher', link: '/en/troubleshooting/launcher' },
      ],
    },
  ],
  '/en/contributing/': [
    {
      text: 'Contributing',
      items: [
        { text: 'Contribution Guide', link: '/en/contributing/' },
        { text: 'Documentation Maintenance', link: '/en/contributing/docs' },
        { text: 'Releases & Versioning', link: '/en/contributing/release' },
      ],
    },
  ],
}

/** 已提供英文版的页面；用于生成 hreflang，避免指向不存在的译文。 */
const TRANSLATED = new Set([
  'index.md',
  'guide/index.md',
  'guide/what-is-azurpilot.md',
  'guide/ecosystem.md',
  'guide/requirements.md',
  'guide/install.md',
  'guide/first-run.md',
  'guide/update-backup.md',
  'azurpilot/index.md',
  'azurpilot/user/webui.md',
  'azurpilot/user/device.md',
  'azurpilot/user/scheduler.md',
  'azurpilot/user/multi-instance.md',
  'azurpilot/user/remote-access.md',
  'azurpilot/user/observability.md',
  'azurpilot/user/tasks/index.md',
  'azurpilot/user/tasks/campaign.md',
  'azurpilot/user/tasks/daily.md',
  'azurpilot/user/tasks/opsi.md',
  'azurpilot/user/tasks/island.md',
  'azurpilot/user/tasks/tools.md',
  'azurpilot/developer/index.md',
  'azurpilot/developer/architecture.md',
  'azurpilot/developer/scheduler.md',
  'azurpilot/developer/config.md',
  'azurpilot/developer/device-vision.md',
  'azurpilot/developer/webui-backend.md',
  'azurpilot/developer/frontend.md',
  'azurpilot/developer/module-dev.md',
  'azurpilot/developer/testing-ci.md',
  'android/index.md',
  'android/user/install.md',
  'android/user/first-run.md',
  'android/user/activation.md',
  'android/user/console.md',
  'android/user/remote-client.md',
  'android/user/maintenance.md',
  'android/developer/index.md',
  'android/developer/architecture.md',
  'android/developer/runtime.md',
  'android/developer/privileged.md',
  'android/developer/ocr.md',
  'android/developer/build-release.md',
  'launcher/index.md',
  'launcher/user/install.md',
  'launcher/user/first-run.md',
  'launcher/user/maintenance.md',
  'launcher/developer/index.md',
  'launcher/developer/architecture.md',
  'launcher/developer/backend-lifecycle.md',
  'launcher/developer/update.md',
  'launcher/developer/build-release.md',
  'api/index.md',
  'api/websocket.md',
  'api/android.md',
  'api/mcp.md',
  'reference/index.md',
  'reference/tasks.md',
  'reference/config.md',
  'reference/cli.md',
  'reference/versions.md',
  'troubleshooting/index.md',
  'troubleshooting/azurpilot.md',
  'troubleshooting/android.md',
  'troubleshooting/launcher.md',
  'contributing/index.md',
  'contributing/docs.md',
  'contributing/release.md',
])

export default withMermaid(
  defineConfig({
    // Mermaid：中性配色 + 原生 SVG 文本。
    // htmlLabels 必须关闭，否则文字用 foreignObject 渲染，会和站点字体度量对不上而截断。
    mermaid: {
      // strict 才会真正禁用 foreignObject；loose 会强制走 HTML 标签
      securityLevel: 'strict',
      // mermaid 11 在顶层读这个开关；只写在 flowchart 下会被忽略
      htmlLabels: false,
      theme: 'neutral',
      // 必须用「首帧就已可用」的系统字体：Mermaid 在字体加载完成前测量尺寸，
      // 用 Inter 这类 webfont 会量出偏小的行高，导致最后一行被裁掉。
      fontFamily: 'system-ui, Segoe UI, Microsoft YaHei UI, PingFang SC, sans-serif',
      flowchart: {
        htmlLabels: false,
        useMaxWidth: true,
        wrappingWidth: 420,
        nodeSpacing: 44,
        rankSpacing: 52,
        curve: 'basis',
      },
      sequence: { useMaxWidth: true, wrap: true },
      themeVariables: { fontSize: '14px' },
    },
  lang: 'zh-CN',
  title: 'AzurPilot 文档',
  description:
    'AzurPilot 官方文档：碧蓝航线自动化框架的用户手册、开发者文档与 API 参考，覆盖核心程序、Android 宿主与桌面启动器。',
  /**
   * i18n：root 为简体中文（完整），en 为英文（部分页面）。
   * 未翻译的页面不会出现在英文导航里，英文页顶部也会说明完整内容只有中文。
   */
  locales: {
    root: { label: '简体中文', lang: 'zh-CN' },
    'zh-TW': {
      label: '繁體中文',
      lang: 'zh-TW',
      link: '/zh-TW/',
      title: 'AzurPilot 說明文件',
      description:
        'AzurPilot 官方說明文件：碧藍航線自動化框架的使用者手冊、開發者文件與 API 參考，涵蓋核心程式、Android 宿主與桌面啟動器。',
      themeConfig: {
        nav: twNav,
        sidebar: twSidebar,
        outline: { level: [2, 3], label: '本頁目錄' },
        docFooter: { prev: '上一篇', next: '下一篇' },
        lastUpdated: { text: '最後更新', formatOptions: { dateStyle: 'medium' } },
        returnToTopLabel: '返回頂部',
        sidebarMenuLabel: '功能表',
        darkModeSwitchLabel: '外觀',
        langMenuLabel: '語言',
        notFound: {
          title: '頁面不在航線上',
          quote: '這張海圖沒有標註該座標。檢查連結，或回到說明文件首頁重新導覽。',
          linkLabel: '返回首頁',
          linkText: '回到首頁',
        },
        editLink: {
          pattern: `https://github.com/wess09/AzurPilotDoc/edit/${process.env.DOCS_EDIT_BRANCH || 'main'}/docs/:path`,
          text: '在 GitHub 上編輯此頁',
        },
        footer: {
          message:
            '說明文件內容以 Apache-2.0 授權條款發布；AzurPilot 核心程式遵循 GPL-3.0，Android 宿主遵循 AGPL-3.0，啟動器遵循 GPL-3.0。',
          copyright: '© 2026 AzurPilot Contributors · 與《碧藍航線》官方無關',
        },
        search: {
          provider: 'local',
          options: {
            detailedView: true,
            translations: {
              button: {
                buttonText: '搜尋說明文件',
                buttonAriaLabel: '搜尋說明文件 K',
              },
              modal: {
                displayDetails: '顯示詳細資訊',
                resetButtonTitle: '清除查詢',
                backButtonTitle: '返回',
                noResultsText: '沒有找到相關結果',
                footer: {
                  selectText: '選擇',
                  selectKeyAriaLabel: 'Enter',
                  navigateText: '切換',
                  navigateUpKeyAriaLabel: '上箭頭',
                  navigateDownKeyAriaLabel: '下箭頭',
                  closeText: '關閉',
                  closeKeyAriaLabel: 'Esc',
                },
              },
            },
          },
        },
      },
    },

    'zh-HK': {
      label: '香港繁體',
      lang: 'zh-HK',
      link: '/zh-HK/',
      title: 'AzurPilot 文檔',
      description:
        'AzurPilot 官方文檔：碧藍航線自動化框架的用戶手冊、開發者文檔與 API 參考，覆蓋核心程序、Android 宿主與桌面啟動器。',
      themeConfig: {
        nav: zhHkNav,
        sidebar: zhHkSidebar,
        outline: { level: [2, 3], label: '本頁目錄' },
        docFooter: { prev: '上一篇', next: '下一篇' },
        lastUpdated: { text: '最後更新', formatOptions: { dateStyle: 'medium' } },
        returnToTopLabel: '返回頂部',
        sidebarMenuLabel: '目錄',
        darkModeSwitchLabel: '外觀',
        langMenuLabel: '語言',
        notFound: {
          title: '頁面不在航線上',
          quote: '這張海圖沒有標註該坐標。檢查連結，或回到文檔首頁重新導航。',
          linkLabel: '返回首頁',
          linkText: '回到首頁',
        },
        editLink: {
          pattern: `https://github.com/wess09/AzurPilotDoc/edit/${process.env.DOCS_EDIT_BRANCH || 'main'}/docs/:path`,
          text: '在 GitHub 上編輯此頁',
        },
        footer: {
          message:
            '文檔內容以 Apache-2.0 許可發布；AzurPilot 核心程序遵循 GPL-3.0，Android 宿主遵循 AGPL-3.0，啟動器遵循 GPL-3.0。',
          copyright: '© 2026 AzurPilot Contributors · 與《碧藍航線》官方無關',
        },
        search: {
          provider: 'local',
          options: {
            detailedView: true,
            translations: {
              button: {
                buttonText: '搜尋文檔',
                buttonAriaLabel: '搜尋文檔 K',
              },
              modal: {
                displayDetails: '顯示詳情',
                resetButtonTitle: '清除查詢',
                backButtonTitle: '返回',
                noResultsText: '沒有找到相關結果',
                footer: {
                  selectText: '選擇',
                  selectKeyAriaLabel: 'Enter',
                  navigateText: '切換',
                  navigateUpKeyAriaLabel: '上箭頭',
                  navigateDownKeyAriaLabel: '下箭頭',
                  closeText: '關閉',
                  closeKeyAriaLabel: 'Esc',
                },
              },
            },
          },
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'AzurPilot Docs',
      description:
        'Official documentation for AzurPilot: user manuals, developer guides and API reference for the core program, the Android host and the desktop launcher.',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
        outline: { level: [2, 3], label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
        lastUpdated: { text: 'Last updated' },
        returnToTopLabel: 'Back to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Theme',
        langMenuLabel: 'Language',
        notFound: {
          title: 'Page not found',
          quote: 'The page you are looking for does not exist in the English edition.',
          linkLabel: 'Go to the English overview',
          linkText: 'Take me there',
        },
        editLink: {
          pattern: `https://github.com/wess09/AzurPilotDoc/edit/${process.env.DOCS_EDIT_BRANCH || 'main'}/docs/:path`,
          text: 'Edit this page on GitHub',
        },
        footer: {
          message:
            'Docs are licensed under Apache-2.0. AzurPilot core is GPL-3.0, the Android host AGPL-3.0, the launcher GPL-3.0.',
          copyright: '© 2026 AzurPilot Contributors · Not affiliated with the game publisher',
        },
        search: {
          provider: 'local',
          options: {
            translations: {
              button: { buttonText: 'Search', buttonAriaLabel: 'Search' },
              modal: {
                noResultsText: 'No results for',
                resetButtonTitle: 'Clear',
                footer: { selectText: 'to select', navigateText: 'to navigate', closeText: 'to close' },
              },
            },
          },
        },
      },
    },
    ja: {
      label: '日本語',
      lang: 'ja-JP',
      link: '/ja/',
      title: 'AzurPilot ドキュメント',
      description:
        'AzurPilot 公式ドキュメント：アズールレーン自動化フレームワークのユーザーマニュアル、開発者向けドキュメント、APIリファレンス。コアプログラム、Android ホスト、デスクトップランチャーを網羅。',
      themeConfig: {
        nav: jaNav,
        sidebar: jaSidebar,
        outline: { level: [2, 3], label: '目次' },
        docFooter: { prev: '前のページ', next: '次のページ' },
        lastUpdated: { text: '最終更新', formatOptions: { dateStyle: 'medium' } },
        returnToTopLabel: 'トップへ戻る',
        sidebarMenuLabel: 'メニュー',
        darkModeSwitchLabel: '外観',
        langMenuLabel: '言語',
        notFound: {
          title: 'ページが見つかりません',
          quote: 'この海図には該当する座標がありません。URL を確認するか、トップページから再検索してください。',
          linkLabel: 'トップページへ戻る',
          linkText: 'トップページに戻る',
        },
        editLink: {
          pattern: `https://github.com/wess09/AzurPilotDoc/edit/${process.env.DOCS_EDIT_BRANCH || 'main'}/docs/:path`,
          text: 'GitHub でこのページを編集',
        },
        footer: {
          message:
            'ドキュメント内容は Apache-2.0 ライセンスで公開されています。AzurPilot コアプログラムは GPL-3.0、Android ホストは AGPL-3.0、ランチャーは GPL-3.0 に従います。',
          copyright: '© 2026 AzurPilot Contributors · 『アズールレーン』公式とは無関係です',
        },
        search: {
          provider: 'local',
          options: {
            detailedView: true,
            translations: {
              button: {
                buttonText: 'ドキュメントを検索',
                buttonAriaLabel: 'ドキュメントを検索',
              },
              modal: {
                displayDetails: '詳細を表示',
                resetButtonTitle: '検索条件をクリア',
                backButtonTitle: '戻る',
                noResultsText: '該当する結果が見つかりませんでした',
                footer: {
                  selectText: '選択',
                  selectKeyAriaLabel: 'Enter',
                  navigateText: '移動',
                  navigateUpKeyAriaLabel: '上矢印',
                  navigateDownKeyAriaLabel: '下矢印',
                  closeText: '閉じる',
                  closeKeyAriaLabel: 'Esc',
                },
              },
            },
          },
        },
      },
    },
  },
  siteTitle: 'AzurPilot',
  ignoreDeadLinks: [/^[a-z]+:\/\//, /^\/(en|ja)\//],
  appearance: true,
  cleanUrls: true,
  lastUpdated: true,
  metaChunk: true,
  sitemap: {
    hostname: SITE_URL,
    lastmodDateOnly: true,
    // 404 不进 sitemap；首页优先级最高，栏目首页次之，正文最低。
    transformItems: (items) =>
      items
        .filter((item) => !item.url.includes('404'))
        .map((item) => {
          const depth = item.url.split('/').filter(Boolean).length
          return {
            ...item,
            changefreq: depth === 0 ? 'weekly' : 'monthly',
            priority: depth === 0 ? 1 : depth === 1 ? 0.8 : 0.6,
          }
        }),
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/img/icon-192.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/img/icon-192.png' }],
    ['meta', { name: 'theme-color', content: '#0d1a26' }],
    ['meta', { name: 'author', content: 'AzurPilot Contributors' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'AzurPilot 文档' }],
    ['meta', { property: 'og:image', content: `${SITE_URL}/img/og-cover.png` }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'format-detection', content: 'telephone=no' }],
  ],
  markdown: {
    lineNumbers: false,
    image: { lazyLoading: true },
    // VitePress 默认高亮主题
    theme: { light: 'github-light', dark: 'github-dark' },
    anchor: { level: [2, 3] },
    headers: { level: [2, 3] },
    toc: { level: [2, 3] },
    container: {
      tipLabel: '提示',
      warningLabel: '注意',
      dangerLabel: '危险',
      infoLabel: '说明',
      detailsLabel: '展开',
    },
  },
  vite: {
    build: { chunkSizeWarningLimit: 1200 },
    ssr: { noExternal: ['lucide-vue-next'] },
    // mermaid 11 依赖的 fastdom 是 CJS，必须预打包，否则浏览器里拿不到 default 导出
    optimizeDeps: { include: ['mermaid', 'fastdom'] },
    plugins: [llmstxt(), copySourceMarkdown()],
  },
  themeConfig: {
    // 项目自带 logo（AzurPilot/doc/logo.webp），此处为导航用的徽记裁切
    logo: { src: '/img/logo-mark.png', width: 28, height: 28, alt: 'AzurPilot' },
    siteTitle: 'AzurPilot',
    nav: [
      { text: '开始使用', link: '/guide/', activeMatch: '^/guide/' },
      { text: '核心程序', link: '/azurpilot/', activeMatch: '^/azurpilot/' },
      { text: 'Android', link: '/android/', activeMatch: '^/android/' },
      { text: '启动器', link: '/launcher/', activeMatch: '^/launcher/' },
      { text: '开发', link: '/azurpilot/developer/', activeMatch: '/developer/' },
      { text: '参考',
        activeMatch: '^/(api|reference|contributing)/',
        items: [
          { text: '接口总览', link: '/api/' },
          { text: 'WebSocket API', link: '/api/websocket' },
          { text: 'MCP 服务', link: '/api/mcp' },
          { text: '配置参考', link: '/reference/config' },
          { text: '任务命令总表', link: '/reference/tasks' },
          { text: '故障排查', link: '/troubleshooting/' },
          { text: '参与贡献', link: '/contributing/' },
        ],
      },
      { text: '官网', link: 'https://azurpilot.com/' },
    ],
    sidebar,
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新', formatOptions: { dateStyle: 'medium' } },
    editLink: {
      // 仓库默认分支不确定时用 DOCS_EDIT_BRANCH 覆盖，避免「编辑此页」404。
      pattern: `https://github.com/wess09/AzurPilotDoc/edit/${process.env.DOCS_EDIT_BRANCH || 'main'}/docs/:path`,
      text: '在 GitHub 上编辑此页',
    },
    footer: {
      message:
        '文档内容以 Apache-2.0 许可发布；AzurPilot 核心程序遵循 GPL-3.0，Android 宿主遵循 AGPL-3.0，启动器遵循 GPL-3.0。',
      copyright: '© 2026 AzurPilot Contributors · 与《碧蓝航线》官方无关',
    },
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档 K',
          },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除查询',
            backButtonTitle: '返回',
            noResultsText: '没有找到相关结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上箭头',
              navigateDownKeyAriaLabel: '下箭头',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc',
            },
          },
        },
        miniSearch: {
          options: {
            tokenize: (text: string) => {
              const out: string[] = []
              const words = text.toLowerCase().match(/[a-z0-9_.+#-]+|[\u3400-\u4dbf\u4e00-\u9fff]+/g) || []
              for (const w of words) {
                if (/^[\u3400-\u4dbf\u4e00-\u9fff]/.test(w)) {
                  // 中文按二元词切分，兼顾召回与索引体积
                  if (w.length === 1) out.push(w)
                  else for (let i = 0; i < w.length - 1; i++) out.push(w.slice(i, i + 2))
                } else {
                  out.push(w)
                }
              }
              return out
            },
            processTerm: (term: string) => (term.length > 1 || /[\u4e00-\u9fff]/.test(term) ? term : null),
          },
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 2 },
          },
        },
      },
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/wess09/AzurPilot' },
    ],
    notFound: {
      title: '页面不在航线上',
      quote: '这张海图没有标注该坐标。检查链接，或回到文档首页重新导航。',
      linkLabel: '返回首页',
      linkText: '回到首页',
    },
    externalLinkIcon: true,
  },
  transformHead({ pageData }) {
    const fm = pageData.frontmatter || {}
    const isHome = pageData.relativePath === 'index.md'
    const url = `${SITE_URL}/${pageData.relativePath.replace(/(index)?\.md$/, '').replace(/\/$/, '')}`
    const canonical = isHome ? `${SITE_URL}/` : url
    const head: [string, Record<string, string>][] = []
    head.push(['link', { rel: 'canonical', href: canonical }])

    // hreflang：只给确实有译文的页面互指，未翻译的不生成，避免指向 404
    const rel = pageData.relativePath
    const zhRel = rel.startsWith('en/') ? rel.slice(3) : rel
    const urlOf = (r: string) =>
      r === 'index.md'
        ? `${SITE_URL}/`
        : `${SITE_URL}/${r.replace(/(index)?\.md$/, '').replace(/\/$/, '')}`
    if (TRANSLATED.has(zhRel)) {
      head.push(['link', { rel: 'alternate', hreflang: 'zh-CN', href: urlOf(zhRel) }])
      head.push(['link', { rel: 'alternate', hreflang: 'en-US', href: urlOf(`en/${zhRel}`) }])
      head.push(['link', { rel: 'alternate', hreflang: 'x-default', href: urlOf(zhRel) }])
      head.push(['meta', { property: 'og:locale', content: rel.startsWith('en/') ? 'en_US' : 'zh_CN' }])
      head.push([
        'meta',
        { property: 'og:locale:alternate', content: rel.startsWith('en/') ? 'zh_CN' : 'en_US' },
      ])
    }

    head.push(['meta', { property: 'og:url', content: canonical }])
    head.push(['meta', { property: 'og:title', content: fm.title ? `${fm.title} · AzurPilot 文档` : 'AzurPilot 文档' }])
    if (fm.description) {
      head.push(['meta', { property: 'og:description', content: fm.description }])
      head.push(['meta', { name: 'twitter:title', content: fm.title ? `${fm.title} · AzurPilot 文档` : 'AzurPilot 文档' }])
      head.push(['meta', { name: 'twitter:description', content: fm.description }])
    }
    if (fm.noindex) head.push(['meta', { name: 'robots', content: 'noindex, follow' }])

    const org = {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'AzurPilot',
      url: SITE_URL,
      logo: `${SITE_URL}/img/icon-512.png`,
      sameAs: [SRC.core, SRC.android, SRC.launcher, 'https://azurpilot.com/'],
    }
    if (isHome) {
      head.push([
        'script',
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              org,
              {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                name: 'AzurPilot 文档',
                url: `${SITE_URL}/`,
                inLanguage: 'zh-CN',
                publisher: { '@id': `${SITE_URL}/#organization` },
              },
            ],
          }),
        },
      ])
    } else if (!fm.noindex && fm.layout !== 'page') {
      const crumbs: Record<string, unknown>[] = [
        { '@type': 'ListItem', position: 1, name: '文档首页', item: `${SITE_URL}/` },
      ]
      const section = pageData.relativePath.split('/')[0]
      const sectionName: Record<string, string> = {
        guide: '开始使用',
        azurpilot: '核心程序',
        android: 'Android',
        launcher: '启动器',
        api: '接口参考',
        reference: '参考',
        troubleshooting: '故障排查',
        contributing: '参与贡献',
      }
      if (sectionName[section]) {
        crumbs.push({
          '@type': 'ListItem',
          position: 2,
          name: sectionName[section],
          item: `${SITE_URL}/${section}/`,
        })
      }
      crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: fm.title || '文档', item: canonical })
      head.push([
        'script',
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              org,
              {
                '@type': 'TechArticle',
                headline: fm.title || 'AzurPilot 文档',
                description: fm.description || '',
                inLanguage: 'zh-CN',
                mainEntityOfPage: canonical,
                isPartOf: { '@id': `${SITE_URL}/#website` },
                author: { '@type': 'Organization', name: 'AzurPilot Contributors' },
                publisher: { '@id': `${SITE_URL}/#organization` },
                ...(fm.updated ? { dateModified: fm.updated } : {}),
              },
              { '@type': 'BreadcrumbList', itemListElement: crumbs },
            ],
          }),
        },
      ])
    }
    return head
  },
  }),
)
