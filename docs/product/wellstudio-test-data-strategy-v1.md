# WellStudio Test Data Strategy V1

Fecha: 2026-03-13
Estado: accepted working baseline

## Objetivo

Definir como crear y reutilizar datos de test sin convertir el repo en un caos de mocks ad-hoc.

## Principios

- datos de test pequenos, legibles y repetibles
- cada test declara solo lo que importa
- los defaults viven en fixtures compartidas
- los overrides afinan el caso concreto
- no mezclar seeds E2E con fixtures unitarias

## Capas de datos de test

### 1. Unit

Usar builders puros en memoria.

Ejemplos:

- `buildSupabaseUserFixture()`
- `buildUserFixture()`
- `buildMemberFixture()`
- `buildClassSessionFixture()`

Objetivo:

- probar logica de mapeo
- probar reglas de elegibilidad
- probar calculos y validaciones

### 2. Integration

Usar factories que persisten en la base de datos de test, apoyadas en los mismos defaults semanticos.

Objetivo:

- probar casos de uso con Prisma y transacciones reales
- verificar restricciones y relaciones

Regla:

- una factory de integration puede apoyarse en las fixtures de `tests/fixtures`
- pero la persistencia y limpieza pertenecen a otra capa

### 3. E2E

Usar seeds o cuentas de escenario reconocibles.

Escenarios canonicos esperados:

- visitor
- pending member
- active member without entitlement
- active member with membership
- active member with credits
- admin
- class with availability
- full class
- waitlist-populated class

Objetivo:

- probar flujos reales de usuario
- facilitar debugging manual en local o staging

### 4. Sandbox playground manual

Usar escenarios ricos e idempotentes para validar pantallas operativas con densidad realista, sin convertirlos en dependencia de tests automatizados.

Ejemplo actual:

- `admin-playground`

Objetivo:

- revisar UX, estados y composición con datos variados
- evitar crear datos a mano en sandbox
- mantener Playwright determinista y pequeño

Regla:

- un playground puede tener muchos estados para inspección visual
- una suite E2E no debe asumir que ese playground existe ni assertar contra todo su volumen

## Convenciones

- ids deterministas con prefijos del dominio
- fechas fijas por defecto para evitar tests flakey
- nombres y datos reconocibles del negocio
- asserts sobre comportamiento, no sobre ruido incidental
- los playgrounds manuales usan prefijos explícitos como `Admin Playground`
- los escenarios E2E críticos se mantienen separados de los playgrounds ricos

## Antipatrones

- crear objetos auth a mano en cada test con casts arbitrarios
- meter datos aleatorios cuando no aportan nada
- esconder la intencion del test en un factory enorme
- compartir estado mutable entre tests

## Evolucion prevista

Cuando entren reservations y payments, ampliar con:

- fixtures de membership entitlement
- fixtures de credit ledger
- fixtures de reservation states
- factories persistidas con Prisma para integration
- seeds de escenario para Playwright
- playgrounds manuales para backoffice y revisión de producto cuando la UI necesite datos más realistas que una fixture mínima

## Fuente de verdad

- builders puros: `tests/fixtures/*`
- reglas de cobertura: `docs/product/wellstudio-testing-coverage-plan-v1.md`
- estrategia general: `docs/product/wellstudio-testing-strategy.md`
