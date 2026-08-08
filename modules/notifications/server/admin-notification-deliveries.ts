import type {
  NotificationEventType,
  NotificationJobStatus,
  Prisma,
} from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import { parseReservationNotificationPayload } from '@/modules/notifications/server/reservation-email'
import { parseSessionChangeNotificationPayload } from '@/modules/notifications/server/session-change-email'

const LIST_LIMIT = 40
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1_000
const WELLSTUDIO_TIME_ZONE = 'Europe/Madrid'

export type AdminNotificationStatusFilter = 'all' | 'failed' | 'pending' | 'sent'
export type AdminNotificationEventFilter =
  | 'all'
  | 'booking'
  | 'cancellation'
  | 'promotion'
  | 'session'

type NotificationJobRecord = {
  id: string
  eventType: NotificationEventType
  status: NotificationJobStatus
  recipient: string
  payload: Prisma.JsonValue
  referenceId: string
  attemptCount: number
  availableAt: Date
  lockedAt: Date | null
  sentAt: Date | null
  providerMessageId: string | null
  lastError: string | null
  createdAt: Date
  updatedAt: Date
}

type NotificationAttemptRecord = {
  id: string
  attemptNumber: number
  status: 'SENT' | 'FAILED'
  provider: string
  providerMessageId: string | null
  error: string | null
  attemptedAt: Date
}

export type AdminNotificationDeliveryOverview = Awaited<
  ReturnType<typeof getAdminNotificationDeliveryOverview>
>

