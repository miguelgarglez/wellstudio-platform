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
- la plataforma quedara razonablemente desacoplada si la integracion se encapsula bien
- se acepta una integracion SSR algo mas manual a cambio de menor coste y buena capacidad funcional
- la estrategia inicial de entornos sera `sandbox + production`, sin tercer proyecto Supabase por ahora

## Impacto en implementacion

- integrar Supabase Auth en el monolito `Next.js`
- definir sincronizacion o provisionado local de `User` y `Member`
- proteger rutas privadas y admin desde el boundary de auth
- mantener roles y permisos de negocio en la base de datos propia

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
