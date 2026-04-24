import { expect, test } from '@playwright/test'

import { loginAsSandboxAdmin, loginAsSandboxMember } from '../support/auth'
import { prepareSandboxAdminOverridesFixture } from '../support/admin-overrides'
import {
  getSandboxCredentials,
  hasSandboxAdminCredentials,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
  loadE2EEnvFiles,
} from '../support/env'

loadE2EEnvFiles()

test.describe('Admin member overrides @admin @sandbox', () => {
  test.describe.configure({ mode: 'serial' })

  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxCredentials() || !hasSandboxAdminCredentials(),
    'Sandbox auth credentials are not configured',
  )

  test.beforeEach(async () => {
    await prepareSandboxAdminOverridesFixture()
  })

  test('member cannot access admin overrides', async ({ page }) => {
    await loginAsSandboxMember(page)

    const response = await page.goto('/admin/overrides')

    expect(response?.status()).toBe(404)
    await expect(page.getByText('This page could not be found.')).toBeVisible()
  })

  test('admin can grant and revoke booking overrides for a sandbox member', async ({ page }) => {
    const { email } = getSandboxCredentials()

    await loginAsSandboxAdmin(page)
    await page.goto(`/admin/overrides?q=${encodeURIComponent(email)}`)

    await expect(page.getByRole('heading', { name: 'Overrides por socio' })).toBeVisible()
    await page
      .getByRole('link', { name: /e2e\.member\.sandbox@wellstudio\.test/i })
      .click()

    await expect(page).toHaveURL(/\/admin\/overrides\?q=.*&member=/)

    const membershipLink = page.getByRole('link', { name: /E2E Membership Flow/i }).first()
    await membershipLink.click()

    await expect(page).toHaveURL(/membership=/)

    await page.getByLabel('Reservas extra').fill('2')
    await page.getByLabel('Razón operativa').first().fill('Compensación puntual QA')
    await page.getByRole('button', { name: 'Conceder allowance extra' }).click()

    await expect(page).toHaveURL(/updated=extra/)
    await expect(page.getByText('Override concedido')).toBeVisible()
    await expect(page.getByText('+2 reservas en el periodo actual')).toBeVisible()

    const sessionLink = page.getByRole('link', { name: /E2E Strength Flow/i }).first()
    await sessionLink.click()

    await expect(page).toHaveURL(/session=/)
    await page
      .locator('#session-reason-input')
      .fill('Acceso puntual para validar el flujo de override')
    await page.getByRole('button', { name: 'Conceder acceso a sesión' }).click()

    await expect(page).toHaveURL(/updated=session/)
    await expect(page.getByText('Session access concedido')).toBeVisible()
    await expect(
      page.getByText('Acceso puntual para validar el flujo de override'),
    ).toBeVisible()

    const firstOverrideCard = page.locator('article').first()
    await firstOverrideCard.getByText('Revocar override').click()
    await firstOverrideCard.locator('form').evaluate((form: HTMLFormElement) => {
      form.requestSubmit()
    })

    await expect(page).toHaveURL(/updated=revoked/)
    await expect(page.getByText('Override revocado')).toBeVisible()

    await page.reload()

    await expect(page.getByText('Revocado').first()).toBeVisible()
  })
})
