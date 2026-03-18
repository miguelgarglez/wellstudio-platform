# WellStudio Technical Architecture V1

Fecha: 2026-03-12
Estado: borrador inicial
Base:

- [reverse-engineering-wellstudio.md](/Users/miguelgarglez/Developer/wellstudio-analysis/reverse-engineering-wellstudio.md)
- [prd-wellstudio-platform-v1.md](/Users/miguelgarglez/Developer/wellstudio-analysis/prd-wellstudio-platform-v1.md)
- [architecture-diagrams-mermaid.md](/Users/miguelgarglez/Developer/wellstudio-analysis/architecture-diagrams-mermaid.md)

## 1. Objetivo

Definir una arquitectura tecnica realista para construir WellStudio V1 como una plataforma propia que sustituya la experiencia actual fragmentada de landing + widgets embebidos.

La arquitectura debe servir para:

- lanzar un MVP robusto
- simplificar la operativa
- permitir evolucion sin rehacer todo
- evitar sobreingenieria

## 2. Decision Arquitectonica Principal

### Opcion recomendada

Construir un monolito modular en `Next.js` con una sola codebase web y una sola API principal.

### Por que

- el dominio aun se esta descubriendo
- el equipo y el producto no justifican microservicios en V1
- reservas, membresias, pagos y leads estan muy acoplados
- un monolito modular reduce complejidad operativa y acelera el MVP
- `Next.js` ofrece mejor base para una interfaz moderna web-first
- el equipo gana coherencia tecnica al trabajar con `TypeScript + React`
- permite extraer servicios mas adelante si realmente aparece necesidad

### Lo que implica

- una unica aplicacion `Next.js` con rutas publicas y privadas
- una unica API interna servida por la misma aplicacion o por handlers bien acotados
- una base de datos principal compartida
- cola de trabajos para emails, recordatorios y tareas asicronas

### Condicion critica

Este enfoque solo es recomendable si el monolito se diseña de forma modular.

No debe convertirse en una app grande donde se mezclen:

- componentes UI
- acceso a datos
- reglas de negocio
- auth
- pagos
- acciones administrativas

La modularidad interna es clave para que `Next.js` siga siendo una decision pragmatica y no derive en una base de codigo fragil.

## 3. Supuestos de Arquitectura

## Confirmado

- existe area publica comercial
- existe area privada de socio
- existe modelo de usuario autenticado y cliente
- existen reservas, bonos, suscripciones, pagos, tarjetas y contratos como conceptos reales del sistema actual
- la vinculacion de tarjeta actual usa Stripe
- la logica de reserva depende de elegibilidad

## Hipotesis de trabajo

- WellStudio V1 no necesita multi-centro
- V1 puede ser web responsive y no app nativa
- la mayor parte del valor inicial esta en clases, reservas, pagos basicos y operativa interna
- planes, bonos o creditos seran el mecanismo de elegibilidad principal

## Pendiente de validar

- reglas exactas de elegibilidad
- si V1 debe incluir compra online obligatoria o puede dejarse parcial
- si staff y coach deben compartir sistema de usuarios o separar entidades
- si el gimnasio necesita reporting avanzado desde el dia uno

## 4. Principios de Diseño

- simplicidad primero
- separar claramente marketing, area cliente y backoffice a nivel de rutas y UX
- mantener el dominio explicito en codigo
- diseñar modulos internos con contratos claros
- registrar eventos clave para auditoria y soporte
- hacer que los mensajes de bloqueo sean de producto, no errores tecnicos

## 5. Arquitectura de Alto Nivel

## Frontend

Una sola codebase para:

- marketing site
- member app
- staff/admin app

Separacion por rutas:

- `/`
- `/clases`
- `/planes`
- `/contacto`
- `/login`
- `/registro`
- `/app/*`
- `/admin/*`

Recomendacion:

- Next.js App Router

Por que:

- renderizado mixto SSR + CSR
- SEO fuerte para marketing
- rutas privadas limpias
- formularios y server actions opcionales
- buena base para evolucionar a PWA si hiciera falta
- permite operar como monolito full-stack sin introducir otra aplicacion backend desde el dia uno

