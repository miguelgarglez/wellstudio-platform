# WellStudio Supabase Auth Sandbox Setup

Fecha: 2026-03-13
Estado: accepted working setup

## Objetivo

Definir como preparar el primer entorno real de `auth sandbox` para `Playwright` sin contaminar producción ni meter credenciales en el repo.

## Decisión

El primer entorno real de auth para tests E2E será `sandbox`.

No se usarán cuentas personales.
No se usarán usuarios manuales improvisados.
No se ejecutarán tests automáticos contra `production`.

## Proyecto Supabase esperado

Entorno:

- `sandbox`

Uso:

- login real
- logout real
- validación de credenciales erróneas
- pruebas de rutas protegidas
- debugging manual de auth

## Cuentas de escenario

Preparar al menos estas cuentas en `sandbox`:

### Member

- email: `e2e.member.sandbox@wellstudio.test`
- rol local esperado: `MEMBER`
- estado esperado: cuenta válida para login

### Admin

- email: `e2e.admin.sandbox@wellstudio.test`
- rol local esperado: `ADMIN`
- estado esperado: cuenta válida para login

## Variables de entorno

No guardar credenciales reales en el repo.

Usar un archivo local ignorado por Git:

- `.env.e2e.local`

Tomar como base:

- `.env.e2e.example`

Variables mínimas:

```bash
E2E_AUTH_SANDBOX=true
E2E_MEMBER_EMAIL=e2e.member.sandbox@wellstudio.test
E2E_MEMBER_PASSWORD=replace-with-sandbox-password
E2E_ADMIN_EMAIL=e2e.admin.sandbox@wellstudio.test
E2E_ADMIN_PASSWORD=replace-with-sandbox-password
```

## Cómo correr la suite sandbox

1. copiar `.env.e2e.example` a `.env.e2e.local`
2. completar credenciales reales de `sandbox`
3. exportar las variables al shell o cargar el fichero
4. ejecutar:

```bash
pnpm test:e2e:auth:sandbox
```

Runbook operativo relacionado:

- `docs/runbooks/auth-sandbox-operations.md`

## Reglas operativas

- si `E2E_AUTH_SANDBOX` no está activado, la suite sandbox debe saltarse sola
- los tests sandbox no deben romper la smoke suite local
- las cuentas de escenario deben ser persistentes y reconocibles
- cualquier bug real de login o sesión debe dejar un test de regresión aquí

## Escenarios mínimos de la suite sandbox

- login válido de member
- error por credenciales inválidas
- acceso a `/app` tras login
- logout y pérdida de acceso protegido

## Limitación actual

La suite sandbox todavía no verifica explícitamente el provisionado local `Supabase -> Prisma User/Member/UserRole`.

Eso queda bloqueado hasta tener:

- `DATABASE_URL` del proyecto `sandbox` configurado en local
- una ruta protegida que afirme la identidad local provisionada

## No hacer

- usar producción para auth E2E
- ejecutar alta masiva de usuarios por test si no hace falta
- compartir la misma cuenta mutable entre tests destructivos paralelos
- meter secretos en `.env.example`

## Siguiente evolución

Cuando el flujo de auth esté más maduro, ampliar con:

- registro real en sandbox
- verificación de email
- recuperación de contraseña
- scenario accounts más ricas por rol y elegibilidad
