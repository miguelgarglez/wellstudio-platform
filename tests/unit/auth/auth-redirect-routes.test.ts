import type { CookieOptions } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as afterLogin } from '@/app/auth/after-login/route'
import { GET as confirm } from '@/app/auth/confirm/route'

const { resolveContext, navigation, failureNavigation, createClient, signOut, verifyOtp } = vi.hoisted(() => ({
  resolveContext: vi.fn(),
  navigation: vi.fn(),
  failureNavigation: vi.fn(),
  createClient: vi.fn(),
  signOut: vi.fn(),
  verifyOtp: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient: createClient }))
vi.mock('@/modules/auth/lib/supabase-auth-env', () => ({
  getSupabaseAuthEnv: () => ({ url: 'https://auth.example', anonKey: 'test-key' }),
}))
vi.mock('@/modules/auth/server/identity', () => ({ resolveAuthContext: resolveContext }))
vi.mock('@/modules/auth/server/post-login', () => ({
  resolveAfterLoginNavigation: navigation,
  resolveAfterLoginFailureNavigation: failureNavigation,
}))

function requestFor(path: string) {
  return new NextRequest(`http://0.0.0.0:3001${path}`, {
    headers: { host: 'localhost:3001', 'x-forwarded-host': 'untrusted.invalid' },
  })
}

describe('auth route redirects behind a standalone bind address', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    resolveContext.mockResolvedValue({})
    navigation.mockReturnValue({ path: '/app', signOut: false })
    failureNavigation.mockReturnValue({ path: '/login?authError=identity_conflict', signOut: true })
    signOut.mockResolvedValue({ error: null })
    verifyOtp.mockResolvedValue({ error: null })
    createClient.mockImplementation((
      _url: string,
      _key: string,
      options: { cookies: { setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => void } },
    ) => {
      options.cookies.setAll([{ name: 'session', value: 'updated', options: { path: '/', httpOnly: true } }])
      return { auth: { signOut, verifyOtp } }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(['/app', '/admin', '/login'])('keeps post-login navigation to %s on the browser origin', async (path) => {
    navigation.mockReturnValue({ path, signOut: false })

    const response = await afterLogin(requestFor('/auth/after-login'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(path)
    expect(signOut).not.toHaveBeenCalled()
  })

  it('preserves sign-out cookies on the identity-conflict redirect', async () => {
    resolveContext.mockRejectedValue(new Error('identity conflict'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await afterLogin(requestFor('/auth/after-login'))

    expect(signOut).toHaveBeenCalledOnce()
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('/login?authError=identity_conflict')
    expect(response.cookies.get('session')?.value).toBe('updated')
  })

  it.each([
    ['/app/account?from=email#details', '/app/account?from=email#details'],
    ['//external.example', '/app'],
  ])('confirms OTP with a safe relative destination for %s and preserves cookies', async (next, expected) => {
    const params = new URLSearchParams({ token_hash: 'test-token', type: 'signup', next })
    const response = await confirm(requestFor(`/auth/confirm?${params}`))

    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'test-token', type: 'signup' })
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(expected)
    expect(response.cookies.get('session')?.value).toBe('updated')
  })

  it.each([true, false])('keeps failed verification on the browser origin (token present: %s)', async (hasToken) => {
    verifyOtp.mockResolvedValue({ error: new Error('expired') })
    const params = new URLSearchParams({ next: '/app/account', email: 'member+test@example.com' })
    if (hasToken) {
      params.set('token_hash', 'expired-token')
      params.set('type', 'signup')
    }

    const response = await confirm(requestFor(`/auth/confirm?${params}`))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      '/login?authError=verification_failed&redirectTo=%2Fapp%2Faccount&email=member%2Btest%40example.com',
    )
  })
})
