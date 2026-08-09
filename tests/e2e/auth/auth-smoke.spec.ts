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
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('member child routes redirect unauthenticated visitors to login', async ({
    page,
  }) => {
    for (const path of ['/app/reservations', '/app/profile', '/app/account']) {
      await page.goto(path)

      await expect(page).toHaveURL(
        new RegExp(`/login\\?redirectTo=${encodeURIComponent(path).replace(/\//g, '%2F')}$`),
      )
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    }
  })

  test('admin route redirects unauthenticated visitors to login', async ({
    page,
  }) => {
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin$/)
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('checkout keeps its query when redirecting an unauthenticated visitor', async ({ page }) => {
    const path = '/checkout/sandbox?payment=payment-1'
    await page.goto(path)

    await expect(page).toHaveURL(
      new RegExp(`/login[?]redirectTo=${encodeURIComponent(path).replace(/\//g, '%2F')}$`),
    )
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})
