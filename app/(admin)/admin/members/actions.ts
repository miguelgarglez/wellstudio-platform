'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireAdminOrStaffContext } from '@/modules/auth/server/identity'
import {
  changeAdminMemberStatus,
  type AdminMemberStatusActor,
} from '@/modules/members/server/admin-member-status'

export type AdminMemberStatusActionState = {
  message: string
  field?: 'status' | 'reason'
} | null

export async function changeAdminMemberStatusAction(
  _previousState: AdminMemberStatusActionState,
  formData: FormData,
): Promise<AdminMemberStatusActionState> {
  const context = await requireAdminOrStaffContext()

  if (!context) {
    return { message: 'Necesitamos una sesión admin o staff válida.' }
  }

  const expectedStatus = parseExpectedStatus(read(formData, 'expectedStatus'))
  if (!expectedStatus) {
    return { message: 'Falta el estado actual de la ficha. Recarga e inténtalo de nuevo.' }
  }

  const result = await changeAdminMemberStatus({
    memberId: read(formData, 'memberId') ?? '',
    expectedStatus,
    status: read(formData, 'status') ?? '',
    reason: read(formData, 'reason') ?? '',
    actor: actorFrom(context),
  })

  if (!result.success) {
    return { message: result.message, field: result.field }
  }

  revalidatePath('/admin/members')
  revalidatePath('/admin/overrides')
  revalidatePath('/app')
  revalidatePath('/app/reservations')
  redirect(appendStatusFeedback(normalizeReturnTo(read(formData, 'returnTo')), result.status))
}

function read(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseExpectedStatus(value: string | null) {
  return value === 'LEAD_CONVERTED' || value === 'ACTIVE' || value === 'INACTIVE' || value === 'BLOCKED'
    ? value
    : null
}

function normalizeReturnTo(href: string | null) {
  if (!href) return '/admin/members'
  const url = new URL(href, 'http://wellstudio.local')
  return url.pathname === '/admin/members' ? `${url.pathname}${url.search}` : '/admin/members'
}

function appendStatusFeedback(href: string, status: string) {
  const url = new URL(href, 'http://wellstudio.local')
  url.searchParams.set('updated', `member-${status.toLowerCase()}`)
  url.searchParams.set('notice', Date.now().toString(36))
  return `${url.pathname}${url.search}`
}

function actorFrom(
  context: NonNullable<Awaited<ReturnType<typeof requireAdminOrStaffContext>>>,
): AdminMemberStatusActor {
  const memberName = context.member
    ? [context.member.firstName, context.member.lastName].filter(Boolean).join(' ').trim()
    : ''
  return { userId: context.localUser.id, displayName: memberName || context.localUser.email }
}
