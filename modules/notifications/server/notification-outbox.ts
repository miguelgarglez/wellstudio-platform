import { Prisma, type NotificationEventType } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import {
  buildReservationEmail,
  parseReservationNotificationPayload,
  type ReservationEmailEvent,
  type ReservationNotificationPayload,
} from '@/modules/notifications/server/reservation-email'
import {
  resendTransactionalEmailSender,
  type TransactionalEmailSender,
} from '@/modules/notifications/server/resend-email-provider'
import {
  buildSessionChangeEmail,
  parseSessionChangeNotificationPayload,
  type SessionChangeEmailEvent,
  type SessionChangeNotificationPayload,
  type SessionChangeSnapshot,
} from '@/modules/notifications/server/session-change-email'

const MAX_DELIVERY_ATTEMPTS = 5
const LOCK_TIMEOUT_MS = 10 * 60 * 1_000
const DEFAULT_BATCH_SIZE = 20
const RETRY_DELAYS_MS = [5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 12 * 60 * 60_000, 24 * 60 * 60_000]

type NotificationTx = Prisma.TransactionClient

type ClaimedNotificationJob = {
  id: string
  eventType: NotificationEventType
  recipient: string
  payload: Prisma.JsonValue
  idempotencyKey: string
  attemptCount: number
}

export async function enqueueReservationNotification(
  tx: NotificationTx,
  input: {
    eventType: ReservationEmailEvent
    reservationId: string
    memberId: string
    classSessionId: string
    occurredAt: Date
  },
) {
  const [member, session] = await Promise.all([
    tx.member.findUnique({
      where: { id: input.memberId },
      select: {
        firstName: true,
        lastName: true,
        user: { select: { email: true } },
      },
    }),
    tx.classSession.findUnique({
      where: { id: input.classSessionId },
      select: {
        startsAt: true,
        endsAt: true,
        locationLabel: true,
        classType: { select: { name: true } },
        coach: { select: { displayName: true } },
      },
    }),
  ])

  if (!member || !session) {
    throw new Error('Cannot enqueue reservation notification without member and session context')
  }

  const payload: ReservationNotificationPayload = {
    reservationId: input.reservationId,
    memberName: [member.firstName, member.lastName].filter(Boolean).join(' ') || 'socio',
    className: session.classType.name,
    coachName: session.coach?.displayName ?? null,
    locationLabel: session.locationLabel ?? null,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
  }
  const idempotencyKey = `${input.eventType.toLowerCase()}/${input.reservationId}`

  return tx.notificationJob.upsert({
    where: { idempotencyKey },
    create: {
      eventType: input.eventType,
      recipient: member.user.email,
      payload: payload as Prisma.InputJsonValue,
      idempotencyKey,
      referenceType: 'reservation',
      referenceId: input.reservationId,
      availableAt: input.occurredAt,
    },
    update: {},
    select: { id: true },
  })
}

export async function enqueueAdminSessionNotifications(
  tx: NotificationTx,
  input: {
    eventType: SessionChangeEmailEvent
    sessionId: string
    operationId: string
    occurredAt: Date
    previous: SessionChangeSnapshot | null
    reason?: string | null
  },
) {
  const session = await tx.classSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      locationLabel: true,
      classType: { select: { name: true } },
      coach: { select: { displayName: true } },
      reservations: {
        where: { status: 'BOOKED' },
        select: {
          id: true,
          member: {
            select: {
              firstName: true,
              lastName: true,
              user: { select: { email: true } },
            },
          },
        },
      },
      waitlistEntries: {
        where: { status: { in: ['WAITING', 'NOTIFIED'] } },
        select: {
          id: true,
          member: {
            select: {
              firstName: true,
              lastName: true,
              user: { select: { email: true } },
            },
          },
        },
      },
    },
  })

  if (!session) {
    throw new Error('Cannot enqueue session notifications without session context')
  }

  const current: SessionChangeSnapshot = {
    className: session.classType.name,
    coachName: session.coach?.displayName ?? null,
    locationLabel: session.locationLabel,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
  }
  const recipients = [
    ...session.reservations.map((reservation) => ({
      recordId: reservation.id,
      audience: 'RESERVATION' as const,
      member: reservation.member,
    })),
    ...session.waitlistEntries.map((entry) => ({
      recordId: entry.id,
      audience: 'WAITLIST' as const,
      member: entry.member,
    })),
  ]
  const jobs: Array<{ id: string }> = []

  for (const recipient of recipients) {
    const payload: SessionChangeNotificationPayload = {
      sessionId: session.id,
      affectedRecordId: recipient.recordId,
      audience: recipient.audience,
      memberName:
        [recipient.member.firstName, recipient.member.lastName].filter(Boolean).join(' ') ||
        'socio',
      ...current,
      previous: input.previous,
      reason: input.reason?.trim() || null,
    }
    const idempotencyKey = [
      input.eventType.toLowerCase(),
      session.id,
      input.operationId,
      recipient.audience.toLowerCase(),
      recipient.recordId,
    ].join('/')
    const job = await tx.notificationJob.upsert({
      where: { idempotencyKey },
      create: {
        eventType: input.eventType,
        recipient: recipient.member.user.email,
        payload: payload as Prisma.InputJsonValue,
        idempotencyKey,
        referenceType: 'class_session',
        referenceId: session.id,
        availableAt: input.occurredAt,
      },
      update: {},
      select: { id: true },
    })
    jobs.push(job)
  }

  return jobs
}

