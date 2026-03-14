# WellStudio Platform

Monolito modular en `Next.js` para WellStudio.

Estado actual:

- repo base creado y operativo
- documentacion fundacional importada
- stack objetivo definido
- `schema.prisma`, test unitario base y smoke E2E inicial ya preparados

## Direccion tecnica

- `Next.js` monolitico modular
- `Prisma`
- `Supabase Auth`
- `Supabase Postgres`
- `VPS + Docker`

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
2. workflow Docker local y VPS
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
```

## Docker

Referencias:

- [`Dockerfile`](./Dockerfile)
- [`docker-compose.yml`](./docker-compose.yml)
- [`docs/runbooks/docker-local-and-vps.md`](./docs/runbooks/docker-local-and-vps.md)
- [`docs/runbooks/supabase-postgres-prisma-workflow.md`](./docs/runbooks/supabase-postgres-prisma-workflow.md)

## Modelo mental de datos

- `Supabase Auth` gestiona identidad, sesión y credenciales
- `Supabase Postgres` aloja el dominio WellStudio (`User`, `Member`, reservas, planes, pagos)
- `Prisma` es la capa con la que el monolito habla con esa base
- en local, la app puede apuntar al proyecto `sandbox` sin exigir Postgres en Docker por defecto

## Notas

- no mezclar logica de negocio en UI
- no tratar Supabase como fuente de verdad del dominio
- mantener el dominio desacoplado del proveedor de auth
