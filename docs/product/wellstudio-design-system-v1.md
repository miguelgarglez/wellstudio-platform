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
