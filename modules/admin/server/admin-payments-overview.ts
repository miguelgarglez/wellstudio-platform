import type {
  PaymentEventProcessingStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client'

import { prisma } from '@/lib/db/prisma'

const LIST_LIMIT = 50
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1_000
const WELLSTUDIO_TIME_ZONE = 'Europe/Madrid'

export type AdminPaymentStatusFilter =
  | 'all'
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded'

type PaymentListRecord = Prisma.PaymentGetPayload<{
  select: typeof paymentListSelect
}>

type PaymentDetailRecord = Prisma.PaymentGetPayload<{
  select: typeof paymentDetailSelect
}>

export type AdminPaymentsOverview = Awaited<ReturnType<typeof getAdminPaymentsOverview>>

export async function getAdminPaymentsOverview(input: {
  query?: string | null
  status?: string | null
  selectedPaymentId?: string | null
  now?: Date
} = {}) {
  const now = input.now ?? new Date()
  const query = normalizeQuery(input.query)
  const status = parseAdminPaymentStatusFilter(input.status)
  const where = buildPaymentListWhere({ query, status })
  const recentSince = new Date(now.getTime() - RECENT_WINDOW_MS)

  const [payments, failedCount, activeCount, succeededRecentCount, selectedPayment] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: paymentListSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: LIST_LIMIT,
    }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.payment.count({ where: { status: { in: ['PENDING', 'REQUIRES_ACTION'] } } }),
    prisma.payment.count({
      where: { status: 'SUCCEEDED', capturedAt: { gte: recentSince } },
    }),
    input.selectedPaymentId
      ? prisma.payment.findUnique({
          where: { id: input.selectedPaymentId },
          select: paymentDetailSelect,
        })
      : Promise.resolve(null),
  ])

  const productNames = await loadProductNames([
    ...payments.flatMap((payment) => payment.items),
    ...(selectedPayment?.items ?? []),
  ])

  return buildAdminPaymentsOverview({
    query,
    status,
    payments,
    failedCount,
    activeCount,
    succeededRecentCount,
    selectedPayment,
    productNames,
    now,
  })
}

export function buildAdminPaymentsOverview(input: {
  query: string
  status: AdminPaymentStatusFilter
  payments: PaymentListRecord[]
  failedCount: number
  activeCount: number
  succeededRecentCount: number
  selectedPayment: PaymentDetailRecord | null
  productNames: Record<string, string>
  now: Date
}) {
  return {
    filters: {
      query: input.query,
      status: input.status,
    },
    summary: {
      failedCount: input.failedCount,
      activeCount: input.activeCount,
      succeededRecentCount: input.succeededRecentCount,
    },
    payments: input.payments.map((payment) => mapPaymentListItem(
      payment,
      input.productNames,
      input.now,
    )),
    selectedPayment: input.selectedPayment
      ? mapPaymentDetail(input.selectedPayment, input.productNames)
      : null,
  }
}

export function parseAdminPaymentStatusFilter(value?: string | null): AdminPaymentStatusFilter {
  if (
    value === 'pending'
    || value === 'succeeded'
    || value === 'failed'
    || value === 'canceled'
    || value === 'refunded'
  ) {
    return value
  }
  return 'all'
}

export function truncateOperationalId(value: string | null) {
  if (!value) return null
  if (value.length <= 20) return value
  return `${value.slice(0, 10)}…${value.slice(-6)}`
}

function buildPaymentListWhere(input: {
  query: string
  status: AdminPaymentStatusFilter
}): Prisma.PaymentWhereInput {
  const statuses: PaymentStatus[] | undefined = input.status === 'pending'
    ? ['PENDING', 'REQUIRES_ACTION']
    : input.status === 'succeeded'
      ? ['SUCCEEDED']
      : input.status === 'failed'
        ? ['FAILED']
        : input.status === 'canceled'
          ? ['CANCELED']
          : input.status === 'refunded'
            ? ['REFUNDED']
            : undefined
  const terms = input.query.split(/\s+/).filter(Boolean)

  return {
    ...(statuses ? { status: { in: statuses } } : {}),
    ...(terms.length > 0
      ? {
          AND: terms.map((term) => ({
            OR: [
              { member: { firstName: { contains: term, mode: 'insensitive' } } },
              { member: { lastName: { contains: term, mode: 'insensitive' } } },
              { member: { user: { email: { contains: term, mode: 'insensitive' } } } },
            ],
          })),
        }
      : {}),
  }
}

