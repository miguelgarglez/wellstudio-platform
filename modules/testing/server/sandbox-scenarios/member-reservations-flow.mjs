import { Prisma } from '@prisma/client'

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

export const MEMBER_RESERVATIONS_FLOW_SCENARIO = 'member-reservations-flow'
export const MEMBER_RESERVATIONS_FLOW_PREFIX = 'E2E Sandbox Flow'
export const MEMBER_RESERVATIONS_FLOW_SESSION_KEYS = {
  available: `${MEMBER_RESERVATIONS_FLOW_PREFIX} · Available session`,
  cancelable: `${MEMBER_RESERVATIONS_FLOW_PREFIX} · Cancelable reservation`,
  fullWaitlist: `${MEMBER_RESERVATIONS_FLOW_PREFIX} · Full waitlist session`,
  attended: `${MEMBER_RESERVATIONS_FLOW_PREFIX} · Recent attended`,
  canceled: `${MEMBER_RESERVATIONS_FLOW_PREFIX} · Recent canceled`,
  noShow: `${MEMBER_RESERVATIONS_FLOW_PREFIX} · Recent no-show`,
}

const MANAGED_COACH = {
  displayName: 'E2E Coach Sandbox',
  firstName: 'E2E',
  lastName: 'Coach',
}

const MANAGED_MEMBER = {
  firstName: 'E2E',
  lastName: 'Member',
}

const FILLER_MEMBER_EMAIL = 'e2e.filler.sandbox@wellstudio.test'
const FILLER_MEMBER = {
  firstName: 'E2E',
  lastName: 'Filler',
}

const MANAGED_PLAN = {
  name: 'E2E Membership Flow',
  slug: 'e2e-membership-flow',
  description: 'Scenario membership for sandbox member reservation QA.',
}

const MANAGED_CLASS_TYPES = {
  reservable: {
    name: 'E2E Strength Flow',
    slug: 'e2e-strength-flow',
    description: 'Published class type used for available and booked member scenarios.',
    durationMinutes: 50,
    capacityDefault: 8,
    waitlistEnabled: true,
  },
  full: {
    name: 'E2E Premium Waitlist',
    slug: 'e2e-premium-waitlist',
    description: 'Published class type used to validate full sessions and waitlists.',
    durationMinutes: 55,
    capacityDefault: 1,
    waitlistEnabled: true,
  },
}

export function buildMemberReservationsFlowTimeline(now = new Date()) {
  return {
    available: buildSlot(now, 1, 18, 0, MANAGED_CLASS_TYPES.reservable.durationMinutes),
    cancelable: buildSlot(now, 2, 18, 30, MANAGED_CLASS_TYPES.reservable.durationMinutes),
    fullWaitlist: buildSlot(now, 3, 19, 0, MANAGED_CLASS_TYPES.full.durationMinutes),
    attended: buildSlot(now, -2, 18, 15, MANAGED_CLASS_TYPES.reservable.durationMinutes),
    canceled: buildSlot(now, -4, 18, 45, MANAGED_CLASS_TYPES.reservable.durationMinutes),
    noShow: buildSlot(now, -6, 19, 15, MANAGED_CLASS_TYPES.reservable.durationMinutes),
  }
}

