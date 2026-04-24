import { Prisma } from '@prisma/client'

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

export const ADMIN_PLAYGROUND_SCENARIO = 'admin-playground'
export const ADMIN_PLAYGROUND_PREFIX = 'Admin Playground'
export const ADMIN_PLAYGROUND_DEFAULT_ADMIN_EMAIL =
  'e2e.admin.sandbox@wellstudio.test'

export const ADMIN_PLAYGROUND_PLAN_SLUGS = {
  weekly: 'admin-playground-weekly',
  monthly: 'admin-playground-monthly',
  unlimited: 'admin-playground-unlimited',
}

export const ADMIN_PLAYGROUND_MEMBER_EMAILS = {
  weeklyActive: 'e2e.admin.playground.weekly.sandbox@wellstudio.test',
  monthlyActive: 'e2e.admin.playground.monthly.sandbox@wellstudio.test',
  unlimitedActive: 'e2e.admin.playground.unlimited.sandbox@wellstudio.test',
  pending: 'e2e.admin.playground.pending.sandbox@wellstudio.test',
  expired: 'e2e.admin.playground.expired.sandbox@wellstudio.test',
  noMembership: 'e2e.admin.playground.no-plan.sandbox@wellstudio.test',
}

export const ADMIN_PLAYGROUND_SESSION_LABELS = {
  strength: `${ADMIN_PLAYGROUND_PREFIX} · Session · Strength`,
  mobility: `${ADMIN_PLAYGROUND_PREFIX} · Session · Mobility`,
  recovery: `${ADMIN_PLAYGROUND_PREFIX} · Session · Recovery`,
  past: `${ADMIN_PLAYGROUND_PREFIX} · Session · Past access`,
}

const ADMIN_PLAYGROUND_COACH = {
  displayName: `${ADMIN_PLAYGROUND_PREFIX} Coach`,
  firstName: 'Admin',
  lastName: 'Coach',
}

const ADMIN_PLAYGROUND_CLASS_TYPES = {
  strength: {
    name: `${ADMIN_PLAYGROUND_PREFIX} Strength`,
    slug: 'admin-playground-strength',
    description: 'Operational strength session used by the admin playground.',
    durationMinutes: 50,
    capacityDefault: 10,
    waitlistEnabled: true,
  },
  mobility: {
    name: `${ADMIN_PLAYGROUND_PREFIX} Mobility`,
    slug: 'admin-playground-mobility',
    description: 'Operational mobility session used by the admin playground.',
    durationMinutes: 45,
    capacityDefault: 12,
    waitlistEnabled: true,
  },
  recovery: {
    name: `${ADMIN_PLAYGROUND_PREFIX} Recovery`,
    slug: 'admin-playground-recovery',
    description: 'Operational recovery session used by the admin playground.',
    durationMinutes: 40,
    capacityDefault: 8,
    waitlistEnabled: false,
  },
}

const ADMIN_PLAYGROUND_PLANS = {
  weekly: {
    name: 'Admin Playground Weekly',
    slug: ADMIN_PLAYGROUND_PLAN_SLUGS.weekly,
    description: 'Playground plan with a weekly booking allowance.',
    priceAmount: 7900,
    policy: {
      policyType: 'PERIODIC_ALLOWANCE',
      periodType: 'CALENDAR_WEEK',
      allowanceCount: 3,
    },
  },
  monthly: {
    name: 'Admin Playground Monthly',
    slug: ADMIN_PLAYGROUND_PLAN_SLUGS.monthly,
    description: 'Playground plan with a monthly booking allowance.',
    priceAmount: 11900,
    policy: {
      policyType: 'PERIODIC_ALLOWANCE',
      periodType: 'CALENDAR_MONTH',
      allowanceCount: 8,
    },
  },
  unlimited: {
    name: 'Admin Playground Unlimited',
    slug: ADMIN_PLAYGROUND_PLAN_SLUGS.unlimited,
    description: 'Playground plan with unlimited booking access.',
    priceAmount: 14900,
    policy: {
      policyType: 'UNLIMITED',
      periodType: null,
      allowanceCount: null,
    },
  },
}

