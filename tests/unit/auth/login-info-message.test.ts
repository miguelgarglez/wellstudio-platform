import { describe, expect, it } from 'vitest'

import { resolveLoginInfoMessage } from '@/modules/auth/lib/login-info-message'

describe('resolveLoginInfoMessage', () => {
  it('explains leftover identity conflicts without technical jargon', () => {
    expect(resolveLoginInfoMessage({ authError: 'identity_conflict' })).toMatch(
      /ligado a otra cuenta/i,
    )
  })

  it('keeps confirmation and recovery copy on the existing login statuses', () => {
    expect(resolveLoginInfoMessage({ authStatus: 'confirmed' })).toMatch(/correo ya está confirmado/i)
    expect(resolveLoginInfoMessage({ authStatus: 'password_updated' })).toMatch(
      /contraseña ya está actualizada/i,
    )
    expect(resolveLoginInfoMessage({ authError: 'verification_failed' })).toMatch(
      /verificar tu enlace/i,
    )
  })
})
