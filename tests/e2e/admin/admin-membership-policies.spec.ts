import { expect, test } from '@playwright/test'

import {
  ensureSandboxAdminAccess,
  loginAsSandboxAdmin,
  loginAsSandboxMember,
} from '../support/auth'
import { AuthPage } from '../page-objects/auth-page'
import {
  getSandboxAdminCredentials,
  hasSandboxAdminCredentials,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
  loadE2EEnvFiles,
} from '../support/env'

loadE2EEnvFiles()

test.describe('Admin membership policies @admin @sandbox', () => {
  test.describe.configure({ mode: 'serial' })

  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxCredentials() || !hasSandboxAdminCredentials(),
    'Sandbox auth credentials are not configured',
  )

  test('member cannot access admin policies', async ({ page }) => {
    await loginAsSandboxMember(page)

    const response = await page.goto('/admin')

    expect(response?.status()).toBe(404)
    await expect(page.getByText('This page could not be found.')).toBeVisible()
  })

  test('admin direct login lands on admin by default', async ({ page }) => {
    const authPage = new AuthPage(page)
    const { email, password } = getSandboxAdminCredentials()

    await ensureSandboxAdminAccess(email, password)

    await authPage.gotoLogin()
    await authPage.fillLoginForm(email, password)
    await authPage.submitLogin()

    await expect(page).toHaveURL(/\/admin$/)
    await authPage.expectAdminPoliciesVisible()
  })

  test('admin can view and update a membership booking policy', async ({ page }) => {
    await loginAsSandboxAdmin(page)

    await expect(page.getByRole('heading', { name: 'Políticas de reserva' })).toBeVisible()

    const planLinks = page.getByLabel('Planes de membresía').getByRole('link')
    const planCount = await planLinks.count()
    expect(planCount).toBeGreaterThan(0)

    await planLinks.first().click()

    await expect(page).toHaveURL(/\/admin\?plan=/)
    await page.getByText('Allowance semanal', { exact: true }).click()
    await page.getByLabel(/Reservas disponibles por periodo/i).fill('6')
    await page.getByRole('button', { name: 'Guardar política' }).click()

    await expect(page).toHaveURL(/\/admin\?plan=.*&updated=1$/)
    await expect(page.getByText('Política guardada')).toBeVisible()
    await expect(page.getByLabel(/Reservas disponibles por periodo/i)).toHaveValue('6')

    await page.reload()

    await expect(page.getByLabel(/Reservas disponibles por periodo/i)).toHaveValue('6')
  })

  test('admin opens policy detail as a sheet on mobile', async ({ page }) => {
    await loginAsSandboxAdmin(page)
    await page.setViewportSize({ width: 390, height: 844 })

    const planLinks = page.getByLabel('Planes de membresía').getByRole('link')
    const planCount = await planLinks.count()
    expect(planCount).toBeGreaterThan(0)

    await planLinks.first().click()

    await expect(page).toHaveURL(/\/admin\?plan=/)

    const detailSheet = page.getByRole('dialog').filter({
      hasText: 'Plan seleccionado',
    })

    await expect(detailSheet).toBeVisible()
    await expect(detailSheet.getByText('Escritura directa sobre')).toBeVisible()
    await detailSheet.getByRole('button', { name: 'Cerrar' }).click()
    await expect(page).not.toHaveURL(/plan=/)
  })
})