const ADMIN_PLAYGROUND_CREDIT_PACK = {
  name: 'Admin Playground Credits',
  slug: 'admin-playground-credits',
  description: 'Playground credits used to make commercial state visible.',
  creditsTotal: 10,
  priceAmount: 4500,
}

const ADMIN_PLAYGROUND_MEMBERS = {
  weeklyActive: {
    email: ADMIN_PLAYGROUND_MEMBER_EMAILS.weeklyActive,
    firstName: 'Marta',
    lastName: 'Semanal',
    phone: '+34 600 100 001',
    birthDate: '1990-05-12',
    status: 'ACTIVE',
    membership: {
      planKey: 'weekly',
      status: 'ACTIVE',
      startsAtDayOffset: -21,
      endsAtDayOffset: 42,
      autoRenews: true,
    },
  },
  monthlyActive: {
    email: ADMIN_PLAYGROUND_MEMBER_EMAILS.monthlyActive,
    firstName: 'Leo',
    lastName: 'Mensual',
    phone: null,
    birthDate: '1988-10-02',
    status: 'ACTIVE',
    membership: {
      planKey: 'monthly',
      status: 'ACTIVE',
      startsAtDayOffset: -10,
      endsAtDayOffset: 20,
      autoRenews: false,
    },
  },
  unlimitedActive: {
    email: ADMIN_PLAYGROUND_MEMBER_EMAILS.unlimitedActive,
    firstName: 'Nora',
    lastName: 'Ilimitada',
    phone: '+34 600 100 003',
    birthDate: null,
    status: 'ACTIVE',
    membership: {
      planKey: 'unlimited',
      status: 'ACTIVE',
      startsAtDayOffset: -4,
      endsAtDayOffset: 80,
      autoRenews: true,
    },
  },
  pending: {
    email: ADMIN_PLAYGROUND_MEMBER_EMAILS.pending,
    firstName: 'Paz',
    lastName: 'Pendiente',
    phone: '+34 600 100 004',
    birthDate: '1995-01-21',
    status: 'ACTIVE',
    membership: {
      planKey: 'weekly',
      status: 'PENDING_ACTIVATION',
      startsAtDayOffset: 5,
      endsAtDayOffset: 35,
      autoRenews: false,
    },
  },
  expired: {
    email: ADMIN_PLAYGROUND_MEMBER_EMAILS.expired,
    firstName: 'Iris',
    lastName: 'Expirada',
    phone: null,
    birthDate: null,
    status: 'INACTIVE',
    membership: {
      planKey: 'monthly',
      status: 'EXPIRED',
      startsAtDayOffset: -80,
      endsAtDayOffset: -12,
      autoRenews: false,
    },
  },
  noMembership: {
    email: ADMIN_PLAYGROUND_MEMBER_EMAILS.noMembership,
    firstName: 'Alex',
    lastName: 'Sin Plan',
    phone: null,
    birthDate: '1992-07-07',
    status: 'ACTIVE',
    membership: null,
  },
}

export function buildAdminPlaygroundTimeline(now = new Date()) {
  return {
    strength: buildSlot(now, 1, 17, 30, ADMIN_PLAYGROUND_CLASS_TYPES.strength.durationMinutes),
    mobility: buildSlot(now, 2, 9, 30, ADMIN_PLAYGROUND_CLASS_TYPES.mobility.durationMinutes),
    recovery: buildSlot(now, 4, 19, 0, ADMIN_PLAYGROUND_CLASS_TYPES.recovery.durationMinutes),
    past: buildSlot(now, -8, 18, 0, ADMIN_PLAYGROUND_CLASS_TYPES.strength.durationMinutes),
  }
}

