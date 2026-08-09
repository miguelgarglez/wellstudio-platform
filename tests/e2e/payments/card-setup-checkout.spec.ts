import { expect, test } from '@playwright/test'

import { loginAsSandboxMember } from '../support/auth'
import {
  getMissingSandboxAuthEnv,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
} from '../support/env'
import {
  cleanupCardSetupFixture,
  hasPaymentsDatabase,
  prepareCardSetupFixture,
  readCardSetupFixtureState,
} from '../support/card-setup'

test.describe('Card setup checkout @sandbox @payments', () => {
  test.describe.configure({ mode: 'serial' })

  const setupIssue = !isSandboxAuthEnabled() || !hasSandboxCredentials()
    ? getMissingSandboxAuthEnv().join(', ')
    : !hasPaymentsDatabase()
      ? 'DATABASE_URL is required'
      : null

  test.skip(Boolean(setupIssue), setupIssue ?? 'Card setup sandbox suite is enabled.')

  let fixture: Awaited<ReturnType<typeof prepareCardSetupFixture>>

  test.beforeAll(async () => {
    fixture = await prepareCardSetupFixture()
  })

  test.afterAll(async () => {
    if (fixture) await cleanupCardSetupFixture(fixture.memberId)
  })

  test.beforeEach(async ({ page }) => {
    await cleanupCardSetupFixture(fixture.memberId)
    await loginAsSandboxMember(page)
    await page.goto('/app/account')
    await expect(page.getByRole('heading', { name: 'Cuenta y pagos' })).toBeVisible()
  })

  test('canceling card setup never persists a card', async ({ page }) => {
    await page.getByRole('button', { name: 'Vincular tarjeta' }).click()
    await expect(page).toHaveURL(/\/checkout\/sandbox\/card\?payment=/)
    await expect(page.getByRole('heading', { name: 'Confirma tu tarjeta' })).toBeVisible()
    await page.screenshot({ path: 'test-results/card-setup-sandbox-desktop.png' })
    await page.getByRole('button', { name: 'Cancelar' }).click()

    await expect(page).toHaveURL(/card=canceled/)
    await expect(page.getByRole('status')).toContainText('Vinculación cancelada')

    const state = await readCardSetupFixtureState(fixture.memberId)
    expect(state.payments).toHaveLength(1)
    expect(state.payments[0]?.status).toBe('CANCELED')
    expect(state.cards).toHaveLength(0)
  })

  test('confirmed card setup stores one default card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await page.getByRole('button', { name: 'Vincular tarjeta' }).click()
    await expect(page).toHaveURL(/\/checkout\/sandbox\/card\?payment=/)
    await expect(page.getByRole('heading', { name: 'Confirma tu tarjeta' })).toBeVisible()
    await page.screenshot({ path: 'test-results/card-setup-sandbox-mobile.png' })
    await page.getByRole('button', { name: 'Confirmar vinculación de prueba' }).click()

    await expect(page).toHaveURL(/card=success/)
    await expect(page.getByRole('status')).toContainText('Tarjeta vinculada')
    await expect(page.getByText('Visa terminada en 4242').first()).toBeVisible()

    const state = await readCardSetupFixtureState(fixture.memberId)
    expect(state.payments).toHaveLength(1)
    expect(state.payments[0]?.status).toBe('SUCCEEDED')
    expect(state.cards).toHaveLength(1)
    expect(state.cards[0]).toMatchObject({
      brand: 'Visa',
      last4: '4242',
      isDefault: true,
      status: 'ACTIVE',
    })
  })
})
