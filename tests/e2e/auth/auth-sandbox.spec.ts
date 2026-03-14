import { expect, test } from '@playwright/test'

import { AuthPage } from '../page-objects/auth-page'
import {
  getSandboxCredentials,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
} from '../support/env'

test.describe('Auth sandbox @auth @sandbox @critical', () => {
  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxCredentials(),
    'Sandbox auth credentials are not configured',
  )

  test('member can log in with valid sandbox credentials', async ({ page }) => {
    const authPage = new AuthPage(page)
    const { email, password } = getSandboxCredentials()

    await authPage.gotoLogin()
    await authPage.fillLoginForm(email, password)
    await authPage.submitLogin()

    await expect(page).toHaveURL(/\/app$/)
    await authPage.expectProtectedMemberShell()
    await expect(page.getByText(email)).toBeVisible()
  })

  test('member sees feedback on invalid credentials', async ({ page }) => {
    const authPage = new AuthPage(page)

    await authPage.gotoLogin()
    await authPage.fillLoginForm(
      'e2e.invalid.sandbox@wellstudio.test',
      'wrong-password-for-sandbox',
    )
    await authPage.submitLogin()

    await authPage.expectInvalidLoginFeedback()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('member can log out and loses protected access', async ({ page }) => {
    const authPage = new AuthPage(page)
    const { email, password } = getSandboxCredentials()

    await authPage.gotoLogin()
    await authPage.fillLoginForm(email, password)
    await authPage.submitLogin()

    await expect(page).toHaveURL(/\/app$/)
    await authPage.expectProtectedMemberShell()
    await expect(page.getByText(email)).toBeVisible()

    await authPage.logout()
    await expect(page).toHaveURL(/\/login$/)
    await authPage.expectLoginVisible()

    await page.goto('/app')

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fapp$/)
    await authPage.expectLoginVisible()
  })
})