export function buildAdminPlaygroundSessionBlueprints(now = new Date()) {
  const timeline = buildAdminPlaygroundTimeline(now)

  return {
    strength: {
      ...timeline.strength,
      locationLabel: ADMIN_PLAYGROUND_SESSION_LABELS.strength,
      classTypeKey: 'strength',
      status: 'PUBLISHED',
      reservedCount: 3,
      waitlistEnabled: true,
    },
    mobility: {
      ...timeline.mobility,
      locationLabel: ADMIN_PLAYGROUND_SESSION_LABELS.mobility,
      classTypeKey: 'mobility',
      status: 'PUBLISHED',
      reservedCount: 5,
      waitlistEnabled: true,
    },
    recovery: {
      ...timeline.recovery,
      locationLabel: ADMIN_PLAYGROUND_SESSION_LABELS.recovery,
      classTypeKey: 'recovery',
      status: 'PUBLISHED',
      reservedCount: 2,
      waitlistEnabled: false,
    },
    past: {
      ...timeline.past,
      locationLabel: ADMIN_PLAYGROUND_SESSION_LABELS.past,
      classTypeKey: 'strength',
      status: 'COMPLETED',
      reservedCount: 6,
      waitlistEnabled: false,
    },
  }
}

export function buildAdminPlaygroundMemberProfiles() {
  return Object.values(ADMIN_PLAYGROUND_MEMBERS).map((member) => ({
    email: member.email,
    firstName: member.firstName,
    lastName: member.lastName,
    hasMembership: Boolean(member.membership),
    membershipStatus: member.membership?.status ?? null,
  }))
}

