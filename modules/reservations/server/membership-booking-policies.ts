import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import {
  type SupportedMembershipBookingPeriodType,
  type SupportedMembershipBookingPolicyType,
} from '@/modules/reservations/server/membership-booking-policy'

export async function upsertMembershipBookingPolicy(input: {
  membershipPlanId: string
  actorUserId: string
  policyType: SupportedMembershipBookingPolicyType
  periodType?: SupportedMembershipBookingPeriodType | null
  allowanceCount?: number | null
}) {
  const normalizedPolicy = normalizePolicyInput(input)

  return prisma.$transaction(async (tx) => {
    const membershipPlan = await tx.membershipPlan.findUnique({
      where: {
        id: input.membershipPlanId,
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (!membershipPlan) {
      throw new Error('Membership plan not found for booking policy update')
    }

    const policy = await tx.membershipBookingPolicy.upsert({
      where: {
        membershipPlanId: input.membershipPlanId,
      },
      update: normalizedPolicy,
      create: {
        membershipPlanId: input.membershipPlanId,
        ...normalizedPolicy,
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        actionType: 'membership_booking_policy.upserted',
        entityType: 'membership_booking_policy',
        entityId: policy.id,
        contextJson: {
          membershipPlanId: membershipPlan.id,
          membershipPlanName: membershipPlan.name,
          policyType: policy.policyType,
          periodType: policy.periodType,
          allowanceCount: policy.allowanceCount,
        },
      },
    })

    return policy
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}

function normalizePolicyInput(input: {
  policyType: SupportedMembershipBookingPolicyType
  periodType?: SupportedMembershipBookingPeriodType | null
  allowanceCount?: number | null
}) {
  if (input.policyType === 'UNLIMITED') {
    return {
      policyType: 'UNLIMITED' as const,
      periodType: null,
      allowanceCount: null,
    }
  }

  if (!input.periodType) {
    throw new Error('Periodic booking policies require a period type')
  }

  const allowanceCount = Math.trunc(input.allowanceCount ?? 0)

  if (allowanceCount <= 0) {
    throw new Error('Periodic booking policies require a positive allowance count')
  }

  return {
    policyType: 'PERIODIC_ALLOWANCE' as const,
    periodType: input.periodType,
    allowanceCount,
  }
}
