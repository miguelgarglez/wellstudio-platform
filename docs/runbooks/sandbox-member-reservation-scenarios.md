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

Nota operativa importante:

- sí destruye y recrea las entidades gestionadas por el propio escenario
- eso incluye sesiones canónicas, reservas/waitlists E2E asociadas y relaciones E2E derivadas
- por tanto, los IDs de esas entidades no deben tratarse como estables entre ejecuciones

## Escenarios disponibles hoy

### `member-reservations-flow`

Deja listo el member sandbox para validar:

- plan activo visible en `/app`
- una reserva futura cancelable
- una sesión futura reservable desde agenda
- una sesión futura completa con waitlist activa
- historial reciente con `attended`, `canceled` y `no_show`

### `admin-playground`

Deja listo el backoffice para validación manual y revisión de producto:

- varios planes con políticas explícitas:
  - ilimitada
  - allowance semanal
  - allowance mensual
- varios socios buscables desde `/admin/overrides`:
  - membership activa
  - membership pendiente
  - membership expirada
  - socio sin membership
  - perfil con datos parciales
- sesiones futuras publicadas para probar `SESSION_ACCESS`
- overrides vigentes, revocados y expirados
- contexto comercial ligero:
  - tarjeta default
  - pagos recientes
  - cuenta de créditos con saldo no trivial

Este escenario no debe usarse para assertions deterministas de Playwright. Su objetivo es que el panel admin tenga densidad realista para QA manual, diseño y revisión de producto.

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

Para el playground admin:

```bash
pnpm sandbox:admin-playground
```

Equivalente a:

```bash
node scripts/sandbox/ensure-member-scenario.mjs admin-playground --confirm-sandbox-scenario
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

En `admin-playground`, además:

- asegura un actor admin local usando `E2E_ADMIN_EMAIL` si existe
- crea usuarios locales de demo sin depender de Supabase Auth para cada socio
- reconcilia planes, políticas, memberships, overrides, sesiones y contexto comercial gestionado
- usa prefijos `Admin Playground` para poder distinguir lo creado por el escenario

## Validación recomendada

1. asegurar la cuenta auth sandbox

```bash
node scripts/auth/ensure-sandbox-user.mjs member --confirm-sandbox-reset
```

2. reconciliar el escenario

```bash
pnpm sandbox:scenario member-reservations-flow
```

Para revisar el backoffice:

```bash
pnpm sandbox:admin-playground
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
- `/admin`
- `/admin/overrides?q=playground`
- estados de overrides vigentes, revocados y expirados

## Uso desde Playwright

La suite sandbox de reservas prepara este escenario al arrancar la suite y lo vuelve a reconciliar antes de cada test mutante.

Comandos:

```bash
pnpm test:e2e:reservations:sandbox
```

Cuándo usar cada camino:

- `pnpm sandbox:scenario member-reservations-flow`
  - cuando quieras QA manual, `agent-browser` o inspección previa del estado
- `pnpm sandbox:admin-playground`
  - cuando quieras revisar admin con datos ricos sin acoplar Playwright a ese volumen
- `pnpm test:e2e:reservations:sandbox`
  - cuando quieras que Playwright reconcilie el escenario y ejecute los flujos reales del portal

Nota:

- la suite Playwright sigue siendo `opt-in`
- no forma parte del smoke rápido ni de los gates frecuentes
- el setup actual está pensado para una sola spec sandbox y un solo proyecto Playwright por ejecución

## Convenciones E2E

- entidades del escenario usan prefijos `E2E` o `E2E Sandbox Flow`
- entidades del playground admin usan prefijos `Admin Playground` y emails `e2e.admin.playground.*.sandbox@wellstudio.test`
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
