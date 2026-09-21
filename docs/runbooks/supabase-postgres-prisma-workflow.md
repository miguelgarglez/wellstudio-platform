# Supabase Postgres + Prisma Workflow

Fecha: 2026-09-21
Estado: active setup guide

## Idea base

En local vamos a tener dos sistemas distintos trabajando a la vez:

### 1. Supabase sandbox

Sirve para:

- registro
- login
- logout
- sesiones y cookies
- usuarios de auth

Piensa en Supabase como `la puerta de entrada` y tambien como `el hosting de la base de datos`.

### 2. Prisma dentro de la app

Sirve para:

- `User`
- `Member`
- `UserRole`
- reservas
- suscripciones
- pagos
- resto del dominio propio de WellStudio

Piensa en Prisma como `la capa con la que nuestra app trabaja sobre esa base`.

## Qué pasa cuando un usuario inicia sesión

1. el usuario mete email y contraseña
2. Supabase sandbox valida las credenciales
3. la app recibe la sesión autenticada
4. la capa server de WellStudio ejecuta `ensureLocalUser()`
5. si el usuario no existe en la base del proyecto `sandbox`:
   - crea `User`
   - crea `Member`
   - crea rol `MEMBER`
6. si ya existe, lo reconcilia y actualiza

O sea:

- `Supabase` autentica
- `Supabase Postgres` aloja la identidad y el dominio
- `Prisma` materializa y gestiona la identidad del dominio desde el monolito

## Qué significa esto en desarrollo

Aunque el login contra Supabase ya funcione, no podremos validar el provisionado del dominio si la app no tiene `DATABASE_URL` apuntando a la base del proyecto `sandbox`.

Este setup evita forzar Postgres en Docker como camino principal de desarrollo.

## Variables necesarias

En `.env.local`:

```bash
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-[YOUR-REGION].pooler.supabase.com:5432/postgres"
```

La app local seguirá usando también:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Pooler vs conexion directa

Supabase nos da dos formas de entrar a la misma base `Postgres`:

### 1. `DATABASE_URL`

Usa el `pooler`:

- host `*.pooler.supabase.com`
- puerto `6543`
- normalmente con `?pgbouncer=true`

Piensa en esto como `la puerta de acceso para la app`.

Sirve bien para:

- peticiones normales del monolito
- lecturas y escrituras del runtime web
- conexiones mas eficientes y reutilizadas

### 2. `DIRECT_URL`

Usa la conexion directa:

- mismo host base
- puerto `5432`

Piensa en esto como `la puerta de acceso para operaciones de esquema`.

Sirve mejor para:

- `prisma migrate status`
- `prisma migrate deploy`
- migraciones
- operaciones administrativas sobre la estructura de la base

Regla simple:

- `DATABASE_URL` para runtime
- `DIRECT_URL` para cambios de schema

## Flujo recomendado para desarrollo actual

### 1. Confirmar `DATABASE_URL` y `DIRECT_URL`

Asegúrate de que `.env.local` contiene:

```bash
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-[YOUR-REGION].pooler.supabase.com:5432/postgres"
```

La cadena real debe salir del panel `Connect -> ORMs -> Prisma` de `Supabase sandbox`.

En este proyecto:

- `DATABASE_URL` debe ser la variante de `pooler`
- `DIRECT_URL` debe ser la variante directa

### 2. Aplicar el schema actual

Para una base vacía, las migraciones incluyen el baseline inicial. Para una base
existente, completar primero el procedimiento de baselining de este runbook;
añadir el baseline al repositorio no lo marca como aplicado en una DB existente.

```bash
pnpm db:migrate:status
pnpm db:migrate:deploy
```

Si quieres regenerar el cliente Prisma:

```bash
pnpm db:generate
```

### 3. Arrancar la app

```bash
pnpm dev
```

### 4. Ejecutar auth sandbox real

```bash
set -a
source .env.local
source .env.e2e.local
set +a
pnpm test:e2e:auth:sandbox
```

## Qué podremos validar después

Cuando la app local esté conectada correctamente a `Supabase sandbox`, ya podremos cerrar la siguiente capa:

- verificar que el primer login crea `User`
- verificar que crea `Member`
- verificar que crea rol `MEMBER`
- mostrar ese contexto real en `/app`

## Qué no es este setup

No es:

- una base local separada
- una rama local de Postgres
- un sustituto de producción

Es el mismo modelo de datos del producto, pero usando `sandbox` como entorno remoto.

La idea futura es:

- local: `Supabase sandbox`
- producción: `Supabase production`

