/**
 * 生成图标与 OG 封面。
 *
 * 品牌素材只使用项目自带 logo：docs/public/img/azurpilot-logo.webp
 * 该文件是带 alpha 通道的方形透明图，这里只做等比缩放与排版，不修改像素内容。
 */
import { chromium } from 'playwright'
import { readFile, writeFile } from 'node:fs/promises'

const LOGO = 'docs/public/img/azurpilot-logo.webp'
const logoData = `data:image/webp;base64,${(await readFile(LOGO)).toString('base64')}`

const browser = await chromium.launch()

async function shot(html, width, height, out, transparent = false) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'load' })
  await page.screenshot({ path: out, omitBackground: transparent })
  await page.close()
}

/* 图标：等比缩放，保留原始 alpha */
const iconHtml = (size) => `<!doctype html><html><body style="margin:0;background:transparent">
<img src="${logoData}" width="${size}" height="${size}" alt=""
     style="display:block;width:${size}px;height:${size}px">
</body></html>`

await shot(iconHtml(512), 512, 512, 'docs/public/img/icon-512.png', true)
await shot(iconHtml(192), 192, 192, 'docs/public/img/icon-192.png', true)

/* 导航用标记：几何裁出上部徽记，只改裁切范围，不修改任何像素 */
const cropPage = await browser.newPage({ viewport: { width: 600, height: 600 } })
await cropPage.setContent('<html><body></body></html>', { waitUntil: 'load' })
const markDataUrl = await cropPage.evaluate(async (src) => {
  const img = new Image()
  img.src = src
  await img.decode()
  const W = img.naturalWidth
  const H = img.naturalHeight
  const side = Math.round(W * 0.60)
  const sx = Math.round(W * 0.25)
  const sy = Math.round(H * 0.055)
  const S = 320
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, S, S)
  return canvas.toDataURL('image/png')
}, logoData)
await writeFile('docs/public/img/logo-mark.png', Buffer.from(markDataUrl.split(',')[1], 'base64'))
await cropPage.close()

/* OG 封面：浅色底（logo 的深色字在深底上看不清）+ 原始 logo + 站点信息 */
const cover = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:#ffffff;color:#1b1b1f;
    font-family:"Inter","Segoe UI","Microsoft YaHei UI",system-ui,sans-serif;overflow:hidden;position:relative}
  .wrap{position:relative;padding:64px 80px;height:100%;display:flex;flex-direction:column}
  .brand img{width:96px;height:96px;display:block}
  .brand span{display:block;margin-top:10px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;
    font-size:13px;letter-spacing:.24em;color:#8a8a92;text-transform:uppercase}
  h1{margin-top:26px;font-size:54px;line-height:1.14;letter-spacing:-.02em;font-weight:700;max-width:840px}
  h1 em{font-style:normal;color:#3451b2}
  p{margin-top:16px;font-size:19px;line-height:1.6;color:#5a5a63;max-width:640px}
  .row{margin-top:auto;display:flex;gap:44px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;
    font-size:12px;letter-spacing:.08em;color:#8a8a92}
  .row b{display:block;color:#1b1b1f;font-size:26px;letter-spacing:-.01em;margin-bottom:4px;font-weight:600}
  .rule{position:absolute;left:80px;right:80px;bottom:112px;height:1px;background:#e2e2e3}
</style></head><body>
<div class="wrap">
  <div class="brand"><img src="${logoData}" alt=""><span>AzurPilot</span></div>
  <h1>统一文档站<br><em>核心程序 · Android · 启动器</em></h1>
  <p>用户手册、开发者文档、API 与配置参考</p>
  <div class="rule"></div>
  <div class="row">
    <div><b>102</b>TASKS</div>
    <div><b>72</b>WS METHODS</div>
    <div><b>18</b>MCP TOOLS</div>
    <div><b>3</b>REPOSITORIES</div>
  </div>
</div>
</body></html>`

await shot(cover, 1200, 630, 'docs/public/img/og-cover.png')
await browser.close()
console.log(`generated logo-mark.png, icon-192.png, icon-512.png, og-cover.png from ${LOGO}`)
