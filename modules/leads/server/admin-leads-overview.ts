import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import {
  getAllowedLeadStatusTransitions,
  isOperableLeadStatus,
  type AdminLeadOperableStatus,
} from '@/modules/leads/server/admin-lead-operations'

const ADMIN_LEADS_LIMIT = 50
const ADMIN_LEAD_ACTIVITY_PAGE_SIZE = 20

export type AdminLeadStatusFilter = 'new' | 'contacted' | 'qualified' | 'lost' | 'all'

export type AdminLeadListItem = {
  id: string
  displayName: string
  phoneLabel: string
  emailLabel: string
  status: string
  statusLabel: string
  statusTone: 'new' | 'contacted' | 'qualified' | 'lost' | 'readonly'
  sourceLabel: string
  createdAtLabel: string
  attributionLabel: string | null
}

export type AdminLeadTimelineItem = {
  id: string
  kind: 'created' | 'note' | 'status'
  title: string
  note: string | null
  actorLabel: string
  createdAtLabel: string
  tone: 'neutral' | 'status' | 'lost'
}

export type AdminLeadActivityPage = {
  items: AdminLeadTimelineItem[]
  nextCursor: string | null
}

export type AdminLeadDetail = AdminLeadListItem & {
  allowedTransitions: AdminLeadOperableStatus[]
  activityPage: AdminLeadActivityPage
}

export type AdminLeadOverview = {
  query: string
  statusFilter: AdminLeadStatusFilter
  leads: AdminLeadListItem[]
  selectedLead: AdminLeadDetail | null
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
  selectedLeadId?: string | null
}): Promise<AdminLeadOverview> {
  const query = normalizeLeadQuery(input.query)
  const statusFilter = normalizeStatusFilter(input.status)
  const where = buildLeadWhere({ query, statusFilter })

  const [leadRecords, allCount, newCount, contactedCount, qualifiedCount, lostCount, selectedLead] =
    await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: ADMIN_LEADS_LIMIT,
        select: leadSelect,
      }),
      prisma.lead.count({ where: buildLeadWhere({ query, statusFilter: 'all' }) }),
      prisma.lead.count({ where: buildLeadWhere({ query, statusFilter: 'new' }) }),
      prisma.lead.count({ where: buildLeadWhere({ query, statusFilter: 'contacted' }) }),
      prisma.lead.count({ where: buildLeadWhere({ query, statusFilter: 'qualified' }) }),
      prisma.lead.count({ where: buildLeadWhere({ query, statusFilter: 'lost' }) }),
      input.selectedLeadId ? getAdminLeadDetail(input.selectedLeadId) : null,
    ])

  return {
    query,
    statusFilter,
    leads: leadRecords.map(buildAdminLeadListItem),
    selectedLead,
    counts: {
      all: allCount,
      new: newCount,
      contacted: contactedCount,
      qualified: qualifiedCount,
      lost: lostCount,
    },
  }
}

export async function getAdminLeadDetail(leadId: string): Promise<AdminLeadDetail | null> {
  const normalizedLeadId = leadId.trim()

  if (!normalizedLeadId) {
    return null
  }

  const lead = await prisma.lead.findUnique({
    where: { id: normalizedLeadId },
    select: leadSelect,
  })

  if (!lead) {
    return null
  }

  return {
    ...buildAdminLeadListItem(lead),
    allowedTransitions: getAllowedLeadStatusTransitions(lead.status),
    activityPage: await getAdminLeadActivitiesPage({ leadId: lead.id }),
  }
}

