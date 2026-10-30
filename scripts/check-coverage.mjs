/**
 * 文档覆盖检查：frontmatter 必填、侧边栏可达、标题/描述唯一。
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

const DOCS = path.resolve('docs')
const errors = []
const pages = []

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'cache', '.vitepress', 'public'].includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full)
    else if (entry.name.endsWith('.md')) pages.push(full)
  }
}
await walk(DOCS)

const config = await readFile(path.join(DOCS, '.vitepress', 'config.mts'), 'utf8')
const normalize = (route) => (route.endsWith('/') ? route : route + '/')
const sidebarLinks = new Set(
  [...config.matchAll(/link: '(\/[^']+)'/g)].map((m) => normalize(m[1])),
)

const titles = new Map()
const descriptions = new Map()

for (const file of pages) {
  const rel = path.relative(DOCS, file).replace(/\\/g, '/')
  const { data } = matter(await readFile(file, 'utf8'))
  const isHome = rel === 'index.md' || /^(en|ja|zh-HK|zh-TW)\/index\.md$/.test(rel)
  // Uniqueness is per locale: translated pages have independent canonical URLs.
  const locale = rel.match(/^(en|ja|zh-HK|zh-TW)\//)?.[1] ?? 'zh-CN'
  const titleKey = `${locale}:${data.title}`
  const descriptionKey = `${locale}:${data.description}`

  if (!data.title) errors.push(`${rel}: 缺少 title`)
  if (!isHome && !data.description) errors.push(`${rel}: 缺少 description`)
  if (data.description) {
    if (data.description.length < 20) errors.push(`${rel}: description 过短（${data.description.length}）`)
    if (data.description.length > 200) errors.push(`${rel}: description 过长（${data.description.length}）`)
  }
  if (data.title) {
    if (titles.has(titleKey)) errors.push(`标题重复: ${data.title} (${titles.get(titleKey)} / ${rel})`)
    titles.set(titleKey, rel)
  }
  if (data.description) {
    if (descriptions.has(descriptionKey)) {
      errors.push(`描述重复: ${rel} 与 ${descriptions.get(descriptionKey)}`)
    }
    descriptions.set(descriptionKey, rel)
  }

  if (isHome || data.layout === 'page') continue
  const route = normalize('/' + rel.replace(/(index)?\.md$/, ''))
  if (!sidebarLinks.has(route)) errors.push(`${rel}: 未被侧边栏引用（route=${route}）`)
}

// 侧边栏链接必须有对应页面
for (const link of sidebarLinks) {
  if (!pages.some((p) => {
    const rel = normalize('/' + path.relative(DOCS, p).replace(/\\/g, '/').replace(/(index)?\.md$/, ''))
    return rel === link
  })) {
    errors.push(`侧边栏链接没有对应页面: ${link}`)
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} 个覆盖问题`)
  for (const e of errors) console.error('  ' + e)
  process.exit(1)
}
console.log(`✓ 覆盖检查通过（${pages.length} 页，${sidebarLinks.size} 个侧边栏入口）`)
