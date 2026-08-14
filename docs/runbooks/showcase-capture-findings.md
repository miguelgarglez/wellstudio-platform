# Showcase capture findings (Preview)

Notas de fallos / rarezas observadas al capturar pantallas reales para `/showcase` (Preview: `preview-wellstudio.miguelgarglez.com`).  
No son tickets cerrados: lista para estudiar y priorizar después.

Fecha de captura: 2026-08-13 / 2026-08-14.  
Última revisión sesión showcase: 2026-08-14.

Cuentas usadas: socio real (`miguel.garglez@gmail.com`); staff sandbox E2E admin (la cuenta personal no tiene rol `ADMIN`/`STAFF`).

## Resuelto en esta sesión

### Showcase visual (`/showcase`)

- **Antes:** slides `copy`, `outcome`, `hero` (salvo foto barbell) y `cta` mostraban gradiente vacío o placeholder; journey usaba inset pequeño.
- **Ahora:** las 9 slides llevan PNG reales vía `showcase-visuals.ts` + `showcase-visual-panel.tsx` (layouts `trio`, `duo`, `hero-stack`, `mosaic`, `quad`). Columna visual más ancha; en móvil la imagen va primero.
- Wiring anterior (`showcase-frames.tsx`) eliminado.

### Cobros cancelados — copy engañoso (#5 parcial)

- **Fix:** pagos `CANCELED` sin evento Stripe muestran **Cancelado sin cobro** en lugar de **Sin evento asociado** (`admin-payments-overview.ts` + test unitario).
- **Nota:** sigue siendo estado esperado cuando el checkout se abandona antes del webhook; el label ya no sugiere fallo de integración.

### Capture readiness — waits case-aware (#7 / MIG-162)

- **Fix:** `scripts/capture-showcase-shots.mjs` espera body/aria (no solo h1 shell), matching case-insensitive, rechaza skeletons `.animate-pulse`, timeouts acotados. Detalle en §7.

### Admin layout — menos trabajo duplicado (#1 parcial, 2026-08-14 sesión 1)

- **Fix:** `app/(admin)/layout.tsx` construye el shell con `buildAdminShellSummary(authContext)` tras un único `requireAdminOrStaffContext()`, sin segunda resolución que podía lanzar en edge cases.
- **No resuelve:** 500 intermitentes por timeout/cold start en Preview (infra).

### Admin estabilización — auth + agenda + overviews (#1 cerrado en código, 2026-08-14 / MIG-158)

- **Causa probable:** `requireAdminOrStaffContext()` llamaba a `requireAuthenticatedContext()`, que **lanza** si Supabase no devuelve sesión en el RSC aunque el middleware ya hubiera dejado pasar la ruta → HTTP 500 intermitente en re-navegaciones Preview.
- **Fix auth:** `resolveAdminAccess()` sin throw. Layout redirige a `/login?redirectTo=/admin` si no hay sesión; `notFound()` solo si hay sesión pero sin rol `ADMIN`/`STAFF`; `{ kind: 'unavailable' }` + UI tipada si Prisma/identidad falla.
- **Fix carga:** `getAdminSessionOverview` solo carga reservas de la sesión seleccionada; si esa sesión está fuera de la ventana o el detalle falla, la agenda sigue. El dossier de socios sobrevive si falla el workspace de reservas.
- **Fix overviews:** `readAdminOverview()` captura errores de Prisma en las RSC admin y pinta `AdminUnavailablePanel` (HTTP 200) en lugar de Application error. `app/(admin)/error.tsx` queda como red de último recurso.
- **Tests:** `tests/unit/auth/admin-access.test.ts`, `tests/unit/admin/admin-sessions-overview.test.ts`, `tests/unit/admin/admin-members-overview.test.ts`, `tests/unit/admin/admin-overview-result.test.ts`, `tests/unit/admin/admin-payments-overview.test.ts`.
- **Residual infra:** cold start / saturación Preview que **no llega a ejecutar** Next (`ERR_TIMED_OUT`, plataforma 504/timeout). Eso no se cierra en código; vigilar logs Vercel si reaparece tras deploy.

### Aislar E2E de la vitrina comercial (#2 / MIG-161)

- **Fix:** las queries comerciales (planes, clases, cuenta, agenda admin, socios, cobros) excluyen nombres/slugs `E2E …` / `e2e-*` / `admin-playground-*` y emails `@wellstudio.test`.
- Playwright envía `x-wellstudio-sandbox-fixtures: 1` para que los E2E sigan viendo sus fixtures. El script de captura no lo envía.
- **Operador:** re-seed Preview con `pnpm sandbox:showcase-vitrina` (y `SHOWCASE_MEMBER_EMAIL` si hace falta el perfil socio). No hay segunda BD.

### Perfil vitrina demo (#4 y #8 / MIG-160)

- Seed `showcase-vitrina`: Plan Constancia / Flex, Bono 6 sesiones, coaches Laura Martínez / Carlos Vega.
- Socios demo Laura Méndez, Carlos Ruiz, Ana Torres, Pablo Navarro con emails `@wellstudio.es`, plan o bono, y al menos una reserva próxima.
- Staff comercial: `pnpm sandbox:showcase-demo-admin` → `demo@wellstudio.es` / Equipo WellStudio.
- Path opcional `SHOWCASE_MEMBER_EMAIL` se mantiene.

