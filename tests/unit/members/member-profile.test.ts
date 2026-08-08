import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, tx } = vi.hoisted(() => {
  const transaction = {
    member: { findUnique: vi.fn(), updateMany: vi.fn() },
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
  normalizeProfilePhone,
  updateMemberProfile,
  validateMemberProfileInput,
} from '@/modules/members/server/member-profile'

const expectedUpdatedAt = '2026-08-08T08:00:00.000Z'

describe('member profile mutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tx.member.findUnique.mockResolvedValue({
      id: 'member-1',
      firstName: 'María',
      lastName: 'WellStudio',
      phone: '612345678',
      birthDate: new Date('1992-06-14T00:00:00.000Z'),
      updatedAt: new Date(expectedUpdatedAt),
    })
    tx.member.updateMany.mockResolvedValue({ count: 1 })
    tx.auditLog.create.mockResolvedValue({ id: 'audit-1' })
  })

  it('normalizes supported phone notation into a canonical value', () => {
    expect(normalizeProfilePhone('+34 612 345 678')).toBe('+34612345678')
    expect(normalizeProfilePhone('(612) 345-678')).toBe('612345678')
    expect(normalizeProfilePhone('phone 612345678')).toBeNull()
  })

  it('validates and normalizes editable profile values', () => {
    const result = validateMemberProfileInput({
      firstName: '  María   José ',
      lastName: ' WellStudio  García ',
      phone: '+34 612 345 678',
      birthDate: '1992-06-14',
      expectedUpdatedAt,
    }, new Date('2026-08-08T12:00:00.000Z'))

    expect(result).toEqual({
      success: true,
      data: {
        firstName: 'María José',
        lastName: 'WellStudio García',
        phone: '+34612345678',
        birthDate: new Date('1992-06-14T00:00:00.000Z'),
        expectedUpdatedAt: new Date(expectedUpdatedAt),
      },
    })
  })

  it('returns field errors for invalid required values and a future birth date', () => {
    const result = validateMemberProfileInput({
      firstName: ' ',
      lastName: ' ',
      phone: '123',
      birthDate: '2027-01-01',
      expectedUpdatedAt,
    }, new Date('2026-08-08T12:00:00.000Z'))

    expect(result).toMatchObject({
      success: false,
      code: 'VALIDATION',
      fieldErrors: {
        firstName: expect.any(String),
        lastName: expect.any(String),
        phone: expect.any(String),
        birthDate: 'La fecha de nacimiento no puede estar en el futuro.',
      },
    })
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it.each([
    ['1899-12-31', 'La fecha de nacimiento no puede ser anterior a 1900.'],
    ['2026-02-30', 'Indica una fecha de nacimiento válida.'],
  ])('rejects unsupported birth date %s', (birthDate, message) => {
    const result = validateMemberProfileInput({
      firstName: 'María',
      lastName: 'WellStudio',
      phone: '612345678',
      birthDate,
      expectedUpdatedAt,
    }, new Date('2026-08-08T12:00:00.000Z'))

    expect(result).toMatchObject({
      success: false,
      fieldErrors: { birthDate: message },
    })
  })

  it('updates changed fields with optimistic concurrency and privacy-safe audit context', async () => {
    const result = await updateMemberProfile({
      memberId: 'member-1',
      actorUserId: 'user-1',
      firstName: 'María',
      lastName: 'Studio',
      phone: '699 123 456',
      birthDate: '',
      expectedUpdatedAt,
    })

    expect(result).toMatchObject({
      success: true,
      changed: true,
      changedFields: ['lastName', 'phone', 'birthDate'],
    })
    expect(tx.member.updateMany).toHaveBeenCalledWith({
      where: { id: 'member-1', updatedAt: new Date(expectedUpdatedAt) },
      data: {
        firstName: 'María',
        lastName: 'Studio',
        phone: '699123456',
        birthDate: null,
        updatedAt: expect.any(Date),
      },
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: 'user-1',
        actionType: 'MEMBER_PROFILE_UPDATED',
        entityType: 'Member',
        entityId: 'member-1',
        contextJson: { changedFields: ['lastName', 'phone', 'birthDate'] },
      },
    })
  })

  it('does not write or audit when normalized values did not change', async () => {
    const result = await updateMemberProfile({
      memberId: 'member-1',
      actorUserId: 'user-1',
      firstName: ' María ',
      lastName: 'WellStudio',
      phone: '612 345 678',
      birthDate: '1992-06-14',
      expectedUpdatedAt,
    })

    expect(result).toMatchObject({ success: true, changed: false, changedFields: [] })
    expect(tx.member.updateMany).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('rejects stale forms instead of overwriting a newer profile', async () => {
    tx.member.findUnique.mockResolvedValue({
      id: 'member-1',
      firstName: 'María',
      lastName: 'WellStudio',
      phone: '612345678',
      birthDate: null,
      updatedAt: new Date('2026-08-08T09:00:00.000Z'),
    })

    const result = await updateMemberProfile({
      memberId: 'member-1',
      actorUserId: 'user-1',
      firstName: 'María',
      lastName: 'Studio',
      phone: '612345678',
      birthDate: '',
      expectedUpdatedAt,
    })

    expect(result).toMatchObject({ success: false, code: 'CONFLICT' })
    expect(tx.member.updateMany).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('rejects a concurrent write that wins after the profile is read', async () => {
    tx.member.updateMany.mockResolvedValue({ count: 0 })

    const result = await updateMemberProfile({
      memberId: 'member-1',
      actorUserId: 'user-1',
      firstName: 'María',
      lastName: 'Studio',
      phone: '612345678',
      birthDate: '1992-06-14',
      expectedUpdatedAt,
    })

    expect(result).toMatchObject({ success: false, code: 'CONFLICT' })
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })
})
