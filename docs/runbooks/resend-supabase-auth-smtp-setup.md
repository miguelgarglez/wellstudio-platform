# Resend SMTP para Supabase Auth

Fecha: 2026-03-16  
Estado: active runbook

## Objetivo

Configurar `Resend` como proveedor SMTP de `Supabase Auth` para mejorar las pruebas reales de:

- registro con confirmación por email
- recuperación de contraseña
- emails transaccionales de auth en sandbox

Este runbook deja preparado el flujo de WellStudio sin meter secretos en el repo.

## Decisión actual

Para la siguiente fase de pruebas manuales y sandbox, WellStudio usará:

- `Supabase Auth` como motor de identidad
- `Resend` como `custom SMTP`

Motivo:

- supera el límite muy bajo del email hosted de Supabase
- mantiene el flujo de auth actual sin cambios arquitectónicos
- sigue siendo fácil de migrar más adelante si hace falta

Referencias oficiales:

- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend SMTP](https://resend.com/docs/send-with-smtp)
- [Resend domains](https://resend.com/docs/dashboard/domains/introduction)
- [Resend API keys](https://resend.com/docs/dashboard/api-keys/introduction)

## Qué cambia y qué no

### Sí cambia

- el proveedor que entrega los emails de auth
- el remitente visible para signup y recovery
- el límite operativo disponible para pruebas

### No cambia

- la UI de login, register, forgot password y reset password
- la integración de `Supabase Auth` en la app
- la lógica de redirects ya implementada

## Recomendación de dominio

Usar un subdominio dedicado para auth:

- dominio recomendado: `auth.tudominio.com`
- sender recomendado: `no-reply@auth.tudominio.com`
- nombre recomendado: `WellStudio`

Resend recomienda usar subdominios para aislar reputación y propósito de envío.

## Lo que tiene que hacer el usuario

### 1. Crear cuenta en Resend

Ir a [Resend](https://resend.com/) y crear la cuenta.

### 2. Verificar el subdominio de envío

En Resend:

1. ir a `Domains`
2. añadir `auth.tudominio.com` o el subdominio elegido
3. copiar los registros DNS que pide Resend
4. añadirlos en el proveedor DNS del dominio
5. esperar a que el estado sea `verified`

Resend requiere SPF y DKIM. DMARC es recomendable como refuerzo.

Notas útiles:

- si usas Cloudflare, Resend ofrece setup asistido con Domain Connect
- el tracking de aperturas y clics está desactivado por defecto y conviene dejarlo así para emails transaccionales sensibles

### 3. Crear la API key de envío

En Resend:

1. ir a `API Keys`
2. crear una key con `Sending access`
3. restringirla al dominio o subdominio de auth si la UI lo permite
4. copiar la key una sola vez y guardarla en tu gestor de secretos

## Lo que tenemos que configurar en Supabase

Ir al dashboard del proyecto `sandbox`:

1. `Authentication`
2. `Settings`
3. `SMTP Settings` o sección equivalente de email/notifications
4. activar `Enable Custom SMTP`

Valores a introducir:

- `Sender email`: `no-reply@auth.tudominio.com`
- `Sender name`: `WellStudio`
- `Host`: `smtp.resend.com`
- `Port`: `587`
- `Username`: `resend`
- `Password`: tu `Resend API key`

Notas:

- `587` usa `STARTTLS` y es la opción estándar más portable
- `465` también es válido si se prefiere SMTPS
- el password SMTP en Resend es la propia API key

## Configuración validada en sandbox

La configuración que quedó validada manualmente en WellStudio sandbox es esta:

- dominio SMTP verificado en Resend: `auth.miguelgarglez.com`
- sender email en Supabase: `no-reply@auth.miguelgarglez.com`
- sender name en Supabase: `WellStudio`
- host SMTP: `smtp.resend.com`
- port: `587`
- username: `resend`

Nota:

- el dominio es temporal y operativo para sandbox
- no debe considerarse remitente final de producción para usuarios del gimnasio

## URL Configuration validada en Supabase

En `Authentication > URL Configuration`, el setup que funcionó fue:

- `Site URL`: `http://localhost:3000`

Y en `Redirect URLs`, añadir explícitamente al menos:

- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/reset-password`
- `http://localhost:3000/auth/callback`
- `http://127.0.0.1:3000/auth/confirm`
- `http://127.0.0.1:3000/reset-password`
- `http://127.0.0.1:3000/auth/callback`

Aprendizaje importante:

- si `Redirect URLs` está vacío o no incluye la ruta usada por el email, Supabase cae al `Site URL`
- en la práctica eso rompía el registro, porque el usuario terminaba en `/` en vez de cerrar la confirmación en `/auth/confirm`

## Plantilla validada para confirmación de signup

En `Authentication > Email > Confirm signup`, el enlace que funcionó correctamente fue este:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p>
  <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app&email={{ .Email }}">
    Confirm your mail
  </a>
</p>
```

Punto clave:

- `{{ .ConfirmationURL }}` no era suficiente para el flujo deseado
- para que el usuario entrara autenticado en `/app`, fue necesario pasar explícitamente por `/auth/confirm` con `token_hash`

## Copy recomendado para las plantillas de email

### Confirm signup

Subject recomendado:

```text
WellStudio: confirma tu acceso
```

Body recomendado:

```html
<h2>Confirma tu acceso a WellStudio</h2>

<p>Ya casi está. Confirma tu correo para activar tu cuenta y entrar en tu espacio privado.</p>
<p>
  <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app&email={{ .Email }}">
    Confirmar mi acceso
  </a>
</p>
<p>Si no has creado esta cuenta, puedes ignorar este correo.</p>
```

### Reset password

Subject recomendado:

```text
WellStudio: restablece tu contraseña
```

Body recomendado:

```html
<h2>Restablece tu contraseña</h2>

<p>Hemos recibido una solicitud para cambiar tu contraseña de WellStudio.</p>
<p>
  <a href="{{ .ConfirmationURL }}">
    Crear una nueva contraseña
  </a>
</p>
<p>Si no has solicitado este cambio, puedes ignorar este correo.</p>
```

## Rate limits recomendados

Con custom SMTP, Supabase aplica inicialmente un límite bajo por seguridad. Su documentación indica `30 mensajes por hora` tras activar SMTP custom, y luego puede ajustarse desde la configuración de rate limits.

Para el plan gratis actual de Resend, conviene pensar en dos límites:

- cuota del proveedor: `100 emails por día`
- límite de Supabase Auth: configurable en el dashboard

Recomendación práctica para `sandbox`:

- dejar el límite de Supabase en `20-30 emails/hora`
- no subirlo mucho más mientras sigamos en el free tier de Resend

Así evitamos bloquear las pruebas por una ráfaga accidental y seguimos muy por encima del hosted email de Supabase.

## Validación manual mínima

Una vez activado el SMTP custom:

1. probar registro nuevo
2. comprobar que llega el email de confirmación desde el remitente configurado
3. pulsar el enlace y verificar que se entra en `/app` o, si no, que cae al login con email precompletado
4. probar `forgot password`
5. comprobar que llega el email de recuperación
6. cambiar contraseña y verificar acceso

También revisar en Resend:

- dashboard de emails enviados
- estado del dominio
- remitente usado

## Validación manual completada

A fecha de 2026-03-17, quedó validado manualmente en local con `Resend`:

- registro con email de confirmación
- apertura del enlace de signup
- redirección correcta hacia `/app`
- recuperación de contraseña
- recepción del email de reset
- cambio de contraseña y acceso posterior

Incidencia encontrada y resuelta:

- el registro no funcionaba mientras el email apuntaba al `{{ .ConfirmationURL }}` por defecto y `Redirect URLs` estaba vacío
- tras alinear plantilla + allowlist, el flujo quedó correcto

## Checklist rápido de incidencias

### No llega ningún email

Revisar:

- dominio en Resend realmente `verified`
- sender email usando exactamente el dominio verificado
- credenciales SMTP copiadas correctamente en Supabase
- que no se esté usando todavía el hosted email anterior

### Supabase devuelve error al enviar

Revisar:

- `Host`: `smtp.resend.com`
- `Port`: `587`
- `Username`: `resend`
- `Password`: API key válida de Resend

### El email llega pero el enlace no cierra bien el acceso

Revisar:

- plantilla de `Confirm signup` en Supabase
- redirect URL permitida en Supabase
- `NEXT_PUBLIC_APP_URL`
- flujo server-side actual en `/auth/confirm`

## Qué sigue pendiente incluso con Resend

Resend mejora mucho las pruebas manuales, pero no cierra por sí solo el gap E2E completo.

Sigue pendiente si queremos automatizarlo:

- inbox harness o captura automática del correo
- lectura del email desde la suite
- apertura automática del enlace de confirmación en tests

Documentación relacionada:

- [auth-sandbox-operations.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/runbooks/auth-sandbox-operations.md)
- [wellstudio-auth-gap-email-confirmation.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/product/wellstudio-auth-gap-email-confirmation.md)
