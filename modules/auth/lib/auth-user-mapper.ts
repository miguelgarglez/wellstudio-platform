import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { UserStatus } from '@prisma/client'

export function mapSupabaseUserStatus(authUser: SupabaseUser): UserStatus {
  if (authUser.email_confirmed_at) {
    return 'ACTIVE'
  }

  return 'PENDING_VERIFICATION'
}

export function getProfileNames(authUser: SupabaseUser) {
  const metadata = authUser.user_metadata
  const firstName =
    metadata.first_name ||
    metadata.given_name ||
    metadata.name?.split(' ')[0] ||
    authUser.email?.split('@')[0] ||
    'Member'

  const lastName =
    metadata.last_name ||
    metadata.family_name ||
    getRemainingName(metadata.name) ||
    ''

  return {
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
  }
}

function getRemainingName(fullName?: string) {
  if (!fullName) {
    return ''
  }

  const [, ...rest] = String(fullName).trim().split(/\s+/)
  return rest.join(' ')
}
