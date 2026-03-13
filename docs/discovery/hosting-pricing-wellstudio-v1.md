# Hosting y Pricing para WellStudio V1

Fecha de revision: 2026-03-13

## Objetivo

Estimar opciones de hosting e infraestructura para WellStudio V1 con foco en:

- coste mensual inicial
- posibilidad de arrancar casi sin coste
- encaje con la arquitectura propuesta
- riesgo operativo razonable para un producto comercial

## Supuestos de escala inicial

Escala objetivo para la primera version:

- 1 centro
- 300 a 800 usuarios registrados
- 100 a 300 MAU
- 5 a 15 usuarios internos
- 10 a 30 usuarios concurrentes en picos

Notas:

- estos calculos excluyen SMS, costes de pagos por transaccion y costes de auth managed
- los rangos son orientativos y dependen de trafico real, volumen de emails, logs y entornos extra
- para produccion comercial no conviene depender indefinidamente de tiers gratis

## Resumen Ejecutivo

Si el objetivo es minimizar coste total y complejidad:

- `Cloudflare + Supabase` es la opcion mas barata, pero encaja peor con el backend recomendado si mantenemos `NestJS`
- `Vercel + Supabase` es muy comoda para un MVP rapido, pero empuja a meter mas logica en `Next.js`
- `Vercel + Railway` encaja mejor con la arquitectura recomendada `Next.js + NestJS + Postgres + Redis`

Recomendacion actual:

- para discovery o demo: `Cloudflare Pages Free` o `Vercel Hobby` + servicios free
- para produccion V1 seria: `Vercel + Railway`

## Soluciones con posibilidad de coste cero

Si, existen combinaciones que pueden funcionar sin coste para prototipo o discovery:

- `Cloudflare Pages Free`
- `Cloudflare Workers Free`
- `Vercel Hobby`
- `Supabase Free`
- `Upstash Free`

Pero hay matices importantes:

- `Vercel Hobby` es util para discovery y prototipos, pero no deberia ser la base asumida para una produccion comercial
- los free tiers son validos para pruebas, demos o staging ligero
- en una app comercial con reservas, pagos y datos personales conviene asumir un minimo gasto recurrente

## Comparativa de 3 arquitecturas low-cost

| Opcion | Stack de despliegue | Prototipo / discovery | Produccion lean | Encaje con arquitectura V1 | Comentario |
| --- | --- | --- | --- | --- | --- |
| A | Cloudflare Pages + Workers + Supabase | `0 a 5 USD/mes` | `25 a 40 USD/mes` | Medio | Muy barata, pero menos natural si mantenemos `NestJS` |
| B | Vercel + Supabase | `0 a 25 USD/mes` | `45 a 65 USD/mes` | Medio | Muy comoda para `Next.js`, pero empuja a simplificar o absorber backend en la app |
| C | Vercel + Railway | `5 a 20 USD/mes` | `25 a 60 USD/mes` | Alto | La mejor alineacion con `Next.js + NestJS + Postgres + Redis` |

## Opcion A: Cloudflare + Supabase

Composicion:

- frontend marketing y app web: `Cloudflare Pages`
- edge API o funciones: `Cloudflare Workers`
- base de datos y opcionalmente auth/storage: `Supabase`
- cache o cola ligera opcional: `Upstash`

Coste estimado:

- discovery: `0 USD/mes`
- produccion lean: `30 USD/mes` aprox

Desglose de referencia:

- `Cloudflare Pages Free`: `0 USD/mes`
- `Cloudflare Workers Paid`: `5 USD/mes`
- `Supabase Pro`: `25 USD/mes`
- `Upstash`: `0 a 10 USD/mes` segun uso

Ventajas:

- coste fijo muy bajo
- CDN global y excelente rendimiento estatico
- buena opcion si se desea aproximacion edge-first

Contras:

