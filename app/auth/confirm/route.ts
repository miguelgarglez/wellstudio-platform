import { type NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/modules/auth/lib/supabase-server-client'

function resolveSafeNextPath(next: string | null) {
  if (!next || !next.startsWith('/')) {
    return '/app'
  }

  return next
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = resolveSafeNextPath(searchParams.get('next'))

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  const loginUrl = new URL('/login', origin)
  loginUrl.searchParams.set('authError', 'verification_failed')

  return NextResponse.redirect(loginUrl)
}
