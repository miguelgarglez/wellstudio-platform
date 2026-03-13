import { describe, expect, it } from 'vitest'

import { normalizeEmail } from '@/modules/auth/lib/normalize-email'

describe('normalizeEmail', () => {
  it('trims surrounding whitespace and lowercases the email', () => {
    expect(normalizeEmail('  Miguel.Garglez@GMAIL.COM  ')).toBe('miguel.garglez@gmail.com')
  })

  it('keeps already normalized emails stable', () => {
    expect(normalizeEmail('member@wellstudio.es')).toBe('member@wellstudio.es')
  })
})
