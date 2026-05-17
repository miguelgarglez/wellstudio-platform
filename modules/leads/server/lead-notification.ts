export const LEAD_NOTIFICATION_TIME_ZONE = 'Europe/Madrid'

const RESEND_SEND_EMAIL_ENDPOINT = 'https://api.resend.com/emails'
const EMAIL_SUBJECT = 'Nuevo lead desde la web de WellStudio'

export type LeadNotificationPayload = {
  leadId: string
  name: string
  phone: string
  email: string | null
  source: string
  capturedAt: Date
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
}

export type LeadNotificationSender = {
  notifyPublicLeadCaptured(payload: LeadNotificationPayload): Promise<void>
}

type ResendLeadNotificationConfig = {
  apiKey: string | undefined
  to: string | undefined
  from: string | undefined
}

type ResendLeadNotificationDependencies = {
  fetch?: typeof fetch
  logger?: Pick<typeof console, 'error' | 'warn'>
  config?: ResendLeadNotificationConfig
}

export function createResendLeadNotificationSender(
  dependencies: ResendLeadNotificationDependencies = {},
): LeadNotificationSender {
  const fetchImpl = dependencies.fetch ?? fetch
  const logger = dependencies.logger ?? console
  const config = dependencies.config ?? {
    apiKey: process.env.RESEND_API_KEY,
    to: process.env.LEAD_NOTIFICATION_TO,
    from: process.env.LEAD_NOTIFICATION_FROM,
  }

  return {
    async notifyPublicLeadCaptured(payload) {
      const missingConfig = getMissingConfig(config)

      if (missingConfig.length > 0) {
        logger.warn(
          `Lead notification skipped: missing ${missingConfig.join(', ')}.`,
        )
        return
      }

      const response = await fetchImpl(RESEND_SEND_EMAIL_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildResendEmailRequest(payload, config)),
      })

      if (!response.ok) {
        logger.error(
          `Lead notification failed: Resend returned ${response.status}.`,
        )
      }
    },
  }
}

export const resendLeadNotificationSender = createResendLeadNotificationSender()

function getMissingConfig(config: ResendLeadNotificationConfig) {
  return [
    ['RESEND_API_KEY', config.apiKey],
    ['LEAD_NOTIFICATION_TO', config.to],
    ['LEAD_NOTIFICATION_FROM', config.from],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key)
}

function buildResendEmailRequest(
  payload: LeadNotificationPayload,
  config: ResendLeadNotificationConfig,
) {
  return {
    from: config.from,
    to: [config.to],
    subject: EMAIL_SUBJECT,
    text: buildLeadNotificationText(payload),
    html: buildLeadNotificationHtml(payload),
    reply_to: payload.email ?? undefined,
  }
}

export function buildLeadNotificationText(payload: LeadNotificationPayload) {
  const lines = [
    EMAIL_SUBJECT,
    '',
    `Nombre: ${payload.name}`,
    `Teléfono: ${payload.phone}`,
    `Email: ${payload.email ?? 'No indicado'}`,
    `Origen: ${payload.source}`,
    `Fecha: ${formatCapturedAt(payload.capturedAt)}`,
    `UTM source: ${payload.utmSource ?? 'No indicado'}`,
    `UTM medium: ${payload.utmMedium ?? 'No indicado'}`,
    `UTM campaign: ${payload.utmCampaign ?? 'No indicado'}`,
    '',
    'Contactar por teléfono. El email es opcional y no implica suscripción comercial.',
    '',
    `Lead ID: ${payload.leadId}`,
  ]

  return lines.join('\n')
}

export function buildLeadNotificationHtml(payload: LeadNotificationPayload) {
  const rows = [
    ['Nombre', payload.name],
    ['Teléfono', payload.phone],
    ['Email', payload.email ?? 'No indicado'],
    ['Origen', payload.source],
    ['Fecha', formatCapturedAt(payload.capturedAt)],
    ['UTM source', payload.utmSource ?? 'No indicado'],
    ['UTM medium', payload.utmMedium ?? 'No indicado'],
    ['UTM campaign', payload.utmCampaign ?? 'No indicado'],
  ]

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f4f0e7;color:#0f1720;font-family:Arial,sans-serif;">
    <main style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <section style="border:1px solid #ded4c4;border-radius:24px;background:#fffaf2;padding:28px;">
        <p style="margin:0 0 12px;color:#2e4c68;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">WellStudio</p>
        <h1 style="margin:0 0 20px;font-size:28px;line-height:1.1;">Nuevo lead desde la web</h1>
        <table style="width:100%;border-collapse:collapse;">
          <tbody>
            ${rows
              .map(
                ([label, value]) => `<tr>
                  <th style="width:32%;padding:12px 0;border-top:1px solid #eee4d6;color:#2e4c68;font-size:12px;letter-spacing:.12em;text-align:left;text-transform:uppercase;vertical-align:top;">${escapeHtml(label)}</th>
                  <td style="padding:12px 0;border-top:1px solid #eee4d6;font-size:16px;line-height:1.5;">${escapeHtml(value)}</td>
                </tr>`,
              )
              .join('')}
          </tbody>
        </table>
        <p style="margin:22px 0 0;padding:14px 16px;border-radius:16px;background:#eef5fb;color:#27445f;font-size:14px;line-height:1.6;">Contactar por teléfono. El email es opcional y no implica suscripción comercial.</p>
        <p style="margin:20px 0 0;color:#7a7166;font-size:12px;">Lead ID: ${escapeHtml(payload.leadId)}</p>
      </section>
    </main>
  </body>
</html>`
}

function formatCapturedAt(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: LEAD_NOTIFICATION_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
