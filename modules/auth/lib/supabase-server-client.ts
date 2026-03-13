import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

import { getSupabaseAuthEnv } from '@/modules/auth/lib/supabase-auth-env'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseAuthEnv()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components can be read-only; middleware owns session refresh.
        }
      },
    },
  })
}
