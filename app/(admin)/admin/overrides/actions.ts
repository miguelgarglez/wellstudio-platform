'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireAdminOrStaffContext } from '@/modules/auth/server/identity'
import {
  grantMembershipPeriodAllowanceOverride,
  grantMembershipSessionAccessOverride,
  revokeMembershipBookingOverride,
} from '@/modules/reservations/server/membership-booking-overrides'

export type GrantExtraAllowanceActionState = {
  message: string
  fieldErrors?: {
    extraBookings?: string
    reason?: string
  }
} | null

export type GrantSessionAccessActionState = {
  message: string
  fieldErrors?: {
    reason?: string
  }
} | null

export async function grantExtraAllowanceOverrideAction(
  _previousState: GrantExtraAllowanceActionState,
  formData: FormData,
): Promise<GrantExtraAllowanceActionState> {
  const authContext = await requireAdminOrStaffContext()

  if (!authContext) {
    return {
      message: 'Necesitamos una sesión admin o staff válida para conceder excepciones.',
    }
  }

  const query = readOptionalField(formData, 'query')
  const memberId = readRequiredField(formData, 'memberId')
  const membershipId = readRequiredField(formData, 'membershipId')
  const extraBookingsRaw = readRequiredField(formData, 'extraBookings')
  const reason = readOptionalField(formData, 'reason')?.trim() ?? ''

  if (!memberId || !membershipId) {
    return {
      message: 'Falta la membership activa sobre la que querías conceder reservas extra.',
    }
  }

  const extraBookings = Number.parseInt(extraBookingsRaw ?? '', 10)

  if (!Number.isFinite(extraBookings) || extraBookings <= 0) {
    return {
      message: 'Revisa la cantidad antes de conceder reservas extra.',
      fieldErrors: {
        extraBookings: 'Introduce un entero positivo.',
      },
    }
  }

  if (reason.length === 0) {
    return {
      message: 'Necesitamos una razón breve y explícita para auditar esta excepción.',
      fieldErrors: {
        reason: 'La razón es obligatoria.',
      },
    }
  }

  try {
    await grantMembershipPeriodAllowanceOverride({
      memberMembershipId: membershipId,
      extraBookings,
      actorUserId: authContext.localUser.id,
      reason,
    })
  } catch (error) {
    return {
      message: mapOverrideActionError(
        error,
        'No hemos podido conceder reservas extra. Reintenta en unos segundos.',
      ),
    }
  }

  revalidatePath('/admin/overrides')
  redirect(
    buildOverridesRedirect({
      query,
      memberId,
      updated: 'extra',
    }),
  )
}

export async function grantSessionAccessOverrideAction(
  _previousState: GrantSessionAccessActionState,
  formData: FormData,
): Promise<GrantSessionAccessActionState> {
  const authContext = await requireAdminOrStaffContext()

  if (!authContext) {
    return {
      message: 'Necesitamos una sesión admin o staff válida para conceder excepciones.',
    }
  }

  const query = readOptionalField(formData, 'query')
  const memberId = readRequiredField(formData, 'memberId')
  const membershipId = readRequiredField(formData, 'membershipId')
  const sessionId = readRequiredField(formData, 'sessionId')
  const reason = readOptionalField(formData, 'reason')?.trim() ?? ''

  if (!memberId || !membershipId) {
    return {
      message: 'Falta la membership activa sobre la que querías conceder acceso puntual.',
    }
  }

  if (!sessionId) {
    return {
      message: 'Selecciona una sesión futura publicada antes de conceder acceso puntual.',
    }
  }

  if (reason.length === 0) {
    return {
      message: 'Necesitamos una razón breve y explícita para auditar esta excepción.',
      fieldErrors: {
        reason: 'La razón es obligatoria.',
      },
    }
  }

  try {
    await grantMembershipSessionAccessOverride({
      memberMembershipId: membershipId,
      classSessionId: sessionId,
      actorUserId: authContext.localUser.id,
      reason,
    })
  } catch (error) {
    return {
      message: mapOverrideActionError(
        error,
        'No hemos podido conceder acceso puntual. Reintenta en unos segundos.',
      ),
    }
  }

  revalidatePath('/admin/overrides')
  redirect(
    buildOverridesRedirect({
      query,
      memberId,
      updated: 'session',
    }),
  )
}

export async function revokeMemberOverrideAction(formData: FormData) {
  const authContext = await requireAdminOrStaffContext()

  if (!authContext) {
    redirect('/admin/overrides')
  }

  const query = readOptionalField(formData, 'query')
  const memberId = readRequiredField(formData, 'memberId')
  const overrideId = readRequiredField(formData, 'overrideId')

  if (!memberId || !overrideId) {
    redirect('/admin/overrides')
  }

  try {
    await revokeMembershipBookingOverride({
      overrideId,
      actorUserId: authContext.localUser.id,
    })
  } catch {
    redirect(
      buildOverridesRedirect({
        query,
        memberId,
        updated: 'revoke-error',
      }),
    )
  }

  revalidatePath('/admin/overrides')
  redirect(
    buildOverridesRedirect({
      query,
      memberId,
      updated: 'revoked',
    }),
  )
}

function buildOverridesRedirect(input: {
  query: string | null
  memberId: string
  membershipId?: string | null
  sessionId?: string | null
  updated: 'extra' | 'session' | 'revoked' | 'revoke-error'
}) {
  const params = new URLSearchParams()

  if (input.query) {
    params.set('q', input.query)
  }

  params.set('member', input.memberId)

  if (input.membershipId) {
    params.set('membership', input.membershipId)
  }

  if (input.sessionId) {
    params.set('session', input.sessionId)
  }

  params.set('updated', input.updated)

  return `/admin/overrides?${params.toString()}`
}

function mapOverrideActionError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback
  }

  if (error.message.includes('periodic booking policy')) {
    return 'La membership seleccionada no admite reservas extra porque no tiene una política periódica activa.'
  }

  if (error.message.includes('Class session not found')) {
    return 'La sesión seleccionada ya no está disponible. Recarga la lista y vuelve a intentarlo.'
  }

  if (error.message.includes('Member membership not found')) {
    return 'La membership seleccionada ya no está operativa para conceder esta excepción.'
  }

  return fallback
}

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : null
}

function readOptionalField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : null
}
