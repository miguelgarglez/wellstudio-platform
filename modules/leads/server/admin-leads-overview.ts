import { prisma } from '@/lib/db/prisma'

const ADMIN_LEADS_LIMIT = 50
const OPERABLE_LEAD_STATUSES = ['NEW', 'CONTACTED', 'LOST'] as const

export type AdminLeadStatusFilter = 'all' | 'new' | 'contacted' | 'lost'

export type AdminLeadListItem = {
  id: string
  displayName: string
  phoneLabel: string
  emailLabel: string
  status: string
  statusLabel: string
  statusTone: 'new' | 'contacted' | 'lost' | 'readonly'
  sourceLabel: string
  createdAtLabel: string
  attributionLabel: string | null
}

export type AdminLeadOverview = {
  query: string
  statusFilter: AdminLeadStatusFilter
  leads: AdminLeadListItem[]
  counts: Record<AdminLeadStatusFilter, number>
}

type LeadRecord = {
  id: string
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  status: string
  source: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  createdAt: Date
}

export async function getAdminLeadOverview(input: {
  query: string | null
  status: string | null
}): Promise<AdminLeadOverview> {
  const query = normalizeLeadQuery(input.query)
  const statusFilter = normalizeStatusFilter(input.status)
  const where = buildLeadWhere({ query, statusFilter })

  const [leadRecords, allCount, newCount, contactedCount, lostCount] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: ADMIN_LEADS_LIMIT,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        status: true,
        source: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        createdAt: true,
      },
    }),
    prisma.lead.count({
      where: buildLeadWhere({ query, statusFilter: 'all' }),
    }),
    prisma.lead.count({
      where: buildLeadWhere({ query, statusFilter: 'new' }),
    }),
    prisma.lead.count({
      where: buildLeadWhere({ query, statusFilter: 'contacted' }),
    }),
    prisma.lead.count({
      where: buildLeadWhere({ query, statusFilter: 'lost' }),
    }),
  ])

  return {
    query,
    statusFilter,
    leads: leadRecords.map(buildAdminLeadListItem),
    counts: {
      all: allCount,
      new: newCount,
      contacted: contactedCount,
      lost: lostCount,
    },
  }
}

export function buildAdminLeadListItem(lead: LeadRecord): AdminLeadListItem {
  return {
    id: lead.id,
    displayName: buildLeadDisplayName(lead),
    phoneLabel: lead.phone?.trim() || 'Sin teléfono',
    emailLabel: lead.email?.trim() || 'Sin email',
    status: lead.status,
    statusLabel: formatLeadStatusLabel(lead.status),
    statusTone: formatLeadStatusTone(lead.status),
    sourceLabel: formatLeadSourceLabel(lead.source),
    createdAtLabel: formatLeadCreatedAt(lead.createdAt),
    attributionLabel: buildAttributionLabel(lead),
  }
}

export function normalizeStatusFilter(status: string | null | undefined): AdminLeadStatusFilter {
  switch (status) {
    case 'new':
    case 'contacted':
    case 'lost':
      return status
    default:
      return 'all'
  }
}

export function formatLeadStatusLabel(status: string) {
  switch (status) {
    case 'NEW':
      return 'Nueva'
    case 'CONTACTED':
      return 'Contactada'
    case 'LOST':
      return 'Perdida'
    case 'QUALIFIED':
      return 'Cualificada'
    case 'CONVERTED':
      return 'Convertida'
    default:
      return 'Solicitud'
  }
}

function normalizeLeadQuery(query: string | null | undefined) {
  return query?.trim().slice(0, 120) ?? ''
}

function buildLeadWhere(input: {
  query: string
  statusFilter: AdminLeadStatusFilter
}) {
  const where: Record<string, unknown> = {}

  if (input.statusFilter !== 'all') {
    where.status = mapStatusFilterToStatus(input.statusFilter)
  }

  if (input.query) {
    where.OR = [
      {
        firstName: {
          contains: input.query,
          mode: 'insensitive',
        },
      },
      {
        lastName: {
          contains: input.query,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: input.query,
          mode: 'insensitive',
        },
      },
      {
        phone: {
          contains: input.query,
          mode: 'insensitive',
        },
      },
      {
        normalizedPhone: {
          contains: input.query.replace(/\D/g, ''),
        },
      },
    ]
  }

  return where
}

function mapStatusFilterToStatus(statusFilter: AdminLeadStatusFilter) {
  switch (statusFilter) {
    case 'new':
      return 'NEW'
    case 'contacted':
      return 'CONTACTED'
    case 'lost':
      return 'LOST'
    case 'all':
      return undefined
  }
}

function buildLeadDisplayName(lead: Pick<LeadRecord, 'firstName' | 'lastName' | 'email' | 'phone'>) {
  const displayName = [lead.firstName, lead.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()

  return displayName || lead.email || lead.phone || 'Solicitud sin nombre'
}

function formatLeadStatusTone(status: string): AdminLeadListItem['statusTone'] {
  if (status === 'NEW') {
    return 'new'
  }

  if (status === 'CONTACTED') {
    return 'contacted'
  }

  if (status === 'LOST') {
    return 'lost'
  }

  return 'readonly'
}

function formatLeadSourceLabel(source: string | null) {
  if (source === 'public_home') {
    return 'Web pública'
  }

  return source || 'Origen no indicado'
}

function buildAttributionLabel(lead: Pick<LeadRecord, 'utmSource' | 'utmMedium' | 'utmCampaign'>) {
  const parts = [lead.utmSource, lead.utmMedium, lead.utmCampaign]
    .map((part) => part?.trim())
    .filter(Boolean)

  return parts.length > 0 ? parts.join(' / ') : null
}

function formatLeadCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(createdAt)
}

export function isOperableLeadStatus(status: string) {
  return OPERABLE_LEAD_STATUSES.includes(status as (typeof OPERABLE_LEAD_STATUSES)[number])
}
