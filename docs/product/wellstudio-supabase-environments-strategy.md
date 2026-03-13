# WellStudio Supabase Environments Strategy

Fecha: 2026-03-13
Estado: accepted baseline

## Objetivo

Definir una estrategia simple y realista para usar `Supabase Auth` sin sobredimensionar costes al principio.

La prioridad hoy es:

- separar pruebas y producción
- no complicar la operación
- mantener costes muy bajos
- dejar claro cuándo esta estrategia deja de ser suficiente

## Decisión actual

Usar dos proyectos Supabase al inicio:

1. `sandbox`
2. `production`

Ambos pueden vivir inicialmente en `Free`, porque:

- la escala esperada no supera ni de lejos el límite de MAU
- el límite relevante hoy es el número de proyectos activos
- ahora mismo no necesitamos un tercer entorno Supabase dedicado

## Suposiciones de escala

Escala inicial esperada:

- hasta `300` usuarios registrados aproximadamente
- uso mensual muy por debajo de los límites del plan `Free`
- un único centro en operación

## Roles por entorno

## Local

No debe depender de un proyecto Supabase real para todo el desarrollo diario.

Uso principal:

- desarrollo de UI
- smoke local
- tests unitarios e integration que no requieran auth real

## Sandbox

Proyecto Supabase de pruebas reales.

Uso principal:

- pruebas E2E de auth reales
- cuentas de escenario
- validación de registro, login y logout
- debugging manual sin tocar datos de producción

Reglas:

- nunca usarlo para datos reales de clientes
- mantener cuentas E2E reconocibles
- no compartir credenciales personales en este entorno

## Production

Proyecto Supabase usado por la app real.

Uso principal:

- auth de usuarios reales
- sesiones reales
- tráfico de cliente real

Reglas:

- sin cuentas E2E de pruebas agresivas
- sin experimentos manuales
- cualquier validación sensible debe haberse hecho antes en `sandbox`

## Cuentas de escenario recomendadas

En `sandbox`, usar cuentas estables y reconocibles:

- `e2e.pending.sandbox@wellstudio.test`
- `e2e.member.sandbox@wellstudio.test`
- `e2e.admin.sandbox@wellstudio.test`

Estas cuentas deben servir para:

- Playwright sandbox auth
- debugging manual
- validación de regresiones

## Qué no hacer

- usar producción para ejecutar tests E2E automáticos
- crear usuarios aleatorios sin estrategia de limpieza
- depender de una única cuenta personal para validar auth
- abrir un tercer proyecto Supabase sin necesidad real

## Limitación importante

El plan `Free` puede servir hoy para `sandbox + production`, pero no para crecer indefinidamente.

El punto de revisión no será el volumen inicial de `300` usuarios.
Los puntos de revisión reales serán:

- necesidad de un tercer entorno dedicado
- necesidad de mejores garantías operativas
- necesidad de separar staging y sandbox
- exigencias comerciales o de soporte más serias

## Cuándo revisar pasar a Pro

Revisar la decisión cuando ocurra una de estas situaciones:

1. necesitemos `sandbox + staging + production`
2. el gimnasio ya opere de forma estable sobre la plataforma
3. queramos una postura operativa más seria para producción
4. el proyecto dependa críticamente de un soporte más robusto del proveedor

## Recomendación operativa actual

Para WellStudio V1:

- mantener `sandbox + production`
- seguir en `Free` de momento
- no abrir un tercer entorno Supabase todavía
- documentar bien credenciales, cuentas E2E y uso de cada entorno

## Siguiente paso recomendado

Crear y documentar:

- variables de entorno por entorno
- cuentas E2E de `sandbox`
- procedimiento básico de alta y rotación de credenciales de test
