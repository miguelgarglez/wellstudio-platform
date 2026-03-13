import type { Member, User, UserRole } from '@prisma/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

import { prisma } from '@/lib/db/prisma'
import { getProfileNames, mapSupabaseUserStatus } from '@/modules/auth/lib/auth-user-mapper'
import { normalizeEmail } from '@/modules/auth/lib/normalize-email'

export type AuthContext =
  | {
      isAuthenticated: false
      authUser: null
      localUser: null
      member: null
      roles: []
    }
  | {
      isAuthenticated: true
      authUser: SupabaseUser
      localUser: User
      member: Member | null
      roles: UserRole[]
    }

type LocalIdentity = {
  localUser: User
  member: Member | null
  roles: UserRole[]
}

export async function resolveAuthContext(): Promise<AuthContext> {
  const { createSupabaseServerClient } = await import('@/modules/auth/lib/supabase-server-client')
  const supabase = await createSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.email) {
    return {
      isAuthenticated: false,
      authUser: null,
      localUser: null,
      member: null,
      roles: [],
    }
  }

  const localIdentity = await ensureLocalUser(authUser)

  return {
    isAuthenticated: true,
    authUser,
    ...localIdentity,
  }
}

export async function requireAuthenticatedContext(): Promise<Extract<AuthContext, { isAuthenticated: true }>> {
  const authContext = await resolveAuthContext()

  if (!authContext.isAuthenticated) {
    throw new Error('Authenticated user required')
  }

  return authContext
}

export async function ensureLocalUser(authUser: SupabaseUser): Promise<LocalIdentity> {
  if (!authUser.email) {
    throw new Error('Supabase user is missing an email')
  }

  const email = authUser.email
  const normalizedEmail = normalizeEmail(email)
  const status = mapSupabaseUserStatus(authUser)
  const { firstName, lastName } = getProfileNames(authUser)

  const localUser = await prisma.user.upsert({
    where: {
      normalizedEmail,
    },
    create: {
      email,
      normalizedEmail,
      status,
      externalAuthProvider: 'supabase',
      externalAuthId: authUser.id,
      emailVerifiedAt: authUser.email_confirmed_at ? new Date(authUser.email_confirmed_at) : null,
      lastLoginAt: new Date(),
    },
    update: {
      email,
      status,
      externalAuthProvider: 'supabase',
      externalAuthId: authUser.id,
      emailVerifiedAt: authUser.email_confirmed_at ? new Date(authUser.email_confirmed_at) : null,
      lastLoginAt: new Date(),
    },
  })

  const member = await prisma.member.upsert({
    where: {
      userId: localUser.id,
    },
    create: {
      userId: localUser.id,
      firstName,
      lastName,
      phone: authUser.phone || null,
      status: 'ACTIVE',
      joinedAt: new Date(),
    },
    update: {
      firstName,
      lastName,
      phone: authUser.phone || null,
    },
  })

  await prisma.userRole.upsert({
    where: {
      userId_role: {
        userId: localUser.id,
        role: 'MEMBER',
      },
    },
    create: {
      userId: localUser.id,
      role: 'MEMBER',
    },
    update: {},
  })

  const roles = await prisma.userRole.findMany({
    where: {
      userId: localUser.id,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return {
    localUser,
    member,
    roles,
  }
}
