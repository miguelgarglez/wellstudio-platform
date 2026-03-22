# Supabase Postgres + Prisma Workflow

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

Piensa en Supabase como `la puerta de entrada` y tambien como `el hosting de la base de datos`.

### 2. Prisma dentro de la app

Sirve para:

- `User`
- `Member`
- `UserRole`
- reservas
- suscripciones
- pagos
- resto del dominio propio de WellStudio

Piensa en Prisma como `la capa con la que nuestra app trabaja sobre esa base`.

## Qué pasa cuando un usuario inicia sesión

1. el usuario mete email y contraseña
2. Supabase sandbox valida las credenciales
3. la app recibe la sesión autenticada
4. la capa server de WellStudio ejecuta `ensureLocalUser()`
5. si el usuario no existe en la base del proyecto `sandbox`:
   - crea `User`
   - crea `Member`
   - crea rol `MEMBER`
6. si ya existe, lo reconcilia y actualiza

O sea:

- `Supabase` autentica
- `Supabase Postgres` aloja la identidad y el dominio
- `Prisma` materializa y gestiona la identidad del dominio desde el monolito

## Qué significa esto en desarrollo

Aunque el login contra Supabase ya funcione, no podremos validar el provisionado del dominio si la app no tiene `DATABASE_URL` apuntando a la base del proyecto `sandbox`.

Este setup evita forzar Postgres en Docker como camino principal de desarrollo.

## Variables necesarias

En `.env.local`:

```bash
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-[YOUR-REGION].pooler.supabase.com:5432/postgres"
```

La app local seguirá usando también:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Pooler vs conexion directa

Supabase nos da dos formas de entrar a la misma base `Postgres`:

### 1. `DATABASE_URL`

Usa el `pooler`:

- host `*.pooler.supabase.com`
- puerto `6543`
- normalmente con `?pgbouncer=true`

Piensa en esto como `la puerta de acceso para la app`.

Sirve bien para:

- peticiones normales del monolito
- lecturas y escrituras del runtime web
- conexiones mas eficientes y reutilizadas

### 2. `DIRECT_URL`

Usa la conexion directa:

- mismo host base
- puerto `5432`

Piensa en esto como `la puerta de acceso para operaciones de esquema`.

Sirve mejor para:

- `prisma db push`
- migraciones
- operaciones administrativas sobre la estructura de la base

Regla simple:

- `DATABASE_URL` para runtime
- `DIRECT_URL` para cambios de schema

## Flujo recomendado

### 1. Confirmar `DATABASE_URL` y `DIRECT_URL`

Asegúrate de que `.env.local` contiene:

```bash
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-[YOUR-REGION].pooler.supabase.com:5432/postgres"
```

La cadena real debe salir del panel `Connect -> ORMs -> Prisma` de `Supabase sandbox`.

En este proyecto:

- `DATABASE_URL` debe ser la variante de `pooler`
- `DIRECT_URL` debe ser la variante directa

### 2. Aplicar el schema actual

```bash
pnpm db:push
```

Si quieres regenerar el cliente Prisma:

```bash
pnpm db:generate
```

### 3. Arrancar la app

```bash
pnpm dev
```

### 4. Ejecutar auth sandbox real

```bash
set -a
source .env.local
source .env.e2e.local
set +a
pnpm test:e2e:auth:sandbox
```

## Qué podremos validar después

Cuando la app local esté conectada correctamente a `Supabase sandbox`, ya podremos cerrar la siguiente capa:

- verificar que el primer login crea `User`
- verificar que crea `Member`
- verificar que crea rol `MEMBER`
- mostrar ese contexto real en `/app`

## Qué no es este setup

No es:

- una base local separada
- una rama local de Postgres
- un sustituto de producción

Es el mismo modelo de datos del producto, pero usando `sandbox` como entorno remoto.

La idea futura es:

- local: `Supabase sandbox`
- producción: `Supabase production`

## Bootstrap de production

Cuando levantamos `production` por primera vez puede pasar esto:

- `Supabase Auth` ya funciona
- pero la base `Postgres` aun no tiene las tablas Prisma

El sintoma tipico es:

- el login entra bien
- `/app` falla al intentar leer `User`, `Member` o `UserRole`
- Prisma devuelve errores tipo `The table public.User does not exist`

En ese primer bootstrap la accion pragmatica es:

```bash
DIRECT_URL="postgresql://..." DATABASE_URL="postgresql://..." pnpm prisma db push
```

En la practica, la operacion de schema debe hacerse contra la conexion directa de `5432`.

## Politica Prisma de WellStudio

### Fase actual

Mientras estamos cerrando bootstrap de entornos y primeras tablas:

- `db push` es aceptable para bases nuevas o casi vacias
- se usa para alinear rapido `sandbox` o `production` con `schema.prisma`

### Fase siguiente recomendada

Cuando el proyecto tenga ya cambios recurrentes de modelo:

1. cambiar `schema.prisma`
2. ejecutar `pnpm prisma migrate dev` en local
3. commitear la migracion generada
4. aplicar en entornos remotos con `pnpm prisma migrate deploy`

Regla simple:

- `db push` para bootstrap temprano
- `migrate dev` para crear migraciones
- `migrate deploy` para aplicar migraciones versionadas en remoto

## Docker a partir de ahora

Docker deja de ser obligatorio para la base de datos en desarrollo.

Podrá seguir teniendo valor para:

- empaquetar la app
- probar la imagen final
- desplegar la app en VPS

Pero no es requisito para tener la base operativa en local.
