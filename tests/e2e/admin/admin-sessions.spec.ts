import { expect, test } from '@playwright/test'

import {
  ADMIN_SESSIONS_E2E_CLASS,
  ADMIN_ATTENDANCE_E2E_CLASS,
  ATTENDANCE_GUEST_NAME,
  prepareSandboxAdminSessionsFixture,
} from '../support/admin-sessions'
import {
  ensureSandboxAdminAccess,
  loginAsSandboxAdmin,
  loginAsSandboxMember,
} from '../support/auth'
import {
  hasSandboxAdminCredentials,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
  getSandboxCredentials,
  loadE2EEnvFiles,
} from '../support/env'

loadE2EEnvFiles()

test.describe('Admin sessions @admin @sandbox', () => {
  test.describe.configure({ mode: 'serial' })

  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxCredentials() || !hasSandboxAdminCredentials(),
    'Sandbox auth credentials are not configured',
  )

  test.beforeAll(async () => {
    await ensureSandboxAdminAccess()
    await prepareSandboxAdminSessionsFixture()
  })

  test('member cannot access the operational agenda', async ({ page }) => {
    await loginAsSandboxMember(page)
    const response = await page.goto('/admin/sessions')
    expect(response?.status()).toBe(404)
    const catalogResponse = await page.goto('/admin/sessions/catalog')
    expect(catalogResponse?.status()).toBe(404)
  })

  test('admin manages the class and coach catalog with reversible archival', async ({ page }, testInfo) => {
    const suffix = Date.now().toString(36)
    const className = `E2E Catalog ${suffix}`
    const coachName = `E2E Coach ${suffix}`
    await loginAsSandboxAdmin(page)
    await page.goto('/admin/sessions/catalog')

    await expect(page.getByRole('heading', { name: 'Catálogo de clases' })).toBeVisible()
    await page.getByRole('button', { name: 'Nuevo tipo' }).click()
    const classSheet = page.getByRole('dialog', { name: 'Nuevo tipo de clase' })
    await classSheet.getByLabel('Nombre').fill(className)
    await classSheet.getByLabel('Categoría').fill('E2E')
    await classSheet.getByLabel('Duración (min)').fill('55')
    await classSheet.getByLabel('Aforo por defecto').fill('11')
    await classSheet.getByRole('button', { name: 'Crear tipo de clase' }).click()
    await expect(page.getByRole('status').getByText('Tipo de clase guardado')).toBeVisible()
    let classRow = page.getByRole('group', { name: className, exact: true })
    await expect(classRow.getByText('55 min')).toBeVisible()

    await classRow.getByRole('button', { name: 'Editar' }).click()
    const editSheet = page.getByRole('dialog', { name: `Editar ${className}` })
    await editSheet.getByLabel('Categoría').fill('E2E actualizado')
    await editSheet.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByRole('status').getByText('Tipo de clase guardado')).toBeVisible()
    classRow = page.getByRole('group', { name: className, exact: true })
    await expect(classRow.getByText('E2E actualizado')).toBeVisible()

    await classRow.getByRole('button', { name: `Archivar ${className}` }).click()
    await page.getByRole('alertdialog', { name: `Archivar ${className}` }).getByRole('button', { name: 'Archivar' }).click()
    await expect(page.getByRole('status').getByText('Tipo de clase archivado')).toBeVisible()
    await page.getByRole('group', { name: className, exact: true }).getByRole('button', { name: 'Reactivar' }).click()
    await expect(page.getByRole('status').getByText('Tipo de clase reactivado')).toBeVisible()

    await page.getByRole('link', { name: 'Coaches' }).click()
    await page.getByRole('button', { name: 'Nuevo coach' }).click()
    const coachSheet = page.getByRole('dialog', { name: 'Nuevo coach' })
    await coachSheet.getByLabel('Nombre visible').fill(coachName)
    await coachSheet.getByLabel('Nombre', { exact: true }).fill('E2E')
    await coachSheet.getByLabel('Apellidos').fill('Catalog')
    await coachSheet.getByRole('button', { name: 'Crear coach' }).click()
    await expect(page.getByRole('status').getByText('Coach guardado')).toBeVisible()
    await expect(page.getByText(coachName, { exact: true })).toBeVisible()

    await testInfo.attach('admin-class-catalog-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  })

  test('mobile catalog keeps creation focused and full width', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/admin/sessions/catalog')
    await page.getByRole('button', { name: 'Nuevo tipo' }).click()
    const sheet = page.getByRole('dialog', { name: 'Nuevo tipo de clase' })
    const box = await sheet.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(388)
    await page.waitForTimeout(300)
    await testInfo.attach('admin-class-catalog-mobile', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  })

  test('admin creates, closes, reopens and cancels an audited session', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.goto('/admin/sessions')

    await expect(page.getByRole('heading', { name: 'Agenda de sesiones' })).toBeVisible()
    await page.getByRole('button', { name: 'Nueva sesión' }).click()

    const createSheet = page.getByRole('dialog', { name: 'Nueva sesión' })
    await createSheet.getByRole('combobox', { name: 'Tipo de clase' }).selectOption({ label: 'E2E Agenda Flow · 50 min' })
    await createSheet.getByRole('combobox', { name: 'Coach' }).selectOption({ label: 'E2E Agenda Coach' })
    await createSheet.getByRole('textbox', { name: 'Inicio' }).fill(futureLocalDateTime())
    await createSheet.getByRole('spinbutton', { name: 'Capacidad' }).fill('9')
    await createSheet.getByRole('textbox', { name: 'Ubicación' }).fill('Sala E2E')
    await createSheet.getByRole('button', { name: 'Guardar y publicar' }).click()

    await expect(page.getByRole('status').getByText('Sesión publicada')).toBeVisible()
    const detail = page.getByRole('dialog', { name: ADMIN_SESSIONS_E2E_CLASS })
    await expect(detail.getByText('Publicada', { exact: true })).toBeVisible()

    await detail.getByRole('button', { name: 'Cerrar reservas' }).click()
    await expect(page.getByRole('status').getByText('Reservas cerradas')).toBeVisible()
    await expect(detail.getByText('Cerrada', { exact: true })).toBeVisible()

    await detail.getByRole('button', { name: 'Reabrir reservas' }).click()
    await expect(page.getByRole('status').getByText('Sesión publicada')).toBeVisible()

    await testInfo.attach('admin-sessions-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })

    await detail.getByRole('button', { name: 'Revisar cancelación' }).click()
    const cancelDialog = page.getByRole('alertdialog', { name: new RegExp(`Cancelar ${ADMIN_SESSIONS_E2E_CLASS}`) })
    await cancelDialog.getByLabel('Razón de cancelación').fill('Cancelación controlada por E2E')
    await cancelDialog.getByRole('button', { name: 'Confirmar cancelación' }).click()
    await expect(page.getByRole('status').getByText('Sesión cancelada')).toBeVisible()
    await expect(detail.getByText('Cancelada', { exact: true })).toBeVisible()

    await page.reload()
    await expect(detail.getByText('Cancelada', { exact: true })).toBeVisible()
  })

  test('admin resolves attendance and completes the session', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.goto('/admin/sessions')
    await page.getByRole('link', { name: new RegExp(ADMIN_ATTENDANCE_E2E_CLASS) }).click()

    const detail = page.getByRole('dialog', { name: ADMIN_ATTENDANCE_E2E_CLASS })
    await expect(detail.getByText('Pendientes · 2')).toBeVisible()
    await expect(detail.getByRole('button', { name: 'Completar sesión' })).toBeDisabled()

    const memberEmail = getSandboxCredentials().email
    const memberRow = detail.getByRole('group', { name: new RegExp(memberEmail, 'i') })
    await memberRow.getByRole('button', { name: 'Asistió' }).click()
    await expect(page.getByRole('status').getByText('Asistencia registrada')).toBeVisible()

    const refreshedDetail = page.getByRole('dialog', { name: ADMIN_ATTENDANCE_E2E_CLASS })
    const guestRow = refreshedDetail.getByRole('group', { name: new RegExp(ATTENDANCE_GUEST_NAME, 'i') })
    await guestRow.getByRole('button', { name: 'No vino' }).click()
    await expect(page.getByRole('status').getByText('No-show registrado')).toBeVisible()
    await expect(refreshedDetail.getByText('Pendientes · 0')).toBeVisible()

    await testInfo.attach('admin-attendance-resolved', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })

    await refreshedDetail.getByRole('button', { name: 'Completar sesión' }).click()
    await expect(page.getByRole('status').getByText('Sesión completada')).toBeVisible()
    await expect(refreshedDetail.getByText('Completada', { exact: true })).toBeVisible()

    await page.reload()
    await expect(refreshedDetail.getByText('Completada', { exact: true })).toBeVisible()
    await expect(refreshedDetail.getByText('Asistió', { exact: true }).first()).toBeVisible()
    await expect(refreshedDetail.getByText('No vino', { exact: true }).first()).toBeVisible()
  })

  test('mobile agenda keeps navigation compact and detail full width', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/admin/sessions')

    await expect(page.getByRole('navigation', { name: 'Navegación admin móvil' }).getByText('Agenda')).toBeVisible()
    await page.getByRole('link', { name: new RegExp(ADMIN_SESSIONS_E2E_CLASS) }).click()
    const detail = page.getByRole('dialog', { name: ADMIN_SESSIONS_E2E_CLASS })
    const box = await detail.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(388)
    await page.waitForTimeout(300)

    await testInfo.attach('admin-sessions-mobile', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  })
})

function futureLocalDateTime() {
  const date = new Date(Date.now() + 5 * 86_400_000)
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return `${parts}T18:00`
}
