import { describe, expect, it } from 'vitest'

import { getProfileNames, mapSupabaseUserStatus } from '@/modules/auth/lib/auth-user-mapper'

describe('mapSupabaseUserStatus', () => {
  it('returns ACTIVE when the email is confirmed', () => {
    expect(
      mapSupabaseUserStatus({
        email_confirmed_at: '2026-03-13T12:00:00.000Z',
      } as never),
    ).toBe('ACTIVE')
  })

  it('returns PENDING_VERIFICATION when the email is not confirmed', () => {
    expect(
      mapSupabaseUserStatus({
        email_confirmed_at: null,
      } as never),
    ).toBe('PENDING_VERIFICATION')
  })
})

describe('getProfileNames', () => {
  it('reads first and last name from explicit metadata', () => {
    expect(
      getProfileNames({
        email: 'member@example.com',
        user_metadata: {
          first_name: 'Miguel',
          last_name: 'Garcia',
        },
      } as never),
    ).toEqual({
      firstName: 'Miguel',
      lastName: 'Garcia',
    })
  })

  it('falls back to full name metadata when split fields are missing', () => {
    expect(
      getProfileNames({
        email: 'member@example.com',
        user_metadata: {
          name: 'Daniel Areces Galvez',
        },
      } as never),
    ).toEqual({
      firstName: 'Daniel',
      lastName: 'Areces Galvez',
    })
  })

  it('falls back to the email local part when there is no profile metadata', () => {
    expect(
      getProfileNames({
        email: 'member@example.com',
        user_metadata: {},
      } as never),
    ).toEqual({
      firstName: 'member',
      lastName: '',
    })
  })
})
