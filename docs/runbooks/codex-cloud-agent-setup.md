# Codex Cloud Agent Setup

Fecha: 2026-05-14  
Estado: active setup guide

## Objetivo

Preparar `wellstudio-platform` para que Codex pueda ejecutar tareas remotas desde
Codex web/cloud con alta fiabilidad: editar código, ejecutar tests, revisar UI en
browser, consultar CI, abrir PRs y validar contra el sandbox real.

Codex cloud trabaja en sandboxes aislados conectados al repo de GitHub. Por eso el
setup debe hacer dos cosas:

- que el repo explique muy bien como trabajar
- que el entorno remoto tenga secretos y conectores suficientes para validar

## Fuentes que debe leer el agente

Antes de tocar código, Codex debe leer:

- `AGENTS.md`
- `README.md`
- `docs/README.md`
- `docs/adr`
- el reading map especifico del tipo de tarea en `AGENTS.md`

Para cambios de entorno remoto, leer tambien:

- `docs/runbooks/vercel-preview-and-production.md`
- `docs/runbooks/supabase-postgres-prisma-workflow.md`
- `docs/runbooks/agent-browser-sandbox-validation.md`
- `docs/product/wellstudio-testing-gates-v1.md`

## Conectores y permisos externos

### GitHub

Necesario para:

- clonar el repo en Codex web/cloud
- crear ramas y PRs
- leer checks fallidos
- inspeccionar logs de GitHub Actions

Permisos recomendados:

- acceso al repo `wellstudio-platform`
- lectura de Actions/checks
- escritura de branches y pull requests
- lectura de issues si se usa GitHub como contexto secundario

### Linear

Necesario para:

- leer contexto de tickets `MIG-*`
- dejar trazabilidad de validacion en tareas sensibles
- cerrar el bucle entre issue, commit y PR

Uso esperado:

- cada commit sensible debe incluir `Refs: MIG-xx`
- antes de mover tickets de `auth`, `reservations` o `payments` a Done, comentar
  el gate ejecutado y resultado

### Vercel

Necesario para:

- ver deployments de Preview y Production
- consultar logs de build/runtime
- validar URLs de Preview generadas por PR o por rama `preview`
- promover o diagnosticar despliegues cuando proceda

Regla critica:

- `Preview` debe apuntar siempre a `Supabase sandbox`
- `Production` debe apuntar siempre a `Supabase production`

### Supabase

Necesario para:

- validar auth sandbox
- preparar usuarios E2E
- consultar Postgres sandbox cuando haya bugs de dominio
- revisar configuracion de redirects/email cuando falle auth

Para Codex cloud, dar acceso solo al proyecto `sandbox` salvo tareas
explicitamente productivas.

### Browser / Playwright

Necesario para:

- comprobar cambios visuales
- ejecutar smoke E2E
- validar `/login`, `/register`, `/app` y flujos privados

El repo ya usa Playwright. Codex debe preferir:

```bash
pnpm test:e2e:smoke
```

Para tareas visuales de producto, tambien debe arrancar la app y revisar en
browser la ruta afectada.

## Variables y secretos del entorno Codex cloud

Configurar estos valores en el entorno remoto de Codex. No commitearlos.

Separacion practica:

- **Variables del entorno**: disponibles para setup y para los comandos que
  ejecuta el agente despues, como `pnpm build`, `next dev` y Playwright.
- **Secretos**: pueden estar disponibles solo durante el script de setup y no
  necesariamente durante la fase del agente. Usarlos para credenciales que no
  debe leer el agente directamente.

Para WellStudio, cualquier valor que la app necesite en runtime dentro de Codex
cloud debe ir en **Variables del entorno**, no solo en **Secretos**.

Minimos para build/runtime:

```bash
DATABASE_URL=...
DIRECT_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3001
```

Estos minimos deben configurarse como **Variables del entorno** en Codex cloud,
porque la app los lee cuando el agente ejecuta `pnpm build`, `next dev` o
capturas con Playwright.

Recomendados para E2E sandbox:

```bash
SUPABASE_SANDBOX_PROJECT_REF=...
SUPABASE_SERVICE_ROLE_KEY=...
E2E_AUTH_SANDBOX=true
E2E_AUTH_SANDBOX_REGISTER=false
E2E_MEMBER_EMAIL=e2e.member.sandbox@wellstudio.test
E2E_MEMBER_PASSWORD=...
E2E_ADMIN_EMAIL=e2e.admin.sandbox@wellstudio.test
E2E_ADMIN_PASSWORD=...
```

Para maximizar validacion remota, usar tambien valores de **sandbox** como
variables del entorno. Esto permite que el agente prepare usuarios, ejecute E2E y
arranque la app con el mismo runtime.

Notas:

- `DATABASE_URL` debe usar pooler.
- `DIRECT_URL` debe usar conexion directa.
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa para scripts admin controlados en
  sandbox. No debe estar disponible en Production runtime.
