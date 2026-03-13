# Playwright E2E

## Objetivo

Mantener una suite E2E pequeña, estable y útil.

## Estructura recomendada

- `tests/e2e/auth`: flujos de login, registro y rutas protegidas
- `tests/e2e/page-objects`: helpers de interacción reutilizables
- `tests/e2e/support`: utilidades de entorno, tags y helpers no visuales
- `tests/e2e/*.spec.ts`: smoke suite transversal si aplica

## Reglas

- usar labels y roles accesibles antes que selectores frágiles
- evitar `waitForTimeout`
- no probar happy paths críticos con mocks del navegador
- usar page objects pequeños, no frameworks internos gigantes
- cada bug real de auth, reservas o permisos debe dejar regresión

## Tags

- `@smoke`: debe ser rápido y apto para correr frecuentemente
- `@auth`: toca autenticación o protección de rutas
- `@sandbox`: requiere cuentas o proyecto real de test
- `@critical`: flujo muy sensible para negocio

## Comandos

- `pnpm test:e2e`
- `pnpm test:e2e:headed`
- `pnpm test:e2e:ui`
- `pnpm test:e2e:smoke`
- `pnpm test:e2e:auth`
