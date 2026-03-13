import { expect, test } from '@playwright/test'

import { AuthPage } from '../page-objects/auth-page'

test.describe('Auth smoke @smoke @auth', () => {
  test('login page renders with accessible form controls', async ({ page }) => {
    const authPage = new AuthPage(page)

    await authPage.gotoLogin()
    await authPage.expectLoginVisible()
  })

  test('register page renders with accessible form controls', async ({
    page,
  }) => {
    const authPage = new AuthPage(page)

    await authPage.gotoRegister()
    await authPage.expectRegisterVisible()
  })

  test('member route redirects unauthenticated visitors to login', async ({
    page,
  }) => {
    await page.goto('/app')

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fapp$/)
    await expect(
      page.getByRole('heading', { name: 'Inicia sesión' }),
    ).toBeVisible()
  })

  test('admin route redirects unauthenticated visitors to login', async ({
    page,
  }) => {
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin$/)
    await expect(
      page.getByRole('heading', { name: 'Inicia sesión' }),
    ).toBeVisible()
  })
})
