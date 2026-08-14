import { cache } from 'react'
import { Prisma } from '@prisma/client'
import type { Member, User, UserRole, UserRoleType } from '@prisma/client'
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

type IdentityLinkMode = 'auth_id' | 'email' | 'create'

export class IdentityLinkConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IdentityLinkConflictError'
  }
}

const AUTH_USER_LOOKUP_RETRY_DELAY_MS = 120

async function getSupabaseAuthUserWithRetry() {
  const { createSupabaseServerClient } = await import('@/modules/auth/lib/supabase-server-client')
  const supabase = await createSupabaseServerClient()

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await supabase.auth.getUser()
    if (data.user?.email) {
      return data.user
    }

    if (error && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, AUTH_USER_LOOKUP_RETRY_DELAY_MS))
      continue
    }

    return data.user
  }

  return null
}

const resolveAuthContextUncached = async (): Promise<AuthContext> => {
  const authUser = await getSupabaseAuthUserWithRetry()

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

export const resolveAuthContext = cache(resolveAuthContextUncached)

export const requireAuthenticatedContext = cache(async (): Promise<Extract<AuthContext, { isAuthenticated: true }>> => {
  const authContext = await resolveAuthContext()

  if (!authContext.isAuthenticated) {
    throw new Error('Authenticated user required')
  }

  return authContext
})

export function hasAnyRole(
  authContext: Extract<AuthContext, { isAuthenticated: true }>,
  allowedRoles: UserRoleType[],
) {
  const roleSet = new Set(allowedRoles)

  return authContext.roles.some((role) => roleSet.has(role.role))
}

export type AdminAccessResult =
  | { kind: 'ok'; context: Extract<AuthContext, { isAuthenticated: true }> }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden' }

export const resolveAdminAccess = cache(async (): Promise<AdminAccessResult> => {
  const authContext = await resolveAuthContext()

  if (!authContext.isAuthenticated) {
    return { kind: 'unauthenticated' }
  }

  if (!hasAnyRole(authContext, ['ADMIN', 'STAFF'])) {
    return { kind: 'forbidden' }
  }

  return { kind: 'ok', context: authContext }
})

export const requireAdminOrStaffContext = cache(async () => {
  const access = await resolveAdminAccess()
  return access.kind === 'ok' ? access.context : null
})

export async function ensureLocalUser(authUser: SupabaseUser): Promise<LocalIdentity> {
  if (!authUser.email) {
    throw new Error('Supabase user is missing an email')
  }

  const email = authUser.email
  const normalizedEmail = normalizeEmail(email)
  const status = mapSupabaseUserStatus(authUser)
  const { firstName, lastName } = getProfileNames(authUser)
  const provisionInput: IdentityProvisionInput = {
    email,
    normalizedEmail,
    status,
    firstName,
    lastName,
    phone: authUser.phone || null,
    emailVerifiedAt: authUser.email_confirmed_at ? new Date(authUser.email_confirmed_at) : null,
  }

  try {
    return await provisionLocalIdentity(authUser.id, provisionInput)
  } catch (error) {
    if (error instanceof IdentityLinkConflictError) {
      throw error
    }

    if (!isUniqueConstraintError(error)) {
      throw error
    }

    // Unique races retry once; conflict policy still applies on the second pass.
    return await provisionLocalIdentity(authUser.id, provisionInput)
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

type IdentityLinkTarget = {
  existingUser: User | null
  linkMode: IdentityLinkMode
}

async function resolveLinkTarget(
  tx: Prisma.TransactionClient,
  externalAuthId: string,
  input: IdentityProvisionInput,
): Promise<IdentityLinkTarget> {
  const byAuthId = await tx.user.findFirst({
    where: {
      externalAuthProvider: 'supabase',
      externalAuthId,
    },
  })

  if (byAuthId) {
    return { existingUser: byAuthId, linkMode: 'auth_id' }
  }

  const byEmail = await tx.user.findFirst({
    where: {
      normalizedEmail: input.normalizedEmail,
    },
  })

  if (!byEmail) {
    return { existingUser: null, linkMode: 'create' }
  }

  if (byEmail.externalAuthId && byEmail.externalAuthId !== externalAuthId) {
    throw new IdentityLinkConflictError(
      'This email is already linked to a different authentication identity',
    )
  }

  // Claim an unlinked local row only with a verified Supabase email.
  if (!input.emailVerifiedAt) {
    throw new IdentityLinkConflictError(
      'A verified email is required to link an existing local identity',
    )
  }

  return { existingUser: byEmail, linkMode: 'email' }
}

async function provisionLocalIdentity(
  externalAuthId: string,
  input: IdentityProvisionInput,
): Promise<LocalIdentity> {
  return prisma.$transaction(async (tx) => {
    const { existingUser, linkMode } = await resolveLinkTarget(tx, externalAuthId, input)

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

    // Email-only first link must not silently inherit privileged roles.
    // ADMIN/STAFF are granted by controlled tooling (e.g. sandbox admin script), never by auto-claim.
    if (linkMode === 'email') {
      await tx.userRole.deleteMany({
        where: {
          userId: localUser.id,
          role: {
            in: ['ADMIN', 'STAFF'],
          },
        },
      })
    }

    const existingMember = await tx.member.findUnique({
      where: {
        userId: localUser.id,
      },
    })

    // Auth metadata seeds a new profile, but the members domain owns it afterwards.
    const member = existingMember
      ? existingMember
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
