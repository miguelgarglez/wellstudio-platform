# Vercel Preview y Production

Fecha: 2026-03-18  
Estado: active setup guide

## Objetivo

Definir el primer flujo serio de despliegue para WellStudio sin introducir todavia un `VPS`.

El modelo vigente es:

- `Development` = entorno local
- `Preview` = sandbox desplegado automaticamente
- `Production` = despliegue real promovido manualmente

## Arquitectura operativa

Un unico proyecto `Vercel` servira la app.

Mapeo de entornos:

- `Development` en `Vercel` se usa solo para trabajo local con `vercel env pull` o configuracion equivalente
- `Preview` se usara como `sandbox` real de la app
- `Production` se reservara para la publicacion real

Mapeo de datos:

- `Preview` -> `Supabase sandbox`
- `Production` -> `Supabase production`

Regla critica:

- `Preview` nunca debe usar datos o credenciales de `production`

## Flujo Git

### Ramas activas

- `preview` es la rama integradora del `sandbox`
- los pushes a `preview` deben producir un `Preview Deployment`
- ese `Preview Deployment` es el `sandbox` operativo que se valida antes de cualquier promocion
- `main` se reserva para la version candidata a `Production`

### Rama de produccion en Vercel

`main` debe mantenerse como `Production Branch` del proyecto.

Flujo recomendado:

- integrar cambios en `preview`
- validar en el deployment `Preview`
- promover cambios a `main` mediante merge o PR
- dejar que `main` publique en `Production`

## Setup inicial en Vercel

1. Importar el repo `wellstudio-platform` en `Vercel`.
2. Confirmar deteccion de `Next.js`.
3. En `Project Settings -> Environments`, dejar definido:
   - `Production Branch`: `main`
4. Conectar variables de entorno por entorno.
5. Confirmar que los pushes a `preview` generan `Preview Deployments`.

## Variables por entorno

## Development

Uso:

- trabajo local
- smoke local
- pruebas manuales en maquina del desarrollador

Variables minimas:

- `DATABASE_URL` -> `Supabase sandbox`
- `NEXT_PUBLIC_SUPABASE_URL` -> `Supabase sandbox`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> `Supabase sandbox`
- `NEXT_PUBLIC_APP_URL` -> `http://localhost:3000`

Nota:

- `Playwright` levanta su propio servidor en `3001`
- esto no cambia la URL base de desarrollo diario

## Preview

Uso:

- `sandbox` desplegado automaticamente
- validacion de login, registro y recovery
- smoke remoto de cambios integrados

Variables minimas:

- `DATABASE_URL` -> `Supabase sandbox`
- `NEXT_PUBLIC_SUPABASE_URL` -> `Supabase sandbox`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> `Supabase sandbox`
- `NEXT_PUBLIC_APP_URL` -> opcional al inicio; si no existe, la app cae a `window.location.origin`

Recomendacion:

- usar la URL estable del branch deployment de `preview`
- si mas adelante se configura dominio, reservar un subdominio de sandbox para esa rama

## Production

Uso:

- app real para usuarios reales
- auth y datos reales

Variables minimas:

- `DATABASE_URL` -> `Supabase production`
- `NEXT_PUBLIC_SUPABASE_URL` -> `Supabase production`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> `Supabase production`
- `NEXT_PUBLIC_APP_URL` -> dominio real de produccion

## Validacion de sandbox

Cada cambio integrado en `preview` debe poder validarse en `Preview` al menos con:

- carga de landing publica
- carga de `/login` y `/register`
- flujo de auth ya validado contra `Supabase sandbox` cuando proceda
- smoke local verde antes del push

Comandos base:

```bash
pnpm check:foundation
pnpm test:e2e:smoke
```

## Promocion manual a Production

La publicacion en `Production` se desencadena al integrar `preview` en `main`.

Flujo recomendado:

1. validar el deployment de `Preview` deseado en la rama `preview`
2. abrir PR o merge controlado de `preview` a `main`
3. confirmar que `main` publica en `Production`
4. validar la version real contra variables de `Production`

Alternativa para promocion puntual desde CLI/dashboard sobre un deployment concreto:

```bash
vercel promote <deployment-url-o-id>
```

Importante:

- el deploy de `main` usa variables de `Production`
- no se debe trabajar directamente sobre `main` salvo casos excepcionales y muy controlados

## Rollback

Rollback desde dashboard:

1. abrir `Deployments`
2. localizar el ultimo deployment sano
3. promoverlo de nuevo a `Production` o revertir `main`

Rollback desde CLI:

```bash
vercel rollback <deployment-url-o-id>
```

## CI minima

La `CI` de GitHub debe validar:

- `pnpm check:foundation`
- `pnpm test:e2e:smoke`

La `CI` no despliega a `Production`.
El despliegue a `Preview` lo resuelve `Vercel` mediante la integracion Git.

## Lo que queda diferido

- entorno `staging` separado
- datos anonimizados o replica de produccion
- automatizacion del deploy a produccion
- politica avanzada de rollback
- observabilidad especifica de runtime
