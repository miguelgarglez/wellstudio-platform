# Showcase: agenda móvil y scheduler de Preview

Relacionado: `MIG-160`, `MIG-161`. Endpoint: `GET /api/internal/showcase/refresh`.

## Contrato y límites

El [seed de vitrina](showcase-vitrina-seed.md) reconstruye sesiones, reservas y
derechos. **No es seguro para ejecución recurrente.** El refresh añade solamente
sesiones futuras usando los seis blueprints existentes, repetidos semanalmente
(lunes–jueves), dentro de los siguientes 14 días. Las horas se interpretan en
`Europe/Madrid`, incluidos cambios de horario de verano, sin depender de la zona
horaria del servidor.

Cada slot tiene un ID estable `showcase-rolling-<key>-<fecha Madrid>`. Una sesión
con ese ID, o con el mismo tipo y hora de inicio, se conserva sin modificaciones,
incluso si fue cancelada, cerrada o reprogramada. Una sesión movida conserva su ID
y no se recrea en la hora anterior. No se borran sesiones históricas.

La transacción usa el mismo advisory lock que el seed y aislamiento serializable
con reintentos acotados. La clave primaria evita duplicados entre refreshes
concurrentes. No coordina ediciones arbitrarias de staff que no usen ese lock:
no programar manualmente los mismos slots durante el refresh. El seed sigue
siendo destructivo aunque comparta lock.

Las sesiones nuevas parten de **cero reservas**: no se inventa ocupación ni se
crean reservas de relleno. No se actualizan reservas existentes, listas de espera,
socios, membresías, créditos, ledger, pagos, catálogo o reglas de elegibilidad;
tampoco se generan notificaciones. Los tipos deben seguir activos y públicos,
y los coaches activos. Si falta alguno, devuelve `503` sin inserciones parciales:
revisar el catálogo manualmente, no lanzar un reset para subsanarlo.

## Configuración exclusiva del padre/operador

Este PR no habilita variables, scheduler ni despliegues. Antes de activarlo,
verificar en Vercel **el proyecto exacto y el deployment de la rama `preview`**,
y confirmar que el alias de Preview apunta a ese deployment y al sandbox
Supabase autorizado. No deducir IDs de nombres parecidos.

Variables requeridas en el ámbito Preview de la rama `preview`:

| Variable | Valor/validación |
|---|---|
| `CRON_SECRET` | Secreto privado dedicado a scheduled operations, compartido con el scheduler; nunca `NEXT_PUBLIC_*` |
| `SHOWCASE_REFRESH_ENABLED` | `true`; interruptor explícito |
| `SHOWCASE_VERCEL_PROJECT_ID` | ID del proyecto Vercel verificado por el operador |
| `VERCEL_PROJECT_ID` | Variable de sistema; debe coincidir con la anterior |
| `VERCEL_ENV` | Variable de sistema, exactamente `preview` |
| `VERCEL_TARGET_ENV` | Si existe, exactamente `preview` |
| `VERCEL_GIT_COMMIT_REF` | Variable de sistema, exactamente `preview`; las ramas PR quedan bloqueadas |
| `E2E_AUTH_SANDBOX` | `true` |
| `PAYMENTS_CHECKOUT_MODE` | `sandbox`; no habilitar el refresh durante validación de proveedor real |
| `SUPABASE_SANDBOX_PROJECT_REF` | Ref del sandbox verificado, 20 caracteres alfanuméricos minúsculos |
| `NEXT_PUBLIC_SUPABASE_URL` | Exactamente `https://<ref>.supabase.co` (sin ruta, credenciales ni query) |
| `DATABASE_URL` | DB `postgres`: host `db.<ref>.supabase.co`, usuario `postgres`, o pooler `aws-<n>-<region>.pooler.supabase.com`, usuario `postgres.<ref>` |

Solo se aceptan puertos PostgreSQL estándar (`5432`, `6543`) y parámetros
`sslmode`, `pgbouncer`, `connection_limit`, `pool_timeout`. Overrides de
host/usuario por query se rechazan. El guard valida la conexión usada por este
job; el operador debe comprobar que realmente es el sandbox permitido.
No modificar variables de sistema para eludir la comprobación de entorno.
Production y local fallan cerrados, aunque tengan `CRON_SECRET`.

Si Preview está protegido por Vercel, el padre debe configurar también el acceso
de automatización según la política del proyecto; un `401` de Vercel no es un
`401` de este handler. No quitar la protección para hacerlo funcionar.

## Scheduler: no añadir este cron a `vercel.json`

