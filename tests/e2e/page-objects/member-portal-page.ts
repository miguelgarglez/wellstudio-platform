import { expect, type Page } from '@playwright/test'

export const SANDBOX_FLOW_LABELS = {
  planName: 'E2E Membership Flow',
  availableSessionLocation: 'E2E Sandbox Flow · Available session',
  cancelableSessionLocation: 'E2E Sandbox Flow · Cancelable reservation',
  fullWaitlistSessionLocation: 'E2E Sandbox Flow · Full waitlist session',
} as const

export class MemberPortalPage {
  constructor(private readonly page: Page) {}

  async gotoHome() {
    await this.page.goto('/app')
  }

  async expectSandboxHomeVisible() {
    await expect(
      this.page.getByRole('heading', { name: 'Bienvenido de nuevo' }),
    ).toBeVisible()
    await expect(this.page.getByText(SANDBOX_FLOW_LABELS.planName).first()).toBeVisible()
    await expect(
      this.page.getByText(SANDBOX_FLOW_LABELS.cancelableSessionLocation).first(),
    ).toBeVisible()
    await expect(
      this.page.getByText(SANDBOX_FLOW_LABELS.fullWaitlistSessionLocation).first(),
    ).toBeVisible()
  }
}
