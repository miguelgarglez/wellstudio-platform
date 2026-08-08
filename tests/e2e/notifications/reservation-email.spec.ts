import { expect, test } from '@playwright/test'

import { buildReservationEmail } from '@/modules/notifications/server/reservation-email'

const payload = {
  reservationId: 'reservation-e2e',
  memberName: 'Ana Socio',
  className: 'Fuerza funcional',
  coachName: 'Marta Coach',
  locationLabel: 'Sala principal',
  startsAt: '2026-08-10T16:00:00.000Z',
  endsAt: '2026-08-10T16:50:00.000Z',
}

test('booking confirmation email is focused and responsive', async ({ page }, testInfo) => {
  const email = buildReservationEmail({
    eventType: 'RESERVATION_BOOKED',
    payload,
    portalUrl: 'https://wellstudio.miguelgarglez.com/app/reservations',
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.setContent(email.html)

  await expect(page.getByRole('heading', { name: 'Tu reserva está confirmada' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver mis reservas' })).toHaveAttribute(
    'href',
    'https://wellstudio.miguelgarglez.com/app/reservations',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: testInfo.outputPath('reservation-booked-mobile.png'), fullPage: true })
})

test('cancellation confirmation email preserves the session reference', async ({ page }, testInfo) => {
  const email = buildReservationEmail({
    eventType: 'RESERVATION_CANCELED',
    payload,
    portalUrl: 'https://wellstudio.miguelgarglez.com/app/reservations',
  })

  await page.setViewportSize({ width: 900, height: 900 })
  await page.setContent(email.html)

  await expect(page.getByRole('heading', { name: 'Tu reserva se ha cancelado' })).toBeVisible()
  await expect(page.getByText('La plaza se ha liberado')).toBeVisible()
  await expect(page.getByText('Fuerza funcional')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('reservation-canceled-desktop.png'), fullPage: true })
})
