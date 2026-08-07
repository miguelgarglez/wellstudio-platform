import { expect, test } from '@playwright/test'

import { ADMIN_LEADS_E2E_NAME, prepareSandboxAdminLeadsFixture } from '../support/admin-leads'
import {
  ensureSandboxAdminAccess,
  loginAsSandboxAdmin,
  loginAsSandboxMember,
} from '../support/auth'
import {
  hasSandboxAdminCredentials,
  hasSandboxCredentials,
  getSandboxCredentials,
  isSandboxAuthEnabled,
  loadE2EEnvFiles,
} from '../support/env'

loadE2EEnvFiles()

test.describe('Admin leads V2 @admin @sandbox', () => {
  test.describe.configure({ mode: 'serial' })

  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxCredentials() || !hasSandboxAdminCredentials(),
    'Sandbox auth credentials are not configured',
  )

  test.beforeAll(async () => {
    await ensureSandboxAdminAccess()
    await prepareSandboxAdminLeadsFixture()
  })

  test('member cannot access contact requests', async ({ page }) => {
    await loginAsSandboxMember(page)
    const response = await page.goto('/admin/leads')

    expect(response?.status()).toBe(404)
  })

  test('admin keeps auditable notes and follows the full status workflow', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.goto('/admin/leads')

    await expect(page.getByRole('heading', { name: 'Solicitudes de contacto' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Nuevas/ })).toHaveAttribute('href', '/admin/leads')

    await page.getByRole('link', { name: new RegExp(ADMIN_LEADS_E2E_NAME) }).click()
    await expect(page).toHaveURL(/lead=/)

    const detail = page.getByRole('dialog', { name: ADMIN_LEADS_E2E_NAME })
    await expect(
      detail.getByText('Estado actual').locator('..').getByText('Nueva', { exact: true }),
    ).toBeVisible()

    await detail.getByRole('button', { name: 'Añadir nota' }).click()
    const noteDialog = page.getByRole('dialog', { name: 'Añadir nota' })
    await noteDialog.getByRole('button', { name: 'Solicita precios' }).click()
    await noteDialog.getByRole('button', { name: 'Guardar nota' }).click()

    await expect(page.getByRole('status').getByText('Nota añadida')).toBeVisible()
    await expect(detail.getByText('Solicita precios', { exact: true })).toBeVisible()

    await detail.getByRole('button', { name: 'Cambiar estado' }).click()
    const statusDialog = page.getByRole('dialog', { name: 'Cambiar estado' })
    await statusDialog.getByText('Contactada', { exact: true }).click()
    await statusDialog.getByLabel('Nota opcional').fill('Primer contacto realizado')
    await statusDialog.getByRole('button', { name: 'Marcar como contactada' }).click()

    await expect(page.getByRole('status').getByText('Solicitud contactada')).toBeVisible()
    await expect(detail.getByText('Nueva → Contactada')).toBeVisible()

    await detail.getByRole('button', { name: 'Cambiar estado' }).click()
    await page.getByRole('dialog', { name: 'Cambiar estado' }).getByText('Interesada', { exact: true }).click()
    await page.getByRole('dialog', { name: 'Cambiar estado' }).getByRole('button', { name: 'Marcar como interesada' }).click()

    await expect(page.getByRole('status').getByText('Solicitud marcada como interesada')).toBeVisible()

    await detail.getByRole('button', { name: 'Cambiar estado' }).click()
    const lostDialog = page.getByRole('dialog', { name: 'Cambiar estado' })
    await lostDialog.getByText('Perdida', { exact: true }).click()
    await expect(lostDialog.getByLabel('Motivo de pérdida')).toHaveAttribute('required', '')
    await lostDialog.getByRole('button', { name: 'No está interesada' }).click()
    await lostDialog.getByRole('button', { name: 'Marcar como perdida' }).click()

    await expect(page.getByRole('status').getByText('Solicitud perdida')).toBeVisible()
    await expect(detail.getByText('Interesada → Perdida')).toBeVisible()

    await detail.getByRole('button', { name: 'Cambiar estado' }).click()
    const reopenDialog = page.getByRole('dialog', { name: 'Cambiar estado' })
    await reopenDialog.getByRole('button', { name: 'Marcar como nueva' }).click()
    await expect(page.getByRole('status').getByText('Solicitud reabierta')).toBeVisible()
    await expect(detail.getByText('Perdida → Nueva')).toBeVisible()

    await detail.getByRole('button', { name: 'Cambiar estado' }).click()
    const qualifyDialog = page.getByRole('dialog', { name: 'Cambiar estado' })
    await qualifyDialog.getByText('Interesada', { exact: true }).click()
    await qualifyDialog.getByRole('button', { name: 'Marcar como interesada' }).click()
    await expect(detail.getByRole('button', { name: 'Convertir en socio existente' })).toBeVisible()

    await detail.getByRole('button', { name: 'Convertir en socio existente' }).click()
    const conversionDialog = page.getByRole('dialog', { name: 'Vincular con un socio existente' })
    const memberEmail = getSandboxCredentials().email
    await conversionDialog.getByPlaceholder('Buscar socio por nombre, email o teléfono').fill(memberEmail)
    await conversionDialog.getByRole('button', { name: 'Buscar' }).click()
    await conversionDialog.getByText(memberEmail, { exact: false }).click()
    await conversionDialog.getByRole('button', { name: 'Confirmar conversión' }).click()

    await expect(page.getByRole('status').getByText('Solicitud convertida en socio')).toBeVisible()
    await expect(detail.getByText('Socio vinculado')).toBeVisible()
    await expect(detail.getByRole('link', { name: 'Abrir ficha de socio' })).toBeVisible()
    await expect(detail.getByText('Interesada → Convertida')).toBeVisible()

    await testInfo.attach('admin-leads-v2-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })

    await page.reload()
    await expect(detail.getByText('Solicita precios', { exact: true })).toBeVisible()
    await expect(detail.getByText('Interesada → Convertida')).toBeVisible()
    await expect(detail.getByText('Socio vinculado')).toBeVisible()
  })

  test('mobile detail is full width and preserves inbox context when closed', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/admin/leads?q=E2E&status=all')
    await page.getByRole('link', { name: new RegExp(ADMIN_LEADS_E2E_NAME) }).click()

    const detail = page.getByRole('dialog', { name: ADMIN_LEADS_E2E_NAME })
    const box = await detail.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(388)

    await testInfo.attach('admin-leads-v2-mobile', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })

    await detail.getByRole('button', { name: 'Cerrar' }).click()
    await expect(page).toHaveURL('/admin/leads?q=E2E&status=all')
  })
})
