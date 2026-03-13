'use client'

import { createBrowserClient } from '@supabase/ssr'

import { getSupabaseAuthEnv } from '@/modules/auth/lib/supabase-auth-env'

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseAuthEnv()

  return createBrowserClient(url, anonKey)
}
