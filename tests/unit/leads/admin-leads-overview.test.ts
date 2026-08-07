import { beforeEach, describe, expect, it, vi } from 'vitest'

const { leadFindManyMock, leadFindUniqueMock, leadCountMock, activityFindManyMock } = vi.hoisted(() => ({
  leadFindManyMock: vi.fn(),
  leadFindUniqueMock: vi.fn(),
  leadCountMock: vi.fn(),
  activityFindManyMock: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    lead: {
      findMany: leadFindManyMock,
      findUnique: leadFindUniqueMock,
      count: leadCountMock,
    },
    leadActivity: {
      findMany: activityFindManyMock,
    },
  },
}))

import {
  buildAdminLeadListItem,
  formatLeadStatusLabel,
  getAdminLeadActivitiesPage,
  getAdminLeadOverview,
  normalizeStatusFilter,
} from '@/modules/leads/server/admin-leads-overview'

describe('admin leads overview', () => {
  beforeEach(() => {
    leadFindManyMock.mockReset()
    leadFindUniqueMock.mockReset()
    leadCountMock.mockReset()
    activityFindManyMock.mockReset()
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
      .mockResolvedValueOnce(2)
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
      qualified: 2,
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

  it('defaults the inbox to new and keeps explicit all', () => {
    expect(normalizeStatusFilter('converted')).toBe('new')
    expect(normalizeStatusFilter(null)).toBe('new')
    expect(normalizeStatusFilter('all')).toBe('all')
    expect(normalizeStatusFilter('lost')).toBe('lost')
  })

  it('maps readonly statuses without making them operational labels', () => {
    expect(formatLeadStatusLabel('QUALIFIED')).toBe('Interesada')
    expect(formatLeadStatusLabel('CONVERTED')).toBe('Convertida')
  })

  it('maps activity history newest first and derives the creation event', async () => {
    leadFindUniqueMock.mockResolvedValue({
      id: 'lead-1',
      createdAt: new Date('2026-05-29T18:00:00.000Z'),
    })
    activityFindManyMock.mockResolvedValue([
      {
        id: 'activity-2',
        type: 'STATUS_CHANGED',
        fromStatus: 'NEW',
        toStatus: 'CONTACTED',
        note: 'Primer contacto realizado',
        actorDisplayName: 'Ana Admin',
        createdAt: new Date('2026-05-29T19:00:00.000Z'),
      },
      {
        id: 'activity-1',
        type: 'NOTE',
        fromStatus: null,
        toStatus: null,
        note: 'Solicita precios',
        actorDisplayName: 'Ana Admin',
        createdAt: new Date('2026-05-29T18:30:00.000Z'),
      },
    ])

    const page = await getAdminLeadActivitiesPage({ leadId: 'lead-1' })

    expect(page.nextCursor).toBeNull()
    expect(page.items.map((item) => item.kind)).toEqual(['status', 'note', 'created'])
    expect(page.items[0]).toMatchObject({
      title: 'Nueva → Contactada',
      note: 'Primer contacto realizado',
      actorLabel: 'Ana Admin',
    })
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
