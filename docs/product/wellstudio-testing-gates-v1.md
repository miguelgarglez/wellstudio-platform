# WellStudio Testing Gates V1

Fecha: 2026-03-13
Estado: accepted working policy

## Objetivo

Definir las puertas minimas que deben pasar los modulos criticos antes de marcar una issue como terminada.

Esto no sustituye el criterio tecnico.
Lo hace visible y repetible.

## Regla principal

Ninguna issue de `auth`, `reservations` o `payments` debe pasar a `Done` si no:

- cumple criterios de aceptacion funcionales
- tiene cobertura automatizada proporcionada al riesgo
- pasa el gate de repo correspondiente
- deja trazabilidad en Linear y Git

## Gates activos hoy

### Foundation gate

Comando:

```bash
pnpm check:foundation
```

Incluye:

- lint
- typecheck
- unit tests
- production build

Uso:

- cambios de foundation
- cambios de repo
- cambios de arquitectura base
- cambios de schema o tooling que afecten al conjunto

### Auth gate

Comando:

```bash
pnpm check:auth
```

Incluye:

- lint
- typecheck
- tests unitarios de `tests/unit/auth`
- production build

Uso:

- boundary de auth
- mapping `Supabase -> local identity`
- proteccion de rutas
- login y registro cuando entren

## Gates que deben existir antes de cerrar modulos futuros

### Reservations gate

Minimo esperado cuando el modulo exista:

- unit tests de elegibilidad y cancelacion
- integration tests de reserva y doble reserva
- build verde

### Payments gate

Minimo esperado cuando el modulo exista:

- unit/integration de activacion e idempotencia
- webhook tests
- build verde

### Admin gate

Minimo esperado:

- permisos
- caso feliz de creacion o edicion
- build verde

## Politica por tipo de issue

### Issue de foundation

No se considera terminada si no pasa:

- `pnpm check:foundation`

### Issue de auth

No se considera terminada si no pasa:

- `pnpm check:auth`

Y ademas:

- hay al menos un test nuevo o actualizado si cambia comportamiento

### Issue de reservations o payments

No se considera terminada si no:

- añade o actualiza tests del dominio afectado
- deja un gate ejecutable o reutiliza uno ya existente
- documenta bugs criticos como regresion si aplica

## Regla de regresion

Si un bug real afecta a:

- login
- sesion
- elegibilidad
- reserva
- cancelacion
- pagos
- permisos

no se cierra sin test de regresion.

## Relacion con Linear

Antes de mover una issue sensible a `Done`:

1. ejecutar el gate correspondiente
2. dejar comentario breve en Linear con lo validado
3. enlazar el commit con `Refs: MIG-xx`

## Relacion con Git

Cada commit de modulos sensibles debe:

- tener scope claro
- referenciar el ticket
- no mezclar cambios no relacionados

## Fuente de verdad

- estrategia general: `docs/product/wellstudio-testing-strategy.md`
- cobertura por fases: `docs/product/wellstudio-testing-coverage-plan-v1.md`
- datos de test: `docs/product/wellstudio-test-data-strategy-v1.md`
