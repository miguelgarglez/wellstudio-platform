import { expect, test } from '@playwright/test'

import { loginAsSandboxMember } from '../support/auth'
import {
  getMissingSandboxAuthEnv,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
} from '../support/env'
import {
  hasMemberEntitlementsDatabase,
  prepareExpiredEntitlementsFixture,
  restoreExpiredEntitlementsFixture,
  type ExpiredEntitlementsFixture,
} from '../support/member-entitlements'

test.describe('Member entitlement temporal validity @sandbox @members', () => {
  test.describe.configure({ mode: 'serial' })

  const setupIssue = !isSandboxAuthEnabled() || !hasSandboxCredentials()
    ? getMissingSandboxAuthEnv().join(', ')
    : !hasMemberEntitlementsDatabase()
      ? 'DATABASE_URL is required'
      : null

  test.skip(Boolean(setupIssue), setupIssue ?? 'Member entitlement sandbox suite is enabled.')

  let fixture: ExpiredEntitlementsFixture | null = null

  test.beforeAll(async () => {
    fixture = await prepareExpiredEntitlementsFixture()
  })

  test.afterAll(async () => {
    if (fixture) await restoreExpiredEntitlementsFixture(fixture)
  })

  test('home and account hide stale active entitlements at runtime', async ({ page }, testInfo) => {
    await loginAsSandboxMember(page)
    await page.goto('/app')

    const home = page.locator('#main-content')
    await expect(home.getByText('Sin plan activo', { exact: true })).toBeVisible()
    await expect(home.getByText('Sin créditos disponibles', { exact: true })).toBeVisible()

    const homeScreenshot = testInfo.outputPath('expired-entitlements-home-desktop.png')
    await page.screenshot({ path: homeScreenshot, fullPage: true })
    await testInfo.attach('expired-entitlements-home-desktop', {
      path: homeScreenshot,
      contentType: 'image/png',
    })

    await page.goto('/app/account')
    const account = page.locator('#main-content')
    await expect(account.getByText('Sin plan activo', { exact: true })).toBeVisible()
    await expect(account.getByText('Sin créditos activos', { exact: true })).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await expect(account.getByText('Sin plan activo', { exact: true })).toBeVisible()
    await expect(account.getByText('Sin créditos activos', { exact: true })).toBeVisible()

    const accountScreenshot = testInfo.outputPath('expired-entitlements-account-mobile.png')
    await page.screenshot({ path: accountScreenshot, fullPage: true })
    await testInfo.attach('expired-entitlements-account-mobile', {
      path: accountScreenshot,
      contentType: 'image/png',
    })
  })
})
