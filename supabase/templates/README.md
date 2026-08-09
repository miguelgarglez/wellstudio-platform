# Plantillas de Supabase Auth

Fuente versionada para las plantillas hosted de `Supabase Auth`. Los HTML son autocontenidos y se copian en `Authentication > Email Templates`; no se sirven desde la app.

## Mapeo

| Supabase | Asunto production | Asunto sandbox | Archivo |
| --- | --- | --- | --- |
| Confirm signup | `WellStudio: confirma tu acceso` | `[DEV] WellStudio: confirma tu acceso` | `confirmation.html` |
| Reset password | `WellStudio: restablece tu contraseña` | `[DEV] WellStudio: restablece tu contraseña` | `recovery.html` |

Remitentes:

- production: `WellStudio <no-reply@auth.miguelgarglez.com>`
- sandbox: `[DEV] WellStudio <no-reply@auth.miguelgarglez.com>`

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

## Restricciones

- una sola CTA y ningún contenido promocional
- sin imágenes, fuentes, JavaScript ni CSS remoto
- layout de tablas y estilos inline para compatibilidad
- tracking de enlaces desactivado en el proveedor para no reescribir URLs de auth
- cambios infrecuentes y desplegados primero en sandbox
