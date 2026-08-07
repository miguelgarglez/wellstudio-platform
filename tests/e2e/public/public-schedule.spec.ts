import { expect, test } from '@playwright/test'

import {
  hasPublicScheduleDatabase,
  preparePublicScheduleFixture,
  PUBLIC_SCHEDULE_E2E_CLASS,
} from '../support/public-schedule'

test.describe('Public schedule @public @sandbox', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasPublicScheduleDatabase(), 'DATABASE_URL is not configured')

  let sessionId = ''
  let hiddenSessionId = ''

  test.beforeAll(async () => {
    const fixture = await preparePublicScheduleFixture()
    sessionId = fixture.sessionId
    hiddenSessionId = fixture.hiddenSessionId
  })

  test('anonymous visitor explores a published session and continues to login', async ({ page }, testInfo) => {
    await page.goto('/classes')

    await expect(page.getByRole('heading', { name: 'Encuentra tu próxima sesión' })).toBeVisible()
    const sessionLink = page.getByRole('link', { name: new RegExp(PUBLIC_SCHEDULE_E2E_CLASS) })
    await expect(sessionLink).toContainText('2 últimas plazas')
    await testInfo.attach('public-schedule-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })

    await sessionLink.click()
    await expect(page).toHaveURL(`/classes/${sessionId}`)
    await expect(page.getByRole('heading', { name: PUBLIC_SCHEDULE_E2E_CLASS })).toBeVisible()
    await expect(page.getByText('Sala E2E Pública')).toBeVisible()
    await testInfo.attach('public-session-detail-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await page.getByRole('link', { name: 'Acceder y reservar' }).click()
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fapp%2Freservations|\/login\?redirectTo=\/app\/reservations/)
  })

  test('draft sessions are unavailable from both list and direct URL', async ({ page }) => {
    await page.goto('/classes')
    await expect(page.getByText('E2E Clase Privada')).toHaveCount(0)

    await page.goto(`/classes/${hiddenSessionId}`)
    await expect(page.getByRole('heading', { name: 'Esta página no está disponible' })).toBeVisible()
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)
  })

  test('mobile agenda remains scannable without horizontal overflow', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/classes')

    await expect(page.getByText(PUBLIC_SCHEDULE_E2E_CLASS)).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await testInfo.attach('public-schedule-mobile', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })

    await page.getByRole('link', { name: new RegExp(PUBLIC_SCHEDULE_E2E_CLASS) }).click()
    await expect(page.getByRole('heading', { name: PUBLIC_SCHEDULE_E2E_CLASS })).toBeVisible()
    const detailOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(detailOverflow).toBeLessThanOrEqual(1)
    await testInfo.attach('public-session-detail-mobile', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  })
})
