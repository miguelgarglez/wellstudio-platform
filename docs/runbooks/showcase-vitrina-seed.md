# Showcase — vitrina comercial (seed Preview)

Fecha: 2026-08-14  
Tickets relacionados: `MIG-160`, `MIG-161`, `MIG-157`

## Objetivo

Preparar datos **marketing-friendly** en Preview antes de capturar pantallas para `/showcase`:

- Planes y bonos con nombres comerciales (sin prefijo `E2E`)
- Agenda pública poblada (Fuerza Premium, Dinámico, Movilidad & Core)
- Socios demo con nombres reales en español y emails `@wellstudio.es`
- Perfil vitrina del socio comercial (opcional: tu cuenta real)
- Las superficies comerciales **ocultan** catálogo/socios/sesiones E2E aunque sigan en la misma BD

## Qué crea el escenario `showcase-vitrina`

| Área | Contenido |
|---|---|
| **Catálogo público** | Plan Constancia, Plan Flex, Bono 6 sesiones (`showcase-*` slugs) |
| **Agenda** | 6 sesiones publicadas en los próximos días, aforo 40–80 % |
| **Coaches** | Laura Martínez, Carlos Vega |
| **Socios demo** | Laura Méndez, Carlos Ruiz, Ana Torres, Pablo Navarro (`*@wellstudio.es`), con plan o bono y reserva próxima |
| **Socio vitrina** | Si pasas `SHOWCASE_MEMBER_EMAIL`: plan activo + bono comercial + reserva próxima |

El seed **no borra** fixtures E2E (`e2e-*`, `E2E …`, `admin-playground-*`). Las queries de vitrina (planes, clases, cuenta, admin) las filtran. Los tests E2E las siguen viendo porque Playwright envía `x-wellstudio-sandbox-fixtures: 1`.

Emails demo antiguos `e2e.showcase.*.sandbox@wellstudio.test` se marcan inactivos al re-seedar.

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

Este re-seed en Preview es un **paso de operador**. El código no muta Preview por sí solo.

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

Staff usa `SHOWCASE_ADMIN_EMAIL` (fallback `E2E_ADMIN_EMAIL`). El script de captura **no** envía el header E2E, así que las pantallas quedan comerciales.

## Checklist visual post-seed

- [ ] `/classes` — horarios esta semana, nombres comerciales, ocupación visible (sin `E2E …`)
- [ ] `/plans` — Plan Constancia / Bono 6 sesiones (no “E2E …”)
- [ ] `/app` (socio vitrina) — plan activo + próxima reserva Fuerza Premium
- [ ] `/app/account` — “Bono 6 sesiones”, no “E2E Bono Checkout”
- [ ] `/admin/sessions` — agenda poblada con Fuerza Premium / Dinámico
- [ ] `/admin/members` — Laura Méndez, Carlos Ruiz, Ana Torres, Pablo Navarro

## Limitaciones

- Preview comparte BD con E2E: los fixtures de test siguen existiendo. Las listas comerciales los ocultan; un admin puede encontrarlos buscando `E2E` o `@wellstudio.test`.
- Staff sidebar muestra **`demo@wellstudio.es`** tras `pnpm sandbox:showcase-demo-admin`.
