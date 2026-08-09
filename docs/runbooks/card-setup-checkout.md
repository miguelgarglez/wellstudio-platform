# Card setup checkout

## Scope

Authenticated members can link a payment method through hosted Stripe Checkout in `mode: 'setup'`. WellStudio never receives PAN, CVC or 3DS challenge data. Only provider references and display metadata (`brand`, `last4`, expiry) are persisted on `Card`.

This slice does not charge the card, open subscriptions, expose Customer Portal or change credit-pack Checkout.

## State flow

1. An active member starts linking from `Cuenta`.
2. WellStudio creates `Payment(CARD_SETUP, PENDING, amount=0)`.
3. The checkout provider creates a hosted setup session using the local payment ID as metadata.
4. The browser leaves WellStudio for the hosted form.
5. A signed provider event returns independently of the browser.
6. One serializable transaction marks the payment `SUCCEEDED`, upserts the `Card` by `provider + providerPaymentMethodId`, makes it the sole default for the member and links `Payment.cardId`.
7. If the browser reaches the success URL before the signed event, the account view observes the local `CARD_SETUP` payment with bounded refreshes and never invents success from the redirect alone.

Replay of the same provider event is idempotent through `PaymentEvent(provider, providerEventId)`.

## Modes

### Local deterministic sandbox

```env
PAYMENTS_CHECKOUT_MODE=sandbox
```

Sandbox card linking is available locally or in Preview when sandbox mode is enabled. It never collects real card data.

Run:

```bash
pnpm test:e2e:payments:sandbox
```

### Stripe

Uses the same `PAYMENTS_CHECKOUT_MODE=stripe`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` rails as credit-pack Checkout. Subscribe the webhook to `checkout.session.completed` and `checkout.session.expired`; setup sessions are distinguished by `mode=setup`.

Local forwarding:

```bash
stripe listen \
  --events checkout.session.completed,checkout.session.expired \
  --forward-to localhost:3000/api/payments/stripe/webhook
```

## Safety

- Production must never use sandbox mode for real customers.
- Preview should keep sandbox for deterministic E2E unless intentionally switched to Stripe test for a provider smoke.
- Do not enable Stripe live mode without an explicit Production go-live decision.
