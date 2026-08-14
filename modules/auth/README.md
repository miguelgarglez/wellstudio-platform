# Auth Module

Boundary responsible for:

- Supabase Auth integration
- auth context resolution
- local user provisioning
- route protection helpers

Current base pieces:

- browser client factory
- server client factory
- middleware session refresh
- local `User` / `Member` provisioning
- authenticated context helpers for server-side use cases
- post-auth internal redirect allowlist (`resolveSafeInternalPath`)

Session security notes (V1):

- cookies follow `@supabase/ssr` defaults (`httpOnly: false`); accepted tradeoff documented in `docs/adr/ADR-006-auth-provider-supabase.md`
- proxy + identity validate with `getUser()`; roles come from Prisma, never from editable JWT `user_metadata`
- email already linked to another Auth identity cannot be claimed (`IdentityLinkConflictError`)
- `/auth/after-login` catches that conflict, signs out, and sends the visitor to login instead of a 500
- sandbox reset of a real person: `pnpm sandbox:auth:delete -- email --apply --confirm-sandbox-delete` (Auth + local `User`)
- first email-only link strips `ADMIN`/`STAFF`; privileged roles stay manual
- password recovery ends with global sign-out and re-login
- app-wide security headers (CSP baseline, frame deny, nosniff) in `next.config.ts`
