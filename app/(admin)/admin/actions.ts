'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireAdminOrStaffContext } from '@/modules/auth/server/identity'
import { upsertMembershipBookingPolicy } from '@/modules/reservations/server/membership-booking-policies'

export type UpdateMembershipBookingPolicyActionState = {
  message: string
  fieldErrors?: {
    allowanceCount?: string
  }
} | null

export async function updateMembershipBookingPolicyAction(
  _previousState: UpdateMembershipBookingPolicyActionState,
  formData: FormData,
): Promise<UpdateMembershipBookingPolicyActionState> {
  const authContext = await requireAdminOrStaffContext()

  if (!authContext) {
    return {
      message: 'Necesitamos una sesión admin o staff válida para guardar esta regla.',
    }
  }

  const planId = readRequiredField(formData, 'planId')
  const policyMode = readRequiredField(formData, 'policyMode')
  const allowanceRaw = readOptionalField(formData, 'allowanceCount')

  if (!planId) {
    return {
      message: 'Falta el plan cuya regla querías editar.',
    }
  }

  if (!policyMode) {
    return {
      message: 'Falta el modo de regla que querías guardar.',
    }
  }

  if (policyMode === 'UNLIMITED') {
    try {
      await upsertMembershipBookingPolicy({
        membershipPlanId: planId,
        actorUserId: authContext.localUser.id,
        policyType: 'UNLIMITED',
      })
    } catch {
      return {
        message: 'No hemos podido persistir la regla unlimited. Reintenta en unos segundos.',
      }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/rules')
    redirect(`/admin/rules?plan=${encodeURIComponent(planId)}&updated=1`)
  }

  if (policyMode !== 'CALENDAR_WEEK' && policyMode !== 'CALENDAR_MONTH') {
    return {
      message: 'El modo de regla recibido no es válido para este formulario.',
    }
  }

  const allowanceCount = Number.parseInt(allowanceRaw ?? '', 10)

  if (!Number.isFinite(allowanceCount) || allowanceCount <= 0) {
    return {
      message: 'Revisa la allowance antes de guardar.',
      fieldErrors: {
        allowanceCount: 'Introduce un entero positivo para la cuota periódica.',
      },
    }
  }

  try {
      await upsertMembershipBookingPolicy({
        membershipPlanId: planId,
        actorUserId: authContext.localUser.id,
        policyType: 'PERIODIC_ALLOWANCE',
        periodType: policyMode,
        allowanceCount,
      })
  } catch {
    return {
      message: 'No hemos podido persistir la regla periódica. Reintenta en unos segundos.',
    }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/rules')
  redirect(`/admin/rules?plan=${encodeURIComponent(planId)}&updated=1`)
}

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : null
}

function readOptionalField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : null
}
