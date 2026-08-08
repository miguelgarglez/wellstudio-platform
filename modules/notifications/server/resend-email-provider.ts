const RESEND_SEND_EMAIL_ENDPOINT = 'https://api.resend.com/emails'
const REQUEST_TIMEOUT_MS = 8_000

export type TransactionalEmailMessage = {
  recipient: string
  subject: string
  text: string
  html: string
  idempotencyKey: string
}

export type TransactionalEmailSender = {
  send(message: TransactionalEmailMessage): Promise<{ providerMessageId: string }>
}

export function createResendTransactionalEmailSender(
  config: {
    apiKey?: string
    from?: string
  } = {
    apiKey: process.env.RESEND_API_KEY,
    from:
      process.env.TRANSACTIONAL_NOTIFICATION_FROM ??
      process.env.LEAD_NOTIFICATION_FROM,
  },
  fetchImpl: typeof fetch = fetch,
): TransactionalEmailSender {
  return {
    async send(message) {
      if (!config.apiKey || !config.from) {
        throw new Error(
          'Transactional email is not configured: missing RESEND_API_KEY or TRANSACTIONAL_NOTIFICATION_FROM.',
        )
      }

      const response = await fetchImpl(RESEND_SEND_EMAIL_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': message.idempotencyKey,
        },
        body: JSON.stringify({
          from: config.from,
          to: [message.recipient],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      if (!response.ok) {
        throw new Error(`Resend returned ${response.status} while sending transactional email.`)
      }

      const body = (await response.json()) as { id?: unknown }

      if (typeof body.id !== 'string' || !body.id) {
        throw new Error('Resend returned a successful response without an email id.')
      }

      return { providerMessageId: body.id }
    },
  }
}

export const resendTransactionalEmailSender =
  createResendTransactionalEmailSender()