function mapPaymentListItem(
  payment: PaymentListRecord,
  productNames: Record<string, string>,
  now: Date,
) {
  const status = formatPaymentStatus(payment.status)
  const eventHealth = formatEventHealth(payment.events[0]?.processingStatus ?? null, payment.status)

  return {
    id: payment.id,
    memberName: formatMemberName(payment.member),
    memberEmail: payment.member.user.email,
    productLabel: formatProductSummary(payment.items, productNames, payment.paymentType),
    amountLabel: formatMoney(payment.amount, payment.currency),
    status: payment.status,
    statusLabel: status.label,
    statusTone: status.tone,
    providerLabel: capitalize(payment.provider),
    eventHealthLabel: eventHealth.label,
    eventHealthTone: eventHealth.tone,
    createdAtLabel: formatDateTime(payment.createdAt),
    ageLabel: formatRelativeAge(payment.createdAt, now),
  }
}

function mapPaymentDetail(
  payment: PaymentDetailRecord,
  productNames: Record<string, string>,
) {
  const status = formatPaymentStatus(payment.status)
  const latestEventStatus = payment.events[0]?.processingStatus ?? null
  const eventHealth = formatEventHealth(latestEventStatus, payment.status)

  return {
    id: payment.id,
    idLabel: truncateOperationalId(payment.id),
    memberName: formatMemberName(payment.member),
    memberEmail: payment.member.user.email,
    memberStatusLabel: formatMemberStatus(payment.member.status),
    productLabel: formatProductSummary(payment.items, productNames, payment.paymentType),
    paymentTypeLabel: formatPaymentType(payment.paymentType),
    amountLabel: formatMoney(payment.amount, payment.currency),
    status: payment.status,
    statusLabel: status.label,
    statusTone: status.tone,
    providerLabel: capitalize(payment.provider),
    eventHealthLabel: eventHealth.label,
    eventHealthTone: eventHealth.tone,
    createdAtLabel: formatDateTime(payment.createdAt),
    capturedAtLabel: payment.capturedAt ? formatDateTime(payment.capturedAt) : null,
    failedAtLabel: payment.failedAt ? formatDateTime(payment.failedAt) : null,
    failureLabel: payment.failureReason ? formatFailureReason(payment.failureReason) : null,
    checkoutSessionIdLabel: truncateOperationalId(payment.providerCheckoutSessionId),
    paymentIntentIdLabel: truncateOperationalId(payment.providerPaymentIntentId),
    items: payment.items.map((item) => ({
      id: item.id,
      name: productNames[item.referenceId] ?? formatMissingProduct(item.itemType),
      typeLabel: item.itemType === 'CREDIT_PACK' ? 'Bono' : 'Plan',
      quantityLabel: item.quantity === 1 ? '1 unidad' : `${item.quantity} unidades`,
      amountLabel: formatMoney(item.totalAmount, payment.currency),
      entitlementLabel: item.entitlementUnits
        ? `${item.entitlementUnits} ${item.entitlementUnits === 1 ? 'reserva' : 'reservas'}`
        : null,
    })),
    events: payment.events.map((event) => {
      const eventStatus = formatEventStatus(event.processingStatus)
      return {
        id: event.id,
        providerEventIdLabel: truncateOperationalId(event.providerEventId),
        typeLabel: formatEventType(event.eventType),
        statusLabel: eventStatus.label,
        statusTone: eventStatus.tone,
        createdAtLabel: formatDateTime(event.createdAt),
        processedAtLabel: event.processedAt ? formatDateTime(event.processedAt) : null,
      }
    }),
  }
}

