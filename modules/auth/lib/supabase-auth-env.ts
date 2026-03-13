type SupabaseAuthEnv = {
  url: string
  anonKey: string
}

export function getSupabaseAuthEnv(): SupabaseAuthEnv {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return {
    url,
    anonKey,
  }
}
