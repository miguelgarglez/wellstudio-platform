import { expect, test } from '@playwright/test'

import {
  ADMIN_SESSION_NOTIFICATIONS_CLASS,
  prepareSandboxAdminSessionNotificationsFixture,
  readSandboxSessionNotificationState,
} from '../support/admin-session-notifications'
import { ensureSandboxAdminAccess, loginAsSandboxAdmin } from '../support/auth'
import {
  hasSandboxAdminCredentials,
  isSandboxAuthEnabled,
  loadE2EEnvFiles,
} from '../support/env'

loadE2EEnvFiles()

test.describe('Admin session notifications @admin @sandbox', () => {
  test.describe.configure({ mode: 'serial' })

  test.skip(
    !isSandboxAuthEnabled() || !hasSandboxAdminCredentials(),
    'Sandbox admin credentials are not configured',
  )

  let fixture: Awaited<ReturnType<typeof prepareSandboxAdminSessionNotificationsFixture>>

  test.beforeAll(async () => {
    await ensureSandboxAdminAccess()
    fixture = await prepareSandboxAdminSessionNotificationsFixture()
  })

  test('reschedule and cancellation notify every affected member', async ({ page }, testInfo) => {
    await loginAsSandboxAdmin(page)
    await page.goto(`/admin/sessions?session=${fixture.sessionId}`)

    const detail = page.getByRole('dialog', { name: ADMIN_SESSION_NOTIFICATIONS_CLASS })
    await detail.getByRole('button', { name: 'Editar datos de sesión' }).click()
    const editSheet = page.getByRole('dialog', {
      name: `Editar ${ADMIN_SESSION_NOTIFICATIONS_CLASS}`,
    })
    await expect(editSheet.getByText('preparará 2 avisos transaccionales')).toBeVisible()
    await editSheet.getByRole('textbox', { name: 'Inicio' }).fill(fixture.rescheduledLocalInput)
    await editSheet.getByLabel('Razón operativa').fill('Ajuste de horario comunicado por el estudio')
    await editSheet
      .getByLabel('He revisado el impacto y confirmo el envío de los avisos')
      .check()
    await editSheet.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(page.getByText('Sesión actualizada y avisos preparados')).toBeVisible()
    await captureEvidence(page, testInfo, 'admin-session-rescheduled-notified')
    await expect
      .poll(async () => {
        const state = await readSandboxSessionNotificationState(fixture.sessionId)
        return state.jobs
          .filter((job) => job.eventType === 'SESSION_RESCHEDULED')
          .map((job) => job.payload.audience)
          .sort()
      })
      .toEqual(['RESERVATION', 'WAITLIST'])

    await page.goto('/admin/notifications?event=session')
    await expect(page.getByText('Sesión actualizada', { exact: true }).first()).toBeVisible()
    await page.getByText('Sesión actualizada', { exact: true }).first().click()
    await expect(page.getByRole('heading', { name: 'Sesión actualizada' })).toBeVisible()
    await expect(page.getByText('Sesión comunicada')).toBeVisible()

    await captureEvidence(page, testInfo, 'admin-session-delivery-monitor')

    await page.goto(`/admin/sessions?session=${fixture.sessionId}`)
    const refreshedDetail = page.getByRole('dialog', {
      name: ADMIN_SESSION_NOTIFICATIONS_CLASS,
    })
    await refreshedDetail.getByRole('button', { name: 'Revisar cancelación' }).click()
    const cancelDialog = page.getByRole('alertdialog', {
      name: new RegExp(`Cancelar ${ADMIN_SESSION_NOTIFICATIONS_CLASS}`),
    })
    await expect(cancelDialog.getByText('se prepararán 2 avisos trazables')).toBeVisible()
    await cancelDialog
      .getByLabel('Razón de cancelación')
      .fill('Cierre extraordinario comunicado por el estudio')
    await cancelDialog.getByRole('button', { name: 'Confirmar cancelación' }).click()

    await expect(page.getByText('Sesión cancelada y avisos preparados')).toBeVisible()
    await captureEvidence(page, testInfo, 'admin-session-canceled-notified')
    await expect
      .poll(async () => {
        const state = await readSandboxSessionNotificationState(fixture.sessionId)
        return {
          canceledAudiences: state.jobs
            .filter((job) => job.eventType === 'SESSION_CANCELED')
            .map((job) => job.payload.audience)
            .sort(),
          reservationStatus: state.reservationStatus,
          waitlistStatus: state.waitlistStatus,
        }
      })
      .toEqual({
        canceledAudiences: ['RESERVATION', 'WAITLIST'],
        reservationStatus: 'CANCELED',
        waitlistStatus: 'EXPIRED',
      })

  })
})

async function captureEvidence(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
  name: string,
) {
  const path = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path, fullPage: true })
  await testInfo.attach(name, { path, contentType: 'image/png' })
}
