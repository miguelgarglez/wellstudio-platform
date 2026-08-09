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

export function isMembershipEffective(
  membership: Pick<MemberMembership, 'status' | 'startsAt' | 'endsAt'>,
  now: Date,
) {
  return membership.status === 'ACTIVE'
    && membership.startsAt.getTime() <= now.getTime()
    && (!membership.endsAt || membership.endsAt.getTime() > now.getTime())
}

export function selectCurrentMembership(
  memberships: MembershipWithPlanName[],
  now: Date,
) {
  return memberships.find((membership) => isMembershipEffective(membership, now)) ?? null
}

export function selectPendingMembership(memberships: MembershipWithPlanName[]) {
  return memberships.find((membership) => membership.status === 'PENDING_ACTIVATION') ?? null
}

export function isCreditAccountEffective(
  account: Pick<MemberCreditAccount, 'status' | 'openedAt' | 'expiresAt'>,
  now: Date,
) {
  return account.status === 'ACTIVE'
    && account.openedAt.getTime() <= now.getTime()
    && (!account.expiresAt || account.expiresAt.getTime() > now.getTime())
}

export function selectEffectiveCreditAccounts<T extends CreditAccountBalanceSnapshot>(
  creditAccounts: T[],
  now: Date,
) {
  return creditAccounts.filter((account) => isCreditAccountEffective(account, now))
}

export function calculateCreditsRemaining(
  creditAccounts: CreditAccountBalanceSnapshot[],
  now: Date,
) {
  return selectEffectiveCreditAccounts(creditAccounts, now).reduce((total, account) => {
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
