# Agentation Local Isolation

Fecha: 2026-04-07  
Estado: active

## Objetivo

Evitar que `Agentation` arrastre estado local entre proyectos distintos durante
desarrollo local, especialmente cuando varias apps usan `localhost` con rutas
similares y el toolbar visual parece mostrar anotaciones que luego el MCP no ve
como `pending`.

## Problema observado

Trabajando con varios proyectos locales a la vez, puede ocurrir este patrón:

- la UI muestra anotaciones o una sesión previa de `Agentation`
- el MCP no devuelve esas anotaciones como pendientes
- parece un problema de sincronización del servidor, pero no lo es

La causa real está en el estado local del navegador.

## Por qué no era un problema del MCP global

Si el MCP estuviera mezclando proyectos, el problema aparecería en la capa
sincronizada que usan las herramientas del agente.

El síntoma observado fue distinto:

- el navegador reconstruía anotaciones visibles
- el MCP no las reconocía como parte de la sesión activa

Eso indica dos fuentes de verdad separadas:

- sesión sincronizada real del MCP
- estado local reconstruido por la librería web de `Agentation`

## Causa técnica

La librería web de `Agentation` persiste estado en `localStorage` con claves
ligadas al `pathname`, por ejemplo:

- `feedback-annotations-${pathname}`
- `agentation-session-${pathname}`
- `agentation-design-${pathname}`
- `agentation-rearrange-${pathname}`
- `agentation-wireframe-${pathname}`

Si otro proyecto reutiliza rutas parecidas, ese estado puede reaparecer aunque la
sesión MCP sea distinta o esté limpia.

## Enfoque aplicado en WellStudio

WellStudio no monta `<Agentation />` directamente.

Usa un bridge cliente en:

- [components/dev/agentation-bridge.tsx](/Users/miguelgarglez/Developer/wellstudio-platform/components/dev/agentation-bridge.tsx)

Y una utilidad pura de aislamiento en:

- [lib/agentation.ts](/Users/miguelgarglez/Developer/wellstudio-platform/lib/agentation.ts)

La estrategia es:

- definir un `project slug` fijo: `wellstudio-platform`
- marcar ownership por página con `agentation-project-owner:${pathname}`
- persistir la sesión propia con:
  - `agentation-project-session:wellstudio-platform:<origin><pathname>`
- limpiar claves legacy si la página actual no estaba marcada como perteneciente a
  este proyecto

## Reglas de funcionamiento

Cuando se carga una ruta:

1. el bridge lee `pathname` y `origin`
2. comprueba la marca `agentation-project-owner:${pathname}`
3. si la página no pertenece a WellStudio:
4. limpia el estado legacy de `Agentation` para ese `pathname`
5. borra la sesión scoped previa de WellStudio para esa página
6. marca la página como propiedad de `wellstudio-platform`
7. si la página ya pertenece a WellStudio, reutiliza solo la sesión scoped propia

Cuando `Agentation` crea una nueva sesión:

- el bridge guarda el `sessionId` en la key scoped del proyecto

## Claves implicadas

### Ownership por página

- `agentation-project-owner:${pathname}`

### Sesión scoped de WellStudio

- `agentation-project-session:wellstudio-platform:${origin}${pathname}`

### Claves legacy que se limpian

- `feedback-annotations-${pathname}`
- `agentation-session-${pathname}`
- `agentation-design-${pathname}`
- `agentation-rearrange-${pathname}`
- `agentation-wireframe-${pathname}`

## Regla de implementación

Si se toca esta integración:

- no renderizar `<Agentation />` directamente en `layout`
- mantener el bridge como punto único de montaje
- mantener la lógica de aislamiento en una utilidad testeable

Esto reduce riesgo y permite validar la lógica sin depender del navegador real.

## Tests

La lógica de aislamiento tiene cobertura unitaria en:

- [tests/unit/lib/agentation.test.ts](/Users/miguelgarglez/Developer/wellstudio-platform/tests/unit/lib/agentation.test.ts)

Los tests cubren:

- limpieza de estado legacy cuando no existe ownership
- limpieza cuando el ownership pertenece a otro proyecto
- reutilización de la sesión scoped cuando la página ya es de WellStudio
- limpieza directa de claves legacy por `pathname`

## Qué revisar si reaparece el problema

- confirmar que `NEXT_PUBLIC_AGENTATION_ENABLED` está activado solo donde toca
- comprobar que el proyecto sigue montando `Agentation` mediante el bridge
- inspeccionar `localStorage` para la ruta afectada
- verificar si existe `agentation-project-owner:${pathname}`
- verificar si existe una sesión scoped de WellStudio con el `origin` correcto
- limpiar manualmente `localStorage` si se está depurando una migración de claves

## Relación con otros documentos

Complementa:

- [README.md](/Users/miguelgarglez/Developer/wellstudio-platform/README.md)
- [agent-browser-sandbox-validation.md](/Users/miguelgarglez/Developer/wellstudio-platform/docs/runbooks/agent-browser-sandbox-validation.md)
