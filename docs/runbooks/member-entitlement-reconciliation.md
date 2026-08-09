# Member Entitlement Reconciliation

Fecha: 2026-08-09

## Objetivo

Evitar que una membresia o cuenta de creditos siga apareciendo como vigente cuando su enum persiste como `ACTIVE`, pero su fecha limite ya ha vencido.

La solucion tiene dos defensas complementarias:

1. los read models calculan la vigencia efectiva en cada lectura;
2. un mantenimiento diario reconcilia el estado persistido a `EXPIRED`.

La correccion de lectura es la garantia de producto. El cron reduce drift operativo, pero una caida o retraso del scheduler nunca debe devolver acceso ni mostrar cobertura vencida.

## Contrato temporal

Una `MemberMembership` es efectiva solo cuando:

- `status = ACTIVE`
- `startsAt <= now`
- `endsAt IS NULL` o `endsAt > now`

Una `MemberCreditAccount` es efectiva solo cuando:

- `status = ACTIVE`
- `openedAt <= now`
- `expiresAt IS NULL` o `expiresAt > now`

El limite es exclusivo: cuando `endsAt` o `expiresAt` coincide exactamente con `now`, el entitlement ya esta vencido.

## Mantenimiento programado

Vercel llama una vez al dia a:

```text
GET /api/internal/maintenance/reconcile-entitlements
```

Horario configurado en `vercel.json`: `30 5 * * *` (UTC).

La ruta requiere:

```http
Authorization: Bearer <CRON_SECRET>
```

La operacion es idempotente y solo hace dos transiciones masivas:

- memberships `ACTIVE` con `endsAt <= now` a `EXPIRED`
- cuentas de credito `ACTIVE` con `expiresAt <= now` a `EXPIRED`

No elimina ledger, pagos, usos ni historial. Tampoco activa registros futuros ni decide renovaciones.

## Ejecucion manual

Usar solo para verificacion o recuperacion operativa:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/internal/maintenance/reconcile-entitlements"
```

Respuesta esperada:

```json
{
  "reconciledAt": "2026-08-09T05:30:00.000Z",
  "expiredMemberships": 0,
  "expiredCreditAccounts": 0
}
```

Repetir la llamada debe devolver cero cuando no aparezca drift nuevo.

## Diagnostico

- `401`: falta el bearer correcto.
- `503`: `CRON_SECRET` no esta configurado en el entorno.
- `5xx`: revisar logs de la funcion y conectividad con Postgres; la UI seguira aplicando vigencia efectiva en lectura.
- contadores altos de forma inesperada: inspeccionar primero fechas y origen de las altas; no corregirlas con `db push` ni borrados manuales.

Los cron jobs de Vercel solo se disparan en production. Preview y local se validan con la llamada manual o mediante tests.

## Verificacion

- unit: helpers temporales, read models, consultas de reconciliacion y auth de ruta
- E2E: un socio con registros fisicamente `ACTIVE` pero temporalmente vencidos ve `Sin plan activo` y `Sin creditos activos`
- gates: `pnpm check:reservations` y `pnpm check:foundation`
