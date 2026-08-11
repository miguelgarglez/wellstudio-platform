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

  test('login strips absolute open-redirect targets from the rendered page', async ({
    request,
  }) => {
    const response = await request.get('/login?redirectTo=https://evil.example/phish')
    const body = await response.text()

    expect(response.ok()).toBe(true)
    expect(response.url()).toContain('/login')
    expect(body).toMatch(/data-safe-redirect="\/auth\/after-login"/)
    expect(body).not.toMatch(/data-safe-redirect="[^"]*evil\.example/)
  })

  test('login strips protocol-relative open-redirect targets', async ({ request }) => {
    const response = await request.get('/login?redirectTo=//evil.example')
    const body = await response.text()

    expect(response.ok()).toBe(true)
    expect(response.url()).toContain('/login')
    expect(body).toMatch(/data-safe-redirect="\/auth\/after-login"/)
    expect(body).not.toMatch(/data-safe-redirect="[^"]*evil\.example/)
  })

  test('auth confirm refuses open-redirect next values after a failed verification', async ({
    request,
  }) => {
    const response = await request.get(
      '/auth/confirm?token_hash=invalid-token&type=signup&next=//evil.example',
      { maxRedirects: 0 },
    )

    expect(response.status()).toBe(307)
    const location = response.headers()['location'] ?? ''
    expect(location).toContain('/login')
    expect(location).toContain('redirectTo=%2Fapp')
    expect(location).not.toContain('evil.example')
  })

  test('auth callback refuses open-redirect next values in the rendered markup', async ({
    request,
  }) => {
    const response = await request.get('/auth/callback?next=https://evil.example/phish')
    const body = await response.text()

    expect(response.ok()).toBe(true)
    expect(body).toMatch(/data-safe-next="\/app"/)
    expect(body).not.toMatch(/data-safe-next="[^"]*evil\.example/)
  })

  test('public auth responses include baseline security headers', async ({ request }) => {
    const response = await request.get('/login')
    const headers = response.headers()
    const csp = headers['content-security-policy'] ?? ''

    expect(response.ok()).toBe(true)
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain('https://*.supabase.co')
    expect(headers['x-frame-options']?.toLowerCase()).toBe('deny')
    expect(headers['x-content-type-options']?.toLowerCase()).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })
})
