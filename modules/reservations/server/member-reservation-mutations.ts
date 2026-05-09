import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import {
  buildCancellationWindow,
  buildMembershipPolicyUsageSearchWindow,
  calculateCreditAccountBalance,
  evaluateReservationEligibilityFromSnapshots,
  type EligibilityRuleSnapshot,
  type ReservationEligibilityResult,
  type ReservationEligibilityUsage,
} from '@/modules/reservations/server/reservation-eligibility'

const ACTIVE_WAITLIST_STATUSES = ['WAITING', 'NOTIFIED'] as const
const SERIALIZABLE_RETRY_LIMIT = 3

export type ReservationMutationCode =
  | 'BOOKED'
  | 'CANCELED'
  | 'WAITLIST_JOINED'
  | 'WAITLIST_LEFT'
  | 'ALREADY_BOOKED'
  | 'ALREADY_WAITLISTED'
  | 'SESSION_FULL'
  | 'WAITLIST_DISABLED'
  | 'CANCELLATION_WINDOW_CLOSED'
  | 'NO_ELIGIBLE_ENTITLEMENT'
  | 'NO_ACTIVE_RULE'
  | 'MEMBERSHIP_ALLOWANCE_EXHAUSTED'
  | 'SESSION_NOT_BOOKABLE'
  | 'RESERVATION_NOT_FOUND'
  | 'WAITLIST_NOT_FOUND'

export type ReservationMutationResult = {
  success: boolean
  code: ReservationMutationCode
  message: string
  updatedEntityId?: string
}

type MutationSessionSnapshot = {
  id: string
  startsAt: Date
  endsAt: Date
  capacity: number
  reservedCount: number
  waitlistEnabled: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELED' | 'COMPLETED'
  classType: {
    name: string
    eligibilityRules: EligibilityRuleSnapshot[]
  }
}

type ReservationMutationTx = Prisma.TransactionClient

type MutationContext = {
  memberId: string
  userId: string
  now?: Date
}

export async function evaluateReservationEligibility(input: {
  memberId: string
  classSessionId: string
  now?: Date
}) {
  return runSerializableReservationTransaction(async (tx) => {
    const now = input.now ?? new Date()
    const session = await getMutationSession(tx, input.classSessionId)

    if (!isBookableSession(session, now)) {
      return {
        eligible: false,
        code: 'NO_ACTIVE_RULE',
      } satisfies ReservationEligibilityResult
    }

    return evaluateEligibilityInTx(tx, {
      memberId: input.memberId,
      session,
    })
  })
}

export async function reservePublishedSession(
  input: MutationContext & {
    classSessionId: string
  },
): Promise<ReservationMutationResult> {
  return runSerializableReservationTransaction(async (tx) => {
    const now = input.now ?? new Date()
    const session = await getMutationSession(tx, input.classSessionId)

    if (!isBookableSession(session, now)) {
      return buildMutationResult(
        'SESSION_NOT_BOOKABLE',
        'La sesión ya no está disponible para nuevas reservas.',
      )
    }

    const [existingReservation, existingWaitlist] = await Promise.all([
      findBookedReservation(tx, {
        memberId: input.memberId,
        classSessionId: session.id,
      }),
      findActiveWaitlistEntry(tx, {
        memberId: input.memberId,
        classSessionId: session.id,
      }),
    ])

    if (existingReservation) {
      return buildMutationResult(
        'ALREADY_BOOKED',
        'Ya tienes una reserva activa para esta sesión.',
        existingReservation.id,
      )
    }

    if (existingWaitlist) {
      return buildMutationResult(
        'ALREADY_WAITLISTED',
        'Ya estás dentro de la waitlist activa de esta sesión.',
        existingWaitlist.id,
      )
    }

    if (session.reservedCount >= session.capacity) {
      return buildMutationResult(
        'SESSION_FULL',
        'La sesión está completa. Si la waitlist está habilitada, podrás entrar desde la agenda.',
      )
    }

    const eligibility = await evaluateEligibilityInTx(tx, {
      memberId: input.memberId,
      session,
    })

    if (!eligibility.eligible) {
      return buildEligibilityFailureResult(eligibility.code)
    }

    const reservation = await createBookedReservation(tx, {
      memberId: input.memberId,
      classSessionId: session.id,
      usage: eligibility.usage,
      source: 'MEMBER_APP',
      now,
    })

    await tx.classSession.update({
      where: {
        id: session.id,
      },
      data: {
        reservedCount: {
          increment: 1,
        },
      },
    })

    return buildMutationResult(
      'BOOKED',
      `Reserva confirmada para ${session.classType.name}.`,
      reservation.id,
      true,
    )
  })
}

