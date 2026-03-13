# WellStudio Auth E2E Strategy V1

Fecha: 2026-03-13
Estado: accepted baseline for auth QA

## Objetivo

Definir como probar `auth` de forma profesional con `Playwright` sin caer en:

- cuentas manuales creadas a mano sin control
- tests frágiles
- mocks que validan poco
- suites lentas que nadie ejecuta

La idea es trabajar por capas y usar el navegador donde realmente aporta valor.

## Principios

- el happy path de auth debe validarse contra la app real
- no usar mocks del navegador para fingir login correcto si queremos confiar en el flujo
- usar cuentas de escenario, no usuarios improvisados
- aislar los tests que dependen de sandbox real de los smoke tests locales
- cada flujo crítico de auth debe tener una ruta clara de regresión

## Capas de coverage

### 1. Unit

Protegen la lógica pura:

- normalización de email
- mapeo `Supabase user -> local user`
- estados `PENDING_VERIFICATION` y `ACTIVE`
- resolución de nombres y metadata

Esto ya existe en `tests/unit/auth`.

### 2. Integration

Protegen la cooperación entre boundary y persistencia:

- provisión local de `User`
- provisión local de `Member`
- resolución de roles
- rechazo de rutas protegidas sin sesión

Esta capa debe crecer cuando entremos en flujos de identidad más completos.

### 3. E2E

Protegen el comportamiento visible real:

- render de `/login`
- render de `/register`
- redirección de rutas protegidas
- login real con cuenta existente
- registro real en sandbox
- logout

## Qué se mockea y qué no

### Sí se puede mockear

- estados de red no críticos para UI puntual
- errores artificiales para comprobar feedback visual
- datos no sensibles alrededor del flujo

### No se debe mockear en happy path

- creación de sesión
- redirección tras login correcto
- provisión local de identidad
- protección de rutas

Si mockeamos eso, el test deja de verificar lo importante.

## Escenarios canónicos

Las cuentas E2E deben ser reconocibles y estables.

### Auth-only

- `visitor`
- `pending-member`
- `active-member`
- `admin`

### Producto

- `member-without-entitlement`
- `member-with-membership`
- `member-with-credits`

## Regla de naming

Usar prefijos claros por entorno:

- `e2e.visitor.local@wellstudio.test`
- `e2e.pending.local@wellstudio.test`
- `e2e.member.local@wellstudio.test`
- `e2e.admin.local@wellstudio.test`

## Estrategia por fase

## Fase 1: UI auth smoke

No requiere sandbox real completo.

Debe validar:

- `/login` carga
- `/register` carga
- formularios visibles y etiquetados
- `/app` redirige a `/login?redirectTo=/app`
- `/admin` redirige a `/login?redirectTo=/admin`

Esta fase es barata, rápida y debe correr a menudo.

## Fase 2: Auth sandbox

Requiere proyecto Supabase de test y cuentas de escenario.

Debe validar:

- login correcto
- error por credenciales incorrectas
- logout
- acceso posterior a ruta protegida

## Fase 3: Registro real

Requiere sandbox y estrategia de limpieza.

Debe validar:

- registro correcto
- feedback de verificación de email
- provisión local de identidad

## Gestión de cuentas de escenario

Regla profesional:

- no compartir una cuenta mutable entre tests paralelos
- no depender de usuarios creados a mano en el dashboard
- no crear cuentas aleatorias sin cleanup

La opción recomendada para WellStudio:

1. cuentas base persistentes para smoke manual y debugging
2. setup de test para crear o reconciliar cuentas E2E conocidas
3. cleanup controlado solo cuando haga falta

## Tags recomendados

Usar tags en títulos de test:

- `@smoke`
- `@auth`
- `@sandbox`
- `@critical`

Ejemplos:

- `@smoke @auth login page renders`
- `@smoke @auth protected member route redirects to login`
- `@sandbox @auth member can log in with valid credentials`

## Gates recomendados para auth

### Gate actual

`pnpm check:auth`

Protege:

- lint
- typecheck
- unit auth
- build

### Gate objetivo siguiente

Cuando la suite E2E auth esté madura, añadir:

- `pnpm test:e2e:smoke --grep @auth`

No hace falta meter sandbox real en cada cambio, pero sí smoke auth visible.

## Antipatrones

- probar login solo con unit tests
- probar auth real contra producción
- meter credenciales hardcodeadas en tests
- usar `waitForTimeout`
- hacer asserts contra detalles visuales incidentales

## Recomendación operativa

Para WellStudio, el camino correcto es:

1. smoke auth local y rápido
2. sandbox auth real en entorno controlado
3. cuentas de escenario explícitas
4. page objects pequeños para login y registro
5. regression test cuando falle algo real
