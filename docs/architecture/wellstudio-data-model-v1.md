# WellStudio Data Model V1

Fecha: 2026-03-13
Estado: propuesta detallada para implementacion inicial
Base:

- [reverse-engineering-wellstudio.md](/Users/miguelgarglez/Developer/wellstudio-analysis/reverse-engineering-wellstudio.md)
- [prd-wellstudio-platform-v1.md](/Users/miguelgarglez/Developer/wellstudio-analysis/prd-wellstudio-platform-v1.md)
- [technical-architecture-wellstudio-v1.md](/Users/miguelgarglez/Developer/wellstudio-analysis/technical-architecture-wellstudio-v1.md)
- [wellstudio-flow-inventory.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-flow-inventory.md)

## 1. Objetivo

Definir un modelo de datos V1 que sea:

- implementable en un monolito modular `Next.js`
- suficientemente simple para arrancar rapido
- suficientemente serio para reservas, pagos y auditoria
- compatible con auth managed externo

## 2. Principios de modelado

- separar identidad de dominio
- modelar reservas y pagos con trazabilidad
- preferir estados explicitos a inferencias ambiguas
- proteger creditos y consumo con un ledger, no solo con contadores mutables
- mantener el panel interno y el area de socio sobre el mismo modelo canonico

## 3. Decisiones principales

## Identidad

- `users` representa la identidad autenticable de la plataforma
- `members` representa el perfil de socio y su relacion comercial con el gimnasio
- `users` y `members` se relacionan `1:1` en V1
- el proveedor de auth es externo, pero la plataforma guarda su propio `user`

## Staff y coaches

- `staff` no necesita tabla separada en V1; se resuelve con `user_roles`
- `coaches` se modela como entidad de dominio separada
- un `coach` puede o no estar vinculado a un `user`

Motivo:

- no todos los coaches necesitan acceso al sistema
- no todos los usuarios internos son coaches
- evita acoplar agenda y auth mas de la cuenta

## Elegibilidad

- la elegibilidad se calcula a partir de:
  - membresias activas
  - creditos activos
  - reglas por tipo de clase
- la elegibilidad no se infiere desde pagos directamente
- pagos activan productos; productos generan entitlements

## Creditos

- los creditos no deben modelarse solo con `credits_remaining`
- se recomienda una cuenta de creditos con ledger
- el saldo visible puede derivarse de la suma del ledger o cachearse si hiciera falta

## Reservas

- `reservations` modela la intencion y el estado de la reserva
- `reservation_entitlement_usages` modela que entitlement se consumio
- `waitlist_entries` vive separado de reservas

## Pagos

- `payments` modela la compra o cobro
- `payment_items` modela que se esta comprando
- `payment_events` persiste eventos externos y webhooks
- `cards` solo guarda referencias seguras del proveedor, nunca PAN real

## 4. Entidades principales

## 4.1 Identity

### users

Responsabilidad:

- identidad local de la plataforma

Campos clave:

- `id`
- `email`
- `normalized_email`
- `status`
- `external_auth_provider`
- `external_auth_id`
- `email_verified_at`
- `last_login_at`
- `created_at`
- `updated_at`

Notas:

- `normalized_email` con indice unico
- `external_auth_provider + external_auth_id` con indice unico
- `status` recomendado:
  - `pending_verification`
  - `active`
  - `suspended`
  - `invited`

### user_roles

Responsabilidad:

- asignacion de roles internos

Campos clave:

- `id`
- `user_id`
- `role`
- `created_at`

Roles iniciales:

- `member`
- `staff`
- `admin`

Nota:

- en V1 puede bastar con pocos roles
- mejor tabla separada que enum duro en `users`

### user_consents

Responsabilidad:

- trazabilidad legal minima

Campos clave:

- `id`
- `user_id`
- `consent_type`
- `accepted`
- `accepted_at`
- `source`
- `policy_version`

Tipos iniciales:

- `terms`
- `privacy`
- `marketing`

## 4.2 Members

### members

Responsabilidad:

- perfil de socio y estado comercial basico

Campos clave:

- `id`
- `user_id`
- `first_name`
- `last_name`
- `phone`
- `birth_date` nullable
- `status`
- `joined_at`
- `created_at`
- `updated_at`

Estados recomendados:

- `lead_converted`
- `active`
- `inactive`
- `blocked`

