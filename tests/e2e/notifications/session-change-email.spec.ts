import { expect, test } from '@playwright/test'

import { buildSessionChangeEmail } from '@/modules/notifications/server/session-change-email'

const current = {
  sessionId: 'session-e2e',
  affectedRecordId: 'reservation-e2e',
  audience: 'RESERVATION' as const,
  memberName: 'Ana Socio',
  className: 'Fuerza funcional',
  coachName: 'Marta Coach',
  locationLabel: 'Sala principal',
  startsAt: '2026-08-11T17:00:00.000Z',
  endsAt: '2026-08-11T17:50:00.000Z',
  previous: {
    className: 'Fuerza funcional',
    coachName: 'Leo Coach',
    locationLabel: 'Sala principal',
    startsAt: '2026-08-10T16:00:00.000Z',
    endsAt: '2026-08-10T16:50:00.000Z',
  },
  reason: 'Ajuste de horario comunicado por el estudio',
}

test('reschedule email compares the session clearly on mobile', async ({ page }, testInfo) => {
  const email = buildSessionChangeEmail({
    eventType: 'SESSION_RESCHEDULED',
    payload: current,
    portalUrl: 'https://wellstudio.miguelgarglez.com/app/reservations',
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.setContent(email.html)

  await expect(page.getByRole('heading', { name: 'Tu sesión ha cambiado' })).toBeVisible()
  await expect(page.getByText('Antes')).toBeVisible()
  await expect(page.getByText('Ahora')).toBeVisible()
  await expect(page.getByText('Tu plaza se mantiene')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
  await page.screenshot({
    path: testInfo.outputPath('session-rescheduled-email-mobile.png'),
    fullPage: true,
  })
})

test('cancellation email explains the waitlist outcome on desktop', async ({ page }, testInfo) => {
  const email = buildSessionChangeEmail({
    eventType: 'SESSION_CANCELED',
    payload: {
      ...current,
      affectedRecordId: 'waitlist-e2e',
      audience: 'WAITLIST',
      previous: null,
      reason: 'Cierre extraordinario comunicado por el estudio',
    },
    portalUrl: 'https://wellstudio.miguelgarglez.com/app/reservations',
  })

  await page.setViewportSize({ width: 900, height: 900 })
  await page.setContent(email.html)

  await expect(
    page.getByRole('heading', { name: 'El centro ha cancelado la sesión' }),
  ).toBeVisible()
  await expect(page.getByText('Lista de espera', { exact: true })).toBeVisible()
  await expect(page.getByText('tu posición ya está cerrada')).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('session-canceled-email-desktop.png'),
    fullPage: true,
  })
})