## RLS y Data API

Las tablas `public` tienen Row Level Security **activado y sin políticas**. La anon key del browser no puede leer ni escribir dominio vía PostgREST. Prisma (`DATABASE_URL`) sigue operando con normalidad.

Tras añadir una tabla Prisma nueva, incluir `ALTER TABLE "…" ENABLE ROW LEVEL SECURITY;` en la misma migración. No crear políticas `auth.uid()` salvo decisión explícita de usar la Data API.

## Bootstrap de production

Cuando levantamos `production` por primera vez puede pasar esto:

- `Supabase Auth` ya funciona
- pero la base `Postgres` aun no tiene las tablas Prisma

El sintoma tipico es:

- el login entra bien
- `/app` falla al intentar leer `User`, `Member` o `UserRole`
- Prisma devuelve errores tipo `The table public.User does not exist`

En una base vacía, usar toda la cadena versionada:

```bash
DIRECT_URL="postgresql://..." DATABASE_URL="postgresql://..." pnpm db:migrate:deploy
```

En la practica, la operacion de schema debe hacerse contra la conexion directa de `5432`.
No usar `db push`: no instala los índices parciales de reservas/waitlist ni la
activación RLS definida en SQL. Este runbook no autoriza ejecutar cambios remotos;
el propietario del entorno debe revisar y aprobar cada rollout.

## Politica Prisma de WellStudio

### Regla actual

WellStudio ya tiene migraciones versionadas en `prisma/migrations`.

La regla operativa queda:

- `db push` no es un bootstrap válido para este dominio; usar la cadena de migraciones
- `migrate dev` para crear migraciones versionadas durante desarrollo
- `migrate deploy` para aplicar migraciones versionadas en bases compartidas o remotas
- `db execute` solo para baseline o break-glass documentado, nunca como camino normal

Flujo normal:

1. cambiar `schema.prisma`
2. ejecutar `pnpm prisma migrate dev` en local
3. commitear la migracion generada
4. comprobar el estado con `pnpm db:migrate:status`
5. aplicar en entornos remotos con `pnpm db:migrate:deploy`

### Baseline de una DB existente

Si una DB ya tiene schema aplicado manualmente pero no tiene `_prisma_migrations`, no se debe ejecutar `migrate deploy` a ciegas.

#### Procedencia y orden

El baseline `20260313190000_mig39_initial_schema` se generó con Prisma **7.5.0**
desde `prisma/schema.prisma` del commit
`c6618a1d534d084e89634b40c233d8a7aa247e4c` (MIG-39), anterior a MIG-78.
No es un diff desde el schema actual ni una reescritura del primer SQL aplicado.
Para reproducirlo en una copia local con historial Git completo:

```bash
mkdir -p "$HOME/wellstudio-baseline"
git show c6618a1d534d084e89634b40c233d8a7aa247e4c:prisma/schema.prisma \
  > "$HOME/wellstudio-baseline/schema.prisma"
# DATABASE_URL y DIRECT_URL deben apuntar al PostgreSQL local desechable.
pnpm exec prisma migrate diff --from-empty \
  --to-schema "$HOME/wellstudio-baseline/schema.prisma" --script \
  --output "$HOME/wellstudio-baseline/migration.sql"
cmp "$HOME/wellstudio-baseline/migration.sql" \
  prisma/migrations/20260313190000_mig39_initial_schema/migration.sql
```

Orden para una DB vacía:

1. `20260313190000_mig39_initial_schema`
2. `20260403183000_mig78_reservation_constraints`
3. `20260416190000_mig81_membership_booking_policies`
4. `20260506190000_mig64_public_leads`
5. `20260807120000_mig105_lead_activities`
6. `20260808010000_mig121_notification_outbox`
7. `20260808013000_mig122_waitlist_promotion_notification`
8. `20260808020000_mig124_session_change_notifications`
9. `20260808030000_mig125_credit_pack_checkout`
10. `20260809133000_mig128_purchase_confirmation`
11. `20260809140000_mig129_reservation_reminders`
12. `20260809194500_mig133_card_setup`
13. `20260814181500_enable_rls_deny_postgrest`
14. `20260921120000_mig78_repeatable_reservation_history`
15. `20260921121000_mig81_booking_override_index_name`

