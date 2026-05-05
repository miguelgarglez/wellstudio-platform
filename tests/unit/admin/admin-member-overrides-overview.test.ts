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
  mergeDefaultMemberResultSources,
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
        startsAt: new Date('2026-05-04T00:00:00.000Z'),
        expiresAt: new Date('2026-05-10T23:59:59.000Z'),
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
    })

    expect(overview.searchResults).toHaveLength(1)
    expect(overview.selectedMember?.activeMemberships).toHaveLength(1)
    expect(overview.selectedMember?.activeMemberships[0]?.extraAllowanceEnabled).toBe(true)
    expect(overview.selectedMember?.overrides[0]).toMatchObject({
      typeLabel: 'Reservas extra',
      statusLabel: 'Vigente',
      summaryLabel: '+2 reservas en el periodo actual',
    })
    expect(overview.selectedMember?.sessionCandidates[0]).toMatchObject({
      id: 'session-1',
    })
  })

  it('returns default member results without auto-selecting a member', async () => {
    overrideFindManyMock.mockResolvedValue([
      {
        memberMembership: {
          member: {
            id: 'member-recent',
            firstName: 'Recent',
            lastName: 'Override',
            status: 'ACTIVE',
            user: {
              email: 'recent.override@wellstudio.test',
            },
            memberships: [{ id: 'membership-recent' }],
          },
        },
      },
    ])
    memberFindManyMock
      .mockResolvedValueOnce([
        {
          id: 'member-active',
          firstName: 'Active',
          lastName: 'Member',
          status: 'ACTIVE',
          user: {
            email: 'active.member@wellstudio.test',
          },
          memberships: [{ id: 'membership-active' }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'member-updated',
          firstName: 'Updated',
          lastName: 'Member',
          status: 'INACTIVE',
          user: {
            email: 'updated.member@wellstudio.test',
          },
          memberships: [],
        },
      ])

    const overview = await getAdminMemberOverrideOverview({
      query: null,
      selectedMemberId: null,
    })

    expect(overview.searchResults).toMatchObject([
      {
        id: 'member-recent',
        contextLabel: 'Excepción reciente',
      },
      {
        id: 'member-active',
        contextLabel: 'Membership activa',
      },
      {
        id: 'member-updated',
        contextLabel: 'Actividad reciente',
      },
    ])
    expect(overview.selectedMember).toBeNull()
  })

  it('searches across members without hiding non-operable results', async () => {
    memberFindManyMock.mockResolvedValue([
      {
        id: 'member-no-active',
        firstName: 'No',
        lastName: 'Active',
        status: 'INACTIVE',
        user: {
          email: 'no.active@wellstudio.test',
        },
        memberships: [],
      },
    ])

    const overview = await getAdminMemberOverrideOverview({
      query: 'no',
      selectedMemberId: null,
    })

    expect(overview.searchResults).toMatchObject([
      {
        id: 'member-no-active',
        activeMembershipCount: 0,
        contextLabel: undefined,
      },
    ])
    expect(overview.selectedMember).toBeNull()
  })
})

describe('admin member override mappers', () => {
  it('merges default member sources by operational priority without duplicates', () => {
    const recentMember = {
      id: 'member-1',
      firstName: 'Recent',
      lastName: 'Override',
      status: 'ACTIVE',
      user: {
        email: 'recent.override@wellstudio.test',
      },
      memberships: [{ id: 'membership-1' }],
    }
    const activeMember = {
      id: 'member-2',
      firstName: 'Active',
      lastName: 'Member',
      status: 'ACTIVE',
      user: {
        email: 'active.member@wellstudio.test',
      },
      memberships: [{ id: 'membership-2' }],
    }
    const updatedMember = {
      id: 'member-3',
      firstName: 'Updated',
      lastName: 'Member',
      status: 'INACTIVE',
      user: {
        email: 'updated.member@wellstudio.test',
      },
      memberships: [],
    }

    const results = mergeDefaultMemberResultSources(
      [
        {
          memberMembership: {
            member: recentMember,
          },
        },
      ],
      [recentMember, activeMember],
      [activeMember, updatedMember],
    )

    expect(results.map((result) => result.member.id)).toEqual([
      'member-1',
      'member-2',
      'member-3',
    ])
    expect(results.map((result) => result.contextLabel)).toEqual([
      'Excepción reciente',
      'Membership activa',
      'Actividad reciente',
    ])
  })

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
