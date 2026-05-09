import { expect, type Page } from '@playwright/test'

import { SANDBOX_FLOW_LABELS } from './member-portal-page'

export class ReservationsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/app/reservations')
  }

  async expectSandboxOverviewVisible() {
    await expect(
      this.page.getByRole('heading', { name: 'Tu actividad confirmada' }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('heading', { name: 'Tu waitlist en curso' }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('heading', { name: 'Sesiones publicadas para organizarte' }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('heading', { name: 'Seguimiento de tus últimas sesiones' }),
    ).toBeVisible()
    await expect(
      this.page.getByText(SANDBOX_FLOW_LABELS.cancelableSessionLocation).first(),
    ).toBeVisible()
    await expect(
      this.page.getByText(SANDBOX_FLOW_LABELS.availableSessionLocation).first(),
    ).toBeVisible()
    await expect(
      this.page.getByText(SANDBOX_FLOW_LABELS.fullWaitlistSessionLocation).first(),
    ).toBeVisible()
  }

  async leaveActiveWaitlist() {
    await this.waitlistCard().getByRole('button', { name: 'Salir de waitlist' }).click()
    await this.confirmDialogAction({
      title: 'Salir de esta waitlist',
      actionLabel: 'Salir',
    })
  }

  async joinSandboxWaitlistAgain() {
    await this.waitlistEligibleScheduleCard()
      .getByRole('button', { name: 'Entrar en waitlist' })
      .click()
    await this.confirmDialogAction({
      title: 'Entrar en la waitlist',
      actionLabel: 'Entrar en waitlist',
    })
  }

  async reserveAvailableSession() {
    await this.availableScheduleCard().getByRole('button', { name: 'Reservar' }).click()
    await this.confirmDialogAction({
      title: 'Confirmar reserva',
      actionLabel: 'Confirmar reserva',
    })
  }

  async cancelCancelableReservation() {
    await this.cancelableReservationCard()
      .getByRole('button', { name: 'Cancelar reserva' })
      .click()

    await this.confirmDialogAction({
      title: 'Cancelar esta reserva',
      actionLabel: 'Cancelar',
    })
  }

  async expectWaitlistRemoved() {
    await expect(this.waitlistCard()).toHaveCount(0)
    await expect(
      this.waitlistEligibleScheduleCard().getByRole('button', { name: 'Entrar en waitlist' }),
    ).toBeVisible()
  }

  async expectWaitlistActiveAgain() {
    await expect(this.waitlistCard()).toBeVisible()
    await expect(this.waitlistCard().getByRole('button', { name: 'Salir de waitlist' })).toBeVisible()
  }

  async expectAvailableSessionReserved() {
    await expect(
      this.page
        .getByTestId('upcoming-reservation-card')
        .filter({ hasText: SANDBOX_FLOW_LABELS.availableSessionLocation }),
    ).toBeVisible()
    await expect(this.availableScheduleCard().getByRole('button', { name: 'Reservar' })).toHaveCount(
      0,
    )
  }

  async expectCancelableReservationCanceled() {
    await expect(this.cancelableReservationCard()).toHaveCount(0)
  }

  private async confirmDialogAction(input: {
    title: string
    actionLabel: string
  }) {
    const dialog = this.page.getByRole('alertdialog')

    await expect(dialog.getByRole('heading', { name: input.title })).toBeVisible()
    await dialog.getByRole('button', { name: input.actionLabel }).click()
    await expect(dialog).toHaveCount(0)
  }

  private cancelableReservationCard() {
    return this.page
      .getByTestId('upcoming-reservation-card')
      .filter({ hasText: SANDBOX_FLOW_LABELS.cancelableSessionLocation })
      .first()
  }

  private waitlistCard() {
    return this.page
      .getByTestId('waitlist-card')
      .filter({ hasText: SANDBOX_FLOW_LABELS.fullWaitlistSessionLocation })
      .first()
  }

  private availableScheduleCard() {
    return this.page
      .getByTestId('schedule-session-card')
      .filter({ hasText: SANDBOX_FLOW_LABELS.availableSessionLocation })
      .first()
  }

  private waitlistEligibleScheduleCard() {
    return this.page
      .getByTestId('schedule-session-card')
      .filter({ hasText: SANDBOX_FLOW_LABELS.fullWaitlistSessionLocation })
      .first()
  }
}
