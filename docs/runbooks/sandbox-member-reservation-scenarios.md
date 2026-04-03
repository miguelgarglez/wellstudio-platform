# Sandbox Member Reservation Scenarios

Fecha: 2026-04-03  
Estado: active

## Objetivo

Preparar datos de dominio repetibles en `sandbox` para validar el portal privado con
`agent-browser`, QA manual y futuros E2E de reservas sin depender de datos viejos o
creados a mano.

## Principio

Esto no es un seed global.

La estrategia es `scenario reconciliation`:

- solo toca entidades `E2E` reconocibles
- refresca fechas y estados del escenario
- no borra datos ajenos del sandbox

## Escenario disponible hoy

### `member-reservations-flow`

Deja listo el member sandbox para validar:

- plan activo visible en `/app`
- una reserva futura cancelable
- una sesión futura reservable desde agenda
- una sesión futura completa con waitlist activa
- historial reciente con `attended`, `canceled` y `no_show`

## Requisitos previos

### `.env.local`

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SANDBOX_PROJECT_REF`

### `.env.e2e.local`

- `E2E_AUTH_SANDBOX=true`
- `E2E_MEMBER_EMAIL=e2e.member.sandbox@wellstudio.test`
- `E2E_MEMBER_PASSWORD=...`

## Comando principal

```bash
pnpm sandbox:scenario member-reservations-flow
```

Ese comando envuelve:

```bash
node scripts/sandbox/ensure-member-scenario.mjs member-reservations-flow --confirm-sandbox-scenario
```

## Qué hace

- valida que el proyecto actual es el sandbox esperado
- comprueba que la cuenta member sandbox existe en `Supabase Auth`
- asegura la identidad local `User` + `Member` si falta
- reconcilia catálogo E2E:
  - coach
  - class types
  - membership plan
  - membership activa
- limpia y recrea solo las sesiones gestionadas por el escenario
- recrea reservas, waitlist e historial del escenario

## Validación recomendada

1. asegurar la cuenta auth sandbox

```bash
node scripts/auth/ensure-sandbox-user.mjs member --confirm-sandbox-reset
```

2. reconciliar el escenario

```bash
pnpm sandbox:scenario member-reservations-flow
```

3. abrir el login con `agent-browser`

```bash
agent-browser --session-name wellstudio-sandbox \
  --executable-path '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  open http://localhost:3000/login
```

4. validar:

- `/app`
- `/app/reservations`
- reserva cancelable
- waitlist activa
- agenda con sesión reservable

## Convenciones E2E

- entidades del escenario usan prefijos `E2E` o `E2E Sandbox Flow`
- las fechas son relativas al momento actual
- la reejecución del comando debe ser segura e idempotente

## Evolución prevista

Siguientes escenarios naturales:

- `member-no-entitlement`
- `member-credits-flow`

## Relación con otros runbooks

Complementa:

- [auth-sandbox-operations.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/runbooks/auth-sandbox-operations.md)
- [agent-browser-sandbox-validation.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/runbooks/agent-browser-sandbox-validation.md)
