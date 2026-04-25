import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  memberFindManyMock,
  memberFindUniqueMock,
  overrideFindManyMock,
  classSessionFindManyMock,
} = vi.hoisted(() => ({
  memberFindManyMock: vi.fn(),
  memberFindUniqueMock: vi.fn(),
  overrideFindManyMock: vi.fn(),
  classSessionFindManyMock: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    member: {
      findMany: memberFindManyMock,
      findUnique: memberFindUniqueMock,
    },
    memberMembershipBookingOverride: {
      findMany: overrideFindManyMock,
    },
    classSession: {
      findMany: classSessionFindManyMock,
    },
  },
}))

import {
  buildAdminBookingOverrideItem,
  buildAdminSessionAccessCandidate,
  getAdminMemberOverrideOverview,
} from '@/modules/admin/server/admin-member-overrides-overview'

describe('getAdminMemberOverrideOverview', () => {
  beforeEach(() => {
    memberFindManyMock.mockReset()
    memberFindUniqueMock.mockReset()
    overrideFindManyMock.mockReset()
    classSessionFindManyMock.mockReset()
  })

  it('builds a member-centric overview with active memberships, history and session candidates', async () => {
    memberFindManyMock.mockResolvedValue([
      {
        id: 'member-1',
        firstName: 'E2E',
        lastName: 'Member',
        status: 'ACTIVE',
        user: {
          email: 'e2e.member@wellstudio.test',
        },
        memberships: [{ id: 'membership-1' }],
      },
    ])
    memberFindUniqueMock.mockResolvedValue({
      id: 'member-1',
      firstName: 'E2E',
      lastName: 'Member',
      status: 'ACTIVE',
      user: {
        email: 'e2e.member@wellstudio.test',
      },
      memberships: [
        {
          id: 'membership-1',
          status: 'ACTIVE',
          startsAt: new Date('2026-04-01T08:00:00.000Z'),
          endsAt: null,
          membershipPlan: {
            name: 'E2E Membership Flow',
            bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS',
            bookingPolicy: {
              policyType: 'PERIODIC_ALLOWANCE',
              periodType: 'CALENDAR_WEEK',
              allowanceCount: 4,
            },
          },
        },
      ],
    })
    overrideFindManyMock.mockResolvedValue([
      {
        id: 'override-1',
        overrideType: 'EXTRA_ALLOWANCE',
        extraBookings: 2,
        startsAt: new Date('2026-04-21T00:00:00.000Z'),
        expiresAt: new Date('2026-04-27T23:59:59.000Z'),
        reason: 'Compensación puntual',
        revokedAt: null,
        createdAt: new Date('2026-04-22T10:00:00.000Z'),
        memberMembership: {
          id: 'membership-1',
          membershipPlan: {
            name: 'E2E Membership Flow',
          },
        },
        grantedByUser: {
          email: 'admin@wellstudio.test',
          member: {
            firstName: 'Admin',
            lastName: 'Sandbox',
          },
        },
        revokedByUser: null,
        classSession: null,
      },
    ])
    classSessionFindManyMock.mockResolvedValue([
      {
        id: 'session-1',
        startsAt: new Date('2026-04-24T18:00:00.000Z'),
        endsAt: new Date('2026-04-24T18:50:00.000Z'),
        locationLabel: 'Sala principal',
        classType: {
          name: 'E2E Strength Flow',
        },
      },
    ])

    const overview = await getAdminMemberOverrideOverview({
      query: 'e2e',
      selectedMemberId: 'member-1',
      selectedMembershipId: 'membership-1',
      selectedSessionId: 'session-1',
    })

    expect(overview.searchResults).toHaveLength(1)
    expect(overview.selectedMember?.activeMemberships).toHaveLength(1)
    expect(overview.selectedMembership?.extraAllowanceEnabled).toBe(true)
    expect(overview.selectedMember?.overrides[0]).toMatchObject({
      typeLabel: 'Reservas extra',
      statusLabel: 'Vigente',
      summaryLabel: '+2 reservas en el periodo actual',
    })
    expect(overview.selectedSession).toMatchObject({
      id: 'session-1',
    })
  })

  it('returns empty detail state when no member is selected', async () => {
    memberFindManyMock.mockResolvedValue([])

    const overview = await getAdminMemberOverrideOverview({
      query: null,
      selectedMemberId: null,
      selectedMembershipId: null,
      selectedSessionId: null,
    })

    expect(overview.searchResults).toEqual([])
    expect(overview.selectedMember).toBeNull()
    expect(overview.selectedMembership).toBeNull()
    expect(overview.selectedSession).toBeNull()
  })
})

describe('admin member override mappers', () => {
  it('maps session access overrides into readable history rows', () => {
    const item = buildAdminBookingOverrideItem(
      {
        id: 'override-2',
        overrideType: 'SESSION_ACCESS',
        extraBookings: null,
        startsAt: new Date('2026-04-24T10:00:00.000Z'),
        expiresAt: new Date('2026-04-24T18:50:00.000Z'),
        reason: 'Invitación puntual',
        revokedAt: new Date('2026-04-24T11:00:00.000Z'),
        createdAt: new Date('2026-04-24T10:00:00.000Z'),
        memberMembership: {
          id: 'membership-1',
          membershipPlan: {
            name: 'Plan premium',
          },
        },
        grantedByUser: {
          email: 'admin@wellstudio.test',
          member: null,
        },
        revokedByUser: {
          email: 'staff@wellstudio.test',
          member: {
            firstName: 'Staff',
            lastName: 'Ops',
          },
        },
        classSession: {
          id: 'session-1',
          startsAt: new Date('2026-04-25T18:00:00.000Z'),
          endsAt: new Date('2026-04-25T18:50:00.000Z'),
          locationLabel: 'Sala premium',
          classType: {
            name: 'Grupo Premium',
          },
        },
      },
      new Date('2026-04-25T09:00:00.000Z'),
    )

    expect(item.typeLabel).toBe('Acceso puntual')
    expect(item.statusLabel).toBe('Revocado')
    expect(item.summaryLabel).toContain('Grupo Premium')
    expect(item.revokedByLabel).toBe('Staff Ops')
  })

  it('maps future published sessions into admin candidates', () => {
    const candidate = buildAdminSessionAccessCandidate(
      {
        id: 'session-1',
        startsAt: new Date('2026-04-24T18:00:00.000Z'),
        endsAt: new Date('2026-04-24T18:50:00.000Z'),
        locationLabel: 'Sala principal',
        classType: {
          name: 'Grupo Base',
        },
      },
      new Date('2026-04-23T09:00:00.000Z'),
    )

    expect(candidate.label).toContain('Grupo Base')
    expect(candidate.label).toContain('Mañana')
    expect(candidate.detailLabel).toBe('Sala principal')
    expect(candidate.className).toBe('Grupo Base')
    expect(candidate.dateLabel).toBe('Mañana')
    expect(candidate.timeLabel).toBe('20:00 – 20:50')
    expect(candidate.locationLabel).toBe('Sala principal')
  })
})
