# WellStudio Testing Coverage Plan V1

Fecha: 2026-03-13
Estado: plan operativo inicial

## Objetivo

Traducir la estrategia de testing en una cobertura minima exigible durante el desarrollo de V1.

No es un documento teorico.
Es una guia de ejecucion para decidir:

- que debe existir antes de tocar ciertos modulos
- que no puede llegar a `Done` sin pruebas
- donde merece invertir tiempo de test desde el principio

## Regla principal

No desarrollar el producto "y luego testear".

Desarrollar con una red minima de pruebas que crece por capas:

1. harness
2. auth
3. classes read-only
4. elegibilidad y reservas
5. pagos
6. admin

## Cobertura minima obligatoria por fase

## Fase 0: Harness base

Esto debe existir antes de avanzar en serio con features:

- `Vitest` configurado
- `Playwright` configurado
- una base para helpers de test
- una estrategia simple de seeds o fixtures
- scripts de `test`, `test:unit`, `test:e2e`

Salida esperada:

- al menos 1 test unitario verde
- al menos 1 smoke e2e verde

## Fase 1: Auth y Member foundation

Antes de considerar auth "estable", deben existir:

### Unit / Integration

- provisionado local de `User` y `Member`
- mapeo `Supabase user -> local user`
- rechazo de rutas sin sesion
- resolucion correcta de roles

### E2E

- registro
- verificacion de email
- login
- logout
- acceso a ruta protegida

## Gate

No empezar reservas sin estos tests base de auth.

## Fase 2: Public classes y classes read-only

### Unit / Integration

- lectura de `class_types`
- lectura de `class_sessions`
- filtrado por fecha
- estados publicos vs no publicos

### E2E

- agenda publica visible
- detalle de clase visible

## Gate

No empezar reserva real sin haber probado agenda y detalle.

## Fase 3: Eligibility y reservations

Esta es la primera zona realmente critica del negocio.

### Unit

- elegibilidad con membresia activa
- elegibilidad sin entitlement
- elegibilidad con creditos
- devolucion dentro de ventana
- no devolucion fuera de ventana

### Integration

- crear reserva
- impedir doble reserva
- actualizar aforo
- cancelar reserva
- devolver credito
- crear entrada en waitlist

### E2E

- intento de reserva sin elegibilidad
- reserva correcta
- cancelacion correcta

## Gate

Nada de reservations a `Done` sin cobertura de negocio real.

## Fase 4: Payments

### Unit / Integration

- activacion de membresia tras pago
- activacion de creditos tras pago
- idempotencia de webhook
- fallo de pago no activa producto

### E2E

- compra de membresia o bono en sandbox
- disponibilidad posterior del producto comprado

## Gate

No cerrar pagos sin probar al menos un flujo sandbox end-to-end.

## Fase 5: Admin

### Unit / Integration

- permisos de staff/admin
- creacion de clase
- edicion de clase
- audit log en acciones sensibles

### E2E

- admin entra y ve panel
- admin crea o edita una sesion

## Matriz minima por modulo

| Modulo | Unit | Integration | E2E | Obligatorio antes de Done |
| --- | --- | --- | --- | --- |
| Auth | si | si | si | si |
| Members | si | si | opcional | si |
| Classes read-only | opcional | si | si | si |
| Eligibility | si | si | indirecto | si |
| Reservations | si | si | si | si |
| Payments | si | si | si | si |
| Admin | opcional | si | si | si |

## Bugs que obligan a test de regresion

Si aparece uno de estos bugs, no se cierra sin test nuevo:

- login roto
- sesion rota
- reserva duplicada
- reserva sobre aforo
- credito consumido mal
- cancelacion sin devolucion correcta
- webhook duplicado
- permiso admin incorrecto

## Lo que no merece sobredimensionar al inicio

- snapshots visuales masivos
- tests exhaustivos de componentes sin logica
- cobertura obsesiva en UI de presentacion

La prioridad es negocio, no cosmetica.

## Checklist de release interna

Antes de considerar una version razonable para demo seria o staging estable:

- tests de auth verdes
- tests de reservations verdes
- tests de payments verdes si payments ya entra
- al menos 1 smoke e2e completo de ruta critica
- sin fallos conocidos de permisos

## Recomendacion final

El testing que aporta valor real en WellStudio es:

- auth fiable
- reservas fiables
- pagos fiables
- permisos fiables

Todo lo demas es secundario respecto a eso.
