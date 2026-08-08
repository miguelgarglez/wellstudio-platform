import { expect, test } from '@playwright/test'

test.describe('public home', () => {
  test('exposes marketing metadata and semantic landmarks', async ({ page }, testInfo) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Entrenamiento de Fuerza en Madrid | WellStudio')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /centro boutique de entrenamiento de fuerza en Madrid/i,
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /^https?:\/\/[^/]+\/?$/,
    )
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Entrenamiento de Fuerza en Madrid | WellStudio',
    )
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    )

    await expect(page.locator('main#main-content')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('contentinfo')).toHaveCount(1)
    await expect(page.getByRole('navigation', { name: 'Navegación pública' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Enlaces del pie de página' })).toBeVisible()
    await expect(page.locator('img:not([alt])')).toHaveCount(0)
    expect(await page.locator('main img[alt]:not([alt=""])').count()).toBeGreaterThanOrEqual(2)

    const robotsResponse = await page.request.get('/robots.txt')
    expect(await robotsResponse.text()).toContain('Disallow: /admin')
    const sitemapResponse = await page.request.get('/sitemap.xml')
    expect(await sitemapResponse.text()).toContain('/classes</loc>')

    await page.screenshot({
      path: testInfo.outputPath('public-home-desktop.png'),
      fullPage: true,
    })
  })

  test('supports keyboard-first navigation', async ({ page }) => {
    await page.goto('/')

    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Saltar al contenido principal' })
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#main-content')).toBeFocused()

    await page.getByRole('button', { name: '¿Qué tipo de entrenamiento ofrece WellStudio?' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText(/trabaja principalmente el entrenamiento de fuerza/i)).toBeVisible()
  })

  test('keeps mobile navigation and content overflow-free', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const menuTrigger = page.getByRole('button', { name: 'Abrir navegación por secciones' })
    await expect(menuTrigger).toBeVisible()
    await menuTrigger.click()
    await expect(page.getByRole('navigation', { name: 'Secciones de la landing' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Contacto', exact: true }).last()).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)

    await page.screenshot({
      path: testInfo.outputPath('public-home-mobile.png'),
      fullPage: true,
    })
  })
})
