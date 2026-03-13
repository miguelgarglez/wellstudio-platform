let fixtureCounter = 0

export function createFixtureId(prefix = 'fx') {
  fixtureCounter += 1
  return `${prefix}-${fixtureCounter}`
}

export function fixedDate(iso = '2026-03-13T12:00:00.000Z') {
  return new Date(iso)
}

export function withOverrides<T>(base: T, overrides?: Partial<T>): T {
  return {
    ...base,
    ...overrides,
  }
}
