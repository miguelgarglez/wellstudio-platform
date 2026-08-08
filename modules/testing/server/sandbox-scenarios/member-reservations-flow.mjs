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

export const MEMBER_RESERVATIONS_FLOW_OPERATIONS = {
  full: 'full',
  waitlistState: 'waitlist-state',
  availableSessionState: 'available-session-state',
  cancelableReservationState: 'cancelable-reservation-state',
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

export const FILLER_MEMBER_EMAIL = 'e2e.filler.sandbox@wellstudio.test'
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

export async function ensureMemberReservationsFlowScenario(input) {
  return runMemberReservationsFlowOperation({
    ...input,
    operation: MEMBER_RESERVATIONS_FLOW_OPERATIONS.full,
  })
}

export async function ensureMemberReservationsFlowWaitlistState(input) {
  return runMemberReservationsFlowOperation({
    ...input,
    operation: MEMBER_RESERVATIONS_FLOW_OPERATIONS.waitlistState,
  })
}

export async function ensureMemberReservationsFlowAvailableSessionState(input) {
  return runMemberReservationsFlowOperation({
    ...input,
    operation: MEMBER_RESERVATIONS_FLOW_OPERATIONS.availableSessionState,
  })
}

export async function ensureMemberReservationsFlowCancelableReservationState(input) {
  return runMemberReservationsFlowOperation({
    ...input,
    operation: MEMBER_RESERVATIONS_FLOW_OPERATIONS.cancelableReservationState,
  })
}

async function runMemberReservationsFlowOperation({
  prisma,
  authUser,
  email,
  now = new Date(),
  operation,
}) {
  const sessionBlueprints = buildMemberReservationsFlowSessionBlueprints(now)
  const timeline = buildMemberReservationsFlowTimeline(now)

  return runScenarioTransactionWithRetry(async () =>
    prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BigInt(8015780)})`

      const dependencies = await ensureScenarioDependencies(tx, {
        authUser,
        email,
        now,
      })

      await tx.notificationJob.deleteMany({
        where: {
          recipient: {
            in: [dependencies.memberIdentity.user.email, dependencies.fillerIdentity.user.email],
          },
        },
      })

      if (operation === MEMBER_RESERVATIONS_FLOW_OPERATIONS.full) {
        const fullState = await reconcileFullScenario(tx, {
          ...dependencies,
          sessionBlueprints,
          timeline,
          now,
        })

        return buildScenarioSummary(tx, {
          ...dependencies,
          sessions: fullState.sessions,
          email,
        })
      }

      const existingState = await findManagedScenarioState(tx, {
        ...dependencies,
      })

      if (!existingState) {
        const fullState = await reconcileFullScenario(tx, {
          ...dependencies,
          sessionBlueprints,
          timeline,
          now,
        })

        return buildScenarioSummary(tx, {
          ...dependencies,
          sessions: fullState.sessions,
          email,
        })
      }

      switch (operation) {
        case MEMBER_RESERVATIONS_FLOW_OPERATIONS.waitlistState:
          await restoreWaitlistState(tx, {
            ...dependencies,
            ...existingState,
            sessionBlueprints,
            timeline,
            now,
          })
          break
        case MEMBER_RESERVATIONS_FLOW_OPERATIONS.availableSessionState:
          await restoreAvailableSessionState(tx, {
            ...dependencies,
            ...existingState,
            sessionBlueprints,
            now,
          })
          break
        case MEMBER_RESERVATIONS_FLOW_OPERATIONS.cancelableReservationState:
          await restoreCancelableReservationState(tx, {
            ...dependencies,
            ...existingState,
            sessionBlueprints,
            timeline,
            now,
          })
          break
        default:
          throw new Error(`Unsupported sandbox scenario operation "${operation}".`)
      }

      return buildScenarioSummary(tx, {
        ...dependencies,
        sessions: existingState.sessions,
        email,
      })
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15_000,
      maxWait: 5_000,
    }),
  )
}

async function ensureScenarioDependencies(tx, { authUser, email, now }) {
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

  return {
    memberIdentity,
    fillerIdentity,
    coach,
    membershipPlan,
    reservableClassType,
    fullClassType,
  }
}

async function reconcileFullScenario(
  tx,
  {
    memberIdentity,
    fillerIdentity,
    coach,
    membershipPlan,
    reservableClassType,
    fullClassType,
    sessionBlueprints,
    timeline,
    now,
  },
) {
  const memberMembership = await ensureCanonicalMembership(tx, {
    memberId: memberIdentity.member.id,
    membershipPlanId: membershipPlan.id,
    autoRenews: true,
    now,
  })
  const fillerMembership = await ensureCanonicalMembership(tx, {
    memberId: fillerIdentity.member.id,
    membershipPlanId: membershipPlan.id,
    autoRenews: false,
    now,
  })

  const sessions = await ensureManagedSessionGroup(tx, {
    coachId: coach.id,
    reservableClassTypeId: reservableClassType.id,
    fullClassTypeId: fullClassType.id,
    sessionBlueprints,
    now,
  })

  for (const session of Object.values(sessions)) {
    await clearManagedSessionActivity(tx, session.id)
  }

  await createMembershipReservation(tx, {
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

  await tx.waitlistEntry.create({
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
    memberMembership,
    fillerMembership,
    sessions,
  }
}

async function findManagedScenarioState(
  tx,
  {
    memberIdentity,
    fillerIdentity,
    membershipPlan,
  },
) {
  const memberMembership = await findCanonicalMembership(tx, {
    memberId: memberIdentity.member.id,
    membershipPlanId: membershipPlan.id,
  })
  const fillerMembership = await findCanonicalMembership(tx, {
    memberId: fillerIdentity.member.id,
    membershipPlanId: membershipPlan.id,
  })
  const sessions = await findManagedSessionMap(tx)

  if (!memberMembership || !fillerMembership || !sessions) {
    return null
  }

  return {
    memberMembership,
    fillerMembership,
    sessions,
  }
}

async function restoreWaitlistState(
  tx,
  {
    memberIdentity,
    fillerIdentity,
    fillerMembership,
    coach,
    fullClassType,
    sessions,
    sessionBlueprints,
    timeline,
    now,
  },
) {
  sessions.fullWaitlist = await reconcileManagedSession(tx, {
    existingSession: sessions.fullWaitlist,
    blueprint: sessionBlueprints.fullWaitlist,
    classTypeId: fullClassType.id,
    coachId: coach.id,
    capacity: MANAGED_CLASS_TYPES.full.capacityDefault,
    now,
  })

  await clearManagedSessionActivity(tx, sessions.fullWaitlist.id)

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

  await tx.waitlistEntry.create({
    data: {
      memberId: memberIdentity.member.id,
      classSessionId: sessions.fullWaitlist.id,
      position: 1,
      status: 'WAITING',
      joinedAt: shiftMinutes(timeline.fullWaitlist.startsAt, -180),
    },
  })
}

async function restoreAvailableSessionState(
  tx,
  {
    coach,
    reservableClassType,
    sessions,
    sessionBlueprints,
    now,
  },
) {
  sessions.available = await reconcileManagedSession(tx, {
    existingSession: sessions.available,
    blueprint: sessionBlueprints.available,
    classTypeId: reservableClassType.id,
    coachId: coach.id,
    capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
    now,
  })

  await clearManagedSessionActivity(tx, sessions.available.id)
}

async function restoreCancelableReservationState(
  tx,
  {
    memberIdentity,
    memberMembership,
    fillerIdentity,
    coach,
    reservableClassType,
    sessions,
    sessionBlueprints,
    timeline,
    now,
  },
) {
  sessions.cancelable = await reconcileManagedSession(tx, {
    existingSession: sessions.cancelable,
    blueprint: sessionBlueprints.cancelable,
    classTypeId: reservableClassType.id,
    coachId: coach.id,
    capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
    now,
  })

  await clearManagedSessionActivity(tx, sessions.cancelable.id)

  await createMembershipReservation(tx, {
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

  await tx.waitlistEntry.create({
    data: {
      memberId: fillerIdentity.member.id,
      classSessionId: sessions.cancelable.id,
      position: 1,
      status: 'WAITING',
      joinedAt: shiftMinutes(timeline.cancelable.startsAt, -180),
    },
  })
}

async function ensureCanonicalMembership(
  tx,
  {
    memberId,
    membershipPlanId,
    autoRenews,
    now,
  },
) {
  const existingMembership = await findCanonicalMembership(tx, {
    memberId,
    membershipPlanId,
  })

  if (existingMembership) {
    return tx.memberMembership.update({
      where: {
        id: existingMembership.id,
      },
      data: {
        status: 'ACTIVE',
        startsAt: shiftDays(now, -14),
        endsAt: shiftDays(now, 45),
        autoRenews,
      },
    })
  }

  return tx.memberMembership.create({
    data: {
      memberId,
      membershipPlanId,
      status: 'ACTIVE',
      startsAt: shiftDays(now, -14),
      endsAt: shiftDays(now, 45),
      autoRenews,
    },
  })
}

async function findCanonicalMembership(tx, { memberId, membershipPlanId }) {
  return tx.memberMembership.findFirst({
    where: {
      memberId,
      membershipPlanId,
    },
    orderBy: [
      {
        status: 'asc',
      },
      {
        startsAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
  })
}

async function ensureManagedSessionGroup(
  tx,
  {
    coachId,
    reservableClassTypeId,
    fullClassTypeId,
    sessionBlueprints,
    now,
  },
) {
  const existingSessions = await tx.classSession.findMany({
    where: {
      locationLabel: {
        startsWith: MEMBER_RESERVATIONS_FLOW_PREFIX,
      },
    },
  })

  const expectedLabels = new Set(Object.values(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS))
  const labelBuckets = new Map()
  const staleSessionIds = []

  for (const session of existingSessions) {
    if (!expectedLabels.has(session.locationLabel)) {
      staleSessionIds.push(session.id)
      continue
    }

    const bucket = labelBuckets.get(session.locationLabel) ?? []
    bucket.push(session)
    labelBuckets.set(session.locationLabel, bucket)
  }

  for (const bucket of labelBuckets.values()) {
    const [, ...duplicates] = bucket

    for (const duplicate of duplicates) {
      staleSessionIds.push(duplicate.id)
    }
  }

  if (staleSessionIds.length > 0) {
    await tx.classSession.deleteMany({
      where: {
        id: {
          in: staleSessionIds,
        },
      },
    })
  }

  return {
    available: await reconcileManagedSession(tx, {
      existingSession: labelBuckets.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.available)?.[0] ?? null,
      blueprint: sessionBlueprints.available,
      classTypeId: reservableClassTypeId,
      coachId,
      capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
      now,
    }),
    cancelable: await reconcileManagedSession(tx, {
      existingSession: labelBuckets.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.cancelable)?.[0] ?? null,
      blueprint: sessionBlueprints.cancelable,
      classTypeId: reservableClassTypeId,
      coachId,
      capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
      now,
    }),
    fullWaitlist: await reconcileManagedSession(tx, {
      existingSession: labelBuckets.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.fullWaitlist)?.[0] ?? null,
      blueprint: sessionBlueprints.fullWaitlist,
      classTypeId: fullClassTypeId,
      coachId,
      capacity: MANAGED_CLASS_TYPES.full.capacityDefault,
      now,
    }),
    attended: await reconcileManagedSession(tx, {
      existingSession: labelBuckets.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.attended)?.[0] ?? null,
      blueprint: sessionBlueprints.attended,
      classTypeId: reservableClassTypeId,
      coachId,
      capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
      now,
    }),
    canceled: await reconcileManagedSession(tx, {
      existingSession: labelBuckets.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.canceled)?.[0] ?? null,
      blueprint: sessionBlueprints.canceled,
      classTypeId: reservableClassTypeId,
      coachId,
      capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
      now,
    }),
    noShow: await reconcileManagedSession(tx, {
      existingSession: labelBuckets.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.noShow)?.[0] ?? null,
      blueprint: sessionBlueprints.noShow,
      classTypeId: reservableClassTypeId,
      coachId,
      capacity: MANAGED_CLASS_TYPES.reservable.capacityDefault,
      now,
    }),
  }
}

async function findManagedSessionMap(tx) {
  const managedSessions = await tx.classSession.findMany({
    where: {
      locationLabel: {
        startsWith: MEMBER_RESERVATIONS_FLOW_PREFIX,
      },
    },
  })

  const exactMatches = new Map()

  for (const session of managedSessions) {
    if (!Object.values(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS).includes(session.locationLabel)) {
      return null
    }

    const bucket = exactMatches.get(session.locationLabel) ?? []
    bucket.push(session)
    exactMatches.set(session.locationLabel, bucket)
  }

  for (const label of Object.values(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS)) {
    const matches = exactMatches.get(label) ?? []

    if (matches.length !== 1) {
      return null
    }
  }

  return {
    available: exactMatches.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.available)[0],
    cancelable: exactMatches.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.cancelable)[0],
    fullWaitlist: exactMatches.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.fullWaitlist)[0],
    attended: exactMatches.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.attended)[0],
    canceled: exactMatches.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.canceled)[0],
    noShow: exactMatches.get(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.noShow)[0],
  }
}

async function reconcileManagedSession(
  tx,
  {
    existingSession,
    blueprint,
    classTypeId,
    coachId,
    capacity,
    now,
  },
) {
  const data = {
    classTypeId,
    coachId,
    startsAt: blueprint.startsAt,
    endsAt: blueprint.endsAt,
    capacity,
    reservedCount: blueprint.reservedCount,
    waitlistEnabled: blueprint.waitlistEnabled,
    locationLabel: blueprint.locationLabel,
    status: blueprint.status,
    publishedAt:
      blueprint.status === 'PUBLISHED'
        ? shiftMinutes(now, -30)
        : shiftMinutes(blueprint.startsAt, -120),
  }

  if (existingSession) {
    return tx.classSession.update({
      where: {
        id: existingSession.id,
      },
      data,
    })
  }

  return tx.classSession.create({
    data,
  })
}

async function clearManagedSessionActivity(tx, classSessionId) {
  await tx.waitlistEntry.deleteMany({
    where: {
      classSessionId,
    },
  })

  await tx.reservation.deleteMany({
    where: {
      classSessionId,
    },
  })
}

async function buildScenarioSummary(
  tx,
  {
    memberIdentity,
    membershipPlan,
    reservableClassType,
    fullClassType,
    sessions,
    email,
  },
) {
  const [waitlistEntry, cancelableReservation] = await Promise.all([
    tx.waitlistEntry.findFirst({
      where: {
        memberId: memberIdentity.member.id,
        classSessionId: sessions.fullWaitlist.id,
        status: 'WAITING',
      },
      orderBy: {
        joinedAt: 'asc',
      },
    }),
    tx.reservation.findFirst({
      where: {
        memberId: memberIdentity.member.id,
        classSessionId: sessions.cancelable.id,
        status: 'BOOKED',
      },
      orderBy: {
        bookedAt: 'desc',
      },
    }),
  ])

  return {
    scenario: MEMBER_RESERVATIONS_FLOW_SCENARIO,
    memberEmail: email,
    memberId: memberIdentity.member.id,
    localUserId: memberIdentity.user.id,
    planSlug: membershipPlan.slug,
    classTypeSlugs: [reservableClassType.slug, fullClassType.slug],
    waitlistEntryId: waitlistEntry?.id ?? null,
    cancelableReservationId: cancelableReservation?.id ?? null,
    sessions: Object.entries(sessions).map(([key, session]) => ({
      key,
      id: session.id,
      locationLabel: session.locationLabel,
      startsAt: session.startsAt,
    })),
  }
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
    ? await upsertManagedUserIdentity(tx, {
        existingUser,
        email,
        normalizedEmail,
        authUserId,
        now,
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
    ? await upsertManagedMemberProfile(tx, {
        existingMember,
        profile,
        now,
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
    ? await upsertLocalOnlyUserIdentity(tx, {
        existingUser,
        email,
        normalizedEmail,
        now,
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
    ? await upsertManagedMemberProfile(tx, {
        existingMember,
        profile,
        now,
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
    if (
      existingCoach.displayName === MANAGED_COACH.displayName &&
      existingCoach.firstName === MANAGED_COACH.firstName &&
      existingCoach.lastName === MANAGED_COACH.lastName &&
      existingCoach.status === 'ACTIVE'
    ) {
      return existingCoach
    }

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
  const existingPlan = await tx.membershipPlan.findUnique({
    where: {
      slug: MANAGED_PLAN.slug,
    },
  })

  if (existingPlan) {
    if (
      existingPlan.name === MANAGED_PLAN.name &&
      existingPlan.description === MANAGED_PLAN.description &&
      existingPlan.status === 'ACTIVE' &&
      existingPlan.isPublic === false &&
      existingPlan.priceAmount === 8900 &&
      existingPlan.currency === 'EUR' &&
      existingPlan.billingType === 'RECURRING' &&
      existingPlan.billingInterval === 'MONTHLY' &&
      existingPlan.bookingPolicyType === 'OPEN_MEMBERSHIP_ACCESS'
    ) {
      return existingPlan
    }

    return tx.membershipPlan.update({
      where: {
        id: existingPlan.id,
      },
      data: {
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
    })
  }

  return tx.membershipPlan.create({
    data: {
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
  const existingClassType = await tx.classType.findUnique({
    where: {
      slug: classType.slug,
    },
  })

  if (existingClassType) {
    if (
      existingClassType.name === classType.name &&
      existingClassType.description === classType.description &&
      existingClassType.category === 'E2E' &&
      existingClassType.durationMinutes === classType.durationMinutes &&
      existingClassType.capacityDefault === classType.capacityDefault &&
      existingClassType.waitlistEnabled === classType.waitlistEnabled &&
      existingClassType.isPublic === false &&
      existingClassType.status === 'ACTIVE'
    ) {
      return existingClassType
    }

    return tx.classType.update({
      where: {
        id: existingClassType.id,
      },
      data: {
        name: classType.name,
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

  return tx.classType.create({
    data: {
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
  const existingRules = await tx.classTypeEligibilityRule.findMany({
    where: {
      classTypeId: {
        in: classTypeIds,
      },
    },
    orderBy: [
      {
        classTypeId: 'asc',
      },
      {
        priority: 'asc',
      },
    ],
  })

  const canonicalRules = classTypeIds.map((classTypeId, index) => ({
    classTypeId,
    ruleType: 'MEMBERSHIP_PLAN',
    membershipPlanId,
    priority: index,
    isActive: true,
  }))

  if (
    existingRules.length === canonicalRules.length &&
    existingRules.every((rule, index) => {
      const canonicalRule = canonicalRules[index]

      return (
        rule.classTypeId === canonicalRule.classTypeId &&
        rule.ruleType === canonicalRule.ruleType &&
        rule.membershipPlanId === canonicalRule.membershipPlanId &&
        rule.priority === canonicalRule.priority &&
        rule.isActive === canonicalRule.isActive
      )
    })
  ) {
    return
  }

  await tx.classTypeEligibilityRule.deleteMany({
    where: {
      classTypeId: {
        in: classTypeIds,
      },
    },
  })

  await tx.classTypeEligibilityRule.createMany({
    data: canonicalRules,
  })
}

async function upsertManagedUserIdentity(
  tx,
  { existingUser, email, normalizedEmail, authUserId, now },
) {
  if (
    existingUser.email === email &&
    existingUser.normalizedEmail === normalizedEmail &&
    existingUser.status === 'ACTIVE' &&
    existingUser.externalAuthProvider === 'supabase' &&
    existingUser.externalAuthId === authUserId &&
    existingUser.emailVerifiedAt &&
    existingUser.lastLoginAt
  ) {
    return existingUser
  }

  return tx.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      email,
      normalizedEmail,
      status: 'ACTIVE',
      externalAuthProvider: 'supabase',
      externalAuthId: authUserId,
      emailVerifiedAt: existingUser.emailVerifiedAt ?? now,
      lastLoginAt: now,
    },
  })
}

async function upsertLocalOnlyUserIdentity(tx, { existingUser, email, normalizedEmail, now }) {
  if (
    existingUser.email === email &&
    existingUser.normalizedEmail === normalizedEmail &&
    existingUser.status === 'ACTIVE' &&
    existingUser.lastLoginAt
  ) {
    return existingUser
  }

  return tx.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      email,
      normalizedEmail,
      status: 'ACTIVE',
      emailVerifiedAt: existingUser.emailVerifiedAt ?? now,
      lastLoginAt: now,
    },
  })
}

async function upsertManagedMemberProfile(tx, { existingMember, profile, now }) {
  if (
    existingMember.firstName === profile.firstName &&
    existingMember.lastName === profile.lastName &&
    existingMember.status === 'ACTIVE'
  ) {
    return existingMember
  }

  return tx.member.update({
    where: {
      userId: existingMember.userId,
    },
    data: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      status: 'ACTIVE',
      joinedAt: existingMember.joinedAt ?? now,
    },
  })
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
      canceledByUserId: null,
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
