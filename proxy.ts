import { NextResponse, type NextRequest } from 'next/server'

import { createSupabaseMiddlewareClient } from '@/modules/auth/lib/supabase-middleware-client'

const PROTECTED_PREFIXES = ['/app', '/admin']

export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createSupabaseMiddlewareClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

  if (isProtectedPath && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return getResponse()
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
}
