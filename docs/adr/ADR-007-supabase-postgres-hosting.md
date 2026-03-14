# ADR-007: Supabase Postgres como hosting de base de datos V1

Fecha: 2026-03-14
Estado: accepted

## Contexto

Tras adoptar `Supabase Auth`, quedaba una decision clave abierta:

- alojar la base de datos principal fuera de Supabase
- o usar `Supabase Postgres` tambien para el dominio de la app

WellStudio V1 necesita:

- bajo mantenimiento
- buena experiencia de desarrollo
- coste contenido
- una base de datos relacional seria
- seguir usando `Prisma` como capa de acceso a datos

## Decision

Usar `Supabase Postgres` como hosting de base de datos para WellStudio V1 y mantener `Prisma` como ORM y capa de dominio.

## Motivo

- reduce moving parts desde el inicio
- evita forzar Postgres local en Docker como camino principal de desarrollo
- simplifica produccion, porque el VPS solo aloja la app
- mantiene una experiencia de desarrollo mas comoda para un equipo pequeno
- conserva el valor de `Prisma`: schema, cliente tipado, migraciones y claridad de dominio

## Alternativas consideradas

### Opcion A: Supabase Auth + Postgres propio

- pros
  - mayor separacion entre proveedor de auth y base de datos
  - menos acoplamiento a Supabase
- contras
  - mas infraestructura
  - mas operacion
  - peor experiencia local para esta fase

### Opcion B: Supabase DB sin Prisma

- pros
  - menos herramientas
  - enfoque mas puro tipo BaaS
- contras
  - menos claridad de dominio en el monolito
  - peor encaje con una arquitectura server-side en `Next.js`
  - mas acoplamiento al estilo de acceso de Supabase

## Consecuencias

- `Supabase sandbox` aloja auth y db de desarrollo
- `Supabase production` aloja auth y db de produccion
- `Prisma` sigue siendo la capa principal de acceso a datos
- el VPS queda centrado en servir el monolito `Next.js`
- Docker deja de ser obligatorio para la base de datos en local

## Impacto en implementacion

- `DATABASE_URL` apuntara al Postgres del proyecto Supabase correspondiente
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` seguiran saliendo del mismo proyecto
- los runbooks de desarrollo se simplifican
- la capa de provisionado local `User` / `Member` sigue existiendo, solo cambia el hosting de la base

## Referencias

- [README.md](/Users/miguelgarglez/Developer/wellstudio-platform/README.md)
- [wellstudio-supabase-environments-strategy.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/product/wellstudio-supabase-environments-strategy.md)
- `MIG-53`
