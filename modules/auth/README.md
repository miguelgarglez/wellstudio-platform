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
