# WellStudio Platform

Monolito modular en `Next.js` para WellStudio.

Estado actual:

- repo base creado y operativo
- documentacion fundacional importada
- stack objetivo definido
- `schema.prisma`, test unitario base y smoke E2E inicial ya preparados
- deploy objetivo inmediato redefinido a `Vercel-first`

## Direccion tecnica

- `Next.js` monolitico modular
- `Prisma`
- `Supabase Auth`
- `Supabase Postgres`
- `Vercel` para `Preview` y `Production`
- `Docker` solo como artefacto opcional de empaquetado local

## Estructura de documentacion

- [`docs/adr`](./docs/adr): decisiones tecnicas aceptadas
- [`docs/architecture`](./docs/architecture): arquitectura y modelo de datos
- [`docs/product`](./docs/product): PRD, flujos y testing strategy
- [`docs/discovery`](./docs/discovery): reverse engineering y contexto origen
- [`docs/runbooks`](./docs/runbooks): material operativo y de entrega comercial

## Fuente de verdad

Usar esta regla:

- arquitectura y decisiones aceptadas: `docs/adr` y `docs/architecture`
- producto, flujos y criterios de testing: `docs/product`
- backlog y progreso: Linear
- setup y operacion del repo: `README` y futuros runbooks dentro del repo

## Prioridad inmediata

1. boundary de `Supabase Auth`
2. workflow `Vercel Preview / Production`
3. fixtures y gates iniciales de testing
4. primeros casos de uso de auth y members

## Comandos base

```bash
pnpm dev
pnpm db:push
pnpm db:studio
pnpm lint
pnpm typecheck
pnpm check:foundation
pnpm check:auth
pnpm test:unit
pnpm test:e2e
pnpm test:e2e:smoke
```

## Visual feedback en desarrollo

`Agentation` queda integrado de forma `dev-only` desde el layout raiz.

- activar/desactivar desde `NEXT_PUBLIC_AGENTATION_ENABLED`
- el endpoint MCP por defecto es `http://localhost:4747`
- comprobar el setup con `pnpm agentation:doctor`
- arrancar el servidor manualmente con `pnpm agentation:mcp`
- si SQLite da problemas locales, usar `pnpm agentation:mcp:memory`

## Deploy y entornos

Referencias:

- [`docs/adr/ADR-008-vercel-first-deployments.md`](./docs/adr/ADR-008-vercel-first-deployments.md)
- [`docs/product/wellstudio-supabase-environments-strategy.md`](./docs/product/wellstudio-supabase-environments-strategy.md)
- [`docs/runbooks/vercel-preview-and-production.md`](./docs/runbooks/vercel-preview-and-production.md)
- [`docs/runbooks/supabase-postgres-prisma-workflow.md`](./docs/runbooks/supabase-postgres-prisma-workflow.md)
- [`docs/runbooks/docker-local-and-vps.md`](./docs/runbooks/docker-local-and-vps.md)

## Modelo mental de datos

- `Supabase Auth` gestiona identidad, sesión y credenciales
- `Supabase Postgres` aloja el dominio WellStudio (`User`, `Member`, reservas, planes, pagos)
- `Prisma` es la capa con la que el monolito habla con esa base
- en local, la app puede apuntar al proyecto `sandbox`
- la rama `preview` despliega contra `Supabase sandbox`
- la rama `main` publica contra `Supabase production`

## Notas

- no mezclar logica de negocio en UI
- no tratar Supabase como fuente de verdad del dominio
- mantener el dominio desacoplado del proveedor de auth
- no usar credenciales o datos de `production` en `Preview`
