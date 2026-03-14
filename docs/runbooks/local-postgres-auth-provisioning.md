# Local Postgres for Auth Provisioning

Fecha: 2026-03-14  
Estado: active setup guide

## Idea base

En local vamos a tener dos sistemas distintos trabajando a la vez:

### 1. Supabase sandbox

Sirve para:

- registro
- login
- logout
- sesiones y cookies
- usuarios de auth

Piensa en Supabase como `la puerta de entrada`.

### 2. PostgreSQL local

Sirve para:

- `User`
- `Member`
- `UserRole`
- reservas
- suscripciones
- pagos
- resto del dominio propio de WellStudio

Piensa en PostgreSQL como `la base de datos real de nuestra app`.

## Qué pasa cuando un usuario inicia sesión

1. el usuario mete email y contraseña
2. Supabase sandbox valida las credenciales
3. la app recibe la sesión autenticada
4. la capa server de WellStudio ejecuta `ensureLocalUser()`
5. si el usuario no existe en PostgreSQL local:
   - crea `User`
   - crea `Member`
   - crea rol `MEMBER`
6. si ya existe, lo reconcilia y actualiza

O sea:

- `Supabase` autentica
- `Postgres local` materializa la identidad del dominio

## Qué significa esto en desarrollo

Aunque el login contra Supabase ya funcione, no podremos validar el provisionado local de identidad si no existe una base PostgreSQL local accesible desde la app.

Por eso este setup es solo para `local development`.

No toca:

- Supabase production
- la futura base de datos de producción

## Variable necesaria

En `.env.local`:

```bash
DATABASE_URL=postgresql://wellstudio:wellstudio@localhost:5432/wellstudio
```

La app local seguirá usando también:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Flujo recomendado

### 1. Levantar Postgres local

```bash
pnpm db:up
```

Eso usa `docker compose` y levanta solo el servicio `db`.

### 2. Confirmar `DATABASE_URL`

Asegúrate de que `.env.local` contiene:

```bash
DATABASE_URL=postgresql://wellstudio:wellstudio@localhost:5432/wellstudio
```

### 3. Aplicar el schema actual

```bash
pnpm db:push
```

Si quieres regenerar el cliente Prisma:

```bash
pnpm db:generate
```

### 4. Arrancar la app

```bash
pnpm dev
```

### 5. Ejecutar auth sandbox real

```bash
set -a
source .env.local
source .env.e2e.local
set +a
pnpm test:e2e:auth:sandbox
```

## Qué podremos validar después

Cuando la DB local esté viva, ya podremos cerrar la siguiente capa:

- verificar que el primer login crea `User`
- verificar que crea `Member`
- verificar que crea rol `MEMBER`
- mostrar ese contexto real en `/app`

## Qué no es este Postgres

No es:

- la base de datos de Supabase
- una rama de Supabase
- la base productiva final

Es solo la base local de desarrollo del monolito.

La idea futura es:

- local: Postgres local
- producción: Postgres productivo separado

## Requisito práctico

Para `pnpm db:up` hace falta tener `Docker` disponible en la máquina.

Si `docker` no existe todavía, este runbook deja el repo listo, pero no podrá arrancar la base hasta instalar Docker Desktop o usar otro Postgres local equivalente.
