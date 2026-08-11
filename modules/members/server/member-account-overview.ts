import { cache } from 'react'
import type {
  Card,
  MemberCreditAccount,
  MemberMembership,
  Payment,
  PaymentStatus,
  PaymentType,
} from '@prisma/client'

import type { AuthContext } from '@/modules/auth/server/identity'
import {
  buildPlanWindowLabel,
  calculateCreditsRemaining,
  formatCardLabel,
  selectEffectiveCreditAccounts,
  selectCurrentMembership,
  selectPendingMembership,
  selectPrimaryCard,
} from '@/modules/members/server/member-commercial'
import {
  buildMemberShellSummary,
  type MemberShellSummary,
} from '@/modules/members/server/member-shell-summary'

type MembershipWithPlan = MemberMembership & {
  membershipPlan: {
    name: string
  }
}

type CreditAccountWithSnapshot = MemberCreditAccount & {
  creditPack: {
    name: string
    creditsTotal: number
  }
  ledgerEntries: Array<{
    balanceAfter: number
  }>
}

type CardSnapshot = Pick<Card, 'brand' | 'last4' | 'expMonth' | 'expYear' | 'isDefault' | 'updatedAt'>

type RecentPayment = Pick<Payment, 'id' | 'status' | 'paymentType' | 'amount' | 'currency' | 'createdAt'> & {
  card: Pick<Card, 'brand' | 'last4'> | null
}

export type MemberAccountAlert = {
  kind: 'no-card' | 'no-entitlement' | 'pending-plan'
  title: string
  description: string
}

export type MemberAccountSummaryItem = {
  eyebrow: string
  title: string
  description: string
}

export type MemberPaymentItem = {
  id: string
  title: string
  amountLabel: string
  dateLabel: string
  statusLabel: string
  statusTone: 'allowed' | 'blocked' | 'neutral'
  detailLabel: string
}

export type MemberPurchasableCreditPack = {
  id: string
  slug: string
  name: string
  description: string | null
  creditsLabel: string
  validityLabel: string
  priceLabel: string
}

export type MemberCheckoutNotice = {
  kind: 'success' | 'processing' | 'canceled' | 'failed'
  title: string
  description: string
  instanceKey: string
} | null

export type MemberCardLinkNotice = {
  kind: 'success' | 'processing' | 'canceled' | 'failed'
  title: string
  description: string
  instanceKey: string
} | null

export type MemberAccountOverview = {
  summary: MemberShellSummary
  highlights: {
    plan: MemberAccountSummaryItem
    credits: MemberAccountSummaryItem
    card: MemberAccountSummaryItem
  }
  alerts: MemberAccountAlert[]
  payments: MemberPaymentItem[]
  purchasableCreditPacks: MemberPurchasableCreditPack[]
  selectedCreditPackId: string | null
  linkedCardLabel: string | null
  hasLinkedCard: boolean
  checkoutNotice: MemberCheckoutNotice
  cardLinkNotice: MemberCardLinkNotice
}