## Backend

En la opcion prioritaria, el backend vive dentro del propio monolito `Next.js` mediante una capa de dominio y una capa de acceso a datos bien separadas de la UI.

Modulos internos:

- auth
- members
- coaches
- classes
- reservations
- waitlist
- memberships
- credit-packs
- payments
- leads
- agreements
- notifications
- admin
- reporting

Estructura recomendada dentro del monolito:

- `app/` solo para routing, layouts y entrypoints de UI
- `modules/auth`
- `modules/members`
- `modules/classes`
- `modules/reservations`
- `modules/waitlist`
- `modules/memberships`
- `modules/payments`
- `modules/leads`
- `modules/admin`
- `lib/db`
- `lib/queue`
- `lib/integrations`

Regla clave:

- la UI no debe contener reglas de negocio criticas
- las server actions y route handlers deben actuar como capa de entrada, no como lugar donde vive el dominio
- cada modulo debe exponer casos de uso claros y reutilizables

Alternativa si el dominio crece antes de lo previsto:

- extraer un backend `NestJS` manteniendo `Next.js` como frontend

Esa alternativa sigue siendo valida, pero no es la prioridad actual.

## Base de datos

Recomendacion:

- Supabase Postgres

Por que:

- dominio transaccional
- relaciones fuertes
- consistencia importante en reservas y pagos
- buen soporte para constraints e índices

## Cola y jobs

Recomendacion:

- Redis + BullMQ

Usos:

- emails transaccionales
- recordatorios
- promociones de waitlist
- reintentos de webhooks
- procesos de reporting asicrono

## Storage

Recomendacion:

- S3 compatible

Usos:

- documentos
- contratos
- exports
- adjuntos internos si aparecen

## 6. Stack Recomendado

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- TanStack Query para datos cliente si hace falta

## Backend

- monolito modular en `Next.js`
- TypeScript
- Prisma o Drizzle ORM
- Zod para validacion compartida

Alternativa de segunda fase o de complejidad creciente:

- `NestJS` como backend separado

Preferencia ORM:

- Prisma si priorizas velocidad de equipo y claridad
- Drizzle si priorizas SQL mas cercano y control

Recomendacion final:

- Prisma para V1

## Base de datos y jobs

- Supabase Postgres
- Redis
- BullMQ

## Auth

Decision aceptada:

- usar `Supabase Auth`
- evitar auth construida desde cero
- alojar auth y base de datos en proyectos `Supabase` separados por entorno

Recomendacion de integracion:

- encapsular el proveedor detras de un modulo `auth` propio
- persistir `user`, `member` y relaciones de dominio en la base de datos propia
- mapear la identidad externa mediante `external_auth_id`, `provider` y `provider_metadata`
- verificar tokens o sesiones del proveedor en backend antes de aplicar reglas de negocio

Si se opta por auth propia o semi-propia:

- JWT access token de corta duracion
- refresh token rotatorio almacenado seguro
- sesiones persistidas en tabla
- email verification por codigo o magic link

## Payments

- Stripe
- Setup Intents para guardar tarjeta
- Payment Intents para compras puntuales
- Subscription APIs si se activa billing recurrente en V1

## Email

- Resend, Postmark o Sendgrid

Recomendacion final:

- Resend o Postmark

## Analytics

- PostHog o Plausible + eventos propios en backend

Recomendacion final:

- PostHog si quieres producto + funnels + eventos

## Infraestructura

- VPS/PaaS sobrio para el monolito `Next.js`
- Supabase para auth y base de datos
- Redis gestionado o sobrio si los jobs llegan a ser necesarios

Recomendacion inicial equilibrada:

- VPS con Docker para servir la app
- Supabase `sandbox` y `production` para auth y base de datos

## 7. Estructura Modular del Monolito

Este punto es no negociable si se adopta `Next.js` como monolito.

### Objetivo

Mantener una separacion clara entre:

- presentacion
- dominio
- persistencia
- integraciones externas

### Regla de organizacion

Cada modulo debe contener, de forma consistente:

