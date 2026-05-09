'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { logoutCurrentSession } from '@/modules/auth/server/logout'

export type LogoutActionState = {
  success: false
  message: string
} | null

export async function logoutCurrentSessionAction(): Promise<LogoutActionState> {
  try {
    await logoutCurrentSession()
  } catch {
    return {
      success: false,
      message: 'No hemos podido cerrar tu sesión. Inténtalo de nuevo.',
    }
  }

  revalidatePath('/app')
  revalidatePath('/app/account')
  revalidatePath('/app/reservations')

  redirect('/login')
}
