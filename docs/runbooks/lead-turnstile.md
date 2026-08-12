# Cloudflare Turnstile for public leads

Fecha: 2026-08-12  
Ticket: `MIG-156`  
Relacionados: [gym-onboarding-handoff.md](./gym-onboarding-handoff.md), [gym-intake-checklist.md](./gym-intake-checklist.md)

## Objetivo

Proteger el formulario público de captación (`#contacto`) con Cloudflare Turnstile **antes** de publicitar mucho la web. No bloquea Wave 1–2.

## Comportamiento

- Si `TURNSTILE_SECRET_KEY` está vacío: el envío sigue permitido (local / Preview sin captcha).
- Si el secret está definido: el use case exige token válido vía `siteverify` antes de crear el lead.
- Si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está definido: el formulario muestra el widget.
- El honeypot existente se mantiene.

## Variables

| Variable | Entorno | Notas |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Preview / Production | Pública; widget |
| `TURNSTILE_SECRET_KEY` | Preview / Production | Solo servidor; nunca `NEXT_PUBLIC_` |

Tras cambiar variables en Vercel, redesplegar.

## Setup rápido

1. Cloudflare Dashboard → Turnstile → Create widget (Managed).
2. Añadir dominios Production y Preview.
3. Copiar site key + secret a Vercel (y `.env.local` si pruebas en local).
4. Smoke: enviar lead sin completar widget → error claro; con widget OK → lead + notificación staff.

## Seguridad

- Verificación siempre en servidor (`modules/leads/server/turnstile.ts`).
- CSP permite `https://challenges.cloudflare.com` en `script-src`, `frame-src` y `connect-src`.
