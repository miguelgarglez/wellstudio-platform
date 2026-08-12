# Stripe Preview rollout (test mode)

Fecha: 2026-08-10  
Estado: validated (test mode)  
Ticket: `MIG-134`

## Objetivo

Habilitar Stripe Checkout en **test mode** sobre el entorno Preview de Vercel, sin tocar Production ni live mode.

## Host estable

- Preview custom domain: `https://preview-wellstudio.miguelgarglez.com`
- Webhook: `https://preview-wellstudio.miguelgarglez.com/api/payments/stripe/webhook`
- Production custom domain (no usar aqui): `https://wellstudio.miguelgarglez.com`

No reutilizar un `whsec` de `stripe listen` local en Vercel. Preview y Production deben tener endpoints y secretos distintos.

## Variables Preview

Configurar solo en el entorno `Preview`:

| Variable | Valor esperado |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://preview-wellstudio.miguelgarglez.com` |
| `PAYMENTS_CHECKOUT_MODE` | `sandbox` por defecto; `stripe` solo durante smoke |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` del endpoint Preview |

Tras cambiar variables, redesplegar Preview para que el runtime las cargue.

Comprobar con `vercel env pull` que `STRIPE_*` no queden vacias (el listing de Vercel puede mostrar la key aunque el valor sea `""`). Si el smoke se queda en "Preparando checkout…", lo primero es validar el secret key contra la API de Stripe en test mode.

## Deployment Protection

Preview necesita ser alcanzable por Stripe.

Estado operativo actual (`MIG-134`):

- `ssoProtection` del proyecto quedó en `null` para permitir webhooks firmados en Preview
- verificar con un POST sin firma: debe devolver `400` del handler de pagos, no `401`/`302` de Vercel Auth

Si en el futuro se reactiva Vercel Authentication, usar Protection Bypass for Automation y anadir `?x-vercel-protection-bypass=...` a la URL del webhook. No documentar el secreto.

Custom domains no siempre quedan excluidos en la practica; verificar con:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST 'https://preview-wellstudio.miguelgarglez.com/api/payments/stripe/webhook' \
  -H 'content-type: application/json' \
  -d '{}'
```

Sin firma Stripe, el handler debe responder `400` (firma invalida), no `401` de SSO.

## Webhook Stripe (test)

Eventos:

- `checkout.session.completed`
- `checkout.session.expired`

Cubren compra de bonos (`mode=payment`) y vinculacion de tarjeta (`mode=setup`).

## Smoke provider

1. Confirmar migraciones sandbox al dia: `pnpm db:migrate:status`
2. Poner Preview en `PAYMENTS_CHECKOUT_MODE=stripe` y redesplegar
3. Comprar un bono de prueba o vincular tarjeta desde Preview
4. Verificar `Payment -> SUCCEEDED`, ledger/card e idempotencia de replay
5. Restaurar `PAYMENTS_CHECKOUT_MODE=sandbox` y redesplegar

### Evidencia `MIG-134` (2026-08-10)

- Host: `https://preview-wellstudio.miguelgarglez.com`
- Webhook endpoint (test): un unico endpoint activo hacia `/api/payments/stripe/webhook`
- POST sin firma al webhook: `400` (handler de pagos; no SSO)
- Smoke: compra de `E2E Bono Checkout` con tarjeta test `4242…`
- Resultado: redirect `checkout=success`, UI "Bono activado", saldo +6 creditos
- DB: `Payment.status=SUCCEEDED`, `PaymentEvent` `checkout.session.completed` `PROCESSED`, credit account `ACTIVE`
- Replay del mismo `providerEventId`: sigue habiendo un solo evento procesado
- Tras el smoke, Preview volvio a `PAYMENTS_CHECKOUT_MODE=sandbox`

## Localhost (test mode)

Para smoke local, usa secretos **locales**, no los de Preview.

1. En `.env.local` (no commitear):
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
   - `PAYMENTS_CHECKOUT_MODE=stripe` (vuelve a `sandbox` cuando no estes probando Stripe)
   - `STRIPE_SECRET_KEY` = test key del Stripe CLI (`test_mode_api_key`)
   - `STRIPE_WEBHOOK_SECRET` = `whsec` de **esta** sesion de `stripe listen` (no reutilizar el `whsec` de Preview)
2. Terminal A: `pnpm dev`
3. Terminal B:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
   ```
4. Si reinicias `stripe listen`, el signing secret puede cambiar: actualiza `STRIPE_WEBHOOK_SECRET` en `.env.local` y reinicia `pnpm dev`.
5. Smoke: comprar bono / vincular tarjeta en `http://localhost:3000` con tarjeta de prueba Stripe.

No mezclar: Preview `whsec` != local `stripe listen` `whsec`.

## Seguridad

- Nunca escribir secretos en el repo, Linear o runbooks
- Nunca poner `sk_live_` / webhook live en Preview
- Production go-live es una operacion separada y explicita: [stripe-production-golive.md](./stripe-production-golive.md)
- Mantener un solo webhook Preview; endpoints duplicados al mismo URL pueden generar entregas extras (la idempotencia del dominio debe absorberlas)
