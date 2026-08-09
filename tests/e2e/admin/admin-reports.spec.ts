import { expect, test } from '@playwright/test'

import { ensureSandboxAdminAccess, loginAsSandboxAdmin } from '../support/auth'
import {
  cleanupSandboxAdminReportsFixture,
  prepareSandboxAdminReportsFixture,
  REPORTS_OLDER_CLASS,
  REPORTS_OLDER_SOURCE,
  REPORTS_RECENT_CLASS,
  REPORTS_SOURCE,
} from '../support/admin-reports'
import {
  hasSandboxAdminCredentials,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
  loadE2EEnvFiles,
} from '../support/env'

loadE2EEnvFiles()

test.describe('Admin operational reports @admin @sandbox', () => {
  test.describe.configure({ mode: 'serial' })

  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxCredentials() || !hasSandboxAdminCredentials(),
    'Sandbox auth credentials are not configured',
  )

  test.beforeAll(async () => {
    await ensureSandboxAdminAccess()
    await prepareSandboxAdminReportsFixture()
  })

  test.afterAll(async () => {
    await cleanupSandboxAdminReportsFixture()
  })

  test('explains a seven-day report and expands to 28 days', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.goto('/admin/reports?window=7d')

    await expect(page.getByRole('heading', { name: 'Informes' })).toBeVisible()
    await expect(page.getByText(REPORTS_RECENT_CLASS, { exact: true })).toBeVisible()
    await expect(page.getByText(REPORTS_SOURCE, { exact: true })).toBeVisible()
    await expect(page.getByText(REPORTS_OLDER_CLASS, { exact: true })).toHaveCount(0)
    await expect(page.getByText('Calidad de datos pendiente')).toBeVisible()

    const desktopScreenshot = 'test-results/admin-reports-7d-desktop.png'
    await page.screenshot({ path: desktopScreenshot, fullPage: true })
    await testInfo.attach('admin-reports-7d-desktop', {
      path: desktopScreenshot,
      contentType: 'image/png',
    })

    await page.getByRole('link', { name: '28 días' }).click()
    await expect(page).toHaveURL('/admin/reports?window=28d')
    await expect(page.getByText(REPORTS_OLDER_CLASS, { exact: true })).toBeVisible()
    await expect(page.getByText(REPORTS_OLDER_SOURCE, { exact: true })).toBeVisible()
  })

  test('keeps reports and navigation usable on mobile', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsSandboxAdmin(page)
    await page.goto('/admin/reports?window=28d')

    await expect(page.getByRole('heading', { name: 'Informes' })).toBeVisible()
    const mobileNavigation = page.getByLabel('Navegación admin móvil')
    const reportsLink = mobileNavigation.getByRole('link', { name: 'Informes' })
    await expect(reportsLink).toBeVisible()
    await expect(page.getByText(REPORTS_RECENT_CLASS, { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const [navigationBox, reportsLinkBox] = await Promise.all([
      mobileNavigation.boundingBox(),
      reportsLink.boundingBox(),
    ])
    expect(navigationBox).not.toBeNull()
    expect(reportsLinkBox).not.toBeNull()
    expect(reportsLinkBox!.x).toBeGreaterThanOrEqual(navigationBox!.x)
    expect(reportsLinkBox!.x + reportsLinkBox!.width).toBeLessThanOrEqual(
      navigationBox!.x + navigationBox!.width,
    )

    const mobileScreenshot = 'test-results/admin-reports-28d-mobile.png'
    await page.screenshot({ path: mobileScreenshot })
    await testInfo.attach('admin-reports-28d-mobile', {
      path: mobileScreenshot,
      contentType: 'image/png',
    })

    await page.goto('/admin/notifications')
    const deliveriesLink = page.getByLabel('Navegación admin móvil').getByRole('link', { name: 'Entregas' })
    await expect(deliveriesLink).toBeVisible()
    await expect.poll(async () => {
      const [navBox, linkBox] = await Promise.all([
        page.getByLabel('Navegación admin móvil').boundingBox(),
        deliveriesLink.boundingBox(),
      ])
      return Boolean(
        navBox
        && linkBox
        && linkBox.x >= navBox.x
        && linkBox.x + linkBox.width <= navBox.x + navBox.width,
      )
    }).toBe(true)
  })
})
