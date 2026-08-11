# Plantillas de Supabase Auth

Fuente versionada para las plantillas hosted de `Supabase Auth`. Los HTML son autocontenidos y se copian en `Authentication > Email Templates`; no se sirven desde la app.

## Mapeo

| Supabase | Asunto production | Asunto sandbox | Archivo |
| --- | --- | --- | --- |
| Confirm signup | `WellStudio: confirma tu correo` | `[DEV] WellStudio: confirma tu correo` | `confirmation.html` |
| Reset password | `WellStudio: crea una nueva contraseña` | `[DEV] WellStudio: crea una nueva contraseña` | `recovery.html` |

Remitentes:

- production: `WellStudio <no-reply@auth.miguelgarglez.com>`
- sandbox: `[DEV] WellStudio <no-reply@auth.miguelgarglez.com>`

## Dependencia de URL Configuration

Las plantillas asumen que `emailRedirectTo` / recovery `redirectTo` están allowlisteados en el proyecto hosted. En sandbox, si falta el host de Preview (`https://preview-wellstudio.miguelgarglez.com/**`), GoTrue cae al `Site URL` (`http://localhost:3000`) y Resend entrega enlaces rotos.

Auditar / aplicar allowlist de sandbox:

```bash
pnpm auth:urls:hosted -- \
  --project-ref=<sandbox-project-ref> \
  --environment=sandbox
```

## Aplicación hosted reproducible

La CLI de Supabase queda fijada como dependencia de desarrollo. La operación usa la Management API para leer el estado actual y enviar un `PATCH` que contiene **solo** los cuatro campos de asunto y contenido de confirmación/recovery. No hace un `config push` amplio ni imprime el access token.

1. Autenticar la CLI una vez con `pnpm exec supabase login`, o exportar `SUPABASE_ACCESS_TOKEN` solo en la shell actual.
2. Ejecutar primero un dry run:

```bash
pnpm auth:templates:hosted -- \
  --project-ref=<project-ref> \
  --environment=sandbox
```

3. Revisar target, campos modificados y hashes. Para persistir:

```bash
pnpm auth:templates:hosted -- \
  --project-ref=<project-ref> \
  --environment=sandbox \
  --apply \
  --confirm-project-ref=<project-ref>
```

4. Enviar un correo real de signup y recovery antes de dar el entorno por desplegado.
5. Repetir el mismo orden en production usando `--environment=production` y su project ref propio.

El comando falla si se intenta aplicar sin repetir el project ref, si faltan tokens Go Template o si aparece JavaScript o un asset remoto.

## Checklist de aplicación manual

1. Copiar el HTML completo en la plantilla correspondiente de cada proyecto hosted.
2. Configurar el asunto de la tabla según el entorno.
3. No sustituir los tokens Go Template.
4. En signup, preservar la ruta `/auth/confirm` con `token_hash`; es el boundary SSR que crea la sesión.
5. En recovery, preservar `{{ .ConfirmationURL }}` porque forma parte del flujo ya validado.
6. Enviar un correo real de signup y recovery antes de dar el cambio por desplegado.

## Restricciones (deliverability + brand)

- una sola CTA y ningún contenido promocional
- sin imágenes, fuentes web, JavaScript ni CSS remoto
- layout de tablas y estilos **inline** (el bloque `@media` del `<head>` es el único CSS no inline, para mobile)
- tipografía safe: `Arial, Helvetica, sans-serif`
- colores alineados al design system (`brand-950`, `brand-500`, `brand-300`, `sand-100`, `stone-*`, `ink-900`) sin assets externos
- cabecera oscura de marca + cuerpo claro; CTA azul con radio estable (`16px`), no pill hiper-redondeado
- tracking de enlaces desactivado en el proveedor para no reescribir URLs de auth
- cambios infrecuentes y desplegados primero en sandbox
- no añadir firmas HTML, redes sociales ni segundo enlace “por si el botón falla” (rompe la regla de una sola CTA y añade superficie de phishing)
