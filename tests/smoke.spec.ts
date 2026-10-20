import { expect, test } from '@playwright/test'

test.describe('首页', () => {
  test('首屏内容与导航可见', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/AzurPilot/)
    await expect(page.locator('.VPHero h1')).toContainText('AzurPilot')
    await expect(page.locator('.VPFeature')).toHaveCount(6)
    const nav = page.locator('.VPNavBarMenuLink')
    expect(await nav.count()).toBeGreaterThanOrEqual(5)
  })

  test('三项目入口指向各自手册', async ({ page }) => {
    await page.goto('/')
    for (const href of ['/azurpilot/', '/android/', '/launcher/']) {
      await expect(page.locator(`.VPFeature[href="${href}"]`)).toBeVisible()
    }
  })

  test('本地搜索能命中中文术语', async ({ page }) => {
    await page.goto('/')
    await page.locator('.DocSearch-Button').click()
    const input = page.locator('.search-input')
    await expect(input).toBeVisible()
    await input.fill('智能调度')
    await expect(page.locator('.results li').first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('文档页', () => {
  test('侧边栏、目录与正文结构完整', async ({ page }) => {
    await page.goto('/azurpilot/user/scheduler')
    await expect(page.locator('h1')).toContainText('调度器')
    await expect(page.locator('.VPSidebarItem.is-active').first()).toBeVisible()
    const outline = page.locator('.VPDocAsideOutline .outline-link')
    expect(await outline.count()).toBeGreaterThan(3)
    await expect(page.locator('.vp-doc h2').first()).toContainText('任务的状态')
  })

  test('目录跳转更新 URL 并定位标题', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', '移动端目录在抽屉中，另有测试')
    await page.goto('/azurpilot/user/scheduler')
    const link = page.locator('.VPDocAsideOutline .outline-link').nth(2)
    const href = await link.getAttribute('href')
    await link.click()
    await expect.poll(() => decodeURIComponent(new URL(page.url()).hash)).toBe(href)
    await expect(page.locator(href!)).toBeVisible()
  })

  test('上一篇 / 下一篇可用', async ({ page }) => {
    await page.goto('/guide/install')
    const next = page.locator('.pager-link.next')
    await expect(next).toBeVisible()
    await next.click()
    await expect(page).toHaveURL(/first-run/)
  })

  test('代码复制按钮写入剪贴板', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/guide/install')
    const copy = page.locator('.vp-doc .copy').first()
    await copy.click()
    const text = await page.evaluate(() => navigator.clipboard.readText())
    expect(text.length).toBeGreaterThan(0)
  })

  test('表格在移动端不产生页面横向滚动', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/reference/config')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})

test.describe('交互与状态', () => {
  test('主题切换持久化', async ({ page }, testInfo) => {
    await page.goto('/guide/')
    const html = page.locator('html')
    const before = await html.getAttribute('class')
    if (testInfo.project.name === 'mobile') {
      await page.locator('.VPNavBarHamburger').click()
      await page.locator('.VPNavScreen .VPSwitchAppearance').click()
    } else {
      await page.locator('.VPSwitchAppearance').first().click()
    }
    await page.waitForTimeout(400)
    const after = await html.getAttribute('class')
    expect(after).not.toBe(before)
  })

  test('移动端本页目录可展开并跳转', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', '桌面端使用右侧目录')
    await page.goto('/azurpilot/user/scheduler')
    await page.locator('.VPLocalNavOutlineDropdown button').click()
    const link = page.locator('.VPLocalNavOutlineDropdown .outline-link').nth(1)
    const href = await link.getAttribute('href')
    await link.click()
    await expect.poll(() => decodeURIComponent(new URL(page.url()).hash)).toBe(href)
  })

  test('移动端菜单可展开并跳转', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.locator('.VPNavBarHamburger').click()
    const link = page.locator('.VPNavScreenMenuLink', { hasText: '开始使用' })
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/guide\//)
  })

  test('404 页面有明确出口', async ({ page }) => {
    const res = await page.goto('/not-a-real-page')
    expect(res?.status()).toBe(404)
    await expect(page.locator('body')).toContainText('页面不在航线上')
    await page.locator('.NotFound a').first().click()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('无障碍与降级', () => {
  test('键盘可聚焦跳过导航链接', async ({ page }) => {
    await page.goto('/guide/')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.className || '')
    expect(focused).toContain('VPSkipLink')
  })

  test('reduced motion 下内容仍可见', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('.VPHero h1')).toBeVisible()
    const opacity = await page.locator('.VPHero h1').evaluate((el) => getComputedStyle(el).opacity)
    expect(Number(opacity)).toBe(1)
  })
})
