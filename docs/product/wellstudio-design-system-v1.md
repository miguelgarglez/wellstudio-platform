# WellStudio Design System V1

Fecha: 2026-03-13
Estado: working baseline

## Objetivo

Definir una direccion visual clara para WellStudio V1 antes de construir login, registro y la futura experiencia de socios.

La referencia no es copiar la web actual pixel a pixel.
La referencia es conservar su identidad boutique y llevarla a un producto mas limpio, mas consistente y mas usable.

## Lectura de marca

WellStudio se percibe como:

- gym boutique de entrenamiento personal
- trato cercano y premium
- foco en fuerza, seguimiento y grupos reducidos
- imagen sobria, directa y nada estridente

La web actual transmite varias pistas utiles:

- fondo negro muy dominante en cabecera
- azul marca reconocible y repetido en logo, botones y fondos
- superficies blancas o gris muy claro
- tipografia de titulares muy condensada y fuerte
- tipografia de lectura limpia y amable
- mezcla de sensacion premium con un punto accesible y cercano

## Principios visuales

- negro y azul como espina dorsal de marca
- superficies claras para formularios y zonas de lectura
- contraste alto en headers y CTAs
- sensacion de estudio serio, no de startup generica
- tono premium sin parecer lujo frio
- composicion sobria con bloques grandes y jerarquia fuerte

## Paleta base

### Core brand

- `brand-950`: `#0f1012`
  - negro principal de cabeceras y fondos dramaticos
- `brand-900`: `#16181b`
  - variacion para paneles oscuros
- `brand-700`: `#2f4b67`
  - azul pizarra para fondos amplios y secciones
- `brand-500`: `#4f89c5`
  - azul principal de marca, inspirado en el logo actual
- `brand-300`: `#b7cee7`
  - azul suave para fondos secundarios y estados suaves

### Neutrals

- `sand-50`: `#f7f5f1`
  - fondo general claro
- `sand-100`: `#f1ede7`
  - secciones suaves
- `stone-200`: `#ddd7cf`
  - bordes suaves
- `stone-500`: `#7b766e`
  - texto secundario
- `ink-900`: `#181716`
  - texto principal

### Utility

- `success-400`: `#7fd6a3`
  - exito amable, no saturado
- `warning-400`: `#e8b663`
  - alerta moderada
- `danger-500`: `#ca5c54`
  - error visible

## Uso de color

- cabeceras y hero blocks:
  - fondo negro o azul pizarra
  - texto blanco o azul muy claro
- formularios:
  - fondo claro
  - bordes suaves
  - foco en azul marca
- CTAs principales:
  - azul marca sobre fondo claro
- CTAs secundarios:
  - outline oscuro o fondo blanco con borde
- admin:
  - misma familia visual, pero con menos dramatismo y mas sobriedad funcional

## Tipografia

## Direccion

- `display`: tipografia condensada, fuerte y editorial
- `body`: grotesk limpia, moderna y muy legible

## Recomendacion

- display:
  - `Barlow Condensed`
  - alternativa: `Oswald`
- body:
  - `Manrope`
  - alternativa: `Inter` solo si hace falta pragmatismo

## Regla

- usar display solo para titulares, hero y labels muy marcadas
- usar body para formularios, tablas, copy y app privada

## Escala tipografica orientativa

- `display-xl`: hero principal
- `display-lg`: titulos de seccion
- `heading-lg`: pantallas de auth y panel
- `heading-md`: cards y bloques
- `body-lg`: copy principal
- `body-md`: lectura base
- `body-sm`: ayudas y meta

## Forma y layout

- radios amplios pero no excesivos
- cards y paneles con bordes muy suaves
- mucho aire entre bloques
- composiciones asimetricas aceptadas en marketing
- composiciones mas estrictas en member app y admin

## Tokens de forma

- `radius-sm`: `10px`
- `radius-md`: `16px`
- `radius-lg`: `24px`
- `radius-pill`: `999px`

## Sombras

- usar sombras suaves y grandes
- evitar sombras oscuras agresivas
- prioridad a profundidad elegante, no a efecto flotante exagerado

## Componentes base

## Button

- `primary`
  - azul marca
  - texto oscuro o blanco segun contraste final
