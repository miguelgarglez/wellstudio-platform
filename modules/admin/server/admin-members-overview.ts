import type { MemberStatus, Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import { normalizeEmail } from '@/modules/auth/lib/normalize-email'
import { buildPlanWindowLabel } from '@/modules/members/server/member-commercial'

const MEMBER_LIST_LIMIT = 30
const DETAIL_HISTORY_LIMIT = 10
const WELLSTUDIO_TIME_ZONE = 'Europe/Madrid'

const adminMemberDetailSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  birthDate: true,
  status: true,
  joinedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      email: true,
      status: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      roles: { select: { role: true } },
    },
  },
  memberships: {
    orderBy: { startsAt: 'desc' as const },
    take: DETAIL_HISTORY_LIMIT,
    select: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
      autoRenews: true,
      providerSubscriptionId: true,
      membershipPlan: { select: { name: true } },
      _count: { select: { usages: true, bookingOverrides: true } },
    },
  },
  creditAccounts: {
    orderBy: { openedAt: 'desc' as const },
    take: DETAIL_HISTORY_LIMIT,
    select: {
      id: true,
      status: true,
      openedAt: true,
      expiresAt: true,
      creditPack: { select: { name: true, creditsTotal: true } },
      ledgerEntries: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { balanceAfter: true },
      },
    },
  },
  reservations: {
    orderBy: { classSession: { startsAt: 'desc' as const } },
    take: 12,
    select: {
      id: true,
      status: true,
      attendanceStatus: true,
      source: true,
      classSession: {
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          locationLabel: true,
          classType: { select: { name: true } },
          coach: { select: { displayName: true } },
        },
      },
    },
  },
  waitlistEntries: {
    where: { status: { in: ['WAITING', 'NOTIFIED'] as const } },
    orderBy: { joinedAt: 'desc' as const },
    take: DETAIL_HISTORY_LIMIT,
    select: {
      id: true,
      status: true,
      position: true,
      joinedAt: true,
      classSession: {
        select: {
          id: true,
          startsAt: true,
          classType: { select: { name: true } },
        },
      },
    },
  },
  payments: {
    orderBy: { createdAt: 'desc' as const },
    take: 6,
    select: {
      id: true,
      status: true,
      paymentType: true,
      amount: true,
      currency: true,
      createdAt: true,
    },
  },
  notes: {
    orderBy: { createdAt: 'desc' as const },
    take: 6,
    select: { id: true, body: true, visibility: true, createdAt: true },
  },
  leadsConvertedFrom: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { id: true, source: true, createdAt: true },
  },
} satisfies Prisma.MemberSelect

type AdminMemberDetailRecord = Prisma.MemberGetPayload<{ select: typeof adminMemberDetailSelect }>

export type AdminMemberStatusFilter = 'active' | 'inactive' | 'blocked' | 'all'
export type AdminMembersOverview = Awaited<ReturnType<typeof getAdminMembersOverview>>
export type AdminMemberListItem = AdminMembersOverview['members'][number]
export type AdminMemberDetail = NonNullable<AdminMembersOverview['selectedMember']>

