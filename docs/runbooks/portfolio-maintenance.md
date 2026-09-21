# Portfolio y mantenimiento

Fecha del registro: 2026-09-21. Alcance: demo modular con datos sintéticos,
sin adopción comercial acreditada. Cierre y publicación pendientes de validación
integrada y aprobación editorial. Referencias de trabajo existentes: MIG-157
(showcase), MIG-78 (reservas), MIG-125 (checkout), MIG-62/MIG-72 (gates).

## Evidencia por revisión

Punto de partida: [`dee184b1`](https://github.com/miguelgarglez/wellstudio-platform/tree/dee184b14908834c1b802daebd1b8240af9ecaa1),
identificado en Preview por la validación previa del 21 de septiembre.
Las PRs #9–#12 y #14 están fusionadas en `preview`. Los resultados siguientes
identifican cada revisión y entorno; no trasladar una comprobación local al alias
desplegado sin verificar su commit.

| Cambio implementado | Revisión y evidencia local comunicada | Límite pendiente |
| --- | --- | --- |
| [PR #8: dependencias](https://github.com/miguelgarglez/wellstudio-platform/pull/8) | `face291`: Next 16.3.3, foundation aprobado (384 tests / 68 archivos, lint, tipos y build), 16 regresiones PostgreSQL y CI hospedado aprobado | Validación fresca de navegador pendiente. `GHSA-ggr8-5vv4-36mx` en `deepmerge-ts` 7.1.5; auditorías salen con código 1. Dependabot necesita su configuración en la rama por defecto. |
| [PR #9: demo móvil en el tiempo](https://github.com/miguelgarglez/wellstudio-platform/pull/9) | `16e6624`: lint, tipos, 373 unitarios, build y 6 pruebas PostgreSQL locales aprobados; incorporada al foundation combinado con Node 22.23.2 | Refresh no destructivo de 14 días implementado; scheduler y conservación de actividad en Preview no validados. |
| [PR #10: migraciones e historial](https://github.com/miguelgarglez/wellstudio-platform/pull/10) | `f442c4a`: 15 migraciones y 12 pruebas PostgreSQL 17.6 aprobadas; foundation y reservas aprobados | Revisar drift, roles, locks y recuperación antes de tocar una DB existente. No acredita migración del sandbox. |
| [PR #11: PostgreSQL en CI](https://github.com/miguelgarglez/wellstudio-platform/pull/11) | Integrada después de #10. El job `foundation` de #8 pasa con migraciones, PostgreSQL, foundation y smoke en GitHub Actions | CI usa PostgreSQL local y placeholders; no acredita permisos, latencia ni proveedores remotos. |
| [PR #12: auth](https://github.com/miguelgarglez/wellstudio-platform/pull/12) y [PR #14: reservas](https://github.com/miguelgarglez/wellstudio-platform/pull/14) | `35f63c3`: auth 3 passed / 1 skipped; reservas 6 passed en navegador contra Supabase sandbox. PostgreSQL verifica atomicidad, outbox y presupuestos de consultas | Cancelación 4896 ms frente a un límite de 5000 ms. Leave waitlist registró `ERR_ABORTED` aunque UI y DB quedaron correctas. La evidencia precede a Next 16.3.3. |

El empaquetado de Vercel que fallaba tras actualizar Next quedó corregido en
`69bb368`: Vercel usa su output predeterminado y Docker/local conserva
`standalone`. Se reprodujo el fallo del trace NFT y se verificó el deployment
automático corregido en estado READY. La revisión combinada `face291` también
tiene checks `foundation` y Vercel aprobados.

En la inspección del 21 de septiembre, el alias Preview apuntaba al deployment
READY de `52b43982fe3d2d2d4a968143c41728fb9607cbe0`, rama `preview`, con pagos
simulados. Esto es una observación fechada, no una garantía sobre el alias futuro.
La rama `main` y Production no se han promovido.

La validación previa aprobó seis casos con el **simulador de pagos de la app**.
No completó Checkout y webhook reales de Stripe ni entrega de correo a un buzón
controlado. Resend aceptó un envío a su destinatario de pruebas; aceptación no
equivale a recepción. Las claves de test de Stripe no convierten
`PAYMENTS_CHECKOUT_MODE=sandbox` en una prueba de Stripe.

La inspección de solo lectura del sandbox encontró `_prisma_migrations`, índices
parciales activos y los índices históricos por estado, pero no `pg_cron`.
No se aplicaron migraciones, no se reconciliaron checksums y no se habilitó un
scheduler. La validación funcional no sustituye ese rollout de datos.

## Reproducir las comprobaciones

Usar Node 22.23.2 y pnpm 10.21.0, un checkout limpio sin entornos privados,
y las variables locales del [README](../../README.md#arranque-local-y-comprobaciones-sin-credenciales-remotas).
`pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm exec next typegen`
y `pnpm check:foundation` cubren instalación, lint, tipos, unitarios y build.

Para enfocar las invariantes existentes, sin proveedores:

```bash
pnpm exec vitest run tests/unit/reservations tests/unit/payments
```

### PostgreSQL desechable

La línea `preview` ya incluye el baseline y `vitest.integration.config.ts` de
PR #10. No aplicar estas instrucciones a una DB existente o a un túnel hacia
sandbox.

```bash
docker run --detach --name wellstudio-portfolio-postgres \
  --publish 127.0.0.1:55432:5432 \
  --env POSTGRES_USER=wellstudio \
  --env POSTGRES_PASSWORD=wellstudio \
  --env POSTGRES_DB=wellstudio_integration \
  postgres:17.6
docker exec wellstudio-portfolio-postgres pg_isready -U wellstudio
# Continuar cuando pg_isready indique "accepting connections".
export DATABASE_URL=postgresql://wellstudio:wellstudio@127.0.0.1:55432/wellstudio_integration
export DIRECT_URL="$DATABASE_URL"
pnpm db:migrate:deploy
INTEGRATION_DATABASE_URL="$DATABASE_URL" \
  pnpm exec vitest run --config vitest.integration.config.ts
# Eliminar únicamente el contenedor desechable creado para esta comprobación.
docker rm --force --volumes wellstudio-portfolio-postgres
```

El rol debe tener `LOGIN`/`CREATEDB`; la imagen crea ese rol local. El contrato de
la suite exige loopback, DB `wellstudio_integration`, sin query ni fragmento.
Las pruebas crean y eliminan sus propias DB con sufijos UUID; no envían correo.
Comprueban instalación vacía, repetición de migraciones, baselining/upgrade,
historial repetido, unicidad activa y dos reservas solapadas para la última plaza.
PR #14 añade presupuestos de consultas, promoción con un primer candidato
bloqueado y repetición del outbox sin reemplazar un snapshot ya enviado.

Para una base ya existente, seguir la
[reconciliación del historial propuesta en PR #10](https://github.com/miguelgarglez/wellstudio-platform/blob/f442c4adca54d5ef5f2d5ab38a9f7f5aa6cec0cd/docs/runbooks/supabase-postgres-prisma-workflow.md).
No ejecutar baseline DDL contra tablas existentes, usar `db push` como reparación,
ni eliminar históricos para recrear los índices globales.

### Gates que necesitan validación adicional

El responsable de integración coordina `pnpm test:e2e:smoke`, las suites
`pnpm test:e2e:auth:sandbox`, `pnpm test:e2e:reservations:sandbox` y
`pnpm test:e2e:payments:sandbox`, con revisión de móvil/teclado y evidencia del
commit probado. No forman parte de las comprobaciones sin credenciales anteriores.
El smoke y los pagos simulados no sustituyen los gates de auth/reservas ni la
[validación del proveedor Stripe](./stripe-preview-rollout.md).

## Condiciones para publicar el cierre

- Terminar la validación de #8 y actualizar el SHA integrado, enlace al CI,
  resultado de cada gate, entorno, fecha y limitaciones.
- Confirmar commit del alias Preview y reconciliar la DB bajo autorización.
  Un build local o un comentario automático de Vercel no prueba esta condición.
- Validar agenda futura, separación de fixtures E2E, conservación de actividad
  y replay del refresh. El [runbook de PR #9](https://github.com/miguelgarglez/wellstudio-platform/blob/16e6624/docs/runbooks/showcase-rolling-refresh.md)
  describe un scheduler externo propuesto; no supone que esté configurado.
- Resolver o aceptar explícitamente los riesgos de dependencias y completar
  la validación integrada, incluida auth y los proveedores.
- Aprobar la ficha y la build note inglesa. La nota permanece con `draft: true`;
  no debe enlazarse una ruta pública inexistente. Conservar las capturas actuales
  como ilustraciones, no como evidencia de los nuevos cambios.

Hasta entonces, mantener el estado de demo en validación. No usar “Completed”,
“production-ready”, cifras de rendimiento ni testimonios como prueba de adopción.
La integración en `main` o una etiqueta de release necesitan una decisión separada
de publicación por su relación con Production.

### Reconciliación de ramas

`preview` sigue siendo la línea de entrega del sandbox. Antes de proponer su
integración en `main`, comparar ambos historiales, revisar las migraciones contra
la base de destino y comprobar variables y servicios de Production con aprobación
del propietario. No resolver la divergencia con un reset o un push forzado.
Hasta esa decisión, enlazar `preview` desde la ficha de portfolio.

Dependabot lee su configuración desde la rama por defecto (`main`), aunque sus
actualizaciones estén dirigidas a `preview`. Por tanto, el archivo integrado solo
en `preview` no activa el mantenimiento. Llevarlo a `main` requiere un cambio
revisado dentro de la decisión de publicación; no se ha activado implícitamente.

## Mantenimiento acotado

Responsable: mantenedor del proyecto. Revisión breve mensual y ante alertas:

1. Revisar dependencias agrupadas, `pnpm audit` y `pnpm audit --prod`.
   Registrar advisory, versión afectada y decisión; un build verde no cierra un
   hallazgo. No auto-merge ni overrides mayores sin revisión.
2. Comprobar disponibilidad **y contenido**: sesiones futuras, ausencia de datos
   E2E visibles, enlaces y capturas útiles. Repetir los gates afectados por cambios.
3. Si el scheduler se habilita, observar errores, última ejecución y horizonte
   futuro. No usar el seed completo como mantenimiento: puede resetear actividad.
4. Actualizar el registro de revisión/entorno y las limitaciones de la ficha.
   Sin métricas comerciales o de carga no verificadas.

No añadir funciones, infraestructura ni nuevas integraciones por rutina. Si no se
puede sostener la demo, proponer al propietario retirarla y conservar capturas o
una grabación con su revisión; no dejar un enlace interactivo roto como entrada.
