import { expect, test } from '@playwright/test'

import {
  ensureSandboxAdminAccess,
  loginAsSandboxAdmin,
  loginAsSandboxMember,
} from '../support/auth'
import {
  hasSandboxAdminCredentials,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
  loadE2EEnvFiles,
} from '../support/env'
import {
  ADMIN_NOTIFICATIONS_FAILED_JOB_ID,
  ADMIN_NOTIFICATIONS_FAILED_RECIPIENT,
  ADMIN_NOTIFICATIONS_PURCHASE_JOB_ID,
  ADMIN_NOTIFICATIONS_PURCHASE_RECIPIENT,
  prepareSandboxAdminNotificationsFixture,
  readSandboxAdminNotificationRetryState,
} from '../support/admin-notifications'

loadE2EEnvFiles()

test.describe('Admin notification deliveries @admin @sandbox', () => {
  test.describe.configure({ mode: 'serial' })

  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxCredentials() || !hasSandboxAdminCredentials(),
    'Sandbox auth credentials are not configured',
  )

  test.beforeAll(async () => {
    await ensureSandboxAdminAccess()
    await prepareSandboxAdminNotificationsFixture()
  })

  test('member cannot access transactional deliveries', async ({ page }) => {
    await loginAsSandboxMember(page)
    const response = await page.goto('/admin/notifications')

    expect(response?.status()).toBe(404)
  })

  test('admin filters, inspects and retries an exhausted failure', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.goto('/admin/notifications')

    await expect(page.getByRole('heading', { name: 'Entregas', exact: true })).toBeVisible()
    await expect(page.getByText('Requieren atención').locator('..').getByText('1', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Fallidas', exact: true }).click()
    await expect(page).toHaveURL(/status=failed/)
    await page.getByRole('link', { name: new RegExp(ADMIN_NOTIFICATIONS_FAILED_RECIPIENT) }).click()
    await expect(page).toHaveURL(new RegExp(`delivery=${ADMIN_NOTIFICATIONS_FAILED_JOB_ID}`))

    const detail = page.getByRole('region', { name: 'Promoción desde waitlist' })
    await expect(detail.getByText('La última entrega ha fallado')).toBeVisible()
    await expect(detail.getByText('Intento 5 · Fallido')).toBeVisible()
    await expect(detail.getByRole('button', { name: 'Reintentar ahora' })).toBeVisible()

    const desktopScreenshot = testInfo.outputPath('admin-notifications-failed-desktop.png')
    await page.screenshot({ path: desktopScreenshot, fullPage: true })
    await testInfo.attach('admin-notifications-failed-desktop', {
      path: desktopScreenshot,
      contentType: 'image/png',
    })

    await detail.getByRole('button', { name: 'Reintentar ahora' }).click()
    const confirmation = page.getByRole('alertdialog', { name: 'Reintentar esta entrega' })
    await expect(confirmation.getByText('sin borrar los 5 anteriores')).toBeVisible()
    await confirmation.getByRole('button', { name: 'Confirmar reintento' }).click()

    await expect(page.getByRole('status').getByText('Reintento programado')).toBeVisible()
    await expect
      .poll(() => readSandboxAdminNotificationRetryState(), { timeout: 20_000 })
      .toMatchObject({
        attemptCount: 6,
        latestAttempt: { attemptNumber: 6 },
        auditCount: 1,
      })
  })

  test('mobile detail is full width and keeps operational context', async ({ page }, testInfo) => {
    await prepareSandboxAdminNotificationsFixture()
    await loginAsSandboxAdmin(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(
      `/admin/notifications?status=failed&delivery=${ADMIN_NOTIFICATIONS_FAILED_JOB_ID}`,
    )

    const detail = page.getByRole('dialog', { name: 'Promoción desde waitlist' })
    const box = await detail.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(388)
    await expect(detail.getByText(ADMIN_NOTIFICATIONS_FAILED_RECIPIENT)).toBeVisible()

    const mobileScreenshot = testInfo.outputPath('admin-notifications-failed-mobile.png')
    await page.screenshot({ path: mobileScreenshot })
    await testInfo.attach('admin-notifications-failed-mobile', {
      path: mobileScreenshot,
      contentType: 'image/png',
    })

    await detail.getByRole('button', { name: 'Cerrar' }).click()
    await expect(page).toHaveURL('/admin/notifications?status=failed')
  })

  test('admin filters purchase confirmations and reads their safe context', async ({ page }, testInfo) => {
    await prepareSandboxAdminNotificationsFixture()
    await loginAsSandboxAdmin(page)
    await page.goto('/admin/notifications')

    await page.getByRole('link', { name: 'Compras', exact: true }).click()
    await expect(page).toHaveURL(/event=purchase/)
    await page.getByRole('link', { name: new RegExp(ADMIN_NOTIFICATIONS_PURCHASE_RECIPIENT) }).click()
    await expect(page).toHaveURL(new RegExp(`delivery=${ADMIN_NOTIFICATIONS_PURCHASE_JOB_ID}`))

    const detail = page.getByRole('region', { name: 'Compra de bono' })
    await expect(detail.getByRole('heading', { name: 'Compra comunicada' })).toBeVisible()
    await expect(detail.getByText('E2E Bono Flexible')).toBeVisible()
    await expect(detail.getByText('54,00\u00a0€')).toBeVisible()

    const screenshot = testInfo.outputPath('admin-notifications-purchase-desktop.png')
    await page.screenshot({ path: screenshot, fullPage: true })
    await testInfo.attach('admin-notifications-purchase-desktop', {
      path: screenshot,
      contentType: 'image/png',
    })
  })
})
