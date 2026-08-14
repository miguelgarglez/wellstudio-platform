# WellStudio Platform

Producto para centros boutique: **reservas, mostrador y cobros en un solo sistema**.

## Ver el producto

- **Showcase comercial (slides):** [`/showcase`](./app/(public)/showcase/page.tsx) — solo Preview y local (`http://localhost:3000/showcase`)
- **Cómo trabajamos (sin tecnicismos):** [`/showcase/operacion`](./app/(public)/showcase/operacion/page.tsx) — acuerdo, arranque y cuota explicados para el dueño del centro
- **Preview en vivo:** [preview-wellstudio.miguelgarglez.com](https://preview-wellstudio.miguelgarglez.com)
- **Deck orientado a dueños de gym** (también sirve como portfolio): journeys público → socio → staff

> Las rutas `/showcase/*` responden **404 en Production** (Vercel). Comparte el enlace de Preview para ventas.

### Tres journeys

1. **Público** — agenda real y captación de leads  
2. **Socio** — reservar / cancelar, cuenta, bonos  
3. **Staff** — overview del día, sesiones, reserva asistida  

Guion de mini-demos (clips ≤45 s): [`docs/runbooks/showcase-demo-scripts.md`](./docs/runbooks/showcase-demo-scripts.md)

## Stack

- `Next.js` monolito modular (`app/` + `modules/*`)
- `TypeScript` · `Prisma` · `PostgreSQL` (Supabase)
- `Supabase Auth` (único boundary de auth)
- `Stripe` Checkout (bonos + vinculación de tarjeta)
- `Vercel` Preview / Production

## Estado

V1 usable en Preview: web pública, auth, reservas, admin, pagos en test mode, handoff/go-live documentado.  
Captcha Turnstile en leads (activo cuando hay keys). Stripe live y datos piloto pendientes de intake del gym.

## Documentación

- [`docs/adr`](./docs/adr) — decisiones técnicas  
- [`docs/architecture`](./docs/architecture) — arquitectura y datos  
- [`docs/product`](./docs/product) — PRD, flujos, testing  
- [`docs/runbooks`](./docs/runbooks) — operación, handoff y showcase  

Fuente de verdad: ADRs + arquitectura; producto/testing en `docs/product`; backlog en Linear.

## Comandos base

```bash
pnpm dev
pnpm check:foundation
pnpm check:auth
pnpm test:unit
pnpm test:e2e:smoke
```

## Deploy y entornos

- rama `preview` → Vercel Preview + Supabase sandbox  
- rama `main` → Vercel Production + Supabase production  
- runbooks: [`vercel-preview-and-production.md`](./docs/runbooks/vercel-preview-and-production.md), [`gym-onboarding-handoff.md`](./docs/runbooks/gym-onboarding-handoff.md)

## Notas

- no mezclar lógica de negocio en UI  
- no tratar Supabase Auth como fuente de verdad del dominio  
- no usar credenciales de production en Preview  
