import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    notificationJob: {
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    notificationDeliveryAttempt: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: prismaMock }))

import {
  dispatchDueNotificationJobs,
  dispatchNotificationJob,
  enqueueReservationNotification,
} from '@/modules/notifications/server/notification-outbox'
import { buildReservationEmail } from '@/modules/notifications/server/reservation-email'
import { createResendTransactionalEmailSender } from '@/modules/notifications/server/resend-email-provider'

const now = new Date('2026-08-08T10:00:00.000Z')
const payload = {
  reservationId: 'reservation-1',
  memberName: 'Ana & Socio',
  className: 'Fuerza <Total>',
  coachName: 'Marta Coach',
  locationLabel: 'Sala 1',
  startsAt: '2026-08-10T16:00:00.000Z',
  endsAt: '2026-08-10T16:50:00.000Z',
}

describe('notification outbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    )
    prismaMock.notificationDeliveryAttempt.create.mockResolvedValue({ id: 'attempt-1' })
    prismaMock.notificationJob.update.mockResolvedValue({ id: 'job-1' })
  })

  it('enqueues an immutable reservation snapshot with a stable key', async () => {
    const tx = {
      member: {
        findUnique: vi.fn().mockResolvedValue({
          firstName: 'Ana',
          lastName: 'Socio',
          user: { email: 'ana@example.com' },
        }),
      },
      classSession: {
        findUnique: vi.fn().mockResolvedValue({
          startsAt: new Date(payload.startsAt),
          endsAt: new Date(payload.endsAt),
          locationLabel: 'Sala 1',
          classType: { name: 'Fuerza Total' },
          coach: { displayName: 'Marta Coach' },
        }),
      },
      notificationJob: {
        upsert: vi.fn().mockResolvedValue({ id: 'job-1' }),
      },
    }

    await enqueueReservationNotification(tx as never, {
      eventType: 'RESERVATION_BOOKED',
      reservationId: 'reservation-1',
      memberId: 'member-1',
      classSessionId: 'session-1',
      occurredAt: now,
    })

    expect(tx.notificationJob.upsert).toHaveBeenCalledWith({
      where: { idempotencyKey: 'reservation_booked/reservation-1' },
      create: expect.objectContaining({
        recipient: 'ana@example.com',
        payload: expect.objectContaining({
          reservationId: 'reservation-1',
          className: 'Fuerza Total',
        }),
        referenceType: 'reservation',
        referenceId: 'reservation-1',
      }),
      update: {},
      select: { id: true },
    })
  })

  it('claims and sends a job once with provider idempotency', async () => {
    prismaMock.notificationJob.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.notificationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-1',
      eventType: 'RESERVATION_BOOKED',
      recipient: 'ana@example.com',
      payload,
      idempotencyKey: 'reservation_booked/reservation-1',
      attemptCount: 1,
    })
    const sender = {
      send: vi.fn().mockResolvedValue({ providerMessageId: 'resend-1' }),
    }

    const result = await dispatchNotificationJob('job-1', {
      sender,
      now,
      portalUrl: 'https://wellstudio.example/app/reservations',
    })

    expect(result).toEqual({
      status: 'sent',
      jobId: 'job-1',
      providerMessageId: 'resend-1',
    })
    expect(sender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'ana@example.com',
        idempotencyKey: 'reservation_booked/reservation-1',
      }),
    )
    expect(prismaMock.notificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'SENT', attemptNumber: 1 }),
    })
  })

  it('backs off a failed delivery without throwing into the reservation flow', async () => {
    prismaMock.notificationJob.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.notificationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-1',
      eventType: 'RESERVATION_CANCELED',
      recipient: 'ana@example.com',
      payload,
      idempotencyKey: 'reservation_canceled/reservation-1',
      attemptCount: 1,
    })
    const sender = {
      send: vi.fn().mockRejectedValue(new Error('Provider unavailable')),
    }

    const result = await dispatchNotificationJob('job-1', { sender, now })

    expect(result.status).toBe('failed')
    expect(prismaMock.notificationJob.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: expect.objectContaining({
        status: 'FAILED',
        availableAt: new Date('2026-08-08T10:05:00.000Z'),
        lastError: 'Provider unavailable',
      }),
    })
  })

  it('skips a job already claimed or delivered by another worker', async () => {
    prismaMock.notificationJob.updateMany.mockResolvedValue({ count: 0 })

    await expect(dispatchNotificationJob('job-1', { now })).resolves.toEqual({
      status: 'skipped',
      jobId: 'job-1',
    })
  })

  it('allows an explicit manual attempt after the automatic limit', async () => {
    prismaMock.notificationJob.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.notificationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-1',
      eventType: 'RESERVATION_BOOKED',
      recipient: 'ana@example.com',
      payload,
      idempotencyKey: 'reservation_booked/reservation-1',
      attemptCount: 6,
    })
    const sender = {
      send: vi.fn().mockResolvedValue({ providerMessageId: 'resend-manual-1' }),
    }

    await dispatchNotificationJob('job-1', {
      sender,
      now,
      allowExhaustedAttempts: true,
    })

    expect(prismaMock.notificationJob.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'job-1',
        OR: [
          { status: { in: ['PENDING', 'FAILED'] }, availableAt: { lte: now } },
          {
            status: 'PROCESSING',
            lockedAt: { lte: new Date('2026-08-08T09:50:00.000Z') },
          },
        ],
      },
      data: {
        status: 'PROCESSING',
        lockedAt: now,
        attemptCount: { increment: 1 },
      },
    })
    expect(prismaMock.notificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ attemptNumber: 6, status: 'SENT' }),
    })
  })

  it('drains only the bounded due-job selection', async () => {
    prismaMock.notificationJob.findMany.mockResolvedValue([])

    await expect(dispatchDueNotificationJobs({ limit: 500, now })).resolves.toEqual({
      examined: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    })
    expect(prismaMock.notificationJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    )
  })
})