- tipos y contratos
- casos de uso
- repositorios o gateways
- validaciones
- mapeos a DTOs o view models

### Anti-patrones a evitar

- consultas SQL o Prisma embebidas en componentes
- reglas de elegibilidad escritas en paginas o layouts
- logica de pagos dentro de handlers improvisados
- acciones de admin reutilizando logica de UI publica sin capa de dominio
- dependencias cruzadas sin contrato entre modulos

### Resultado buscado

Un monolito que siga siendo sencillo de desplegar, pero que internamente se comporte como un sistema modular y mantenible.

Si el producto crece:

- migrar backend y DB a AWS o similar sin cambiar arquitectura logica

## 7. Separacion de Superficies

## Marketing

Responsable de:

- home
- clases publicas
- planes
- contacto
- captacion

Requisitos:

- SEO
- performance
- copy y diseño premium

## Member App

Responsable de:

- dashboard
- reservas
- waitlist
- perfil
- pagos basicos
- membresias
- historial

Requisitos:

- sesiones robustas
- UX clara
- mensajes de elegibilidad legibles

## Admin App

Responsable de:

- clases
- socios
- leads
- contratos
- operativa diaria
- reporting basico

Requisitos:

- rapidez operativa
- permisos
- trazabilidad

## 8. Bounded Contexts / Modulos

## Auth

Responsabilidad:

- registro
- login
- refresh de sesion
- verificacion de email
- recuperacion de contraseña

Entidades:

- users
- user_sessions
- email_verification_codes
- password_reset_tokens

APIs clave:

- `POST /auth/register`
- `POST /auth/verify-email-code`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## Members

Responsabilidad:

- perfil de socio
- consentimientos
- estado del miembro

Entidades:

- members
- user_consents
- member_notes

APIs clave:

- `GET /app/me`
- `PATCH /app/me`
- `GET /admin/members`
- `GET /admin/members/:id`

## Coaches

Responsabilidad:

- datos de entrenadores
- asignacion a sesiones

Entidades:

- coaches

APIs clave:

- `GET /coaches`
- `POST /admin/coaches`
- `PATCH /admin/coaches/:id`

## Classes

Responsabilidad:

- tipos de clase
- sesiones programadas
- aforo
- agenda publica

Entidades:

- class_types
- class_sessions
- class_type_eligibility_rules

APIs clave:

- `GET /classes`
- `GET /classes/:id`
- `GET /app/classes`
- `POST /admin/class-types`
- `POST /admin/class-sessions`
- `PATCH /admin/class-sessions/:id`

## Reservations

Responsabilidad:

- creacion de reserva
- cancelacion
- reglas de ventana temporal

Entidades:

- reservations
- cancellation_policies

APIs clave:

- `POST /app/reservations`
- `DELETE /app/reservations/:id`
- `GET /app/reservations`

## Waitlist

Responsabilidad:

- entrada en lista de espera
- salida
- promocion cuando se libera plaza

Entidades:

- waitlist_entries

APIs clave:

- `POST /app/waitlist`
- `DELETE /app/waitlist/:id`

## Memberships

Responsabilidad:

- planes
- suscripciones del miembro
- elegibilidad derivada

Entidades:

- membership_plans
- member_memberships

APIs clave:

- `GET /membership-plans`
- `GET /app/memberships`
- `POST /app/membership-purchases`

## Credit Packs

Responsabilidad:

- bonos o packs
- creditos consumibles
- caducidades

Entidades:

- credit_packs
- member_credits

APIs clave:

- `GET /credit-packs`
- `GET /app/credits`
- `POST /app/credit-pack-purchases`

## Payments

Responsabilidad:

- tarjetas
- cobros
- tickets
- sincronizacion con Stripe

Entidades:

- cards
- payments
- payment_items
- payment_events

APIs clave:

- `POST /app/payments/cards/setup`
- `POST /app/payments/cards/confirm`
- `GET /app/payments/cards`
- `DELETE /app/payments/cards/:id`
- `GET /app/payments/history`
- `POST /webhooks/stripe`

## Leads

Responsabilidad:

