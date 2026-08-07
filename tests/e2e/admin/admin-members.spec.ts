import { expect, test } from '@playwright/test'

import { prepareSandboxAdminOverridesFixture } from '../support/admin-overrides'
import {
  ensureSandboxAdminAccess,
  loginAsSandboxAdmin,
  loginAsSandboxMember,
} from '../support/auth'
import {
  getSandboxCredentials,
  hasSandboxAdminCredentials,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
  loadE2EEnvFiles,
} from '../support/env'

loadE2EEnvFiles()

test.describe('Admin members @admin @sandbox', () => {
  test.describe.configure({ mode: 'serial' })

  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxCredentials() || !hasSandboxAdminCredentials(),
    'Sandbox auth credentials are not configured',
  )

  test.beforeAll(async () => {
    await ensureSandboxAdminAccess()
    await prepareSandboxAdminOverridesFixture()
  })

  test('member cannot access the operational member directory', async ({ page }) => {
    await loginAsSandboxMember(page)
    const response = await page.goto('/admin/members')

    expect(response?.status()).toBe(404)
  })

  test('admin searches and opens a read-only operational member dossier', async ({ page }, testInfo) => {
    const { email } = getSandboxCredentials()

    await loginAsSandboxAdmin(page)
    await page.goto('/admin/members')

    await expect(page.getByRole('heading', { name: 'Gestión de socios' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Selecciona un socio' })).toBeVisible()
    await expect(page).not.toHaveURL(/member=/)

    await page.getByLabel('Buscar socio').fill(email)
    await page.getByRole('button', { name: 'Buscar socio' }).click()
    await expect(page).toHaveURL(/q=/)

    await page.getByRole('link', { name: new RegExp(email, 'i') }).click()
    await expect(page).toHaveURL(/member=/)
    await expect(page.getByRole('heading', { name: 'Membresías y créditos' })).toBeVisible()
    await expect(page.getByText('E2E Membership Flow', { exact: true })).toBeVisible()

    const exceptionsLink = page.getByRole('link', { name: 'Operar excepciones' })
    await expect(exceptionsLink).toHaveAttribute('href', /\/admin\/overrides\?member=/)

    await testInfo.attach('admin-members-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  })

  test('mobile member detail uses the full viewport and returns to the filtered list', async ({ page }, testInfo) => {
    const { email } = getSandboxCredentials()

    await loginAsSandboxAdmin(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/admin/members?q=${encodeURIComponent(email)}`)
    await page.getByRole('link', { name: new RegExp(email, 'i') }).click()

    const detail = page.getByRole('dialog').filter({ hasText: email })
    const box = await detail.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(388)
    await expect(detail.getByRole('heading', { name: 'Membresías y créditos' })).toBeVisible()

    await testInfo.attach('admin-members-mobile', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })

    await detail.getByRole('button', { name: 'Cerrar' }).click()
    await expect(page).toHaveURL(`/admin/members?q=${encodeURIComponent(email)}`)
    await expect(page).not.toHaveURL(/member=/)
  })
})
