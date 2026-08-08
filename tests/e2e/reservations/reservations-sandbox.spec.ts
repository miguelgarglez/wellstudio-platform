import { test } from '@playwright/test'

import { MemberPortalPage } from '../page-objects/member-portal-page'
import { ReservationsPage } from '../page-objects/reservations-page'
import { loginAsSandboxMember } from '../support/auth'
import {
  ensureSandboxReservationScenarioReady,
  getSandboxReservationsSetupIssue,
  resetSandboxCancelableReservationState,
  resetSandboxReservableSessionState,
  resetSandboxWaitlistState,
} from '../support/sandbox'

test.describe('Member reservations sandbox @sandbox @critical @reservations', () => {
  test.describe.configure({ mode: 'serial' })

  test.skip(
    Boolean(getSandboxReservationsSetupIssue()),
    getSandboxReservationsSetupIssue() ?? 'Sandbox reservations suite is enabled.',
  )

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    await ensureSandboxReservationScenarioReady()
  })

  test.beforeEach(async ({ page }) => {
    await loginAsSandboxMember(page)
  })

  test('member home renders with populated reservations scenario', async ({ page }) => {
    const memberPortalPage = new MemberPortalPage(page)

    await memberPortalPage.expectSandboxHomeVisible()
  })

  test('reservations hub renders populated scenario blocks', async ({ page }) => {
    const reservationsPage = new ReservationsPage(page)

    await reservationsPage.goto()
    await reservationsPage.expectSandboxOverviewVisible()
  })

  test('member can leave an active waitlist', async ({ page }) => {
    const reservationsPage = new ReservationsPage(page)

    await resetSandboxWaitlistState()
    await reservationsPage.goto()
    await reservationsPage.leaveActiveWaitlist()
    await reservationsPage.expectWaitlistRemoved()
  })

  test('member can join waitlist again after leaving', async ({ page }) => {
    const reservationsPage = new ReservationsPage(page)

    await resetSandboxWaitlistState()
    await reservationsPage.goto()
    await reservationsPage.leaveActiveWaitlist()
    await reservationsPage.expectWaitlistRemoved()
    await reservationsPage.joinSandboxWaitlistAgain()
    await reservationsPage.expectWaitlistActiveAgain()
  })

  test('member can reserve an available session', async ({ page }, testInfo) => {
    const reservationsPage = new ReservationsPage(page)

    await resetSandboxReservableSessionState()
    await reservationsPage.goto()
    await reservationsPage.reserveAvailableSession()
    await reservationsPage.expectAvailableSessionReserved()
    await page.screenshot({
      path: testInfo.outputPath('reservation-confirmed.png'),
      fullPage: true,
    })
  })

  test('member can cancel a future reservation within window', async ({ page }, testInfo) => {
    const reservationsPage = new ReservationsPage(page)

    await resetSandboxCancelableReservationState()
    await reservationsPage.goto()
    await reservationsPage.cancelCancelableReservation()
    await reservationsPage.expectCancelableReservationCanceled()
    await page.screenshot({
      path: testInfo.outputPath('reservation-canceled.png'),
      fullPage: true,
    })
  })
})
