import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({ prisma: {} }))

import { addAdminMemberNote } from '@/modules/members/server/admin-member-notes'

const actor = { userId: 'admin-1', displayName: 'Ana Admin' }

describe('admin member notes', () => {
  const repository = { memberExists: vi.fn(), append: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    repository.memberExists.mockResolvedValue(true)
  })

  it('appends normalized internal context with its actor', async () => {
    const result = await addAdminMemberNote(
      { memberId: ' member-1 ', body: '  Prefiere llamadas por la tarde  ', actor },
      repository,
    )

    expect(result).toEqual({ success: true, memberId: 'member-1' })
    expect(repository.append).toHaveBeenCalledWith({
      memberId: 'member-1',
      body: 'Prefiere llamadas por la tarde',
      actor,
    })
  })

  it('rejects empty, oversized and orphan notes', async () => {
    await expect(addAdminMemberNote({ memberId: 'member-1', body: ' ', actor }, repository))
      .resolves.toMatchObject({ success: false, field: 'body' })
    await expect(addAdminMemberNote({ memberId: 'member-1', body: 'a'.repeat(1001), actor }, repository))
      .resolves.toMatchObject({ success: false, field: 'body' })

    repository.memberExists.mockResolvedValue(false)
    await expect(addAdminMemberNote({ memberId: 'missing', body: 'Contexto', actor }, repository))
      .resolves.toMatchObject({ success: false, message: expect.stringContaining('socio') })
    expect(repository.append).not.toHaveBeenCalled()
  })
})
