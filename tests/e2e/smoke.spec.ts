import { expect, test } from '@playwright/test'

test('public shell routes are reachable @smoke', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Modular monolith bootstrap' })).toBeVisible()
  await expect(page.getByText('WellStudio V1')).toBeVisible()

  await page.getByRole('link', { name: 'Member App' }).click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.getByRole('heading', { name: 'Member App' })).toBeVisible()

  await page.goto('/')
  await page.getByRole('link', { name: 'Admin' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible()
})
