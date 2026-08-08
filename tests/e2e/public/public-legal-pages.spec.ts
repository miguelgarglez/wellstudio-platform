import { expect, test } from '@playwright/test'

const legalPages = [
  {
    path: '/privacy-policy',
    title: 'Política de privacidad | WellStudio',
    heading: 'Política de privacidad',
    currentLink: 'Privacidad',
    sectionHeading: 'Finalidad del tratamiento',
  },
  {
    path: '/terms',
    title: 'Condiciones de uso | WellStudio',
    heading: 'Condiciones de uso',
    currentLink: 'Condiciones',
    sectionHeading: 'Operativa del centro y servicios',
  },
] as const

for (const legalPage of legalPages) {
  test(`${legalPage.heading} remains readable and complete`, async ({ page }, testInfo) => {
    await page.goto(legalPage.path)

    await expect(page).toHaveTitle(legalPage.title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`${legalPage.path}$`),
    )
    await expect(page.getByRole('heading', { level: 1, name: legalPage.heading })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: legalPage.sectionHeading })).toBeVisible()
    const legalNavigation = page.getByRole('navigation', { name: 'Navegación legal' })
    await expect(
      legalNavigation.getByRole('link', { name: legalPage.currentLink, exact: true }),
    ).toHaveAttribute('aria-current', 'page')
    await expect(legalNavigation).toBeVisible()
    await expect(page.getByRole('contentinfo')).toHaveCount(1)

    if (legalPage.path === '/privacy-policy') {
      await page.screenshot({
        path: testInfo.outputPath('legal-privacy-desktop.png'),
        fullPage: true,
      })
    }
  })
}

test('legal pages remain overflow-free on mobile', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/privacy-policy')

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await expect(page.getByRole('link', { name: 'wellstudiofit@gmail.com' }).first()).toBeVisible()

  await page.screenshot({
    path: testInfo.outputPath('legal-privacy-mobile.png'),
    fullPage: true,
  })
})
