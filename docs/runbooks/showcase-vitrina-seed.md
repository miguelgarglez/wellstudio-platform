# Showcase — vitrina comercial (seed Preview)

Fecha: 2026-08-14  
Tickets relacionados: `MIG-160`, `MIG-161`, `MIG-157`

## Objetivo

Preparar datos **marketing-friendly** en Preview antes de capturar pantallas para `/showcase`:

- Planes y bonos con nombres comerciales (sin prefijo `E2E`)
- Agenda pública poblada (Fuerza Premium, Dinámico, Movilidad & Core)
- Socios demo con nombres reales en español
- Perfil vitrina del socio comercial (opcional: tu cuenta real)

## Qué crea el escenario `showcase-vitrina`

| Área | Contenido |
|---|---|
| **Catálogo público** | Plan Constancia, Plan Flex, Bono 6 sesiones (`showcase-*` slugs) |
| **Agenda** | 6 sesiones publicadas en los próximos días, aforo 40–80 % |
| **Coaches** | Laura Martínez, Carlos Vega |
| **Socios demo** | Laura Méndez, Carlos Ruiz, Ana Torres, Pablo Navarro (`e2e.showcase.*.sandbox@wellstudio.test`) |
| **Socio vitrina** | Si pasas `SHOWCASE_MEMBER_EMAIL`: plan activo + bono + reserva próxima |

No borra fixtures E2E existentes; solo gestiona entidades con slug `showcase-*` y socios `e2e.showcase.*`.

## Requisitos

- `.env.local` con `DATABASE_URL` apuntando al sandbox Preview
- `E2E_AUTH_SANDBOX=true`, `SUPABASE_SANDBOX_PROJECT_REF` alineado
- Para perfil personal: cuenta ya registrada en Supabase (p. ej. `miguel.garglez@gmail.com`)

## Comando

Solo catálogo + agenda + socios demo:

```bash
pnpm sandbox:showcase-vitrina
```

Incluyendo tu cuenta como socio vitrina:

```bash
SHOWCASE_MEMBER_EMAIL=miguel.garglez@gmail.com \
  pnpm sandbox:showcase-vitrina -- --confirm-showcase-member-email
```

(`--` separa args de pnpm del script.)

## Admin comercial para capturas (`@wellstudio.es`)

```bash
pnpm sandbox:showcase-demo-admin
```

Por defecto crea **`demo@wellstudio.es`** con nombre **Equipo WellStudio** (roles ADMIN + STAFF).  
Password: `SHOWCASE_ADMIN_PASSWORD` o reutiliza `E2E_ADMIN_PASSWORD`.

Override:

```bash
SHOWCASE_ADMIN_EMAIL=operaciones@wellstudio.es pnpm sandbox:showcase-demo-admin
```

## Re-capturar pantallas

```bash
SHOWCASE_MEMBER_EMAIL=miguel.garglez@gmail.com SHOWCASE_MEMBER_PASSWORD='…' \
SHOWCASE_ADMIN_EMAIL=demo@wellstudio.es SHOWCASE_ADMIN_PASSWORD='…' \
  node scripts/capture-showcase-shots.mjs

node scripts/optimize-showcase-shots.mjs   # brew install webp
```

Staff usa `SHOWCASE_ADMIN_EMAIL` (fallback `E2E_ADMIN_EMAIL`).

## Checklist visual post-seed

- [ ] `/classes` — horarios esta semana, nombres comerciales, ocupación visible
- [ ] `/plans` — Plan Constancia / Bono 6 sesiones (no “E2E …”)
- [ ] `/app` (socio vitrina) — plan activo + próxima reserva Fuerza Premium
- [ ] `/app/account` — “Bono 6 sesiones”, no “E2E Bono Checkout”
- [ ] `/admin/sessions` — agenda poblada
- [ ] `/admin/members` — Laura Méndez, Carlos Ruiz, etc.

## Limitaciones

- Preview comparte BD con E2E: pueden seguir apareciendo filas E2E antiguas en listados largos. El escenario vitrina no las elimina.
- La agenda pública puede seguir mezclando sesiones E2E si existen; priorizar recaptura tras seed y revisar `/classes` manualmente.
- Staff sidebar muestra **`demo@wellstudio.es`** tras `pnpm sandbox:showcase-demo-admin`.
