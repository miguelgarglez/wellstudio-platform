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

const MANAGED_SESSION_RESERVED_COUNTS = {
  available: 0,
  cancelable: 1,
  fullWaitlist: 1,
  attended: 1,
  canceled: 0,
  noShow: 1,
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

export function buildMemberReservationsFlowSessionBlueprints(now = new Date()) {
  const timeline = buildMemberReservationsFlowTimeline(now)

  return {
    available: {
      ...timeline.available,
      reservedCount: MANAGED_SESSION_RESERVED_COUNTS.available,
      locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.available,
      classTypeKey: 'reservable',
      status: 'PUBLISHED',
      waitlistEnabled: true,
    },
    cancelable: {
      ...timeline.cancelable,
      reservedCount: MANAGED_SESSION_RESERVED_COUNTS.cancelable,
      locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.cancelable,
      classTypeKey: 'reservable',
      status: 'PUBLISHED',
      waitlistEnabled: true,
    },
    fullWaitlist: {
      ...timeline.fullWaitlist,
      reservedCount: MANAGED_SESSION_RESERVED_COUNTS.fullWaitlist,
      locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.fullWaitlist,
      classTypeKey: 'full',
      status: 'PUBLISHED',
      waitlistEnabled: true,
    },
    attended: {
      ...timeline.attended,
      reservedCount: MANAGED_SESSION_RESERVED_COUNTS.attended,
      locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.attended,
      classTypeKey: 'reservable',
      status: 'COMPLETED',
      waitlistEnabled: false,
    },
    canceled: {
      ...timeline.canceled,
      reservedCount: MANAGED_SESSION_RESERVED_COUNTS.canceled,
      locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.canceled,
      classTypeKey: 'reservable',
      status: 'COMPLETED',
      waitlistEnabled: false,
    },
    noShow: {
      ...timeline.noShow,
      reservedCount: MANAGED_SESSION_RESERVED_COUNTS.noShow,
      locationLabel: MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.noShow,
      classTypeKey: 'reservable',
      status: 'COMPLETED',
      waitlistEnabled: false,
    },
  }
}

export async function ensureMemberReservationsFlowScenario({
  prisma,
  authUser,
  email,
  now = new Date(),
}) {
  const timeline = buildMemberReservationsFlowTimeline(now)
  const sessionBlueprints = buildMemberReservationsFlowSessionBlueprints(now)

  return runScenarioTransactionWithRetry(async () =>
    prisma.$transaction(async (tx) => {
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
        sessionBlueprints,
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
      timeout: 15_000,
      maxWait: 5_000,
    }),
  )
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
  { coachId, reservableClassTypeId, fullClassTypeId, sessionBlueprints, now },
) {
  const classTypeIds = {
    reservable: reservableClassTypeId,
    full: fullClassTypeId,
  }

  return {
    available: await tx.classSession.create({
      data: {
        classTypeId: classTypeIds[sessionBlueprints.available.classTypeKey],
        coachId,
        startsAt: sessionBlueprints.available.startsAt,
        endsAt: sessionBlueprints.available.endsAt,
        capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
        reservedCount: sessionBlueprints.available.reservedCount,
        waitlistEnabled: sessionBlueprints.available.waitlistEnabled,
        locationLabel: sessionBlueprints.available.locationLabel,
        status: sessionBlueprints.available.status,
        publishedAt: shiftMinutes(now, -30),
      },
    }),
    cancelable: await tx.classSession.create({
      data: {
        classTypeId: classTypeIds[sessionBlueprints.cancelable.classTypeKey],
        coachId,
        startsAt: sessionBlueprints.cancelable.startsAt,
        endsAt: sessionBlueprints.cancelable.endsAt,
        capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
        reservedCount: sessionBlueprints.cancelable.reservedCount,
        waitlistEnabled: sessionBlueprints.cancelable.waitlistEnabled,
        locationLabel: sessionBlueprints.cancelable.locationLabel,
        status: sessionBlueprints.cancelable.status,
        publishedAt: shiftMinutes(now, -30),
      },
    }),
    fullWaitlist: await tx.classSession.create({
      data: {
        classTypeId: classTypeIds[sessionBlueprints.fullWaitlist.classTypeKey],
        coachId,
        startsAt: sessionBlueprints.fullWaitlist.startsAt,
        endsAt: sessionBlueprints.fullWaitlist.endsAt,
        capacity: MANAGED_CLASS_TYPES.full.capacityDefault,
        reservedCount: sessionBlueprints.fullWaitlist.reservedCount,
        waitlistEnabled: sessionBlueprints.fullWaitlist.waitlistEnabled,
        locationLabel: sessionBlueprints.fullWaitlist.locationLabel,
        status: sessionBlueprints.fullWaitlist.status,
        publishedAt: shiftMinutes(now, -30),
      },
    }),
    attended: await tx.classSession.create({
      data: {
        classTypeId: classTypeIds[sessionBlueprints.attended.classTypeKey],
        coachId,
        startsAt: sessionBlueprints.attended.startsAt,
        endsAt: sessionBlueprints.attended.endsAt,
        capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
        reservedCount: sessionBlueprints.attended.reservedCount,
        waitlistEnabled: sessionBlueprints.attended.waitlistEnabled,
        locationLabel: sessionBlueprints.attended.locationLabel,
        status: sessionBlueprints.attended.status,
        publishedAt: shiftMinutes(sessionBlueprints.attended.startsAt, -120),
      },
    }),
    canceled: await tx.classSession.create({
      data: {
        classTypeId: classTypeIds[sessionBlueprints.canceled.classTypeKey],
        coachId,
        startsAt: sessionBlueprints.canceled.startsAt,
        endsAt: sessionBlueprints.canceled.endsAt,
        capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
        reservedCount: sessionBlueprints.canceled.reservedCount,
        waitlistEnabled: sessionBlueprints.canceled.waitlistEnabled,
        locationLabel: sessionBlueprints.canceled.locationLabel,
        status: sessionBlueprints.canceled.status,
        publishedAt: shiftMinutes(sessionBlueprints.canceled.startsAt, -120),
      },
    }),
    noShow: await tx.classSession.create({
      data: {
        classTypeId: classTypeIds[sessionBlueprints.noShow.classTypeKey],
        coachId,
        startsAt: sessionBlueprints.noShow.startsAt,
        endsAt: sessionBlueprints.noShow.endsAt,
        capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
        reservedCount: sessionBlueprints.noShow.reservedCount,
        waitlistEnabled: sessionBlueprints.noShow.waitlistEnabled,
        locationLabel: sessionBlueprints.noShow.locationLabel,
        status: sessionBlueprints.noShow.status,
        publishedAt: shiftMinutes(sessionBlueprints.noShow.startsAt, -120),
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

async function runScenarioTransactionWithRetry(runTransaction, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await runTransaction()
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt === attempts) {
        throw error
      }

      await sleep(150 * attempt)
    }
  }

  throw new Error('Scenario transaction exhausted without returning a result.')
}

function isRetryableTransactionError(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2034'
  }

  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  return (
    message.includes('write conflict') ||
    message.includes('deadlock') ||
    message.includes('could not serialize access')
  )
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