### member_notes

Responsabilidad:

- notas internas del staff

Campos clave:

- `id`
- `member_id`
- `author_user_id`
- `body`
- `visibility`
- `created_at`

### leads

Responsabilidad:

- captacion pre-registro o pre-conversion

Campos clave:

- `id`
- `email`
- `phone`
- `first_name`
- `last_name`
- `status`
- `source`
- `converted_member_id` nullable
- `owner_user_id` nullable
- `created_at`
- `updated_at`

Estados recomendados:

- `new`
- `contacted`
- `qualified`
- `converted`
- `lost`

## 4.3 Coaches and schedule

### coaches

Responsabilidad:

- entidad de dominio para impartir clases

Campos clave:

- `id`
- `user_id` nullable
- `display_name`
- `first_name`
- `last_name`
- `bio`
- `status`
- `created_at`
- `updated_at`

Estados:

- `active`
- `inactive`

### class_types

Responsabilidad:

- plantilla de clase

Campos clave:

- `id`
- `name`
- `slug`
- `description`
- `category`
- `duration_minutes`
- `capacity_default`
- `waitlist_enabled`
- `is_public`
- `status`
- `created_at`
- `updated_at`

Estados:

- `draft`
- `active`
- `archived`

### class_type_eligibility_rules

Responsabilidad:

- reglas de acceso por tipo de clase

Campos clave:

- `id`
- `class_type_id`
- `rule_type`
- `membership_plan_id` nullable
- `credit_cost`
- `priority`
- `is_active`

Tipos iniciales:

- `requires_active_membership`
- `requires_specific_plan`
- `allows_credit_usage`

Nota:

- V1 puede empezar simple
- si todas las clases comparten la misma regla, esta tabla puede arrancar minima

### class_sessions

Responsabilidad:

- ocurrencia concreta reservable

Campos clave:

- `id`
- `class_type_id`
- `coach_id`
- `starts_at`
- `ends_at`
- `capacity`
- `reserved_count`
- `waitlist_enabled`
- `location_label`
- `status`
- `published_at` nullable
- `created_at`
- `updated_at`

Estados:

- `draft`
- `published`
- `closed`
- `canceled`
- `completed`

Notas:

- `reserved_count` puede mantenerse como cache de lectura
- la verdad de negocio sigue en `reservations`

## 4.4 Reservations

### reservations

Responsabilidad:

- reserva de un socio en una sesion

Campos clave:

- `id`
- `member_id`
- `class_session_id`
- `status`
- `booked_at`
- `canceled_at` nullable
- `canceled_by_user_id` nullable
- `cancellation_reason` nullable
- `attendance_status`
- `source`
- `created_at`
- `updated_at`

Estados recomendados:

- `booked`
- `canceled`
- `attended`
- `no_show`

Fuente inicial:

- `member_app`
- `staff`
- `system`

Restricciones importantes:

- unica reserva activa por `member_id + class_session_id`
- cancelar no borra la fila

### reservation_entitlement_usages

Responsabilidad:

- registrar que entitlement se uso para reservar

Campos clave:

- `id`
- `reservation_id`
- `usage_type`
- `member_membership_id` nullable
- `member_credit_account_id` nullable
- `credit_ledger_entry_id` nullable
- `credits_used`
- `created_at`

Tipos:

- `membership`
- `credit`
- `manual_override`

Motivo:

- permite auditar consumo
- desacopla reserva de la implementacion concreta del saldo

### waitlist_entries

Responsabilidad:

- lista de espera por sesion

Campos clave:

- `id`
- `member_id`
- `class_session_id`
- `position`
- `status`
- `joined_at`
- `notified_at` nullable
- `promoted_at` nullable
- `expired_at` nullable

Estados:

- `waiting`
- `notified`
- `promoted`
- `expired`
- `removed`

Restricciones:

- una entrada activa por `member_id + class_session_id`

## 4.5 Entitlements

### membership_plans

Responsabilidad:

- catalogo de suscripciones o planes

Campos clave:

- `id`
- `name`
- `slug`
- `description`
- `billing_type`
- `price_amount`
- `currency`
- `billing_interval`
- `booking_policy_type`
- `included_credits` nullable
- `status`
- `is_public`
- `created_at`
- `updated_at`

Estados:

- `draft`
- `active`
- `archived`

### member_memberships

