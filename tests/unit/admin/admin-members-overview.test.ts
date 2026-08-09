import { beforeEach, describe, expect, it, vi } from 'vitest'

const { memberFindManyMock, memberFindUniqueMock, memberGroupByMock, membershipPlanFindManyMock, creditPackFindManyMock, bookingOverviewMock } = vi.hoisted(() => ({
  memberFindManyMock: vi.fn(),
  memberFindUniqueMock: vi.fn(),
  memberGroupByMock: vi.fn(),
  membershipPlanFindManyMock: vi.fn(),
  creditPackFindManyMock: vi.fn(),
  bookingOverviewMock: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    member: {
      findMany: memberFindManyMock,
      findUnique: memberFindUniqueMock,
      groupBy: memberGroupByMock,
    },
    membershipPlan: { findMany: membershipPlanFindManyMock },
    creditPack: { findMany: creditPackFindManyMock },
  },
}))

vi.mock('@/modules/reservations/server/member-reservations-overview', () => ({
  getMemberReservationsOverviewForMember: bookingOverviewMock,
}))

import {
  getAdminMembersOverview,
  normalizeStatusFilter,
} from '@/modules/admin/server/admin-members-overview'

const now = new Date('2026-08-07T10:00:00.000Z')

describe('admin members overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memberFindManyMock.mockResolvedValue([])
    memberFindUniqueMock.mockResolvedValue(null)
    memberGroupByMock.mockResolvedValue([])
    membershipPlanFindManyMock.mockResolvedValue([])
    creditPackFindManyMock.mockResolvedValue([])
    bookingOverviewMock.mockResolvedValue({
      bookingState: {
        canBook: true,
        reason: 'ready',
        advisoryLabel: 'Con capacidad operativa para reservar',
        description: 'Plan activo.',
      },
      schedulePreview: [],
      upcomingReservations: [],
      activeWaitlists: [],
    })
  })

  it('normalizes unsupported filters to the safe active default', () => {
    expect(normalizeStatusFilter(null)).toBe('active')
    expect(normalizeStatusFilter('unknown')).toBe('active')
    expect(normalizeStatusFilter('inactive')).toBe('inactive')
    expect(normalizeStatusFilter('all')).toBe('all')
  })

  it('searches identity fields and groups both inactive member states', async () => {
    memberGroupByMock.mockResolvedValue([
      { status: 'ACTIVE', _count: { _all: 5 } },
      { status: 'INACTIVE', _count: { _all: 2 } },
      { status: 'LEAD_CONVERTED', _count: { _all: 1 } },
      { status: 'BLOCKED', _count: { _all: 1 } },
    ])

    const overview = await getAdminMembersOverview({
      query: ' MIGUEL@example.com ',
      status: 'inactive',
      now,
    })

    expect(memberFindManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: { in: ['INACTIVE', 'LEAD_CONVERTED'] },
        OR: expect.arrayContaining([
          { user: { normalizedEmail: { contains: 'miguel@example.com' } } },
        ]),
      }),
      take: 30,
    }))
    expect(overview.counts).toEqual({ all: 9, active: 5, inactive: 3, blocked: 1 })
    expect(overview.selectedMember).toBeNull()
  })

  it('maps a complete operational dossier without inventing missing values', async () => {
    memberFindManyMock.mockResolvedValue([
      {
        id: 'member-1',
        firstName: 'Marta',
        lastName: 'Semanal',
        phone: null,
        status: 'ACTIVE',
        joinedAt: new Date('2026-04-01T10:00:00.000Z'),
        updatedAt: now,
        user: { email: 'marta@example.com' },
        _count: { memberships: 1, reservations: 1 },
      },
    ])
    memberGroupByMock.mockResolvedValue([{ status: 'ACTIVE', _count: { _all: 1 } }])
    memberFindUniqueMock.mockResolvedValue(buildSelectedMember())
    membershipPlanFindManyMock.mockResolvedValue([{
      id: 'plan-1',
      name: 'Plan semanal',
      description: 'Tres reservas por semana',
      priceAmount: 7900,
      currency: 'EUR',
      billingInterval: 'MONTHLY',
      bookingPolicyType: null,
      bookingPolicy: {
        policyType: 'PERIODIC_ALLOWANCE',
        periodType: 'CALENDAR_WEEK',
        allowanceCount: 3,
      },
    }])
    creditPackFindManyMock.mockResolvedValue([{
      id: 'pack-1',
      name: 'Bono 10',
      description: 'Diez accesos flexibles',
      creditsTotal: 10,
      priceAmount: 11000,
      currency: 'EUR',
      expiresAfterDays: 90,
    }])

    const overview = await getAdminMembersOverview({
      selectedMemberId: 'member-1',
      now,
    })

    expect(overview.members[0]).toMatchObject({
      displayName: 'Marta Semanal',
      phoneLabel: 'Sin teléfono',
      activeMembershipCount: 1,
      upcomingReservationCount: 1,
    })
    expect(overview.selectedMember).toMatchObject({
      displayName: 'Marta Semanal',
      accountStatusLabel: 'Cuenta activa',
      provenanceLabel: 'Lead convertido · Web pública',
      memberships: [{ planName: 'Plan semanal', statusLabel: 'Activa', usageCount: 3, overrideCount: 1 }],
      credits: [{ packName: 'Bono 10', balance: 6, total: 10 }],
      reservations: [{ className: 'Fuerza', statusLabel: 'Reservada', isUpcoming: true }],
      activeWaitlist: [{ className: 'Movilidad', statusLabel: 'En espera', positionLabel: 'Posición 2' }],
      payments: [{ typeLabel: 'Membresía', statusLabel: 'Pagado', amountLabel: '79,00 €' }],
      notes: [{ body: 'Prefiere horario de tarde', visibilityLabel: 'INTERNAL' }],
      bookingWorkspace: {
        bookingState: { canBook: true },
        schedulePreview: [],
      },
    })
    expect(overview.selectedMember?.memberships[0].canEndManually).toBe(true)
    expect(overview.membershipPlans).toEqual([expect.objectContaining({
      id: 'plan-1',
      priceLabel: '79,00 €',
      billingLabel: 'Mensual',
      policyLabel: '3 / semana',
    })])
    expect(overview.creditPacks).toEqual([expect.objectContaining({
      id: 'pack-1',
      creditsTotal: 10,
      priceLabel: '110,00 €',
      expiryLabel: '90 días de vigencia',
    })])
  })

  it('does not expose a stale selected id when the member no longer exists', async () => {
    const overview = await getAdminMembersOverview({ selectedMemberId: 'missing', now })

    expect(overview.selectedMemberId).toBeNull()
    expect(overview.selectedMember).toBeNull()
  })
})

