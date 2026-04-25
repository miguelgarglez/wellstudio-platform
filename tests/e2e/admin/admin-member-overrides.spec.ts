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
    test.setTimeout(90_000)

    const { email } = getSandboxCredentials()

    await loginAsSandboxAdmin(page)
    await page.goto(`/admin/overrides?q=${encodeURIComponent(email)}`)

    await expect(page.getByRole('heading', { name: 'Excepciones de reserva' })).toBeVisible()
    await page
      .getByRole('link', { name: /e2e\.member\.sandbox@wellstudio\.test/i })
      .click()

    await expect(page).toHaveURL(/\/admin\/overrides\?q=.*&member=/)

    const membershipLink = page.getByRole('link', { name: /E2E Membership Flow/i }).first()
    await membershipLink.click()

    await expect(page).toHaveURL(/membership=/)

    await page.getByRole('dialog', { name: 'Operar excepción' }).getByLabel('Reservas extra').fill('2')
    await page.getByLabel('Razón operativa').first().fill('Compensación puntual QA')
    await page
      .getByRole('dialog', { name: 'Operar excepción' })
      .getByRole('button', { name: 'Conceder reservas extra' })
      .click()

    await expect(page).toHaveURL(/updated=extra/, { timeout: 15_000 })
    await expect(page.getByText('Reservas extra concedidas')).toBeVisible()
    await expect(page.getByText('+2 reservas en el periodo actual')).toBeVisible()

    await membershipLink.click()
    await page.getByRole('button', { name: 'Acceso puntual' }).click()
    const operationSheet = page.getByRole('dialog', { name: 'Operar excepción' })
    await operationSheet.getByRole('button', { name: 'Elegir sesión' }).first().click()
    await operationSheet.getByRole('button', { name: /E2E Strength Flow/i }).first().click()

    await expect(page).toHaveURL(/session=/)
    await page
      .getByRole('dialog', { name: 'Operar excepción' })
      .locator('#session-reason-input')
      .fill('Acceso puntual para validar el flujo de override')
    await page
      .getByRole('dialog', { name: 'Operar excepción' })
      .getByRole('button', { name: 'Conceder acceso puntual' })
      .click()

    await expect(page).toHaveURL(/updated=session/, { timeout: 15_000 })
    await expect(page.getByText('Acceso puntual concedido')).toBeVisible()
    await expect(
      page.getByText('Acceso puntual para validar el flujo de override'),
    ).toBeVisible()

    const firstOverrideCard = page.locator('article').first()
    await firstOverrideCard.getByRole('button', { name: 'Revocar excepción' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Confirmar revocación' })
      .click()

    await expect(page).toHaveURL(/updated=revoked/, { timeout: 15_000 })
    await expect(page.getByText('Excepción revocada')).toBeVisible()

    await page.reload()

    await expect(page.getByText('Revocado').first()).toBeVisible()
  })
})