- captacion
- pipeline comercial basico
- conversion a miembro

Entidades:

- leads
- lead_sources
- lead_events

APIs clave:

- `POST /leads`
- `GET /admin/leads`
- `PATCH /admin/leads/:id`
- `POST /admin/leads/:id/convert`

## Agreements

Responsabilidad:

- contratos
- versiones
- firmas

Entidades:

- agreements
- agreement_signatures

APIs clave:

- `GET /app/agreements`
- `POST /app/agreements/:id/sign`
- `GET /admin/agreements`

## Notifications

Responsabilidad:

- emails
- recordatorios
- eventos transaccionales

Entidades:

- notification_jobs
- notification_logs

APIs clave:

- internas

## Admin

Responsabilidad:

- backoffice
- permisos
- configuracion

Entidades:

- admin_roles
- admin_permissions
- audit_logs

APIs clave:

- `GET /admin/dashboard`
- `GET /admin/reports/*`
- `GET /admin/audit-logs`

## 9. Modelo de Autenticacion

## Enfoque

- access token corto
- refresh token rotatorio
- sesiones persistidas
- cookies `httpOnly` en web si se quiere simplificar seguridad en frontend

Recomendacion:

- usar cookie segura para sesion web
- evitar exponer bearer token al frontend si no es necesario

Motivo:

- reduce superficie XSS
- encaja mejor con una app web cerrada

### Flujo recomendado

1. login
2. backend crea sesion
3. set-cookie segura
4. frontend consume API con credenciales
5. middleware protege `/app/*` y `/admin/*`

## Permisos

Roles iniciales:

- member
- coach
- staff
- admin

Regla:

- no mezclar permisos por inferencia de UI
- siempre validar permisos en backend

## 10. Modelo de Elegibilidad

La elegibilidad es uno de los puntos mas sensibles del dominio.

Recomendacion:

- modelarla como motor de reglas simple en backend
- no hardcodear la logica en frontend

Tipos de regla inicial:

- requiere suscripcion activa
- requiere credito disponible
- requiere plan especifico
- no permite reserva fuera de ventana temporal
- no permite si clase llena y waitlist desactivada

Salida del motor:

- `allowed: true|false`
- `reason_code`
- `reason_message`
- `suggested_action`

Ejemplo:

```json
{
  "allowed": false,
  "reason_code": "NO_ACTIVE_ENTITLEMENT",
  "reason_message": "Necesitas una suscripción o bono activo para reservar esta clase.",
  "suggested_action": "VIEW_MEMBERSHIPS"
}
```

## 11. Diseño de Reservas

## Reglas recomendadas

- una reserva por miembro y sesion
- capacidad estricta
- transaccion atomica al reservar
- consumo de credito o validacion de plan dentro de la misma transaccion logica
- cancelacion con cutoff configurable
- waitlist posicionada

## Concurrencia

Es critica.

Recomendacion:

- lock optimista o pesimista por sesion
- constraint unico por `(member_id, class_session_id)`
- contador de capacidad nunca fiado al frontend

## 12. Diseño de Pagos

## Tarjetas

- guardar solo referencias de Stripe
- nunca almacenar PAN o datos sensibles

## Pagos puntuales

Usos:

- bonos
- posibles compras de servicios

## Suscripciones

Usos:

- membresias recurrentes

## Webhooks

Imprescindibles:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `setup_intent.succeeded`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Recomendacion:

- persistir todos los eventos en `payment_events`
- hacer procesamiento idempotente

## 13. Diseño de Leads

Los leads no deberian vivir como simple formulario suelto.

Recomendacion:

- pipeline ligero:
  - new
  - contacted
  - qualified
  - converted
  - lost

- capturar metadata:
  - source
  - page
  - campaign
  - free text notes

## 14. Diseño del Admin

El admin de V1 debe ser operativo, no corporativo.

Prioridades:

- ver clases del dia
- editar sesiones
- revisar aforo
- gestionar socios
- revisar leads

No intentar en V1:

- BI complejo
- configuradores ultra flexibles
- automatizaciones pesadas

