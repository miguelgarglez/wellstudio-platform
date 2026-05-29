'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireAdminOrStaffContext } from '@/modules/auth/server/identity'
import { updateAdminLeadStatus } from '@/modules/leads/server/admin-lead-status'

export type UpdateAdminLeadStatusActionState = {
  message: string
} | null

export async function updateAdminLeadStatusAction(
  _previousState: UpdateAdminLeadStatusActionState,
  formData: FormData,
): Promise<UpdateAdminLeadStatusActionState> {
  const authContext = await requireAdminOrStaffContext()

  if (!authContext) {
    return {
      message: 'Necesitamos una sesión admin o staff válida para actualizar solicitudes.',
    }
  }

  const leadId = readRequiredField(formData, 'leadId')
  const status = readRequiredField(formData, 'status')
  const returnTo = readRequiredField(formData, 'returnTo') ?? '/admin/leads'

  const result = await updateAdminLeadStatus({
    leadId: leadId ?? '',
    status: status ?? '',
  })

  if (!result.success) {
    return {
      message: result.message,
    }
  }

  revalidatePath('/admin/leads')
  redirect(appendUpdatedParam(returnTo, result.status.toLowerCase()))
}

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : null
}

function appendUpdatedParam(href: string, updated: string) {
  const url = new URL(href, 'http://wellstudio.local')
  url.searchParams.set('updated', updated)

  return `${url.pathname}${url.search}`
}
