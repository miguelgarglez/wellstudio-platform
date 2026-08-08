'use server'

import { revalidatePath } from 'next/cache'

import { requireAuthenticatedContext } from '@/modules/auth/server/identity'
import {
  updateMemberProfile,
  type UpdateMemberProfileResult,
} from '@/modules/members/server/member-profile'

export type UpdateMemberProfileActionState = UpdateMemberProfileResult | null

export async function updateMemberProfileAction(
  _previousState: UpdateMemberProfileActionState,
  formData: FormData,
): Promise<UpdateMemberProfileActionState> {
  const context = await requireAuthenticatedContext()

  if (!context.member) {
    return { success: false, code: 'NOT_FOUND', message: 'No encontramos tu perfil de socio.' }
  }

  try {
    const result = await updateMemberProfile({
      memberId: context.member.id,
      actorUserId: context.localUser.id,
      firstName: read(formData, 'firstName'),
      lastName: read(formData, 'lastName'),
      phone: read(formData, 'phone'),
      birthDate: read(formData, 'birthDate'),
      expectedUpdatedAt: read(formData, 'expectedUpdatedAt'),
    })

    if (result.success) {
      revalidatePath('/app')
      revalidatePath('/app/profile')
    }

    return result
  } catch {
    return {
      success: false,
      code: 'CONFLICT',
      message: 'No hemos podido guardar tus datos. Recarga la página y vuelve a intentarlo.',
    }
  }
}

function read(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}