- `secondary`
  - fondo blanco o arena con borde
- `ghost`
  - texto oscuro, sin masa visual fuerte

El boton principal debe sentirse premium y estable, no hiper-redondeado tipo SaaS juvenil.

## Input

- alto generoso
- borde fino y suave
- fondo claro
- focus ring azul marca
- texto oscuro y placeholder sobrio

## Card

- fondo claro o blanco roto
- radio amplio
- borde casi imperceptible
- sombra suave

## Navigation

- header oscuro
- links limpios y espaciados
- subrayado o estado activo discreto
- logo muy presente, como en la web actual

## Auth surfaces

Login y registro no deben parecer una landing genérica.

Deben sentirse:

- sobrios
- premium
- muy claros
- con un bloque visual fuerte
- con continuidad respecto a la web publica

Direccion recomendada:

- layout en dos columnas en desktop
- lado izquierdo con bloque de marca y mensaje
- lado derecho con card de formulario
- en mobile, stack limpio con jerarquia fuerte

## Member app

La zona privada actual es muy blanca y funcional.
Eso no esta mal como base, pero hay que mejorar:

- jerarquia
- estados
- espaciado
- navegacion
- consistencia

Direccion:

- shell claro
- header o top bar con ancla visual de marca
- tabs o secciones limpias
- cards informativas con mas orden

## Admin

No debe compartir toda la teatralidad de marketing.

Direccion:

- misma paleta
- mas neutros
- mas densidad controlada
- menos bloques hero
- prioridad a claridad operativa

Regla de producto:

- admin no es un portal de consumo, es una herramienta de operacion
- la configuracion ocasional que alimenta una operativa debe vivir como subruta contextual, no competir siempre en la navegacion principal; por ejemplo, el catalogo de tipos de clase y coaches se abre desde Agenda
- los formularios de alta y edicion de catalogos admin deben usar overlays focalizados; la lista principal conserva contexto y densidad, mientras la `Sheet` evita formularios permanentes y layout shifts
- archivar recursos con historico es una accion reversible y no destructiva; la UI debe explicar dependencias futuras que bloqueen la operacion antes de pedir confirmacion
- en desktop debe aprovechar el ancho disponible para listas, contexto y detalle accionable
- evitar heroes editoriales grandes en admin; usar toolbars compactas con contexto util
- nombrar superficies admin por la accion real que habilitan, no por conceptos tecnicos internos; por ejemplo "Reglas" / "Reglas de reserva" para la configuracion de booking policy por plan
- reservar nombres amplios como "Gestion de planes" para superficies que realmente permitan gestionar el plan completo: precio, estado, descripcion, visibilidad y reglas
- no introducir dashboards de bienvenida sin senales accionables; una home admin solo compensa si ayuda a decidir que atender hoy
- preferir patrones de workbench: rail de busqueda/lista, panel de detalle y acciones contextuales cerca del objeto seleccionado
- el dossier operativo de un socio debe ordenar primero identidad y acceso, despues cobertura comercial y por ultimo actividad e historico; no presentar todos los datos con el mismo peso visual
- una vista agregada read-only debe enlazar a la superficie que gobierna cada accion en vez de duplicar formularios o reglas de dominio dentro del detalle
- evitar rails largos con scroll propio si el contenido principal ya hace scroll; los formularios y selecciones largas deben pasar a `Dialog`, `Sheet` o una superficie dedicada
- en mobile/tablet, los workbenches admin no deben apilar lista y detalle obligando a scrollear para operar; el detalle seleccionado debe poder abrirse como `Sheet` contextual y cerrarse volviendo al listado
- los placeholders de detalle sin seleccion son aceptables en desktop como ayuda del panel derecho; en mobile/tablet deben ocultarse para que la lista sea la superficie base hasta que el usuario seleccione un item
- usar cards solo cuando la card sea la unidad de interaccion; si solo agrupa informacion, preferir filas, secciones y divisores
- mantener URL como fuente de verdad para contexto durable y reload-safe: rutas principales, filtros/busqueda y seleccion del objeto principal de una workspace
- mantener en estado local la interaccion efimera: apertura de sheets/dialogs, tabs internas, seleccion temporal de formulario y pasos dentro de una operacion
- las listas admin pueden tener defaults seguros cuando evitan pantallas vacias; deben estar acotadas, explicar su criterio y no presentarse como exhaustivas
- la busqueda admin puede seguir siendo submit-based cuando el estado server-side y la URL aportan mas robustez que una busqueda incremental
- en una bandeja operativa, mostrar como maximo las acciones primarias necesarias en el detalle; formularios de notas o cambios de estado deben abrirse en `Dialog` enfocados para reducir carga visual
- las operaciones comerciales de socio se abren en `Dialog` enfocados con objeto, consecuencia y motivo visibles; en mobile ocupan el viewport completo para no superponer controles de una `Sheet` padre
- si un dialogo operativo supera la altura disponible, solo su cuerpo hace scroll y el footer con cancelar/confirmar permanece visible
- los historiales auditables se presentan como timeline escaneable, ordenado de mas reciente a mas antiguo, con actor, fecha y contexto; la paginacion por cursor se revela bajo demanda
- las agendas operativas se agrupan por dia y usan filas compactas; el horario, estado y ocupacion deben poder compararse sin abrir el detalle
- crear o editar una sesion ocurre en una `Sheet` dedicada: la lista conserva contexto y el formulario no domina la superficie base
- los cambios reversibles de disponibilidad (`cerrar` / `reabrir`) pueden ser acciones directas; cancelar una sesion exige razon visible y confirma sus efectos sobre reservas y waitlist
- el roster de una sesion usa filas compactas con identidad, estado y tres resultados excluyentes: pendiente, asistio o no vino; el estado activo debe reconocerse sin depender solo del color
- la accion de completar una sesion permanece junto al resumen de asistencia y explica por que esta bloqueada cuando quedan pendientes
- member app puede ser mas guiada, espaciosa y editorial; admin debe ser mas denso, escaneable y accionable
- no reutilizar layouts de member en admin salvo componentes atomicos compartidos como botones, inputs, badges o tokens de marca