function buildSelectedMember() {
  return {
    id: 'member-1',
    firstName: 'Marta',
    lastName: 'Semanal',
    phone: null,
    birthDate: null,
    status: 'ACTIVE',
    joinedAt: new Date('2026-04-01T10:00:00.000Z'),
    createdAt: new Date('2026-03-20T10:00:00.000Z'),
    updatedAt: now,
    user: {
      email: 'marta@example.com',
      status: 'ACTIVE',
      emailVerifiedAt: new Date('2026-03-20T10:30:00.000Z'),
      lastLoginAt: new Date('2026-08-06T18:00:00.000Z'),
      roles: [{ role: 'MEMBER' }],
    },
    memberships: [{
      id: 'membership-1',
      status: 'ACTIVE',
      startsAt: new Date('2026-08-01T00:00:00.000Z'),
      endsAt: new Date('2026-08-31T23:59:59.000Z'),
      autoRenews: true,
      providerSubscriptionId: null,
      membershipPlan: { name: 'Plan semanal' },
      _count: { usages: 3, bookingOverrides: 1 },
    }],
    creditAccounts: [{
      id: 'credit-1',
      status: 'ACTIVE',
      openedAt: new Date('2026-08-01T00:00:00.000Z'),
      expiresAt: null,
      creditPack: { id: 'pack-1', name: 'Bono 10', creditsTotal: 10 },
      ledgerEntries: [{
        balanceAfter: 6,
        creditsDelta: -4,
        entryType: 'RESERVATION_CONSUME',
        createdAt: new Date('2026-08-04T10:00:00.000Z'),
      }],
    }],
    reservations: [{
      id: 'reservation-1',
      status: 'BOOKED',
      attendanceStatus: 'PENDING',
      source: 'MEMBER_APP',
      classSession: {
        id: 'session-1',
        startsAt: new Date('2026-08-08T16:00:00.000Z'),
        endsAt: new Date('2026-08-08T16:50:00.000Z'),
        locationLabel: 'Sala 1',
        classType: { name: 'Fuerza' },
        coach: { displayName: 'Miguel Coach' },
      },
    }],
    waitlistEntries: [{
      id: 'waitlist-1',
      status: 'WAITING',
      position: 2,
      joinedAt: new Date('2026-08-05T10:00:00.000Z'),
      classSession: {
        id: 'session-2',
        startsAt: new Date('2026-08-09T10:00:00.000Z'),
        classType: { name: 'Movilidad' },
      },
    }],
    payments: [{
      id: 'payment-1',
      status: 'SUCCEEDED',
      paymentType: 'MEMBERSHIP_PURCHASE',
      amount: 7900,
      currency: 'EUR',
      createdAt: new Date('2026-08-01T10:00:00.000Z'),
    }],
    notes: [{
      id: 'note-1',
      body: 'Prefiere horario de tarde',
      visibility: 'INTERNAL',
      createdAt: new Date('2026-08-02T10:00:00.000Z'),
    }],
    leadsConvertedFrom: [{
      id: 'lead-1',
      source: 'public_home',
      createdAt: new Date('2026-03-18T10:00:00.000Z'),
    }],
  }
}