async function loadProductNames(items: Array<{
  itemType: 'MEMBERSHIP_PLAN' | 'CREDIT_PACK'
  referenceId: string
}>) {
  const creditPackIds = unique(items
    .filter((item) => item.itemType === 'CREDIT_PACK')
    .map((item) => item.referenceId))
  const membershipPlanIds = unique(items
    .filter((item) => item.itemType === 'MEMBERSHIP_PLAN')
    .map((item) => item.referenceId))

  const [creditPacks, membershipPlans] = await Promise.all([
    creditPackIds.length > 0
      ? prisma.creditPack.findMany({
          where: { id: { in: creditPackIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    membershipPlanIds.length > 0
      ? prisma.membershipPlan.findMany({
          where: { id: { in: membershipPlanIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ])

  return Object.fromEntries(
    [...creditPacks, ...membershipPlans].map((product) => [product.id, product.name]),
  )
}

function formatMemberName(member: { firstName: string; lastName: string }) {
  return `${member.firstName} ${member.lastName}`.trim()
}

function formatProductSummary(
  items: Array<{ itemType: 'MEMBERSHIP_PLAN' | 'CREDIT_PACK'; referenceId: string }>,
  productNames: Record<string, string>,
  paymentType: 'MEMBERSHIP_PURCHASE' | 'CREDIT_PACK_PURCHASE' | 'MANUAL_CHARGE',
) {
  if (items.length === 0) return formatPaymentType(paymentType)
  const first = productNames[items[0].referenceId] ?? formatMissingProduct(items[0].itemType)
  return items.length === 1 ? first : `${first} + ${items.length - 1}`
}

function formatPaymentStatus(status: PaymentStatus) {
  switch (status) {
    case 'PENDING':
      return { label: 'Pendiente', tone: 'blue' as const }
    case 'REQUIRES_ACTION':
      return { label: 'Requiere acción', tone: 'warning' as const }
    case 'SUCCEEDED':
      return { label: 'Cobrado', tone: 'success' as const }
    case 'FAILED':
      return { label: 'Fallido', tone: 'danger' as const }
    case 'CANCELED':
      return { label: 'Cancelado', tone: 'neutral' as const }
    case 'REFUNDED':
      return { label: 'Reembolsado', tone: 'neutral' as const }
  }
}

function formatEventHealth(
  processingStatus: PaymentEventProcessingStatus | null,
  paymentStatus: PaymentStatus,
) {
  if (processingStatus) return formatEventStatus(processingStatus)
  if (paymentStatus === 'FAILED') return { label: 'Sin evento procesado', tone: 'danger' as const }
  if (paymentStatus === 'PENDING' || paymentStatus === 'REQUIRES_ACTION') {
    return { label: 'Esperando confirmación', tone: 'blue' as const }
  }
  return { label: 'Sin evento asociado', tone: 'neutral' as const }
}

function formatEventStatus(status: PaymentEventProcessingStatus) {
  switch (status) {
    case 'RECEIVED':
      return { label: 'Evento recibido', tone: 'blue' as const }
    case 'PROCESSED':
      return { label: 'Evento procesado', tone: 'success' as const }
    case 'IGNORED':
      return { label: 'Evento ignorado', tone: 'neutral' as const }
    case 'FAILED':
      return { label: 'Evento fallido', tone: 'danger' as const }
  }
}

function formatPaymentType(type: 'MEMBERSHIP_PURCHASE' | 'CREDIT_PACK_PURCHASE' | 'MANUAL_CHARGE') {
  if (type === 'MEMBERSHIP_PURCHASE') return 'Compra de plan'
  if (type === 'CREDIT_PACK_PURCHASE') return 'Compra de bono'
  return 'Cobro manual'
}

function formatMissingProduct(type: 'MEMBERSHIP_PLAN' | 'CREDIT_PACK') {
  return type === 'CREDIT_PACK' ? 'Bono no disponible' : 'Plan no disponible'
}

function formatFailureReason(reason: string) {
  if (reason === 'checkout_provider_error') return 'No se pudo crear la sesión de checkout.'
  return 'El proveedor o el procesamiento interno reportó un fallo.'
}

function formatEventType(type: string) {
  if (type === 'checkout.session.completed' || type === 'sandbox.checkout.completed') {
    return 'Checkout confirmado'
  }
  if (type === 'checkout.session.expired') return 'Checkout expirado'
  return 'Evento del proveedor'
}

function formatMemberStatus(status: string) {
  if (status === 'ACTIVE') return 'Socio activo'
  if (status === 'BLOCKED') return 'Socio bloqueado'
  if (status === 'INACTIVE') return 'Socio inactivo'
  return 'Socio pendiente'
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount / 100)
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

function formatRelativeAge(value: Date, now: Date) {
  const minutes = Math.max(0, Math.floor((now.getTime() - value.getTime()) / 60_000))
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  return `Hace ${Math.floor(hours / 24)} d`
}

function normalizeQuery(value?: string | null) {
  return value?.trim().replace(/\s+/g, ' ').slice(0, 120) ?? ''
}

function unique(values: string[]) {
  return [...new Set(values)]
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const paymentListSelect = {
  id: true,
  status: true,
  paymentType: true,
  amount: true,
  currency: true,
  provider: true,
  createdAt: true,
  member: {
    select: {
      firstName: true,
      lastName: true,
      user: { select: { email: true } },
    },
  },
  items: {
    select: {
      itemType: true,
      referenceId: true,
    },
  },
  events: {
    orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
    take: 1,
    select: { processingStatus: true },
  },
} satisfies Prisma.PaymentSelect

const paymentDetailSelect = {
  id: true,
  status: true,
  paymentType: true,
  amount: true,
  currency: true,
  provider: true,
  providerCheckoutSessionId: true,
  providerPaymentIntentId: true,
  createdAt: true,
  capturedAt: true,
  failedAt: true,
  failureReason: true,
  member: {
    select: {
      firstName: true,
      lastName: true,
      status: true,
      user: { select: { email: true } },
    },
  },
  items: {
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
    select: {
      id: true,
      itemType: true,
      referenceId: true,
      quantity: true,
      totalAmount: true,
      entitlementUnits: true,
    },
  },
  events: {
    orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
    take: 20,
    select: {
      id: true,
      providerEventId: true,
      eventType: true,
      processingStatus: true,
      createdAt: true,
      processedAt: true,
    },
  },
} satisfies Prisma.PaymentSelect