export const getMemberAccountOverview = cache(async (options: {
  selectedPackSlug?: string
  checkout?: string
  card?: string
  paymentId?: string
} = {}): Promise<MemberAccountOverview> => {
  const { requireAuthenticatedContext } = await import('@/modules/auth/server/identity')
  const { prisma } = await import('@/lib/db/prisma')

  const authContext = await requireAuthenticatedContext()
  const memberId = authContext.member?.id

  if (!memberId) {
    throw new Error('Authenticated member required for member account overview')
  }

  const now = new Date()

  const [memberships, creditAccounts, cards, payments, creditPacks, checkoutPayment, cardSetupPayment] = await prisma.$transaction([
    prisma.memberMembership.findMany({
      where: {
        memberId,
        status: {
          in: ['ACTIVE', 'PENDING_ACTIVATION'],
        },
      },
      include: {
        membershipPlan: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startsAt: 'desc',
      },
    }),
    prisma.memberCreditAccount.findMany({
      where: {
        memberId,
        status: 'ACTIVE',
      },
      include: {
        creditPack: {
          select: {
            name: true,
            creditsTotal: true,
          },
        },
        ledgerEntries: {
          select: {
            balanceAfter: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        openedAt: 'desc',
      },
    }),
    prisma.card.findMany({
      where: {
        memberId,
        status: 'ACTIVE',
      },
      select: {
        brand: true,
        last4: true,
        expMonth: true,
        expYear: true,
        isDefault: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    prisma.payment.findMany({
      where: {
        memberId,
        paymentType: { not: 'CARD_SETUP' },
      },
      select: {
        id: true,
        status: true,
        paymentType: true,
        amount: true,
        currency: true,
        createdAt: true,
        card: {
          select: {
            brand: true,
            last4: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    }),
    prisma.creditPack.findMany({
      where: { status: 'ACTIVE', isPublic: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        creditsTotal: true,
        expiresAfterDays: true,
        priceAmount: true,
        currency: true,
      },
      orderBy: [{ priceAmount: 'asc' }, { name: 'asc' }],
    }),
    prisma.payment.findFirst({
      where: {
        id: options.paymentId || '__no_payment__',
        memberId,
        paymentType: 'CREDIT_PACK_PURCHASE',
      },
      select: { id: true, status: true },
    }),
    prisma.payment.findFirst({
      where: {
        id: options.paymentId || '__no_payment__',
        memberId,
        paymentType: 'CARD_SETUP',
      },
      select: { id: true, status: true },
    }),
  ])

  return buildMemberAccountOverview({
    authContext,
    memberships,
    creditAccounts,
    cards,
    payments,
    creditPacks,
    selectedPackSlug: options.selectedPackSlug,
    checkout: options.checkout,
    card: options.card,
    checkoutPayment,
    cardSetupPayment,
    now,
  })
})

export function buildMemberAccountOverview({
  authContext,
  memberships,
  creditAccounts,
  cards,
  payments,
  creditPacks = [],
  selectedPackSlug,
  checkout,
  card,
  checkoutPayment,
  cardSetupPayment,
  now,
}: {
  authContext: Extract<AuthContext, { isAuthenticated: true }>
  memberships: MembershipWithPlan[]
  creditAccounts: CreditAccountWithSnapshot[]
  cards: CardSnapshot[]
  payments: RecentPayment[]
  creditPacks?: Array<{
    id: string
    slug: string
    name: string
    description: string | null
    creditsTotal: number
    expiresAfterDays: number | null
    priceAmount: number
    currency: string
  }>
  selectedPackSlug?: string
  checkout?: string
  card?: string
  checkoutPayment?: { id?: string; status: PaymentStatus } | null
  cardSetupPayment?: { id?: string; status: PaymentStatus } | null
  now: Date
}): MemberAccountOverview {
  const summary = buildMemberShellSummary(authContext)
  const currentPlan = selectCurrentMembership(memberships, now)
  const pendingPlan = selectPendingMembership(memberships)
  const effectiveCreditAccounts = selectEffectiveCreditAccounts(creditAccounts, now)
  const creditsRemaining = calculateCreditsRemaining(creditAccounts, now)
  const primaryCard = selectPrimaryCard(cards)
  const linkedCardLabel = primaryCard ? formatCardLabel(primaryCard) : null

  return {
    summary,
    highlights: {
      plan: {
        eyebrow: 'Plan actual',
        title: currentPlan?.membershipPlan.name ?? 'Sin plan activo',
        description: currentPlan
          ? buildPlanWindowLabel(currentPlan, now)
          : pendingPlan
            ? `${pendingPlan.membershipPlan.name} pendiente de activación`
            : 'Aún no tienes una membresía activa.',
      },
      credits: {
        eyebrow: 'Créditos',
        title: creditsRemaining > 0 ? `${creditsRemaining} disponibles` : 'Sin créditos activos',
        description:
          effectiveCreditAccounts.length > 0
            ? effectiveCreditAccounts.map((account) => account.creditPack.name).join(' · ')
            : 'Compra un bono más abajo cuando quieras más reservas.',
      },
      card: {
        eyebrow: 'Tarjeta principal',
        title: linkedCardLabel ?? 'Sin tarjeta vinculada',
        description: primaryCard
          ? buildCardMetaLabel(primaryCard)
          : 'Puedes vincular una tarjeta desde esta página. Solo guardamos la referencia segura del pago.',
      },
    },
    alerts: buildMemberAccountAlerts({
      currentPlanName: currentPlan?.membershipPlan.name ?? null,
      pendingPlanName: pendingPlan?.membershipPlan.name ?? null,
      creditsRemaining,
      hasLinkedCard: Boolean(primaryCard),
    }),
    payments: payments.map((payment) => mapPaymentItem(payment)),
    purchasableCreditPacks: creditPacks.map(mapPurchasableCreditPack),
    selectedCreditPackId: creditPacks.find((pack) => pack.slug === selectedPackSlug)?.id ?? null,
    linkedCardLabel,
    hasLinkedCard: Boolean(primaryCard),
    checkoutNotice: buildCheckoutNotice({ checkout, payment: checkoutPayment }),
    cardLinkNotice: buildCardLinkNotice({ card, payment: cardSetupPayment }),
  }
}

function mapPurchasableCreditPack(pack: {
  id: string
  slug: string
  name: string
  description: string | null
  creditsTotal: number
  expiresAfterDays: number | null
  priceAmount: number
  currency: string
}): MemberPurchasableCreditPack {
  return {
    id: pack.id,
    slug: pack.slug,
    name: pack.name,
    description: pack.description,
    creditsLabel: pack.creditsTotal === 1 ? '1 reserva' : `${pack.creditsTotal} reservas`,
    validityLabel: pack.expiresAfterDays ? `${pack.expiresAfterDays} días de vigencia` : 'Sin caducidad',
    priceLabel: new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: pack.currency,
    }).format(pack.priceAmount / 100),
  }
}

export function buildCheckoutNotice({
  checkout,
  payment,
}: {
  checkout: string | undefined
  payment?: { id?: string; status: PaymentStatus } | null
}): MemberCheckoutNotice {
  const instanceKey = payment?.id ?? `checkout-${checkout ?? 'idle'}`

  if (checkout === 'canceled') {
    return {
      kind: 'canceled',
      title: 'Compra cancelada',
      description: 'No se ha realizado ningún cobro ni se han activado créditos.',
      instanceKey,
    }
  }
  if (checkout === 'failed') {
    return {
      kind: 'failed',
      title: 'No pudimos confirmar la compra',
      description: 'No se han activado créditos. Puedes volver a intentarlo desde esta página.',
      instanceKey,
    }
  }
  if (checkout !== 'success') return null

  if (!payment) {
    return {
      kind: 'failed',
      title: 'No pudimos verificar la compra',
      description: 'No encontramos una compra vinculada a este regreso. Revisa tus pagos recientes o vuelve a intentarlo.',
      instanceKey,
    }
  }

  if (payment.status === 'SUCCEEDED') {
    return {
      kind: 'success',
      title: 'Bono activado',
      description: 'El pago está confirmado y tus nuevas reservas ya aparecen en el saldo.',
      instanceKey,
    }
  }

  if (payment.status === 'FAILED') {
    return {
      kind: 'failed',
      title: 'No pudimos confirmar la compra',
      description: 'No se han activado créditos. Puedes volver a intentarlo desde esta página.',
      instanceKey,
    }
  }

  if (payment.status === 'CANCELED') {
    return {
      kind: 'canceled',
      title: 'Compra no completada',
      description: 'El checkout ya no está activo y no se han concedido créditos.',
      instanceKey,
    }
  }

  if (payment.status === 'REFUNDED') {
    return {
      kind: 'failed',
      title: 'Compra reembolsada',
      description: 'Este pago figura como reembolsado. Si necesitas ayuda, contacta con el centro.',
      instanceKey,
    }
  }

  return {
    kind: 'processing',
    title: 'Estamos confirmando el pago',
    description: 'El proveedor todavía está procesando la confirmación. Tus créditos aparecerán automáticamente.',
    instanceKey,
  }
}

export function buildCardLinkNotice({
  card,
  payment,
}: {
  card: string | undefined
  payment?: { id?: string; status: PaymentStatus } | null
}): MemberCardLinkNotice {
  const instanceKey = payment?.id ?? `card-${card ?? 'idle'}`

  if (card === 'canceled') {
    return {
      kind: 'canceled',
      title: 'Vinculación cancelada',
      description: 'No se ha guardado ninguna tarjeta en tu cuenta.',
      instanceKey,
    }
  }
  if (card === 'failed') {
    return {
      kind: 'failed',
      title: 'No pudimos vincular la tarjeta',
      description: 'Puedes volver a intentarlo desde esta página cuando quieras.',
      instanceKey,
    }
  }
  if (card !== 'success') return null

  if (!payment) {
    return {
      kind: 'failed',
      title: 'No pudimos verificar la vinculación',
      description: 'No encontramos una sesión de tarjeta asociada a este regreso.',
      instanceKey,
    }
  }

  if (payment.status === 'SUCCEEDED') {
    return {
      kind: 'success',
      title: 'Tarjeta vinculada',
      description: 'Tu método de pago principal ya está disponible en la cuenta.',
      instanceKey,
    }
  }

  if (payment.status === 'FAILED') {
    return {
      kind: 'failed',
      title: 'No pudimos vincular la tarjeta',
      description: 'Puedes volver a intentarlo desde esta página cuando quieras.',
      instanceKey,
    }
  }

  if (payment.status === 'CANCELED') {
    return {
      kind: 'canceled',
      title: 'Vinculación no completada',
      description: 'La sesión ya no está activa y no se ha guardado ninguna tarjeta.',
      instanceKey,
    }
  }

  return {
    kind: 'processing',
    title: 'Estamos confirmando la tarjeta',
    description: 'El proveedor todavía está procesando la vinculación. La tarjeta aparecerá automáticamente.',
    instanceKey,
  }
}

export function buildMemberAccountAlerts({
  currentPlanName,
  pendingPlanName,
  creditsRemaining,
  hasLinkedCard,
}: {
  currentPlanName: string | null
  pendingPlanName: string | null
  creditsRemaining: number
  hasLinkedCard: boolean
}): MemberAccountAlert[] {
  const alerts: MemberAccountAlert[] = []

  if (!currentPlanName && creditsRemaining === 0) {
    alerts.push({
      kind: 'no-entitlement',
      title: 'Sin plan ni créditos activos',
      description:
        'Para reservar con normalidad necesitas un plan activo o créditos. Puedes comprar un bono en esta misma página.',
    })
  }

  if (pendingPlanName) {
    alerts.push({
      kind: 'pending-plan',
      title: 'Hay una activación pendiente',
      description: `${pendingPlanName} todavía no está activo. Cuando se active, será tu plan principal.`,
    })
  }

  if (!hasLinkedCard) {
    alerts.push({
      kind: 'no-card',
      title: 'Aún no hay tarjeta principal',
      description:
        'No hace falta para comprar un bono puntual. Vincúlala si quieres tener un método de pago guardado.',
    })
  }

  return alerts
}

function mapPaymentItem(payment: RecentPayment): MemberPaymentItem {
  const amountFormatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: payment.currency,
  })
  const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const status = buildPaymentStatusMeta(payment.status)

  return {
    id: payment.id,
    title: buildPaymentTypeLabel(payment.paymentType),
    amountLabel: amountFormatter.format(payment.amount / 100),
    dateLabel: dateFormatter.format(payment.createdAt),
    statusLabel: status.label,
    statusTone: status.tone,
    detailLabel: payment.card ? formatCardLabel(payment.card) : 'Sin tarjeta registrada en este pago',
  }
}

function buildPaymentTypeLabel(paymentType: PaymentType) {
  switch (paymentType) {
    case 'MEMBERSHIP_PURCHASE':
      return 'Compra de membresía'
    case 'CREDIT_PACK_PURCHASE':
      return 'Compra de créditos'
    case 'MANUAL_CHARGE':
      return 'Cargo manual'
    case 'CARD_SETUP':
      return 'Vinculación de tarjeta'
    default:
      return 'Pago'
  }
}

function buildPaymentStatusMeta(paymentStatus: PaymentStatus) {
  switch (paymentStatus) {
    case 'SUCCEEDED':
      return {
        label: 'Pagado',
        tone: 'allowed' as const,
      }
    case 'FAILED':
      return {
        label: 'Fallido',
        tone: 'blocked' as const,
      }
    case 'REQUIRES_ACTION':
      return {
        label: 'Requiere acción',
        tone: 'neutral' as const,
      }
    case 'REFUNDED':
      return {
        label: 'Reembolsado',
        tone: 'neutral' as const,
      }
    case 'CANCELED':
      return {
        label: 'Cancelado',
        tone: 'neutral' as const,
      }
    case 'PENDING':
    default:
      return {
        label: 'Pendiente',
        tone: 'neutral' as const,
      }
  }
}

function buildCardMetaLabel(card: Pick<Card, 'expMonth' | 'expYear'>) {
  if (card.expMonth && card.expYear) {
    return `Caduca ${String(card.expMonth).padStart(2, '0')}/${String(card.expYear).slice(-2)}`
  }

  return 'Método listo para cobros futuros'
}
