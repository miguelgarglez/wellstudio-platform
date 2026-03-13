import type { User as SupabaseUser } from '@supabase/supabase-js'

import { createFixtureId, fixedDate, withOverrides } from '@/tests/fixtures/base'

export function buildSupabaseUserFixture(overrides?: Partial<SupabaseUser>): SupabaseUser {
  const id = createFixtureId('supabase-user')
  const now = fixedDate().toISOString()

  const base: SupabaseUser = {
    id,
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {},
    aud: 'authenticated',
    confirmation_sent_at: now,
    recovery_sent_at: undefined,
    email_change_sent_at: undefined,
    new_email: undefined,
    invited_at: undefined,
    action_link: undefined,
    email: `${id}@example.com`,
    phone: '',
    created_at: now,
    confirmed_at: now,
    email_confirmed_at: now,
    phone_confirmed_at: undefined,
    last_sign_in_at: now,
    role: 'authenticated',
    updated_at: now,
    identities: [],
    is_anonymous: false,
    factors: undefined,
  }

  return withOverrides(base, overrides)
}
