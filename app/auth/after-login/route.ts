import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { getSupabaseAuthEnv } from '@/modules/auth/lib/supabase-auth-env'
import { resolveAuthContext } from '@/modules/auth/server/identity'
import {
  resolveAfterLoginFailureNavigation,
  resolveAfterLoginNavigation,
} from '@/modules/auth/server/post-login'

export async function GET(request: NextRequest) {
  try {
    const authContext = await resolveAuthContext()
    return await finishAfterLogin(request, resolveAfterLoginNavigation(authContext))
  } catch (error) {
    console.error('Post-login redirect failed', error)
    return finishAfterLogin(request, resolveAfterLoginFailureNavigation(error))
  }
}

async function finishAfterLogin(
  request: NextRequest,
  navigation: ReturnType<typeof resolveAfterLoginNavigation>,
) {
  const redirectResponse = NextResponse.redirect(new URL(navigation.path, request.url))

  if (!navigation.signOut) {
    return redirectResponse
  }

  const { url, anonKey } = getSupabaseAuthEnv()
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  await supabase.auth.signOut()
  return redirectResponse
}
