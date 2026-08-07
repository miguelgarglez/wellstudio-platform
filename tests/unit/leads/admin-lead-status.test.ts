import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {},
}))

import {
  addAdminLeadNote,
  canTransitionLeadStatus,
  getAllowedLeadStatusTransitions,
  normalizeLeadStatusTarget,
  updateAdminLeadStatus,
} from '@/modules/leads/server/admin-lead-operations'

const actor = {
  userId: 'admin-1',
  displayName: 'Ana Admin',
}

describe('admin lead operations', () => {
  const repository = {
    findLead: vi.fn(),
    appendNote: vi.fn(),
    changeStatus: vi.fn(),
  }

  beforeEach(() => {
    repository.findLead.mockReset()
    repository.appendNote.mockReset()
    repository.changeStatus.mockReset()
  })

  it('appends a normalized note with its actor snapshot', async () => {
    repository.findLead.mockResolvedValue({ id: 'lead-1', status: 'NEW' })

    const result = await addAdminLeadNote(
      { leadId: 'lead-1', note: '  Llamar el viernes  ', actor },
      repository,
    )

    expect(result).toEqual({ success: true, leadId: 'lead-1' })
    expect(repository.appendNote).toHaveBeenCalledWith({
      leadId: 'lead-1',
      note: 'Llamar el viernes',
      actor,
    })
  })

  it('rejects empty and oversized notes', async () => {
    await expect(addAdminLeadNote(
      { leadId: 'lead-1', note: '  ', actor },
      repository,
    )).resolves.toMatchObject({ success: false, field: 'note' })

    await expect(addAdminLeadNote(
      { leadId: 'lead-1', note: 'a'.repeat(1001), actor },
      repository,
    )).resolves.toMatchObject({ success: false, field: 'note' })

    expect(repository.findLead).not.toHaveBeenCalled()
  })

  it('persists status and note as one auditable operation', async () => {
    repository.findLead.mockResolvedValue({ id: 'lead-1', status: 'NEW' })
    repository.changeStatus.mockResolvedValue(true)

    const result = await updateAdminLeadStatus(
      {
        leadId: 'lead-1',
        status: 'QUALIFIED',
        note: 'Quiere probar una clase',
        actor,
      },
      repository,
    )

    expect(result).toEqual({ success: true, leadId: 'lead-1', status: 'QUALIFIED' })
    expect(repository.changeStatus).toHaveBeenCalledWith({
      leadId: 'lead-1',
      fromStatus: 'NEW',
      toStatus: 'QUALIFIED',
      note: 'Quiere probar una clase',
      actor,
    })
  })

  it('requires a reason when a lead is marked lost', async () => {
    const result = await updateAdminLeadStatus(
      { leadId: 'lead-1', status: 'LOST', note: '', actor },
      repository,
    )

    expect(result).toMatchObject({ success: false, field: 'note' })
    expect(repository.findLead).not.toHaveBeenCalled()
  })

  it('enforces the transition map and protects converted leads', async () => {
    expect(getAllowedLeadStatusTransitions('NEW')).toEqual(['CONTACTED', 'QUALIFIED', 'LOST'])
    expect(getAllowedLeadStatusTransitions('LOST')).toEqual(['NEW'])
    expect(canTransitionLeadStatus('QUALIFIED', 'NEW')).toBe(false)

    repository.findLead.mockResolvedValue({ id: 'lead-1', status: 'CONVERTED' })
    const result = await updateAdminLeadStatus(
      { leadId: 'lead-1', status: 'LOST', note: 'No procede', actor },
      repository,
    )

    expect(result).toMatchObject({ success: false })
    expect(repository.changeStatus).not.toHaveBeenCalled()
  })

  it('reports an optimistic concurrency conflict instead of overwriting', async () => {
    repository.findLead.mockResolvedValue({ id: 'lead-1', status: 'NEW' })
    repository.changeStatus.mockResolvedValue(false)

    const result = await updateAdminLeadStatus(
      { leadId: 'lead-1', status: 'CONTACTED', actor },
      repository,
    )

    expect(result).toMatchObject({
      success: false,
      message: expect.stringContaining('cambió mientras'),
    })
  })

  it('normalizes every operable target and rejects protected targets', () => {
    expect(normalizeLeadStatusTarget('NEW')).toBe('NEW')
    expect(normalizeLeadStatusTarget('CONTACTED')).toBe('CONTACTED')
    expect(normalizeLeadStatusTarget('QUALIFIED')).toBe('QUALIFIED')
    expect(normalizeLeadStatusTarget('LOST')).toBe('LOST')
    expect(normalizeLeadStatusTarget('CONVERTED')).toBeNull()
  })
})