Responsabilidad:

- instancia activa o historica del plan de un socio

Campos clave:

- `id`
- `member_id`
- `membership_plan_id`
- `status`
- `starts_at`
- `ends_at` nullable
- `auto_renews`
- `provider_subscription_id` nullable
- `payment_id` nullable
- `created_at`
- `updated_at`

Estados:

- `pending_activation`
- `active`
- `paused`
- `expired`
- `canceled`

### credit_packs

Responsabilidad:

- catalogo de bonos o packs de creditos

Campos clave:

- `id`
- `name`
- `slug`
- `description`
- `credits_total`
- `price_amount`
- `currency`
- `expires_after_days` nullable
- `status`
- `is_public`
- `created_at`
- `updated_at`

### member_credit_accounts

Responsabilidad:

- cuenta de creditos comprados por un socio

Campos clave:

- `id`
- `member_id`
- `credit_pack_id`
- `status`
- `opened_at`
- `expires_at` nullable
- `payment_id` nullable
- `created_at`
- `updated_at`

Estados:

- `active`
- `depleted`
- `expired`
- `canceled`

### credit_ledger_entries

Responsabilidad:

- movimientos de creditos

Campos clave:

- `id`
- `member_credit_account_id`
- `entry_type`
- `credits_delta`
- `balance_after`
- `reference_type`
- `reference_id`
- `notes` nullable
- `created_at`

Tipos recomendados:

- `purchase`
- `reservation_hold`
- `reservation_consume`
- `reservation_refund`
- `manual_adjustment`
- `expiration`

Nota:

- si en V1 no hace falta `hold`, se puede ir directo a `consume`
- el ledger deja abierta esa evolucion sin romper el modelo

## 4.6 Payments

### cards

Responsabilidad:

- referencias seguras a metodos de pago

Campos clave:

- `id`
- `member_id`
- `provider`
- `provider_customer_id`
- `provider_payment_method_id`
- `brand`
- `last4`
- `exp_month`
- `exp_year`
- `is_default`
- `status`
- `created_at`
- `updated_at`

Estados:

- `active`
- `detached`
- `failed_verification`

### payments

Responsabilidad:

- intento y resultado de cobro

Campos clave:

- `id`
- `member_id`
- `card_id` nullable
- `provider`
- `provider_payment_intent_id` nullable
- `provider_invoice_id` nullable
- `status`
- `payment_type`
- `amount`
- `currency`
- `captured_at` nullable
- `failed_at` nullable
- `failure_reason` nullable
- `created_at`
- `updated_at`

Tipos:

- `membership_purchase`
- `credit_pack_purchase`
- `manual_charge`

Estados:

- `pending`
- `requires_action`
- `succeeded`
- `failed`
- `refunded`
- `canceled`

### payment_items

Responsabilidad:

- detalle de lo comprado

Campos clave:

- `id`
- `payment_id`
- `item_type`
- `reference_id`
- `quantity`
- `unit_amount`
- `total_amount`
- `created_at`

Tipos iniciales:

- `membership_plan`
- `credit_pack`

### payment_events

Responsabilidad:

- persistencia de webhooks y eventos del proveedor

Campos clave:

- `id`
- `payment_id` nullable
- `provider`
- `provider_event_id`
- `event_type`
- `payload_json`
- `processed_at` nullable
- `processing_status`
- `created_at`

Estados:

- `received`
- `processed`
- `ignored`
- `failed`

Restriccion:

- `provider + provider_event_id` unico

## 4.7 Agreements and audit

### agreements

Responsabilidad:

- documentos o contratos a firmar

Campos clave:

- `id`
- `title`
- `version`
- `document_url`
- `status`
- `created_at`

### agreement_signatures

Responsabilidad:

- aceptacion de documentos por socio

Campos clave:

- `id`
- `agreement_id`
- `member_id`
- `signed_at`
- `signature_source`

### audit_logs

Responsabilidad:

- trazabilidad de acciones sensibles

Campos clave:

- `id`
- `actor_user_id` nullable
- `action_type`
- `entity_type`
- `entity_id`
- `context_json`
- `created_at`

Acciones iniciales recomendadas:

- cambio de clase
- cancelacion manual
- ajuste manual de creditos
- activacion o cancelacion de membresia
- override de elegibilidad

## 5. Relaciones principales

