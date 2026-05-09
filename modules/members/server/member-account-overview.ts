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

export type MemberAccountOverview = {
  summary: MemberShellSummary
  highlights: {
    plan: MemberAccountSummaryItem
    credits: MemberAccountSummaryItem
    card: MemberAccountSummaryItem
  }
  alerts: MemberAccountAlert[]
  payments: MemberPaymentItem[]
}

export const getMemberAccountOverview = cache(async (): Promise<MemberAccountOverview> => {
  const { requireAuthenticatedContext } = await import('@/modules/auth/server/identity')
  const { prisma } = await import('@/lib/db/prisma')

  const authContext = await requireAuthenticatedContext()
  const memberId = authContext.member?.id

  if (!memberId) {
    throw new Error('Authenticated member required for member account overview')
  }

  const now = new Date()

  const [memberships, creditAccounts, cards, payments] = await prisma.$transaction([
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
  ])

  return buildMemberAccountOverview({
    authContext,
    memberships,
    creditAccounts,
    cards,
    payments,
    now,
  })
})

export function buildMemberAccountOverview({
  authContext,
  memberships,
  creditAccounts,
  cards,
  payments,
  now,
}: {
  authContext: Extract<AuthContext, { isAuthenticated: true }>
  memberships: MembershipWithPlan[]
  creditAccounts: CreditAccountWithSnapshot[]
  cards: CardSnapshot[]
  payments: RecentPayment[]
  now: Date
}): MemberAccountOverview {
  const summary = buildMemberShellSummary(authContext)
  const currentPlan = selectCurrentMembership(memberships)
  const pendingPlan = selectPendingMembership(memberships)
  const creditsRemaining = calculateCreditsRemaining(creditAccounts)
  const primaryCard = selectPrimaryCard(cards)

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
            : 'No detectamos una membresía activa en tu cuenta.',
      },
      credits: {
        eyebrow: 'Créditos',
        title: creditsRemaining > 0 ? `${creditsRemaining} disponibles` : 'Sin créditos activos',
        description:
          creditAccounts.length > 0
            ? creditAccounts.map((account) => account.creditPack.name).join(' · ')
            : 'Cuando actives un bono o pack, su saldo aparecerá aquí.',
      },
      card: {
        eyebrow: 'Tarjeta principal',
        title: primaryCard ? formatCardLabel(primaryCard) : 'Sin tarjeta vinculada',
        description: primaryCard
          ? buildCardMetaLabel(primaryCard)
          : 'Añadiremos el método de pago principal en cuanto exista la capa comercial completa.',
      },
    },
    alerts: buildMemberAccountAlerts({
      currentPlanName: currentPlan?.membershipPlan.name ?? null,
      pendingPlanName: pendingPlan?.membershipPlan.name ?? null,
      creditsRemaining,
      hasLinkedCard: Boolean(primaryCard),
    }),
    payments: payments.map((payment) => mapPaymentItem(payment)),
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
        'Tu cuenta está visible, pero ahora mismo no detectamos una cobertura activa para operar reservas con normalidad.',
    })
  }

  if (pendingPlanName) {
    alerts.push({
      kind: 'pending-plan',
      title: 'Hay una activación pendiente',
      description: `${pendingPlanName} todavía no ha pasado a estado activo. En cuanto lo haga, se consolidará como tu plan principal.`,
    })
  }

  if (!hasLinkedCard) {
    alerts.push({
      kind: 'no-card',
      title: 'Aún no hay tarjeta principal',
      description:
        'Cuando la capa comercial esté conectada de extremo a extremo, aquí verás y validarás tu método de pago principal.',
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
