import { describe, expect, it } from 'vitest'

import { getProfileNames, mapSupabaseUserStatus } from '@/modules/auth/lib/auth-user-mapper'
import { buildSupabaseUserFixture } from '@/tests/fixtures'

describe('mapSupabaseUserStatus', () => {
  it('returns ACTIVE when the email is confirmed', () => {
    const authUser = buildSupabaseUserFixture({
      email_confirmed_at: '2026-03-13T12:00:00.000Z',
    })

    expect(mapSupabaseUserStatus(authUser)).toBe('ACTIVE')
  })

  it('returns PENDING_VERIFICATION when the email is not confirmed', () => {
    const authUser = buildSupabaseUserFixture({
      email_confirmed_at: undefined,
    })

    expect(mapSupabaseUserStatus(authUser)).toBe('PENDING_VERIFICATION')
  })
})

describe('getProfileNames', () => {
  it('reads first and last name from explicit metadata', () => {
    const authUser = buildSupabaseUserFixture({
      email: 'member@example.com',
      user_metadata: {
        first_name: 'Miguel',
        last_name: 'Garcia',
      },
    })

    expect(getProfileNames(authUser)).toEqual({
      firstName: 'Miguel',
      lastName: 'Garcia',
    })
  })

  it('falls back to full name metadata when split fields are missing', () => {
    const authUser = buildSupabaseUserFixture({
      email: 'member@example.com',
      user_metadata: {
        name: 'Daniel Areces Galvez',
      },
    })

    expect(getProfileNames(authUser)).toEqual({
      firstName: 'Daniel',
      lastName: 'Areces Galvez',
    })
  })

  it('falls back to the email local part when there is no profile metadata', () => {
    const authUser = buildSupabaseUserFixture({
      email: 'member@example.com',
      user_metadata: {},
    })

    expect(getProfileNames(authUser)).toEqual({
      firstName: 'member',
      lastName: '',
    })
  })
})
