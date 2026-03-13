# Test Fixtures

## Objetivo

Centralizar builders pequeños y predecibles para tests unitarios e integration.

## Regla

- cada fixture debe representar una entidad o actor reconocible del dominio
- usar overrides explicitos en vez de mutar objetos en cada test
- no meter logica de negocio dentro de los fixtures
- reservar factories con base de datos real para una capa posterior

## Capas

- `base.ts`: ids, fechas y utilidades deterministas
- `auth.ts`: usuarios autenticados y contexto externo
- `domain.ts`: entidades locales del dominio

## Uso

- unit tests: usar fixtures puras en memoria
- integration tests: reutilizar los mismos defaults, pero persistiendo con Prisma cuando toque
- e2e: usar seeds o cuentas de escenario, no estos builders directamente
