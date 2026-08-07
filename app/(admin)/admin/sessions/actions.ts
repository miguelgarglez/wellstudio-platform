'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireAdminOrStaffContext } from '@/modules/auth/server/identity'
import {
  cancelAdminClassSession,
  changeAdminClassSessionStatus,
  parseEuropeMadridDateTime,
  saveAdminClassSession,
  type AdminSessionActor,
} from '@/modules/classes/server/admin-class-sessions'
import {
  completeAdminClassSession,
  updateAdminReservationAttendance,
} from '@/modules/classes/server/admin-session-attendance'

export type AdminSessionActionState = { message: string; field?: string } | null

export async function saveAdminSessionAction(
  _state: AdminSessionActionState,
  formData: FormData,
): Promise<AdminSessionActionState> {
  const context = await requireAdminOrStaffContext()
  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }

  const startsAt = parseEuropeMadridDateTime(read(formData, 'startsAt') ?? '')
  const result = await saveAdminClassSession({
    sessionId: read(formData, 'sessionId'),
    classTypeId: read(formData, 'classTypeId') ?? '',
    coachId: read(formData, 'coachId'),
    startsAt,
    capacity: Number(read(formData, 'capacity')),
    locationLabel: read(formData, 'locationLabel'),
    waitlistEnabled: formData.get('waitlistEnabled') === 'on',
    publish: formData.get('publish') === 'true',
    expectedUpdatedAt: read(formData, 'expectedUpdatedAt')
      ? new Date(read(formData, 'expectedUpdatedAt')!)
      : null,
    acknowledgeMemberImpact: formData.get('acknowledgeMemberImpact') === 'on',
    impactReason: read(formData, 'impactReason'),
    actor: actorFrom(context),
  })

  if (!result.success) return { message: result.message, field: result.field }
  finish(
    result.sessionId,
    read(formData, 'sessionId') ? 'updated' : result.status.toLowerCase(),
  )
}

export async function changeAdminSessionStatusAction(
  _state: AdminSessionActionState,
  formData: FormData,
): Promise<AdminSessionActionState> {
  const context = await requireAdminOrStaffContext()
  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }
  const action = read(formData, 'action')
  if (action !== 'publish' && action !== 'close' && action !== 'reopen') {
    return { message: 'La acción solicitada no es válida.' }
  }
  const result = await changeAdminClassSessionStatus({
    sessionId: read(formData, 'sessionId') ?? '',
    action,
    actor: actorFrom(context),
  })
  if (!result.success) return { message: result.message, field: result.field }
  finish(result.sessionId, result.status.toLowerCase())
}

export async function cancelAdminSessionAction(
  _state: AdminSessionActionState,
  formData: FormData,
): Promise<AdminSessionActionState> {
  const context = await requireAdminOrStaffContext()
  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }
  const result = await cancelAdminClassSession({
    sessionId: read(formData, 'sessionId') ?? '',
    reason: read(formData, 'reason') ?? '',
    actor: actorFrom(context),
  })
  if (!result.success) return { message: result.message, field: result.field }
  finish(result.sessionId, 'canceled')
}

export async function updateAdminAttendanceAction(
  _state: AdminSessionActionState,
  formData: FormData,
): Promise<AdminSessionActionState> {
  const context = await requireAdminOrStaffContext()
  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }
  const expectedStatus = read(formData, 'expectedStatus')
  const attendanceStatus = read(formData, 'attendanceStatus')
  if (
    (expectedStatus !== 'PENDING' && expectedStatus !== 'ATTENDED' && expectedStatus !== 'NO_SHOW') ||
    (attendanceStatus !== 'PENDING' && attendanceStatus !== 'ATTENDED' && attendanceStatus !== 'NO_SHOW')
  ) {
    return { message: 'El estado de asistencia no es válido.' }
  }
  const result = await updateAdminReservationAttendance({
    reservationId: read(formData, 'reservationId') ?? '',
    expectedStatus,
    attendanceStatus,
    actor: actorFrom(context),
  })
  if (!result.success) return { message: result.message }
  finish(result.sessionId, result.attendanceStatus?.toLowerCase().replace('_', '-') ?? 'attendance')
}

export async function completeAdminSessionAction(
  _state: AdminSessionActionState,
  formData: FormData,
): Promise<AdminSessionActionState> {
  const context = await requireAdminOrStaffContext()
  if (!context) return { message: 'Necesitamos una sesión admin o staff válida.' }
  const result = await completeAdminClassSession({
    sessionId: read(formData, 'sessionId') ?? '',
    actor: actorFrom(context),
  })
  if (!result.success) return { message: result.message }
  finish(result.sessionId, 'completed')
}

function finish(sessionId: string, updated: string): never {
  revalidatePath('/admin/sessions')
  redirect(`/admin/sessions?session=${sessionId}&updated=${updated}&notice=${Date.now().toString(36)}`)
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
