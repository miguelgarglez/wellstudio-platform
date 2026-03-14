import { Prisma } from '@prisma/client'
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

  try {
    return await provisionLocalIdentity(authUser.id, {
      email,
      normalizedEmail,
      status,
      firstName,
      lastName,
      phone: authUser.phone || null,
      emailVerifiedAt: authUser.email_confirmed_at ? new Date(authUser.email_confirmed_at) : null,
    })
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error
    }

    return await provisionLocalIdentity(authUser.id, {
      email,
      normalizedEmail,
      status,
      firstName,
      lastName,
      phone: authUser.phone || null,
      emailVerifiedAt: authUser.email_confirmed_at ? new Date(authUser.email_confirmed_at) : null,
    })
  }
}

type IdentityProvisionInput = {
  email: string
  normalizedEmail: string
  status: User['status']
  firstName: string
  lastName: string
  phone: string | null
  emailVerifiedAt: Date | null
}

async function provisionLocalIdentity(
  externalAuthId: string,
  input: IdentityProvisionInput,
): Promise<LocalIdentity> {
  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findFirst({
      where: {
        OR: [
          {
            externalAuthProvider: 'supabase',
            externalAuthId,
          },
          {
            normalizedEmail: input.normalizedEmail,
          },
        ],
      },
    })

    const localUser = existingUser
      ? await tx.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            email: input.email,
            normalizedEmail: input.normalizedEmail,
            status: input.status,
            externalAuthProvider: 'supabase',
            externalAuthId,
            emailVerifiedAt: input.emailVerifiedAt,
            lastLoginAt: new Date(),
          },
        })
      : await tx.user.create({
          data: {
            email: input.email,
            normalizedEmail: input.normalizedEmail,
            status: input.status,
            externalAuthProvider: 'supabase',
            externalAuthId,
            emailVerifiedAt: input.emailVerifiedAt,
            lastLoginAt: new Date(),
          },
        })

    const existingMember = await tx.member.findUnique({
      where: {
        userId: localUser.id,
      },
    })

    const member = existingMember
      ? await tx.member.update({
          where: {
            userId: localUser.id,
          },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
          },
        })
      : await tx.member.create({
          data: {
            userId: localUser.id,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
        })

    await tx.userRole.createMany({
      data: [
        {
          userId: localUser.id,
          role: 'MEMBER',
        },
      ],
      skipDuplicates: true,
    })

    const roles = await tx.userRole.findMany({
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
  })
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}
