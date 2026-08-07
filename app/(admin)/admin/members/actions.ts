'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireAdminOrStaffContext } from '@/modules/auth/server/identity'
import {
  adjustMemberCreditAccount,
  openManualCreditAccount,
  type AdminCreditOperationResult,
} from '@/modules/members/server/admin-member-credits'
import {
  assignManualMembership,
  endManualMembership,
  type AdminMembershipActor,
  type AdminMembershipOperationResult,
} from '@/modules/members/server/admin-member-memberships'
import {
  changeAdminMemberStatus,
  type AdminMemberStatusActor,
} from '@/modules/members/server/admin-member-status'
import { addAdminMemberNote } from '@/modules/members/server/admin-member-notes'

export type AdminMemberStatusActionState = {
  message: string
  field?: 'status' | 'reason'
} | null

export type AdminMembershipActionState = {
  message: string
  field?: 'planId' | 'startsOn' | 'endsOn' | 'reason'
} | null

export type AdminCreditActionState = {
  message: string
  field?: 'creditAccountId' | 'creditPackId' | 'direction' | 'amount' | 'reason'
} | null

export type AdminMemberNoteActionState = {
  message: string
  field?: 'body'
} | null

export async function addAdminMemberNoteAction(
  _previousState: AdminMemberNoteActionState,
  formData: FormData,
): Promise<AdminMemberNoteActionState> {
  const context = await requireAdminOrStaffContext()
  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }

  const result = await addAdminMemberNote({
    memberId: read(formData, 'memberId') ?? '',
    body: read(formData, 'body') ?? '',
    actor: actorFrom(context),
  })
  if (!result.success) return { message: result.message, field: result.field }

  revalidatePath('/admin/members')
  redirect(appendFeedback(normalizeReturnTo(read(formData, 'returnTo')), 'member-note-added'))
}

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

export async function assignManualMembershipAction(
  _previousState: AdminMembershipActionState,
  formData: FormData,
): Promise<AdminMembershipActionState> {
  const context = await requireAdminOrStaffContext()

  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }

  let result: AdminMembershipOperationResult
  try {
    result = await assignManualMembership({
      memberId: read(formData, 'memberId') ?? '',
      membershipPlanId: read(formData, 'planId') ?? '',
      startsOn: read(formData, 'startsOn') ?? '',
      endsOn: read(formData, 'openEnded') === 'on' ? null : read(formData, 'endsOn'),
      reason: read(formData, 'reason') ?? '',
      actor: membershipActorFrom(context),
    })
  } catch {
    return { message: 'No hemos podido asignar la membership. Recarga la ficha y vuelve a intentarlo.' }
  }

  if (!result.success) return { message: result.message, field: result.field }

  revalidateMemberCommercialPaths()
  redirect(appendFeedback(
    normalizeReturnTo(read(formData, 'returnTo')),
    'membership-assigned',
  ))
}

export async function endManualMembershipAction(
  _previousState: AdminMembershipActionState,
  formData: FormData,
): Promise<AdminMembershipActionState> {
  const context = await requireAdminOrStaffContext()

  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }

  const expectedStatus = parseEndableMembershipStatus(read(formData, 'expectedStatus'))
  if (!expectedStatus) return { message: 'La membership ha cambiado. Recarga la ficha antes de continuar.' }

  let result: AdminMembershipOperationResult
  try {
    result = await endManualMembership({
      memberId: read(formData, 'memberId') ?? '',
      membershipId: read(formData, 'membershipId') ?? '',
      expectedStatus,
      reason: read(formData, 'reason') ?? '',
      actor: membershipActorFrom(context),
    })
  } catch {
    return { message: 'No hemos podido finalizar la membership. Recarga la ficha y vuelve a intentarlo.' }
  }

  if (!result.success) return { message: result.message, field: result.field }

  revalidateMemberCommercialPaths()
  redirect(appendFeedback(normalizeReturnTo(read(formData, 'returnTo')), 'membership-ended'))
}

export async function manageMemberCreditsAction(
  _previousState: AdminCreditActionState,
  formData: FormData,
): Promise<AdminCreditActionState> {
  const context = await requireAdminOrStaffContext()
  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }

  const operation = read(formData, 'operation')
  const amount = Number(read(formData, 'amount'))
  let result: AdminCreditOperationResult

  try {
    if (operation === 'adjust') {
      const direction = read(formData, 'direction')
      if (direction !== 'ADD' && direction !== 'REMOVE') {
        return { field: 'direction', message: 'Indica si quieres añadir o retirar créditos.' }
      }
      result = await adjustMemberCreditAccount({
        memberId: read(formData, 'memberId') ?? '',
        creditAccountId: read(formData, 'creditAccountId') ?? '',
        direction,
        amount,
        reason: read(formData, 'reason') ?? '',
        actor: membershipActorFrom(context),
      })
    } else if (operation === 'open') {
      result = await openManualCreditAccount({
        memberId: read(formData, 'memberId') ?? '',
        creditPackId: read(formData, 'creditPackId') ?? '',
        initialCredits: amount,
        reason: read(formData, 'reason') ?? '',
        actor: membershipActorFrom(context),
      })
    } else {
      return { message: 'Selecciona una operación de créditos válida.' }
    }
  } catch {
    return { message: 'No hemos podido actualizar los créditos. Recarga la ficha y vuelve a intentarlo.' }
  }

  if (!result.success) return { message: result.message, field: result.field }

  revalidateMemberCommercialPaths()
  redirect(appendFeedback(
    normalizeReturnTo(read(formData, 'returnTo')),
    result.operation === 'OPENED' ? 'credit-account-opened' : 'credits-adjusted',
  ))
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
  return appendFeedback(href, `member-${status.toLowerCase()}`)
}

function appendFeedback(href: string, updated: string) {
  const url = new URL(href, 'http://wellstudio.local')
  url.searchParams.set('updated', updated)
  url.searchParams.set('notice', Date.now().toString(36))
  return `${url.pathname}${url.search}`
}

function parseEndableMembershipStatus(value: string | null) {
  return value === 'ACTIVE' || value === 'PENDING_ACTIVATION' ? value : null
}

function revalidateMemberCommercialPaths() {
  revalidatePath('/admin/members')
  revalidatePath('/admin/overrides')
  revalidatePath('/app')
  revalidatePath('/app/account')
  revalidatePath('/app/reservations')
}

function actorFrom(
  context: NonNullable<Awaited<ReturnType<typeof requireAdminOrStaffContext>>>,
): AdminMemberStatusActor {
  const memberName = context.member
    ? [context.member.firstName, context.member.lastName].filter(Boolean).join(' ').trim()
    : ''
  return { userId: context.localUser.id, displayName: memberName || context.localUser.email }
}

function membershipActorFrom(
  context: NonNullable<Awaited<ReturnType<typeof requireAdminOrStaffContext>>>,
): AdminMembershipActor {
  return actorFrom(context)
}
