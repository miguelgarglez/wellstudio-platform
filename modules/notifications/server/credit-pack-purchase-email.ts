export type CreditPackPurchaseNotificationPayload = {
  paymentId: string
  memberName: string
  productName: string
  credits: number
  amount: number
  currency: string
  purchasedAt: string
  expiresAt: string | null
}

const TIME_ZONE = 'Europe/Madrid'

export function buildCreditPackPurchaseEmail(input: {
  payload: CreditPackPurchaseNotificationPayload
  accountUrl: string
}) {
  const amountLabel = formatMoney(input.payload.amount, input.payload.currency)
  const creditsLabel = input.payload.credits === 1 ? '1 reserva' : `${input.payload.credits} reservas`
  const validityLabel = input.payload.expiresAt
    ? `Disponible hasta el ${formatDate(input.payload.expiresAt)}`
    : 'Sin caducidad configurada'

  return {
    subject: `Bono activado · ${input.payload.productName}`,
    text: [
      'Tu bono ya está activo',
      '',
      `Hola ${input.payload.memberName},`,
      'Hemos confirmado el pago y las reservas ya aparecen en tu saldo.',
      '',
      `Bono: ${input.payload.productName}`,
      `Reservas: ${creditsLabel}`,
      `Importe: ${amountLabel}`,
      `Vigencia: ${validityLabel}`,
      '',
      `Ver mi saldo: ${input.accountUrl}`,
      '',
      'Esta confirmación acredita la activación del bono, pero no sustituye una factura fiscal.',
      `Referencia: ${input.payload.paymentId}`,
    ].join('\n'),
    html: `<!doctype html>
<html lang="es">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(`Bono activado · ${input.payload.productName}`)}</title>
  </head>
  <body style="margin:0;background:#f3f0e8;color:#101820;font-family:Arial,sans-serif;">
    <main style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <section style="overflow:hidden;border:1px solid #ddd4c5;border-radius:24px;background:#fffaf3;">
        <div style="padding:28px 28px 24px;background:#294b68;color:#ffffff;">
          <p style="margin:0 0 20px;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;">WellStudio</p>
          <p style="margin:0 0 10px;color:#c9dceb;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">Compra confirmada</p>
          <h1 style="margin:0;font-size:30px;line-height:1.15;">Tu bono ya está activo</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 8px;font-size:18px;font-weight:700;">Hola ${escapeHtml(input.payload.memberName)},</p>
          <p style="margin:0 0 24px;color:#5e5a54;font-size:16px;line-height:1.6;">Hemos confirmado el pago y las reservas ya aparecen en tu saldo.</p>
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tbody>
              ${renderRow('Bono', input.payload.productName)}
              ${renderRow('Reservas', creditsLabel)}
              ${renderRow('Importe', amountLabel)}
              ${renderRow('Vigencia', validityLabel)}
            </tbody>
          </table>
          <a href="${escapeHtml(input.accountUrl)}" style="display:block;margin:26px 0 0;padding:14px 18px;border-radius:999px;background:#5795cf;color:#ffffff;font-size:15px;font-weight:700;text-align:center;text-decoration:none;">Ver mi saldo</a>
          <p style="margin:22px 0 0;color:#6f675d;font-size:12px;line-height:1.6;">Esta confirmación acredita la activación del bono, pero no sustituye una factura fiscal.</p>
          <p style="margin:10px 0 0;color:#82796d;font-size:11px;line-height:1.5;">Referencia: ${escapeHtml(input.payload.paymentId)}</p>
        </div>
      </section>
    </main>
  </body>
</html>`,
  }
}

export function parseCreditPackPurchaseNotificationPayload(
  value: unknown,
): CreditPackPurchaseNotificationPayload {
  if (!isRecord(value)) throw new Error('Credit pack purchase notification payload is invalid')

  for (const key of ['paymentId', 'memberName', 'productName', 'currency', 'purchasedAt'] as const) {
    if (typeof value[key] !== 'string' || value[key].length === 0) {
      throw new Error(`Credit pack purchase notification payload is missing ${key}`)
    }
  }
  if (!Number.isInteger(value.credits) || Number(value.credits) <= 0) {
    throw new Error('Credit pack purchase notification payload has invalid credits')
  }
  if (!Number.isInteger(value.amount) || Number(value.amount) < 0) {
    throw new Error('Credit pack purchase notification payload has invalid amount')
  }
  if (value.expiresAt !== null && typeof value.expiresAt !== 'string') {
    throw new Error('Credit pack purchase notification payload has invalid expiry')
  }

  return {
    paymentId: value.paymentId as string,
    memberName: value.memberName as string,
    productName: value.productName as string,
    credits: value.credits as number,
    amount: value.amount as number,
    currency: value.currency as string,
    purchasedAt: value.purchasedAt as string,
    expiresAt: value.expiresAt as string | null,
  }
}

function renderRow(label: string, value: string) {
  return `<tr>
    <th style="width:32%;padding:13px 0;border-top:1px solid #e9dfd1;color:#31536f;font-size:11px;letter-spacing:.13em;text-align:left;text-transform:uppercase;vertical-align:top;">${escapeHtml(label)}</th>
    <td style="padding:13px 0;border-top:1px solid #e9dfd1;font-size:16px;line-height:1.45;">${escapeHtml(value)}</td>
  </tr>`
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
