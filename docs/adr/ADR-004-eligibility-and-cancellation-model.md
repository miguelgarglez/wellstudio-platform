# ADR-004: Modelo de elegibilidad y cancelacion

Fecha: 2026-03-13
Estado: accepted

## Contexto

El corazon del producto WellStudio no es solo mostrar clases, sino decidir:

- quien puede reservar
- con que entitlement
- cuando se consume
- cuando se devuelve

Sin esta decision, el dominio de reservas y pagos queda ambiguo.

## Decision

La elegibilidad se calculara a partir de entitlements activos:

- membresias activas
- creditos activos

La reserva debe registrar que entitlement fue usado.

La politica de cancelacion en V1 sera:

- cancelacion gratuita hasta `120 minutos` antes del inicio
- si se uso credito y se cancela dentro de ventana, el credito se devuelve
- fuera de ventana, no se devuelve credito
- cancelaciones del gimnasio siempre liberan y devuelven

## Motivo

- mantiene el modelo explicable y auditable
- desacopla elegibilidad de pagos directos
- encaja con el comportamiento esperado de un gimnasio boutique
- simplifica soporte y testing

## Alternativas consideradas

### Opcion A: derivar elegibilidad directamente desde pagos

- pros
  - menos tablas en apariencia
- contras
  - peor trazabilidad
  - mas acoplamiento con commerce
  - mas fragilidad cuando haya renovaciones, creditos o ajustes manuales

### Opcion B: hold de credito al reservar y consumo al asistir

- pros
  - modelo mas fino
- contras
  - mas complejo
  - no necesario para V1
  - complica waitlist, cancelaciones y reversiones

## Consecuencias

- se necesita modelar `member_memberships`
- se necesita modelar `member_credit_accounts` y `credit_ledger_entries`
- se necesita modelar `reservation_entitlement_usages`
- cancelaciones y overrides deben dejar `audit_log`

## Impacto en implementacion

- modulo `eligibility`
- modulo `reservations`
- modulo `payments`
- tests de dominio prioritarios

## Referencias

- [wellstudio-data-model-v1.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-data-model-v1.md)
- [wellstudio-v1-product-decisions.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-v1-product-decisions.md)
- [wellstudio-testing-strategy.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-testing-strategy.md)
- `MIG-23`
- `MIG-27`
- `MIG-28`
