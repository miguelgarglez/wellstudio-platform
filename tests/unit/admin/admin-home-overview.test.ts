import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({ prisma: {} }))

import { buildAdminHomeOverview } from '@/modules/admin/server/admin-home-overview'

describe('buildAdminHomeOverview', () => {
  it('builds actionable daily summaries without inventing analytics', () => {
    const now = new Date('2026-08-07T10:00:00.000Z')
    const overview = buildAdminHomeOverview({
      now,
      sessions: [
        {
          id: 'session-1',
          startsAt: new Date('2026-08-07T15:30:00.000Z'),
          capacity: 8,
          reservedCount: 6,
          status: 'PUBLISHED',
          classType: { name: 'Strength' },
          coach: { displayName: 'Marta' },
          _count: { reservations: 6 },
        },
        {
          id: 'session-2',
          startsAt: new Date('2026-08-07T17:00:00.000Z'),
          capacity: 4,
          reservedCount: 3,
          status: 'CLOSED',
          classType: { name: 'Mobility' },
          coach: null,
          _count: { reservations: 2 },
        },
      ],
      newLeadCount: 3,
      pendingLeads: [
        {
          id: 'lead-1',
          firstName: 'Lucía',
          lastName: null,
          phone: '600 000 000',
          createdAt: new Date('2026-08-07T08:15:00.000Z'),
        },
      ],
      uncoveredMemberCount: 2,
      blockedMemberCount: 1,
      legacyRuleCount: 4,
      activeExceptionCount: 5,
    })

    expect(overview.sessionSummary).toEqual({
      sessionCount: 2,
      reservedCount: 9,
      capacity: 12,
      occupancyPercent: 75,
      pendingAttendanceCount: 8,
    })
    expect(overview.sessions[0]).toMatchObject({
      name: 'Strength',
      timeLabel: '17:30',
      coachLabel: 'Marta',
      occupancyLabel: '6/8',
      occupancyPercent: 75,
      statusLabel: 'Publicada',
    })
    expect(overview.sessions[1]).toMatchObject({ coachLabel: 'Sin coach', statusLabel: 'Cerrada' })
    expect(overview.signals).toEqual({
      newLeadCount: 3,
      uncoveredMemberCount: 2,
      blockedMemberCount: 1,
      legacyRuleCount: 4,
      activeExceptionCount: 5,
    })
    expect(overview.pendingLeads[0]).toEqual({
      id: 'lead-1',
      displayName: 'Lucía',
      phoneLabel: '600 000 000',
      ageLabel: 'Hace 1 h',
    })
  })

  it('keeps empty days and missing lead identity honest', () => {
    const now = new Date('2026-08-07T10:00:00.000Z')
    const overview = buildAdminHomeOverview({
      now,
      sessions: [],
      newLeadCount: 1,
      pendingLeads: [{ id: 'lead-2', firstName: null, lastName: null, phone: null, createdAt: now }],
      uncoveredMemberCount: 0,
      blockedMemberCount: 0,
      legacyRuleCount: 0,
      activeExceptionCount: 0,
    })

    expect(overview.sessionSummary.occupancyPercent).toBe(0)
    expect(overview.pendingLeads[0]).toMatchObject({
      displayName: 'Solicitud sin nombre',
      phoneLabel: 'Sin teléfono',
      ageLabel: 'Hace menos de 1 h',
    })
  })
})