- peor encaje con un monolito modular `NestJS`
- mas decisiones de adaptacion si quieres mantener backend tradicional
- aumenta el riesgo de dispersar logica entre frontend, edge y servicios externos

Cuando la elegiria:

- si decidis simplificar backend en V1
- si el objetivo principal es lanzar muy barato
- si aceptais una arquitectura mas serverless / edge

## Opcion B: Vercel + Supabase

Composicion:

- frontend y app web: `Vercel`
- base de datos y opcionalmente auth/storage: `Supabase`
- backend: rutas de `Next.js`, BFF o una capa ligera adicional

Coste estimado:

- discovery: `0 USD/mes` con restricciones
- produccion lean: `45 USD/mes` aprox

Desglose de referencia:

- `Vercel Hobby`: `0 USD/mes`, util para discovery o demos
- `Vercel Pro`: `20 USD/mes` por miembro
- `Supabase Pro`: `25 USD/mes`

Ventajas:

- DX muy buena para `Next.js`
- despliegue muy comodo
- stack muy popular para MVP web

Contras:

- si el backend acaba siendo complejo, la capa de API puede quedarse corta dentro de `Next.js`
- si ademas mantienes `NestJS`, el coste sube y deja de ser una opcion tan compacta
- con varios miembros del equipo, `Vercel Pro` crece por asiento

Cuando la elegiria:

- si quereis moveros rapido con una V1 muy web-centric
- si el backend de dominio se mantiene relativamente contenido

## Opcion C: Vercel + Railway

Composicion:

- frontend marketing y app web: `Vercel`
- backend de dominio: `NestJS` en `Railway`
- PostgreSQL y Redis: `Railway`

Coste estimado:

- discovery: `5 a 20 USD/mes`
- produccion lean: `25 a 60 USD/mes`

Desglose orientativo:

- `Vercel Pro`: `20 USD/mes` por miembro
- `Railway`: desde `5 USD/mes`, mas uso

Ventajas:

- mejor encaje con la arquitectura recomendada
- separacion clara entre frontend y backend
- facil de entender, mantener y evolucionar

Contras:

- no es la opcion absolutamente mas barata
- el coste depende mas del uso de backend y base de datos
- requiere vigilar consumo para no crecer sin control

Cuando la elegiria:

- si quereis construir la base correcta desde V1
- si manteneis `NestJS` como backend de dominio principal
- si priorizais claridad de arquitectura frente a ahorro extremo

## Produccion sin coste: conclusion honesta

Si la pregunta es "puede existir una version funcionando sin coste":

- si, para prototipo, demo o discovery

Si la pregunta es "puede operar un negocio real sin coste":

- tecnicamente quizas durante una etapa muy corta
- operativamente no es una base recomendable

Presupuesto objetivo razonable para WellStudio V1:

- minimo serio: `25 a 60 USD/mes`
- comodo con staging, backups y algo de observabilidad: `80 a 200 USD/mes`

## Recomendacion actual

### Para discovery y preventa

- `Cloudflare Pages Free` o `Vercel Hobby`
- `Supabase Free`

### Para V1 productiva

- `Vercel Pro` para frontend
- `Railway` para backend, Postgres y Redis
- auth managed por decidir entre `Clerk`, `Supabase Auth` y `Firebase Auth`

Motivo:

- mantiene el coste razonable
- respeta mejor la arquitectura recomendada
- evita forzar la aplicacion a una forma demasiado serverless antes de tiempo

## Comparativa especifica: Next.js monolitico

`Next.js` no obliga a desplegar en `Vercel`.

Segun la documentacion oficial, puede desplegarse como:

- servidor `Node.js`
- contenedor `Docker`
- `standalone output`
- export estatico, aunque esta via no sirve para una app como WellStudio

Para WellStudio, las 3 variantes realmente serias serian estas:

