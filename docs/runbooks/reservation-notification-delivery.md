# Reservation Notification Delivery

Fecha: 2026-08-08
Estado: active operations guide

## Objetivo

WellStudio envia emails transaccionales al socio cuando una reserva se confirma o se cancela. La reserva es siempre la fuente de verdad: una incidencia de Resend no revierte ni convierte en error una operacion de dominio ya confirmada.

## Flujo

1. La mutacion de reserva o cancelacion valida las reglas de dominio.
2. Dentro de la misma transaccion Prisma persiste la reserva y un `NotificationJob` con snapshot de destinatario y sesion.
3. La server action responde al socio y programa el primer intento con `after()` de Next.js, siempre despues del commit y sin bloquear el feedback de UI.
4. Resend recibe una `Idempotency-Key` estable con formato `reservation_booked/<id>` o `reservation_canceled/<id>`.
5. Cada resultado crea un `NotificationDeliveryAttempt` y actualiza el estado del job.
6. Los fallos quedan en `FAILED` con backoff; un cron protegido recupera jobs vencidos o locks abandonados.

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

Vercel añade `Authorization: Bearer $CRON_SECRET` a la invocacion programada. El endpoint devuelve `401` sin token correcto y `503` cuando el entorno no esta configurado.

## Estados

- `PENDING`: creado y disponible para su primer intento.
- `PROCESSING`: reclamado por un worker; un lock de mas de 10 minutos se considera abandonado.
- `SENT`: Resend confirmo la entrega API y se guardo su message id.
- `FAILED`: el ultimo intento fallo; `availableAt` marca el siguiente reintento.

El backoff es 5 minutos, 30 minutos, 2 horas, 12 horas y 24 horas. Tras cinco intentos el job conserva el error para inspeccion manual y deja de reclamarse automaticamente.

## Recuperacion

El primer intento se registra como trabajo post-respuesta con `after()`: Vercel mantiene la funcion activa, pero el socio no espera a Resend para ver cerrarse el dialogo. El cron de `vercel.json` se ejecuta una vez al dia para ser compatible con Vercel Hobby. En planes Pro puede aumentarse la frecuencia sin cambiar el endpoint.

Ejecucion manual segura:

```bash
curl --fail \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://wellstudio.miguelgarglez.com/api/internal/notifications/dispatch
```

La respuesta solo contiene contadores `examined`, `sent`, `failed` y `skipped`; no expone destinatarios ni payloads.

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

No se debe cambiar un job a `SENT` manualmente. Para reintentar un fallo agotado, revisar primero la causa y actualizarlo a `FAILED`, `attemptCount = 0` y `availableAt = now()` mediante una operacion break-glass documentada.

## Alcance actual

Incluido:

- confirmacion de reserva directa
- confirmacion de cancelacion por el socio
- HTML responsive y fallback de texto
- idempotencia, auditoria y recuperacion

Pendiente de decision de producto:

- recordatorios previos
- entrada, salida y promocion de waitlist
- preferencias de comunicacion
- panel admin de observabilidad