export async function getAdminNotificationDeliveryOverview(input: {
  status?: string | null
  event?: string | null
  selectedJobId?: string | null
  now?: Date
} = {}) {
  const now = input.now ?? new Date()
  const status = parseAdminNotificationStatusFilter(input.status)
  const event = parseAdminNotificationEventFilter(input.event)
  const where = buildNotificationListWhere({ status, event })
  const recentSince = new Date(now.getTime() - RECENT_WINDOW_MS)

  const [jobs, failedCount, activeCount, sentRecentCount, selectedJob] = await Promise.all([
    prisma.notificationJob.findMany({
      where,
      select: notificationJobSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: LIST_LIMIT,
    }),
    prisma.notificationJob.count({ where: { status: 'FAILED' } }),
    prisma.notificationJob.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
    prisma.notificationJob.count({
      where: { status: 'SENT', sentAt: { gte: recentSince } },
    }),
    input.selectedJobId
      ? prisma.notificationJob.findUnique({
          where: { id: input.selectedJobId },
          select: {
            ...notificationJobSelect,
            attempts: {
              orderBy: [{ attemptNumber: 'desc' }, { attemptedAt: 'desc' }],
              take: 20,
              select: {
                id: true,
                attemptNumber: true,
                status: true,
                provider: true,
                providerMessageId: true,
                error: true,
                attemptedAt: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ])

  return buildAdminNotificationDeliveryOverview({
    status,
    event,
    jobs,
    failedCount,
    activeCount,
    sentRecentCount,
    selectedJob,
    now,
  })
}

export function buildAdminNotificationDeliveryOverview(input: {
  status: AdminNotificationStatusFilter
  event: AdminNotificationEventFilter
  jobs: NotificationJobRecord[]
  failedCount: number
  activeCount: number
  sentRecentCount: number
  selectedJob:
    | (NotificationJobRecord & { attempts: NotificationAttemptRecord[] })
    | null
  now: Date
}) {
  return {
    filters: {
      status: input.status,
      event: input.event,
    },
    summary: {
      failedCount: input.failedCount,
      activeCount: input.activeCount,
      sentRecentCount: input.sentRecentCount,
    },
    jobs: input.jobs.map((job) => mapNotificationJob(job, input.now)),
    selectedJob: input.selectedJob
      ? {
          ...mapNotificationJob(input.selectedJob, input.now),
          updatedAt: input.selectedJob.updatedAt.toISOString(),
          availableAtLabel: formatDateTime(input.selectedJob.availableAt),
          lockedAtLabel: input.selectedJob.lockedAt
            ? formatDateTime(input.selectedJob.lockedAt)
            : null,
          sentAtLabel: input.selectedJob.sentAt
            ? formatDateTime(input.selectedJob.sentAt)
            : null,
          providerMessageId: input.selectedJob.providerMessageId,
          lastError: input.selectedJob.lastError,
          attempts: input.selectedJob.attempts.map((attempt) => ({
            id: attempt.id,
            attemptNumber: attempt.attemptNumber,
            status: attempt.status,
            statusLabel: attempt.status === 'SENT' ? 'Enviado' : 'Fallido',
            providerLabel: capitalize(attempt.provider),
            providerMessageId: attempt.providerMessageId,
            error: attempt.error,
            attemptedAtLabel: formatDateTime(attempt.attemptedAt),
          })),
          canRetry: input.selectedJob.status === 'FAILED',
        }
      : null,
  }
}

export function parseAdminNotificationStatusFilter(
  value?: string | null,
): AdminNotificationStatusFilter {
  return value === 'failed' || value === 'pending' || value === 'sent' ? value : 'all'
}

export function parseAdminNotificationEventFilter(
  value?: string | null,
): AdminNotificationEventFilter {
  return value === 'booking' || value === 'cancellation' || value === 'promotion' || value === 'session'
    ? value
    : 'all'
}

function buildNotificationListWhere(input: {
  status: AdminNotificationStatusFilter
  event: AdminNotificationEventFilter
}): Prisma.NotificationJobWhereInput {
  const statuses: NotificationJobStatus[] | undefined =
    input.status === 'failed'
      ? ['FAILED']
      : input.status === 'pending'
        ? ['PENDING', 'PROCESSING']
        : input.status === 'sent'
          ? ['SENT']
          : undefined
  const eventType: Prisma.NotificationJobWhereInput['eventType'] =
    input.event === 'booking'
      ? 'RESERVATION_BOOKED'
      : input.event === 'cancellation'
        ? 'RESERVATION_CANCELED'
        : input.event === 'promotion'
          ? 'WAITLIST_PROMOTED'
          : input.event === 'session'
            ? { in: ['SESSION_RESCHEDULED', 'SESSION_CANCELED'] }
          : undefined

  return {
    ...(statuses ? { status: { in: statuses } } : {}),
    ...(eventType ? { eventType } : {}),
  }
}

function mapNotificationJob(job: NotificationJobRecord, now: Date) {
  const payload = readNotificationPayload(job.payload)
  const status = formatNotificationStatus(job.status)

  return {
    id: job.id,
    eventType: job.eventType,
    eventLabel: formatNotificationEvent(job.eventType),
    status: job.status,
    statusLabel: status.label,
    statusTone: status.tone,
    recipient: job.recipient,
    referenceId: job.referenceId,
    attemptCount: job.attemptCount,
    memberName: payload?.memberName ?? 'Socio no disponible',
    className: payload?.className ?? 'Contexto no disponible',
    sessionLabel: payload
      ? `${formatSessionDate(payload.startsAt)} · ${formatSessionTime(payload.startsAt)}`
      : 'Sesión no disponible',
    coachName: payload?.coachName ?? 'Sin coach',
    locationLabel: payload?.locationLabel ?? 'Sin espacio indicado',
    contextTitle: payload?.contextTitle ?? 'Contexto no disponible',
    audienceLabel: payload?.audienceLabel ?? 'Destinatario no disponible',
    createdAtLabel: formatDateTime(job.createdAt),
    ageLabel: formatRelativeAge(job.createdAt, now),
  }
}

function readNotificationPayload(value: Prisma.JsonValue) {
  try {
    const payload = parseReservationNotificationPayload(value)
    return {
      ...payload,
      contextTitle: 'Reserva comunicada',
      audienceLabel: 'Reserva confirmada',
    }
  } catch {
    try {
      const payload = parseSessionChangeNotificationPayload(value)
      return {
        ...payload,
        contextTitle: 'Sesión comunicada',
        audienceLabel:
          payload.audience === 'WAITLIST' ? 'Lista de espera' : 'Reserva confirmada',
      }
    } catch {
      return null
    }
  }
}

function formatNotificationEvent(eventType: NotificationEventType) {
  switch (eventType) {
    case 'RESERVATION_BOOKED':
      return 'Reserva confirmada'
    case 'RESERVATION_CANCELED':
      return 'Cancelación confirmada'
    case 'WAITLIST_PROMOTED':
      return 'Promoción desde waitlist'
    case 'SESSION_RESCHEDULED':
      return 'Sesión actualizada'
    case 'SESSION_CANCELED':
      return 'Sesión cancelada por el centro'
    default:
      return assertNever(eventType)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported notification event: ${value}`)
}

function formatNotificationStatus(status: NotificationJobStatus) {
  if (status === 'FAILED') return { label: 'Fallida', tone: 'danger' as const }
  if (status === 'SENT') return { label: 'Enviada', tone: 'success' as const }
  if (status === 'PROCESSING') return { label: 'Procesando', tone: 'blue' as const }
  return { label: 'Pendiente', tone: 'neutral' as const }
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: WELLSTUDIO_TIME_ZONE,
  }).format(value)
}

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: WELLSTUDIO_TIME_ZONE,
  }).format(new Date(value))
}

function formatSessionTime(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: WELLSTUDIO_TIME_ZONE,
  }).format(new Date(value))
}

function formatRelativeAge(value: Date, now: Date) {
  const minutes = Math.max(0, Math.floor((now.getTime() - value.getTime()) / 60_000))
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `Hace ${days} d`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const notificationJobSelect = {
  id: true,
  eventType: true,
  status: true,
  recipient: true,
  payload: true,
  referenceId: true,
  attemptCount: true,
  availableAt: true,
  lockedAt: true,
  sentAt: true,
  providerMessageId: true,
  lastError: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationJobSelect
