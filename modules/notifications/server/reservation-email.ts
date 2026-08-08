export type ReservationNotificationPayload = {
  reservationId: string
  memberName: string
  className: string
  coachName: string | null
  locationLabel: string | null
  startsAt: string
  endsAt: string
}

export type ReservationEmailEvent =
  | 'RESERVATION_BOOKED'
  | 'RESERVATION_CANCELED'
  | 'WAITLIST_PROMOTED'

const TIME_ZONE = 'Europe/Madrid'

export function buildReservationEmail(input: {
  eventType: ReservationEmailEvent
  payload: ReservationNotificationPayload
  portalUrl: string
}) {
  const copy = buildEventCopy(input.eventType, input.payload.className)
  const rows = buildDetailRows(input.payload)

  return {
    subject: copy.subject,
    text: [
      copy.heading,
      '',
      `Hola ${input.payload.memberName},`,
      copy.summary,
      '',
      ...rows.map(([label, value]) => `${label}: ${value}`),
      '',
      `Ver mis reservas: ${input.portalUrl}`,
      '',
      `Referencia: ${input.payload.reservationId}`,
    ].join('\n'),
    html: `<!doctype html>
<html lang="es">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(copy.subject)}</title>
  </head>
  <body style="margin:0;background:#f3f0e8;color:#101820;font-family:Arial,sans-serif;">
    <main style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <section style="overflow:hidden;border:1px solid #ddd4c5;border-radius:24px;background:#fffaf3;">
        <div style="padding:28px 28px 24px;background:#294b68;color:#ffffff;">
          <p style="margin:0 0 20px;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;">WellStudio</p>
          <p style="margin:0 0 10px;color:#c9dceb;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">${escapeHtml(copy.eyebrow)}</p>
          <h1 style="margin:0;font-size:30px;line-height:1.15;">${escapeHtml(copy.heading)}</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 8px;font-size:18px;font-weight:700;">Hola ${escapeHtml(input.payload.memberName)},</p>
          <p style="margin:0 0 24px;color:#5e5a54;font-size:16px;line-height:1.6;">${escapeHtml(copy.summary)}</p>
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tbody>
              ${rows.map(([label, value]) => `<tr>
                <th style="width:32%;padding:13px 0;border-top:1px solid #e9dfd1;color:#31536f;font-size:11px;letter-spacing:.13em;text-align:left;text-transform:uppercase;vertical-align:top;">${escapeHtml(label)}</th>
                <td style="padding:13px 0;border-top:1px solid #e9dfd1;font-size:16px;line-height:1.45;">${escapeHtml(value)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          <a href="${escapeHtml(input.portalUrl)}" style="display:block;margin:26px 0 0;padding:14px 18px;border-radius:999px;background:#5795cf;color:#ffffff;font-size:15px;font-weight:700;text-align:center;text-decoration:none;">Ver mis reservas</a>
          <p style="margin:22px 0 0;color:#82796d;font-size:11px;line-height:1.5;">Referencia: ${escapeHtml(input.payload.reservationId)}</p>
        </div>
      </section>
    </main>
  </body>
</html>`,
  }
}

function buildEventCopy(eventType: ReservationEmailEvent, className: string) {
  switch (eventType) {
    case 'RESERVATION_BOOKED':
      return {
        eyebrow: 'Reserva confirmada',
        heading: 'Tu reserva está confirmada',
        subject: `Reserva confirmada · ${className}`,
        summary: 'Ya tienes tu plaza. Guarda este email como referencia.',
      }
    case 'RESERVATION_CANCELED':
      return {
        eyebrow: 'Cancelación confirmada',
        heading: 'Tu reserva se ha cancelado',
        subject: `Reserva cancelada · ${className}`,
        summary: 'La plaza se ha liberado y tu portal ya refleja el cambio.',
      }
    case 'WAITLIST_PROMOTED':
      return {
        eyebrow: 'Promoción desde waitlist',
        heading: 'Has conseguido plaza',
        subject: `Ya tienes plaza · ${className}`,
        summary:
          'Se ha liberado una plaza y tu waitlist se ha convertido automáticamente en reserva.',
      }
  }
}

export function parseReservationNotificationPayload(
  value: unknown,
): ReservationNotificationPayload {
  if (!isRecord(value)) throw new Error('Reservation notification payload is invalid')

  const requiredKeys = [
    'reservationId',
    'memberName',
    'className',
    'startsAt',
    'endsAt',
  ] as const

  for (const key of requiredKeys) {
    if (typeof value[key] !== 'string' || value[key].length === 0) {
      throw new Error(`Reservation notification payload is missing ${key}`)
    }
  }

  if (!isNullableString(value.coachName) || !isNullableString(value.locationLabel)) {
    throw new Error('Reservation notification payload has invalid optional fields')
  }

  return {
    reservationId: value.reservationId as string,
    memberName: value.memberName as string,
    className: value.className as string,
    coachName: value.coachName as string | null,
    locationLabel: value.locationLabel as string | null,
    startsAt: value.startsAt as string,
    endsAt: value.endsAt as string,
  }
}

function buildDetailRows(payload: ReservationNotificationPayload) {
  const date = new Date(payload.startsAt)
  const endsAt = new Date(payload.endsAt)
  const rows: Array<[string, string]> = [
    ['Clase', payload.className],
    [
      'Fecha',
      new Intl.DateTimeFormat('es-ES', {
        timeZone: TIME_ZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(date),
    ],
    [
      'Horario',
      `${formatTime(date)} – ${formatTime(endsAt)}`,
    ],
  ]

  if (payload.coachName) rows.push(['Coach', payload.coachName])
  if (payload.locationLabel) rows.push(['Espacio', payload.locationLabel])

  return rows
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown) {
  return value === null || typeof value === 'string'
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
