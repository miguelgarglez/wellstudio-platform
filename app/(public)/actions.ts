'use server'

import { createPublicLead, type PublicLeadResult } from '@/modules/leads/server/public-lead'

export type PublicLeadActionState = PublicLeadResult | null

export async function createPublicLeadAction(
  _previousState: PublicLeadActionState,
  formData: FormData,
): Promise<PublicLeadActionState> {
  return createPublicLead({
    name: readRequiredField(formData, 'name'),
    phone: readRequiredField(formData, 'phone'),
    email: readOptionalField(formData, 'email'),
    privacyAccepted: formData.get('privacyAccepted') === 'on',
    honeypot: readOptionalField(formData, 'website'),
    captchaToken: readOptionalField(formData, 'cf-turnstile-response'),
    utmSource: readOptionalField(formData, 'utmSource'),
    utmMedium: readOptionalField(formData, 'utmMedium'),
    utmCampaign: readOptionalField(formData, 'utmCampaign'),
  })
}

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function readOptionalField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : null
}
