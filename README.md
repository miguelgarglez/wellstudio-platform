# WellStudio Platform

Demo de portfolio para un centro boutique: agenda pública, reservas de socios,
operativa de staff y compra de bonos. Monolito modular en Next.js, con datos
sintéticos y sin adopción comercial acreditada.

## Evaluar el proyecto

- [Ficha de portfolio y capturas](https://miguelgarglez.com/projects/wellstudio-platform/).
- [Demo Preview](https://preview-wellstudio.miguelgarglez.com): entorno sandbox;
  no introducir datos personales ni tarjetas reales.
- [Código de la línea Preview](https://github.com/miguelgarglez/wellstudio-platform/tree/preview).
  La rama por defecto `main` sigue una línea distinta.
- [Showcase con capturas](https://preview-wellstudio.miguelgarglez.com/showcase):
  conserva los recorridos público → socio → staff. El deck comercial es un
  artefacto del proyecto, no evidencia de clientes ni de uso real.

### Decisiones que merece la pena revisar

- **Última plaza:** las mutaciones de reserva agrupan capacidad, elegibilidad,
  consumo de créditos y notificaciones en transacciones serializables con
  reintentos acotados. La regresión PostgreSQL de [PR #10](https://github.com/miguelgarglez/wellstudio-platform/pull/10)
  fuerza dos reservas solapadas y comprueba sus efectos persistidos.
- **Historial:** una restricción única por socio, sesión y estado impedía repetir
  cancelaciones o salidas de waitlist. PR #10 elimina esa unicidad global y
  conserva los índices parciales para estados activos, sin borrar el historial.
- **Pagos idempotentes:** los eventos del proveedor, la cuenta de créditos por
  pago y el job de notificación tienen claves estables. La confirmación verifica
  el importe y la moneda contra el snapshot local antes de conceder créditos.
  Ver [implementación](./modules/payments/server/credit-pack-checkout.ts) y
  [regresiones](./tests/unit/payments/credit-pack-checkout.test.ts).

## Estado y límites de la evidencia

Revisión documental: **21 de septiembre de 2026**, sobre
[`preview`](https://github.com/miguelgarglez/wellstudio-platform/tree/preview),
con las PRs de dependencias, demo, datos, CI, auth y reservas integradas (#8–#12 y #14).
La revisión combinada con la actualización de dependencias,
[`f06e3df`](https://github.com/miguelgarglez/wellstudio-platform/tree/f06e3dfecb541c8545f31f61aab78d94cc90410b),
supera 402 unitarios, el gate de auth y CI con PostgreSQL. Las suites contra
Supabase sandbox pasan en serie: auth 3 casos y 1 registro omitido, reservas 6
y pagos simulados 6. La validación grabada de auth y pagos empezó sin cookies
ni storage. **Una comprobación local o un deployment
READY no acreditan por sí solos todos los recorridos del sistema desplegado.**

Los pagos validados usan `PAYMENTS_CHECKOUT_MODE=sandbox`,
el simulador de la aplicación. No equivalen a Stripe Checkout en modo test ni a
un cobro real. La revisión corrige redirects que cambiaban del origen visible
al host interno del servidor. Quedan pendientes OTP exitoso con correo recibido,
proveedores reales y operación del scheduler. La auditoría conserva un advisory high de
`deepmerge-ts`, dependiente de Prisma. No se declara el cierre de estos límites.

El [runbook de portfolio y mantenimiento](./docs/runbooks/portfolio-maintenance.md)
registra revisiones, resultados observados, riesgos abiertos y condiciones
para actualizar estas afirmaciones.

## Stack

- Next.js y TypeScript: rutas y UI en `app/`; casos de uso en `modules/*`.
- Prisma y PostgreSQL: dominio local, historial, ledger y outbox.
- Supabase Auth: identidad externa aislada en `modules/auth`.
- Stripe Checkout y proveedor sandbox: bonos y vinculación de tarjeta.
- Vercel: entornos Preview y Production separados.

## Arranque local y comprobaciones sin credenciales remotas

Desde la raíz del repo, usar **Node 22.23.2** y **pnpm 10.21.0**.
Si se usa nvm: `nvm install 22.23.2 && nvm use 22.23.2`.
Ejecutar en un checkout aislado, sin archivos privados de entorno:

```bash
pnpm install --frozen-lockfile
export DATABASE_URL=postgresql://wellstudio:wellstudio@127.0.0.1:55432/wellstudio_integration
export DIRECT_URL="$DATABASE_URL"
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export NEXT_PUBLIC_SUPABASE_ANON_KEY=local-placeholder
export NEXT_PUBLIC_APP_URL=http://localhost:3000
export NEXT_PUBLIC_AGENTATION_ENABLED=false
export PAYMENTS_CHECKOUT_MODE=sandbox
export E2E_AUTH_SANDBOX=false
export NEXT_TELEMETRY_DISABLED=1
pnpm db:generate
pnpm exec next typegen
pnpm check:foundation
```

`check:foundation` ejecuta lint, typecheck, unitarios y build. Estos placeholders
permiten esas comprobaciones; no configuran login, correo ni pagos de Stripe.
`pnpm dev` arranca el servidor local, pero los recorridos con datos necesitan
PostgreSQL y los privados requieren una configuración de Auth autorizada.

El [runbook](./docs/runbooks/portfolio-maintenance.md) incluye PostgreSQL aislado
y la suite de integración. La cadena versionada ya contiene el baseline para
bases nuevas. Una base existente necesita reconciliación previa de su historial;
`db push` no sustituye la validación de migraciones e índices parciales.

## Tres ADRs para entender el diseño

1. [ADR-001: monolito modular](./docs/adr/ADR-001-monolito-modular-nextjs.md):
   una aplicación desplegable con boundaries de dominio.
2. [ADR-004: elegibilidad y cancelación](./docs/adr/ADR-004-eligibility-and-cancellation-model.md):
   separar el derecho a reservar del pago y registrar el entitlement consumido.
3. [ADR-005: Prisma](./docs/adr/ADR-005-prisma-as-v1-orm.md):
   modelo relacional tipado, con SQL específico cuando lo requieren las invariantes.

## Operación y documentación

El alcance funcional queda congelado para portfolio; el mantenimiento se limita
a seguridad, demo rota y enlaces. La política y el registro de validación viven
en el [runbook](./docs/runbooks/portfolio-maintenance.md).

- [Entornos y despliegue](./docs/runbooks/vercel-preview-and-production.md):
  `preview` → sandbox; `main` → Production. Integrar en `main` es una decisión
  de publicación separada, nunca una simple sincronización de ramas.
- [Flujo de datos](./docs/runbooks/supabase-postgres-prisma-workflow.md).
- [Gates de testing](./docs/product/wellstudio-testing-gates-v1.md).
- [Índice documental](./docs/README.md): arquitectura y ADRs como fuente técnica;
  producto y testing en `docs/product`; backlog en Linear.

Los documentos de venta, onboarding y go-live conservan el contexto original.
No acreditan adopción comercial ni constituyen el alcance actual de mantenimiento.