export async function cancelMemberReservation(
  input: MutationContext & {
    reservationId: string
  },
): Promise<ReservationMutationResult> {
  return runSerializableReservationTransaction(async (tx) => {
    const now = input.now ?? new Date()
    const reservation = await tx.reservation.findFirst({
      where: {
        id: input.reservationId,
        memberId: input.memberId,
      },
      include: {
        classSession: {
          select: {
            id: true,
            startsAt: true,
            capacity: true,
            reservedCount: true,
            waitlistEnabled: true,
            status: true,
            classType: {
              select: {
                name: true,
                eligibilityRules: {
                  where: {
                    isActive: true,
                  },
                  select: {
                    id: true,
                    ruleType: true,
                    membershipPlanId: true,
                    creditCost: true,
                    priority: true,
                    createdAt: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
        entitlementUsages: {
          select: {
            id: true,
            usageType: true,
            memberCreditAccountId: true,
            creditsUsed: true,
          },
        },
      },
    })

    if (!reservation || reservation.status !== 'BOOKED') {
      return buildMutationResult(
        'RESERVATION_NOT_FOUND',
        'No hemos encontrado una reserva activa para cancelar.',
      )
    }

    if (reservation.classSession.startsAt.getTime() <= now.getTime()) {
      return buildMutationResult(
        'SESSION_NOT_BOOKABLE',
        'La sesión ya ha comenzado o ha quedado cerrada.',
      )
    }

    const { cutoffAt } = buildCancellationWindow({
      startsAt: reservation.classSession.startsAt,
      now,
    })

    if (cutoffAt.getTime() <= now.getTime()) {
      return buildMutationResult(
        'CANCELLATION_WINDOW_CLOSED',
        'La ventana de cancelación ya está cerrada para esta reserva.',
        reservation.id,
      )
    }

    await tx.reservation.update({
      where: {
        id: reservation.id,
      },
      data: {
        status: 'CANCELED',
        canceledAt: now,
        canceledByUserId: input.userId,
        cancellationReason: 'Canceled by member from private portal',
      },
    })

    await tx.classSession.update({
      where: {
        id: reservation.classSession.id,
      },
      data: {
        reservedCount: {
          decrement: 1,
        },
      },
    })

    const creditUsage = reservation.entitlementUsages.find(
      (usage) => usage.usageType === 'CREDIT' && usage.memberCreditAccountId && usage.creditsUsed,
    )

    if (creditUsage?.memberCreditAccountId && creditUsage.creditsUsed) {
      await refundCreditUsage(tx, {
        memberCreditAccountId: creditUsage.memberCreditAccountId,
        creditsUsed: creditUsage.creditsUsed,
        reservationId: reservation.id,
        now,
      })
    }

    await promoteWaitlistIfPossibleInTransaction(tx, {
      classSessionId: reservation.classSession.id,
      now,
    })

    return buildMutationResult(
      'CANCELED',
      `Reserva cancelada para ${reservation.classSession.classType.name}.`,
      reservation.id,
      true,
    )
  })
}

export async function joinSessionWaitlist(
  input: MutationContext & {
    classSessionId: string
  },
): Promise<ReservationMutationResult> {
  return runSerializableReservationTransaction(async (tx) => {
    const now = input.now ?? new Date()
    const session = await getMutationSession(tx, input.classSessionId)

    if (!isBookableSession(session, now)) {
      return buildMutationResult(
        'SESSION_NOT_BOOKABLE',
        'La sesión ya no admite nuevas acciones desde el portal.',
      )
    }

    const [existingReservation, existingWaitlist] = await Promise.all([
      findBookedReservation(tx, {
        memberId: input.memberId,
        classSessionId: session.id,
      }),
      findActiveWaitlistEntry(tx, {
        memberId: input.memberId,
        classSessionId: session.id,
      }),
    ])

    if (existingReservation) {
      return buildMutationResult(
        'ALREADY_BOOKED',
        'Ya tienes una reserva confirmada para esta sesión.',
        existingReservation.id,
      )
    }

    if (existingWaitlist) {
      return buildMutationResult(
        'ALREADY_WAITLISTED',
        'Ya estás dentro de la waitlist activa de esta sesión.',
        existingWaitlist.id,
      )
    }

    if (!session.waitlistEnabled) {
      return buildMutationResult(
        'WAITLIST_DISABLED',
        'Esta sesión no admite waitlist.',
      )
    }

    if (session.reservedCount < session.capacity) {
      return buildMutationResult(
        'SESSION_NOT_BOOKABLE',
        'Todavía quedan plazas libres; no necesitas entrar en waitlist.',
      )
    }

    const eligibility = await evaluateEligibilityInTx(tx, {
      memberId: input.memberId,
      session,
    })

    if (!eligibility.eligible) {
      return buildEligibilityFailureResult(eligibility.code)
    }

    const nextPosition = await getNextWaitlistPosition(tx, session.id)

    const entry = await tx.waitlistEntry.create({
      data: {
        memberId: input.memberId,
        classSessionId: session.id,
        position: nextPosition,
        status: 'WAITING',
        joinedAt: now,
      },
    })

    return buildMutationResult(
      'WAITLIST_JOINED',
      `Te has unido a la waitlist de ${session.classType.name}.`,
      entry.id,
      true,
    )
  })
}

export async function leaveSessionWaitlist(
  input: MutationContext & {
    waitlistEntryId: string
  },
): Promise<ReservationMutationResult> {
  return runSerializableReservationTransaction(async (tx) => {
    const entry = await tx.waitlistEntry.findFirst({
      where: {
        id: input.waitlistEntryId,
        memberId: input.memberId,
        status: {
          in: [...ACTIVE_WAITLIST_STATUSES],
        },
      },
      include: {
        classSession: {
          select: {
            id: true,
            classType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!entry) {
      return buildMutationResult(
        'WAITLIST_NOT_FOUND',
        'No hemos encontrado una waitlist activa para retirar.',
      )
    }

    await tx.waitlistEntry.update({
      where: {
        id: entry.id,
      },
      data: {
        status: 'REMOVED',
      },
    })

    await resequenceWaitlistPositions(tx, entry.classSession.id)

    return buildMutationResult(
      'WAITLIST_LEFT',
      `Has salido de la waitlist de ${entry.classSession.classType.name}.`,
      entry.id,
      true,
    )
  })
}

export async function promoteWaitlistIfPossible(
  input: {
    classSessionId: string
    now?: Date
  },
) {
  return runSerializableReservationTransaction(async (tx) => {
    return promoteWaitlistIfPossibleInTransaction(tx, {
      classSessionId: input.classSessionId,
      now: input.now ?? new Date(),
    })
  })
}

export async function runSerializableReservationTransaction<T>(
  operation: (tx: ReservationMutationTx) => Promise<T>,
) {
  let attempt = 0

  while (attempt < SERIALIZABLE_RETRY_LIMIT) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      attempt += 1

      if (!isRetryableTransactionError(error) || attempt >= SERIALIZABLE_RETRY_LIMIT) {
        throw error
      }
    }
  }

  throw new Error('Serializable reservation transaction failed after retries')
}

export async function evaluateEligibilityInTx(
  tx: ReservationMutationTx,
  input: {
    memberId: string
    session: MutationSessionSnapshot
  },
) {
  const usageWindow = buildMembershipPolicyUsageSearchWindow({
    earliestSessionStartsAt: input.session.startsAt,
    latestSessionStartsAt: input.session.startsAt,
  })

  const [memberships, creditAccounts] = await Promise.all([
    tx.memberMembership.findMany({
      where: {
        memberId: input.memberId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        membershipPlanId: true,
        status: true,
        startsAt: true,
        endsAt: true,
        membershipPlan: {
          select: {
            bookingPolicyType: true,
            bookingPolicy: {
              select: {
                policyType: true,
                periodType: true,
                allowanceCount: true,
              },
            },
          },
        },
        bookingOverrides: {
          where: {
            revokedAt: null,
            expiresAt: {
              gte: usageWindow.startsAtGte,
            },
            startsAt: {
              lte: usageWindow.startsAtLte,
            },
          },
          select: {
            id: true,
            overrideType: true,
            classSessionId: true,
            extraBookings: true,
            startsAt: true,
            expiresAt: true,
            revokedAt: true,
          },
        },
        usages: {
          where: {
            usageType: {
              in: ['MEMBERSHIP', 'MANUAL_OVERRIDE'],
            },
            reservation: {
              classSession: {
                startsAt: {
                  gte: usageWindow.startsAtGte,
                  lte: usageWindow.startsAtLte,
                },
              },
            },
          },
          select: {
            usageType: true,
            bookingOverrideId: true,
            reservation: {
              select: {
                status: true,
                classSession: {
                  select: {
                    id: true,
                    startsAt: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startsAt: 'desc',
      },
    }),
    tx.memberCreditAccount.findMany({
      where: {
        memberId: input.memberId,
        status: {
          in: ['ACTIVE', 'DEPLETED'],
        },
      },
      select: {
        id: true,
        status: true,
        openedAt: true,
        expiresAt: true,
        creditPack: {
          select: {
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
        openedAt: 'asc',
      },
    }),
  ])

  return evaluateReservationEligibilityFromSnapshots({
    rules: input.session.classType.eligibilityRules,
    memberships,
    creditAccounts,
    sessionStartsAt: input.session.startsAt,
    classSessionId: input.session.id,
  })
}

export async function promoteWaitlistIfPossibleInTransaction(
  tx: ReservationMutationTx,
  input: {
    classSessionId: string
    now: Date
  },
) {
  const promotions: string[] = []

  while (true) {
    const session = await getMutationSession(tx, input.classSessionId)

    if (session.reservedCount >= session.capacity) {
      break
    }

    const nextWaitlistEntry = await tx.waitlistEntry.findFirst({
      where: {
        classSessionId: input.classSessionId,
        status: {
          in: [...ACTIVE_WAITLIST_STATUSES],
        },
      },
      orderBy: [{ position: 'asc' }, { joinedAt: 'asc' }],
    })

    if (!nextWaitlistEntry) {
      break
    }

    const existingReservation = await findBookedReservation(tx, {
      memberId: nextWaitlistEntry.memberId,
      classSessionId: input.classSessionId,
    })

    if (existingReservation) {
      await tx.waitlistEntry.update({
        where: {
          id: nextWaitlistEntry.id,
        },
        data: {
          status: 'PROMOTED',
          promotedAt: input.now,
          position: null,
        },
      })

      await resequenceWaitlistPositions(tx, input.classSessionId)
      continue
    }

    const eligibility = await evaluateEligibilityInTx(tx, {
      memberId: nextWaitlistEntry.memberId,
      session,
    })

    if (!eligibility.eligible) {
      await tx.waitlistEntry.update({
        where: {
          id: nextWaitlistEntry.id,
        },
        data: {
          status: 'EXPIRED',
          expiredAt: input.now,
          position: null,
        },
      })

      await resequenceWaitlistPositions(tx, input.classSessionId)
      continue
    }

    const reservation = await createBookedReservation(tx, {
      memberId: nextWaitlistEntry.memberId,
      classSessionId: input.classSessionId,
      usage: eligibility.usage,
      source: 'SYSTEM',
      now: input.now,
    })

    await tx.classSession.update({
      where: {
        id: input.classSessionId,
      },
      data: {
        reservedCount: {
          increment: 1,
        },
      },
    })

    await tx.waitlistEntry.update({
      where: {
        id: nextWaitlistEntry.id,
      },
      data: {
        status: 'PROMOTED',
        promotedAt: input.now,
        position: null,
      },
    })

    promotions.push(reservation.id)
    await resequenceWaitlistPositions(tx, input.classSessionId)
  }

  return promotions
}

export async function createBookedReservation(
  tx: ReservationMutationTx,
  input: {
    memberId: string
    classSessionId: string
    usage: ReservationEligibilityUsage
    source: 'MEMBER_APP' | 'SYSTEM'
    now: Date
  },
) {
  const reservation = await tx.reservation.create({
    data: {
      memberId: input.memberId,
      classSessionId: input.classSessionId,
      status: 'BOOKED',
      attendanceStatus: 'PENDING',
      source: input.source,
      bookedAt: input.now,
    },
  })

  if (input.usage.usageType === 'MEMBERSHIP') {
    await tx.reservationEntitlementUsage.create({
      data: {
        reservationId: reservation.id,
        usageType: 'MEMBERSHIP',
        memberMembershipId: input.usage.memberMembershipId,
      },
    })

    return reservation
  }

  if (input.usage.usageType === 'MANUAL_OVERRIDE') {
    await tx.reservationEntitlementUsage.create({
      data: {
        reservationId: reservation.id,
        usageType: 'MANUAL_OVERRIDE',
        memberMembershipId: input.usage.memberMembershipId,
        bookingOverrideId: input.usage.bookingOverrideId,
      },
    })

    return reservation
  }

  const creditAccount = await tx.memberCreditAccount.findUnique({
    where: {
      id: input.usage.memberCreditAccountId,
    },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      creditPack: {
        select: {
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
  })

  if (!creditAccount) {
    throw new Error('Credit account missing during reservation usage creation')
  }

  const currentBalance = calculateCreditAccountBalance(creditAccount)
  const creditsUsed = input.usage.creditsUsed ?? 0
  const nextBalance = currentBalance - creditsUsed

  const ledgerEntry = await tx.creditLedgerEntry.create({
    data: {
      memberCreditAccountId: creditAccount.id,
      entryType: 'RESERVATION_CONSUME',
      creditsDelta: -creditsUsed,
      balanceAfter: nextBalance,
      referenceType: 'reservation',
      referenceId: reservation.id,
      notes: 'Credit consumed for member reservation',
    },
  })

  await tx.reservationEntitlementUsage.create({
    data: {
      reservationId: reservation.id,
      usageType: 'CREDIT',
      memberCreditAccountId: creditAccount.id,
      creditLedgerEntryId: ledgerEntry.id,
      creditsUsed,
    },
  })

  await tx.memberCreditAccount.update({
    where: {
      id: creditAccount.id,
    },
    data: {
      status: nextBalance > 0 ? 'ACTIVE' : 'DEPLETED',
    },
  })

  return reservation
}

export async function refundCreditUsage(
  tx: ReservationMutationTx,
  input: {
    memberCreditAccountId: string
    creditsUsed: number
    reservationId: string
    now: Date
  },
) {
  const creditAccount = await tx.memberCreditAccount.findUnique({
    where: {
      id: input.memberCreditAccountId,
    },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      creditPack: {
        select: {
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
  })

  if (!creditAccount) {
    throw new Error('Credit account missing during reservation refund')
  }

  const currentBalance = calculateCreditAccountBalance(creditAccount)
  const nextBalance = currentBalance + input.creditsUsed

  await tx.creditLedgerEntry.create({
    data: {
      memberCreditAccountId: creditAccount.id,
      entryType: 'RESERVATION_REFUND',
      creditsDelta: input.creditsUsed,
      balanceAfter: nextBalance,
      referenceType: 'reservation',
      referenceId: input.reservationId,
      notes: 'Credit refunded after member cancellation inside the allowed window',
    },
  })

  const isExpired = creditAccount.expiresAt
    ? creditAccount.expiresAt.getTime() < input.now.getTime()
    : false

  await tx.memberCreditAccount.update({
    where: {
      id: creditAccount.id,
    },
    data: {
      status: isExpired ? creditAccount.status : 'ACTIVE',
    },
  })
}

export async function resequenceWaitlistPositions(
  tx: ReservationMutationTx,
  classSessionId: string,
) {
  const activeEntries = await tx.waitlistEntry.findMany({
    where: {
      classSessionId,
      status: {
        in: [...ACTIVE_WAITLIST_STATUSES],
      },
    },
    select: {
      id: true,
    },
    orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
  })

  await Promise.all(
    activeEntries.map((entry, index) =>
      tx.waitlistEntry.update({
        where: {
          id: entry.id,
        },
        data: {
          position: index + 1,
        },
      }),
    ),
  )
}

async function getMutationSession(
  tx: ReservationMutationTx,
  classSessionId: string,
): Promise<MutationSessionSnapshot> {
  const session = await tx.classSession.findUnique({
    where: {
      id: classSessionId,
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      reservedCount: true,
      waitlistEnabled: true,
      status: true,
      classType: {
        select: {
          name: true,
          eligibilityRules: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              ruleType: true,
              membershipPlanId: true,
              creditCost: true,
              priority: true,
              createdAt: true,
              isActive: true,
            },
          },
        },
      },
    },
  })

  if (!session) {
    throw new Error(`Class session ${classSessionId} not found`)
  }

  return session
}

async function getNextWaitlistPosition(
  tx: ReservationMutationTx,
  classSessionId: string,
) {
  const lastActiveEntry = await tx.waitlistEntry.findFirst({
    where: {
      classSessionId,
      status: {
        in: [...ACTIVE_WAITLIST_STATUSES],
      },
    },
    select: {
      position: true,
    },
    orderBy: [{ position: 'desc' }, { joinedAt: 'desc' }],
  })

  return (lastActiveEntry?.position ?? 0) + 1
}

async function findBookedReservation(
  tx: ReservationMutationTx,
  input: {
    memberId: string
    classSessionId: string
  },
) {
  return tx.reservation.findFirst({
    where: {
      memberId: input.memberId,
      classSessionId: input.classSessionId,
      status: 'BOOKED',
    },
    select: {
      id: true,
    },
  })
}

async function findActiveWaitlistEntry(
  tx: ReservationMutationTx,
  input: {
    memberId: string
    classSessionId: string
  },
) {
  return tx.waitlistEntry.findFirst({
    where: {
      memberId: input.memberId,
      classSessionId: input.classSessionId,
      status: {
        in: [...ACTIVE_WAITLIST_STATUSES],
      },
    },
    select: {
      id: true,
    },
  })
}

function isBookableSession(session: MutationSessionSnapshot, now: Date) {
  return session.status === 'PUBLISHED' && session.startsAt.getTime() > now.getTime()
}

function buildEligibilityFailureResult(
  code: Exclude<ReservationEligibilityResult['code'], 'ELIGIBLE'>,
) {
  if (code === 'NO_ACTIVE_RULE') {
    return buildMutationResult(
      'NO_ACTIVE_RULE',
      'La sesión todavía no tiene una regla de elegibilidad operativa.',
    )
  }

  if (code === 'MEMBERSHIP_ALLOWANCE_EXHAUSTED') {
    return buildMutationResult(
      'MEMBERSHIP_ALLOWANCE_EXHAUSTED',
      'Has agotado el cupo de tu membresía para este periodo.',
    )
  }

  return buildMutationResult(
    'NO_ELIGIBLE_ENTITLEMENT',
    'Ahora mismo no tienes un plan o créditos válidos para esta sesión.',
  )
}

function buildMutationResult(
  code: ReservationMutationCode,
  message: string,
  updatedEntityId?: string,
  success = false,
): ReservationMutationResult {
  return {
    success,
    code,
    message,
    updatedEntityId,
  }
}

function isRetryableTransactionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  )
}
