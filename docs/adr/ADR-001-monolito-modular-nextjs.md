# ADR-001: Monolito modular en Next.js

Fecha: 2026-03-13
Estado: accepted

## Contexto

WellStudio V1 necesita:

- web publica
- area privada de socios
- panel interno basico
- reservas
- elegibilidad
- pagos

El proyecto se plantea como producto comercial pequeno, por lo que importa tanto:

- velocidad de desarrollo
- calidad del frontend
- simplicidad operativa
- coste de mantenimiento posterior

Se consideraron tres familias de opcion:

- monolito modular en `Next.js`
- `Next.js` + backend separado tipo `NestJS`
- monolito clasico tipo `Django` o `Laravel`

## Decision

Construir WellStudio V1 como monolito modular en `Next.js`.

## Motivo

- `Next.js` encaja mejor con una experiencia web moderna y cuidada
- el equipo quiere trabajar con `TypeScript + React`
- una sola codebase reduce friccion de arranque
- evita separar frontend y backend antes de que el dominio lo exija
- sigue permitiendo extraer piezas mas adelante si la complejidad crece

## Alternativas consideradas

### Opcion A: Next.js + NestJS

- pros
  - separacion mas fuerte entre UI y backend
  - mas estructura backend desde el inicio
- contras
  - mas complejidad operativa
  - mas piezas desde demasiado pronto
  - mayor coste de mantenimiento inicial

### Opcion B: Django o Laravel monolitico

- pros
  - solucion sobria y muy valida
  - gran velocidad para backoffice y admin
  - menor numero de moving parts
- contras
  - menos alineado con la preferencia del equipo
  - peor encaje para una interfaz web moderna tipo producto si el equipo quiere React

## Consecuencias

- todo el producto vivira inicialmente en una sola aplicacion
- el sistema debera mantener separacion fuerte por modulos internos
- si el dominio crece mas de lo previsto, se evaluara extraer backend separado

## Impacto en implementacion

- `app/` queda reservado a rutas, layouts y UI
- el dominio vive en `modules/*`
- acceso a datos e integraciones se encapsulan
- server actions y route handlers actuan como adaptadores, no como capa de dominio

## Referencias

- [technical-architecture-wellstudio-v1.md](/Users/miguelgarglez/Developer/wellstudio-analysis/technical-architecture-wellstudio-v1.md)
- [wellstudio-execution-rails.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-execution-rails.md)
- `MIG-17`
- `MIG-18`