Las doce migraciones anteriores conservan su SQL y checksum. La penúltima
elimina únicamente los dos índices únicos globales por estado; conserva
`reservation_member_session_booked_unique` (`BOOKED`) y
`waitlist_member_session_active_unique` (`WAITING`, `NOTIFIED`) de MIG-78.
Los estados históricos pueden repetirse sin borrar reservas, consumos ni jobs.
La última renombra un índice de MIG-81 cuyo nombre PostgreSQL truncaba a 63 bytes,
para que coincida con el nombre generado por Prisma; no cambia sus columnas.

#### DB existente con las doce migraciones antiguas aplicadas

1. El propietario obtiene un backup y ensaya en una copia aislada. Inspeccionar
   `_prisma_migrations` (nombres, checksums, `finished_at`, `rolled_back_at`, logs),
   tablas, columnas, enums, FKs, índices y RLS. Comparar contra una reconstrucción
   local del estado anterior, incluyendo las migraciones posteriores al baseline.
   `migrate status` no prueba ausencia de drift.
2. Confirmar que el baseline está representado por ese schema evolucionado y que
   los doce registros antiguos no tienen fallos ni SQL modificado. **No ejecutar
   el DDL del baseline sobre tablas existentes.**
3. Tras la revisión, registrar solamente el baseline como ya aplicado:

   ```bash
   pnpm exec prisma migrate resolve --applied 20260313190000_mig39_initial_schema
   pnpm db:migrate:status
   ```

4. Confirmar que los únicos pendientes son las dos migraciones de septiembre.
   Revisar índices activos válidos y únicos antes de eliminar los globales:

   ```sql
   SELECT c.relname, i.indisunique, i.indisvalid, pg_get_indexdef(i.indexrelid)
   FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
   WHERE c.relname IN (
     'reservation_member_session_booked_unique',
     'waitlist_member_session_active_unique',
     'reservation_member_session_status_unique',
     'waitlist_member_session_status_unique',
     'MemberMembershipBookingOverride_memberMembershipId_overrideTyp_',
     'MemberMembershipBookingOverride_memberMembershipId_override_idx'
   );
   SELECT "memberId", "classSessionId", count(*) FROM "Reservation"
   WHERE status = 'BOOKED' GROUP BY 1, 2 HAVING count(*) > 1;
   SELECT "memberId", "classSessionId", count(*) FROM "WaitlistEntry"
   WHERE status IN ('WAITING', 'NOTIFIED') GROUP BY 1, 2 HAVING count(*) > 1;
   ```

   Verificar las columnas y predicados completos, no solo el nombre del índice.
   Si faltan índices parciales o hay duplicados, detener el rollout y reconciliar
   el drift con una migración revisada; no eliminar históricos para desbloquearlo.
5. En la ventana aprobada, ejecutar `pnpm db:migrate:deploy` y
   `pnpm db:migrate:status`. Regenerar el cliente con `pnpm db:generate`.
   Verificar los índices parciales, el nombre del índice MIG-81, RLS y los conteos
   de filas; repetir la regresión en una copia, nunca con fixtures sobre la DB real.

#### DB existente sin `_prisma_migrations` o con bootstrap por `db push`

No basta con marcar el baseline y desplegar: también pueden existir físicamente
objetos de migraciones posteriores. Construir un inventario por migración y
compararlo con una DB local creada desde la cadena versionada. Prisma diff
complementa esta revisión, pero no representa los predicados parciales ni RLS.
Para cada migración cuyo resultado ya esté presente, usar
`prisma migrate resolve --applied <nombre>` **solo tras verificarlo**. Registrar
el baseline primero y después las migraciones representadas en orden.

Las migraciones parcialmente representadas requieren reconciliación específica,
ensayada y revisada; no ejecutar sus `CREATE TYPE`, `CREATE TABLE` o `ADD COLUMN`
a ciegas. Un bootstrap actual por `db push` puede tener ya el nombre final del
índice MIG-81 pero carecer de los índices parciales y de RLS. Verificar también
los efectos de datos (`UPDATE`/backfills), no solo la estructura. No hay un bucle
seguro que marque todo como aplicado sin esta inspección.

Si existe un intento fallido del antiguo primer `migrate deploy` en una base vacía,
examinar los logs y cualquier DDL parcial antes de `migrate resolve --rolled-back`.
Solo después de confirmar que el intento no dejó objetos se puede reintentar con
el baseline. En bases compartidas, no borrar el historial ni usar `migrate reset`.

No hacer:

- `migrate reset`
- borrar o recrear la DB compartida
- marcar una migracion como aplicada si el schema real no coincide
- repetir DDL manualmente sin comprobar duplicados y constraints

#### Caveats de rollout