La [documentación oficial de Vercel Cron](https://vercel.com/docs/cron-jobs)
indica que invoca el **deployment de Production**, no Preview. Por ello no se
añade ninguna entrada de showcase al `vercel.json` compartido. Las entradas
existentes de notificaciones y mantenimiento no cambian.

El padre debe configurar un scheduler externo autorizado con destino fijo
`https://preview-wellstudio.miguelgarglez.com/api/internal/showcase/refresh`,
después de verificar el alias y deployment. Propuesta: diario a las **03:15 UTC**
(`15 3 * * *`), timeout de 60 segundos, sin redirects, sin ejecuciones solapadas,
con `Authorization: Bearer <CRON_SECRET>` desde el almacén privado del scheduler.
Reintentar una vez ante error transitorio; alertar si no hay un `200` en 24 horas.
No usar este cron para llamar a dispatch de correo ni reconciliar entitlements.

Invocación manual **solo después de la autorización y verificación del padre**,
con `CRON_SECRET` cargado privadamente en el shell; no imprimirlo ni persistirlo:

```bash
curl --fail-with-body --silent --show-error --max-time 60 \
  --header "Authorization: Bearer ${CRON_SECRET:?missing CRON_SECRET}" \
  'https://preview-wellstudio.miguelgarglez.com/api/internal/showcase/refresh'
```

No usar `--location`: un redirect debe revisarse antes de enviar el secreto a
otro destino. El endpoint ignora parámetros de proyecto, email o fecha en la
petición; usa configuración del servidor y hora actual.

## Rollout y monitorización

1. Revisar y fusionar el PR únicamente mediante el flujo autorizado hacia
   `preview`. Confirmar deployment/alias/sandbox y catálogo sin resetearlo.
2. Capturar en el sandbox autorizado los IDs y estados de reservas, membresías,
   cuentas de crédito y ledger que deban conservarse. El padre custodia esa
   evidencia privada; no incluir PII en logs ni en el PR.
3. Configurar las variables Preview y efectuar una llamada autorizada.
   Esperar `200`, `healthy: true`, `futureSessionCount > 0`, y fechas
   `firstSessionStartsAt` / `lastSessionStartsAt` futuras dentro del horizonte.
   La respuesta contiene solo estado, contadores y timestamps.
4. Repetir en el mismo intervalo: `createdCount: 0` y actividad anterior intacta.
   Al avanzar el horizonte, solo se añaden slots nuevos (normalmente seis por
   semana). Confirmar `/classes` sin header E2E: sesiones visibles, sin productos
   `e2e-*`/`admin-playground-*`, y aviso de demo.
5. Activar el scheduler; observar una ejecución real antes de dar por cerrado el
   rollout. Alertar por `503`, agenda vacía, primera clase pasada, última clase
   a menos de siete días o respuesta ausente durante 24 horas.

Respuestas: `503` si falta `CRON_SECRET`; `401` si la autorización no coincide;
`503` si falla el guard/catálogo/DB. Si todos los slots están cancelados y no queda
ninguna sesión pública futura, responde `503` con `healthy: false`; no república
las sesiones canceladas. No tratar cualquier JSON como una ejecución correcta.

Desactivación: parar el scheduler y poner `SHOWCASE_REFRESH_ENABLED=false` en
Preview mediante el flujo del padre. No borrar sesiones ni restaurar un seed.
El histórico crece unos seis slots por semana después del alta inicial (normalmente
doce; hasta trece si el horizonte de 336 horas cruza el cambio de hora); cualquier
archivo/limpieza posterior necesita una decisión
separada que preserve reservas y referencias.

## Regresión local sin credenciales remotas

Dependencias existentes, Node y pnpm del repo. Usar una BD local **nueva y vacía**
llamada `wellstudio_showcase_test` (el test rechaza hosts remotos y no limpia datos):

```bash
docker run --name wellstudio-showcase-test \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=wellstudio_showcase_test \
  -p 127.0.0.1:55433:5432 -d postgres:16-alpine
export DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55433/wellstudio_showcase_test'
export DIRECT_URL="$DATABASE_URL"
export SHOWCASE_TEST_DATABASE_URL="$DATABASE_URL"
pnpm db:generate
pnpm exec prisma db push
pnpm exec vitest run tests/unit/testing tests/unit/public
node --test tests/integration/showcase-refresh.test.mjs
pnpm lint
pnpm typecheck
pnpm build
```

La integración comprueba catálogo ausente, preservación de actividad de un socio
independiente, cancelaciones/reprogramaciones, concurrencia, idempotencia y
rollover real en PostgreSQL. Las unitarias cubren autorización, guard, DST y
disclosure. La prueba de integración es explícita, no parte de `pnpm test:unit`.
La validación remota y de navegador corresponde al padre; no se ejecuta aquí.
