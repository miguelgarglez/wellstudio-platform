'use server'

import { revalidatePath } from 'next/cache'

import { requireAuthenticatedContext } from '@/modules/auth/server/identity'
import {
  cancelMemberReservation,
  joinSessionWaitlist,
  leaveSessionWaitlist,
  reservePublishedSession,
  type ReservationMutationResult,
} from '@/modules/reservations/server/member-reservation-mutations'

export async function reservePublishedSessionAction(
  _previousState: ReservationMutationResult | null,
  formData: FormData,
): Promise<ReservationMutationResult> {
  const classSessionId = readRequiredField(formData, 'classSessionId')

  if (!classSessionId) {
    return {
      success: false,
      code: 'SESSION_NOT_BOOKABLE',
      message: 'Falta la sesión que querías reservar.',
    }
  }

  const authContext = await requireAuthenticatedContext()

  if (!authContext.member) {
    return {
      success: false,
      code: 'SESSION_NOT_BOOKABLE',
      message: 'Necesitamos una identidad de socio activa para reservar.',
    }
  }

  const result = await reservePublishedSession({
    memberId: authContext.member.id,
    userId: authContext.localUser.id,
    classSessionId,
  })

  if (result.success) {
    revalidateReservations()
  }

  return result
}

export async function cancelMemberReservationAction(
  _previousState: ReservationMutationResult | null,
  formData: FormData,
): Promise<ReservationMutationResult> {
  const reservationId = readRequiredField(formData, 'reservationId')

  if (!reservationId) {
    return {
      success: false,
      code: 'RESERVATION_NOT_FOUND',
      message: 'Falta la reserva que querías cancelar.',
    }
  }

  const authContext = await requireAuthenticatedContext()

  if (!authContext.member) {
    return {
      success: false,
      code: 'RESERVATION_NOT_FOUND',
      message: 'Necesitamos una identidad de socio activa para cancelar.',
    }
  }

  const result = await cancelMemberReservation({
    memberId: authContext.member.id,
    userId: authContext.localUser.id,
    reservationId,
  })

  if (result.success) {
    revalidateReservations()
  }

  return result
}

export async function joinSessionWaitlistAction(
  _previousState: ReservationMutationResult | null,
  formData: FormData,
): Promise<ReservationMutationResult> {
  const classSessionId = readRequiredField(formData, 'classSessionId')

  if (!classSessionId) {
    return {
      success: false,
      code: 'WAITLIST_DISABLED',
      message: 'Falta la sesión cuya waitlist querías usar.',
    }
  }

  const authContext = await requireAuthenticatedContext()

  if (!authContext.member) {
    return {
      success: false,
      code: 'WAITLIST_DISABLED',
      message: 'Necesitamos una identidad de socio activa para entrar en waitlist.',
    }
  }

  const result = await joinSessionWaitlist({
    memberId: authContext.member.id,
    userId: authContext.localUser.id,
    classSessionId,
  })

  if (result.success) {
    revalidateReservations()
  }

  return result
}

export async function leaveSessionWaitlistAction(
  _previousState: ReservationMutationResult | null,
  formData: FormData,
): Promise<ReservationMutationResult> {
  const waitlistEntryId = readRequiredField(formData, 'waitlistEntryId')

  if (!waitlistEntryId) {
    return {
      success: false,
      code: 'WAITLIST_NOT_FOUND',
      message: 'Falta la waitlist que querías abandonar.',
    }
  }

  const authContext = await requireAuthenticatedContext()

  if (!authContext.member) {
    return {
      success: false,
      code: 'WAITLIST_NOT_FOUND',
      message: 'Necesitamos una identidad de socio activa para salir de la waitlist.',
    }
  }

  const result = await leaveSessionWaitlist({
    memberId: authContext.member.id,
    userId: authContext.localUser.id,
    waitlistEntryId,
  })

  if (result.success) {
    revalidateReservations()
  }

  return result
}

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : null
}

function revalidateReservations() {
  revalidatePath('/app')
  revalidatePath('/app/reservations')
}
