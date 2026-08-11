import { describe, expect, it } from 'vitest'

import {
  isSafeInternalPath,
  resolveSafeInternalPath,
} from '@/modules/auth/lib/safe-internal-path'

describe('resolveSafeInternalPath', () => {
  it('keeps relative app paths and query strings', () => {
    expect(resolveSafeInternalPath('/app')).toBe('/app')
    expect(resolveSafeInternalPath('/app/reservations?tab=next')).toBe(
      '/app/reservations?tab=next',
    )
    expect(resolveSafeInternalPath('/admin')).toBe('/admin')
    expect(resolveSafeInternalPath('/auth/after-login')).toBe('/auth/after-login')
  })

  it('rejects absolute and protocol-relative URLs', () => {
    expect(resolveSafeInternalPath('https://evil.example/phish')).toBe(
      '/auth/after-login',
    )
    expect(resolveSafeInternalPath('http://evil.example')).toBe(
      '/auth/after-login',
    )
    expect(resolveSafeInternalPath('//evil.example')).toBe('/auth/after-login')
    expect(resolveSafeInternalPath('///evil.example')).toBe('/auth/after-login')
  })

  it('rejects backslash and encoded smuggling', () => {
    expect(resolveSafeInternalPath('/\\evil.example')).toBe('/auth/after-login')
    expect(resolveSafeInternalPath('/%2f%2fevil.example')).toBe(
      '/auth/after-login',
    )
    expect(resolveSafeInternalPath('/%5cevil.example')).toBe('/auth/after-login')
  })

  it('falls back for empty or missing values', () => {
    expect(resolveSafeInternalPath(null)).toBe('/auth/after-login')
    expect(resolveSafeInternalPath(undefined)).toBe('/auth/after-login')
    expect(resolveSafeInternalPath('')).toBe('/auth/after-login')
    expect(resolveSafeInternalPath('   ')).toBe('/auth/after-login')
  })

  it('uses a custom fallback when it is itself safe', () => {
    expect(resolveSafeInternalPath('https://evil.example', '/app')).toBe('/app')
    expect(resolveSafeInternalPath('//evil.example', '/app')).toBe('/app')
  })

  it('ignores unsafe custom fallbacks', () => {
    expect(resolveSafeInternalPath('https://evil.example', '//evil.example')).toBe(
      '/auth/after-login',
    )
  })
})

describe('isSafeInternalPath', () => {
  it('accepts only same-origin relative paths', () => {
    expect(isSafeInternalPath('/checkout/sandbox')).toBe(true)
    expect(isSafeInternalPath('checkout')).toBe(false)
    expect(isSafeInternalPath('https://wellstudio.local/app')).toBe(false)
  })
})
