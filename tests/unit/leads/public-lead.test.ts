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
import {
  buildLeadNotificationHtml,
  buildLeadNotificationText,
  createResendLeadNotificationSender,
  type LeadNotificationSender,
} from '@/modules/leads/server/lead-notification'

function createRepository(overrides: Partial<PublicLeadRepository> = {}) {
  return {
    findRecentActiveByNormalizedPhone: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'lead-1' }),
    ...overrides,
  }
}

function createNotifier(overrides: Partial<LeadNotificationSender> = {}) {
  return {
    notifyPublicLeadCaptured: vi.fn().mockResolvedValue(undefined),
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
    const notifier = createNotifier()

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
        notifier,
        now,
      },
    )

    expect(result).toEqual({
      success: true,
      status: 'created',
      message: 'Hemos recibido tu solicitud. Te llamaremos en breve.',
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
    expect(notifier.notifyPublicLeadCaptured).toHaveBeenCalledWith({
      leadId: 'lead-1',
      name: 'Marta',
      phone: '+34 612 345 678',
      email: 'marta@example.com',
      source: PUBLIC_LEAD_SOURCE,
      capturedAt: now,
      utmSource: 'instagram',
      utmMedium: 'social',
      utmCampaign: 'mayo',
    })
  })

  it('returns success without creating another lead when the phone has a recent active lead', async () => {
    const repository = createRepository({
      findRecentActiveByNormalizedPhone: vi.fn().mockResolvedValue({ id: 'existing-lead' }),
    })
    const notifier = createNotifier()

    const result = await createPublicLead(
      {
        name: 'Leo',
        phone: '612 345 678',
        privacyAccepted: true,
      },
      { repository, notifier },
    )

    expect(result).toEqual({
      success: true,
      status: 'deduped',
      message:
        'Ya tenemos una solicitud reciente con este teléfono. Te llamaremos en breve.',
    })
    expect(repository.create).not.toHaveBeenCalled()
    expect(notifier.notifyPublicLeadCaptured).not.toHaveBeenCalled()
  })

  it('ignores honeypot submissions with a neutral success response', async () => {
    const repository = createRepository()
    const notifier = createNotifier()

    const result = await createPublicLead(
      {
        name: 'Bot',
        phone: '612345678',
        privacyAccepted: true,
        honeypot: 'https://spam.example',
      },
      { repository, notifier },
    )

    expect(result).toEqual({
      success: true,
      status: 'spam_ignored',
      message: 'Hemos recibido tu solicitud. Te llamaremos en breve.',
    })
    expect(repository.findRecentActiveByNormalizedPhone).not.toHaveBeenCalled()
    expect(repository.create).not.toHaveBeenCalled()
    expect(notifier.notifyPublicLeadCaptured).not.toHaveBeenCalled()
  })

  it('validates required fields, phone format, optional email and privacy acceptance', async () => {
    const repository = createRepository()
    const notifier = createNotifier()

    const result = await createPublicLead(
      {
        name: '',
        phone: '123',
        email: 'not-an-email',
        privacyAccepted: false,
      },
      { repository, notifier },
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
    expect(notifier.notifyPublicLeadCaptured).not.toHaveBeenCalled()
  })

  it('keeps the lead submission successful when lead notification fails', async () => {
    const repository = createRepository()
    const notifier = createNotifier({
      notifyPublicLeadCaptured: vi.fn().mockRejectedValue(new Error('Resend unavailable')),
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await createPublicLead(
      {
        name: 'Marta',
        phone: '612 345 678',
        privacyAccepted: true,
      },
      {
        repository,
        notifier,
        now: new Date('2026-05-06T12:00:00.000Z'),
      },
    )

    expect(result.success).toBe(true)
    expect(result.success ? result.status : null).toBe('created')
    expect(repository.create).toHaveBeenCalledOnce()
    expect(consoleError).toHaveBeenCalledWith(
      'Lead notification failed after lead creation.',
      expect.any(Error),
    )

    consoleError.mockRestore()
  })

  it('uses a seven-day dedupe window', async () => {
    expect(PUBLIC_LEAD_DEDUPE_WINDOW_DAYS).toBe(7)
  })
})

describe('lead notification email', () => {
  const payload = {
    leadId: 'lead-1',
    name: 'Marta <Test>',
    phone: '+34 612 345 678',
    email: 'marta@example.com',
    source: PUBLIC_LEAD_SOURCE,
    capturedAt: new Date('2026-05-06T12:00:00.000Z'),
    utmSource: 'instagram',
    utmMedium: 'social',
    utmCampaign: 'mayo',
  }

  it('builds text and html payloads with lead details and Madrid timestamp', () => {
    const text = buildLeadNotificationText(payload)
    const html = buildLeadNotificationHtml(payload)

    expect(text).toContain('Nuevo lead desde la web de WellStudio')
    expect(text).toContain('Nombre: Marta <Test>')
    expect(text).toContain('Teléfono: +34 612 345 678')
    expect(text).toContain('Email: marta@example.com')
    expect(text).toContain('Fecha: 6 may 2026, 14:00')
    expect(text).toContain('Lead ID: lead-1')

    expect(html).toContain('Nuevo lead desde la web')
    expect(html).toContain('Marta &lt;Test&gt;')
    expect(html).toContain('Lead ID: lead-1')
  })

  it('sends a Resend request with reply-to when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    const sender = createResendLeadNotificationSender({
      fetch: fetchMock,
      config: {
        apiKey: 'resend-key',
        to: 'miguel.garglez@gmail.com',
        from: 'Wellstudio <noreply@auth.miguelgarglez.com>',
      },
    })

    await sender.notifyPublicLeadCaptured(payload)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer resend-key',
          'Content-Type': 'application/json',
        },
      }),
    )
    const request = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(request).toMatchObject({
      from: 'Wellstudio <noreply@auth.miguelgarglez.com>',
      to: ['miguel.garglez@gmail.com'],
      subject: 'Nuevo lead desde la web de WellStudio',
      reply_to: 'marta@example.com',
    })
    expect(request.text).toContain('Marta <Test>')
    expect(request.html).toContain('Marta &lt;Test&gt;')
  })

  it('skips sending when notification config is incomplete', async () => {
    const fetchMock = vi.fn()
    const logger = {
      warn: vi.fn(),
      error: vi.fn(),
    }
    const sender = createResendLeadNotificationSender({
      fetch: fetchMock,
      logger,
      config: {
        apiKey: undefined,
        to: 'miguel.garglez@gmail.com',
        from: 'Wellstudio <noreply@auth.miguelgarglez.com>',
      },
    })

    await sender.notifyPublicLeadCaptured(payload)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(
      'Lead notification skipped: missing RESEND_API_KEY.',
    )
  })
})