- `users 1:1 members`
- `users 1:n user_roles`
- `users 1:n user_consents`
- `members 1:n reservations`
- `members 1:n waitlist_entries`
- `members 1:n member_memberships`
- `members 1:n member_credit_accounts`
- `members 1:n cards`
- `members 1:n payments`
- `members 1:n leads` por conversion opcional
- `class_types 1:n class_sessions`
- `coaches 1:n class_sessions`
- `class_sessions 1:n reservations`
- `class_sessions 1:n waitlist_entries`
- `membership_plans 1:n member_memberships`
- `credit_packs 1:n member_credit_accounts`
- `member_credit_accounts 1:n credit_ledger_entries`
- `payments 1:n payment_items`
- `payments 1:n payment_events`

## 6. Invariantes de negocio

Estas reglas deberian reflejarse en codigo, constraints o ambos.

### Identidad

- un `user` no puede compartir `external_auth_id` con otro
- un `member` no existe sin `user`

### Reservas

- un socio no puede tener mas de una reserva activa para la misma sesion
- una sesion no puede sobrepasar capacidad confirmada
- cancelar no elimina la reserva, cambia su estado

### Waitlist

- un socio no puede estar dos veces en la lista de espera activa de una sesion
- la promocion desde waitlist debe ser idempotente

### Membresias y creditos

- una reserva debe poder explicar de donde salio su elegibilidad
- toda devolucion de credito debe dejar rastro en ledger
- expiracion de creditos debe quedar registrada como movimiento

### Pagos

- un evento de pago externo no debe procesarse dos veces
- una activacion de producto derivada de pago debe ser idempotente

## 7. Estados y enums que conviene fijar pronto

- `users.status`
- `members.status`
- `coaches.status`
- `class_types.status`
- `class_sessions.status`
- `reservations.status`
- `reservations.attendance_status`
- `waitlist_entries.status`
- `member_memberships.status`
- `member_credit_accounts.status`
- `cards.status`
- `payments.status`
- `payment_events.processing_status`

## 8. Indices y constraints recomendados

### Unicos

- `users.normalized_email`
- `users.external_auth_provider + users.external_auth_id`
- `coaches.user_id` cuando no sea null
- `cards.provider + cards.provider_payment_method_id`
- `payment_events.provider + payment_events.provider_event_id`

### Parcial o logico

- una reserva activa unica por `member_id + class_session_id`
- una waitlist activa unica por `member_id + class_session_id`
- una tarjeta por defecto por `member_id`

### Consulta

- `class_sessions.starts_at`
- `class_sessions.status + starts_at`
- `reservations.member_id + status`
- `reservations.class_session_id + status`
- `member_memberships.member_id + status`
- `member_credit_accounts.member_id + status`
- `payments.member_id + created_at`

## 9. Propuesta de implementacion por fases

### Fase A: minimo para arrancar

- `users`
- `user_roles`
- `user_consents`
- `members`
- `coaches`
- `class_types`
- `class_sessions`
- `membership_plans`
- `member_memberships`
- `credit_packs`
- `member_credit_accounts`
- `credit_ledger_entries`
- `reservations`
- `reservation_entitlement_usages`
- `waitlist_entries`
- `cards`
- `payments`
- `payment_items`
- `payment_events`
- `audit_logs`

### Fase B: cuando haga falta

- `member_notes`
- `agreements`
- `agreement_signatures`
- `leads` si se integra comercial desde el principio
- reglas mas sofisticadas por tipo de clase

## 10. Open questions

Estas decisiones siguen impactando el schema final:

- si V1 vende solo membresias, solo creditos o ambos
- si el consumo de credito se hace al reservar o al asistir
- si la cancelacion devuelve siempre credito o depende de ventana
- si coaches necesitan login propio desde el dia uno
- si `leads` entra en MVP tecnico o queda posterior
- si acuerdos y firma digital entran realmente en V1

## 11. Recomendacion final

Para WellStudio V1, la propuesta mas solida y a la vez razonable es:

- identidad local en `users`
- dominio comercial en `members`
- `coaches` separado de auth
- reservas con estado explicito
- elegibilidad basada en entitlements
- creditos con ledger
- pagos con eventos persistidos
- auditoria de acciones sensibles desde el principio

Eso deja una base suficientemente seria para construir sin caer ni en un schema improvisado ni en sobreingenieria enterprise.