export async function getAdminMembersOverview(input: {
  query?: string | null
  status?: string | null
  selectedMemberId?: string | null
  now?: Date
}) {
  const now = input.now ?? new Date()
  const query = input.query?.trim() ?? ''
  const statusFilter = normalizeStatusFilter(input.status)
  const where: Prisma.MemberWhereInput = {
    status:
      statusFilter === 'active'
        ? 'ACTIVE'
        : statusFilter === 'blocked'
          ? 'BLOCKED'
          : statusFilter === 'inactive'
            ? { in: ['INACTIVE', 'LEAD_CONVERTED'] }
            : undefined,
    OR: query
      ? [
          { firstName: { contains: query, mode: 'insensitive' as const } },
          { lastName: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query } },
          { user: { email: { contains: query, mode: 'insensitive' as const } } },
          { user: { normalizedEmail: { contains: normalizeEmail(query) } } },
        ]
      : undefined,
  }

  const [members, statusGroups, selectedMemberRecord] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      take: MEMBER_LIST_LIMIT,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        joinedAt: true,
        updatedAt: true,
        user: { select: { email: true } },
        _count: {
          select: {
            memberships: { where: { status: 'ACTIVE' } },
            reservations: {
              where: {
                status: 'BOOKED',
                classSession: { startsAt: { gt: now } },
              },
            },
          },
        },
      },
    }),
    prisma.member.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    input.selectedMemberId
      ? prisma.member.findUnique({
          where: { id: input.selectedMemberId },
          select: adminMemberDetailSelect,
        })
      : Promise.resolve(null),
  ])

  const countsByStatus = new Map(statusGroups.map((group) => [group.status, group._count._all]))

  return {
    query,
    statusFilter,
    selectedMemberId: selectedMemberRecord?.id ?? null,
    members: members.map((member) => ({
      id: member.id,
      displayName: displayName(member),
      email: member.user.email,
      phoneLabel: member.phone ?? 'Sin teléfono',
      status: member.status,
      statusLabel: memberStatusLabel(member.status),
      activeMembershipCount: member._count.memberships,
      upcomingReservationCount: member._count.reservations,
      joinedAtLabel: member.joinedAt ? `Alta ${formatDate(member.joinedAt)}` : `Creado ${formatDate(member.updatedAt)}`,
    })),
    selectedMember: selectedMemberRecord
      ? mapSelectedMember(selectedMemberRecord, now)
      : null,
    counts: {
      all: statusGroups.reduce((total, group) => total + group._count._all, 0),
      active: countsByStatus.get('ACTIVE') ?? 0,
      inactive: (countsByStatus.get('INACTIVE') ?? 0) + (countsByStatus.get('LEAD_CONVERTED') ?? 0),
      blocked: countsByStatus.get('BLOCKED') ?? 0,
    },
    isResultLimitReached: members.length === MEMBER_LIST_LIMIT,
  }
}

function mapSelectedMember(member: AdminMemberDetailRecord, now: Date) {
  const reservations = member.reservations.map((reservation) => ({
    id: reservation.id,
    sessionId: reservation.classSession.id,
    className: reservation.classSession.classType.name,
    scheduleLabel: formatDateTimeRange(reservation.classSession.startsAt, reservation.classSession.endsAt),
    contextLabel: [reservation.classSession.coach?.displayName, reservation.classSession.locationLabel].filter(Boolean).join(' · ') || 'Sin contexto adicional',
    statusLabel: reservationStatusLabel(reservation.status),
    status: reservation.status,
    sourceLabel: reservation.source === 'MEMBER_APP' ? 'App socio' : reservation.source === 'STAFF' ? 'Staff' : 'Sistema',
    isUpcoming: reservation.classSession.startsAt > now && reservation.status === 'BOOKED',
  }))

  return {
    id: member.id,
    displayName: displayName(member),
    initials: initials(member.firstName, member.lastName),
    email: member.user.email,
    phone: member.phone,
    birthDateLabel: member.birthDate ? formatDate(member.birthDate) : 'No indicada',
    joinedAtLabel: member.joinedAt ? formatDate(member.joinedAt) : formatDate(member.createdAt),
    status: member.status,
    statusLabel: memberStatusLabel(member.status),
    accountStatusLabel: userStatusLabel(member.user.status),
    emailVerifiedLabel: member.user.emailVerifiedAt ? `Verificado ${formatDate(member.user.emailVerifiedAt)}` : 'Email pendiente de verificar',
    lastLoginLabel: member.user.lastLoginAt ? formatDateTime(member.user.lastLoginAt) : 'Sin acceso registrado',
    rolesLabel: member.user.roles.map((role) => role.role).join(' · ') || 'Sin rol',
    provenanceLabel: member.leadsConvertedFrom[0]
      ? `Lead convertido · ${sourceLabel(member.leadsConvertedFrom[0].source)}`
      : 'Alta directa',
    memberships: member.memberships.map((membership) => ({
      id: membership.id,
      planName: membership.membershipPlan.name,
      status: membership.status,
      statusLabel: membershipStatusLabel(membership.status),
      windowLabel: buildPlanWindowLabel(membership, now),
      renewalLabel: membership.autoRenews ? 'Renovación automática' : 'Sin renovación automática',
      providerLabel: membership.providerSubscriptionId ? 'Con suscripción externa' : 'Gestión interna',
      usageCount: membership._count.usages,
      overrideCount: membership._count.bookingOverrides,
    })),
    credits: member.creditAccounts.map((account) => ({
      id: account.id,
      packName: account.creditPack.name,
      statusLabel: creditStatusLabel(account.status),
      balance: account.ledgerEntries[0]?.balanceAfter ?? account.creditPack.creditsTotal,
      total: account.creditPack.creditsTotal,
      windowLabel: account.expiresAt ? `Expira ${formatDate(account.expiresAt)}` : `Abierto ${formatDate(account.openedAt)}`,
    })),
    reservations,
    upcomingReservationCount: reservations.filter((reservation) => reservation.isUpcoming).length,
    activeWaitlist: member.waitlistEntries.map((entry) => ({
      id: entry.id,
      sessionId: entry.classSession.id,
      className: entry.classSession.classType.name,
      scheduleLabel: formatDateTime(entry.classSession.startsAt),
      statusLabel: entry.status === 'NOTIFIED' ? 'Plaza notificada' : 'En espera',
      positionLabel: entry.position ? `Posición ${entry.position}` : 'Posición pendiente',
    })),
    payments: member.payments.map((payment) => ({
      id: payment.id,
      typeLabel: paymentTypeLabel(payment.paymentType),
      statusLabel: paymentStatusLabel(payment.status),
      amountLabel: formatMoney(payment.amount, payment.currency),
      dateLabel: formatDate(payment.createdAt),
    })),
    notes: member.notes.map((note) => ({
      id: note.id,
      body: note.body,
      visibilityLabel: note.visibility ?? 'Interna',
      createdAtLabel: formatDateTime(note.createdAt),
    })),
  }
}

