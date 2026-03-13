import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseAuthEnv } from '@/modules/auth/lib/supabase-auth-env'

export function createSupabaseMiddlewareClient(request: NextRequest) {
  const { url, anonKey } = getSupabaseAuthEnv()

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({
          request,
        })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  return {
    supabase,
    getResponse() {
      response.headers.set('Cache-Control', 'private, no-store')
      return response
    },
  }
}

export type MiddlewareCookieToSet = {
  name: string
  value: string
  options: CookieOptions
}
