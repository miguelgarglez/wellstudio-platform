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

  test.afterEach(async () => {
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

  test('admin inactivates a member, member loses new booking access, and admin reactivates it', async ({ page, browser }, testInfo) => {
    const { email } = getSandboxCredentials()

    await loginAsSandboxAdmin(page)
    await page.goto(`/admin/members?q=${encodeURIComponent(email)}`)
    await page.getByRole('link', { name: new RegExp(email, 'i') }).click()

    await page.getByRole('button', { name: 'Cambiar estado' }).click()
    const statusDialog = page.getByRole('dialog', { name: new RegExp(`Cambiar estado de`, 'i') })
    await statusDialog.getByText('Inactivo', { exact: true }).click()
    await statusDialog.getByLabel('Motivo operativo').fill('Baja temporal validada en E2E')

    await testInfo.attach('admin-member-status-dialog', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })

    await statusDialog.getByRole('button', { name: 'Inactivar socio' }).click()
    await expect(page).toHaveURL(/updated=member-inactive/)
    await expect(page.getByRole('status').getByText('Socio inactivado')).toBeVisible()

    const memberContext = await browser.newContext({
      baseURL: testInfo.project.use.baseURL as string,
    })
    const memberPage = await memberContext.newPage()
    await loginAsSandboxMember(memberPage)
    await memberPage.goto('/app/reservations')
    await expect(memberPage.getByText('Cuenta de socio inactiva').first()).toBeVisible()
    await expect(memberPage.getByText(/no realizar nuevas reservas/i).first()).toBeVisible()

    await testInfo.attach('inactive-member-reservations', {
      body: await memberPage.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await memberContext.close()

    await page.getByRole('button', { name: 'Cambiar estado' }).click()
    const reactivateDialog = page.getByRole('dialog', { name: new RegExp(`Cambiar estado de`, 'i') })
    await reactivateDialog.getByText('Activo', { exact: true }).click()
    await reactivateDialog.getByLabel('Motivo operativo').fill('Fin de la baja temporal E2E')
    await reactivateDialog.getByRole('button', { name: 'Activar socio' }).click()
    await expect(page).toHaveURL(/updated=member-active/)
    await expect(page.getByRole('status').getByText('Socio activado')).toBeVisible()
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
