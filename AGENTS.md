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

- `README.md`
- `docs/README.md`
- `docs/adr`
- `docs/architecture`
- `docs/product`

Especialmente:

- `docs/adr/ADR-001-monolito-modular-nextjs.md`
- `docs/adr/ADR-003-v1-product-scope.md`
- `docs/adr/ADR-005-prisma-as-v1-orm.md`
- `docs/adr/ADR-006-auth-provider-supabase.md`
- `docs/adr/ADR-007-supabase-postgres-hosting.md`
- `docs/architecture/technical-architecture-wellstudio-v1.md`
- `docs/architecture/wellstudio-data-model-v1.md`
- `docs/architecture/wellstudio-prisma-schema-proposal-v1.md`
- `docs/product/prd-wellstudio-platform-v1.md`
- `docs/product/wellstudio-flow-inventory.md`

## Reading map por tipo de tarea

### Si la tarea es de UI o UX

Leer antes:

- `docs/product/wellstudio-design-system-v1.md`
- `docs/product/prd-wellstudio-platform-v1.md`
- `docs/discovery/reverse-engineering-wellstudio.md`
- `docs/adr/ADR-003-v1-product-scope.md`

Mirar tambien el estado real de:

- `app/(public)/*`
- `app/(member)/*`
- `components/ui/*`
- `modules/auth/ui/*`

### Si la tarea es de auth

Leer antes:

- `docs/adr/ADR-006-auth-provider-supabase.md`
- `docs/product/wellstudio-auth-e2e-strategy.md`
- `docs/product/wellstudio-supabase-auth-sandbox-setup.md`
- `docs/product/wellstudio-auth-gap-email-confirmation.md`
- `docs/runbooks/auth-sandbox-operations.md`
- `docs/runbooks/supabase-postgres-prisma-workflow.md`

Mirar tambien:

- `modules/auth/*`
- `proxy.ts`
- `app/auth/*`
- `tests/unit/auth/*`
- `tests/e2e/auth/*`

### Si la tarea es de dominio, datos o Prisma

Leer antes:

- `docs/adr/ADR-005-prisma-as-v1-orm.md`
- `docs/adr/ADR-007-supabase-postgres-hosting.md`
- `docs/architecture/wellstudio-data-model-v1.md`
- `docs/architecture/wellstudio-prisma-schema-proposal-v1.md`
- `docs/product/wellstudio-flow-inventory.md`

Mirar tambien:

- `prisma/schema.prisma`
- `prisma.config.ts`
- `lib/db/*`
- `modules/*/server/*`

### Si la tarea es de testing o QA

Leer antes:

- `docs/product/wellstudio-testing-strategy.md`
- `docs/product/wellstudio-testing-coverage-plan-v1.md`
- `docs/product/wellstudio-testing-gates-v1.md`
- `docs/product/wellstudio-test-data-strategy-v1.md`
- `docs/product/wellstudio-auth-e2e-strategy.md`

Mirar tambien:

- `tests/unit/*`
- `tests/e2e/*`
- `playwright.config.ts`
- `package.json`

### Si la tarea es de infra, entorno o despliegue

Leer antes:

- `docs/adr/ADR-002-vps-docker-deployment.md`
- `docs/adr/ADR-007-supabase-postgres-hosting.md`
- `docs/product/wellstudio-supabase-environments-strategy.md`
- `docs/runbooks/docker-local-and-vps.md`
- `docs/runbooks/supabase-postgres-prisma-workflow.md`

Mirar tambien:

- `.env.example`
- `Dockerfile`
- `docker-compose.yml`
- `next.config.ts`

## Gaps conocidos que no se deben \"resolver\" por inercia

- el email confirmation end-to-end completo esta diferido y documentado en `docs/product/wellstudio-auth-gap-email-confirmation.md`
- no introducir infraestructura adicional de correo para QA sin decision explicita
- no reabrir debate de arquitectura base sin una razon fuerte y documentada

## Estilo de trabajo

- preferir cambios pequeños y trazables
- no inventar nueva arquitectura sin ADR o justificacion fuerte
- mantener testing cerca de auth, reservations, eligibility y payments
- si una decision cambia la arquitectura, actualizar ADR o documentacion relacionada

## Gates de testing

- no marcar issues de `auth`, `reservations` o `payments` como terminadas sin pasar sus gates
- para cambios base de repo o arquitectura, ejecutar `pnpm check:foundation`
- para cambios de auth, ejecutar `pnpm check:auth`
- si aparece un bug real en login, sesion, reservas, cancelaciones, pagos o permisos, añadir test de regresion antes de cerrar
- dejar constancia resumida en Linear de lo que se valido cuando el ticket sea sensible

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
