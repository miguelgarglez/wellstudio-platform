import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({ prisma: {} }))

import {
  buildAdminReportsOverview,
  getAdminReportDateRange,
  parseAdminReportWindow,
} from '@/modules/admin/server/admin-reports-overview'

describe('admin reports overview', () => {
  it('normalizes unsupported windows to the explicit 28-day default', () => {
    expect(parseAdminReportWindow()).toBe('28d')
    expect(parseAdminReportWindow('')).toBe('28d')
    expect(parseAdminReportWindow('30d')).toBe('28d')
    expect(parseAdminReportWindow('7d')).toBe('7d')
    expect(parseAdminReportWindow('90d')).toBe('90d')
  })

  it('uses Madrid calendar days across the spring daylight-saving boundary', () => {
    const now = new Date('2026-03-31T10:00:00.000Z')
    const range = getAdminReportDateRange('7d', now)

    expect(range.start.toISOString()).toBe('2026-03-24T23:00:00.000Z')
    expect(range.end).toBe(now)
  })

  it('uses Madrid calendar days across the autumn daylight-saving boundary', () => {
    const now = new Date('2026-10-28T10:00:00.000Z')
    const range = getAdminReportDateRange('7d', now)

    expect(range.start.toISOString()).toBe('2026-10-21T22:00:00.000Z')
    expect(range.end).toBe(now)
  })

  it('aggregates operational metrics with explicit denominators', () => {
    const now = new Date('2026-08-09T12:00:00.000Z')
    const overview = buildAdminReportsOverview({
      now,
      reportWindow: '28d',
      range: { start: new Date('2026-07-12T22:00:00.000Z'), end: now },
      sessions: [
        {
          id: 'strength-1',
          startsAt: new Date('2026-08-08T08:00:00.000Z'),
          endsAt: new Date('2026-08-08T09:00:00.000Z'),
          capacity: 10,
          status: 'COMPLETED',
          classType: { id: 'strength', name: 'Fuerza' },
        },
        {
          id: 'mobility-1',
          startsAt: new Date('2026-08-07T08:00:00.000Z'),
          endsAt: new Date('2026-08-07T09:00:00.000Z'),
          capacity: 5,
          status: 'PUBLISHED',
          classType: { id: 'mobility', name: 'Movilidad' },
        },
      ],
      reservationAggregates: [
        { classSessionId: 'strength-1', status: 'ATTENDED', attendanceStatus: 'ATTENDED', _count: { _all: 6 } },
        { classSessionId: 'strength-1', status: 'NO_SHOW', attendanceStatus: 'NO_SHOW', _count: { _all: 1 } },
        { classSessionId: 'strength-1', status: 'CANCELED', attendanceStatus: 'PENDING', _count: { _all: 2 } },
        { classSessionId: 'mobility-1', status: 'BOOKED', attendanceStatus: 'PENDING', _count: { _all: 2 } },
      ],
      leads: [
        { convertedMemberId: 'member-1', source: 'public_home', utmSource: 'google' },
        { convertedMemberId: 'member-2', source: 'public_home', utmSource: 'google' },
        { convertedMemberId: null, source: 'public_home', utmSource: null },
        { convertedMemberId: null, source: null, utmSource: null },
      ],
    })

    expect(overview.summary).toEqual({
      sessionCount: 2,
      totalCapacity: 15,
      retainedReservationCount: 9,
      occupancyPercent: 60,
      reservationCount: 11,
      canceledCount: 2,
      cancellationPercent: 18,
      finalizedAttendanceCount: 7,
      attendedCount: 6,
      noShowCount: 1,
      attendancePercent: 86,
      leadCount: 4,
      convertedLeadCount: 2,
      leadConversionPercent: 50,
    })
    expect(overview.classTypes).toEqual([
      expect.objectContaining({ name: 'Fuerza', occupancyPercent: 70 }),
      expect.objectContaining({ name: 'Movilidad', occupancyPercent: 40 }),
    ])
    expect(overview.leadSources).toEqual([
      { label: 'google', count: 2, sharePercent: 50 },
      { label: 'No indicado', count: 1, sharePercent: 25 },
      { label: 'Web pública', count: 1, sharePercent: 25 },
    ])
    expect(overview.dataQuality).toEqual({
      staleSessionCount: 1,
      pendingAttendanceCount: 2,
      hasIssues: true,
    })
  })

  it('keeps empty windows honest and numerically safe', () => {
    const now = new Date('2026-08-09T12:00:00.000Z')
    const overview = buildAdminReportsOverview({
      now,
      reportWindow: '7d',
      range: { start: new Date('2026-08-02T22:00:00.000Z'), end: now },
      sessions: [],
      reservationAggregates: [],
      leads: [],
    })

    expect(overview.summary.occupancyPercent).toBe(0)
    expect(overview.summary.cancellationPercent).toBe(0)
    expect(overview.summary.attendancePercent).toBe(0)
    expect(overview.summary.leadConversionPercent).toBe(0)
    expect(overview.classTypes).toEqual([])
    expect(overview.leadSources).toEqual([])
    expect(overview.dataQuality.hasIssues).toBe(false)
  })
})
