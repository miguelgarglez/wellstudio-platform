# Reservation Notification Delivery

Fecha: 2026-08-08
Estado: active operations guide

## Objetivo

WellStudio envia emails transaccionales al socio cuando una reserva se confirma, se cancela, una entrada en waitlist se promociona, el centro cambia materialmente una sesion con demanda o se acerca una reserva del dia siguiente. El dominio es siempre la fuente de verdad: una incidencia de Resend no revierte ni convierte en error una operacion ya confirmada.

## Flujo

1. La mutacion de reserva, sesion o cancelacion valida las reglas de dominio.
2. Dentro de la misma transaccion Prisma persiste el cambio y cada `NotificationJob` con snapshot de destinatario y sesion.
3. La server action responde al socio y programa el primer intento con `after()` de Next.js, siempre despues del commit y sin bloquear el feedback de UI.
4. Resend recibe una `Idempotency-Key` estable. Las reservas usan `reservation_booked/<id>`, `reservation_canceled/<id>` o `waitlist_promoted/<id>`. Los cambios de agenda incluyen evento, sesion, operacion, audiencia y registro afectado para admitir varias reprogramaciones sin duplicar una misma operacion.
5. Cada resultado crea un `NotificationDeliveryAttempt` y actualiza el estado del job.
6. Los fallos quedan en `FAILED` con backoff; un cron protegido crea recordatorios para la agenda de manana y recupera jobs vencidos o locks abandonados.

### Recordatorios del dia siguiente

El cron diario calcula el siguiente dia natural en `Europe/Madrid`, no un intervalo movil de 24 horas. Selecciona reservas `BOOKED` de sesiones futuras `PUBLISHED` o `CLOSED` y crea como maximo un job `RESERVATION_REMINDER` por reserva con la clave `reservation_reminder/<reservationId>`. La insercion usa unicidad atomica en Postgres, por lo que reejecutar el cron es seguro incluso con workers concurrentes.

Antes de contactar con Resend, el dispatcher vuelve a comprobar la reserva y la sesion. Si dejaron de ser validas, el job pasa a `CANCELED` sin crear `NotificationDeliveryAttempt` ni consumir un intento. Esta supresion evita recordatorios obsoletos sin borrar la trazabilidad.

Resend conserva sus claves de idempotencia durante 24 horas. La unicidad permanente en Postgres complementa esa ventana e impide crear dos jobs para el mismo evento.

Referencias oficiales:

- https://resend.com/docs/dashboard/emails/idempotency-keys
- https://vercel.com/docs/cron-jobs
- https://vercel.com/docs/cron-jobs/usage-and-pricing

## Variables

```bash
RESEND_API_KEY=re_xxx
TRANSACTIONAL_NOTIFICATION_FROM="WellStudio <noreply@auth.miguelgarglez.com>"
NEXT_PUBLIC_APP_URL=https://wellstudio.miguelgarglez.com
CRON_SECRET=un-secreto-largo-y-aleatorio
```

`TRANSACTIONAL_NOTIFICATION_FROM` puede omitir temporalmente su valor y usar `LEAD_NOTIFICATION_FROM` como fallback, pero production debe declararla de forma explicita para separar responsabilidades.

Los eventos `SESSION_RESCHEDULED` y `SESSION_CANCELED` requieren la migracion `20260808020000_mig124_session_change_notifications`. Los recordatorios y su estado terminal requieren `20260809140000_mig129_reservation_reminders`. Cada entorno debe aplicar ambas mediante `pnpm db:migrate:deploy` antes de publicar el codigo correspondiente.

Vercel añade `Authorization: Bearer $CRON_SECRET` a la invocacion programada. El endpoint devuelve `401` sin token correcto y `503` cuando el entorno no esta configurado.

## Estados

- `PENDING`: creado y disponible para su primer intento.
- `PROCESSING`: reclamado por un worker; un lock de mas de 10 minutos se considera abandonado.
- `SENT`: Resend confirmo la entrega API y se guardo su message id.
- `FAILED`: el ultimo intento fallo; `availableAt` marca el siguiente reintento.
- `CANCELED`: el dispatcher suprimio deliberadamente un recordatorio obsoleto; no es un fallo ni se reintenta.

El backoff es 5 minutos, 30 minutos, 2 horas, 12 horas y 24 horas. Tras cinco intentos el job conserva el error para inspeccion manual y deja de reclamarse automaticamente.

## Recuperacion

El primer intento se registra como trabajo post-respuesta con `after()`: Vercel mantiene la funcion activa, pero el socio no espera a Resend para ver cerrarse el dialogo. El cron de `vercel.json` se ejecuta una vez al dia para ser compatible con Vercel Hobby y drena un maximo de 100 jobs por ejecucion. Este limite cubre la operacion V1 sin convertir una funcion serverless en un worker sin cota; si el volumen diario se acerca a ese umbral, se debe aumentar la frecuencia o adoptar un consumidor dedicado antes de escalar trafico.

Ejecucion manual segura:

```bash
curl --fail \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://wellstudio.miguelgarglez.com/api/internal/notifications/dispatch
```

La respuesta separa `reminders` y `delivery`. Solo contiene ventanas temporales y contadores `examined`, `scheduled`, `sent`, `failed`, `skipped` y `canceled`; no expone destinatarios ni payloads.

### Recuperacion desde admin

`/admin/notifications` ofrece a `ADMIN` y `STAFF` una bandeja denominada **Entregas**. La vista muestra salud operativa, destinatario, contexto de reserva, ultimo error e historial de intentos, pero nunca expone el JSON del payload ni secretos del proveedor.

La accion **Reintentar ahora** solo aparece para jobs `FAILED`:

1. cambia el job a `PENDING` mediante estado y version esperados
2. crea `AuditLog` con actor, evento, referencia y contador previo
3. responde al operador y ejecuta el envio con `after()`
4. incrementa el numero de intento sin borrar ni renumerar los anteriores

Un reintento manual puede superar los cinco intentos automaticos. Es una excepcion deliberada: la decision humana queda auditada y `NotificationDeliveryAttempt` conserva la secuencia monotona completa. No se debe usar la UI para jobs `SENT`, `PENDING` o `PROCESSING`.

## Consultas operativas

```sql
SELECT "status", count(*)
FROM "NotificationJob"
GROUP BY "status";

SELECT "id", "eventType", "referenceId", "attemptCount", "availableAt", "lastError"
FROM "NotificationJob"
WHERE "status" = 'FAILED'
ORDER BY "updatedAt" DESC;
```

No se debe cambiar un job a `SENT` manualmente ni reiniciar `attemptCount`. Para un fallo ordinario o agotado, usar primero **Entregas**. SQL queda reservado a una operacion break-glass documentada cuando la superficie admin no pueda recuperar el job.

## Alcance actual

Incluido:

- confirmacion de reserva directa
- confirmacion de cancelacion por el socio
- confirmacion de reserva asistida por admin/staff con `Reservation.source = STAFF`
- confirmacion de cancelacion asistida; el motivo operativo queda en auditoria y no se incluye como dato libre en el email
- confirmacion de plaza obtenida por promocion automatica desde waitlist
- aviso por cambio de horario, clase o coach a reservas activas y waitlist activa
- aviso por cancelacion administrativa, incluida la razon operativa
- recordatorio de la agenda del dia siguiente en zona horaria de Madrid
- supresion trazable de recordatorios obsoletos
- HTML responsive y fallback de texto
- idempotencia, auditoria y recuperacion
- monitor admin con filtros, detalle seguro y reintento manual auditable

Pendiente de decision de producto:

- entrada y salida de waitlist
- preferencias de canal y comunicacion
