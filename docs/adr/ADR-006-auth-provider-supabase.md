# ADR-006: Supabase Auth como proveedor de autenticacion para WellStudio V1

Fecha: 2026-03-13
Estado: accepted

## Contexto

WellStudio V1 necesita una solucion de autenticacion que:

- encaje razonablemente bien con `Next.js App Router`
- reduzca riesgo y mantenimiento
- tenga coste muy bajo o nulo a la escala inicial
- permita verificacion, recovery y sesiones serias
- no distraiga del dominio principal del producto

Las candidatas evaluadas fueron:

- Supabase Auth
- Clerk
- Firebase Auth

## Decision

Elegir `Supabase Auth` como proveedor de autenticacion para WellStudio V1.

## Motivo

- free tier muy generoso para la escala esperada
- coste futuro muy contenido
- funcionalidad suficiente para una V1 comercial seria
- buena combinacion con `Prisma` si se mantiene el dominio desacoplado
- evita pagar pronto por branding o features no criticas

## Alternativas consideradas

### Opcion A: Clerk

- pros
  - gran DX con `Next.js`
  - experiencia de auth muy pulida
- contras
  - mayor probabilidad de pagar por features antes que por volumen
  - mas dependencia del proveedor

### Opcion B: Firebase Auth

- pros
  - robusto
  - conocido
  - puede salir gratis a la escala inicial
- contras
  - peor encaje con el stack elegido
  - integracion mas manual

## Consecuencias

- el modulo `auth` de la aplicacion se apoyara en Supabase Auth
- el dominio seguira manteniendo sus propios `users`, `members` y roles
- la base de datos V1 tambien podra vivir en `Supabase Postgres` sin abandonar `Prisma`
- la plataforma quedara razonablemente desacoplada si la integracion se encapsula bien
- se acepta una integracion SSR algo mas manual a cambio de menor coste y buena capacidad funcional
- la estrategia inicial de entornos sera `sandbox + production`, sin tercer proyecto Supabase por ahora

## Seguridad de sesion (V1)

Decision operativa alineada con `@supabase/ssr`:

- las cookies de sesion usan los defaults del cliente SSR (`path=/`, `sameSite=lax`, `httpOnly=false`)
- esto permite al browser client refrescar y persistir la sesion; **no** es el modelo ideal de cookie `httpOnly` descrito en la arquitectura generica
- el riesgo residual es: cualquier XSS puede leer tokens de sesion
- mitigaciones V1:
  - validar sesion con `getUser()` en proxy e identity (no confiar solo en `getSession()`)
  - RBAC en Prisma, nunca en `user_metadata` editable
  - `service_role` solo en scripts sandbox, fuera del runtime de app
  - redirects post-auth restringidos a paths internos (`resolveSafeInternalPath`)
  - `Cache-Control: private, no-store` en respuestas del proxy
- riesgos diferidos a tickets (no “arreglos” por inercia sin decision):
  - vinculacion local por email que puede heredar roles → `MIG-142` (**mitigado**: conflict fail-closed si el email ya tiene otro `externalAuthId`; en primer link por email se eliminan `ADMIN`/`STAFF`)
  - endurecimiento CSP / higiene XSS alrededor del tradeoff non-httpOnly → `MIG-143` (**mitigado**: headers de seguridad en `next.config.ts`)
  - re-auth opcional tras password recovery → `MIG-144` (**mitigado**: `signOut` global + redirect a login)
  - tracking: `MIG-141` (open redirect cerrado en `MIG-145`)

### Politica de identity linking (MIG-142)

1. Resolver primero por `(supabase, externalAuthId)`.
2. Si no hay match, resolver por `normalizedEmail` solo cuando el row local no tiene otro `externalAuthId`.
3. Si el email ya esta ligado a otra identidad Auth → `IdentityLinkConflictError` (no se absorbe la cuenta).
4. Primer link por email exige email verificado en Supabase y **no** conserva `ADMIN`/`STAFF` (grant manual / scripts controlados).
5. Borrar solo `auth.users` deja el `User` local huérfano; un re-registro con el mismo email choca con esa política. El reset de prueba tiene que cubrir Auth **y** la fila Prisma, o reenlazar `externalAuthId` a mano. Comando: `pnpm sandbox:auth:delete`. `/auth/after-login` captura el conflicto y redirige a login (`MIG-164`).

La arquitectura ideal (`httpOnly` + CSRF clasico) sigue siendo valida como norte; en V1 se documenta explicitamente la desviacion por el stack Supabase SSR elegido en este ADR.

## Impacto en implementacion

- integrar Supabase Auth en el monolito `Next.js`
- definir sincronizacion o provisionado local de `User` y `Member`
- los metadatos de Supabase inicializan nombre y telefono solo al crear `Member`; despues, `modules/members` es la fuente de verdad y cada login no puede sobrescribir el perfil local
- proteger rutas privadas y admin desde el boundary de auth
- mantener roles y permisos de negocio en la base de datos propia
- validar redirects post-login / confirmacion con allowlist de path relativo interno

## Referencias

- [wellstudio-auth-provider-decision.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-auth-provider-decision.md)
- [wellstudio-supabase-auth-prisma-integration.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-supabase-auth-prisma-integration.md)
- [wellstudio-auth-free-tier-comparison.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-auth-free-tier-comparison.md)
- [wellstudio-supabase-environments-strategy.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/product/wellstudio-supabase-environments-strategy.md)
- `MIG-22`
- `MIG-31`
- `MIG-33`
- `MIG-35`
- `MIG-36`
- `MIG-141` (session security audit follow-ups)
- `MIG-142` / `MIG-143` / `MIG-144` / `MIG-145`
