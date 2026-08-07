import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, tx } = vi.hoisted(() => {
  const transaction = {
    classType: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    coach: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    classSession: { count: vi.fn() },
    auditLog: { create: vi.fn() },
  }
  return {
    tx: transaction,
    prismaMock: {
      $transaction: vi.fn(async (callback: (client: typeof transaction) => unknown) => callback(transaction)),
    },
  }
})

vi.mock('@/lib/db/prisma', () => ({ prisma: prismaMock }))

import {
  changeAdminCatalogStatus,
  saveAdminClassType,
  saveAdminCoach,
  slugify,
} from '@/modules/classes/server/admin-class-catalog'

const actor = { userId: 'admin-1', displayName: 'Admin E2E' }

describe('admin class catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tx.classType.findFirst.mockResolvedValue(null)
    tx.classType.findMany.mockResolvedValue([])
    tx.coach.findFirst.mockResolvedValue(null)
  })

  it('builds stable URL slugs from human names', () => {
    expect(slugify('  Movilidad y Fuerza Élite  ')).toBe('movilidad-y-fuerza-elite')
    expect(slugify('---')).toBe('clase')
  })

  it('creates a class type with a collision-safe slug and audit entry', async () => {
    tx.classType.findMany.mockResolvedValue([
      { slug: 'fuerza-funcional' },
      { slug: 'fuerza-funcional-2' },
    ])
    tx.classType.create.mockResolvedValue({ id: 'class-1' })

    const result = await saveAdminClassType({
      name: 'Fuerza funcional',
      category: 'Fuerza',
      durationMinutes: 50,
      capacityDefault: 10,
      waitlistEnabled: true,
      isPublic: true,
      actor,
    })

    expect(result).toEqual({ success: true, entityId: 'class-1', entityType: 'class-type', state: 'saved' })
    expect(tx.classType.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ slug: 'fuerza-funcional-3', status: 'ACTIVE' }),
      select: { id: true },
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actionType: 'CLASS_TYPE_CREATED', entityId: 'class-1' }),
    })
  })

  it('rejects a duplicate class type before persisting', async () => {
    tx.classType.findFirst.mockResolvedValue({ id: 'duplicate' })
    const result = await saveAdminClassType({
      name: 'Pilates',
      durationMinutes: 50,
      capacityDefault: 8,
      waitlistEnabled: true,
      isPublic: true,
      actor,
    })

    expect(result).toEqual({ success: false, field: 'name', message: 'Ya existe un tipo de clase con ese nombre.' })
    expect(tx.classType.create).not.toHaveBeenCalled()
  })

  it('creates and audits a coach profile', async () => {
    tx.coach.create.mockResolvedValue({ id: 'coach-1' })
    const result = await saveAdminCoach({ displayName: 'Marta Coach', firstName: 'Marta', actor })

    expect(result).toEqual({ success: true, entityId: 'coach-1', entityType: 'coach', state: 'saved' })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actionType: 'COACH_CREATED', entityId: 'coach-1' }),
    })
  })

  it('blocks archival while future sessions still depend on the entity', async () => {
    tx.classType.findUnique.mockResolvedValue({ id: 'class-1', name: 'Pilates', status: 'ACTIVE' })
    tx.classSession.count.mockResolvedValue(2)

    const result = await changeAdminCatalogStatus({
      entityType: 'class-type',
      entityId: 'class-1',
      action: 'archive',
      actor,
      now: new Date('2026-08-07T10:00:00.000Z'),
    })

    expect(result).toEqual({ success: false, message: 'Reasigna o cancela primero 2 sesiones futuras.' })
    expect(tx.classType.update).not.toHaveBeenCalled()
  })

  it('reactivates an archived type and records the transition', async () => {
    tx.classType.findUnique.mockResolvedValue({ id: 'class-1', name: 'Pilates', status: 'ARCHIVED' })

    const result = await changeAdminCatalogStatus({
      entityType: 'class-type',
      entityId: 'class-1',
      action: 'activate',
      actor,
    })

    expect(result).toEqual({ success: true, entityId: 'class-1', entityType: 'class-type', state: 'active' })
    expect(tx.classType.update).toHaveBeenCalledWith({ where: { id: 'class-1' }, data: { status: 'ACTIVE' } })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actionType: 'CLASS_TYPE_ACTIVE' }),
    })
  })
})