export async function getAdminLeadActivitiesPage(input: {
  leadId: string
  cursor?: string | null
}): Promise<AdminLeadActivityPage> {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: { id: true, createdAt: true },
  })

  if (!lead) {
    return { items: [], nextCursor: null }
  }

  const activities = await prisma.leadActivity.findMany({
    where: { leadId: lead.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: ADMIN_LEAD_ACTIVITY_PAGE_SIZE + 1,
    ...(input.cursor
      ? {
          cursor: { id: input.cursor },
          skip: 1,
        }
      : {}),
    select: {
      id: true,
      type: true,
      fromStatus: true,
      toStatus: true,
      note: true,
      actorDisplayName: true,
      createdAt: true,
    },
  })

  const hasMore = activities.length > ADMIN_LEAD_ACTIVITY_PAGE_SIZE
  const visibleActivities = hasMore
    ? activities.slice(0, ADMIN_LEAD_ACTIVITY_PAGE_SIZE)
    : activities
  const items = visibleActivities.map(buildAdminLeadTimelineItem)

  if (!hasMore) {
    items.push({
      id: `created:${lead.id}`,
      kind: 'created',
      title: 'Solicitud recibida desde la web',
      note: null,
      actorLabel: 'Sistema',
      createdAtLabel: formatTimelineDate(lead.createdAt),
      tone: 'neutral',
    })
  }

  return {
    items,
    nextCursor: hasMore
      ? visibleActivities[visibleActivities.length - 1]?.id ?? null
      : null,
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
    case 'all':
    case 'contacted':
    case 'qualified':
    case 'lost':
      return status
    default:
      return 'new'
  }
}

export function formatLeadStatusLabel(status: string) {
  switch (status) {
    case 'NEW':
      return 'Nueva'
    case 'CONTACTED':
      return 'Contactada'
    case 'QUALIFIED':
      return 'Interesada'
    case 'CONVERTED':
      return 'Convertida'
    case 'LOST':
      return 'Perdida'
    default:
      return 'Solicitud'
  }
}

function buildAdminLeadTimelineItem(activity: {
  id: string
  type: string
  fromStatus: string | null
  toStatus: string | null
  note: string | null
  actorDisplayName: string
  createdAt: Date
}): AdminLeadTimelineItem {
  if (activity.type === 'NOTE') {
    return {
      id: activity.id,
      kind: 'note',
      title: 'Nota añadida',
      note: activity.note,
      actorLabel: activity.actorDisplayName,
      createdAtLabel: formatTimelineDate(activity.createdAt),
      tone: 'neutral',
    }
  }

  return {
    id: activity.id,
    kind: 'status',
    title: `${formatLeadStatusLabel(activity.fromStatus ?? '')} → ${formatLeadStatusLabel(activity.toStatus ?? '')}`,
    note: activity.note,
    actorLabel: activity.actorDisplayName,
    createdAtLabel: formatTimelineDate(activity.createdAt),
    tone: activity.toStatus === 'LOST' ? 'lost' : 'status',
  }
}

function normalizeLeadQuery(query: string | null | undefined) {
  return query?.trim().slice(0, 120) ?? ''
}

function buildLeadWhere(input: {
  query: string
  statusFilter: AdminLeadStatusFilter
}): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {}

  if (input.statusFilter !== 'all') {
    where.status = mapStatusFilterToStatus(input.statusFilter)
  }

  if (input.query) {
    where.OR = [
      { firstName: { contains: input.query, mode: 'insensitive' } },
      { lastName: { contains: input.query, mode: 'insensitive' } },
      { email: { contains: input.query, mode: 'insensitive' } },
      { phone: { contains: input.query, mode: 'insensitive' } },
      { normalizedPhone: { contains: input.query.replace(/\D/g, '') } },
    ]
  }

  return where
}

function mapStatusFilterToStatus(statusFilter: Exclude<AdminLeadStatusFilter, 'all'>) {
  const statuses = {
    new: 'NEW',
    contacted: 'CONTACTED',
    qualified: 'QUALIFIED',
    lost: 'LOST',
  } as const

  return statuses[statusFilter]
}

function buildLeadDisplayName(lead: Pick<LeadRecord, 'firstName' | 'lastName' | 'email' | 'phone'>) {
  const displayName = [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim()
  return displayName || lead.email || lead.phone || 'Solicitud sin nombre'
}

function formatLeadStatusTone(status: string): AdminLeadListItem['statusTone'] {
  if (status === 'NEW') return 'new'
  if (status === 'CONTACTED') return 'contacted'
  if (status === 'QUALIFIED') return 'qualified'
  if (status === 'LOST') return 'lost'
  return 'readonly'
}

function formatLeadSourceLabel(source: string | null) {
  return source === 'public_home' ? 'Web pública' : source || 'Origen no indicado'
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

function formatTimelineDate(createdAt: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(createdAt)
}

const leadSelect = {
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
} satisfies Prisma.LeadSelect

export { isOperableLeadStatus }