export async function ensureAdminPlaygroundScenario({
  prisma,
  adminEmail = ADMIN_PLAYGROUND_DEFAULT_ADMIN_EMAIL,
  now = new Date(),
}) {
  return runScenarioTransactionWithRetry(async () =>
    prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BigInt(950095)})`

      const adminUser = await ensureAdminActor(tx, {
        email: adminEmail || ADMIN_PLAYGROUND_DEFAULT_ADMIN_EMAIL,
        now,
      })
      const coach = await ensureCoach(tx)
      const plans = await ensureMembershipPlans(tx)
      const creditPack = await ensureCreditPack(tx)
      const classTypes = await ensureClassTypes(tx)

      await reconcileEligibilityRules(tx, {
        membershipPlanIds: Object.values(plans).map((plan) => plan.id),
        classTypeIds: Object.values(classTypes).map((classType) => classType.id),
      })

      const sessions = await ensureSessionGroup(tx, {
        coachId: coach.id,
        classTypes,
        sessionBlueprints: buildAdminPlaygroundSessionBlueprints(now),
        now,
      })
      const members = await ensureMembers(tx, {
        plans,
        now,
      })

      await reconcileOverrides(tx, {
        adminUserId: adminUser.id,
        members,
        sessions,
        now,
      })
      await reconcileCommercialContext(tx, {
        members,
        plans,
        creditPack,
        now,
      })

      return buildScenarioSummary({
        adminUser,
        plans,
        members,
        sessions,
      })
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15_000,
      maxWait: 5_000,
    }),
  )
}

async function ensureAdminActor(tx, { email, now }) {
  const user = await ensureLocalUser(tx, {
    email,
    status: 'ACTIVE',
    now,
  })

  await tx.userRole.createMany({
    data: [
      {
        userId: user.id,
        role: 'ADMIN',
      },
      {
        userId: user.id,
        role: 'STAFF',
      },
    ],
    skipDuplicates: true,
  })

  return user
}

async function ensureMembershipPlans(tx) {
  const plans = {}

  for (const [key, plan] of Object.entries(ADMIN_PLAYGROUND_PLANS)) {
    const membershipPlan = await tx.membershipPlan.upsert({
      where: {
        slug: plan.slug,
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        status: 'ACTIVE',
        isPublic: false,
        priceAmount: plan.priceAmount,
        currency: 'EUR',
        billingType: 'RECURRING',
        billingInterval: 'MONTHLY',
        bookingPolicyType:
          plan.policy.policyType === 'UNLIMITED'
            ? 'OPEN_MEMBERSHIP_ACCESS'
            : 'PERIODIC_ALLOWANCE',
      },
      update: {
        name: plan.name,
        description: plan.description,
        status: 'ACTIVE',
        isPublic: false,
        priceAmount: plan.priceAmount,
        currency: 'EUR',
        billingType: 'RECURRING',
        billingInterval: 'MONTHLY',
        bookingPolicyType:
          plan.policy.policyType === 'UNLIMITED'
            ? 'OPEN_MEMBERSHIP_ACCESS'
            : 'PERIODIC_ALLOWANCE',
      },
    })

    await tx.membershipBookingPolicy.upsert({
      where: {
        membershipPlanId: membershipPlan.id,
      },
      create: {
        membershipPlanId: membershipPlan.id,
        policyType: plan.policy.policyType,
        periodType: plan.policy.periodType,
        allowanceCount: plan.policy.allowanceCount,
      },
      update: {
        policyType: plan.policy.policyType,
        periodType: plan.policy.periodType,
        allowanceCount: plan.policy.allowanceCount,
      },
    })

    plans[key] = membershipPlan
  }

  return plans
}

async function ensureCreditPack(tx) {
  return tx.creditPack.upsert({
    where: {
      slug: ADMIN_PLAYGROUND_CREDIT_PACK.slug,
    },
    create: {
      ...ADMIN_PLAYGROUND_CREDIT_PACK,
      status: 'ACTIVE',
      isPublic: false,
      currency: 'EUR',
      expiresAfterDays: 90,
    },
    update: {
      name: ADMIN_PLAYGROUND_CREDIT_PACK.name,
      description: ADMIN_PLAYGROUND_CREDIT_PACK.description,
      creditsTotal: ADMIN_PLAYGROUND_CREDIT_PACK.creditsTotal,
      priceAmount: ADMIN_PLAYGROUND_CREDIT_PACK.priceAmount,
      status: 'ACTIVE',
      isPublic: false,
      currency: 'EUR',
      expiresAfterDays: 90,
    },
  })
}

async function ensureClassTypes(tx) {
  const classTypes = {}

  for (const [key, classType] of Object.entries(ADMIN_PLAYGROUND_CLASS_TYPES)) {
    classTypes[key] = await tx.classType.upsert({
      where: {
        slug: classType.slug,
      },
      create: {
        ...classType,
        category: 'ADMIN_PLAYGROUND',
        isPublic: false,
        status: 'ACTIVE',
      },
      update: {
        name: classType.name,
        description: classType.description,
        category: 'ADMIN_PLAYGROUND',
        durationMinutes: classType.durationMinutes,
        capacityDefault: classType.capacityDefault,
        waitlistEnabled: classType.waitlistEnabled,
        isPublic: false,
        status: 'ACTIVE',
      },
    })
  }

  return classTypes
}

async function ensureCoach(tx) {
  const existingCoach = await tx.coach.findFirst({
    where: {
      displayName: ADMIN_PLAYGROUND_COACH.displayName,
    },
  })

  if (existingCoach) {
    return tx.coach.update({
      where: {
        id: existingCoach.id,
      },
      data: {
        ...ADMIN_PLAYGROUND_COACH,
        status: 'ACTIVE',
      },
    })
  }

  return tx.coach.create({
    data: {
      ...ADMIN_PLAYGROUND_COACH,
      status: 'ACTIVE',
    },
  })
}

async function reconcileEligibilityRules(tx, { membershipPlanIds, classTypeIds }) {
  await tx.classTypeEligibilityRule.deleteMany({
    where: {
      classTypeId: {
        in: classTypeIds,
      },
    },
  })

  await tx.classTypeEligibilityRule.createMany({
    data: classTypeIds.flatMap((classTypeId) =>
      membershipPlanIds.map((membershipPlanId, index) => ({
        classTypeId,
        ruleType: 'MEMBERSHIP_PLAN',
        membershipPlanId,
        priority: index,
        isActive: true,
      })),
    ),
  })
}

async function ensureSessionGroup(tx, { coachId, classTypes, sessionBlueprints, now }) {
  const existingSessions = await tx.classSession.findMany({
    where: {
      locationLabel: {
        startsWith: `${ADMIN_PLAYGROUND_PREFIX} · Session`,
      },
    },
  })
  const expectedLabels = new Set(Object.values(ADMIN_PLAYGROUND_SESSION_LABELS))
  const buckets = new Map()
  const staleSessionIds = []

  for (const session of existingSessions) {
    if (!expectedLabels.has(session.locationLabel)) {
      staleSessionIds.push(session.id)
      continue
    }

    const bucket = buckets.get(session.locationLabel) ?? []
    bucket.push(session)
    buckets.set(session.locationLabel, bucket)
  }

  for (const bucket of buckets.values()) {
    const [, ...duplicates] = bucket
    staleSessionIds.push(...duplicates.map((session) => session.id))
  }

  for (const sessionId of staleSessionIds) {
    await clearSessionActivity(tx, sessionId)
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

  const sessions = {}

  for (const [key, blueprint] of Object.entries(sessionBlueprints)) {
    const existingSession = buckets.get(blueprint.locationLabel)?.[0] ?? null
    const classType = classTypes[blueprint.classTypeKey]

    sessions[key] = await reconcileSession(tx, {
      existingSession,
      blueprint,
      classType,
      coachId,
      now,
    })
  }

  return sessions
}

async function reconcileSession(
  tx,
  {
    existingSession,
    blueprint,
    classType,
    coachId,
    now,
  },
) {
  const data = {
    classTypeId: classType.id,
    coachId,
    startsAt: blueprint.startsAt,
    endsAt: blueprint.endsAt,
    capacity: classType.capacityDefault,
    reservedCount: blueprint.reservedCount,
    waitlistEnabled: blueprint.waitlistEnabled,
    locationLabel: blueprint.locationLabel,
    status: blueprint.status,
    publishedAt:
      blueprint.status === 'PUBLISHED'
        ? shiftMinutes(now, -45)
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

async function clearSessionActivity(tx, classSessionId) {
  await tx.memberMembershipBookingOverride.deleteMany({
    where: {
      classSessionId,
    },
  })
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

async function ensureMembers(tx, { plans, now }) {
  const members = {}

  for (const [key, profile] of Object.entries(ADMIN_PLAYGROUND_MEMBERS)) {
    const user = await ensureLocalUser(tx, {
      email: profile.email,
      status: 'ACTIVE',
      now,
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

    const member = await ensureMemberProfile(tx, {
      userId: user.id,
      profile,
      now,
    })
    const membership = profile.membership
      ? await ensureSingleMembership(tx, {
          memberId: member.id,
          plan: plans[profile.membership.planKey],
          membership: profile.membership,
          now,
        })
      : null

    members[key] = {
      user,
      member,
      membership,
      profile,
    }
  }

  return members
}

async function ensureLocalUser(tx, { email, status, now }) {
  const normalizedEmail = normalizeEmail(email)
  const existingUser = await tx.user.findUnique({
    where: {
      normalizedEmail,
    },
  })

  if (existingUser) {
    return tx.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        email,
        normalizedEmail,
        status,
        emailVerifiedAt: existingUser.emailVerifiedAt ?? now,
        lastLoginAt: now,
      },
    })
  }

  return tx.user.create({
    data: {
      email,
      normalizedEmail,
      status,
      emailVerifiedAt: now,
      lastLoginAt: now,
    },
  })
}

async function ensureMemberProfile(tx, { userId, profile, now }) {
  const birthDate = profile.birthDate ? new Date(`${profile.birthDate}T00:00:00.000Z`) : null
  const existingMember = await tx.member.findUnique({
    where: {
      userId,
    },
  })
  const data = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    birthDate,
    status: profile.status,
    joinedAt: shiftDays(now, -120),
  }

  if (existingMember) {
    return tx.member.update({
      where: {
        userId,
      },
      data,
    })
  }

  return tx.member.create({
    data: {
      userId,
      ...data,
    },
  })
}

async function ensureSingleMembership(tx, { memberId, plan, membership, now }) {
  const existingMemberships = await tx.memberMembership.findMany({
    where: {
      memberId,
      membershipPlanId: plan.id,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
  const [existingMembership, ...duplicates] = existingMemberships
  const data = {
    memberId,
    membershipPlanId: plan.id,
    status: membership.status,
    startsAt: shiftDays(now, membership.startsAtDayOffset),
    endsAt: shiftDays(now, membership.endsAtDayOffset),
    autoRenews: membership.autoRenews,
  }

  for (const duplicate of duplicates) {
    await tx.memberMembershipBookingOverride.deleteMany({
      where: {
        memberMembershipId: duplicate.id,
      },
    })
  }

  if (duplicates.length > 0) {
    await tx.memberMembership.deleteMany({
      where: {
        id: {
          in: duplicates.map((duplicate) => duplicate.id),
        },
      },
    })
  }

  if (existingMembership) {
    return tx.memberMembership.update({
      where: {
        id: existingMembership.id,
      },
      data,
    })
  }

  return tx.memberMembership.create({
    data,
  })
}

async function reconcileOverrides(tx, { adminUserId, members, sessions, now }) {
  const managedMembershipIds = Object.values(members)
    .map((entry) => entry.membership?.id)
    .filter(Boolean)

  if (managedMembershipIds.length > 0) {
    await tx.memberMembershipBookingOverride.deleteMany({
      where: {
        memberMembershipId: {
          in: managedMembershipIds,
        },
      },
    })
  }

  await tx.memberMembershipBookingOverride.createMany({
    data: [
      {
        memberMembershipId: members.weeklyActive.membership.id,
        overrideType: 'EXTRA_ALLOWANCE',
        extraBookings: 2,
        startsAt: startOfCurrentWeek(now),
        expiresAt: endOfCurrentWeek(now),
        reason: 'Playground: compensación operativa por incidencia semanal.',
        grantedByUserId: adminUserId,
      },
      {
        memberMembershipId: members.weeklyActive.membership.id,
        overrideType: 'SESSION_ACCESS',
        classSessionId: sessions.strength.id,
        startsAt: shiftHours(now, -1),
        expiresAt: shiftMinutes(sessions.strength.startsAt, 30),
        reason: 'Playground: acceso puntual a sesión futura publicada.',
        grantedByUserId: adminUserId,
      },
      {
        memberMembershipId: members.weeklyActive.membership.id,
        overrideType: 'EXTRA_ALLOWANCE',
        extraBookings: 1,
        startsAt: shiftDays(now, -10),
        expiresAt: shiftDays(now, 10),
        reason: 'Playground: override revocado visible en historial.',
        grantedByUserId: adminUserId,
        revokedAt: shiftDays(now, -2),
        revokedByUserId: adminUserId,
      },
      {
        memberMembershipId: members.monthlyActive.membership.id,
        overrideType: 'EXTRA_ALLOWANCE',
        extraBookings: 3,
        startsAt: shiftDays(now, -40),
        expiresAt: shiftDays(now, -20),
        reason: 'Playground: allowance ya expirado para validar estado histórico.',
        grantedByUserId: adminUserId,
      },
      {
        memberMembershipId: members.unlimitedActive.membership.id,
        overrideType: 'SESSION_ACCESS',
        classSessionId: sessions.mobility.id,
        startsAt: shiftHours(now, -2),
        expiresAt: shiftMinutes(sessions.mobility.startsAt, 30),
        reason: 'Playground: session access sobre membership ilimitada.',
        grantedByUserId: adminUserId,
      },
    ],
  })
}

async function reconcileCommercialContext(tx, { members, plans, creditPack, now }) {
  const memberEntries = Object.values(members)
  const memberIds = memberEntries.map((entry) => entry.member.id)

  await deleteManagedPayments(tx, { memberIds })

  const weeklyPayment = await createPayment(tx, {
    memberId: members.weeklyActive.member.id,
    providerPaymentIntentId: 'admin-playground-weekly-membership',
    status: 'SUCCEEDED',
    paymentType: 'MEMBERSHIP_PURCHASE',
    amount: plans.weekly.priceAmount,
    capturedAt: shiftDays(now, -14),
    item: {
      itemType: 'MEMBERSHIP_PLAN',
      referenceId: plans.weekly.id,
      unitAmount: plans.weekly.priceAmount,
      totalAmount: plans.weekly.priceAmount,
    },
  })
  const creditPayment = await createPayment(tx, {
    memberId: members.weeklyActive.member.id,
    providerPaymentIntentId: 'admin-playground-weekly-credits',
    status: 'SUCCEEDED',
    paymentType: 'CREDIT_PACK_PURCHASE',
    amount: creditPack.priceAmount,
    capturedAt: shiftDays(now, -8),
    item: {
      itemType: 'CREDIT_PACK',
      referenceId: creditPack.id,
      unitAmount: creditPack.priceAmount,
      totalAmount: creditPack.priceAmount,
    },
  })
  await createPayment(tx, {
    memberId: members.monthlyActive.member.id,
    providerPaymentIntentId: 'admin-playground-monthly-failed',
    status: 'FAILED',
    paymentType: 'MEMBERSHIP_PURCHASE',
    amount: plans.monthly.priceAmount,
    failedAt: shiftDays(now, -1),
    failureReason: 'Playground: tarjeta requiere revisión manual.',
    item: {
      itemType: 'MEMBERSHIP_PLAN',
      referenceId: plans.monthly.id,
      unitAmount: plans.monthly.priceAmount,
      totalAmount: plans.monthly.priceAmount,
    },
  })

  await tx.memberMembership.update({
    where: {
      id: members.weeklyActive.membership.id,
    },
    data: {
      paymentId: weeklyPayment.id,
    },
  })

  const creditAccount = await ensureCreditAccount(tx, {
    memberId: members.weeklyActive.member.id,
    creditPackId: creditPack.id,
    paymentId: creditPayment.id,
    now,
  })

  await tx.creditLedgerEntry.deleteMany({
    where: {
      memberCreditAccountId: creditAccount.id,
    },
  })
  await tx.creditLedgerEntry.createMany({
    data: [
      {
        memberCreditAccountId: creditAccount.id,
        entryType: 'PURCHASE',
        creditsDelta: 10,
        balanceAfter: 10,
        referenceType: 'payment',
        referenceId: creditPayment.id,
        notes: 'Playground credit purchase.',
        createdAt: shiftDays(now, -8),
      },
      {
        memberCreditAccountId: creditAccount.id,
        entryType: 'RESERVATION_CONSUME',
        creditsDelta: -4,
        balanceAfter: 6,
        referenceType: 'playground',
        referenceId: ADMIN_PLAYGROUND_SCENARIO,
        notes: 'Playground consumption to make a non-full balance visible.',
        createdAt: shiftDays(now, -4),
      },
    ],
  })

  await ensureDefaultCard(tx, {
    memberId: members.weeklyActive.member.id,
    providerPaymentMethodId: 'admin-playground-card-weekly',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: now.getFullYear() + 2,
  })
  await ensureDefaultCard(tx, {
    memberId: members.unlimitedActive.member.id,
    providerPaymentMethodId: 'admin-playground-card-unlimited',
    brand: 'mastercard',
    last4: '4444',
    expMonth: 8,
    expYear: now.getFullYear() + 3,
  })
}

async function deleteManagedPayments(tx, { memberIds }) {
  const payments = await tx.payment.findMany({
    where: {
      memberId: {
        in: memberIds,
      },
      provider: 'wellstudio-sandbox',
      providerPaymentIntentId: {
        startsWith: 'admin-playground-',
      },
    },
    select: {
      id: true,
    },
  })
  const paymentIds = payments.map((payment) => payment.id)

  if (paymentIds.length === 0) {
    return
  }

  await tx.memberMembership.updateMany({
    where: {
      paymentId: {
        in: paymentIds,
      },
    },
    data: {
      paymentId: null,
    },
  })
  await tx.memberCreditAccount.updateMany({
    where: {
      paymentId: {
        in: paymentIds,
      },
    },
    data: {
      paymentId: null,
    },
  })
  await tx.paymentItem.deleteMany({
    where: {
      paymentId: {
        in: paymentIds,
      },
    },
  })
  await tx.paymentEvent.deleteMany({
    where: {
      paymentId: {
        in: paymentIds,
      },
    },
  })
  await tx.payment.deleteMany({
    where: {
      id: {
        in: paymentIds,
      },
    },
  })
}

async function createPayment(
  tx,
  {
    memberId,
    providerPaymentIntentId,
    status,
    paymentType,
    amount,
    capturedAt = null,
    failedAt = null,
    failureReason = null,
    item,
  },
) {
  return tx.payment.create({
    data: {
      memberId,
      provider: 'wellstudio-sandbox',
      providerPaymentIntentId,
      status,
      paymentType,
      amount,
      currency: 'EUR',
      capturedAt,
      failedAt,
      failureReason,
      items: {
        create: {
          ...item,
          quantity: 1,
        },
      },
    },
  })
}

async function ensureCreditAccount(tx, { memberId, creditPackId, paymentId, now }) {
  const existingAccounts = await tx.memberCreditAccount.findMany({
    where: {
      memberId,
      creditPackId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
  const [existingAccount, ...duplicates] = existingAccounts

  for (const duplicate of duplicates) {
    await tx.creditLedgerEntry.deleteMany({
      where: {
        memberCreditAccountId: duplicate.id,
      },
    })
  }

  if (duplicates.length > 0) {
    await tx.memberCreditAccount.deleteMany({
      where: {
        id: {
          in: duplicates.map((duplicate) => duplicate.id),
        },
      },
    })
  }

  const data = {
    memberId,
    creditPackId,
    status: 'ACTIVE',
    openedAt: shiftDays(now, -8),
    expiresAt: shiftDays(now, 82),
    paymentId,
  }

  if (existingAccount) {
    return tx.memberCreditAccount.update({
      where: {
        id: existingAccount.id,
      },
      data,
    })
  }

  return tx.memberCreditAccount.create({
    data,
  })
}

async function ensureDefaultCard(
  tx,
  {
    memberId,
    providerPaymentMethodId,
    brand,
    last4,
    expMonth,
    expYear,
  },
) {
  await tx.card.updateMany({
    where: {
      memberId,
      provider: 'wellstudio-sandbox',
    },
    data: {
      isDefault: false,
    },
  })

  return tx.card.upsert({
    where: {
      provider_providerPaymentMethodId: {
        provider: 'wellstudio-sandbox',
        providerPaymentMethodId,
      },
    },
    create: {
      memberId,
      provider: 'wellstudio-sandbox',
      providerCustomerId: `cus_${providerPaymentMethodId}`,
      providerPaymentMethodId,
      brand,
      last4,
      expMonth,
      expYear,
      isDefault: true,
      status: 'ACTIVE',
    },
    update: {
      memberId,
      providerCustomerId: `cus_${providerPaymentMethodId}`,
      brand,
      last4,
      expMonth,
      expYear,
      isDefault: true,
      status: 'ACTIVE',
    },
  })
}

function buildScenarioSummary({ adminUser, plans, members, sessions }) {
  return {
    scenario: ADMIN_PLAYGROUND_SCENARIO,
    adminEmail: adminUser.email,
    planSlugs: Object.values(plans).map((plan) => plan.slug),
    memberEmails: Object.values(members).map((entry) => entry.user.email),
    activeMembershipCount: Object.values(members).filter(
      (entry) => entry.membership?.status === 'ACTIVE',
    ).length,
    sessionLabels: Object.values(sessions).map((session) => session.locationLabel),
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

function startOfCurrentWeek(now) {
  const value = new Date(now)
  const day = value.getDay() || 7
  value.setDate(value.getDate() - day + 1)
  value.setHours(0, 0, 0, 0)
  return value
}

function endOfCurrentWeek(now) {
  const value = startOfCurrentWeek(now)
  value.setDate(value.getDate() + 7)
  value.setMilliseconds(-1)
  return value
}

function shiftDays(date, dayOffset) {
  const value = new Date(date)
  value.setDate(value.getDate() + dayOffset)
  return value
}

function shiftHours(date, hourOffset) {
  return new Date(date.getTime() + hourOffset * 60 * 60 * 1000)
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
