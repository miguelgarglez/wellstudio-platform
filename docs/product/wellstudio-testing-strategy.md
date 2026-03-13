# WellStudio Testing Strategy

Fecha: 2026-03-13
Estado: estrategia inicial para desarrollo de MVP

## Objetivo

Definir una estrategia de testing pragmatica para un producto con:

- autenticacion
- reservas
- elegibilidad
- pagos
- panel interno

La prioridad no es tener miles de tests.
La prioridad es proteger las partes donde un fallo rompe negocio o soporte.

## Principios

- probar mas el dominio que la presentacion
- testear las reglas de negocio antes que los detalles visuales
- automatizar happy paths y errores caros
- no confiar solo en QA manual
- cada bug de negocio critico debe dejar al menos un test de regresion

## Piramide recomendada

Distribucion aproximada:

- unit tests: 50%
- integration tests: 30%
- e2e tests: 20%

## 1. Unit Tests

Objetivo:

- blindar logica de dominio pura

Casos prioritarios:

- elegibilidad por membresia
- elegibilidad por bono o creditos
- consumo de creditos
- cancelacion y devolucion de creditos
- calculo de disponibilidad
- reglas de waitlist
- validaciones de formularios criticos
- calculo de estados de membresia

No merece tanta prioridad:

- componentes visuales simples
- wrappers finos sin logica

## 2. Integration Tests

Objetivo:

- verificar que modulos, base de datos e integraciones cooperan bien

Casos prioritarios:

- crear usuario y member
- persistencia de perfil
- crear sesion y leer agenda
- reservar clase con transaccion real
- evitar doble reserva
- cancelar reserva y actualizar aforo
- promocionar waitlist
- sincronizar pago confirmado con activacion de producto
- procesar webhooks de Stripe de forma idempotente

## 3. End-to-End Tests

Objetivo:

- cubrir los flujos de mayor valor y mayor riesgo

Suite minima recomendada:

1. registro y verificacion
2. login y logout
3. agenda publica y detalle de clase
4. intento de reserva sin elegibilidad
5. compra de suscripcion o bono
6. reserva correcta tras adquirir elegibilidad
7. cancelacion de reserva
8. admin crea o edita una clase

## 4. Que testear por modulo

## Auth

- registro
- verificacion de email
- login
- logout
- password reset
- proteccion de rutas

## Members

- creacion de member al registrarse
- actualizacion de perfil
- restricciones de campos editables

## Classes

- listado de sesiones
- detalle de sesion
- filtrado por fecha
- aforo y estados

## Reservations

- reserva correcta
- doble reserva rechazada
- reserva sin elegibilidad rechazada
- concurrencia sobre ultima plaza

## Waitlist

- alta en lista de espera
- orden de promocion
- promocion al liberarse plaza

## Memberships y credits

- activacion
- expiracion
- consumo
- devolucion parcial o completa

## Payments

- creacion de intento de pago
- confirmacion via webhook
- idempotencia
- errores de pago

## Admin

- permisos
- creacion y edicion de clases
- cambios auditados

## 5. Entornos de prueba

Minimo:

- local
- test automatizado
- staging

Local:

- desarrollo diario
- datos seed
- modo de integraciones fake o sandbox

Test automatizado:

- ejecucion en CI
- base de datos efimera o reseteable

Staging:

- despliegue lo mas parecido posible a produccion
- Stripe test mode
- auth test config

## 6. Datos y seeds

Preparar seeds reutilizables desde el principio:

- member sin plan
- member con suscripcion activa
- member con bono activo
- coach
- admin
- sesiones con plazas
- sesion completa
- waitlist poblada

Esto acelera:

- QA manual
- e2e
- debugging

## 7. Criterios de salida por funcionalidad

Una funcionalidad no se considera terminada si no tiene:

- criterios de aceptacion claros
- validaciones server-side
- logs o audit cuando aplica
- tests de dominio o integracion si toca negocio
- e2e si afecta a un flujo core
- estados `loading`, `empty`, `error`

## 8. Herramientas sugeridas

Si seguimos con `Next.js` monolitico:

- `Vitest` para unit e integration
- `Playwright` para e2e
- `Testing Library` para UI puntual
- `Prisma` test helpers o factories si usamos Prisma

## 9. Riesgos que deben tener test desde el dia uno

Estos puntos no deberian salir a produccion sin cobertura:

- login
- reserva
- bloqueo por elegibilidad
- cancelacion
- consumo y devolucion de creditos
- webhook de Stripe
- permisos de admin

## 10. Cadencia recomendada

Durante desarrollo:

- unit e integration en cada PR
- e2e criticos en CI al menos en ramas principales
- smoke manual en staging antes de hitos relevantes

Tras bugs reales:

- cada bug critico genera test de regresion

## 11. Roadmap de testing

### Fase 0

- setup de `Vitest`
- setup de `Playwright`
- seed basico
- helpers de test

### Fase 1

- tests de auth
- tests de members
- tests de classes read-only

### Fase 2

- tests de elegibilidad
- tests de reservations
- tests de cancelacion
- e2e de agenda y reserva

### Fase 3

- tests de payments
- tests de webhooks
- tests de admin

## 12. Regla final

En WellStudio, lo que rompe negocio no es un boton desalineado.

Lo que rompe negocio es:

- que un usuario no pueda entrar
- que una reserva se haga mal
- que se cobre mal
- que se consuma mal un credito

El plan de testing debe defender justo eso.
