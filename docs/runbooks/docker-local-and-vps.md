# Docker local y nota sobre VPS

Fecha: 2026-03-18  
Estado: optional local packaging

## Nota importante

Este documento ya no describe el camino principal de despliegue de WellStudio.

Desde `ADR-008`, la direccion activa es:

- `Vercel` para `Preview` y `Production`
- `Supabase` para auth y base de datos

Docker queda como herramienta opcional para:

- probar una imagen local cercana a produccion
- empaquetar la app
- conservar una via de salida futura si el proyecto vuelve a `VPS + Docker`

## Objetivo

Tener una base opcional de empaquetado local para la app `Next.js`.

## Local

### Desarrollo normal

El camino principal de desarrollo ya no necesita Docker para la base de datos.

La app puede trabajar contra:

- `Supabase Auth sandbox`
- `Supabase Postgres sandbox`
- `Prisma`

Runbook relacionado:

- `docs/runbooks/supabase-postgres-prisma-workflow.md`

### App en Docker

Cuando quieras probar una imagen cercana a produccion de forma local:

```bash
docker compose up --build
```

Esto levanta:

- `app` en `http://localhost:3000`

## Variables de entorno minimas

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Mas adelante se añadiran:

- secretos server-side de Supabase si fueran necesarios
- Stripe
- email provider
- observabilidad

## Notas

- `docker-compose.yml` esta orientado a simplicidad y validacion local
- la base de datos se asume alojada en `Supabase Postgres`, no en el mismo stack Docker
- el runbook principal de despliegue vive ahora en `docs/runbooks/vercel-preview-and-production.md`
