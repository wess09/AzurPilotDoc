/**
 * 内部链接与锚点检查。
 * 检查 docs/**\/*.md 中的 Markdown 链接、图片与公共资源引用。
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const DOCS = path.resolve('docs')
const errors = []
const warnings = []

async function walk(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'cache', '.vitepress'].includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, acc)
    else if (entry.name.endsWith('.md')) acc.push(full)
  }
  return acc
}

const slugify = (text) =>
  text
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')

function headings(md) {
  const set = new Set()
  const lines = md.split('\n')
  let fenced = false
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    if (fenced) continue
    const m = /^#{1,6}\s+(.*)$/.exec(line)
    if (m) set.add(slugify(m[1].replace(/\s*\{#.*\}$/, '')))
  }
  return set
}

function resolveTarget(fromFile, raw) {
  const clean = raw.split('#')[0].split('?')[0]
  if (!clean) return null
  if (/^[a-z]+:/i.test(clean)) return null
  if (clean.startsWith('/')) {
    const rel = clean.replace(/^\//, '')
    const candidates = [
      path.join(DOCS, rel),
      path.join(DOCS, rel + '.md'),
      path.join(DOCS, rel, 'index.md'),
      path.join(DOCS, 'public', rel),
    ]
    return candidates.find((c) => existsSync(c)) || { missing: clean }
  }
  const base = path.dirname(fromFile)
  const abs = path.resolve(base, clean)
  const candidates = [abs, abs + '.md', path.join(abs, 'index.md')]
  return candidates.find((c) => existsSync(c)) || { missing: raw }
}

const files = await walk(DOCS)
const cache = new Map()
async function content(file) {
  if (!cache.has(file)) cache.set(file, await readFile(file, 'utf8'))
  return cache.get(file)
}

for (const file of files) {
  const md = await content(file)
  const rel = path.relative(DOCS, file).replace(/\\/g, '/')
  // Markdown 链接与图片
  const re = /(!?)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  let m
  while ((m = re.exec(md))) {
    const raw = m[2]
    const isImage = m[1] === '!'
    const target = resolveTarget(file, raw)
    if (!target) continue
    if (typeof target === 'object') {
      ;(isImage ? errors : errors).push(`${rel}: 无法解析 ${isImage ? '图片' : '链接'} -> ${raw}`)
      continue
    }
    const anchor = raw.split('#')[1]
    if (anchor && target.endsWith('.md')) {
      const targetMd = await content(target)
      if (!headings(targetMd).has(decodeURIComponent(anchor))) {
        warnings.push(`${rel}: 锚点不存在 -> ${raw}`)
      }
    }
  }
  // HTML href 绝对路径（组件里的链接）
  const hrefRe = /href="(\/[^"#?]*)"/g
  while ((m = hrefRe.exec(md))) {
    const target = resolveTarget(file, m[1])
    if (!target) continue
    if (typeof target === 'object') errors.push(`${rel}: HTML 链接不存在 -> ${m[1]}`)
  }
}

// 侧边栏链接必须存在
const config = await readFile(path.join(DOCS, '.vitepress', 'config.mts'), 'utf8')
const sidebarLinks = [...config.matchAll(/link: '(\/[^']+)'/g)].map((m) => m[1])
for (const link of sidebarLinks) {
  const target = resolveTarget(path.join(DOCS, 'index.md'), link)
  if (!target || typeof target === 'object') {
    errors.push(`侧边栏链接不存在: ${link}`)
  }
}

if (warnings.length) {
  console.log(`⚠ ${warnings.length} 个锚点警告`)
  for (const w of warnings.slice(0, 30)) console.log('  ' + w)
}
if (errors.length) {
  console.error(`✖ ${errors.length} 个链接错误`)
  for (const e of errors.slice(0, 50)) console.error('  ' + e)
  process.exit(1)
}
console.log(`✓ 链接检查通过（${files.length} 个 Markdown 文件，${sidebarLinks.length} 个侧边栏链接）`)
