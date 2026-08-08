import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({ prisma: {} }))

import {
  buildAdminNotificationDeliveryOverview,
  parseAdminNotificationEventFilter,
  parseAdminNotificationStatusFilter,
} from '@/modules/notifications/server/admin-notification-deliveries'

const now = new Date('2026-08-08T12:00:00.000Z')
const payload = {
  reservationId: 'reservation-1',
  memberName: 'Ana Socio',
  className: 'Fuerza funcional',
  coachName: 'Marta Coach',
  locationLabel: 'Sala principal',
  startsAt: '2026-08-10T16:00:00.000Z',
  endsAt: '2026-08-10T16:50:00.000Z',
}

describe('admin notification delivery overview', () => {
  it('maps operational health, safe context and immutable attempts', () => {
    const failedJob = {
      id: 'job-failed',
      eventType: 'WAITLIST_PROMOTED' as const,
      status: 'FAILED' as const,
      recipient: 'ana@example.com',
      payload,
      referenceId: 'reservation-1',
      attemptCount: 5,
      availableAt: now,
      lockedAt: null,
      sentAt: null,
      providerMessageId: null,
      lastError: 'Provider unavailable',
      createdAt: new Date('2026-08-08T10:00:00.000Z'),
      updatedAt: new Date('2026-08-08T11:00:00.000Z'),
    }
    const overview = buildAdminNotificationDeliveryOverview({
      status: 'failed',
      event: 'promotion',
      jobs: [failedJob],
      failedCount: 2,
      activeCount: 1,
      sentRecentCount: 8,
      selectedJob: {
        ...failedJob,
        attempts: [
          {
            id: 'attempt-5',
            attemptNumber: 5,
            status: 'FAILED',
            provider: 'resend',
            providerMessageId: null,
            error: 'Provider unavailable',
            attemptedAt: new Date('2026-08-08T11:00:00.000Z'),
          },
        ],
      },
      now,
    })

    expect(overview.summary).toEqual({
      failedCount: 2,
      activeCount: 1,
      sentRecentCount: 8,
    })
    expect(overview.jobs[0]).toMatchObject({
      eventLabel: 'Promoción desde waitlist',
      statusLabel: 'Fallida',
      memberName: 'Ana Socio',
      className: 'Fuerza funcional',
      attemptCount: 5,
    })
    expect(overview.selectedJob).toMatchObject({
      canRetry: true,
      lastError: 'Provider unavailable',
      attempts: [{ attemptNumber: 5, statusLabel: 'Fallido' }],
    })
  })

  it('degrades safely when an old payload cannot be parsed', () => {
    const overview = buildAdminNotificationDeliveryOverview({
      status: 'all',
      event: 'all',
      jobs: [
        {
          id: 'job-invalid',
          eventType: 'RESERVATION_BOOKED',
          status: 'PENDING',
          recipient: 'ana@example.com',
          payload: { unexpected: true },
          referenceId: 'reservation-1',
          attemptCount: 0,
          availableAt: now,
          lockedAt: null,
          sentAt: null,
          providerMessageId: null,
          lastError: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      failedCount: 0,
      activeCount: 1,
      sentRecentCount: 0,
      selectedJob: null,
      now,
    })

    expect(overview.jobs[0]).toMatchObject({
      memberName: 'Socio no disponible',
      className: 'Contexto no disponible',
      statusLabel: 'Pendiente',
    })
  })

  it('normalizes manipulated filters instead of hiding deliveries', () => {
    expect(parseAdminNotificationStatusFilter('unknown')).toBe('all')
    expect(parseAdminNotificationStatusFilter('failed')).toBe('failed')
    expect(parseAdminNotificationEventFilter('unknown')).toBe('all')
    expect(parseAdminNotificationEventFilter('cancellation')).toBe('cancellation')
  })
})
