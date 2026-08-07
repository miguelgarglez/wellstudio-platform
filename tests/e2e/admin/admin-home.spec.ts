import { expect, test } from '@playwright/test'

import { ensureSandboxAdminAccess, loginAsSandboxAdmin } from '../support/auth'
import {
  hasSandboxAdminCredentials,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
  loadE2EEnvFiles,
} from '../support/env'

loadE2EEnvFiles()

test.describe('Admin home @admin @sandbox', () => {
  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxCredentials() || !hasSandboxAdminCredentials(),
    'Sandbox auth credentials are not configured',
  )

  test.beforeAll(async () => {
    await ensureSandboxAdminAccess()
  })

  test('shows an actionable operational summary on desktop', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)

    await expect(page.getByRole('heading', { name: 'Control de hoy' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Clases de hoy' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Qué revisar ahora' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Solicitudes nuevas/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Reglas en fallback/ })).toBeVisible()

    await testInfo.attach('admin-home-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  })

  test('keeps summary and six destinations usable on mobile', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsSandboxAdmin(page)

    const mobileNav = page.getByLabel('Navegación admin móvil')
    await expect(mobileNav.getByRole('link', { name: 'Resumen' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Reglas' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Agenda' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Qué revisar ahora' })).toBeVisible()

    await testInfo.attach('admin-home-mobile', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  })

  test('redirects legacy policy deep links to the dedicated rules route', async ({ page }) => {
    await loginAsSandboxAdmin(page)
    await page.goto('/admin?plan=missing-plan')
    await expect(page).toHaveURL('/admin/rules?plan=missing-plan')
    await expect(page.getByRole('heading', { name: 'Reglas de reserva' })).toBeVisible()
  })
})
