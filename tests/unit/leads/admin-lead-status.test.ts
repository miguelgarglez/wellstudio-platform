import { beforeEach, describe, expect, it, vi } from 'vitest'

const { leadFindUniqueMock, leadUpdateMock } = vi.hoisted(() => ({
  leadFindUniqueMock: vi.fn(),
  leadUpdateMock: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    lead: {
      findUnique: leadFindUniqueMock,
      update: leadUpdateMock,
    },
  },
}))

import {
  normalizeLeadStatusTarget,
  updateAdminLeadStatus,
} from '@/modules/leads/server/admin-lead-status'

describe('admin lead status', () => {
  beforeEach(() => {
    leadFindUniqueMock.mockReset()
    leadUpdateMock.mockReset()
  })

  it('allows changing operable contact request statuses', async () => {
    leadFindUniqueMock.mockResolvedValue({
      id: 'lead-1',
      status: 'NEW',
    })
    leadUpdateMock.mockResolvedValue({ id: 'lead-1' })

    const result = await updateAdminLeadStatus({
      leadId: 'lead-1',
      status: 'CONTACTED',
    })

    expect(result).toEqual({
      success: true,
      leadId: 'lead-1',
      status: 'CONTACTED',
    })
    expect(leadUpdateMock).toHaveBeenCalledWith({
      where: {
        id: 'lead-1',
      },
      data: {
        status: 'CONTACTED',
      },
      select: {
        id: true,
      },
    })
  })

  it('rejects non-operable target statuses', async () => {
    const result = await updateAdminLeadStatus({
      leadId: 'lead-1',
      status: 'CONVERTED',
    })

    expect(result.success).toBe(false)
    expect(leadFindUniqueMock).not.toHaveBeenCalled()
    expect(leadUpdateMock).not.toHaveBeenCalled()
  })

  it('rejects leads that are already in protected statuses', async () => {
    leadFindUniqueMock.mockResolvedValue({
      id: 'lead-1',
      status: 'CONVERTED',
    })

    const result = await updateAdminLeadStatus({
      leadId: 'lead-1',
      status: 'LOST',
    })

    expect(result).toEqual({
      success: false,
      message: 'Esta solicitud pertenece a un estado que no se edita desde esta vista.',
    })
    expect(leadUpdateMock).not.toHaveBeenCalled()
  })

  it('rejects missing leads', async () => {
    leadFindUniqueMock.mockResolvedValue(null)

    const result = await updateAdminLeadStatus({
      leadId: 'missing-lead',
      status: 'LOST',
    })

    expect(result).toEqual({
      success: false,
      message: 'No encontramos esa solicitud de contacto.',
    })
  })

  it('normalizes only V1 status targets', () => {
    expect(normalizeLeadStatusTarget('NEW')).toBe('NEW')
    expect(normalizeLeadStatusTarget('CONTACTED')).toBe('CONTACTED')
    expect(normalizeLeadStatusTarget('LOST')).toBe('LOST')
    expect(normalizeLeadStatusTarget('QUALIFIED')).toBeNull()
  })
})
