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

  test('forgot-password page renders with accessible recovery controls', async ({
    page,
  }) => {
    const authPage = new AuthPage(page)

    await authPage.gotoForgotPassword()
    await authPage.expectForgotPasswordVisible()
  })

  test('privacy policy page renders with minimum public legal content', async ({
    page,
  }) => {
    const authPage = new AuthPage(page)

    await authPage.gotoPrivacyPolicy()
    await authPage.expectPrivacyPolicyVisible()
  })

  test('reset-password page shows invalid state without recovery session', async ({
    page,
  }) => {
    const authPage = new AuthPage(page)

    await authPage.gotoResetPassword()
    await authPage.expectResetPasswordInvalidState()
  })

  test('terms page renders with minimum public legal content', async ({
    page,
  }) => {
    const authPage = new AuthPage(page)

    await authPage.gotoTerms()
    await authPage.expectTermsVisible()
  })

  test('signup callback falls back to login with confirmed email prefilled when no session is opened', async ({
    page,
  }) => {
    const authPage = new AuthPage(page)
    const email = 'maria@wellstudio.test'

    await authPage.gotoAuthCallback(email)
    await authPage.expectConfirmedLoginFallback(email)
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
