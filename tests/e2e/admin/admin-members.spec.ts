import { expect, test } from '@playwright/test'

import { prepareSandboxAdminOverridesFixture } from '../support/admin-overrides'
import { ADMIN_MEMBER_NOTE_E2E_PREFIX, cleanupSandboxAdminMemberNotes } from '../support/admin-members'
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
import { resetSandboxAdminPlaygroundScenario } from '../support/sandbox'

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
    await cleanupSandboxAdminMemberNotes()
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

  test('admin appends internal member context and keeps it after reload', async ({ page }, testInfo) => {
    const { email } = getSandboxCredentials()
    const note = `${ADMIN_MEMBER_NOTE_E2E_PREFIX} Prefiere contacto por la tarde`

    await loginAsSandboxAdmin(page)
    await page.goto(`/admin/members?q=${encodeURIComponent(email)}`)
    await page.getByRole('link', { name: new RegExp(email, 'i') }).click()
    await page.getByRole('button', { name: 'Añadir nota' }).click()

    const dialog = page.getByRole('dialog', { name: 'Añadir nota al dossier' })
    await dialog.getByLabel('Nota interna').fill(note)
    await page.waitForTimeout(250)
    await testInfo.attach('admin-member-note-dialog', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
    await dialog.getByRole('button', { name: 'Guardar nota' }).click()

    await expect(page.getByRole('status').getByText('Nota interna añadida')).toBeVisible()
    await expect(page.getByText(note, { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText(note, { exact: true })).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(300)
    const mobileNote = page.getByText(note, { exact: true })
    await mobileNote.scrollIntoViewIfNeeded()
    await expect(mobileNote).toBeVisible()
    await testInfo.attach('admin-member-note-mobile', {
      body: await page.screenshot(),
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

  test('admin assigns and ends an internal membership with visible audit feedback', async ({ page }, testInfo) => {
    const noPlanEmail = 'e2e.admin.playground.no-plan.sandbox@wellstudio.test'
    await resetSandboxAdminPlaygroundScenario()

    try {
      await loginAsSandboxAdmin(page)
      await page.goto(`/admin/members?q=${encodeURIComponent(noPlanEmail)}`)
      await page.getByRole('link', { name: new RegExp(noPlanEmail, 'i') }).click()

      await expect(page.getByText('Sin membresías registradas')).toBeVisible()
      await page.getByRole('button', { name: 'Asignar membership' }).click()

      const assignDialog = page.getByRole('dialog', { name: /Asignar membership a Alex Sin Plan/i })
      await expect(assignDialog).toBeVisible()
      const weeklyPlan = assignDialog.getByRole('radio', { name: /Admin Playground Weekly/i })
      await assignDialog.locator('label').filter({ hasText: 'Admin Playground Weekly' }).click()
      await expect(weeklyPlan).toBeChecked()
      await assignDialog.getByLabel('Motivo de asignación').fill('Alta abonada en recepción durante E2E')
      await waitForMotionToSettle(assignDialog)

      await testInfo.attach('admin-membership-assignment-dialog', {
        body: await page.screenshot(),
        contentType: 'image/png',
      })

      await assignDialog.getByRole('button', { name: 'Asignar membership' }).click()
      await expect(page).toHaveURL(/updated=membership-assigned/)
      await expect(page.getByRole('status').getByText('Membership asignada')).toBeVisible()

      const membershipCard = page.locator('article').filter({ hasText: 'Admin Playground Weekly' }).first()
      await expect(membershipCard.getByText('Activa', { exact: true })).toBeVisible()
      await membershipCard.getByRole('button', { name: 'Finalizar' }).click()

      const endDialog = page.getByRole('dialog', { name: /Finalizar Admin Playground Weekly/i })
      await expect(endDialog).toBeVisible()
      await endDialog.getByLabel('Motivo de finalización').fill('Baja solicitada durante E2E')
      await waitForMotionToSettle(endDialog)

      await testInfo.attach('admin-membership-end-dialog', {
        body: await page.screenshot(),
        contentType: 'image/png',
      })

      await endDialog.getByRole('button', { name: 'Finalizar membership' }).click()
      await expect(page).toHaveURL(/updated=membership-ended/)
      await expect(page.getByRole('status').getByText('Membership finalizada')).toBeVisible()
      await expect(page.locator('article').filter({ hasText: 'Admin Playground Weekly' }).first().getByText('Cancelada', { exact: true })).toBeVisible()
    } finally {
      await resetSandboxAdminPlaygroundScenario()
    }
  })

  test('admin adjusts an existing credit ledger with visible balance feedback', async ({ page }, testInfo) => {
    const weeklyEmail = 'e2e.admin.playground.weekly.sandbox@wellstudio.test'
    await resetSandboxAdminPlaygroundScenario()

    try {
      await loginAsSandboxAdmin(page)
      await page.goto(`/admin/members?q=${encodeURIComponent(weeklyEmail)}`)
      await page.getByRole('link', { name: new RegExp(weeklyEmail, 'i') }).click()

      const creditCard = page.locator('article').filter({ hasText: 'Admin Playground Credits' }).first()
      await expect(creditCard.getByText('6', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Gestionar créditos' }).click()

      const dialog = page.getByRole('dialog', { name: /Gestionar créditos de Marta Semanal/i })
      await expect(dialog).toBeVisible()
      await dialog.getByLabel('Cantidad').fill('2')
      await dialog.getByLabel('Motivo operativo').fill('Cortesía autorizada durante E2E')
      await waitForMotionToSettle(dialog)

      await testInfo.attach('admin-credit-adjustment-dialog', {
        body: await page.screenshot(),
        contentType: 'image/png',
      })

      await dialog.getByRole('button', { name: 'Registrar ajuste' }).click()
      await expect(page).toHaveURL(/updated=credits-adjusted/)
      await expect(page.getByRole('status').getByText('Saldo de créditos actualizado')).toBeVisible()
      await expect(page.locator('article').filter({ hasText: 'Admin Playground Credits' }).first().getByText('8', { exact: true })).toBeVisible()
    } finally {
      await resetSandboxAdminPlaygroundScenario()
    }
  })

  test('admin opens a manual credit account from mobile without creating a payment', async ({ page }, testInfo) => {
    const noPlanEmail = 'e2e.admin.playground.no-plan.sandbox@wellstudio.test'
    await resetSandboxAdminPlaygroundScenario()

    try {
      await loginAsSandboxAdmin(page)
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`/admin/members?q=${encodeURIComponent(noPlanEmail)}`)
      await page.getByRole('link', { name: new RegExp(noPlanEmail, 'i') }).click()
      await expect(page.getByText('Sin cuentas de créditos')).toBeVisible()
      await page.getByRole('button', { name: 'Gestionar créditos' }).click()

      const dialog = page.getByRole('dialog', { name: /Gestionar créditos de Alex Sin Plan/i })
      await expect(dialog).toBeVisible()
      await waitForMotionToSettle(dialog)
      const box = await dialog.boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(388)
      await dialog.getByLabel('Créditos iniciales').fill('4')
      await dialog.getByLabel('Motivo operativo').fill('Bono de bienvenida autorizado en E2E')

      await testInfo.attach('admin-credit-account-opening-mobile', {
        body: await page.screenshot(),
        contentType: 'image/png',
      })

      await dialog.getByRole('button', { name: 'Abrir cuenta de créditos' }).click()
      await expect(page).toHaveURL(/updated=credit-account-opened/)
      await expect(page.getByRole('status').getByText('Cuenta de créditos abierta')).toBeVisible()
      const creditCard = page.locator('article').filter({ hasText: 'Admin Playground Credits' }).first()
      await expect(creditCard.getByText('4', { exact: true })).toBeVisible()
      await expect(page.getByText('Sin pagos registrados')).toBeVisible()
    } finally {
      await resetSandboxAdminPlaygroundScenario()
    }
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

  test('mobile membership assignment remains focused inside the member detail', async ({ page }, testInfo) => {
    const noPlanEmail = 'e2e.admin.playground.no-plan.sandbox@wellstudio.test'
    await resetSandboxAdminPlaygroundScenario()

    await loginAsSandboxAdmin(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/admin/members?q=${encodeURIComponent(noPlanEmail)}`)
    await page.getByRole('link', { name: new RegExp(noPlanEmail, 'i') }).click()
    await page.getByRole('button', { name: 'Asignar membership' }).click()

    const dialog = page.getByRole('dialog', { name: /Asignar membership a Alex Sin Plan/i })
    await expect(dialog).toBeVisible()
    await waitForMotionToSettle(dialog)
    const box = await dialog.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(388)
    await expect(dialog.getByRole('button', { name: 'Asignar membership' })).toBeVisible()

    await testInfo.attach('admin-membership-assignment-mobile', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  })
})

async function waitForMotionToSettle(locator: import('@playwright/test').Locator) {
  await locator.evaluate((element) => Promise.all(
    element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)),
  ))
}
