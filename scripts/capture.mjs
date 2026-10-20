/**
 * 多分辨率截图与页面体检。
 *
 * 用法:
 *   node scripts/capture.mjs [baseUrl]
 *
 * 输出:
 *   .screenshots/*.png
 *   .screenshots/report.json
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.argv[2] || 'http://127.0.0.1:4173'
const OUT = '.screenshots'

/** 探测 URL 是否可访问；本地预览服务没起时返回 false。 */
async function reachable(url, timeout = 2500) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

/**
 * 本地地址不可达时自行拉起 `vitepress preview`，
 * 这样 `npm run shots` 不依赖外部常驻进程。
 */
async function ensureServer() {
  if (await reachable(BASE)) return null
  const bin = join(ROOT, 'node_modules/vitepress/bin/vitepress.js')
  if (!existsSync(bin)) {
    throw new Error(`预览服务未启动，且找不到 ${bin}，请先 npm install`)
  }
  const url = new URL(BASE)
  const child = spawn(
    process.execPath,
    [bin, 'preview', 'docs', '--port', url.port || '4173', '--host', url.hostname],
    { cwd: ROOT, stdio: 'ignore', env: { ...process.env, NO_PROXY: '127.0.0.1,localhost', no_proxy: '127.0.0.1,localhost' } },
  )
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (await reachable(BASE)) return child
  }
  child.kill()
  throw new Error(`预览服务在 30s 内未就绪：${BASE}`)
}

const PAGES = [
  { path: '/', name: 'home', widths: [320, 375, 390, 768, 1024, 1440, 1920], dark: true },
  { path: '/guide/', name: 'guide' },
  { path: '/guide/install', name: 'install' },
  { path: '/guide/first-run', name: 'first-run' },
  { path: '/azurpilot/', name: 'core' },
  { path: '/azurpilot/user/webui', name: 'webui' },
  { path: '/azurpilot/user/tasks/', name: 'tasks' },
  { path: '/azurpilot/user/tasks/opsi', name: 'opsi' },
  { path: '/azurpilot/developer/architecture', name: 'dev-arch' },
  { path: '/android/', name: 'android' },
  { path: '/android/user/install', name: 'android-install' },
  { path: '/launcher/', name: 'launcher' },
  { path: '/api/websocket', name: 'api' },
  { path: '/reference/config', name: 'config-ref' },
  { path: '/troubleshooting/', name: 'troubleshooting' },
  { path: '/contributing/docs', name: 'contrib-docs' },
  { path: '/this-page-does-not-exist', name: '404' },
]

const report = []

async function audit(page, path, name, width, dark) {
  const errors = []
  const failed = []
  const onConsole = (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  }
  const onFailed = (req) => failed.push(`${req.url()} ${req.failure()?.errorText || ''}`)
  page.on('console', onConsole)
  page.on('requestfailed', onFailed)

  const response = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(350)

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement
    const wide = doc.scrollWidth - window.innerWidth
    const imgs = Array.from(document.images)
    const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src)
    const h1 = document.querySelectorAll('h1').length
    const title = document.title
    const desc = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
    const navH = document.querySelector('.VPNavBar')?.getBoundingClientRect().height || 0
    const firstH2 = document.querySelector('.vp-doc h2')
    const obscured = firstH2
      ? firstH2.getBoundingClientRect().top < navH && firstH2.getBoundingClientRect().bottom > 0
      : false
    return {
      overflowX: Math.max(0, wide),
      brokenImages: broken,
      h1,
      title,
      descLength: desc.length,
      canonical,
      firstHeadingObscured: obscured,
      bodyHeight: document.body.scrollHeight,
    }
  })

  await page.screenshot({
    path: `${OUT}/${name}-${width}${dark ? '-dark' : ''}.png`,
    fullPage: true,
  })

  page.off('console', onConsole)
  page.off('requestfailed', onFailed)

  report.push({
    path,
    name,
    width,
    dark,
    status: response?.status() ?? 0,
    ...metrics,
    consoleErrors: errors,
    failedRequests: failed,
  })
}

await mkdir(OUT, { recursive: true })
const server = await ensureServer()
const browser = await chromium.launch()

/** 全站断点扫描：只量横向溢出与首屏遮挡，不落截图。 */
const SWEEP = [320, 375, 390, 768, 1024, 1440, 1920]
const sweepResults = []

async function sweep() {
  for (const entry of PAGES) {
    if (entry.name === '404') continue
    for (const width of SWEEP) {
      const context = await browser.newContext({
        viewport: { width, height: width < 500 ? 844 : 960 },
        deviceScaleFactor: 1,
      })
      const page = await context.newPage()
      await page.goto(BASE + entry.path, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForTimeout(220)
      const m = await page.evaluate(() => {
        const doc = document.documentElement
        const navH = document.querySelector('.VPNavBar')?.getBoundingClientRect().height || 0
        const firstH2 = document.querySelector('.vp-doc h2, h1')
        const r = firstH2?.getBoundingClientRect()
        return {
          overflowX: Math.max(0, doc.scrollWidth - window.innerWidth),
          obscured: r ? r.top < navH && r.bottom > 0 : false,
        }
      })
      sweepResults.push({ name: entry.name, path: entry.path, width, ...m })
      await context.close()
    }
  }
}

try {
  for (const entry of PAGES) {
    const widths = entry.widths || [390, 1440]
    for (const width of widths) {
      for (const dark of entry.dark ? [false, true] : [false]) {
        const context = await browser.newContext({
          viewport: { width, height: width < 500 ? 844 : 960 },
          deviceScaleFactor: 1,
          colorScheme: dark ? 'dark' : 'light',
        })
        const page = await context.newPage()
        await audit(page, entry.path, entry.name, width, dark)
        await context.close()
      }
    }
  }
  await sweep()
} finally {
  await browser.close()
  server?.kill()
}

await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2))
await writeFile(`${OUT}/sweep.json`, JSON.stringify(sweepResults, null, 2))

const problems = report.filter(
  (r) =>
    r.overflowX > 1 ||
    r.brokenImages.length ||
    (r.consoleErrors.length && r.name !== '404') ||
    r.failedRequests.length ||
    r.status >= 400 && r.name !== '404' ||
    r.firstHeadingObscured,
)
console.log(`captured ${report.length} pages, ${problems.length} with problems`)
for (const p of problems) {
  console.log(`- ${p.name}@${p.width}${p.dark ? '/dark' : ''} status=${p.status} overflow=${p.overflowX} broken=${p.brokenImages.length} console=${p.consoleErrors.length} failed=${p.failedRequests.length}`)
  for (const e of p.consoleErrors.slice(0, 3)) console.log(`    console: ${e.slice(0, 160)}`)
  for (const f of p.failedRequests.slice(0, 3)) console.log(`    request: ${f.slice(0, 160)}`)
}

const sweepProblems = sweepResults.filter((s) => s.overflowX > 1 || s.obscured)
console.log(
  `swept ${sweepResults.length} breakpoint combinations (${SWEEP.join('/')} px), ${sweepProblems.length} with problems`,
)
for (const s of sweepProblems) {
  console.log(`- ${s.name}@${s.width} overflow=${s.overflowX} obscured=${s.obscured}`)
}
if (problems.length || sweepProblems.length) process.exitCode = 1
