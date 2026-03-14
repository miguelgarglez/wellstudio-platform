# ADR-002: Despliegue inicial de la app en VPS con Docker

Fecha: 2026-03-13
Estado: accepted

## Contexto

WellStudio se plantea como oportunidad comercial con necesidad de:

- coste mensual contenido
- despliegue repetible
- mantenimiento razonable
- independencia de proveedores excesivamente acoplantes

Se estudiaron varias opciones:

- `Vercel + servicios gestionados`
- `Cloudflare + Supabase`
- `VPS + Docker`

## Decision

La opcion objetivo inicial sera desplegar el monolito `Next.js` sobre `VPS + Docker`.

## Motivo

- permite coste mensual muy bajo
- sigue siendo una forma seria de operar V1
- encaja bien con monolito modular
- mantiene flexibilidad para evolucionar a otra plataforma si el producto crece
- deja la base de datos fuera del VPS cuando se usa `Supabase Postgres`

## Alternativas consideradas

### Opcion A: Vercel + managed services

- pros
  - menos operacion
  - mejor DX de despliegue
- contras
  - coste fijo mayor
  - mayor dependencia de proveedor

### Opcion B: Cloudflare + Supabase

- pros
  - coste muy bajo
  - rendimiento muy bueno para capas edge
- contras
  - menos natural para el enfoque elegido
  - puede forzar decisiones demasiado serverless desde el inicio

## Consecuencias

- hay que definir runbooks de despliegue y backup
- la operacion minima pasa a ser responsabilidad del equipo
- conviene mantener la infraestructura sobria y documentada
- el VPS queda centrado en servir la app, no en alojar la base de datos

## Impacto en implementacion

- preparar `Dockerfile`
- preparar despliegue del contenedor de la app
- documentar variables de entorno
- coordinar la app con `Supabase Auth` y `Supabase Postgres`

## Referencias

- [hosting-pricing-wellstudio-v1.md](/Users/miguelgarglez/Developer/wellstudio-analysis/hosting-pricing-wellstudio-v1.md)
- `MIG-19`
- `MIG-16`
