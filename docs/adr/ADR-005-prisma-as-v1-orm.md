# ADR-005: Prisma como ORM para WellStudio V1

Fecha: 2026-03-13
Estado: accepted

## Contexto

WellStudio V1 necesita un acceso a datos que permita:

- avanzar rapido con un equipo pequeno
- mantener claridad sobre el schema
- trabajar bien con `TypeScript`
- iterar el dominio mientras aun se esta cerrando
- cubrir un modelo relacional con reservas, pagos, membresias y creditos

Las opciones principales consideradas fueron:

- `Prisma`
- `Drizzle`
- SQL mas manual con librerias ligeras

## Decision

Usar `Prisma` como ORM principal en WellStudio V1.

## Motivo

- mejor equilibrio entre productividad y claridad para esta fase
- schema legible y facil de revisar
- buen tipado para `TypeScript`
- buen encaje con `Next.js`
- migraciones y modelado comodos para un dominio que aun esta evolucionando

## Alternativas consideradas

### Opcion A: Drizzle

- pros
  - mayor cercania a SQL
  - mas control fino
- contras
  - menos conveniente para este momento del proyecto
  - menor ventaja si la prioridad es velocidad de equipo y claridad de schema

### Opcion B: SQL manual o librerias minimas

- pros
  - control maximo
  - menos abstraccion
- contras
  - mayor coste de implementacion
  - peor velocidad para una V1 con mucho dominio por cerrar

## Consecuencias

- el schema inicial se expresara en Prisma
- las migraciones iniciales usaran el flujo de Prisma
- consultas especialmente delicadas podran usar SQL puntual si compensa
- no se debe mezclar acceso Prisma directamente en componentes UI

## Impacto en implementacion

- cliente Prisma centralizado
- repositorios o data access por modulo
- transacciones explicitas en reservas, creditos y pagos
- indices y constraints pensados desde el schema y revisados en SQL cuando haga falta

## Regla practica

Usar `Prisma` para el acceso general a datos.

Usar SQL puntual cuando:

- una consulta compleja lo pida
- una operacion concurrente necesite control fino
- un constraint o indice se exprese mejor fuera del happy path del ORM

## Referencias

- [technical-architecture-wellstudio-v1.md](/Users/miguelgarglez/Developer/wellstudio-analysis/technical-architecture-wellstudio-v1.md)
- [wellstudio-data-model-v1.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-data-model-v1.md)
- `MIG-20`

## Carga de relaciones — 2026-09-21

Se habilita `relationJoins` en el generador Prisma. En PostgreSQL, la estrategia
por defecto pasa a cargar relaciones con `LATERAL JOIN` y agregación JSON en una
consulta, en lugar de enviar una consulta por tabla y ensamblar el resultado en
la aplicación. Sigue siendo una función Preview de Prisma; no añade dependencias
ni modifica el esquema físico de la base.

Motivo: en el sandbox, cancelar con promoción agotó la transacción de 5 segundos
antes de encolar la notificación. La regresión PostgreSQL reproducía 58 consultas
para cancelar con devolución de crédito y promoción, y 27 para recargar Reservas.
La latencia de red se acumulaba dentro de la transacción y durante la
revalidación de la Server Action.

Los tests de integración conservan las invariantes de reserva, crédito, outbox y
promoción y limitan esas operaciones a 35 y 8 consultas respectivamente. Estos
presupuestos detectan regresiones de round trips; no sustituyen las mediciones
en navegador contra el sandbox. No se amplían el timeout transaccional ni las
aserciones E2E. La atomicidad, el aislamiento serializable y los reintentos
existentes se mantienen.

El cambio afecta a las lecturas relacionales de todo el cliente: requiere el
gate foundation, integración PostgreSQL y los recorridos de auth/reservas.
Si una consulta concreta necesita la estrategia anterior tras medirla, puede
usar `relationLoadStrategy: 'query'` de forma explícita. No desactivar los joins
globalmente sin repetir los presupuestos y la validación de latencia.

Referencia: [Prisma relation load strategies](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries#relation-load-strategies-preview).

La recarga del panel ejecuta sus lecturas independientes con `Promise.all`:
el `$transaction` de lectura anterior usaba `ReadCommitted`, que ya permite
snapshots distintos entre sentencias, y serializaba los viajes de red. No cambia
el aislamiento serializable de las mutaciones. Dentro de una promoción se carga
la sesión una vez y se descuentan las plazas ocupadas en esa misma transacción;
un conflicto concurrente sigue reintentando la transacción completa.
