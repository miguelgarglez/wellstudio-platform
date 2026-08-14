import { Prisma } from '@prisma/client'

export const SHOWCASE_VITRINA_SCENARIO = 'showcase-vitrina'
export const SHOWCASE_VITRINA_CONFIRM_MEMBER_FLAG = '--confirm-showcase-member-email'

const LOCK_ID = BigInt(950096)

const PLANS = {
  constancia: {
    name: 'Plan Constancia',
    slug: 'showcase-plan-constancia',
    description: 'Tres entrenamientos semanales con seguimiento profesional.',
    priceAmount: 8950,
    policy: { policyType: 'PERIODIC_ALLOWANCE', periodType: 'CALENDAR_WEEK', allowanceCount: 3 },
  },
  flex: {
    name: 'Plan Flex',
    slug: 'showcase-plan-flex',
    description: 'Dos sesiones semanales para combinar con tu ritmo.',
    priceAmount: 6900,
    policy: { policyType: 'PERIODIC_ALLOWANCE', periodType: 'CALENDAR_WEEK', allowanceCount: 2 },
  },
}

const CREDIT_PACK = {
  name: 'Bono 6 sesiones',
  slug: 'showcase-bono-6',
  description: 'Seis sesiones para organizar con flexibilidad.',
  creditsTotal: 6,
  priceAmount: 6500,
}

const CLASS_TYPES = {
  fuerza: {
    name: 'Fuerza Premium',
    slug: 'showcase-fuerza-premium',
    description: 'Entrenamiento de fuerza en grupos reducidos.',
    category: 'Fuerza',
    durationMinutes: 50,
    capacityDefault: 8,
  },
  dinamico: {
    name: 'Dinámico',
    slug: 'showcase-dinamico',
    description: 'Sesión cardiovascular y movimiento funcional.',
    category: 'Cardio',
    durationMinutes: 45,
    capacityDefault: 10,
  },
  movilidad: {
    name: 'Movilidad & Core',
    slug: 'showcase-movilidad-core',
    description: 'Movilidad, estabilidad y trabajo de core.',
    category: 'Movilidad',
    durationMinutes: 40,
    capacityDefault: 12,
  },
}

const COACHES = [
  { displayName: 'Laura Martínez' },
  { displayName: 'Carlos Vega' },
]

const DEMO_MEMBERS = {
  laura: {
    email: 'e2e.showcase.laura.sandbox@wellstudio.test',
    firstName: 'Laura',
    lastName: 'Méndez',
    planKey: 'constancia',
  },
  carlos: {
    email: 'e2e.showcase.carlos.sandbox@wellstudio.test',
    firstName: 'Carlos',
    lastName: 'Ruiz',
    planKey: 'flex',
  },
  ana: {
    email: 'e2e.showcase.ana.sandbox@wellstudio.test',
    firstName: 'Ana',
    lastName: 'Torres',
    planKey: null,
    creditPack: true,
  },
  pablo: {
    email: 'e2e.showcase.pablo.sandbox@wellstudio.test',
    firstName: 'Pablo',
    lastName: 'Navarro',
    planKey: 'constancia',
  },
}

export function buildShowcaseVitrinaSessionBlueprints(now = new Date()) {
  return [
    {
      key: 'fuerzaManana',
      classTypeKey: 'fuerza',
      coachIndex: 0,
      dayOffset: 1,
      hour: 7,
      minute: 30,
      capacity: 8,
      reservedCount: 5,
      locationLabel: 'Sala principal',
    },
    {
      key: 'dinamicoTarde',
      classTypeKey: 'dinamico',
      coachIndex: 1,
      dayOffset: 0,
      hour: 18,
      minute: 0,
      capacity: 10,
      reservedCount: 7,
      locationLabel: 'Sala dinámica',
    },
    {
      key: 'fuerzaTarde',
      classTypeKey: 'fuerza',
      coachIndex: 0,
      dayOffset: 1,
      hour: 19,
      minute: 15,
      capacity: 8,
      reservedCount: 3,
      locationLabel: 'Sala principal',
    },
    {
      key: 'movilidad',
      classTypeKey: 'movilidad',
      coachIndex: 1,
      dayOffset: 2,
      hour: 10,
      minute: 0,
      capacity: 12,
      reservedCount: 6,
      locationLabel: 'Sala movimiento',
    },
    {
      key: 'fuerzaMediodia',
      classTypeKey: 'fuerza',
      coachIndex: 0,
      dayOffset: 2,
      hour: 12,
      minute: 30,
      capacity: 8,
      reservedCount: 4,
      locationLabel: 'Sala principal',
    },
    {
      key: 'dinamicoManana',
      classTypeKey: 'dinamico',
      coachIndex: 1,
      dayOffset: 3,
      hour: 9,
      minute: 0,
      capacity: 10,
      reservedCount: 8,
      locationLabel: 'Sala dinámica',
    },
  ].map((blueprint) => {
    const classType = CLASS_TYPES[blueprint.classTypeKey]
    const slot = buildSlot(now, blueprint.dayOffset, blueprint.hour, blueprint.minute, classType.durationMinutes)
    return { ...blueprint, ...slot, durationMinutes: classType.durationMinutes }
  })
}

