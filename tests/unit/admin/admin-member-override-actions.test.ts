import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  requireAdminOrStaffContextMock,
  grantMembershipPeriodAllowanceOverrideMock,
} = vi.hoisted(() => ({
  requireAdminOrStaffContextMock: vi.fn(),
  grantMembershipPeriodAllowanceOverrideMock: vi.fn(),
}))

vi.mock('@/modules/auth/server/identity', () => ({
  requireAdminOrStaffContext: requireAdminOrStaffContextMock,
}))

vi.mock('@/modules/reservations/server/membership-booking-overrides', () => ({
  grantMembershipPeriodAllowanceOverride: grantMembershipPeriodAllowanceOverrideMock,
  grantMembershipSessionAccessOverride: vi.fn(),
  revokeMembershipBookingOverride: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

import { grantExtraAllowanceOverrideAction } from '@/app/(admin)/admin/overrides/actions'

describe('grantExtraAllowanceOverrideAction', () => {
  beforeEach(() => {
    requireAdminOrStaffContextMock.mockReset()
    grantMembershipPeriodAllowanceOverrideMock.mockReset()
  })

  it('returns a guard message when no admin session is available', async () => {
    requireAdminOrStaffContextMock.mockResolvedValue(null)

    const state = await grantExtraAllowanceOverrideAction(null, new FormData())

    expect(state).toMatchObject({
      message: 'Necesitamos una sesión admin o staff válida para conceder excepciones.',
    })
    expect(grantMembershipPeriodAllowanceOverrideMock).not.toHaveBeenCalled()
  })
})
