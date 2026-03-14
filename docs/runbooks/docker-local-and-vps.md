# Docker local y VPS

## Objetivo

Tener una base de despliegue simple y repetible para WellStudio V1 usando:

- `Dockerfile` multi-stage para la app `Next.js`
- `docker-compose.yml` como base de empaquetado y despliegue de la app
- un camino claro tanto para local como para un VPS sobrio

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

Cuando quieras probar una imagen cercana a produccion:

```bash
docker compose up --build
```

Esto levanta:

- `app` en `http://localhost:3000`

## VPS

En V1 la estrategia objetivo es una sola maquina con:

- Docker Engine
- Docker Compose plugin
- reverse proxy delante si hace falta TLS y dominio

Flujo base:

1. copiar repo o imagen al VPS
2. definir variables de entorno reales
3. lanzar `docker compose up -d --build`
4. verificar health y logs

## Variables de entorno minimas

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Mas adelante se añadiran:

- secretos server-side de Supabase si fueran necesarios
- Stripe
- email provider
- observabilidad

## Notas

- esta base es suficiente para V1, pero no sustituye runbooks de backup, restore y actualizacion
- `docker-compose.yml` esta orientado a simplicidad, no a alta disponibilidad
- la base de datos se asume alojada en `Supabase Postgres`, no en el mismo stack Docker
