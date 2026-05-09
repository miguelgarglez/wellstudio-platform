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

- password reset E2E
- email verification E2E
- configuración SMTP custom

## Cuentas de escenario actuales

### Member

- `e2e.member.sandbox@wellstudio.test`
- uso: login válido y logout

### Admin

- `e2e.admin.sandbox@wellstudio.test`
- uso: acceso al backoffice de reglas de reserva por membership y excepciones de reserva por socio
- nota: `pnpm sandbox:auth:admin` asegura el usuario Supabase, reconcilia identidad local y garantiza el rol `ADMIN` antes de ejecutar QA/E2E admin
- el login admin sin `redirectTo` debe resolver destino por rol y aterrizar en `/admin`

## Variables necesarias

### App local

En `.env.local`:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` para operaciones admin locales controladas
- `SUPABASE_SANDBOX_PROJECT_REF` para asegurar que esas operaciones solo apuntan a sandbox

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

### Asegurar o resetear cuenta sandbox de scenario

```bash
pnpm sandbox:auth:member
pnpm sandbox:auth:admin
```

`sandbox:auth:admin` no solo asegura el usuario de `Supabase Auth`: tambien reconcilia la identidad local y garantiza el rol `ADMIN` en la base sandbox. Esto evita que los E2E de admin escondan SQL de provisioning dentro del helper de login.

Runbook detallado relacionado:

- `docs/runbooks/agent-browser-sandbox-validation.md`
- `docs/runbooks/sandbox-member-reservation-scenarios.md`

### Reconciliar escenario de reservas para member portal

```bash
pnpm sandbox:scenario member-reservations-flow
```

Este comando prepara el dominio sandbox para QA visual y futura validación E2E de:

- plan activo
- reserva cancelable
- sesión reservable
- waitlist activa
- historial reciente

### Reconciliar playground admin

```bash
pnpm sandbox:auth:admin
pnpm sandbox:admin-playground
```

Este comando prepara datos ricos para revisar `/admin` y `/admin/overrides` con estados realistas:

- planes con políticas explícitas ilimitada, semanal y mensual
- socios buscables con memberships activas, pendientes, expiradas y ausentes
- overrides vigentes, revocados y expirados
- sesiones futuras publicadas para `SESSION_ACCESS`
- contexto comercial ligero como tarjeta, pagos y créditos

El playground admin es para QA manual y revisión de producto. No es un fixture determinista para assertions E2E.

## Qué cubre hoy la suite sandbox

- login válido de member
- error por credenciales inválidas
- logout real con invalidación SSR correcta
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
- `docs/runbooks/resend-supabase-auth-smtp-setup.md`
- `docs/runbooks/agent-browser-sandbox-validation.md`

Esto significa que la suite actual prueba `auth real + identidad local provisionada`, pero no automatiza todavía el paso completo de verificación de email.

## Dirección actual para emails de auth

Para mejorar las pruebas manuales y el sandbox sin tocar la arquitectura de auth, la dirección actual es usar:

- `Resend` como `custom SMTP` de `Supabase Auth`

Esto:

- elimina el cuello de botella principal del hosted email de Supabase
- mejora la repetibilidad de signup y password reset manuales
- no elimina todavía el gap de inbox automation para E2E

Estado actual validado:

- signup manual funcionando con email real
- confirmación de signup entrando correctamente en `/app`
- forgot password funcionando con email real
- reset password funcionando
- signup y reset funcionando tambien desde `Vercel Preview` contra `Supabase sandbox`

Runbook operativo detallado:

- `docs/runbooks/resend-supabase-auth-smtp-setup.md`

Nota importante de configuración:

- para que el sandbox desplegado en `Vercel Preview` funcione con auth por email, `Supabase Auth` debe allowlistear tambien las URLs preview en `Redirect URLs`
- si no se hace, `Supabase` cae al `Site URL` y los enlaces de recovery/signup pueden volver a `localhost`

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

- si el logout está ocurriendo solo en cliente y no está invalidando la sesión SSR
- la coherencia entre `modules/auth/ui/logout-button.tsx`, el boundary server-side de auth y `proxy.ts`
- que no se está reutilizando una sesión previa del navegador

## Próxima evolución recomendada

1. decidir si compensa preparar inbox de test o custom SMTP para sandbox
2. automatizar verificación de email
3. añadir `password reset`
4. añadir `email verification`
