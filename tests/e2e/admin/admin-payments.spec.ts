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
  ADMIN_PAYMENT_FAILED_ID,
  ADMIN_PAYMENT_PACK_NAME,
  prepareSandboxAdminPaymentsFixture,
} from '../support/admin-payments'

loadE2EEnvFiles()

test.describe('Admin payments monitor @admin @payments @sandbox', () => {
  test.describe.configure({ mode: 'serial' })

  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxCredentials() || !hasSandboxAdminCredentials(),
    'Sandbox auth credentials are not configured',
  )

  test.beforeAll(async () => {
    await ensureSandboxAdminAccess()
    await prepareSandboxAdminPaymentsFixture()
  })

  test('member cannot access payment operations', async ({ page }) => {
    await loginAsSandboxMember(page)
    const response = await page.goto('/admin/payments')
    expect(response?.status()).toBe(404)
  })

  test('admin searches, filters and inspects a failed payment', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.goto('/admin/payments')

    await expect(page.getByRole('heading', { name: 'Cobros', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Fallidos', exact: true }).click()
    await expect(page).toHaveURL(/status=failed/)

    await page.getByLabel('Buscar cobro por socio o email').fill(process.env.E2E_MEMBER_EMAIL ?? '')
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()
    await expect(page).toHaveURL(/q=/)
    await expect(page.getByText(ADMIN_PAYMENT_PACK_NAME).first()).toBeVisible()

    await page.getByRole('link', { name: new RegExp(ADMIN_PAYMENT_PACK_NAME) }).first().click()
    await expect(page).toHaveURL(new RegExp(`payment=${ADMIN_PAYMENT_FAILED_ID}`))

    const detail = page.getByRole('region', { name: ADMIN_PAYMENT_PACK_NAME })
    await expect(detail.getByText('Este cobro requiere revisión')).toBeVisible()
    await expect(detail.getByText('Evento fallido').first()).toBeVisible()
    await expect(detail.getByText('Checkout confirmado')).toBeVisible()
    await expect(detail).not.toContainText('fixture')

    const screenshot = testInfo.outputPath('admin-payments-failed-desktop.png')
    await page.screenshot({ path: screenshot, fullPage: true })
    await testInfo.attach('admin-payments-failed-desktop', { path: screenshot, contentType: 'image/png' })
  })

  test('mobile detail is full width and closes without losing filters', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/admin/payments?status=failed&payment=${ADMIN_PAYMENT_FAILED_ID}`)

    const detail = page.getByRole('dialog', { name: ADMIN_PAYMENT_PACK_NAME })
    const box = await detail.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(388)
    await expect(detail.getByText('Referencias seguras')).toBeVisible()

    const screenshot = testInfo.outputPath('admin-payments-failed-mobile.png')
    await page.screenshot({ path: screenshot })
    await testInfo.attach('admin-payments-failed-mobile', { path: screenshot, contentType: 'image/png' })

    await detail.getByRole('button', { name: 'Cerrar' }).click()
    await expect(page).toHaveURL('/admin/payments?status=failed')
  })
})