| Variante | Donde corre | Coste mensual orientativo | Operacion | Encaje con WellStudio |
| --- | --- | --- | --- | --- |
| 1 | `Next.js` monolitico en `1 VPS` | `8 a 25 EUR/mes` | Media | Alto |
| 2 | `Next.js` monolitico en `Vercel` | `20 a 60+ USD/mes` | Baja | Alto |
| 3 | `Next.js` monolitico + servicios gestionados | `30 a 100+ USD/mes` | Baja-media | Alto |

### Variante 1: Next.js monolitico en 1 VPS

Forma:

- `Next.js` compilado con `output: 'standalone'`
- `Nginx` como proxy
- `Node.js` o `Docker`
- `PostgreSQL` y opcionalmente `Redis` en la misma maquina o en otra muy pequena

Coste razonable:

- `8 a 25 EUR/mes`

Ventajas:

- la opcion mas barata que sigue siendo seria
- control total del despliegue
- muy buen encaje con una arquitectura modular sobria

Contras:

- sois responsables de backups, actualizaciones, SSL y recuperacion
- mas riesgo operativo si el equipo no quiere tocar infraestructura

### Variante 2: Next.js monolitico en Vercel

Forma:

- app `Next.js` desplegada directamente en `Vercel`
- base de datos externa
- auth y otros servicios conectados por API

Coste razonable:

- `20 a 60+ USD/mes`

Ventajas:

- despliegue muy comodo
- muy buena DX para `Next.js`
- menos carga operativa

Contras:

- el coste por equipo y servicios auxiliares crece antes
- depende mas del ecosistema Vercel

### Variante 3: Next.js monolitico + servicios gestionados

Forma:

- `Next.js` en un host comodo
- `Postgres` gestionado
- auth managed
- storage managed
- cola o cache managed si hace falta

Coste razonable:

- `30 a 100+ USD/mes`

Ventajas:

- menos friccion tecnica
- menos tiempo de operacion
- buena opcion si quereis concentraros en producto

Contras:

- mas dependencia de proveedores
- coste fijo mayor desde el principio

### Mi lectura final sobre Next.js

Si quereis ahorrar:

- `Next.js` monolitico en `VPS`

Si quereis comodidad:

- `Next.js` monolitico en `Vercel`

Si quereis minimizar casi toda la operacion:

- `Next.js` + servicios gestionados

La tecnologia `Next.js` no os limita demasiado. Lo que cambia es cuanto quereis pagar por comodidad frente a cuanto quereis ahorrar asumiendo operacion.

## Alternativas mas sobrias y menos modernas

Si. Hay formas mas "aburridas" de montar esto y, en algunos casos, pueden reducir bastante el coste.

La idea general es:

- menos servicios especializados
- menos plataformas managed
- menos piezas separadas
- mas responsabilidad de operacion en vuestro lado

Lo que se gana:

- menor factura mensual
- arquitectura mas simple de entender
- menos dependencia de proveedores

Lo que se pierde:

- mas trabajo de sysadmin
- mas mantenimiento manual
- menos elasticidad
- mas riesgo operativo si no se administra bien

## Opcion D: VPS clasico + Docker Compose

Composicion:

- 1 VPS en Hetzner, OVH o similar
- `Nginx` como reverse proxy
- `Next.js` o frontend compilado
- `NestJS` o backend equivalente
- `PostgreSQL`
- `Redis`
- backups programados

Coste estimado:

- `5 a 20 EUR/mes` en fases tempranas

Ventajas:

- coste muy bajo
- control total
- una sola maquina puede servir de sobra para WellStudio V1

Contras:

- backups, actualizaciones, SSL, monitorizacion y recuperacion dependen de vosotros
- un error operativo tiene mas impacto
- peor experiencia de despliegue que en plataformas modernas

Encaje:

- muy bueno si quereis ahorrar de verdad y aceptais operacion manual

## Opcion E: VPS clasico + stack monolitico mas tradicional

Composicion:

- 1 VPS
- `Nginx`
- backend renderizando HTML del area privada y admin
- PostgreSQL
- cola opcional solo si de verdad hace falta

