import { describe, expect, it } from 'vitest'

import {
  isSandboxFixtureEmail,
  isSandboxFixtureMember,
  isSandboxFixtureProduct,
  isSandboxFixtureQuery,
  shouldIncludeSandboxFixtures,
  withoutSandboxFixtureClassTypes,
  withoutSandboxFixtureMembers,
  withoutSandboxFixtureProducts,
} from '@/modules/public/server/sandbox-fixtures'

describe('sandbox fixture visibility', () => {
  it('recognizes E2E and admin playground catalog records', () => {
    expect(isSandboxFixtureProduct({ name: 'E2E Bono Checkout', slug: 'e2e-payment-checkout' })).toBe(true)
    expect(isSandboxFixtureProduct({ name: 'E2E Plan Constancia', slug: 'e2e-public-plan' })).toBe(true)
    expect(isSandboxFixtureProduct({ name: 'Admin Playground Weekly', slug: 'admin-playground-weekly' })).toBe(true)
    expect(isSandboxFixtureProduct({ name: 'Plan Constancia', slug: 'showcase-plan-constancia' })).toBe(false)
    expect(isSandboxFixtureProduct({ name: 'Bono 6 sesiones', slug: 'showcase-bono-6' })).toBe(false)
  })

  it('recognizes sandbox member emails without hiding commercial demo accounts', () => {
    expect(isSandboxFixtureEmail('e2e.member.sandbox@wellstudio.test')).toBe(true)
    expect(isSandboxFixtureEmail('e2e.showcase.laura.sandbox@wellstudio.test')).toBe(true)
    expect(isSandboxFixtureMember({ email: 'laura.mendez@wellstudio.es', firstName: 'Laura', lastName: 'Méndez' })).toBe(false)
    expect(isSandboxFixtureMember({ email: 'demo@wellstudio.es', firstName: 'Equipo', lastName: 'WellStudio' })).toBe(false)
    expect(isSandboxFixtureMember({ email: 'ana@example.com', firstName: 'E2E Attendance', lastName: 'Guest' })).toBe(true)
  })

  it('includes fixtures only for the Playwright header or an explicit sandbox search', () => {
    expect(shouldIncludeSandboxFixtures()).toBe(false)
    expect(shouldIncludeSandboxFixtures({ headerValue: '1' })).toBe(true)
    expect(shouldIncludeSandboxFixtures({ query: 'e2e.member.sandbox@wellstudio.test' })).toBe(true)
    expect(shouldIncludeSandboxFixtures({ query: 'Laura Méndez' })).toBe(false)
    expect(isSandboxFixtureQuery('playground')).toBe(true)
  })

  it('builds Prisma exclusion fragments for commercial list queries', () => {
    expect(withoutSandboxFixtureProducts(true)).toEqual({})
    expect(withoutSandboxFixtureProducts(false)).toMatchObject({
      NOT: { OR: expect.any(Array) },
    })
    expect(withoutSandboxFixtureMembers(false)).toMatchObject({
      NOT: { OR: expect.any(Array) },
    })
    expect(withoutSandboxFixtureClassTypes(false)).toMatchObject({
      classType: { is: { NOT: { OR: expect.any(Array) } } },
    })
  })
})
