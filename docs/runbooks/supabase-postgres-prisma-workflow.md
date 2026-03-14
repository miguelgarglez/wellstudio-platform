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

## Variable necesaria

En `.env.local`:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

La app local seguirá usando también:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Flujo recomendado

### 1. Confirmar `DATABASE_URL`

Asegúrate de que `.env.local` contiene:

```bash
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-[YOUR-REGION].pooler.supabase.com:5432/postgres"
```

La cadena real debe salir del panel `Connect -> ORMs -> Prisma` de `Supabase sandbox`.
En este proyecto estamos usando la variante estable con `Session pooler 5432` como `DATABASE_URL`.

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

## Docker a partir de ahora

Docker deja de ser obligatorio para la base de datos en desarrollo.

Podrá seguir teniendo valor para:

- empaquetar la app
- probar la imagen final
- desplegar la app en VPS

Pero no es requisito para tener la base operativa en local.
