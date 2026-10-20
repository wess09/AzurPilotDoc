/**
 * 构建产物 SEO 检查：title/description/canonical/H1/JSON-LD/sitemap。
 * 依赖 `vitepress build docs` 的产物。
 */
import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const DIST = path.resolve('docs/.vitepress/dist')
const errors = []
const warnings = []
const pages = []

if (!existsSync(DIST)) {
  console.error('✖ 未找到构建产物，先运行 npm run build')
  process.exit(1)
}

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'img') continue
      await walk(full)
    } else if (entry.name.endsWith('.html')) pages.push(full)
  }
}
await walk(DIST)

if (pages.length < 60) {
  console.error(`✖ 构建产物只有 ${pages.length} 个 HTML，疑似构建不完整`)
  process.exit(1)
}

const titles = new Map()
const descriptions = new Map()
const canonicals = new Map()

for (const file of pages) {
  const rel = path.relative(DIST, file).replace(/\\/g, '/')
  const html = await readFile(file, 'utf8')
  const pick = (re) => (re.exec(html) || [])[1] || ''

  const title = pick(/<title>([^<]*)<\/title>/)
  const desc = pick(/<meta name="description" content="([^"]*)"/)
  const canonical = pick(/<link rel="canonical" href="([^"]*)"/)
  const lang = pick(/<html[^>]*lang="([^"]*)"/)
  // 站点有两个 locale：根为 zh-CN，/en/ 为 en-US
  const expectedLang = rel.startsWith('en/') ? 'en-US' : 'zh-CN'
  const h1 = (html.match(/<h1[\s>]/g) || []).length
  const is404 = rel === '404.html'
  const isHome = rel === 'index.html'

  if (!title) errors.push(`${rel}: 缺少 title`)
  if (!desc) errors.push(`${rel}: 缺少 meta description`)
  if (!canonical) errors.push(`${rel}: 缺少 canonical`)
  if (lang !== expectedLang) errors.push(`${rel}: html lang=${lang || '空'}，应为 ${expectedLang}`)
  if (!is404 && h1 !== 1) errors.push(`${rel}: H1 数量为 ${h1}`)
  if (!is404 && !/application\/ld\+json/.test(html)) errors.push(`${rel}: 缺少 JSON-LD`)
  if (!is404 && !/property="og:title"/.test(html)) errors.push(`${rel}: 缺少 og:title`)

  if (title) {
    if (titles.has(title)) errors.push(`title 重复: ${rel} 与 ${titles.get(title)}`)
    titles.set(title, rel)
  }
  if (desc) {
    if (descriptions.has(desc)) errors.push(`description 重复: ${rel} 与 ${descriptions.get(desc)}`)
    descriptions.set(desc, rel)
    // 中文摘要 40–160 字符较合适：太短没有检索信息量，太长会被截断。
    if (!is404 && desc.length < 40) warnings.push(`${rel}: description 只有 ${desc.length} 字，信息量不足`)
    if (desc.length > 160) warnings.push(`${rel}: description ${desc.length} 字，可能被搜索结果截断`)
  }
  if (canonical) {
    if (canonicals.has(canonical)) errors.push(`canonical 重复: ${rel} 与 ${canonicals.get(canonical)}`)
    canonicals.set(canonical, rel)
    if (!canonical.startsWith('https://')) errors.push(`${rel}: canonical 不是绝对地址`)
  }

  if (/<img(?![^>]*\balt=)[^>]*>/i.test(html)) warnings.push(`${rel}: 存在没有 alt 的图片`)
}

const sitemapPath = path.join(DIST, 'sitemap.xml')
if (!existsSync(sitemapPath)) errors.push('缺少 sitemap.xml')
else {
  const sitemap = await readFile(sitemapPath, 'utf8')
  for (const file of pages) {
    if (file.endsWith('404.html')) continue
    const route = '/' + path.relative(DIST, file).replace(/\\/g, '/').replace(/(index)?\.html$/, '')
    if (!sitemap.includes(route === '/' ? '</loc>' : route)) {
      warnings.push(`sitemap 可能缺少: ${route}`)
    }
  }
}

if (!existsSync(path.join(DIST, 'robots.txt'))) errors.push('缺少 robots.txt')
if (warnings.length) {
  console.log(`⚠ ${warnings.length} 个提示`)
  for (const w of warnings.slice(0, 10)) console.log('  ' + w)
}
if (errors.length) {
  console.error(`✖ ${errors.length} 个 SEO 问题`)
  for (const e of errors.slice(0, 40)) console.error('  ' + e)
  process.exit(1)
}
console.log(`✓ SEO 检查通过（${pages.length} 个 HTML 页面，canonical 唯一，JSON-LD 完整）`)
