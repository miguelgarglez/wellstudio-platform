import { prisma } from '@/lib/db/prisma'
import {
  withoutSandboxFixtureCoaches,
  withoutSandboxFixtureProducts,
} from '@/modules/public/server/sandbox-fixtures'

const OPERABLE_SESSION_STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED'] as const

export type AdminClassCatalogOverview = Awaited<ReturnType<typeof getAdminClassCatalogOverview>>

export async function getAdminClassCatalogOverview(input: {
  now?: Date
  includeSandboxFixtures?: boolean
} = {}) {
  const now = input.now ?? new Date()
  const includeSandboxFixtures = input.includeSandboxFixtures ?? false
  const [classTypes, coaches] = await Promise.all([
    prisma.classType.findMany({
      where: withoutSandboxFixtureProducts(includeSandboxFixtures),
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        durationMinutes: true,
        capacityDefault: true,
        waitlistEnabled: true,
        isPublic: true,
        status: true,
        _count: {
          select: {
            sessions: {
              where: {
                startsAt: { gt: now },
                status: { in: [...OPERABLE_SESSION_STATUSES] },
              },
            },
          },
        },
      },
    }),
    prisma.coach.findMany({
      where: withoutSandboxFixtureCoaches(includeSandboxFixtures),
      orderBy: [{ status: 'asc' }, { displayName: 'asc' }],
      select: {
        id: true,
        displayName: true,
        firstName: true,
        lastName: true,
        bio: true,
        status: true,
        _count: {
          select: {
            sessions: {
              where: {
                startsAt: { gt: now },
                status: { in: [...OPERABLE_SESSION_STATUSES] },
              },
            },
          },
        },
      },
    }),
  ])

  return {
    classTypes: classTypes.map(({ _count, ...item }) => ({
      ...item,
      futureSessionCount: _count.sessions,
    })),
    coaches: coaches.map(({ _count, ...item }) => ({
      ...item,
      futureSessionCount: _count.sessions,
    })),
    counts: {
      activeClassTypes: classTypes.filter((item) => item.status === 'ACTIVE').length,
      activeCoaches: coaches.filter((item) => item.status === 'ACTIVE').length,
    },
  }
}
