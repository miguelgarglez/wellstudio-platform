import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({ prisma: {} }))

import { convertAdminLeadToMember } from '@/modules/leads/server/admin-lead-conversion'

const actor = { userId: 'admin-1', displayName: 'Ana Admin' }

describe('admin lead conversion', () => {
  const repository = {
    findLead: vi.fn(),
    memberExists: vi.fn(),
    convert: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    repository.memberExists.mockResolvedValue(true)
    repository.convert.mockResolvedValue(true)
  })

  it('links an interested lead to an existing member with normalized context', async () => {
    repository.findLead.mockResolvedValue({ id: 'lead-1', status: 'QUALIFIED', convertedMemberId: null })

    const result = await convertAdminLeadToMember(
      { leadId: ' lead-1 ', memberId: ' member-1 ', note: ' Alta confirmada ', actor },
      repository,
    )

    expect(result).toEqual({ success: true, leadId: 'lead-1', memberId: 'member-1' })
    expect(repository.convert).toHaveBeenCalledWith({
      leadId: 'lead-1',
      memberId: 'member-1',
      fromStatus: 'QUALIFIED',
      note: 'Alta confirmada',
      actor,
    })
  })

  it('requires an existing member and an interested lead', async () => {
    repository.findLead.mockResolvedValue({ id: 'lead-1', status: 'CONTACTED', convertedMemberId: null })
    await expect(convertAdminLeadToMember({ leadId: 'lead-1', memberId: 'member-1', actor }, repository))
      .resolves.toMatchObject({ success: false, message: expect.stringContaining('interesada') })

    repository.findLead.mockResolvedValue({ id: 'lead-1', status: 'QUALIFIED', convertedMemberId: null })
    repository.memberExists.mockResolvedValue(false)
    await expect(convertAdminLeadToMember({ leadId: 'lead-1', memberId: 'missing', actor }, repository))
      .resolves.toMatchObject({ success: false, message: expect.stringContaining('socio') })
  })

  it('protects completed and concurrent conversions', async () => {
    repository.findLead.mockResolvedValue({ id: 'lead-1', status: 'CONVERTED', convertedMemberId: 'member-1' })
    await expect(convertAdminLeadToMember({ leadId: 'lead-1', memberId: 'member-2', actor }, repository))
      .resolves.toMatchObject({ success: false, message: expect.stringContaining('ya está') })

    repository.findLead.mockResolvedValue({ id: 'lead-1', status: 'QUALIFIED', convertedMemberId: null })
    repository.convert.mockResolvedValue(false)
    await expect(convertAdminLeadToMember({ leadId: 'lead-1', memberId: 'member-2', actor }, repository))
      .resolves.toMatchObject({ success: false, message: expect.stringContaining('cambió mientras') })
  })
})
