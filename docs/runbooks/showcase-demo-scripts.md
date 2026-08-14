# Showcase — guion de mini-demos (fase 2)

Fecha: 2026-08-13  
Ticket: `MIG-157`  
Ruta: `/showcase`

## Objetivo

Tres clips ≤45 s para sustituir los placeholders de journeys en el deck comercial. Misma historia que las slides 4–6.

## Herramienta sugerida

Screen Studio / Loom / QuickTime. Resolución 16:9 o vertical 9:16 según canal. Sin voz obligatoria; subtítulos cortos si hace falta.

## Clip A — Público (agenda → lead)

1. Abrir Preview en `/classes` (o home → Agenda).
2. Filtrar / abrir una sesión con plazas.
3. Ir a `#contacto`, completar lead de prueba (Turnstile si aplica).
4. Cerrar en mensaje de éxito.

Mensaje en pantalla: “La agenda convence. El lead llega al centro.”

## Clip B — Socio (login → reserva)

1. Login socio sandbox.
2. Home / reservas → elegir sesión → confirmar.
3. Mostrar reserva confirmada; opcional cancelar (política 120 min).
4. Corte rápido a Cuenta (saldo / cobertura).

Mensaje: “El socio reserva solo, con reglas claras.”

## Clip C — Staff (overview → asistida)

1. Login admin.
2. `/admin` overview del día.
3. Abrir ficha de socio → reserva asistida en una sesión.
4. Volver a ver la plaza ocupada.

Mensaje: “El mostrador opera sin saltarse el producto.”

## Dónde encajan

| Clip | Slide `/showcase` |
|---|---|
| A | Journey 1 · Público |
| B | Journey 2 · Socio |
| C | Journey 3 · Staff |

Sustituir el texto placeholder `Clip ≤45s · …` por `<video>` o embed cuando existan los archivos (idealmente en `modules/public/ui/showcase/assets/` o CDN).

## Galería de capturas (lightbox)

El deck incluye una galería fullscreen accesible desde **Ver galería** (header) o clic en cualquier captura.

| Paso | Comando / acción |
|---|---|
| 0. Seed vitrina | `pnpm sandbox:showcase-vitrina` (+ `SHOWCASE_MEMBER_EMAIL` si aplica). Ver [`showcase-vitrina-seed.md`](./showcase-vitrina-seed.md). |
| 1. Capturar PNG | `node scripts/capture-showcase-shots.mjs` (credenciales en env) |
| 2. Optimizar WebP | `node scripts/optimize-showcase-shots.mjs` (requiere `cwebp`: `brew install webp`) |
| 3. Verificar en local | `pnpm dev` → `/showcase` → clic en captura o **Ver galería** |

Salida por shot: `{name}-thumb.webp` (960px, deck) y `{name}.webp` (captura completa, lightbox). Los PNG originales se mantienen como fuente; los imports en `showcase-visuals.ts` apuntan a WebP.

Tras re-capturar, volver a ejecutar el paso 2 antes de commitear assets.

## README / web personal

Reutilizar los mismos tres clips. No grabar narrativas distintas.
