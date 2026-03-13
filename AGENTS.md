# Repository Instructions

## Objetivo del repo

Construir WellStudio como monolito modular en `Next.js`.

## Stack objetivo

- `Next.js`
- `TypeScript`
- `Prisma`
- `Supabase Auth`
- `PostgreSQL`
- `Docker`

## Principios de arquitectura

- `app/` solo contiene rutas, layouts y UI
- el dominio vive en `modules/*`
- `lib/db` encapsula cliente y acceso a datos compartido
- `modules/auth` es el unico boundary que habla con `Supabase Auth`
- el resto de modulos trabajan con identidad local y modelos de dominio propios

## Regla critica

No introducir logica de negocio en:

- componentes React
- route handlers finos
- server actions finas

Las reglas de negocio deben vivir en casos de uso y servicios dentro de `modules/*`.

## Documentacion fuente

Leer primero:

- `docs/adr`
- `docs/architecture`
- `docs/product`

Especialmente:

- `docs/adr/ADR-001-monolito-modular-nextjs.md`
- `docs/adr/ADR-005-prisma-as-v1-orm.md`
- `docs/adr/ADR-006-auth-provider-supabase.md`
- `docs/architecture/wellstudio-data-model-v1.md`
- `docs/architecture/wellstudio-prisma-schema-proposal-v1.md`
- `docs/product/wellstudio-flow-inventory.md`

## Estilo de trabajo

- preferir cambios pequeños y trazables
- no inventar nueva arquitectura sin ADR o justificacion fuerte
- mantener testing cerca de auth, reservations, eligibility y payments
- si una decision cambia la arquitectura, actualizar ADR o documentacion relacionada

## Politica de Git y commits

- usar ramas de trabajo, pero no hace falta una rama por ticket pequeno
- preferir una rama por bloque coherente de trabajo
- incluir siempre el ID de Linear en el cuerpo del commit, por ejemplo `Refs: MIG-39`
- usar commits pequenos, estables e independientes cuando sea razonable
- no mezclar cambios de dominio no relacionados en un solo commit
- no esperar al final de una gran fase para commitear todo junto

Convencion recomendada:

- commit message en formato conventional commit
- scopes cortos y utiles como `repo`, `data`, `auth`, `test`

## Restriccion operativa

Antes de instalar dependencias nuevas, pedir confirmacion al usuario.
