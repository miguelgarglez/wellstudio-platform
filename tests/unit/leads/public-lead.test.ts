import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {},
}))

import {
  createPublicLead,
  normalizePhone,
  PUBLIC_LEAD_DEDUPE_WINDOW_DAYS,
  PUBLIC_LEAD_PRIVACY_POLICY_VERSION,
  PUBLIC_LEAD_SOURCE,
  type PublicLeadRepository,
} from '@/modules/leads/server/public-lead'

function createRepository(overrides: Partial<PublicLeadRepository> = {}) {
  return {
    findRecentActiveByNormalizedPhone: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'lead-1' }),
    ...overrides,
  }
}

describe('normalizePhone', () => {
  it('keeps international prefix and removes formatting characters', () => {
    expect(normalizePhone('+34 612 345 678')).toBe('+34612345678')
    expect(normalizePhone('612-345-678')).toBe('612345678')
  })
})

describe('createPublicLead', () => {
  it('creates a new public lead with normalized phone, privacy audit and attribution fields', async () => {
    const now = new Date('2026-05-06T12:00:00.000Z')
    const repository = createRepository()

    const result = await createPublicLead(
      {
        name: ' Marta ',
        phone: '+34 612 345 678',
        email: ' marta@example.com ',
        privacyAccepted: true,
        utmSource: 'instagram',
        utmMedium: 'social',
        utmCampaign: 'mayo',
      },
      {
        repository,
        now,
      },
    )

    expect(result).toEqual({
      success: true,
      status: 'created',
      message: 'Solicitud recibida. El equipo de WellStudio te contactará por teléfono.',
    })
    expect(repository.findRecentActiveByNormalizedPhone).toHaveBeenCalledWith({
      normalizedPhone: '+34612345678',
      since: new Date('2026-04-29T12:00:00.000Z'),
    })
    expect(repository.create).toHaveBeenCalledWith({
      firstName: 'Marta',
      phone: '+34 612 345 678',
      normalizedPhone: '+34612345678',
      email: 'marta@example.com',
      source: PUBLIC_LEAD_SOURCE,
      utmSource: 'instagram',
      utmMedium: 'social',
      utmCampaign: 'mayo',
      privacyAcceptedAt: now,
      privacyPolicyVersion: PUBLIC_LEAD_PRIVACY_POLICY_VERSION,
    })
  })

  it('returns success without creating another lead when the phone has a recent active lead', async () => {
    const repository = createRepository({
      findRecentActiveByNormalizedPhone: vi.fn().mockResolvedValue({ id: 'existing-lead' }),
    })

    const result = await createPublicLead(
      {
        name: 'Leo',
        phone: '612 345 678',
        privacyAccepted: true,
      },
      { repository },
    )

    expect(result.success).toBe(true)
    expect(result.success ? result.status : null).toBe('deduped')
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('ignores honeypot submissions with a neutral success response', async () => {
    const repository = createRepository()

    const result = await createPublicLead(
      {
        name: 'Bot',
        phone: '612345678',
        privacyAccepted: true,
        honeypot: 'https://spam.example',
      },
      { repository },
    )

    expect(result.success).toBe(true)
    expect(result.success ? result.status : null).toBe('spam_ignored')
    expect(repository.findRecentActiveByNormalizedPhone).not.toHaveBeenCalled()
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('validates required fields, phone format, optional email and privacy acceptance', async () => {
    const repository = createRepository()

    const result = await createPublicLead(
      {
        name: '',
        phone: '123',
        email: 'not-an-email',
        privacyAccepted: false,
      },
      { repository },
    )

    expect(result).toEqual({
      success: false,
      message: 'Revisa los datos del formulario.',
      fieldErrors: {
        name: 'Introduce tu nombre para que podamos dirigirnos a ti.',
        phone: 'Introduce un teléfono válido, con 9 a 15 dígitos.',
        email: 'Introduce un email válido o deja el campo vacío.',
        privacyAccepted: 'Acepta la política de privacidad para enviar la solicitud.',
      },
    })
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('uses a seven-day dedupe window', async () => {
    expect(PUBLIC_LEAD_DEDUPE_WINDOW_DAYS).toBe(7)
  })
})
