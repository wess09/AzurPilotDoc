import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = [
  { path: '/', name: '首页' },
  { path: '/guide/install', name: '安装' },
  { path: '/azurpilot/user/tasks/opsi', name: '大世界手册' },
  { path: '/api/websocket', name: 'API 参考' },
  { path: '/reference/config', name: '配置参考' },
]

for (const p of PAGES) {
  test(`无障碍扫描：${p.name}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', '移动端布局另由响应式测试覆盖')
    await page.goto(p.path)
    await page.waitForTimeout(400)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    if (serious.length) {
      console.log(
        serious
          .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
          .join('\n'),
      )
    }
    expect(serious).toEqual([])
  })
}