## Severidad alta (producto / estabilidad) — pendiente

_Ningún hallazgo alto abierto en código. Revalidar en Preview tras deploy + seed._

## Severidad media (UX / seguridad percibida / demo) — pendiente

### 3. Soft-deny de `/admin` para no-admin = 404 branded

- **Qué:** Usuario autenticado solo `MEMBER` que abre `/admin` recibe **RUTA PERDIDA / 404**, no un “sin permiso”.
- **Código:** `app/(admin)/layout.tsx` llama `notFound()` si `resolveAdminAccess()` es `forbidden`.
- **¿Bug?** Probablemente **intencional** (no filtrar existencia del backoffice). Confirmar con producto: ¿preferimos 403/`/app` redirect con mensaje?
- **Impacto demo:** Confunde al capturar con cuenta personal sin roles staff.

## Severidad baja / ruido operativo — sin acción

### 6. CSP bloquea script de Vercel Live feedback

- Consola: CSP `script-src` rechaza `https://vercel.live/_next-live/feedback/feedback.js`.
- **¿Bug de producto?** No; hardening V1. Solo ruido al depurar Preview.

### 7. Carrera de readiness en dashboards admin (streaming) — resuelto (MIG-162)

- **Qué:** HTML 200 con shell (`AdminSectionShell` / h1) antes del cuerpo útil; waits case-sensitive fallaban con CSS `uppercase`; skeletons `.animate-pulse` se trataban como OK.
- **Fix (script):** `scripts/capture-showcase-shots.mjs` espera copy/aria del **body** (no solo el h1 del shell), matching case-insensitive, rechaza `.animate-pulse`, timeouts acotados (nav 60s / networkidle 20s / ready 30s / ≤5 intentos).
- **Marcadores estables por ruta admin:**
  - `/admin` → body: `Clases de hoy` / `Qué revisar ahora` · aria: `Resumen operativo` (shell `Control de hoy` no basta)
  - `/admin/sessions` → body: `Operativa diaria` / `Nueva sesión` / `La agenda está vacía` (shell `Agenda de sesiones` no basta)
  - `/admin/members` → body: `Busca por identidad` / `Filtrar socios por estado` (shell `Gestión de socios` no basta)
  - `/admin/payments` → body: `Pagos recientes` / `Bandeja operativa` · aria: `Monitor de cobros` (shell `Cobros` no basta)
- **Socio (misma lógica):** `/app` → `Tu plan y créditos`; `/app/reservations` → `Tu actividad confirmada`; `/app/account` → `Tarjeta vinculada` / `Pagos recientes`.

### 8. Operador staff en pantallas = identidad sandbox — resuelto en código (MIG-160)

- Sidebar E2E (`e2e.admin sandbox` / `@wellstudio.test`) queda para QA.
- Para capturas: `pnpm sandbox:showcase-demo-admin` crea **Equipo WellStudio** (`demo@wellstudio.es`).

## Capturas útiles resultantes

Buenas (no error pages):

- Público: `public-home`, `public-classes`, `public-plans`, `public-lead`
- Socio (Miguel): `member-home`, `member-reservations`, `member-account`
- Staff (E2E admin): `staff-overview`, `staff-sessions`, `staff-members`, `staff-payments`

Wiring UI: `modules/public/ui/showcase/showcase-visuals.ts` + `showcase-visual-panel.tsx`.

Script: `scripts/capture-showcase-shots.mjs` (`SHOWCASE_ONLY=public|member|staff`, Chrome channel, credenciales solo por env). Tras capturar, optimizar con `node scripts/optimize-showcase-shots.mjs` (genera `-thumb.webp` para deck y `.webp` full para lightbox).

### Galería / lightbox (2026-08-14)

- Clic en cualquier captura del deck abre lightbox fullscreen con carrusel (11 shots), captions en español, miniaturas, teclado ← → / Escape, swipe en móvil.
- Botón **Ver galería** en header y en slides journey.
- Deck usa `*-thumb.webp` (~20–33 KB); lightbox usa `.webp` full (~84–154 KB). PNG fuente se conserva como archivo de captura.
- Wiring: `showcase-gallery-context.tsx`, `showcase-gallery-lightbox.tsx`, metadata en `showcase-visuals.ts`.

## Orden sugerido de corrección (actualizado)

1. ~~Estabilizar 500 intermitente en admin Preview~~ → auth sin throw, overviews con UI tipada, sesión/socio seleccionado degradable. **Residual:** timeouts de plataforma (cold start) — vigilar logs Vercel post-deploy.
2. ~~Catálogo vitrina / aislar datos E2E~~ → filtro comercial + seed `showcase-*` (MIG-161). **Operador:** `pnpm sandbox:showcase-vitrina` en Preview.
3. ~~Perfil vitrina y cuenta staff limpia~~ → seed demo `@wellstudio.es` + `pnpm sandbox:showcase-demo-admin` (MIG-160).
4. Decidir UX de deny admin (404 vs redirect 403).
5. ~~Revisar cobros cancelados sin evento~~ → copy corregido; validar webhooks si aparecen `SUCCEEDED` sin evento.
