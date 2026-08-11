import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'

import { resolveSafeInternalPath } from '@/modules/auth/lib/safe-internal-path'
import { getSupabaseAuthEnv } from '@/modules/auth/lib/supabase-auth-env'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const email = searchParams.get('email')
  const next = resolveSafeInternalPath(searchParams.get('next'), '/app')

  if (tokenHash && type) {
    const successRedirect = NextResponse.redirect(new URL(next, origin))
    const { url, anonKey } = getSupabaseAuthEnv()
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            successRedirect.cookies.set(name, value, options)
          })
        },
      },
    })
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return successRedirect
    }
  }

  const loginUrl = new URL('/login', origin)
  loginUrl.searchParams.set('authError', 'verification_failed')
  loginUrl.searchParams.set('redirectTo', next)

  if (email) {
    loginUrl.searchParams.set('email', email)
  }

  return NextResponse.redirect(loginUrl)
}
