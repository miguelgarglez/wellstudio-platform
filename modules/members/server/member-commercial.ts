import type { Card, MemberCreditAccount, MemberMembership } from '@prisma/client'

export type MembershipWithPlanName = Pick<MemberMembership, 'status' | 'startsAt' | 'endsAt'> & {
  membershipPlan: {
    name: string
  }
}

export type CreditAccountBalanceSnapshot = Pick<
  MemberCreditAccount,
  'status' | 'openedAt' | 'expiresAt'
> & {
  creditPack: {
    name: string
    creditsTotal: number
  }
  ledgerEntries: Array<{
    balanceAfter: number
  }>
}

export type CardSnapshot = Pick<Card, 'brand' | 'last4' | 'isDefault' | 'updatedAt'>

export function selectCurrentMembership(memberships: MembershipWithPlanName[]) {
  return memberships.find((membership) => membership.status === 'ACTIVE') ?? null
}

export function selectPendingMembership(memberships: MembershipWithPlanName[]) {
  return memberships.find((membership) => membership.status === 'PENDING_ACTIVATION') ?? null
}

export function calculateCreditsRemaining(creditAccounts: CreditAccountBalanceSnapshot[]) {
  return creditAccounts.reduce((total, account) => {
    const latestBalance = account.ledgerEntries[0]?.balanceAfter
    return total + (latestBalance ?? account.creditPack.creditsTotal)
  }, 0)
}

export function selectPrimaryCard<T extends CardSnapshot>(cards: T[]) {
  if (cards.length === 0) {
    return null
  }

  return [...cards].sort((left, right) => {
    if (left.isDefault !== right.isDefault) {
      return Number(right.isDefault) - Number(left.isDefault)
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime()
  })[0]
}

export function buildPlanWindowLabel(membership: MembershipWithPlanName, now: Date) {
  const formatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  })

  if (!membership.endsAt) {
    return `Activa desde ${formatter.format(membership.startsAt)}`
  }

  if (membership.endsAt < now) {
    return `Venció el ${formatter.format(membership.endsAt)}`
  }

  return `${formatter.format(membership.startsAt)} – ${formatter.format(membership.endsAt)}`
}

export function formatCardLabel(card: Pick<Card, 'brand' | 'last4'>) {
  if (card.brand && card.last4) {
    return `${card.brand} terminada en ${card.last4}`
  }

  if (card.last4) {
    return `Tarjeta terminada en ${card.last4}`
  }

  return 'Tarjeta vinculada'
}
