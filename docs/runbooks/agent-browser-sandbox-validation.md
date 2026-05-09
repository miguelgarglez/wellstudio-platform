# Agent Browser Sandbox Validation

Fecha: 2026-03-31  
Estado: active

## Objetivo

Tener una forma repetible de validar flujos privados con `agent-browser` usando una
cuenta sandbox estable, sin depender de correos personales ni del flujo manual de
confirmación por email.

## Cuenta recomendada

Usar una cuenta de escenario persistente:

- `e2e.member.sandbox@wellstudio.test`

No usar cuentas personales para validación automatizada.

## Variables necesarias

### `.env.local`

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SANDBOX_PROJECT_REF`

Nota:

- `SUPABASE_SERVICE_ROLE_KEY` no se usa en runtime de app
- se usa solo para operaciones admin controladas contra `Supabase Auth`
- no debe entrar en el repo
- `SUPABASE_SANDBOX_PROJECT_REF` debe ser el project ref exacto del proyecto sandbox
- el script aborta si `NEXT_PUBLIC_SUPABASE_URL` no apunta a ese proyecto

### `.env.e2e.local`

- `E2E_AUTH_SANDBOX=true`
- `E2E_MEMBER_EMAIL=e2e.member.sandbox@wellstudio.test`
- `E2E_MEMBER_PASSWORD=...`

## Asegurar o resetear el usuario sandbox

Hay un script local para crear la cuenta si no existe o resetear su password si ya
existe:

```bash
node scripts/auth/ensure-sandbox-user.mjs member --confirm-sandbox-reset
```

Qué hace:

- busca el usuario por email en `Supabase Auth`
- si existe, le fija el password definido en `.env.e2e.local`
- asegura `email_confirm=true`
- si no existe, lo crea ya confirmado
- aborta si `E2E_AUTH_SANDBOX` no está en `true`
- aborta si el project ref activo no coincide con `SUPABASE_SANDBOX_PROJECT_REF`
- aborta si el email no es una cuenta de escenario `e2e.*.sandbox@wellstudio.test`

También existe la variante `admin`:

```bash
pnpm sandbox:auth:admin
```

Nota importante:

- esto solo crea o corrige el usuario en `Supabase Auth`
- para `ADMIN`, la promoción de rol local sigue siendo otra capa

## Reconciliar escenario de dominio

Después de asegurar el usuario auth, preparar el escenario de reservas:

```bash
pnpm sandbox:scenario member-reservations-flow
```

Runbook detallado relacionado:

- [sandbox-member-reservation-scenarios.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/runbooks/sandbox-member-reservation-scenarios.md)

## Dónde sacar `SUPABASE_SERVICE_ROLE_KEY`

En el dashboard del proyecto `sandbox`:

- `Project Settings`
- `API`
- `service_role`

Guardar esa key solo en `.env.local`.

El `project ref` sale del mismo panel y suele coincidir con el subdominio de:

- `https://<project-ref>.supabase.co`

## Validación con `agent-browser`

### Login base

```bash
agent-browser --session-name wellstudio-sandbox \
  --executable-path '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  open http://localhost:3000/login
```

Después:

1. `snapshot -i`
2. rellenar email y password
3. enviar login

Si un overlay de Agentation está bloqueando interacciones, desactivar `Block page interactions`
o forzar el submit del formulario.

### Revisar portal privado

```bash
agent-browser --session-name wellstudio-sandbox open http://localhost:3000/app
agent-browser --session-name wellstudio-sandbox open http://localhost:3000/app/reservations
```

### Revisar mobile

```bash
agent-browser set viewport 390 844
agent-browser --session-name wellstudio-sandbox open http://localhost:3000/app/reservations
```

## Limpieza de sesión

Cuando la validación termine:

```bash
agent-browser --session-name wellstudio-sandbox cookies clear
agent-browser --session-name wellstudio-sandbox storage local clear
agent-browser --session-name wellstudio-sandbox storage session clear
```

## Cuándo usar este runbook

- validar `/app` y rutas privadas con una cuenta real
- revisar tickets visuales de member portal con `agent-browser`
- depurar problemas de auth sandbox sin depender del flujo de confirmación por email

## Relación con el runbook principal

Complementa:

- [auth-sandbox-operations.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/runbooks/auth-sandbox-operations.md)
- [sandbox-member-reservation-scenarios.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/runbooks/sandbox-member-reservation-scenarios.md)
