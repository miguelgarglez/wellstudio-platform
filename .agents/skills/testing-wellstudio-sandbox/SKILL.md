---
name: testing-wellstudio-sandbox
description: Run authorized WellStudio sandbox member flows with real fixtures, private credentials, and latency evidence.
---

# Sandbox runtime validation

Use only explicitly authorized sandbox projects and dedicated E2E accounts. Never print environment values, SQL parameters, cookies, payloads, or credentials. Do not migrate/reset the database or run historical repeated-cycle tests without separate authorization.

## Devin Secrets Needed

Private `.env.local` / `.env.e2e.local` must supply `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `E2E_MEMBER_EMAIL`, and `E2E_MEMBER_PASSWORD`; gate flags include `E2E_AUTH_SANDBOX=true`. Admin flows additionally need `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`. Verify names against current env helpers/runbooks. Keep files ignored and mode 600.

## Setup

- Follow repo blueprint for Node/pnpm and dependencies. Generate Prisma without applying migrations if needed.
- Verify both runtime environment and built browser chunks target the authorized Supabase ref, not placeholders or production.
- Preserve TLS validation. Use a trusted Supabase root CA where required, including `NODE_EXTRA_CA_CERTS` for Node. Do not set TLS verification off.
- Build/check commands and the server must not overlap access to `.next`.
- Prefer the documented standalone launcher for `output: standalone`, with required public/static assets in place. `next start` may serve but emits a launcher warning; disclose it.
- Browser requests need `x-wellstudio-sandbox-fixtures: 1`, set by Playwright config or CDP context extra headers.
- Prepare fixtures through `pnpm sandbox:scenario member-reservations-flow`. Targeted `cancelable-reservation-state` prepares promotion. Do not replace canonical helpers with ad-hoc SQL mutations.
- Set `PLAYWRIGHT_BASE_URL=http://localhost:3001` when gates should reuse the local server. Run auth/reservations suites serialized with `--workers=1 --retries=0`; preserve repository assertions and timeouts.

## Evidence

- Maximize browser before a fresh annotated recording.
- For origin-sensitive auth validation, create a genuinely new browser context and verify zero cookies/storage origins before login. Reusing a context with cookies on both localhost and the bind host can mask an incorrect absolute redirect. Start at `/login` without `redirectTo` to exercise `/auth/after-login`; record status, Location, final document origin and cookie domains only, never cookie values.
- Reproduce standalone host differences with bind `HOSTNAME=0.0.0.0` and browser URL `http://localhost:3001`. Check member `/app`, admin `/admin`, reload and logout/protected access. Verify OTP failure with an invalid token and unsafe `next` without sending an email; successful OTP/cookie transfer requires separate authorized coverage.
- The admin role badge can combine roles (e.g. MEMBER · ADMIN · STAFF); assert the actual admin shell heading rather than an exact standalone ADMIN text node. The login submit text is a button, not the page heading.
- Capture dialog-close assertions independently from card synchronization. A closed dialog does not imply the streamed card update has completed.
- Capture POST start, headers, requestfinished, response.finished and requestfailed; CDP loadingFinished/loadingFailed disambiguates body completion from abort. Do not refresh/navigate while action settles.
- If needed, instrument pg Client.query from an external Node preload. Turbopack may import a hashed pg alias, so match the exported Client/query prototype, not only `request === 'pg'`. Preserve callback/promise semantics. Log timestamps and allowlisted operation/table names only. BEGIN-start through COMMIT acknowledgment is an observed client-side transaction interval, not a DB-clock commit timestamp.
- Snapshot only dedicated fixture state. Verify reservation, entitlement, waitlist and outbox uniqueness plus credit-account/ledger invariants. Current waitlist departure enum is `REMOVED`, not `LEFT`.
- Membership fixtures prove credit invariance, not positive credit refund. Do not claim email receipt from `SENT` or provider acceptance.
- Outbox repeated-enqueue retention is not exercised merely by reload; report that limitation unless separately triggered through an authorized path.

## Authorized hybrid Stripe TEST smoke

- Requires explicit permission for one TEST purchase, not LIVE. Additional secrets: `STRIPE_SECRET_KEY` (must start with `sk_test_`) and configured `STRIPE_WEBHOOK_SECRET`; never output their values.
- Read Stripe account and webhook endpoint metadata with the intended API key before purchasing. Confirm the named test environment, `livemode:false`, exact authorized Preview URL and enabled completed/expired events. Stripe endpoint reads do not expose signing secrets; authentic processed delivery proves effective verification, not a secret-string comparison.
- Preserve existing account data; do not run fixture/reset helpers for this smoke. Restrict the fixture header to local app requests, never external Stripe/Preview requests.
- Match the local origin to the existing build's compiled `NEXT_PUBLIC_APP_URL`. A runtime override may not replace an inlined public URL. Inspect session success/cancel URLs before paying; do not create repeated payments merely to correct launcher setup.
- With explicit authorization, use local `PAYMENTS_CHECKOUT_MODE=stripe` and the existing remote webhook sharing the authorized sandbox. Do not change Preview mode/env or webhook settings, run `stripe listen`, or reuse the remote signing secret in a local listener.
- Native Checkout may offer adaptive currency conversion. Select the intended product currency before entering official TEST card details and paying once.
- Verify a single `SUCCEEDED` payment, matching authentic Stripe `checkout.session.completed` event `PROCESSED`, one new `ACTIVE` credit account and exact `PURCHASE` ledger delta. Compare previous account/payment records, not just totals. Reload proves durable UI/state but is not webhook replay.
- Use the authorized dashboard/CLI resend flow to verify provider-originated redelivery. A separately authorized controlled replay can retrieve the original TEST event, generate a fresh signature with the SDK test helper, and POST it to the same test endpoint. Verify full before/after snapshots, not counts alone. Label this controlled endpoint deduplication; it does not validate provider redelivery or Stripe's retry scheduler.
- Incidental purchase notification dispatch is separate from email delivery testing. Do not open mailboxes or retry unrelated jobs. Attribute remote webhook processing to the stable alias unless deployment identity was independently read.
