# ADR-008: Vercel-first para despliegues iniciales

Fecha: 2026-03-18
Estado: accepted

## Contexto

WellStudio ya tiene un monolito `Next.js` funcional con:

- auth real sobre `Supabase`
- `sandbox` y `production` como proyectos de datos e identidad
- necesidad de un `sandbox` desplegado cuanto antes
- un equipo muy pequeno y sin necesidad inmediata de operar un VPS

La decision previa de `VPS + Docker` como camino inmediato de despliegue
obligaba a introducir antes de tiempo:

- provisionado de servidor
- SSH y hardening basico
- runtime Docker operativo
- reverse proxy y gestion de dominio
- mas superficie de mantenimiento desde el primer deploy

## Decision

Adoptar `Vercel-first` como mecanismo inicial de despliegue para WellStudio V1.

Modelo de entornos:

- `Development` = entorno local
- `Preview` = `sandbox` desplegado automaticamente
- `Production` = despliegue real promovido manualmente

Modelo de datos:

- `Preview` usa `Supabase sandbox`
- `Production` usa `Supabase production`

## Motivo

- encaja de forma natural con `Next.js`
- reduce operacion y tiempo de bootstrap
- permite un `sandbox` real muy rapido
- mantiene separacion clara entre preview y produccion
- deja la promocion a `Production` bajo control humano

## Alternativas consideradas

### Opcion A: mantener `VPS + Docker` ahora

- pros
  - mas control operativo
  - independencia de proveedor
- contras
  - mas complejidad demasiado pronto
  - ralentiza la puesta en marcha de `sandbox`

### Opcion B: dos proyectos Vercel desde el inicio

- pros
  - mas aislamiento operativo
  - mas claridad de settings por entorno
- contras
  - mas configuracion de la necesaria para esta fase
  - menos simplicidad en el flujo inicial

## Consecuencias

- `preview` sera la rama integradora del `sandbox` desplegado automaticamente
- `main` seguira siendo la rama de `Production`
- la promocion a produccion ocurrira via `preview -> main`
- `Production` seguira bajo control humano porque no se trabajara directamente sobre `main`
- `staging` queda diferido
- `Docker` queda como herramienta opcional local, no como workflow principal de operacion

## Impacto en implementacion

- documentar el setup de Vercel y el mapeo de entornos
- documentar variables de entorno por `Development`, `Preview` y `Production`
- introducir `CI` basica en GitHub Actions
- alinear README y runbooks con el nuevo flujo
- dejar explicita la regla de no usar datos o credenciales de `production` en `Preview`
- mantener una rama `preview` publica y estable para validar cambios antes de integrarlos en `main`

## Referencias

- [README.md](/Users/miguelgarglez/Developer/wellstudio-platform/README.md)
- [wellstudio-supabase-environments-strategy.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/product/wellstudio-supabase-environments-strategy.md)
- [vercel-preview-and-production.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/runbooks/vercel-preview-and-production.md)
- `MIG-62`