export async function dispatchNotificationJob(
  jobId: string,
  dependencies: {
    sender?: TransactionalEmailSender
    now?: Date
    portalUrl?: string
    allowExhaustedAttempts?: boolean
  } = {},
) {
  const now = dependencies.now ?? new Date()
  const job = await claimNotificationJob(
    jobId,
    now,
    dependencies.allowExhaustedAttempts ?? false,
  )

  if (!job) return { status: 'skipped' as const, jobId }

  const sender = dependencies.sender ?? resendTransactionalEmailSender

  try {
    const email = isSessionChangeEvent(job.eventType)
      ? buildSessionChangeEmail({
          eventType: job.eventType,
          payload: parseSessionChangeNotificationPayload(job.payload),
          portalUrl: resolveReservationsUrl(dependencies.portalUrl),
        })
      : buildReservationEmail({
          eventType: job.eventType,
          payload: parseReservationNotificationPayload(job.payload),
          portalUrl: resolveReservationsUrl(dependencies.portalUrl),
        })
    const delivery = await sender.send({
      recipient: job.recipient,
      ...email,
      idempotencyKey: job.idempotencyKey,
    })

    await markNotificationSent(job, delivery.providerMessageId, now)
    return { status: 'sent' as const, jobId, providerMessageId: delivery.providerMessageId }
  } catch (error) {
    const message = sanitizeDeliveryError(error)
    await markNotificationFailed(job, message, now)
    return { status: 'failed' as const, jobId, error: message }
  }
}

export async function dispatchNotificationJobSafely(
  jobId: string,
  dependencies: Parameters<typeof dispatchNotificationJob>[1] = {},
) {
  try {
    return await dispatchNotificationJob(jobId, dependencies)
  } catch (error) {
    console.error('Notification dispatch failed outside the reservation transaction.', error)
    return { status: 'failed' as const, jobId, error: 'Unexpected dispatcher failure' }
  }
}

export async function dispatchDueNotificationJobs(
  input: { limit?: number; now?: Date } = {},
) {
  const now = input.now ?? new Date()
  const ids = await prisma.notificationJob.findMany({
    where: {
      attemptCount: { lt: MAX_DELIVERY_ATTEMPTS },
      ...buildClaimableWhere(now),
    },
    select: { id: true },
    orderBy: [{ availableAt: 'asc' }, { createdAt: 'asc' }],
    take: Math.min(Math.max(input.limit ?? DEFAULT_BATCH_SIZE, 1), 100),
  })
  const summary = { examined: ids.length, sent: 0, failed: 0, skipped: 0 }

  for (const { id } of ids) {
    const result = await dispatchNotificationJobSafely(id, { now })
    summary[result.status] += 1
  }

  return summary
}

async function claimNotificationJob(
  jobId: string,
  now: Date,
  allowExhaustedAttempts: boolean,
): Promise<ClaimedNotificationJob | null> {
  const claim = await prisma.notificationJob.updateMany({
    where: {
      id: jobId,
      ...(allowExhaustedAttempts
        ? {}
        : { attemptCount: { lt: MAX_DELIVERY_ATTEMPTS } }),
      ...buildClaimableWhere(now),
    },
    data: {
      status: 'PROCESSING',
      lockedAt: now,
      attemptCount: { increment: 1 },
    },
  })

  if (claim.count !== 1) return null

  return prisma.notificationJob.findUniqueOrThrow({
    where: { id: jobId },
    select: {
      id: true,
      eventType: true,
      recipient: true,
      payload: true,
      idempotencyKey: true,
      attemptCount: true,
    },
  })
}

function buildClaimableWhere(now: Date): Prisma.NotificationJobWhereInput {
  return {
    OR: [
      {
        status: { in: ['PENDING', 'FAILED'] },
        availableAt: { lte: now },
      },
      {
        status: 'PROCESSING',
        lockedAt: { lte: new Date(now.getTime() - LOCK_TIMEOUT_MS) },
      },
    ],
  }
}

async function markNotificationSent(
  job: ClaimedNotificationJob,
  providerMessageId: string,
  now: Date,
) {
  await prisma.$transaction([
    prisma.notificationDeliveryAttempt.create({
      data: {
        notificationJobId: job.id,
        attemptNumber: job.attemptCount,
        status: 'SENT',
        provider: 'resend',
        providerMessageId,
        attemptedAt: now,
      },
    }),
    prisma.notificationJob.update({
      where: { id: job.id },
      data: {
        status: 'SENT',
        lockedAt: null,
        sentAt: now,
        providerMessageId,
        lastError: null,
      },
    }),
  ])
}

async function markNotificationFailed(
  job: ClaimedNotificationJob,
  error: string,
  now: Date,
) {
  await prisma.$transaction([
    prisma.notificationDeliveryAttempt.create({
      data: {
        notificationJobId: job.id,
        attemptNumber: job.attemptCount,
        status: 'FAILED',
        provider: 'resend',
        error,
        attemptedAt: now,
      },
    }),
    prisma.notificationJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        lockedAt: null,
        lastError: error,
        availableAt: new Date(
          now.getTime() + RETRY_DELAYS_MS[Math.min(job.attemptCount - 1, RETRY_DELAYS_MS.length - 1)],
        ),
      },
    }),
  ])
}

function resolveReservationsUrl(override?: string) {
  const appUrl = override ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return new URL('/app/reservations', appUrl).toString()
}

function isSessionChangeEvent(
  eventType: NotificationEventType,
): eventType is SessionChangeEmailEvent {
  return eventType === 'SESSION_RESCHEDULED' || eventType === 'SESSION_CANCELED'
}

function sanitizeDeliveryError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown delivery failure'
  return message.replace(/re_[A-Za-z0-9_-]+/g, '[redacted]').slice(0, 1_000)
}
