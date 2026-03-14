# Auth Sandbox Operations

Fecha: 2026-03-14  
Estado: active runbook

## Objetivo

Tener un runbook corto para operar el entorno `auth sandbox` sin depender de memoria o conversaciones pasadas.

## Alcance

Este runbook cubre:

- cuentas de escenario de `Supabase Auth`
- login/logout E2E con `Playwright`
- credenciales locales
- incidencias típicas de sesión y sandbox

No cubre todavía:

- promoción de rol `ADMIN` en la base propia
- password reset E2E
- email verification E2E

## Cuentas de escenario actuales

### Member

- `e2e.member.sandbox@wellstudio.test`
- uso: login válido y logout

### Admin

- `e2e.admin.sandbox@wellstudio.test`
- uso previsto: futuro flujo de backoffice
- nota: crear el usuario en Supabase no basta; el rol `ADMIN` local sigue pendiente de seed/promoción

## Variables necesarias

### App local

En `.env.local`:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### E2E sandbox

En `.env.e2e.local`:

- `E2E_AUTH_SANDBOX=true`
- `E2E_AUTH_SANDBOX_REGISTER=false`
- `E2E_MEMBER_EMAIL`
- `E2E_MEMBER_PASSWORD`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

## Comandos útiles

### Smoke auth local

```bash
pnpm test:e2e:smoke
```

### Auth sandbox real

```bash
set -a
source .env.local
source .env.e2e.local
set +a
pnpm test:e2e:auth:sandbox
```

### Gate de auth

```bash
pnpm check:auth
```

## Qué cubre hoy la suite sandbox

- login válido de member
- error por credenciales inválidas
- logout real
- pérdida de acceso a `/app` tras logout
- lectura real de identidad local provisionada en `/app`

## Limitación conocida sobre registro

El registro real de sandbox queda desactivado por defecto.

Motivo:

- el SMTP hosted de Supabase introduce rate limiting
- la confirmación de email está activada por defecto en proyectos hosted
- sin inbox de test o setup admin, no es una suite fiable para ejecutar siempre

Runbook relacionado:

- `docs/runbooks/supabase-postgres-prisma-workflow.md`

Esto significa que la suite actual prueba `auth real + identidad local provisionada`, pero no automatiza todavía el paso completo de verificación de email.

## Incidencias típicas

### El login sandbox falla con credenciales válidas

Revisar:

- que `.env.local` apunta al proyecto `sandbox`
- que `.env.e2e.local` está cargado en el shell
- que el usuario existe y está confirmado en Supabase

### El test se salta solo

Revisar:

- `E2E_AUTH_SANDBOX=true`
- `E2E_MEMBER_EMAIL` y `E2E_MEMBER_PASSWORD` definidos

### Tras logout sigue entrando en `/app`

Revisar:

- que el test espera a la redirección completa a `/login`
- que no se está reutilizando una sesión previa del navegador
- que `proxy.ts` sigue protegiendo `/app` y `/admin`

## Próxima evolución recomendada

1. preparar inbox de test o custom SMTP para sandbox
2. automatizar verificación de email
3. promover `ADMIN` local mediante seed o script controlado
4. añadir `password reset`
5. añadir `email verification`
