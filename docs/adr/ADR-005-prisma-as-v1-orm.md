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
