export type SessionChangeAudience = 'RESERVATION' | 'WAITLIST'

export type SessionChangeEmailEvent = 'SESSION_RESCHEDULED' | 'SESSION_CANCELED'

export type SessionChangeSnapshot = {
  className: string
  coachName: string | null
  locationLabel: string | null
  startsAt: string
  endsAt: string
}

export type SessionChangeNotificationPayload = SessionChangeSnapshot & {
  sessionId: string
  affectedRecordId: string
  audience: SessionChangeAudience
  memberName: string
  previous: SessionChangeSnapshot | null
  reason: string | null
}

const TIME_ZONE = 'Europe/Madrid'

export function buildSessionChangeEmail(input: {
  eventType: SessionChangeEmailEvent
  payload: SessionChangeNotificationPayload
  portalUrl: string
}) {
  const copy = buildEventCopy(input.eventType, input.payload)
  const rows = buildDetailRows(input.eventType, input.payload)

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
      `Revisar mi actividad: ${input.portalUrl}`,
      '',
      `Referencia: ${input.payload.sessionId}`,
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
          <a href="${escapeHtml(input.portalUrl)}" style="display:block;margin:26px 0 0;padding:14px 18px;border-radius:999px;background:#5795cf;color:#ffffff;font-size:15px;font-weight:700;text-align:center;text-decoration:none;">Revisar mi actividad</a>
          <p style="margin:22px 0 0;color:#82796d;font-size:11px;line-height:1.5;">Referencia: ${escapeHtml(input.payload.sessionId)}</p>
        </div>
      </section>
    </main>
  </body>
</html>`,
  }
}

export function parseSessionChangeNotificationPayload(
  value: unknown,
): SessionChangeNotificationPayload {
  if (!isRecord(value)) throw new Error('Session change notification payload is invalid')

  const requiredKeys = [
    'sessionId',
    'affectedRecordId',
    'memberName',
    'className',
    'startsAt',
    'endsAt',
  ] as const

  for (const key of requiredKeys) {
    if (typeof value[key] !== 'string' || value[key].length === 0) {
      throw new Error(`Session change notification payload is missing ${key}`)
    }
  }

  if (value.audience !== 'RESERVATION' && value.audience !== 'WAITLIST') {
    throw new Error('Session change notification payload has invalid audience')
  }
  if (
    !isNullableString(value.coachName) ||
    !isNullableString(value.locationLabel) ||
    !isNullableString(value.reason)
  ) {
    throw new Error('Session change notification payload has invalid optional fields')
  }

  return {
    sessionId: value.sessionId as string,
    affectedRecordId: value.affectedRecordId as string,
    audience: value.audience,
    memberName: value.memberName as string,
    className: value.className as string,
    coachName: value.coachName as string | null,
    locationLabel: value.locationLabel as string | null,
    startsAt: value.startsAt as string,
    endsAt: value.endsAt as string,
    previous: value.previous === null ? null : parseSnapshot(value.previous),
    reason: value.reason as string | null,
  }
}

function buildEventCopy(
  eventType: SessionChangeEmailEvent,
  payload: SessionChangeNotificationPayload,
) {
  const isWaitlist = payload.audience === 'WAITLIST'

  if (eventType === 'SESSION_CANCELED') {
    return {
      eyebrow: 'Cambio en la agenda',
      heading: 'El centro ha cancelado la sesión',
      subject: `Sesión cancelada · ${payload.className}`,
      summary: isWaitlist
        ? 'La sesión en cuya lista de espera estabas se ha cancelado y tu posición ya está cerrada.'
        : 'Tu reserva ya figura cancelada. Si consumió créditos, WellStudio los ha devuelto automáticamente.',
    }
  }

  return {
    eyebrow: 'Agenda actualizada',
    heading: 'Tu sesión ha cambiado',
    subject: `Cambio de sesión · ${payload.className}`,
    summary: isWaitlist
      ? 'Hemos actualizado la sesión en cuya lista de espera estás. Revisa los nuevos datos antes de continuar.'
      : 'Hemos actualizado una sesión que tienes reservada. Tu plaza se mantiene con los nuevos datos.',
  }
}

function buildDetailRows(
  eventType: SessionChangeEmailEvent,
  payload: SessionChangeNotificationPayload,
) {
  const rows: Array<[string, string]> = [
    ['Situación', payload.audience === 'WAITLIST' ? 'Lista de espera' : 'Reserva confirmada'],
  ]

  if (eventType === 'SESSION_RESCHEDULED' && payload.previous) {
    rows.push(['Antes', formatSnapshot(payload.previous)])
    rows.push(['Ahora', formatSnapshot(payload)])
  } else {
    rows.push(['Sesión', formatSnapshot(payload)])
  }

  if (payload.reason) rows.push(['Motivo', payload.reason])
  return rows
}

function formatSnapshot(snapshot: SessionChangeSnapshot) {
  const startsAt = new Date(snapshot.startsAt)
  const endsAt = new Date(snapshot.endsAt)
  const parts = [
    snapshot.className,
    new Intl.DateTimeFormat('es-ES', {
      timeZone: TIME_ZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(startsAt),
    `${formatTime(startsAt)} – ${formatTime(endsAt)}`,
  ]
  if (snapshot.coachName) parts.push(snapshot.coachName)
  if (snapshot.locationLabel) parts.push(snapshot.locationLabel)
  return parts.join(' · ')
}

function parseSnapshot(value: unknown): SessionChangeSnapshot {
  if (!isRecord(value)) throw new Error('Session change previous snapshot is invalid')
  for (const key of ['className', 'startsAt', 'endsAt'] as const) {
    if (typeof value[key] !== 'string' || !value[key]) {
      throw new Error(`Session change previous snapshot is missing ${key}`)
    }
  }
  if (!isNullableString(value.coachName) || !isNullableString(value.locationLabel)) {
    throw new Error('Session change previous snapshot has invalid optional fields')
  }
  return {
    className: value.className as string,
    coachName: value.coachName as string | null,
    locationLabel: value.locationLabel as string | null,
    startsAt: value.startsAt as string,
    endsAt: value.endsAt as string,
  }
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
