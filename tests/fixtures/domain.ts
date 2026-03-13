import type {
  ClassSession,
  ClassType,
  Coach,
  Member,
  MemberMembership,
  MembershipPlan,
  User,
} from '@prisma/client'

import { createFixtureId, fixedDate, withOverrides } from '@/tests/fixtures/base'

export function buildUserFixture(overrides?: Partial<User>): User {
  const id = createFixtureId('user')
  const now = fixedDate()

  const base: User = {
    id,
    email: `${id}@example.com`,
    normalizedEmail: `${id}@example.com`,
    status: 'ACTIVE',
    externalAuthProvider: 'supabase',
    externalAuthId: createFixtureId('auth'),
    emailVerifiedAt: now,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  }

  return withOverrides(base, overrides)
}

export function buildMemberFixture(overrides?: Partial<Member>): Member {
  const userId = overrides?.userId ?? createFixtureId('user')
  const now = fixedDate()

  const base: Member = {
    id: createFixtureId('member'),
    userId,
    firstName: 'Miguel',
    lastName: 'Garcia',
    phone: '+34600000000',
    birthDate: null,
    status: 'ACTIVE',
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  }

  return withOverrides(base, overrides)
}

export function buildCoachFixture(overrides?: Partial<Coach>): Coach {
  const now = fixedDate()

  const base: Coach = {
    id: createFixtureId('coach'),
    userId: null,
    displayName: 'Daniel Areces',
    firstName: 'Daniel',
    lastName: 'Areces',
    bio: null,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  }

  return withOverrides(base, overrides)
}

export function buildMembershipPlanFixture(overrides?: Partial<MembershipPlan>): MembershipPlan {
  const now = fixedDate()

  const base: MembershipPlan = {
    id: createFixtureId('membership-plan'),
    name: 'Unlimited Monthly',
    slug: createFixtureId('unlimited-monthly'),
    description: 'Unlimited monthly membership',
    billingType: 'RECURRING',
    priceAmount: 8900,
    currency: 'EUR',
    billingInterval: 'MONTH',
    bookingPolicyType: 'UNLIMITED',
    includedCredits: null,
    status: 'ACTIVE',
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  }

  return withOverrides(base, overrides)
}

export function buildMemberMembershipFixture(overrides?: Partial<MemberMembership>): MemberMembership {
  const now = fixedDate()

  const base: MemberMembership = {
    id: createFixtureId('member-membership'),
    memberId: createFixtureId('member'),
    membershipPlanId: createFixtureId('membership-plan'),
    status: 'ACTIVE',
    startsAt: now,
    endsAt: null,
    autoRenews: true,
    providerSubscriptionId: createFixtureId('sub'),
    paymentId: null,
    createdAt: now,
    updatedAt: now,
  }

  return withOverrides(base, overrides)
}

export function buildClassTypeFixture(overrides?: Partial<ClassType>): ClassType {
  const now = fixedDate()

  const base: ClassType = {
    id: createFixtureId('class-type'),
    name: 'Grupo Dinamico',
    slug: createFixtureId('grupo-dinamico'),
    description: 'Functional class',
    category: 'Functional',
    durationMinutes: 50,
    capacityDefault: 10,
    waitlistEnabled: true,
    isPublic: true,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  }

  return withOverrides(base, overrides)
}

export function buildClassSessionFixture(overrides?: Partial<ClassSession>): ClassSession {
  const startsAt = fixedDate('2026-03-13T18:00:00.000Z')
  const endsAt = fixedDate('2026-03-13T18:50:00.000Z')
  const now = fixedDate()

  const base: ClassSession = {
    id: createFixtureId('class-session'),
    classTypeId: createFixtureId('class-type'),
    coachId: null,
    startsAt,
    endsAt,
    capacity: 10,
    reservedCount: 0,
    waitlistEnabled: true,
    locationLabel: 'Main Studio',
    status: 'PUBLISHED',
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  }

  return withOverrides(base, overrides)
}
