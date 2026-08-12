# Stripe Production go-live (live mode)

Fecha: 2026-08-12  
Estado: runbook — ejecutar solo con decisión explícita de go-live  
Ticket epic: Gym go-live & handoff  
Relacionados:

- [stripe-preview-rollout.md](./stripe-preview-rollout.md) (test mode / Preview)
- [credit-pack-checkout.md](./credit-pack-checkout.md)
- [card-setup-checkout.md](./card-setup-checkout.md)
- [gym-onboarding-handoff.md](./gym-onboarding-handoff.md)

## Objetivo

Habilitar Stripe Checkout en **live mode** sobre Vercel **Production**, sin mezclar secretos live en Preview ni localhost.

## Reglas duras

- Preview: solo `sk_test_…` / webhook test (ver rollout Preview)
- Production: solo `sk_live_…` / webhook live
- Nunca reutilizar `whsec` de `stripe listen` local en Vercel
- Nunca documentar secretos en el repo, Linear o este runbook
- No activar live sin Gate de [gym-onboarding-handoff.md](./gym-onboarding-handoff.md) en verde
- Si el smoke live falla: volver a asignación staff de bonos/membresías; no apagar reservas

## Host Production

Ajustar al dominio final del intake (ejemplo actual de staging propio):

- App: `https://wellstudio.miguelgarglez.com` (o dominio del gym)
- Webhook: `https://<production-host>/api/payments/stripe/webhook`
- Alias Vercel de respaldo si aplica: `https://wellstudio-platform.vercel.app`

## Variables Production

Solo entorno `Production` en Vercel:

| Variable | Valor esperado |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL canónica Production |
| `PAYMENTS_CHECKOUT_MODE` | `stripe` cuando se active cobro real |
| `STRIPE_SECRET_KEY` | `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` del endpoint **live** Production |

Tras cambiar variables: redesplegar Production para que el runtime las cargue.

Comprobar que `STRIPE_*` no queden vacías (`vercel env pull` / dashboard). Listing con key presente y valor `""` es un fallo habitual.

## Webhook Stripe (live)

Crear endpoint **nuevo** en el Dashboard Stripe (modo live), distinto del de Preview:

- URL: `https://<production-host>/api/payments/stripe/webhook`
- Eventos:
  - `checkout.session.completed`
  - `checkout.session.expired`

Cubren compra de bonos (`mode=payment`) y vinculación de tarjeta (`mode=setup`).

Verificar alcanzabilidad (sin firma debe fallar el handler de pagos, no auth de Vercel):

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST 'https://<production-host>/api/payments/stripe/webhook' \
  -H 'content-type: application/json' \
  -d '{}'
```

Esperado: `400` (firma inválida), no `401`/`302` de protección Vercel.

Si Production usa Deployment Protection, configurar bypass de automatización para el webhook o limitar SSO a lo necesario. No escribir el secreto de bypass en docs.

## Preflight

1. Migraciones Production al día: `pnpm db:migrate:status` / `pnpm db:migrate:deploy` con `DIRECT_URL` de prod (según runbook Prisma).
2. Auth prod OK (register / confirm / reset) con SMTP final.
3. Al menos un `CreditPack` activo y público con precio real.
4. Cuenta socio piloto con consentimiento a un cobro real pequeño.
5. Gym informado del plan B: staff puede asignar bono a mano.

## Smoke live (Wave 2)

1. Confirmar `PAYMENTS_CHECKOUT_MODE=stripe` + `sk_live` en Production y redesplegar.
2. Login como socio piloto → Cuenta → comprar bono (importe real acordado).
3. Completar Checkout Stripe live.
4. Verificar:
   - redirect / UI de éxito (o observación de confirmación)
   - créditos en Cuenta
   - `Payment` `SUCCEEDED` + `PaymentEvent` procesado
   - email de confirmación de compra (sin `[DEV]`)
5. Vincular o actualizar tarjeta (setup) y ver marca/last4 en Cuenta.
6. Replay opcional del mismo evento: debe seguir idempotente (un solo fulfillment).
7. En `/admin` Cobros: localizar el pago.
8. Anotar evidencia en Linear (sin secretos ni PAN).

## Rollback

Operativo (producto sigue vivo):

1. Staff asigna créditos / membership a mano.
2. Opcional: poner `PAYMENTS_CHECKOUT_MODE=sandbox` en Production **solo** si se quiere cortar checkout online de inmediato (los socios verán flujo sandbox; preferible evitar en prod real — mejor desactivar packs públicos o comunicar “compra en mostrador”).
3. Preferido ante incidente de cobro: desactivar packs públicos en admin y usar asignación staff; mantener `stripe` mode para no mezclar sandbox con usuarios reales.

Técnico:

- Rotar / desactivar endpoint webhook live si hay abuso.
- Revertir deployment Vercel si el fallo es de release, no de Stripe.

## Separación Preview vs Production

| Entorno | Keys | Webhook | Checkout mode habitual |
|---|---|---|---|
| Preview | `sk_test` | test Preview URL | `sandbox` (smoke puntual `stripe`) |
| Production | `sk_live` | live Production URL | `stripe` tras go-live |

## Seguridad

- Un solo webhook live activo hacia Production
- Gym: Dashboard; nosotros: API keys
- No compartir `sk_live` por chat / Linear
- Tras el smoke, no dejar tarjetas de prueba en live (live no acepta test cards)
