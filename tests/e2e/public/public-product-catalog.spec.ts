import { expect, test } from '@playwright/test'

import {
  hasPublicProductCatalogDatabase,
  preparePublicProductCatalogFixture,
  PRIVATE_PACK_E2E_NAME,
  PRIVATE_PLAN_E2E_NAME,
  PUBLIC_PACK_E2E_NAME,
  PUBLIC_PLAN_E2E_NAME,
} from '../support/public-product-catalog'

test.describe('Public product catalog @public @sandbox', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasPublicProductCatalogDatabase(), 'DATABASE_URL is not configured')

  test.beforeAll(async () => {
    await preparePublicProductCatalogFixture()
  })

  test('visitor compares public plans and packs without a fake purchase flow', async ({ page }, testInfo) => {
    await page.goto('/plans')

    await expect(page.getByRole('heading', { name: 'Entrena con el ritmo que necesitas' })).toBeVisible()
    const plan = page.getByRole('article').filter({ hasText: PUBLIC_PLAN_E2E_NAME })
    await expect(plan).toContainText('89,50 €')
    await expect(plan).toContainText('3 reservas por semana')
    const pack = page.getByRole('article').filter({ hasText: PUBLIC_PACK_E2E_NAME })
    await expect(pack).toContainText('65,00 €')
    await expect(pack).toContainText('5 reservas')
    await expect(pack).toContainText('90 días')
    await expect(page.getByText(PRIVATE_PLAN_E2E_NAME)).toHaveCount(0)
    await expect(page.getByText(PRIVATE_PACK_E2E_NAME)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /comprar|pagar/i })).toHaveCount(0)

    await testInfo.attach('public-product-catalog-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })

    await plan.getByRole('link', { name: 'Consultar este plan' }).click()
    await expect(page).toHaveURL(/\/#contacto$/)
    await expect(page.locator('#contacto')).toBeVisible()
  })

  test('mobile catalog preserves comparison hierarchy without overflow', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/plans')

    await expect(page.getByText(PUBLIC_PLAN_E2E_NAME)).toBeVisible()
    await expect(page.getByText(PUBLIC_PACK_E2E_NAME)).toBeVisible()
    const mobilePlan = page.getByRole('article').filter({ hasText: PUBLIC_PLAN_E2E_NAME })
    const titleBox = await mobilePlan.getByRole('heading', { name: PUBLIC_PLAN_E2E_NAME }).boundingBox()
    const priceBox = await mobilePlan.getByText('89,50 €', { exact: true }).boundingBox()
    expect(titleBox && priceBox && titleBox.y + titleBox.height <= priceBox.y).toBe(true)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await testInfo.attach('public-product-catalog-mobile', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  })
})
