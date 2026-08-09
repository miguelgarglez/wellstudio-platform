import { expect, test } from '@playwright/test'

import { loginAsSandboxMember } from '../support/auth'
import {
  getMissingSandboxAuthEnv,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
} from '../support/env'
import {
  cleanupPaymentsFixture,
  hasPaymentsDatabase,
  PAYMENT_E2E_PACK_NAME,
  preparePaymentsFixture,
  readPaymentsFixtureState,
} from '../support/payments'

test.describe('Credit pack checkout @sandbox @payments', () => {
  test.describe.configure({ mode: 'serial' })

  const setupIssue = !isSandboxAuthEnabled() || !hasSandboxCredentials()
    ? getMissingSandboxAuthEnv().join(', ')
    : !hasPaymentsDatabase()
      ? 'DATABASE_URL is required'
      : null

  test.skip(Boolean(setupIssue), setupIssue ?? 'Payments sandbox suite is enabled.')

  let fixture: Awaited<ReturnType<typeof preparePaymentsFixture>>

  test.beforeAll(async () => {
    fixture = await preparePaymentsFixture()
  })

  test.afterAll(async () => {
    if (fixture) await cleanupPaymentsFixture(fixture.memberId, fixture.creditPackId)
  })

  test.beforeEach(async ({ page }) => {
    await loginAsSandboxMember(page)
    await page.goto('/app/account')
    await expect(page.getByRole('heading', { name: 'Cuenta y pagos' })).toBeVisible()
  })

  test('canceling checkout never grants credits', async ({ page }) => {
    await page.getByRole('button', { name: new RegExp(PAYMENT_E2E_PACK_NAME) }).click()
    const sheet = page.getByRole('dialog', { name: PAYMENT_E2E_PACK_NAME })
    await expect(sheet).toBeVisible()
    await page.waitForTimeout(250)
    await page.screenshot({ path: 'test-results/payment-pack-sheet-desktop.png' })

    await sheet.getByRole('button', { name: /Continuar/ }).click()
    await expect(page).toHaveURL(/\/checkout\/sandbox\?payment=/)
    await expect(page.getByRole('heading', { name: 'Confirma tu bono' })).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).click()

    await expect(page).toHaveURL(/checkout=canceled/)
    await expect(page.getByRole('status')).toContainText('Compra cancelada')

    const state = await readPaymentsFixtureState(fixture.memberId, fixture.creditPackId)
    expect(state.payments).toHaveLength(1)
    expect(state.payments[0]?.status).toBe('CANCELED')
    expect(state.accounts).toHaveLength(0)
  })

  test('confirmed checkout grants one immutable credit account', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await page.getByRole('button', { name: new RegExp(PAYMENT_E2E_PACK_NAME) }).click()
    const sheet = page.getByRole('dialog', { name: PAYMENT_E2E_PACK_NAME })
    await expect(sheet).toBeVisible()
    await sheet.getByRole('button', { name: /Continuar/ }).click()

    await expect(page).toHaveURL(/\/checkout\/sandbox\?payment=/)
    await expect(page.getByRole('heading', { name: 'Confirma tu bono' })).toBeVisible()
    await page.screenshot({ path: 'test-results/payment-sandbox-checkout-mobile.png' })
    await page.getByRole('button', { name: 'Confirmar pago de prueba' }).click()

    await expect(page).toHaveURL(/checkout=success/)
    await expect(page.getByRole('status')).toContainText('Bono activado')
    await expect(page.getByText('6 disponibles')).toBeVisible()
    await page.screenshot({ path: 'test-results/payment-confirmed-account-mobile.png' })

    const state = await readPaymentsFixtureState(fixture.memberId, fixture.creditPackId)
    expect(state.payments.filter((payment) => payment.status === 'SUCCEEDED')).toHaveLength(1)
    expect(state.accounts).toHaveLength(1)
    expect(state.accounts[0]?.ledgerEntries).toEqual([
      expect.objectContaining({ entryType: 'PURCHASE', creditsDelta: 6, balanceAfter: 6 }),
    ])
  })

  test('late provider confirmation updates feedback and balance without a reload', async ({ page }, testInfo) => {
    await page.getByRole('button', { name: new RegExp(PAYMENT_E2E_PACK_NAME) }).click()
    const sheet = page.getByRole('dialog', { name: PAYMENT_E2E_PACK_NAME })
    await sheet.getByRole('button', { name: /Continuar/ }).click()
    await expect(page).toHaveURL(/\/checkout\/sandbox\?payment=/)

    const paymentId = new URL(page.url()).searchParams.get('payment')
    expect(paymentId).toBeTruthy()
    await page.goto(`/app/account?checkout=success&payment=${paymentId}`)
    const processingFeedback = page.getByRole('status').filter({ hasText: 'Estamos confirmando el pago' })
    await expect(processingFeedback).toBeVisible()
    const initialCreditsLocator = page.getByText(/^\d+ disponibles$/).first()
    const initialCreditsLabel = await initialCreditsLocator.count() > 0
      ? await initialCreditsLocator.textContent()
      : null
    const initialCredits = Number(initialCreditsLabel?.match(/^\d+/)?.[0] ?? 0)

    const processingScreenshot = testInfo.outputPath('payment-confirmation-processing.png')
    await page.waitForTimeout(250)
    await page.screenshot({ path: processingScreenshot })
    await testInfo.attach('payment-confirmation-processing', {
      path: processingScreenshot,
      contentType: 'image/png',
    })

    const completed = await page.evaluate(async (pendingPaymentId) => {
      const formData = new FormData()
      formData.set('paymentId', pendingPaymentId)
      const response = await fetch('/checkout/sandbox/confirm', {
        method: 'POST',
        body: formData,
      })
      return response.ok
    }, paymentId!)
    expect(completed).toBe(true)

    const confirmedFeedback = page.getByRole('status').filter({ hasText: 'Bono activado' })
    await expect(confirmedFeedback).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(`${initialCredits + 6} disponibles`)).toBeVisible()

    const confirmedScreenshot = testInfo.outputPath('payment-confirmation-updated.png')
    await page.waitForTimeout(250)
    await page.screenshot({ path: confirmedScreenshot })
    await testInfo.attach('payment-confirmation-updated', {
      path: confirmedScreenshot,
      contentType: 'image/png',
    })
  })

  test('a slow confirmation stays honest and can be checked again', async ({ page }) => {
    await page.getByRole('button', { name: new RegExp(PAYMENT_E2E_PACK_NAME) }).click()
    const sheet = page.getByRole('dialog', { name: PAYMENT_E2E_PACK_NAME })
    await sheet.getByRole('button', { name: /Continuar/ }).click()
    await expect(page).toHaveURL(/\/checkout\/sandbox\?payment=/)

    const paymentId = new URL(page.url()).searchParams.get('payment')
    await page.goto(`/app/account?checkout=success&payment=${paymentId}`)

    const feedback = page.getByRole('status')
    await expect(feedback).toContainText('La confirmación tarda más de lo habitual', {
      timeout: 23_000,
    })
    await expect(feedback.getByRole('button', { name: 'Comprobar ahora' })).toBeVisible()
    await feedback.getByRole('button', { name: 'Comprobar ahora' }).click()
    await expect(feedback).toContainText('Estamos confirmando el pago')
  })
})
