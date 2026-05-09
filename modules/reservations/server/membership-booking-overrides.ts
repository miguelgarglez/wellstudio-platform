import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import { buildBusinessPeriodWindow } from '@/modules/reservations/server/reservation-eligibility'

export async function grantMembershipPeriodAllowanceOverride(input: {
  memberMembershipId: string
  extraBookings: number
  actorUserId: string
  reason: string
  effectiveAt?: Date
}) {
  const effectiveAt = input.effectiveAt ?? new Date()

  if (input.extraBookings <= 0) {
    throw new Error('extraBookings must be greater than zero')
  }

  return prisma.$transaction(async (tx) => {
    const membership = await tx.memberMembership.findUnique({
      where: {
        id: input.memberMembershipId,
      },
      select: {
        id: true,
        membershipPlan: {
          select: {
            bookingPolicy: {
              select: {
                policyType: true,
                periodType: true,
              },
            },
          },
        },
      },
    })

    if (!membership) {
      throw new Error('Member membership not found for booking override')
    }

    if (
      membership.membershipPlan.bookingPolicy?.policyType !== 'PERIODIC_ALLOWANCE' ||
      !membership.membershipPlan.bookingPolicy.periodType
    ) {
      throw new Error('Period allowance overrides require a periodic booking policy')
    }

    const periodWindow = buildBusinessPeriodWindow(
      effectiveAt,
      membership.membershipPlan.bookingPolicy.periodType,
    )

    const override = await tx.memberMembershipBookingOverride.create({
      data: {
        memberMembershipId: input.memberMembershipId,
        overrideType: 'EXTRA_ALLOWANCE',
        extraBookings: input.extraBookings,
        startsAt: periodWindow.startsAt,
        expiresAt: periodWindow.endsAt,
        reason: input.reason,
        grantedByUserId: input.actorUserId,
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        actionType: 'member_membership_booking_override.granted',
        entityType: 'member_membership_booking_override',
        entityId: override.id,
        contextJson: {
          overrideType: 'EXTRA_ALLOWANCE',
          memberMembershipId: input.memberMembershipId,
          extraBookings: input.extraBookings,
          startsAt: periodWindow.startsAt.toISOString(),
          expiresAt: periodWindow.endsAt.toISOString(),
          reason: input.reason,
        },
      },
    })

    return override
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}

export async function grantMembershipSessionAccessOverride(input: {
  memberMembershipId: string
  classSessionId: string
  actorUserId: string
  reason: string
  effectiveAt?: Date
}) {
  const effectiveAt = input.effectiveAt ?? new Date()

  return prisma.$transaction(async (tx) => {
    const [membership, session, existingOverride] = await Promise.all([
      tx.memberMembership.findUnique({
        where: {
          id: input.memberMembershipId,
        },
        select: {
          id: true,
        },
      }),
      tx.classSession.findUnique({
        where: {
          id: input.classSessionId,
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
        },
      }),
      tx.memberMembershipBookingOverride.findFirst({
        where: {
          memberMembershipId: input.memberMembershipId,
          classSessionId: input.classSessionId,
          overrideType: 'SESSION_ACCESS',
          revokedAt: null,
          expiresAt: {
            gte: effectiveAt,
          },
        },
      }),
    ])

    if (!membership) {
      throw new Error('Member membership not found for session override')
    }

    if (!session) {
      throw new Error('Class session not found for session override')
    }

    if (existingOverride) {
      return existingOverride
    }

    const override = await tx.memberMembershipBookingOverride.create({
      data: {
        memberMembershipId: input.memberMembershipId,
        overrideType: 'SESSION_ACCESS',
        classSessionId: input.classSessionId,
        startsAt: effectiveAt,
        expiresAt: session.endsAt,
        reason: input.reason,
        grantedByUserId: input.actorUserId,
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        actionType: 'member_membership_booking_override.granted',
        entityType: 'member_membership_booking_override',
        entityId: override.id,
        contextJson: {
          overrideType: 'SESSION_ACCESS',
          memberMembershipId: input.memberMembershipId,
          classSessionId: input.classSessionId,
          startsAt: effectiveAt.toISOString(),
          expiresAt: session.endsAt.toISOString(),
          reason: input.reason,
        },
      },
    })

    return override
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}

export async function revokeMembershipBookingOverride(input: {
  overrideId: string
  actorUserId: string
  revokedAt?: Date
  reason?: string
}) {
  const revokedAt = input.revokedAt ?? new Date()

  return prisma.$transaction(async (tx) => {
    const override = await tx.memberMembershipBookingOverride.findUnique({
      where: {
        id: input.overrideId,
      },
    })

    if (!override) {
      throw new Error('Booking override not found')
    }

    if (override.revokedAt) {
      return override
    }

    const revokedOverride = await tx.memberMembershipBookingOverride.update({
      where: {
        id: input.overrideId,
      },
      data: {
        revokedAt,
        revokedByUserId: input.actorUserId,
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        actionType: 'member_membership_booking_override.revoked',
        entityType: 'member_membership_booking_override',
        entityId: revokedOverride.id,
        contextJson: {
          revokedAt: revokedAt.toISOString(),
          reason: input.reason ?? null,
        },
      },
    })

    return revokedOverride
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}