- Si Codex no necesita resetear usuarios sandbox, se puede omitir
  `SUPABASE_SERVICE_ROLE_KEY`, pero entonces no debe ejecutar scripts
  `sandbox:auth:*`.
- No usar credenciales de `production` como variables legibles por el agente.
  Para Codex cloud, el entorno normal debe ser `Supabase sandbox`.

## Bootstrap recomendado

Configurar el entorno de Codex cloud con Node 22 y `pnpm` 10.21.0.

Comandos de setup:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm db:generate
pnpm codex:doctor
```

Prueba manual recomendada despues de crear una tarea nueva:

```bash
cd /workspace/wellstudio-platform
pnpm codex:doctor
pnpm build
pnpm exec next dev --port 3000
```

En otra terminal o usando Playwright:

```bash
pnpm exec playwright screenshot --browser=chromium http://localhost:3000/non-existent-route /tmp/404-desktop.png
```

Si `pnpm codex:doctor` pasa en setup pero `pnpm build` o `next dev` falla con
`DATABASE_URL is required`, el valor esta probablemente guardado como **Secret**
y no como **Variable del entorno** disponible durante la fase del agente.

Si el entorno no permite instalar dependencias del sistema con Playwright, usar
el browser disponible por Codex para validacion visual y dejar constancia de que
`pnpm test:e2e:*` no pudo instalar Chromium.

## Gates por tipo de tarea

Foundation, arquitectura, tooling o schema:

```bash
pnpm check:foundation
pnpm test:e2e:smoke
```

Auth:

```bash
pnpm check:auth
pnpm test:e2e:auth:sandbox
```

Reservations:

```bash
pnpm check:reservations
pnpm test:e2e:reservations:sandbox
```

UI publica o member portal:

```bash
pnpm lint
pnpm typecheck
pnpm test:e2e:smoke
```

Ademas, revisar visualmente la ruta tocada en desktop y mobile.

## Flujo de trabajo recomendado para Codex remoto

1. Leer `AGENTS.md` y los docs del reading map.
2. Entender el ticket o prompt y localizar el modulo propietario.
3. Ejecutar `pnpm codex:doctor` si la tarea toca auth, datos, E2E o sandbox.
4. Hacer cambios pequeños y trazables en una rama `codex/*`.
5. Añadir o actualizar tests si cambia comportamiento.
6. Ejecutar el gate correspondiente.
7. Revisar visualmente si hay UI.
8. Abrir PR contra `preview`, no contra `main`, salvo indicacion explicita.
9. En el PR, explicar:
   - cambio realizado
   - gate ejecutado
   - evidencia visual si aplica
   - riesgos o gaps restantes

## Plantilla de prompt para tareas remotas

```text
Trabaja en /workspace/wellstudio-platform cuando estes en Codex cloud.
Lee AGENTS.md y los docs del reading map aplicable antes de editar.
Usa rama codex/<descripcion-corta>.
No instales dependencias nuevas sin justificarlo y pedir confirmacion.
Mantén la logica de negocio fuera de UI, route handlers y server actions finas.
Valida con el gate correspondiente y, si hay UI, revisa visualmente desktop/mobile.
Abre PR contra preview.
Incluye en el PR resumen, tests ejecutados y riesgos.
Si el ticket es sensible, deja trazabilidad para Linear con Refs: MIG-xx.
```

## Skills

Las skills locales no viajan automaticamente con el repo. Para trabajo remoto hay
dos caminos:

- instalar las mismas skills en el entorno de Codex si la plataforma lo permite
- convertir las skills criticas del proyecto en instrucciones versionadas dentro
  del repo

Para WellStudio, lo importante ya esta versionado en:

- `AGENTS.md`
- `docs/runbooks`
- `docs/product`
- `docs/adr`

Si una skill local se vuelve imprescindible para repetir trabajo remoto, mover su
criterio operativo a un runbook del repo en vez de depender de una maquina local.

## Checklist de preparacion

- GitHub conectado a Codex web/cloud con acceso a `wellstudio-platform`.
- Codex puede crear branches y PRs.
- Codex puede leer checks y logs de GitHub Actions.
- Linear conectado y con acceso a tickets `MIG-*`.
- Vercel conectado y con acceso al proyecto WellStudio.
- Supabase sandbox accesible con credenciales de sandbox.
- Secretos de Codex cloud configurados.
- `pnpm codex:doctor` pasa en el entorno remoto.
- `pnpm check:foundation` pasa.
- `pnpm test:e2e:smoke` pasa o queda documentado el bloqueo.
- PRs remotos apuntan a `preview`.

## Limites deliberados

- No dar a Codex permisos de escritura sobre `Production` por defecto.
- No compartir service role de production.
- No permitir `migrate reset` ni operaciones destructivas sobre bases compartidas.
- No cerrar tareas sensibles sin gate ni comentario de validacion.
