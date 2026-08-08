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

## Aplicación

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
