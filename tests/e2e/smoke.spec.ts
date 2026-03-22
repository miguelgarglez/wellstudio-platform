import { expect, test } from '@playwright/test'

test('public shell routes are reachable @smoke', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Quiero conocer el centro' })).toBeVisible()
  await expect(page.locator('a[href="#metodo"]')).toBeVisible()
  await expect(page.locator('a[href="/login"]').first()).toBeVisible()

  await page.locator('a[href="/login"]').first().click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('button[type="submit"]')).toBeVisible()

  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin$/)
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})