- `DROP INDEX` y `ALTER INDEX` toman locks; ensayar con el volumen real, fijar una
  ventana de mantenimiento y límites operativos de espera. No se midió su duración
  en producción ni en sandbox.
- Los índices parciales SQL son la fuente de verdad para unicidad activa; no
  reemplazarlos por `@@unique([memberId, classSessionId, status])` ni confiar en
  `db push` para reconstruir una DB.
- Una vez existan históricos repetidos, recrear los índices globales como rollback
  fallará. Preferir reparación hacia delante; no borrar filas de auditoría.
- La prueba local valida PostgreSQL y los servicios reales, no permisos/roles de
  Supabase, RLS vía PostgREST, auth, proveedores de correo ni Stripe.

## Regresión PostgreSQL aislada y contrato CI

Se usan únicamente `vitest`, `pg`, Prisma y sus dependencias ya presentes.
No hace falta `psql`, Supabase CLI, Playwright, `db push`, `pnpm add` ni un servidor
Next.js. Instalar primero con `pnpm install --frozen-lockfile`.
El global setup genera el cliente Prisma; no se llama a proveedores externos.

PostgreSQL **17.6** es la versión validada. Ejemplo de servicio local desechable:

```bash
docker run --detach --name wellstudio-integration-postgres \
  --publish 127.0.0.1:55432:5432 \
  --env POSTGRES_USER=wellstudio \
  --env POSTGRES_PASSWORD=wellstudio \
  --env POSTGRES_DB=wellstudio_integration postgres:17.6
docker exec wellstudio-integration-postgres pg_isready -U wellstudio
```

Comando exacto desde la raíz del repo:

```bash
INTEGRATION_DATABASE_URL=postgresql://wellstudio:wellstudio@127.0.0.1:55432/wellstudio_integration \
  pnpm exec vitest run --config vitest.integration.config.ts
```

Contrato para el agente CI:

- `INTEGRATION_DATABASE_URL` obligatorio; PostgreSQL escuchando antes de ejecutar.
  Host permitido: `127.0.0.1`, `localhost` o `[::1]`; DB exactamente
  `wellstudio_integration`; sin query string ni fragmento. Publicar el puerto del
  servicio de CI en loopback. No usar URLs del sandbox/producción ni túneles hacia ellos.
- El rol local necesita `LOGIN`, `CREATEDB` y ser propietario de las DB creadas.
  La imagen anterior crea un rol superusuario local. Las conexiones del test usan
  el mismo rol, por lo que pueden consultar sus propios locks en `pg_stat_activity`.
- La suite sobrescribe `DATABASE_URL` y `DIRECT_URL` para los workers y cada CLI.
  No toma URLs de `.env`, `.env.local` ni del ambiente del runtime como fallback.
  No necesita claves Supabase, Stripe, Resend ni credenciales remotas.
- Cada ejecución crea DB con sufijo UUID bajo `wellstudio_integration_`, prueba en
  ellas y las elimina al terminar. No borra ni migra la DB administrativa.
  Archivos temporales de configuración van a `test-results/` y se limpian.
  Una interrupción forzada puede dejar DB locales huérfanas: revisar sus nombres
  y propietario antes de eliminarlas; no usar limpieza por prefijo en un servidor compartido.
- `INTEGRATION_SCHEMA` debe omitirse (default `migrated`) en el gate normal.
  Para demostrar el fallo histórico, el siguiente comando ejecuta **las mismas
  aserciones** sin las correcciones de septiembre y debe terminar con código 1:

  ```bash
  INTEGRATION_SCHEMA=legacy \
  INTEGRATION_DATABASE_URL=postgresql://wellstudio:wellstudio@127.0.0.1:55432/wellstudio_integration \
    pnpm exec vitest run --config vitest.integration.config.ts \
    tests/integration/reservation-history.test.ts
  ```

La suite normal comprueba el fallo original `P3018 / 42P01`, despliegue vacío,
redeploy sin cambios, baselining/upgrade conservando checksums y filas, ausencia
de drift Prisma y RLS activado. Los servicios prueban tres ciclos con historial,
ledger y outbox conservados, duplicados activos, estados terminales y dos reservas
realmente solapadas para la última plaza (locks observados antes de liberarlas).
Los jobs permanecen pendientes: no se entregan emails.

## Docker a partir de ahora

Docker deja de ser obligatorio para la base de datos en desarrollo.

Podrá seguir teniendo valor para:

- ejecutar las regresiones de DB aisladas descritas arriba
- empaquetar la app
- probar la imagen final
- desplegar la app en VPS

Pero no es requisito para tener la base operativa en local.