## 15. Requisitos de Observabilidad

## Logs

- auth
- reservas
- pagos
- errores de negocio

## Audit logs

- cambios de clases
- cambios de membresias
- cancelaciones manuales
- conversiones de leads

## Monitoring

- errores backend
- colas fallidas
- webhooks fallidos
- tiempos de respuesta

## Analytics de producto

- registro iniciado
- registro completado
- email verificado
- login
- intento de reserva
- reserva confirmada
- reserva bloqueada
- cancelacion
- inicio de compra
- pago exitoso
- lead enviado

## 16. Seguridad

- hash de contraseñas con Argon2 o bcrypt fuerte
- cookies seguras `httpOnly`, `Secure`, `SameSite=Lax` o `Strict` segun flujo
- rate limiting en auth y formularios
- validacion server-side de todos los formularios
- RBAC en admin
- proteccion CSRF si usas cookies de sesion
- idempotencia en webhooks y pagos
- cifrado de secretos y claves

## 17. Estrategia de Datos y Migracion

La parte mas delicada no es el codigo, sino la migracion desde la operativa actual.

Escenarios:

### Escenario A

Lanzamiento limpio sin migrar historico completo.

Se migra solo:

- socios activos
- coaches
- clases futuras
- planes activos

Ventaja:

- menos complejidad

### Escenario B

Migracion amplia con historico.

Incluye:

- reservas pasadas
- pagos
- contratos

Riesgo:

- mas coste
- mas tiempo
- depende de acceso al sistema origen

Recomendacion inicial:

- Escenario A

## 18. Deploy y Entornos

Entornos minimos:

- local
- preview / sandbox
- production

## Frontend

- preview deployments por rama

## Backend

- staging diferido hasta que haga falta un entorno mas parecido a produccion

## DB

- migraciones versionadas
- backups automaticos

## 19. Roadmap Tecnico

## Fase 0 Discovery tecnico

- cerrar reglas de elegibilidad
- cerrar catalogo real de membresias y bonos
- decidir alcance de pagos V1
- decidir migracion minima

## Fase 1 Foundations

- repositorio
- CI basica
- auth
- modelo de datos base
- framework de admin
- observabilidad base

## Fase 2 MVP Core

- agenda publica
- dashboard del socio
- reservas
- waitlist
- perfil
- leads
- admin de clases y socios

## Fase 3 Payments and Memberships

- tarjetas
- suscripciones
- bonos
- webhooks

## Fase 4 Hardening

- performance
- accesibilidad
- seguridad
- auditoria
- analytics

## 20. Riesgos Tecnicos Principales

## 1. Dominio poco cerrado

Las reglas reales de negocio pueden cambiar cuando WellStudio explique su operativa completa.

Mitigacion:

- modelar elegibilidad de forma configurable

## 2. Flujo de reserva

Es el core del negocio y el punto mas sensible a errores de concurrencia.

Mitigacion:

- transacciones
- constraints
- testing de concurrencia

## 3. Pagos

Siempre elevan complejidad.

Mitigacion:

- Stripe
- webhooks idempotentes
- V1 con alcance acotado

## 4. Migracion de datos

Puede volverse el cuello de botella real.

Mitigacion:

- migracion minima primero

## 5. Backoffice

Es facil subestimar su importancia.

Mitigacion:

- priorizar tareas operativas reales

## 21. Recomendacion Final

La arquitectura recomendada para WellStudio V1 es:

- frontend web con Next.js
- backend monolito modular en Next.js
- Supabase Postgres como base principal
- Supabase Auth como proveedor de identidad
- Redis + BullMQ para jobs
- Stripe para pagos y tarjetas
- email transaccional externo
- deploy inicial `Vercel-first` con `Preview` como sandbox y `Production` promovido manualmente

Lo mas importante no es elegir la tecnologia perfecta, sino mantener tres principios:

- dominio claro
- separacion limpia de superficies
- reglas de negocio en backend

La mejor decision de V1 es no replicar la fragmentacion actual. Marketing, member app y admin pueden compartir codebase, pero no deben compartir experiencia ni logica improvisada.
