export const SANDBOX_FIXTURES_REQUEST_HEADER = 'x-wellstudio-sandbox-fixtures'

export const SANDBOX_FIXTURE_NAME_PREFIXES = ['E2E ', 'Admin Playground'] as const
export const SANDBOX_FIXTURE_SLUG_PREFIXES = ['e2e-', 'admin-playground-'] as const
export const SANDBOX_FIXTURE_EMAIL_PREFIX = 'e2e.'
export const SANDBOX_FIXTURE_EMAIL_DOMAIN = '@wellstudio.test'

type NamedRecord = {
  name?: string | null
  slug?: string | null
}

export function isSandboxFixturesHeaderEnabled(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized === '1' || normalized === 'true'
}

export function isSandboxFixtureQuery(query: string | null | undefined) {
  const normalized = query?.trim().toLowerCase() ?? ''
  if (!normalized) return false

  return (
    normalized.includes('e2e') ||
    normalized.includes('playground') ||
    normalized.includes(SANDBOX_FIXTURE_EMAIL_DOMAIN)
  )
}

export function shouldIncludeSandboxFixtures(input: {
  headerValue?: string | null
  query?: string | null
} = {}) {
  return isSandboxFixturesHeaderEnabled(input.headerValue) || isSandboxFixtureQuery(input.query)
}

export function isSandboxFixtureName(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''
  if (!normalized) return false

  return SANDBOX_FIXTURE_NAME_PREFIXES.some((prefix) =>
    normalized.toLowerCase().startsWith(prefix.toLowerCase()),
  )
}

export function isSandboxFixtureSlug(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (!normalized) return false

  return SANDBOX_FIXTURE_SLUG_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

export function isSandboxFixtureProduct(product: NamedRecord) {
  return isSandboxFixtureName(product.name) || isSandboxFixtureSlug(product.slug)
}

export function isSandboxFixtureEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (!normalized) return false

  return (
    normalized.startsWith(SANDBOX_FIXTURE_EMAIL_PREFIX) ||
    normalized.endsWith(SANDBOX_FIXTURE_EMAIL_DOMAIN)
  )
}

export function isSandboxFixtureMember(input: {
  email?: string | null
  firstName?: string | null
  lastName?: string | null
}) {
  return (
    isSandboxFixtureEmail(input.email) ||
    isSandboxFixtureName(input.firstName) ||
    isSandboxFixtureName(input.lastName)
  )
}

export function sandboxFixtureProductWhere() {
  return {
    OR: [
      ...SANDBOX_FIXTURE_NAME_PREFIXES.map((prefix) => ({
        name: { startsWith: prefix, mode: 'insensitive' as const },
      })),
      ...SANDBOX_FIXTURE_SLUG_PREFIXES.map((prefix) => ({
        slug: { startsWith: prefix, mode: 'insensitive' as const },
      })),
    ],
  }
}

export function sandboxFixtureCoachWhere() {
  return {
    OR: SANDBOX_FIXTURE_NAME_PREFIXES.map((prefix) => ({
      displayName: { startsWith: prefix, mode: 'insensitive' as const },
    })),
  }
}

export function sandboxFixtureMemberWhere() {
  return {
    OR: [
      {
        user: {
          email: { startsWith: SANDBOX_FIXTURE_EMAIL_PREFIX, mode: 'insensitive' as const },
        },
      },
      {
        user: {
          email: { endsWith: SANDBOX_FIXTURE_EMAIL_DOMAIN, mode: 'insensitive' as const },
        },
      },
      {
        firstName: { startsWith: 'E2E ', mode: 'insensitive' as const },
      },
      {
        lastName: { startsWith: 'E2E ', mode: 'insensitive' as const },
      },
    ],
  }
}

export function withoutSandboxFixtureProducts(includeSandboxFixtures: boolean) {
  if (includeSandboxFixtures) return {}
  return { NOT: sandboxFixtureProductWhere() }
}

export function withoutSandboxFixtureCoaches(includeSandboxFixtures: boolean) {
  if (includeSandboxFixtures) return {}
  return { NOT: sandboxFixtureCoachWhere() }
}

export function withoutSandboxFixtureMembers(includeSandboxFixtures: boolean) {
  if (includeSandboxFixtures) return {}
  return { NOT: sandboxFixtureMemberWhere() }
}

export function withoutSandboxFixtureClassTypes(includeSandboxFixtures: boolean) {
  if (includeSandboxFixtures) return {}
  return {
    classType: {
      is: {
        NOT: sandboxFixtureProductWhere(),
      },
    },
  }
}
