import { createSupabaseServerClient } from '@/modules/auth/lib/supabase-server-client'

export async function logoutCurrentSession() {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(`Supabase logout failed: ${error.message}`)
  }
}