describe('reservation email', () => {
  it('renders actionable escaped HTML and a text fallback', () => {
    const email = buildReservationEmail({
      eventType: 'RESERVATION_BOOKED',
      payload,
      portalUrl: 'https://wellstudio.example/app/reservations',
    })

    expect(email.subject).toContain('Fuerza <Total>')
    expect(email.html).toContain('Fuerza &lt;Total&gt;')
    expect(email.html).toContain('Ana &amp; Socio')
    expect(email.text).toContain('Ver mis reservas')
  })

  it('uses the cancellation message for canceled reservations', () => {
    const email = buildReservationEmail({
      eventType: 'RESERVATION_CANCELED',
      payload,
      portalUrl: 'https://wellstudio.example/app/reservations',
    })

    expect(email.subject).toContain('Reserva cancelada')
    expect(email.html).toContain('La plaza se ha liberado')
  })

  it('explains an automatic promotion without implying a pending offer', () => {
    const email = buildReservationEmail({
      eventType: 'WAITLIST_PROMOTED',
      payload,
      portalUrl: 'https://wellstudio.example/app/reservations',
    })

    expect(email.subject).toContain('Ya tienes plaza')
    expect(email.html).toContain('Has conseguido plaza')
    expect(email.text).toContain('se ha convertido automáticamente en reserva')
  })
})

describe('Resend transactional adapter', () => {
  it('sends the idempotency key without exposing provider concerns upstream', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'resend-1' }),
    })
    const sender = createResendTransactionalEmailSender(
      { apiKey: 'secret', from: 'WellStudio <noreply@example.com>' },
      fetchMock,
    )

    await sender.send({
      recipient: 'ana@example.com',
      subject: 'Reserva',
      text: 'Reserva',
      html: '<p>Reserva</p>',
      idempotencyKey: 'reservation_booked/reservation-1',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Idempotency-Key': 'reservation_booked/reservation-1',
        }),
      }),
    )
  })
})