export async function ensureMemberReservationsFlowScenario({
  prisma,
  authUser,
  email,
  now = new Date(),
}) {
  const timeline = buildMemberReservationsFlowTimeline(now)

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BigInt(8015780)})`

    const memberIdentity = await ensureManagedMemberIdentity(tx, {
      authUserId: authUser.id,
      email,
      profile: MANAGED_MEMBER,
      now,
    })

    const fillerIdentity = await ensureLocalOnlyMemberIdentity(tx, {
      email: FILLER_MEMBER_EMAIL,
      profile: FILLER_MEMBER,
      now,
    })

    const coach = await ensureCoach(tx)
    const membershipPlan = await ensureMembershipPlan(tx)
    const reservableClassType = await ensureClassType(tx, MANAGED_CLASS_TYPES.reservable)
    const fullClassType = await ensureClassType(tx, MANAGED_CLASS_TYPES.full)

    await reconcileEligibilityRules(tx, {
      membershipPlanId: membershipPlan.id,
      classTypeIds: [reservableClassType.id, fullClassType.id],
    })

    await tx.classSession.deleteMany({
      where: {
        locationLabel: {
          startsWith: MEMBER_RESERVATIONS_FLOW_PREFIX,
        },
      },
    })

    await tx.memberMembership.deleteMany({
      where: {
        memberId: memberIdentity.member.id,
        membershipPlanId: membershipPlan.id,
      },
    })

    const memberMembership = await tx.memberMembership.create({
      data: {
        memberId: memberIdentity.member.id,
        membershipPlanId: membershipPlan.id,
        status: 'ACTIVE',
        startsAt: shiftDays(now, -14),
        endsAt: shiftDays(now, 45),
        autoRenews: true,
      },
    })

    const fillerMembership = await tx.memberMembership.create({
      data: {
        memberId: fillerIdentity.member.id,
        membershipPlanId: membershipPlan.id,
        status: 'ACTIVE',
        startsAt: shiftDays(now, -14),
        endsAt: shiftDays(now, 45),
        autoRenews: false,
      },
    })

    const sessions = await createManagedSessions(tx, {
      coachId: coach.id,
      reservableClassTypeId: reservableClassType.id,
      fullClassTypeId: fullClassType.id,
      timeline,
      now,
    })

    const cancelableReservation = await createMembershipReservation(tx, {
      memberId: memberIdentity.member.id,
      classSessionId: sessions.cancelable.id,
      memberMembershipId: memberMembership.id,
      status: 'BOOKED',
      bookedAt: shiftMinutes(timeline.cancelable.startsAt, -60 * 24),
      attendanceStatus: 'PENDING',
      canceledAt: null,
      cancellationReason: null,
      now,
    })

    await createMembershipReservation(tx, {
      memberId: fillerIdentity.member.id,
      classSessionId: sessions.fullWaitlist.id,
      memberMembershipId: fillerMembership.id,
      status: 'BOOKED',
      bookedAt: shiftMinutes(timeline.fullWaitlist.startsAt, -60 * 24),
      attendanceStatus: 'PENDING',
      canceledAt: null,
      cancellationReason: null,
      now,
    })

    const waitlistEntry = await tx.waitlistEntry.create({
      data: {
        memberId: memberIdentity.member.id,
        classSessionId: sessions.fullWaitlist.id,
        position: 1,
        status: 'WAITING',
        joinedAt: shiftMinutes(timeline.fullWaitlist.startsAt, -180),
      },
    })

    await createMembershipReservation(tx, {
      memberId: memberIdentity.member.id,
      classSessionId: sessions.attended.id,
      memberMembershipId: memberMembership.id,
      status: 'ATTENDED',
      bookedAt: shiftMinutes(timeline.attended.startsAt, -60 * 24 * 2),
      attendanceStatus: 'ATTENDED',
      canceledAt: null,
      cancellationReason: null,
      now,
    })

    await createMembershipReservation(tx, {
      memberId: memberIdentity.member.id,
      classSessionId: sessions.canceled.id,
      memberMembershipId: memberMembership.id,
      status: 'CANCELED',
      bookedAt: shiftMinutes(timeline.canceled.startsAt, -60 * 24 * 3),
      attendanceStatus: 'PENDING',
      canceledAt: shiftMinutes(timeline.canceled.startsAt, -180),
      cancellationReason: 'Scenario reconciliation generated cancellation history',
      now,
    })

    await createMembershipReservation(tx, {
      memberId: memberIdentity.member.id,
      classSessionId: sessions.noShow.id,
      memberMembershipId: memberMembership.id,
      status: 'NO_SHOW',
      bookedAt: shiftMinutes(timeline.noShow.startsAt, -60 * 24 * 3),
      attendanceStatus: 'NO_SHOW',
      canceledAt: null,
      cancellationReason: null,
      now,
    })

    await syncReservedCounts(tx, Object.values(sessions).map((session) => session.id))

    return {
      scenario: MEMBER_RESERVATIONS_FLOW_SCENARIO,
      memberEmail: email,
      memberId: memberIdentity.member.id,
      localUserId: memberIdentity.user.id,
      planSlug: membershipPlan.slug,
      classTypeSlugs: [reservableClassType.slug, fullClassType.slug],
      waitlistEntryId: waitlistEntry.id,
      cancelableReservationId: cancelableReservation.id,
      sessions: Object.entries(sessions).map(([key, session]) => ({
        key,
        id: session.id,
        locationLabel: session.locationLabel,
        startsAt: session.startsAt,
      })),
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}

async function ensureManagedMemberIdentity(tx, { authUserId, email, profile, now }) {
  const normalizedEmail = normalizeEmail(email)

  const existingUser = await tx.user.findFirst({
    where: {
      OR: [
        {
          externalAuthProvider: 'supabase',
          externalAuthId: authUserId,
        },
        {
          normalizedEmail,
        },
      ],
    },
  })

  const user = existingUser
    ? await tx.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          email,
          normalizedEmail,
          status: 'ACTIVE',
          externalAuthProvider: 'supabase',
          externalAuthId: authUserId,
          emailVerifiedAt: now,
          lastLoginAt: now,
        },
      })
    : await tx.user.create({
        data: {
          email,
          normalizedEmail,
          status: 'ACTIVE',
          externalAuthProvider: 'supabase',
          externalAuthId: authUserId,
          emailVerifiedAt: now,
          lastLoginAt: now,
        },
      })

  await tx.userRole.createMany({
    data: [
      {
        userId: user.id,
        role: 'MEMBER',
      },
    ],
    skipDuplicates: true,
  })

  const existingMember = await tx.member.findUnique({
    where: {
      userId: user.id,
    },
  })

  const member = existingMember
    ? await tx.member.update({
        where: {
          userId: user.id,
        },
        data: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          status: 'ACTIVE',
          joinedAt: existingMember.joinedAt ?? now,
        },
      })
    : await tx.member.create({
        data: {
          userId: user.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          status: 'ACTIVE',
          joinedAt: now,
        },
      })

  return {
    user,
    member,
  }
}

async function ensureLocalOnlyMemberIdentity(tx, { email, profile, now }) {
  const normalizedEmail = normalizeEmail(email)

  const existingUser = await tx.user.findUnique({
    where: {
      normalizedEmail,
    },
  })

  const user = existingUser
    ? await tx.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          email,
          normalizedEmail,
          status: 'ACTIVE',
          lastLoginAt: now,
        },
      })
    : await tx.user.create({
        data: {
          email,
          normalizedEmail,
          status: 'ACTIVE',
          emailVerifiedAt: now,
          lastLoginAt: now,
        },
      })

  await tx.userRole.createMany({
    data: [
      {
        userId: user.id,
        role: 'MEMBER',
      },
    ],
    skipDuplicates: true,
  })

  const existingMember = await tx.member.findUnique({
    where: {
      userId: user.id,
    },
  })

  const member = existingMember
    ? await tx.member.update({
        where: {
          userId: user.id,
        },
        data: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          status: 'ACTIVE',
          joinedAt: existingMember.joinedAt ?? now,
        },
      })
    : await tx.member.create({
        data: {
          userId: user.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          status: 'ACTIVE',
          joinedAt: now,
        },
      })

  return {
    user,
    member,
  }
}

async function ensureCoach(tx) {
  const existingCoach = await tx.coach.findFirst({
    where: {
      displayName: MANAGED_COACH.displayName,
    },
  })

  if (existingCoach) {
    return tx.coach.update({
      where: {
        id: existingCoach.id,
      },
      data: {
        displayName: MANAGED_COACH.displayName,
        firstName: MANAGED_COACH.firstName,
        lastName: MANAGED_COACH.lastName,
        status: 'ACTIVE',
      },
    })
  }

  return tx.coach.create({
    data: {
      displayName: MANAGED_COACH.displayName,
      firstName: MANAGED_COACH.firstName,
      lastName: MANAGED_COACH.lastName,
      status: 'ACTIVE',
    },
  })
}

async function ensureMembershipPlan(tx) {
  return tx.membershipPlan.upsert({
    where: {
      slug: MANAGED_PLAN.slug,
    },
    update: {
      name: MANAGED_PLAN.name,
      description: MANAGED_PLAN.description,
      status: 'ACTIVE',
      isPublic: false,
      priceAmount: 8900,
      currency: 'EUR',
      billingType: 'RECURRING',
      billingInterval: 'MONTHLY',
      bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS',
    },
    create: {
      name: MANAGED_PLAN.name,
      slug: MANAGED_PLAN.slug,
      description: MANAGED_PLAN.description,
      status: 'ACTIVE',
      isPublic: false,
      priceAmount: 8900,
      currency: 'EUR',
      billingType: 'RECURRING',
      billingInterval: 'MONTHLY',
      bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS',
    },
  })
}

async function ensureClassType(tx, classType) {
  return tx.classType.upsert({
    where: {
      slug: classType.slug,
    },
    update: {
      name: classType.name,
      description: classType.description,
      category: 'E2E',
      durationMinutes: classType.durationMinutes,
      capacityDefault: classType.capacityDefault,
      waitlistEnabled: classType.waitlistEnabled,
      isPublic: false,
      status: 'ACTIVE',
    },
    create: {
      name: classType.name,
      slug: classType.slug,
      description: classType.description,
      category: 'E2E',
      durationMinutes: classType.durationMinutes,
      capacityDefault: classType.capacityDefault,
      waitlistEnabled: classType.waitlistEnabled,
      isPublic: false,
      status: 'ACTIVE',
    },
  })
}

async function reconcileEligibilityRules(tx, { membershipPlanId, classTypeIds }) {
  await tx.classTypeEligibilityRule.deleteMany({
    where: {
      classTypeId: {
        in: classTypeIds,
      },
    },
  })

  await tx.classTypeEligibilityRule.createMany({
    data: classTypeIds.map((classTypeId, index) => ({
      classTypeId,
      ruleType: 'MEMBERSHIP_PLAN',
      membershipPlanId,
      priority: index,
      isActive: true,
    })),
  })
}

async function createManagedSessions(
  tx,
  { coachId, reservableClassTypeId, fullClassTypeId, timeline, now },
) {
  return {
    available: await tx.classSession.create({
      data: {
        classTypeId: reservableClassTypeId,
        coachId,
        startsAt: timeline.available.startsAt,
        endsAt: timeline.available.endsAt,
        capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
        reservedCount: 0,
        waitlistEnabled: true,
        locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.available,
        status: 'PUBLISHED',
        publishedAt: shiftMinutes(now, -30),
      },
    }),
    cancelable: await tx.classSession.create({
      data: {
        classTypeId: reservableClassTypeId,
        coachId,
        startsAt: timeline.cancelable.startsAt,
        endsAt: timeline.cancelable.endsAt,
        capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
        reservedCount: 0,
        waitlistEnabled: true,
        locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.cancelable,
        status: 'PUBLISHED',
        publishedAt: shiftMinutes(now, -30),
      },
    }),
    fullWaitlist: await tx.classSession.create({
      data: {
        classTypeId: fullClassTypeId,
        coachId,
        startsAt: timeline.fullWaitlist.startsAt,
        endsAt: timeline.fullWaitlist.endsAt,
        capacity: MANAGED_CLASS_TYPES.full.capacityDefault,
        reservedCount: 0,
        waitlistEnabled: true,
        locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.fullWaitlist,
        status: 'PUBLISHED',
        publishedAt: shiftMinutes(now, -30),
      },
    }),
    attended: await tx.classSession.create({
      data: {
        classTypeId: reservableClassTypeId,
        coachId,
        startsAt: timeline.attended.startsAt,
        endsAt: timeline.attended.endsAt,
        capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
        reservedCount: 0,
        waitlistEnabled: false,
        locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.attended,
        status: 'COMPLETED',
        publishedAt: shiftMinutes(timeline.attended.startsAt, -120),
      },
    }),
    canceled: await tx.classSession.create({
      data: {
        classTypeId: reservableClassTypeId,
        coachId,
        startsAt: timeline.canceled.startsAt,
        endsAt: timeline.canceled.endsAt,
        capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
        reservedCount: 0,
        waitlistEnabled: false,
        locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.canceled,
        status: 'COMPLETED',
        publishedAt: shiftMinutes(timeline.canceled.startsAt, -120),
      },
    }),
    noShow: await tx.classSession.create({
      data: {
        classTypeId: reservableClassTypeId,
        coachId,
        startsAt: timeline.noShow.startsAt,
        endsAt: timeline.noShow.endsAt,
        capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
        reservedCount: 0,
        waitlistEnabled: false,
        locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.noShow,
        status: 'COMPLETED',
        publishedAt: shiftMinutes(timeline.noShow.startsAt, -120),
      },
    }),
  }
}

async function createMembershipReservation(
  tx,
  {
    memberId,
    classSessionId,
    memberMembershipId,
    status,
    bookedAt,
    attendanceStatus,
    canceledAt,
    cancellationReason,
    now,
  },
) {
  const reservation = await tx.reservation.create({
    data: {
      memberId,
      classSessionId,
      status,
      bookedAt,
      canceledAt,
      cancellationReason,
      attendanceStatus,
      source: 'MEMBER_APP',
      canceledByUserId: status === 'CANCELED' ? null : null,
    },
  })

  await tx.reservationEntitlementUsage.create({
    data: {
      reservationId: reservation.id,
      usageType: 'MEMBERSHIP',
      memberMembershipId,
      createdAt: now,
    },
  })

  return reservation
}

async function syncReservedCounts(tx, classSessionIds) {
  for (const classSessionId of classSessionIds) {
    const activeReservationCount = await tx.reservation.count({
      where: {
        classSessionId,
        status: {
          in: ['BOOKED', 'ATTENDED', 'NO_SHOW'],
        },
      },
    })

    await tx.classSession.update({
      where: {
        id: classSessionId,
      },
      data: {
        reservedCount: activeReservationCount,
      },
    })
  }
}

function buildSlot(now, dayOffset, hour, minute, durationMinutes) {
  const startsAt = new Date(now)
  startsAt.setHours(0, 0, 0, 0)
  startsAt.setDate(startsAt.getDate() + dayOffset)
  startsAt.setHours(hour, minute, 0, 0)

  return {
    startsAt,
    endsAt: shiftMinutes(startsAt, durationMinutes),
  }
}

function shiftDays(date, dayOffset) {
  const value = new Date(date)
  value.setDate(value.getDate() + dayOffset)
  return value
}

function shiftMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}
