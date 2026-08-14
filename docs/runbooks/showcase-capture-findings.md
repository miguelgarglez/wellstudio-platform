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

### Admin layout — menos trabajo duplicado (#1 parcial, 2026-08-14 sesión 1)

- **Fix:** `app/(admin)/layout.tsx` construye el shell con `buildAdminShellSummary(authContext)` tras un único `requireAdminOrStaffContext()`, sin segunda resolución que podía lanzar en edge cases.
- **No resuelve:** 500 intermitentes por timeout/cold start en Preview (infra).

### Admin estabilización — auth + agenda (#1 parcial, 2026-08-14 sesión 2 / MIG-158)

- **Causa probable:** `requireAdminOrStaffContext()` llamaba a `requireAuthenticatedContext()`, que **lanza** si Supabase no devuelve sesión en el RSC aunque el middleware ya hubiera dejado pasar la ruta → HTTP 500 intermitente en re-navegaciones Preview.
- **Fix auth:** nuevo `resolveAdminAccess()` (sin throw). Layout redirige a `/login?redirectTo=/admin` si no hay sesión; `notFound()` solo si hay sesión pero sin rol `ADMIN`/`STAFF`. Reintento único de `getUser()` ante error transitorio de Supabase.
- **Fix carga:** `getAdminSessionOverview` ya no trae el roster completo de **todas** las sesiones del window (45 días); solo carga reservas de la sesión seleccionada → menos presión en BD/timeout en `/admin/sessions`.
- **Tests:** `tests/unit/auth/admin-access.test.ts`, `tests/unit/admin/admin-sessions-overview.test.ts`.
- **Sigue abierto:** cold start / saturación Preview; timeouts extremos (`ERR_TIMED_OUT`); confirmar en logs Vercel tras despliegue.

## Severidad alta (producto / estabilidad) — pendiente

### 1. 500 / Application error intermitente en admin (Preview)

- **Qué:** Tras login admin válido, re-navegar a `/admin` (y a veces `/admin/sessions`, `/admin/members`) devolvió `Application error` + `Digest: …` o HTTP 500.
- **Evidencia:** Capturas fallidas de ~44KB; script de captura falló varias veces con `broken=true` / `status=500` aunque un probe posterior a la misma URL respondía 200.
- **También visto:** `page.goto` a `/admin/sessions` con `net::ERR_TIMED_OUT` (~16 min de job colgado) — Preview a ratos no responde a tiempo.
- **Mitigación de captura:** Evitar re-`goto` del overview post-login; reintentos + wait de texto listo (`CONTROL DE HOY`, `AGENDA DE SESIONES`, …).
- **Fix código (2026-08-14):** ver sección *Resuelto* → auth sin throw + roster lazy en sessions overview. Revalidar en Preview tras deploy.
- **Investigar si persiste:** logs Vercel Preview del digest; cold start / saturación.

### 2. Etiquetas y datos E2E visibles en cuentas “reales”

- **Qué:** En la cuenta de Miguel aparecen créditos/bonos con nombre **`E2E Bono Checkout`**; en cobros admin hay filas Miguel + E2E con el mismo catálogo sandbox.
- **Por qué importa:** En ventas/portfolio ensucia la historia (“producto de verdad” vs laboratorio).
- **Estado:** Escenario `showcase-vitrina` disponible — ver `docs/runbooks/showcase-vitrina-seed.md`. Ejecutar antes de re-capturar.
- **Acción recomendada:** `pnpm sandbox:showcase-vitrina` + perfil `SHOWCASE_MEMBER_EMAIL` para socio comercial.

## Severidad media (UX / seguridad percibida / demo) — pendiente

### 3. Soft-deny de `/admin` para no-admin = 404 branded

- **Qué:** Usuario autenticado solo `MEMBER` que abre `/admin` recibe **RUTA PERDIDA / 404**, no un “sin permiso”.
- **Código:** `app/(admin)/layout.tsx` llama `notFound()` si `requireAdminOrStaffContext()` es null.
- **¿Bug?** Probablemente **intencional** (no filtrar existencia del backoffice). Confirmar con producto: ¿preferimos 403/`/app` redirect con mensaje?
- **Impacto demo:** Confunde al capturar con cuenta personal sin roles staff.

### 4. Estado comercial débil de la cuenta demo “realista”

- Miguel: **sin plan activo**, **sin tarjeta**, **sin reservas próximas**, 6 créditos de bono E2E.
- Socios admin: muchos emails/nombres tipo `E2E Member`, `Alex Sin Plan`, playground…
- Agenda: sesiones `E2E Agenda Flow`, `Admin Playground Recovery`, varias canceladas / sin coach / aforo 0.
- **Acción demo:** preparar un “perfil vitrina” (plan + reserva + coach + nombres limpios) antes de enseñar a gyms — operativo, no código.

## Severidad baja / ruido operativo — sin acción

### 6. CSP bloquea script de Vercel Live feedback

- Consola: CSP `script-src` rechaza `https://vercel.live/_next-live/feedback/feedback.js`.
- **¿Bug de producto?** No; hardening V1. Solo ruido al depurar Preview.

### 7. Carrera de readiness en dashboards admin (streaming)

- HTML 200 con shell, pero el cuerpo útil (`AGENDA DE SESIONES`, etc.) tarda; waits por texto case-sensitive fallaban si el wait usaba title-case y la UI pinta UPPERCASE.
- **Acción:** waits positivos case-aware en script de captura; no tratar skeleton vacío como OK.

### 8. Operador staff en pantallas = identidad sandbox

- Sidebar muestra `e2e.admin sandbox` / email `@wellstudio.test`.
- Esperado mientras Miguel no tenga `ADMIN`/`STAFF`. Para vitrina: promover rol temporal o cuenta staff “Centro Demo”.

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

1. ~~Estabilizar 500 intermitente en admin Preview~~ → fix auth + sessions query aplicado; **revalidar en Preview post-deploy** y revisar logs si persiste.
2. Catálogo vitrina / aislar datos E2E de cuentas comerciales.
3. Perfil vitrina (plan + reserva + nombres) y cuenta staff limpia.
4. Decidir UX de deny admin (404 vs redirect 403).
5. ~~Revisar cobros cancelados sin evento~~ → copy corregido; validar webhooks si aparecen `SUCCEEDED` sin evento.
