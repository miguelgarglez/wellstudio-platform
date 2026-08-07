'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireAdminOrStaffContext } from '@/modules/auth/server/identity'
import {
  addAdminLeadNote,
  updateAdminLeadStatus,
  type AdminLeadActor,
} from '@/modules/leads/server/admin-lead-operations'
import {
  getAdminLeadActivitiesPage,
  type AdminLeadActivityPage,
} from '@/modules/leads/server/admin-leads-overview'

export type AdminLeadActionState = {
  message: string
  field?: 'note' | 'status'
} | null

export async function addAdminLeadNoteAction(
  _previousState: AdminLeadActionState,
  formData: FormData,
): Promise<AdminLeadActionState> {
  const authContext = await requireAdminOrStaffContext()

  if (!authContext) {
    return { message: 'Necesitamos una sesión admin o staff válida.' }
  }

  const returnTo = normalizeReturnTo(readField(formData, 'returnTo'))
  const result = await addAdminLeadNote({
    leadId: readField(formData, 'leadId') ?? '',
    note: readField(formData, 'note') ?? '',
    actor: buildLeadActor(authContext),
  })

  if (!result.success) {
    return { message: result.message, field: result.field }
  }

  revalidatePath('/admin/leads')
  redirect(appendUpdatedParam(returnTo, 'note'))
}

export async function updateAdminLeadStatusAction(
  _previousState: AdminLeadActionState,
  formData: FormData,
): Promise<AdminLeadActionState> {
  const authContext = await requireAdminOrStaffContext()

  if (!authContext) {
    return { message: 'Necesitamos una sesión admin o staff válida.' }
  }

  const returnTo = normalizeReturnTo(readField(formData, 'returnTo'))
  const result = await updateAdminLeadStatus({
    leadId: readField(formData, 'leadId') ?? '',
    status: readField(formData, 'status') ?? '',
    note: readField(formData, 'note'),
    actor: buildLeadActor(authContext),
  })

  if (!result.success || !result.status) {
    return {
      message: result.success ? 'No se pudo completar el cambio.' : result.message,
      field: result.success ? undefined : result.field,
    }
  }

  revalidatePath('/admin/leads')
  redirect(appendUpdatedParam(returnTo, result.status.toLowerCase()))
}

export async function loadAdminLeadActivitiesAction(input: {
  leadId: string
  cursor: string
}): Promise<AdminLeadActivityPage> {
  const authContext = await requireAdminOrStaffContext()

  if (!authContext) {
    throw new Error('Admin or staff session required')
  }

  return getAdminLeadActivitiesPage(input)
}

function buildLeadActor(
  authContext: NonNullable<Awaited<ReturnType<typeof requireAdminOrStaffContext>>>,
): AdminLeadActor {
  const memberName = authContext.member
    ? [authContext.member.firstName, authContext.member.lastName].filter(Boolean).join(' ').trim()
    : ''

  return {
    userId: authContext.localUser.id,
    displayName: memberName || authContext.localUser.email,
  }
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : null
}

function normalizeReturnTo(href: string | null) {
  if (!href) {
    return '/admin/leads'
  }

  const url = new URL(href, 'http://wellstudio.local')
  return url.pathname === '/admin/leads' ? `${url.pathname}${url.search}` : '/admin/leads'
}

function appendUpdatedParam(href: string, updated: string) {
  const url = new URL(href, 'http://wellstudio.local')
  url.searchParams.set('updated', updated)
  url.searchParams.set('notice', Date.now().toString(36))
  return `${url.pathname}${url.search}`
}
