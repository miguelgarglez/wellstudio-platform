import { prisma } from '@/lib/db/prisma'

export const PUBLIC_LEAD_SOURCE = 'public_home'
export const PUBLIC_LEAD_PRIVACY_POLICY_VERSION = '2026-05-06'
export const PUBLIC_LEAD_DEDUPE_WINDOW_DAYS = 7

const MAX_NAME_LENGTH = 80
const MAX_PHONE_LENGTH = 32
const MAX_EMAIL_LENGTH = 254
const MAX_UTM_LENGTH = 120
const ACTIVE_LEAD_STATUSES = ['NEW', 'CONTACTED'] as const

export type PublicLeadInput = {
  name: string
  phone: string
  email?: string | null
  privacyAccepted: boolean
  honeypot?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
}

export type PublicLeadResult =
  | {
      success: true
      status: 'created' | 'deduped' | 'spam_ignored'
      message: string
    }
  | {
      success: false
      message: string
      fieldErrors: PublicLeadFieldErrors
    }

export type PublicLeadFieldErrors = Partial<
  Record<'name' | 'phone' | 'email' | 'privacyAccepted', string>
>

type ExistingLeadLookup = {
  id: string
}

export type PublicLeadRepository = {
  findRecentActiveByNormalizedPhone(input: {
    normalizedPhone: string
    since: Date
  }): Promise<ExistingLeadLookup | null>
  create(input: {
    firstName: string
    phone: string
    normalizedPhone: string
    email: string | null
    source: string
    utmSource: string | null
    utmMedium: string | null
    utmCampaign: string | null
    privacyAcceptedAt: Date
    privacyPolicyVersion: string
  }): Promise<{ id: string }>
}

export const prismaPublicLeadRepository: PublicLeadRepository = {
  async findRecentActiveByNormalizedPhone({ normalizedPhone, since }) {
    return prisma.lead.findFirst({
      where: {
        normalizedPhone,
        status: {
          in: [...ACTIVE_LEAD_STATUSES],
        },
        createdAt: {
          gte: since,
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },
  async create(input) {
    return prisma.lead.create({
      data: {
        firstName: input.firstName,
        lastName: null,
        phone: input.phone,
        normalizedPhone: input.normalizedPhone,
        email: input.email,
        status: 'NEW',
        source: input.source,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        privacyAcceptedAt: input.privacyAcceptedAt,
        privacyPolicyVersion: input.privacyPolicyVersion,
      },
      select: {
        id: true,
      },
    })
  },
}

export async function createPublicLead(
  input: PublicLeadInput,
  dependencies: {
    repository?: PublicLeadRepository
    now?: Date
  } = {},
): Promise<PublicLeadResult> {
  const now = dependencies.now ?? new Date()
  const repository = dependencies.repository ?? prismaPublicLeadRepository

  if (input.honeypot?.trim()) {
    return {
      success: true,
      status: 'spam_ignored',
      message: 'Solicitud recibida. El equipo de WellStudio te contactará por teléfono.',
    }
  }

  const parsed = parsePublicLeadInput(input)

  if (!parsed.success) {
    return parsed
  }

  const existingLead = await repository.findRecentActiveByNormalizedPhone({
    normalizedPhone: parsed.normalizedPhone,
    since: subtractDays(now, PUBLIC_LEAD_DEDUPE_WINDOW_DAYS),
  })

  if (existingLead) {
    return {
      success: true,
      status: 'deduped',
      message:
        'Ya tenemos una solicitud reciente con este teléfono. El equipo de WellStudio te contactará.',
    }
  }

  await repository.create({
    firstName: parsed.name,
    phone: parsed.phone,
    normalizedPhone: parsed.normalizedPhone,
    email: parsed.email,
    source: PUBLIC_LEAD_SOURCE,
    utmSource: parsed.utmSource,
    utmMedium: parsed.utmMedium,
    utmCampaign: parsed.utmCampaign,
    privacyAcceptedAt: now,
    privacyPolicyVersion: PUBLIC_LEAD_PRIVACY_POLICY_VERSION,
  })

  return {
    success: true,
    status: 'created',
    message: 'Solicitud recibida. El equipo de WellStudio te contactará por teléfono.',
  }
}

function parsePublicLeadInput(input: PublicLeadInput):
  | {
      success: true
      name: string
      phone: string
      normalizedPhone: string
      email: string | null
      utmSource: string | null
      utmMedium: string | null
      utmCampaign: string | null
    }
  | {
      success: false
      message: string
      fieldErrors: PublicLeadFieldErrors
    } {
  const fieldErrors: PublicLeadFieldErrors = {}
  const name = input.name.trim()
  const phone = input.phone.trim()
  const email = input.email?.trim() || null
  const normalizedPhone = normalizePhone(phone)

  if (!name) {
    fieldErrors.name = 'Introduce tu nombre para que podamos dirigirnos a ti.'
  } else if (name.length > MAX_NAME_LENGTH) {
    fieldErrors.name = `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`
  }

  if (!phone) {
    fieldErrors.phone = 'Introduce un teléfono de contacto.'
  } else if (phone.length > MAX_PHONE_LENGTH) {
    fieldErrors.phone = 'El teléfono es demasiado largo.'
  } else if (!isValidNormalizedPhone(normalizedPhone)) {
    fieldErrors.phone = 'Introduce un teléfono válido, con 9 a 15 dígitos.'
  }

  if (email && email.length > MAX_EMAIL_LENGTH) {
    fieldErrors.email = 'El email es demasiado largo.'
  } else if (email && !isValidEmail(email)) {
    fieldErrors.email = 'Introduce un email válido o deja el campo vacío.'
  }

  if (!input.privacyAccepted) {
    fieldErrors.privacyAccepted = 'Acepta la política de privacidad para enviar la solicitud.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: 'Revisa los datos del formulario.',
      fieldErrors,
    }
  }

  return {
    success: true,
    name,
    phone,
    normalizedPhone,
    email,
    utmSource: sanitizeOptionalText(input.utmSource, MAX_UTM_LENGTH),
    utmMedium: sanitizeOptionalText(input.utmMedium, MAX_UTM_LENGTH),
    utmCampaign: sanitizeOptionalText(input.utmCampaign, MAX_UTM_LENGTH),
  }
}

export function normalizePhone(phone: string) {
  const trimmed = phone.trim()
  const hasInternationalPrefix = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')

  return hasInternationalPrefix ? `+${digits}` : digits
}

function isValidNormalizedPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 15
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitizeOptionalText(value: string | null | undefined, maxLength: number) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  return trimmed.slice(0, maxLength)
}

function subtractDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() - days)
  return copy
}
