import { beforeEach, describe, expect, it, vi } from 'vitest'

const { leadFindManyMock, leadCountMock } = vi.hoisted(() => ({
  leadFindManyMock: vi.fn(),
  leadCountMock: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    lead: {
      findMany: leadFindManyMock,
      count: leadCountMock,
    },
  },
}))

import {
  buildAdminLeadListItem,
  formatLeadStatusLabel,
  getAdminLeadOverview,
  normalizeStatusFilter,
} from '@/modules/leads/server/admin-leads-overview'

describe('admin leads overview', () => {
  beforeEach(() => {
    leadFindManyMock.mockReset()
    leadCountMock.mockReset()
  })

  it('lists recent contact requests with visible labels and counts', async () => {
    leadFindManyMock.mockResolvedValue([
      {
        id: 'lead-1',
        firstName: 'Marta',
        lastName: null,
        phone: '612 345 678',
        email: 'marta@example.com',
        status: 'NEW',
        source: 'public_home',
        utmSource: 'instagram',
        utmMedium: 'social',
        utmCampaign: 'mayo',
        createdAt: new Date('2026-05-29T18:30:00.000Z'),
      },
    ])
    leadCountMock
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1)

    const overview = await getAdminLeadOverview({
      query: ' marta ',
      status: 'new',
    })

    expect(leadFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'NEW',
          OR: expect.any(Array),
        }),
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      }),
    )
    expect(overview.query).toBe('marta')
    expect(overview.statusFilter).toBe('new')
    expect(overview.counts).toEqual({
      all: 10,
      new: 4,
      contacted: 5,
      lost: 1,
    })
    expect(overview.leads[0]).toMatchObject({
      id: 'lead-1',
      displayName: 'Marta',
      phoneLabel: '612 345 678',
      emailLabel: 'marta@example.com',
      statusLabel: 'Nueva',
      sourceLabel: 'Web pública',
      attributionLabel: 'instagram / social / mayo',
    })
  })

  it('normalizes unsupported filters to all', () => {
    expect(normalizeStatusFilter('converted')).toBe('all')
    expect(normalizeStatusFilter(null)).toBe('all')
    expect(normalizeStatusFilter('lost')).toBe('lost')
  })

  it('maps readonly statuses without making them operational labels', () => {
    expect(formatLeadStatusLabel('QUALIFIED')).toBe('Cualificada')
    expect(formatLeadStatusLabel('CONVERTED')).toBe('Convertida')
  })

  it('uses honest fallbacks for partial lead data', () => {
    expect(
      buildAdminLeadListItem({
        id: 'lead-partial',
        firstName: null,
        lastName: null,
        phone: null,
        email: null,
        status: 'LOST',
        source: null,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        createdAt: new Date('2026-05-29T18:30:00.000Z'),
      }),
    ).toMatchObject({
      displayName: 'Solicitud sin nombre',
      phoneLabel: 'Sin teléfono',
      emailLabel: 'Sin email',
      statusLabel: 'Perdida',
      sourceLabel: 'Origen no indicado',
      attributionLabel: null,
    })
  })
})
