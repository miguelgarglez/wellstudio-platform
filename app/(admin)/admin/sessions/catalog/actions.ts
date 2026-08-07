'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireAdminOrStaffContext } from '@/modules/auth/server/identity'
import {
  changeAdminCatalogStatus,
  saveAdminClassType,
  saveAdminCoach,
  type AdminCatalogResult,
} from '@/modules/classes/server/admin-class-catalog'
import type { AdminSessionActor } from '@/modules/classes/server/admin-class-sessions'

export type AdminCatalogActionState = { message: string; field?: string } | null

export async function saveAdminClassTypeAction(
  _state: AdminCatalogActionState,
  formData: FormData,
): Promise<AdminCatalogActionState> {
  const context = await requireAdminOrStaffContext()
  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }

  const result = await saveAdminClassType({
    classTypeId: read(formData, 'classTypeId'),
    name: read(formData, 'name') ?? '',
    category: read(formData, 'category'),
    description: read(formData, 'description'),
    durationMinutes: Number(read(formData, 'durationMinutes')),
    capacityDefault: Number(read(formData, 'capacityDefault')),
    waitlistEnabled: formData.get('waitlistEnabled') === 'on',
    isPublic: formData.get('isPublic') === 'on',
    actor: actorFrom(context),
  })
  return finishOrReturn(result, 'classes')
}

export async function saveAdminCoachAction(
  _state: AdminCatalogActionState,
  formData: FormData,
): Promise<AdminCatalogActionState> {
  const context = await requireAdminOrStaffContext()
  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }

  const result = await saveAdminCoach({
    coachId: read(formData, 'coachId'),
    displayName: read(formData, 'displayName') ?? '',
    firstName: read(formData, 'firstName'),
    lastName: read(formData, 'lastName'),
    bio: read(formData, 'bio'),
    actor: actorFrom(context),
  })
  return finishOrReturn(result, 'coaches')
}

export async function changeAdminCatalogStatusAction(
  _state: AdminCatalogActionState,
  formData: FormData,
): Promise<AdminCatalogActionState> {
  const context = await requireAdminOrStaffContext()
  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }
  const entityType = read(formData, 'entityType')
  const action = read(formData, 'action')
  if ((entityType !== 'class-type' && entityType !== 'coach') || (action !== 'archive' && action !== 'activate')) {
    return { message: 'La acción solicitada no es válida.' }
  }

  const result = await changeAdminCatalogStatus({
    entityType,
    entityId: read(formData, 'entityId') ?? '',
    action,
    actor: actorFrom(context),
  })
  return finishOrReturn(result, entityType === 'class-type' ? 'classes' : 'coaches')
}

function finishOrReturn(result: AdminCatalogResult, tab: 'classes' | 'coaches'): AdminCatalogActionState {
  if (!result.success) return { message: result.message, field: result.field }
  revalidatePath('/admin/sessions')
  revalidatePath('/admin/sessions/catalog')
  redirect(`/admin/sessions/catalog?tab=${tab}&updated=${result.entityType}-${result.state}&notice=${Date.now().toString(36)}`)
}

function read(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function actorFrom(
  context: NonNullable<Awaited<ReturnType<typeof requireAdminOrStaffContext>>>,
): AdminSessionActor {
  const memberName = context.member
    ? [context.member.firstName, context.member.lastName].filter(Boolean).join(' ').trim()
    : ''
  return { userId: context.localUser.id, displayName: memberName || context.localUser.email }
}
