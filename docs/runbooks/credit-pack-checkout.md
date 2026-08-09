# Credit pack checkout

## Scope

WellStudio supports one-time purchases of active, public `CreditPack` products. Membership subscriptions, saved cards, refunds and fiscal invoicing are separate product slices.

The checkout is hosted by the payment provider. WellStudio never receives PAN, CVC or authentication challenge data.

## State flow

1. An active member selects a public credit pack.
2. The server reads price, currency, credits and validity from PostgreSQL.
3. WellStudio creates `Payment(PENDING)` and an immutable `PaymentItem` snapshot.
4. The checkout provider creates a hosted session using the local payment ID as idempotency context.
5. The browser leaves WellStudio for checkout.
6. A signed provider event returns independently of the browser.
7. One serializable transaction marks the payment `SUCCEEDED`, creates one `MemberCreditAccount` and appends one `PURCHASE` ledger entry.
8. If the browser reaches the success URL before the signed event, the account view observes the local payment with bounded server refreshes and moves from processing to the terminal state without requiring a manual reload.

The success URL only renders status. It never fulfills the purchase.

The webhook remains the sole source of truth. Browser observation is read-only, is limited to the authenticated member's payment and stops on a terminal state. After the bounded observation window, the UI keeps an honest pending state and offers `Comprobar ahora`; it never assumes success from the redirect alone.

## Modes

### Local deterministic sandbox

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYMENTS_CHECKOUT_MODE=sandbox
```

Sandbox checkout is authenticated and available locally or in a Vercel Preview deployment configured with `PAYMENTS_CHECKOUT_MODE=sandbox`. It is always blocked when `VERCEL_ENV=production`; outside Vercel, `NODE_ENV=production` remains the safety fallback. It does not collect card data or perform a real charge.

Run:

```bash
pnpm test:e2e:payments:sandbox
```

### Stripe

```env
PAYMENTS_CHECKOUT_MODE=stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Use separate Stripe test/live keys and webhook secrets per environment. Never expose either value through a `NEXT_PUBLIC_` variable.

The webhook endpoint must receive the raw request body and verify `stripe-signature` before parsing or persisting the event. Replayed events are expected and safe.

WellStudio listens at:

```text
POST /api/payments/stripe/webhook
```

Subscribe only to `checkout.session.completed` and `checkout.session.expired`. Other signed event types are persisted as safely ignored metadata and return `2xx`.

### Local Stripe test mode

Configure a Stripe test secret key, switch `PAYMENTS_CHECKOUT_MODE=stripe`, and forward signed events with the Stripe CLI:

```bash
stripe listen \
  --events checkout.session.completed,checkout.session.expired \
  --forward-to localhost:3000/api/payments/stripe/webhook
```

Use the temporary `whsec_...` printed by `stripe listen` as `STRIPE_WEBHOOK_SECRET`. Restart the app after changing environment variables. Do not commit either secret.

### Preview and production

Create separate Stripe webhook endpoints and environment-scoped secrets:

```text
Preview test mode: https://<preview-host>/api/payments/stripe/webhook
Production live mode: https://<production-host>/api/payments/stripe/webhook
```

Preview uses `sk_test_...` and its own test webhook secret. Production uses `sk_live_...` and a distinct live webhook secret. Never reuse a local Stripe CLI signing secret in Vercel.

Keep `PAYMENTS_CHECKOUT_MODE=sandbox` in Preview for deterministic E2E. Temporarily switch a dedicated Preview deployment to `stripe` only for the provider smoke, then restore sandbox mode unless the environment is intentionally being used for Stripe QA.

## Database rollout

Apply versioned migrations before enabling checkout in each environment:

```bash
pnpm db:migrate:status
pnpm db:migrate:deploy
pnpm db:migrate:status
```

The migration adds checkout session identity, entitlement snapshots and unique fulfillment by payment. Do not mark it applied unless those objects exist physically.

## Validation

```bash
pnpm check:payments
pnpm test:e2e:payments:sandbox
```

Before production enablement, verify a Stripe test payment, webhook delivery, duplicate event replay, cancellation and account balance. Production migration and live-mode smoke remain explicit operations.

The sandbox E2E also delays provider confirmation deliberately. It verifies that the processing feedback is visible, the webhook-equivalent confirmation updates the balance automatically and a slow confirmation degrades to a manual status check without granting credits early.