Variantes razonables:

- `Django`
- `Laravel`
- `Ruby on Rails`

Coste estimado:

- `5 a 20 EUR/mes`

Ventajas:

- muchisimo menos moving parts
- admin, auth, ORM, migraciones y panel interno resueltos mejor desde el principio
- excelente velocidad de desarrollo si se acepta un enfoque mas clasico

Contras:

- menos alineado con el enfoque frontend moderno tipo `Next.js`
- UX publica y privada pueden requerir mas trabajo si quereis una experiencia muy app-like
- el equipo debe sentirse comodo con ese stack

Encaje:

- probablemente la opcion mas sobria y pragmaticamente potente si priorizais negocio sobre moda tecnica

## Opcion F: WordPress para marketing + app separada muy simple

Composicion:

- `WordPress` para web publica y SEO
- app privada aparte en stack simple
- misma base de datos o integracion ligera segun el caso

Coste estimado:

- `5 a 25 EUR/mes` segun hosting y plugins

Ventajas:

- marketing y contenidos muy baratos de operar
- el gimnasio puede tocar la web publica facilmente
- la app privada puede evolucionar por separado

Contras:

- duplica superficies
- integracion entre marketing y producto mas torpe
- WordPress mete deuda si se le pide mas de la cuenta

Encaje:

- buena opcion si la prioridad comercial es tener una web editable y una app operativa sencilla

## Lo realmente importante: donde se va el dinero

En una plataforma como esta, el ahorro grande no suele venir de usar una tecnologia "hipster" o "aburrida".

Suele venir de:

- evitar microservicios
- evitar demasiados SaaS desde el inicio
- no sobredimensionar la infraestructura
- no abrir `staging`, `preview`, `observability` y tooling premium demasiado pronto
- reducir complejidad de producto en V1

En la practica:

- `Next.js + NestJS + Vercel + Railway` es moderno, pero no necesariamente caro
- `Django` o `Laravel` en un VPS puede salir mas barato
- la diferencia economica mensual al inicio puede ser pequena frente al coste de desarrollo y mantenimiento humano

## Mi lectura honesta para WellStudio

Si quereis el menor coste de infraestructura posible sin volveros locos:

- `1 VPS + Docker Compose + Postgres + Redis + backend monolitico`

Si ademas quereis el menor coste de desarrollo y mantenimiento total:

- un framework monolitico clasico como `Django` o `Laravel` puede ser incluso mejor negocio que una arquitectura mas moderna con muchas piezas

Si quereis equilibrio entre DX moderna y coste razonable:

- mantener la propuesta `Next.js + NestJS`, pero alojada de forma sobria o en un PaaS pequeno

## Recomendacion ampliada

Las tres familias de opcion para WellStudio serian:

1. Moderna y comoda

- `Vercel + Railway`

2. Moderna y muy barata

- `Cloudflare + Supabase`

3. Sobria, clasica y barata

- `VPS + Docker Compose`

Si el objetivo principal es vender una solucion fiable al gimnasio y controlar costes, la opcion sobria no solo es posible, sino bastante respetable.

## Fuentes oficiales

- Next.js Self-Hosting: https://nextjs.org/docs/app/guides/self-hosting
- Next.js Deploying: https://nextjs.org/docs/pages/building-your-application/deploying
- Next.js Output Standalone: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- Vercel Pricing: https://vercel.com/pricing
- Railway Pricing: https://railway.com/pricing
- Railway Pricing Docs: https://docs.railway.com/pricing
- Render Pricing: https://render.com/pricing/
- Render Free Tier: https://render.com/free
- Cloudflare Pages Pricing: https://pages.cloudflare.com/
- Cloudflare Pages Limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Workers Pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Supabase Pricing: https://supabase.com/pricing
- Supabase Billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase Compute: https://supabase.com/docs/guides/platform/manage-your-usage/compute
- Upstash Pricing: https://upstash.com/pricing