export function normalizeStatusFilter(status?: string | null): AdminMemberStatusFilter {
  return status === 'inactive' || status === 'blocked' || status === 'all' ? status : 'active'
}

function displayName(member: { firstName: string; lastName: string; user?: { email: string } }) {
  return [member.firstName, member.lastName].filter(Boolean).join(' ').trim() || member.user?.email || 'Socio sin nombre'
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'WS'
}

function memberStatusLabel(status: MemberStatus) {
  return status === 'ACTIVE' ? 'Activo' : status === 'BLOCKED' ? 'Bloqueado' : status === 'LEAD_CONVERTED' ? 'Lead convertido' : 'Inactivo'
}

function userStatusLabel(status: string) {
  return status === 'ACTIVE' ? 'Cuenta activa' : status === 'PENDING_VERIFICATION' ? 'Verificación pendiente' : status === 'SUSPENDED' ? 'Cuenta suspendida' : 'Invitado'
}

function membershipStatusLabel(status: string) {
  const labels: Record<string, string> = { ACTIVE: 'Activa', PENDING_ACTIVATION: 'Pendiente', PAUSED: 'Pausada', EXPIRED: 'Expirada', CANCELED: 'Cancelada' }
  return labels[status] ?? status
}

function creditStatusLabel(status: string) {
  const labels: Record<string, string> = { ACTIVE: 'Activo', DEPLETED: 'Agotado', EXPIRED: 'Expirado', CANCELED: 'Cancelado' }
  return labels[status] ?? status
}

function reservationStatusLabel(status: string) {
  const labels: Record<string, string> = { BOOKED: 'Reservada', CANCELED: 'Cancelada', ATTENDED: 'Asistió', NO_SHOW: 'No vino' }
  return labels[status] ?? status
}

function paymentStatusLabel(status: string) {
  const labels: Record<string, string> = { PENDING: 'Pendiente', REQUIRES_ACTION: 'Requiere acción', SUCCEEDED: 'Pagado', FAILED: 'Fallido', REFUNDED: 'Devuelto', CANCELED: 'Cancelado' }
  return labels[status] ?? status
}

function paymentTypeLabel(type: string) {
  return type === 'MEMBERSHIP_PURCHASE' ? 'Membresía' : type === 'CREDIT_PACK_PURCHASE' ? 'Pack de créditos' : 'Cargo manual'
}

function sourceLabel(source: string | null) {
  return source === 'public_home' ? 'Web pública' : source ?? 'Origen no indicado'
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: WELLSTUDIO_TIME_ZONE }).format(date)
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: WELLSTUDIO_TIME_ZONE }).format(date)
}

function formatDateTimeRange(startsAt: Date, endsAt: Date) {
  const date = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: WELLSTUDIO_TIME_ZONE }).format(startsAt)
  const time = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: WELLSTUDIO_TIME_ZONE })
  return `${date} · ${time.format(startsAt)}–${time.format(endsAt)}`
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount / 100)
}
