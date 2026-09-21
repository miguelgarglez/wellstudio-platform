# Portfolio y mantenimiento

Fecha del registro: 2026-09-21. Alcance: demo modular con datos sintéticos,
sin adopción comercial acreditada. Cierre operativo y publicación pendientes;
la validación integrada local contra sandbox está registrada abajo.
Referencias de trabajo existentes: MIG-157
(showcase), MIG-78 (reservas), MIG-125 (checkout), MIG-62/MIG-72 (gates).

## Evidencia por revisión

Punto de partida: [`dee184b1`](https://github.com/miguelgarglez/wellstudio-platform/tree/dee184b14908834c1b802daebd1b8240af9ecaa1),
identificado en Preview por la validación previa del 21 de septiembre.
Las PRs #8–#12 y #14 están fusionadas en `preview` (#8 mediante `447bd26`).
Los resultados siguientes
identifican cada revisión y entorno; no trasladar una comprobación local al alias
desplegado sin verificar su commit.

| Cambio implementado | Revisión y evidencia local comunicada | Límite pendiente |
| --- | --- | --- |
| [PR #8: dependencias y redirects](https://github.com/miguelgarglez/wellstudio-platform/pull/8) | `f06e3df`: Next 16.3.3, 402 unitarios / 70 archivos, `check:auth` (77 casos, lint, tipos, build) y CI hospedado con PostgreSQL aprobados. Suites sandbox: auth 3 passed / 1 skipped, reservas 6 passed, pagos 6 passed | Registro omitido y OTP exitoso no verificado end-to-end. `GHSA-ggr8-5vv4-36mx` en `deepmerge-ts` 7.1.5; auditorías salen con código 1. Dependabot necesita su configuración en la rama por defecto. |
| [PR #9: demo móvil en el tiempo](https://github.com/miguelgarglez/wellstudio-platform/pull/9) | `16e6624`: lint, tipos, 373 unitarios, build y 6 pruebas PostgreSQL locales aprobados. En Preview `447bd261`: refresh crea 12 sesiones, replay crea 0; hashes verifican conservación de 17 tablas y 25 sesiones anteriores | Scheduler sin activar ni observar; la llamada manual no prueba una ejecución programada. |
| [PR #10: migraciones e historial](https://github.com/miguelgarglez/wellstudio-platform/pull/10) | `f442c4a`: 15 migraciones y 12 pruebas PostgreSQL 17.6 aprobadas; foundation y reservas aprobados | Revisar drift, roles, locks y recuperación antes de tocar una DB existente. No acredita migración del sandbox. |
| [PR #11: PostgreSQL en CI](https://github.com/miguelgarglez/wellstudio-platform/pull/11) | Integrada después de #10. El job `foundation` de #8 pasa con migraciones, PostgreSQL, foundation y smoke en GitHub Actions | CI usa PostgreSQL local y placeholders; no acredita permisos, latencia ni proveedores remotos. |
| [PR #12: auth](https://github.com/miguelgarglez/wellstudio-platform/pull/12) y [PR #14: reservas](https://github.com/miguelgarglez/wellstudio-platform/pull/14) | Incorporadas en la revisión `f06e3df`: auth y reservas pasan contra Supabase sandbox con Next 16.3.3. PostgreSQL verifica atomicidad, outbox y presupuestos de consultas | Son pruebas funcionales con una cuenta dedicada; no son una prueba de carga ni un SLA. La evidencia histórica `35f63c3` registró cancelación a 4896 ms frente a 5000 ms y un `ERR_ABORTED` con efectos correctos. |

El empaquetado de Vercel que fallaba tras actualizar Next quedó corregido en
`69bb368`: Vercel usa su output predeterminado y Docker/local conserva
`standalone`. Se reprodujo el fallo del trace NFT y se verificó el deployment
automático corregido en estado READY. La revisión final `f06e3df` tiene checks
`foundation` y Vercel aprobados.

### Validación integrada del 21 de septiembre

En `f06e3df`, servidor standalone enlazado a `0.0.0.0:3001` y navegador en
`localhost:3001`, las suites CLI se ejecutaron en serie, con un worker,
cero retries y sin modificar assertions ni timeouts:

| Suite | Resultado | Duración observada |
| --- | --- | --- |
| `test:e2e:auth:sandbox` | 3 passed / 1 skipped (registro opt-in) | 8,2 s |
| `test:e2e:reservations:sandbox` | 6 passed | 64,3 s |
| `test:e2e:payments:sandbox` | 6 passed | 102,0 s |

La validación UI grabada comenzó con cero cookies y cero orígenes de storage.
Login, reload, logout y bloqueo posterior se comprobaron con miembro y admin.
Los documentos y cookies permanecieron en `localhost`: post-login devolvió
`307 Location: /app` o `/admin`. Los cuatro POST de checkout/tarjeta devolvieron
`303` relativo; los snapshots de DB y reload confirmaron cancelación sin alta,
bono con seis créditos/ledger/job y tarjeta Visa de prueba activa/default.
Se comprobó OTP inválido con destino externo rechazado. El éxito de OTP se cubre
unitariamente, sin acreditar recepción del correo ni el recorrido real completo.

Los streams de logout registraron `ERR_ABORTED` después de headers 200, aunque
la navegación y el bloqueo privado funcionaron. No se atribuye a pérdida de datos.
Showcase y waitlist tienen evidencia UI previa en `dd71b6a`; la suite final de
reservas anterior sí corresponde a `f06e3df`. La regresión de rutas de auth
reproduce el cambio de origen antes del arreglo y verifica cookies y destinos
relativos después.

### Validación del alias Preview

El 21 de septiembre a las 14:23 UTC, Vercel confirmó el alias
`preview-wellstudio.miguelgarglez.com` en el deployment READY
`dpl_G6e4yZMNsDr5fAxm1UAUWSu6oE17`, commit
`447bd2612601102397c98bb8730945f5329edfcb`, rama `preview`, proyecto
`prj_vF8ycSf5Errv9BDUCBdULwcv5lyf`. Sustituye la observación anterior de
`52b43982`; es evidencia fechada, no garantía sobre el alias futuro.

Con las variables restringidas a Preview/rama `preview`, la primera llamada
autorizada al refresh devolvió `200`, `healthy: true`, `createdCount: 12` y
`futureSessionCount: 12`. Su replay devolvió `200` y `createdCount: 0`.
Los hashes anteriores/posteriores confirmaron las 17 tablas de actividad y
catálogo sin cambios, las 25 sesiones existentes sin cambios y 12 altas.
Sin bearer el endpoint devolvió `401`. El horizonte terminó el 5 de octubre;
las sesiones públicas quedaron entre el 21 de septiembre y el 1 de octubre.

La smoke grabada usó un contexto nuevo (cero cookies/storage), sin login ni
header E2E en las 216 requests observadas. `/classes` mostró las 12 sesiones,
sin fixtures visibles; filtros y limpieza funcionaron con teclado. En
`/showcase` se comprobaron slides, galería, Escape y restitución de foco.
Los viewports Chromium 1280×900 y 390×844 no mostraron overflow horizontal.
No equivale a validar dispositivos físicos, Safari, todos los slides o un
focus trap exhaustivo. Dos comprobaciones auxiliares de foco necesitaron
reiniciar la navegación desde una carga limpia por posición/conteo de Tab;
no se cambió código. El challenge externo de la homepage registró errores
durante setup; no hubo page errors en las páginas verificadas.

La rama `main` y Production no se han promovido. El scheduler no se ha activado.

### Stripe TEST: recorrido híbrido y replay controlado

Las seis pruebas anteriores usan el **simulador de pagos de la app**; tener
claves de test no convierte `PAYMENTS_CHECKOUT_MODE=sandbox` en Stripe.
Una prueba posterior, grabada en `f06e3df`, cambió solo el launcher local a
`stripe`. Usó la cuenta «Entorno de prueba de miguelgarglez», su único webhook
activo de Preview y la base sandbox compartida, sin cambiar el proveedor ni
la configuración remota.

Una compra de 54 EUR con tarjeta oficial TEST produjo Checkout `complete/paid`,
`livemode: false`, un `Payment SUCCEEDED`, un evento auténtico
`checkout.session.completed PROCESSED` y `pending_webhooks: 0`.
Se creó una cuenta `ACTIVE` y un ledger `PURCHASE` de seis créditos. La UI pasó
de 18 a 24 créditos y persistió tras reload; las filas previas de pagos y cuentas
comparadas quedaron iguales. El retorno nativo a `localhost:3001/app/account`
dio 200; se observaron 8849 ms desde el helper de pago, sin atribuirlos a fases
internas del webhook. Un job incidental llegó a `SENT`, intento 1.

El arranque inicial en 3002 falló la comprobación de origen: el build incorporaba
3001. Se reutilizó el único checkout pendiente en el puerto correcto. Dos
selectores auxiliares se ajustaron a la UI real, sin cambiar código ni timeouts.
No se identificó el commit remoto en el momento del webhook: esta evidencia
corresponde al alias Preview, no a un deployment fijado ni a un recorrido
enteramente alojado.

El 21 de septiembre a las 15:06 UTC se recuperó el evento original mediante el
SDK de Stripe y se envió dos veces al mismo webhook. Cada firma se generó
localmente con `webhooks.generateTestHeaderString` y el secreto autorizado.
Ambas respuestas fueron 200 / `received: true`. Los snapshots completos y sus
hashes quedaron iguales: 14 pagos, 4 cuentas, 4 ledger entries, 12 eventos y
1 job de compra del miembro dedicado. Se comprobó una única cuenta y un único
ledger PURCHASE vinculados a esa compra.

Este replay controlado verifica la deduplicación del endpoint; **no es un
reenvío originado por Stripe**, ni prueba su scheduler de reintentos. Reload,
aceptación de Resend y estado `SENT` tampoco acreditan recepción en un buzón.
El envío de Resend a su destinatario oficial de pruebas fue aceptado; la
recepción y el recorrido de OTP exitoso siguen pendientes.

### Estado de la base remota

La inspección de solo lectura del sandbox encontró `_prisma_migrations`, índices
parciales activos y los índices históricos por estado, pero no `pg_cron`.
No se aplicaron migraciones, no se reconciliaron checksums y no se habilitó un
scheduler. Se configuraron las variables de refresh y un secreto dedicado solo
en Preview/rama `preview`; su invocación y replay están comprobados arriba.
La validación funcional no sustituye el rollout de migraciones.

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

### Gates remotos y límites de cobertura

El responsable de integración coordina `pnpm test:e2e:smoke`, las suites
`pnpm test:e2e:auth:sandbox`, `pnpm test:e2e:reservations:sandbox` y
`pnpm test:e2e:payments:sandbox`, con revisión de móvil/teclado y evidencia del
commit probado. Los resultados finales de auth, reservas y pagos figuran arriba;
móvil/teclado se comprobaron después en las páginas públicas de Preview, no en
los recorridos privados de esa ejecución.
No forman parte de las comprobaciones sin credenciales anteriores.
El smoke y los pagos simulados no sustituyen los gates de auth/reservas ni la
[validación del proveedor Stripe](./stripe-preview-rollout.md).

## Condiciones para publicar el cierre

- Conservar la evidencia de #8 (`f06e3df`, integrada mediante `447bd26`), sus
  gates y límites; repetir los afectados si cambia el código.
- Conservar la comprobación del alias, agenda pública y replay de `447bd261`;
  repetirla tras cambios relevantes. Reconciliar las migraciones de la DB bajo
  autorización independiente.
- Activar y observar el scheduler del [runbook de refresh](./showcase-rolling-refresh.md).
  La primera llamada manual y el replay no acreditan esta condición.
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
