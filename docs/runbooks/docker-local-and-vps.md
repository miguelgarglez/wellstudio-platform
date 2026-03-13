# Docker local y VPS

## Objetivo

Tener una base de despliegue simple y repetible para WellStudio V1 usando:

- `Dockerfile` multi-stage para la app `Next.js`
- `docker-compose.yml` para app + PostgreSQL
- un camino claro tanto para local como para un VPS sobrio

## Local

### Solo base de datos en Docker

Cuando el desarrollo de la app se haga desde el host y solo se quiera levantar PostgreSQL:

```bash
docker compose up -d db
pnpm dev
```

Variable necesaria en tu entorno local:

```bash
DATABASE_URL=postgresql://wellstudio:wellstudio@localhost:5432/wellstudio
```

### App y base de datos en Docker

Cuando quieras probar una imagen cercana a produccion:

```bash
docker compose up --build
```

Esto levanta:

- `db` en `localhost:5432`
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
- la base de datos en el mismo stack es valida para local y primeras pruebas, pero en produccion puede moverse a un servicio o volumen mas endurecido sin tocar la app