## Motion

- usar animaciones cortas y funcionales
- evitar microanimaciones excesivas
- transiciones suaves en tabs, modales y auth
- page transitions muy sutiles

## Lo que NO debemos hacer

- no usar un look SaaS violeta genérico
- no usar un dark mode artificial porque si
- no mezclar demasiados acentos de color
- no copiar la web actual tal cual
- no convertir la app en una landing pesada

## Decision de implementacion

- la identidad de WellStudio vive en tokens y componentes
- `Base UI` o `Radix` son solo primitivas
- Añadir componentes shadcn/Base UI nuevos es adecuado en cualquier superficie del producto cuando el patron mejora claridad, foco, accesibilidad o velocidad de uso, y no existe ya un componente equivalente en `components/ui`.
- Antes de crear UI ad hoc, comprobar si el patron existe o puede entrar como primitiva compartida: `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tabs`, `Table`, `Command`, `Tooltip`, etc.
- En admin, los overlays no son un lujo visual: son una herramienta de foco. Tambien pueden ser correctos en member o public cuando reduzcan carga cognitiva o expliquen una accion sin llenar la pagina.
- Criterio para overlays:
  - `Dialog`: acciones enfocadas con formulario corto o confirmacion no destructiva donde conviene bloquear el resto de la pantalla.
  - `Sheet`: panel lateral para detalle secundario, historial amplio o edicion que se beneficia de conservar contexto visible.
  - `Popover` / menus contextuales: informacion auxiliar o acciones de fila; no deben contener flujos largos.
  - `AlertDialog`: acciones destructivas o revocaciones auditables.
- Al añadir componentes shadcn, preferir `dry-run --diff` antes de aplicar. Si el CLI intenta sobrescribir componentes base ya personalizados, copiar/adaptar solo el componente nuevo y no pisar tokens ni variantes existentes. Si el CLI requiere instalar dependencias nuevas, avisar y pedir confirmacion antes.
- la eleccion de primitive library no cambia la direccion visual

## Aplicacion inmediata

Antes de construir auth UI:

1. trasladar estos tokens a `globals.css`
2. definir tipografia base
3. crear componentes base:
   - button
   - input
   - label
   - card
4. construir `login` y `register` con esa capa
