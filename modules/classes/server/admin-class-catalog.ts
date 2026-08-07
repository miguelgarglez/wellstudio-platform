import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import type { AdminSessionActor } from '@/modules/classes/server/admin-class-sessions'

const FUTURE_SESSION_STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED'] as const

export type AdminCatalogResult =
  | { success: true; entityId: string; entityType: 'class-type' | 'coach'; state: 'saved' | 'archived' | 'active' }
  | { success: false; message: string; field?: string }

export async function saveAdminClassType(input: {
  classTypeId?: string | null
  name: string
  category?: string | null
  description?: string | null
  durationMinutes: number
  capacityDefault: number
  waitlistEnabled: boolean
  isPublic: boolean
  actor: AdminSessionActor
}): Promise<AdminCatalogResult> {
  const name = input.name.trim()
  const category = input.category?.trim() || null
  const description = input.description?.trim() || null
  if (name.length < 2 || name.length > 80) return failure('El nombre debe tener entre 2 y 80 caracteres.', 'name')
  if (category && category.length > 80) return failure('La categoría no puede superar 80 caracteres.', 'category')
  if (description && description.length > 500) return failure('La descripción no puede superar 500 caracteres.', 'description')
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 10 || input.durationMinutes > 240) {
    return failure('La duración debe estar entre 10 y 240 minutos.', 'durationMinutes')
  }
  if (!Number.isInteger(input.capacityDefault) || input.capacityDefault < 1 || input.capacityDefault > 100) {
    return failure('La capacidad debe estar entre 1 y 100.', 'capacityDefault')
  }

  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.classType.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        id: input.classTypeId ? { not: input.classTypeId } : undefined,
      },
      select: { id: true },
    })
    if (duplicate) return failure('Ya existe un tipo de clase con ese nombre.', 'name')

    const existing = input.classTypeId
      ? await tx.classType.findUnique({ where: { id: input.classTypeId }, select: { id: true, slug: true } })
      : null
    if (input.classTypeId && !existing) return failure('El tipo de clase ya no existe.')

    const slug = existing?.slug ?? await buildUniqueClassTypeSlug(tx, slugify(name))
    const entity = existing
      ? await tx.classType.update({
          where: { id: existing.id },
          data: {
            name,
            category,
            description,
            durationMinutes: input.durationMinutes,
            capacityDefault: input.capacityDefault,
            waitlistEnabled: input.waitlistEnabled,
            isPublic: input.isPublic,
          },
          select: { id: true },
        })
      : await tx.classType.create({
          data: {
            name,
            slug,
            category,
            description,
            durationMinutes: input.durationMinutes,
            capacityDefault: input.capacityDefault,
            waitlistEnabled: input.waitlistEnabled,
            isPublic: input.isPublic,
            status: 'ACTIVE',
          },
          select: { id: true },
        })

    await auditCatalog(tx, {
      actor: input.actor,
      actionType: existing ? 'CLASS_TYPE_UPDATED' : 'CLASS_TYPE_CREATED',
      entityType: 'ClassType',
      entityId: entity.id,
      context: { name, slug, durationMinutes: input.durationMinutes, capacityDefault: input.capacityDefault },
    })
    return { success: true, entityId: entity.id, entityType: 'class-type', state: 'saved' }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function saveAdminCoach(input: {
  coachId?: string | null
  displayName: string
  firstName?: string | null
  lastName?: string | null
  bio?: string | null
  actor: AdminSessionActor
}): Promise<AdminCatalogResult> {
  const displayName = input.displayName.trim()
  const firstName = input.firstName?.trim() || null
  const lastName = input.lastName?.trim() || null
  const bio = input.bio?.trim() || null
  if (displayName.length < 2 || displayName.length > 80) return failure('El nombre visible debe tener entre 2 y 80 caracteres.', 'displayName')
  if ((firstName?.length ?? 0) > 80 || (lastName?.length ?? 0) > 80) return failure('Nombre y apellidos no pueden superar 80 caracteres.')
  if (bio && bio.length > 500) return failure('La bio no puede superar 500 caracteres.', 'bio')

  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.coach.findFirst({
      where: {
        displayName: { equals: displayName, mode: 'insensitive' },
        id: input.coachId ? { not: input.coachId } : undefined,
      },
      select: { id: true },
    })
    if (duplicate) return failure('Ya existe un coach con ese nombre visible.', 'displayName')

    const existing = input.coachId
      ? await tx.coach.findUnique({ where: { id: input.coachId }, select: { id: true } })
      : null
    if (input.coachId && !existing) return failure('El coach ya no existe.')

    const entity = existing
      ? await tx.coach.update({
          where: { id: existing.id },
          data: { displayName, firstName, lastName, bio },
          select: { id: true },
        })
      : await tx.coach.create({
          data: { displayName, firstName, lastName, bio, status: 'ACTIVE' },
          select: { id: true },
        })

    await auditCatalog(tx, {
      actor: input.actor,
      actionType: existing ? 'COACH_UPDATED' : 'COACH_CREATED',
      entityType: 'Coach',
      entityId: entity.id,
      context: { displayName },
    })
    return { success: true, entityId: entity.id, entityType: 'coach', state: 'saved' }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function changeAdminCatalogStatus(input: {
  entityType: 'class-type' | 'coach'
  entityId: string
  action: 'archive' | 'activate'
  actor: AdminSessionActor
  now?: Date
}): Promise<AdminCatalogResult> {
  const now = input.now ?? new Date()
  return prisma.$transaction(async (tx) => {
    if (input.entityType === 'class-type') {
      const entity = await tx.classType.findUnique({ where: { id: input.entityId }, select: { id: true, name: true, status: true } })
      if (!entity) return failure('El tipo de clase ya no existe.')
      if (input.action === 'archive') {
        const futureSessions = await tx.classSession.count({
          where: { classTypeId: entity.id, startsAt: { gt: now }, status: { in: [...FUTURE_SESSION_STATUSES] } },
        })
        if (futureSessions) return failure(`Reasigna o cancela primero ${futureSessions} ${futureSessions === 1 ? 'sesión futura' : 'sesiones futuras'}.`)
      }
      const status = input.action === 'archive' ? 'ARCHIVED' : 'ACTIVE'
      await tx.classType.update({ where: { id: entity.id }, data: { status } })
      await auditCatalog(tx, { actor: input.actor, actionType: `CLASS_TYPE_${status}`, entityType: 'ClassType', entityId: entity.id, context: { name: entity.name, fromStatus: entity.status, toStatus: status } })
      return { success: true, entityId: entity.id, entityType: 'class-type', state: input.action === 'archive' ? 'archived' : 'active' }
    }

    const entity = await tx.coach.findUnique({ where: { id: input.entityId }, select: { id: true, displayName: true, status: true } })
    if (!entity) return failure('El coach ya no existe.')
    if (input.action === 'archive') {
      const futureSessions = await tx.classSession.count({
        where: { coachId: entity.id, startsAt: { gt: now }, status: { in: [...FUTURE_SESSION_STATUSES] } },
      })
      if (futureSessions) return failure(`Reasigna o cancela primero ${futureSessions} ${futureSessions === 1 ? 'sesión futura' : 'sesiones futuras'}.`)
    }
    const status = input.action === 'archive' ? 'INACTIVE' : 'ACTIVE'
    await tx.coach.update({ where: { id: entity.id }, data: { status } })
    await auditCatalog(tx, { actor: input.actor, actionType: `COACH_${status}`, entityType: 'Coach', entityId: entity.id, context: { displayName: entity.displayName, fromStatus: entity.status, toStatus: status } })
    return { success: true, entityId: entity.id, entityType: 'coach', state: input.action === 'archive' ? 'archived' : 'active' }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'clase'
}

async function buildUniqueClassTypeSlug(tx: Prisma.TransactionClient, base: string) {
  const rows = await tx.classType.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  })
  const existing = new Set(rows.map((row) => row.slug))
  if (!existing.has(base)) return base
  let suffix = 2
  while (existing.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

function failure(message: string, field?: string): AdminCatalogResult {
  return field ? { success: false, message, field } : { success: false, message }
}

async function auditCatalog(tx: Prisma.TransactionClient, input: {
  actor: AdminSessionActor
  actionType: string
  entityType: 'ClassType' | 'Coach'
  entityId: string
  context: Record<string, string | number>
}) {
  await tx.auditLog.create({
    data: {
      actorUserId: input.actor.userId,
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId,
      contextJson: { ...input.context, actorDisplayName: input.actor.displayName },
    },
  })
}
