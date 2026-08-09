import { expect, test } from '@playwright/test'

import { buildCreditPackPurchaseEmail } from '@/modules/notifications/server/credit-pack-purchase-email'

const payload = {
  paymentId: 'payment-e2e',
  memberName: 'Ana Socio',
  productName: 'Bono flexible · 8 reservas',
  credits: 8,
  amount: 7200,
  currency: 'EUR',
  purchasedAt: '2026-08-09T10:00:00.000Z',
  expiresAt: '2026-10-08T10:00:00.000Z',
}

test('purchase confirmation email is focused and responsive on mobile', async ({ page }, testInfo) => {
  const email = buildCreditPackPurchaseEmail({
    payload,
    accountUrl: 'https://wellstudio.miguelgarglez.com/app/account',
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.setContent(email.html)

  await expect(page.getByRole('heading', { name: 'Tu bono ya está activo' })).toBeVisible()
  await expect(page.getByText('Bono flexible · 8 reservas')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver mi saldo' })).toHaveAttribute(
    'href',
    'https://wellstudio.miguelgarglez.com/app/account',
  )
  await expect(page.getByText(/no sustituye una factura fiscal/)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)

  const screenshot = testInfo.outputPath('credit-pack-purchased-email-mobile.png')
  await page.screenshot({ path: screenshot, fullPage: true })
  await testInfo.attach('credit-pack-purchased-email-mobile', {
    path: screenshot,
    contentType: 'image/png',
  })
})

test('purchase confirmation email keeps hierarchy on desktop', async ({ page }, testInfo) => {
  const email = buildCreditPackPurchaseEmail({
    payload,
    accountUrl: 'https://wellstudio.miguelgarglez.com/app/account',
  })

  await page.setViewportSize({ width: 900, height: 900 })
  await page.setContent(email.html)

  await expect(page.getByText('72,00')).toBeVisible()
  await expect(page.getByText('8 reservas', { exact: true })).toBeVisible()
  const screenshot = testInfo.outputPath('credit-pack-purchased-email-desktop.png')
  await page.screenshot({ path: screenshot, fullPage: true })
  await testInfo.attach('credit-pack-purchased-email-desktop', {
    path: screenshot,
    contentType: 'image/png',
  })
})
