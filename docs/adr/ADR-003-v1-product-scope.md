# ADR-003: Decisiones funcionales base de WellStudio V1

Fecha: 2026-03-13
Estado: accepted

## Contexto

Antes de implementar schema y reglas de negocio, era necesario cerrar:

- si vender membresias, creditos o ambos
- cuando consumir credito
- politica de devolucion por cancelacion
- si coaches necesitan login
- si leads y agreements entran en MVP

## Decision

Las decisiones de base para V1 son:

- soportar membresias y creditos en dominio
- priorizar membresias como producto comercial principal
- consumir creditos al reservar
- devolver credito solo si se cancela con al menos `120 minutos` de antelacion
- no dar login a coaches por defecto en V1
- incluir `leads` en MVP
- dejar `agreements` fuera del MVP salvo necesidad legal confirmada

## Motivo

- reduce complejidad sin cerrar el camino de evolucion
- encaja con lo observado en el sistema actual
- mantiene una UX mas simple para lanzamiento
- protege aforo y operativa de reservas

## Alternativas consideradas

### Opcion A: solo membresias

- pros
  - menor complejidad inicial
- contras
  - reduce flexibilidad comercial
  - obliga a remodelar dominio si luego entran bonos

### Opcion B: consumo al asistir

- pros
  - menos friccion para el usuario
- contras
  - peor control de aforo
  - incentiva reservas especulativas
  - complica operativa

### Opcion C: coaches con login desde V1

- pros
  - abre camino a portal de coach
- contras
  - aumenta complejidad de roles y soporte
  - no parece requisito base del MVP

## Consecuencias

- el modelo de datos incluye productos y entitlements desde el inicio
- cancelaciones y creditos deben dejar rastro auditable
- la primera version del panel interno se centra en staff/admin

## Impacto en implementacion

- afecta schema de membresias, creditos, reservas y waitlist
- afecta reglas de elegibilidad
- afecta politica de cancelacion
- afecta alcance de admin y member app

## Referencias

- [wellstudio-v1-product-decisions.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-v1-product-decisions.md)
- [wellstudio-data-model-v1.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-data-model-v1.md)
- `MIG-23`
- `MIG-25`
- `MIG-27`