export async function ensureShowcaseVitrinaScenario({
  prisma,
  now = new Date(),
  showcaseMemberEmail = null,
}) {
  return runWithRetry(() =>
    prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_ID})`

        const plans = await ensurePlans(tx)
        const creditPack = await ensureCreditPack(tx)
        const classTypes = await ensureClassTypes(tx)
        const coaches = await ensureCoaches(tx)

        await reconcileEligibilityRules(tx, {
          membershipPlanIds: Object.values(plans).map((plan) => plan.id),
          classTypeIds: Object.values(classTypes).map((classType) => classType.id),
        })

        const sessions = await ensureSessions(tx, {
          classTypes,
          coaches,
          blueprints: buildShowcaseVitrinaSessionBlueprints(now),
          now,
        })

        await ensureDemoMembers(tx, { plans, creditPack, now })
        let showcaseMember = null

        if (showcaseMemberEmail) {
          showcaseMember = await ensureShowcaseMemberProfile(tx, {
            email: showcaseMemberEmail.trim(),
            plans,
            creditPack,
            sessions,
            now,
          })
        }

        return {
          scenario: SHOWCASE_VITRINA_SCENARIO,
          planSlugs: Object.values(plans).map((plan) => plan.slug),
          creditPackSlug: creditPack.slug,
          classTypeSlugs: Object.values(classTypes).map((classType) => classType.slug),
          sessionCount: sessions.length,
          demoMemberEmails: Object.values(DEMO_MEMBERS).map((member) => member.email),
          showcaseMemberEmail: showcaseMember?.email ?? null,
          upcomingReservationId: showcaseMember?.reservationId ?? null,
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 20_000,
        maxWait: 5_000,
      },
    ),
  )
}

async function ensurePlans(tx) {
  const plans = {}

  for (const [key, plan] of Object.entries(PLANS)) {
    const record = await tx.membershipPlan.upsert({
      where: { slug: plan.slug },
      create: {
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        status: 'ACTIVE',
        isPublic: true,
        priceAmount: plan.priceAmount,
        currency: 'EUR',
        billingType: 'RECURRING',
        billingInterval: 'MONTHLY',
        bookingPolicyType: 'PERIODIC_ALLOWANCE',
      },
      update: {
        name: plan.name,
        description: plan.description,
        status: 'ACTIVE',
        isPublic: true,
        priceAmount: plan.priceAmount,
      },
    })

    await tx.membershipBookingPolicy.upsert({
      where: { membershipPlanId: record.id },
      create: {
        membershipPlanId: record.id,
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

    plans[key] = record
  }

  return plans
}

async function ensureCreditPack(tx) {
  return tx.creditPack.upsert({
    where: { slug: CREDIT_PACK.slug },
    create: {
      name: CREDIT_PACK.name,
      slug: CREDIT_PACK.slug,
      description: CREDIT_PACK.description,
      creditsTotal: CREDIT_PACK.creditsTotal,
      priceAmount: CREDIT_PACK.priceAmount,
      currency: 'EUR',
      expiresAfterDays: 90,
      status: 'ACTIVE',
      isPublic: true,
    },
    update: {
      name: CREDIT_PACK.name,
      description: CREDIT_PACK.description,
      creditsTotal: CREDIT_PACK.creditsTotal,
      priceAmount: CREDIT_PACK.priceAmount,
      status: 'ACTIVE',
      isPublic: true,
    },
  })
}

async function ensureClassTypes(tx) {
  const classTypes = {}

  for (const [key, classType] of Object.entries(CLASS_TYPES)) {
    classTypes[key] = await tx.classType.upsert({
      where: { slug: classType.slug },
      create: {
        name: classType.name,
        slug: classType.slug,
        description: classType.description,
        category: classType.category,
        durationMinutes: classType.durationMinutes,
        capacityDefault: classType.capacityDefault,
        waitlistEnabled: true,
        isPublic: true,
        status: 'ACTIVE',
      },
      update: {
        name: classType.name,
        description: classType.description,
        category: classType.category,
        durationMinutes: classType.durationMinutes,
        capacityDefault: classType.capacityDefault,
        isPublic: true,
        status: 'ACTIVE',
      },
    })
  }

  return classTypes
}

async function ensureCoaches(tx) {
  const coaches = []

  for (const coach of COACHES) {
    const existing = await tx.coach.findFirst({
      where: { displayName: coach.displayName },
      orderBy: { createdAt: 'asc' },
    })

    coaches.push(
      existing ??
        (await tx.coach.create({
          data: { displayName: coach.displayName, status: 'ACTIVE' },
        })),
    )
  }

  return coaches
}

async function reconcileEligibilityRules(tx, { membershipPlanIds, classTypeIds }) {
  await tx.classTypeEligibilityRule.deleteMany({
    where: { classTypeId: { in: classTypeIds } },
  })

  const rules = classTypeIds.flatMap((classTypeId, classIndex) => [
    ...membershipPlanIds.map((membershipPlanId, planIndex) => ({
      classTypeId,
      ruleType: 'MEMBERSHIP_PLAN',
      membershipPlanId,
      priority: planIndex,
      isActive: true,
    })),
    {
      classTypeId,
      ruleType: 'CREDIT',
      creditCost: 1,
      priority: membershipPlanIds.length + classIndex,
      isActive: true,
    },
  ])

  await tx.classTypeEligibilityRule.createMany({ data: rules })
}

async function ensureSessions(tx, { classTypes, coaches, blueprints, now }) {
  const showcaseClassTypeIds = Object.values(classTypes).map((classType) => classType.id)

  await tx.reservation.deleteMany({
    where: { classSession: { classTypeId: { in: showcaseClassTypeIds } } },
  })
  await tx.classSession.deleteMany({
    where: { classTypeId: { in: showcaseClassTypeIds } },
  })

  const sessions = []

  for (const blueprint of blueprints) {
    const session = await tx.classSession.create({
      data: {
        classTypeId: classTypes[blueprint.classTypeKey].id,
        coachId: coaches[blueprint.coachIndex]?.id ?? coaches[0]?.id,
        startsAt: blueprint.startsAt,
        endsAt: blueprint.endsAt,
        capacity: blueprint.capacity,
        reservedCount: blueprint.reservedCount,
        waitlistEnabled: true,
        locationLabel: blueprint.locationLabel,
        status: 'PUBLISHED',
        publishedAt: shiftDays(now, -1),
      },
    })
    sessions.push({ ...session, key: blueprint.key })
  }

  return sessions
}

async function ensureDemoMembers(tx, { plans, creditPack, now }) {
  for (const profile of Object.values(DEMO_MEMBERS)) {
    const user = await ensureUser(tx, profile.email, now)
    const member = await ensureMember(tx, user.id, profile, now)

    await tx.memberMembership.updateMany({
      where: { memberId: member.id },
      data: { status: 'CANCELED' },
    })
    await tx.memberCreditAccount.updateMany({
      where: { memberId: member.id },
      data: { status: 'CANCELED' },
    })

    if (profile.planKey) {
      await tx.memberMembership.create({
        data: {
          memberId: member.id,
          membershipPlanId: plans[profile.planKey].id,
          status: 'ACTIVE',
          startsAt: shiftDays(now, -14),
          endsAt: shiftDays(now, 60),
          autoRenews: true,
        },
      })
    }

    if (profile.creditPack) {
      await tx.memberCreditAccount.create({
        data: {
          memberId: member.id,
          creditPackId: creditPack.id,
          status: 'ACTIVE',
          openedAt: shiftDays(now, -7),
          expiresAt: shiftDays(now, 83),
          ledgerEntries: {
            create: {
              entryType: 'PURCHASE',
              creditsDelta: 4,
              balanceAfter: 4,
              notes: 'Compra bono vitrina',
            },
          },
        },
      })
    }
  }
}

async function ensureShowcaseMemberProfile(tx, { email, plans, creditPack, sessions, now }) {
  const normalizedEmail = email.trim().toLowerCase()
  const user =
    (await tx.user.findUnique({ where: { normalizedEmail } })) ??
    (await tx.user.create({
      data: {
        email,
        normalizedEmail,
        status: 'ACTIVE',
        emailVerifiedAt: now,
        lastLoginAt: now,
      },
    }))

  const member =
    (await tx.member.findUnique({ where: { userId: user.id } })) ??
    (await tx.member.create({
      data: {
        userId: user.id,
        firstName: 'Miguel',
        lastName: 'García',
        status: 'ACTIVE',
        joinedAt: shiftDays(now, -90),
      },
    }))

  await tx.reservation.updateMany({
    where: { memberId: member.id, status: 'BOOKED' },
    data: { status: 'CANCELED', canceledAt: now },
  })

  await tx.memberMembership.updateMany({
    where: { memberId: member.id },
    data: { status: 'CANCELED' },
  })

  const creditAccounts = await tx.memberCreditAccount.findMany({
    where: { memberId: member.id },
    select: { id: true },
  })

  if (creditAccounts.length > 0) {
    await tx.creditLedgerEntry.deleteMany({
      where: { memberCreditAccountId: { in: creditAccounts.map((account) => account.id) } },
    })
    await tx.memberCreditAccount.updateMany({
      where: { id: { in: creditAccounts.map((account) => account.id) } },
      data: { status: 'CANCELED' },
    })
  }

  await tx.memberMembership.create({
    data: {
      memberId: member.id,
      membershipPlanId: plans.constancia.id,
      status: 'ACTIVE',
      startsAt: shiftDays(now, -21),
      endsAt: shiftDays(now, 40),
      autoRenews: true,
    },
  })

  await tx.memberCreditAccount.create({
    data: {
      memberId: member.id,
      creditPackId: creditPack.id,
      status: 'ACTIVE',
      openedAt: shiftDays(now, -30),
      expiresAt: shiftDays(now, 60),
      ledgerEntries: {
        create: {
          entryType: 'PURCHASE',
          creditsDelta: 2,
          balanceAfter: 2,
          notes: 'Bono adicional vitrina',
        },
      },
    },
  })

  const targetSession = sessions.find((session) => session.key === 'fuerzaManana') ?? sessions[0]
  let reservationId = null

  if (targetSession) {
    const reservation = await tx.reservation.create({
      data: {
        memberId: member.id,
        classSessionId: targetSession.id,
        status: 'BOOKED',
        attendanceStatus: 'PENDING',
        source: 'MEMBER_APP',
        bookedAt: now,
      },
    })
    reservationId = reservation.id

    await tx.classSession.update({
      where: { id: targetSession.id },
      data: { reservedCount: { increment: 1 } },
    })
  }

  return { email, reservationId }
}

async function ensureUser(tx, email, now) {
  const normalizedEmail = email.trim().toLowerCase()
  const existing = await tx.user.findUnique({ where: { normalizedEmail } })

  if (existing) {
    return tx.user.update({
      where: { id: existing.id },
      data: { status: 'ACTIVE', lastLoginAt: now },
    })
  }

  return tx.user.create({
    data: {
      email,
      normalizedEmail,
      status: 'ACTIVE',
      emailVerifiedAt: now,
      lastLoginAt: now,
    },
  })
}

async function ensureMember(tx, userId, profile, now) {
  const existing = await tx.member.findUnique({ where: { userId } })
  const data = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    status: 'ACTIVE',
    joinedAt: shiftDays(now, -120),
  }

  if (existing) {
    return tx.member.update({ where: { userId }, data })
  }

  return tx.member.create({ data: { userId, ...data } })
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

async function runWithRetry(run, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await run()
    } catch (error) {
      if (!isRetryable(error) || attempt === attempts) throw error
      await sleep(150 * attempt)
    }
  }

  throw new Error('Showcase vitrina transaction exhausted retries.')
}

function isRetryable(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2034'
  }

  return error instanceof Error && error.message.toLowerCase().includes('could not serialize access')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
