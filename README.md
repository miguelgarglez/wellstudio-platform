# WellStudio Platform

Monolito modular en `Next.js` para WellStudio.

Estado actual:

- repo base de preparacion
- documentacion fundacional importada
- stack objetivo definido
- pendiente bootstrap de app e instalacion de dependencias

## Direccion tecnica

- `Next.js` monolitico modular
- `Prisma`
- `Supabase Auth`
- `PostgreSQL`
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

1. bootstrap de `Next.js`
2. estructura modular real
3. `schema.prisma`
4. boundary de `Supabase Auth`
5. test harness base

## Notas

- no mezclar logica de negocio en UI
- no tratar Supabase como fuente de verdad del dominio
- mantener el dominio desacoplado del proveedor de auth
