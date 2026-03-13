# Reverse Engineering Inicial: WellStudio

Fecha de observacion: 2026-03-12
Dominio analizado: https://www.wellstudio.es

## Objetivo

Documentar como funciona la experiencia digital actual de WellStudio para:

- entender que producto tienen realmente hoy
- identificar que modulos habria que replicar
- detectar puntos debiles de UX, integracion y negocio
- sentar la base para un futuro PRD y una propuesta comercial de reemplazo

## Resumen Ejecutivo

WellStudio no parece tener una aplicacion propia. La solucion actual es una web de marketing construida con Duda que incrusta widgets operativos de BEWE para reservas, acceso de usuarios, captacion de leads y chat.

La experiencia actual resuelve lo minimo para mostrar clases y permitir acceso de clientes, pero esta mal cohesionada. La operativa esta fragmentada, hay errores visibles de integracion, varias configuraciones parecen incompletas y algunos CTA llevan a modulos vacios o rotos.

La oportunidad de producto no esta en copiar literalmente la web actual, sino en reemplazar una mezcla de landing + widgets de tercero por una plataforma propia, coherente y mas clara para socios y personal del gimnasio.

## Metodologia de Analisis

El analisis se ha hecho sobre la superficie publica y sobre llamadas de red visibles desde el navegador. No se han usado credenciales ni se ha intentado acceder a zonas privadas.

Fuentes observadas:

- HTML y recursos cargados por `https://www.wellstudio.es`
- comportamiento visible de widgets en navegador
- respuestas publicas de la API de BEWE expuestas al frontend
- configuracion publica del centro y de la agenda

## Nivel de Certeza

## 1. Confirmado

Puntos validados directamente por observacion real o por respuestas tecnicas visibles:

- WellStudio usa una web publica construida con Duda
- la operativa visible se incrusta mediante widgets de BEWE
- existe un centro publico identificado por `siteName = 5d598b64` y `centerId = 698a6190ffefb486a6ac6996`
- la home publica expone agenda de clases, contacto, testimonios y varios CTAs
- el registro real funciona
- el onboarding usa codigo de verificacion por email
- se envia email de bienvenida
- la zona autenticada de socio existe
- la zona autenticada incluye modulos de tarjeta, perfil, contratos, suscripciones, bonos, reservas e historial de pagos
- la cuenta nueva devuelve estados vacios reales en esos modulos
- la vinculacion de tarjeta usa Stripe embebido
- existen endpoints autenticados para tarjetas, suscripciones, bonos, reservas, pagos y contratos
- el CTA de detalle de clase sigue mostrando `Iniciar sesión` aun estando autenticado
- al pulsar ese CTA reaparece el formulario de login
- el CTA de servicios online de la home lleva a un modulo vacio o no configurado

## 2. Inferido con Alta Confianza

Puntos no completados end-to-end, pero muy probables por las respuestas observadas:

- el sistema distingue entre entidad `user` y entidad `client`
- la logica de elegibilidad depende de suscripcion, pack o credito
- el sistema soporta waitlist para clases
- el sistema soporta cancelacion por cliente con ventana limitada
- la plataforma actual de WellStudio depende operativamente de BEWE mas que de una app propia
- la experiencia autenticada y la experiencia de reserva estan fragmentadas entre widgets embebidos
- WellStudio tiene hoy una configuracion incompleta o inconsistente en algunos modulos comerciales

## 3. Pendiente de Validar

Puntos que todavia no se deben tratar como certeza:

- si la reserva real puede completarse por alguna ruta alternativa al flujo roto observado
- si la waitlist funciona end-to-end
- si existe compra online real de bonos o suscripciones en este centro
- si hay facturas o tickets completos con datos reales cuando hay pagos
- si existe panel interno de gestion y con que alcance
- si existen roles diferenciados para staff, coach y manager
- como gestionan asistencia, check-in o control de acceso
- como migrarian datos desde el sistema actual
- cuales son exactamente los planes, bonos o reglas comerciales reales del gimnasio

## Arquitectura Actual

## 1. Capa web publica

- Dominio: `www.wellstudio.es`
- Servidor: `nginx`
- Generador de sitio: Duda
- Evidencias:
  - `SiteType: DUDAONE`
  - recursos de `static.cdn-website.com`
  - recursos de `multiscreensite.com`
  - runtime con `jquery-3.7.0` y `jquery-migrate`

La home es una landing de una sola pagina con anclas internas:

- Inicio
- Nosotros
- Servicios
- Contacto

SEO actual muy debil:

- `<title>` = `Home`
- sitemap con una sola URL
- no existe una arquitectura de paginas de servicio indexables

## 2. Capa operativa incrustada

Sobre la landing se cargan widgets de BEWE:

- `https://web.bewe.co/widget/bewidget.js`
- `https://api.bewe.co/...`
- chatbot de BEWE

Widgets detectados en la pagina:

- `profile`: login / registro / recuperacion
- `classes`: agenda publica de clases
- `services`: CTA de agenda de servicios
- `lead`: formulario de captacion/contacto

Otros terceros:

- reCAPTCHA para registro
- Mapbox para el mapa
- service worker del builder

## 3. Identidad de centro detectada

La web se resuelve contra un centro publico de BEWE:

- `siteName`: `5d598b64`
- `centerId`: `698a6190ffefb486a6ac6996`
- nombre: `WellStudio`
- direccion: `C. de Juan Pradillo, 2, Tetuán, 28039 Madrid, España`
- email: `wellstudiofit@gmail.com`
- telefono: `614882404`

## Funcionalidades Observadas

## Matriz Rapida de Modulos

| Modulo | Estado actual | Evidencia | Observacion |
| --- | --- | --- | --- |
| Landing publica | Activo | Visible en home | Hecha en Duda |
| Agenda de clases | Activo | Widget `classes` + API publica | Es la parte mas util de la web actual |
| Detalle de clase | Activo | Modal de detalle | Empuja a login |
| Reserva de clase | Parcial / restringida | Flags publicas de booking | Bloqueada sin pack o suscripcion |
| Lista de espera | Activa | `allowWaitlist = true` | Detectada en respuestas de clases |
| Login | Activo | Widget `profile` | Embebido en home |
| Registro | Activo | Widget `profile` + reCAPTCHA | Verificacion por email activada |
| Recuperacion de contraseña | Activa | Visible en login | Flujo no probado end-to-end |
| Servicios / tratamientos online | Roto o no configurado | `treatments = false` | CTA comercial lleva a modulo vacio |
| Lead form | Activo | Widget `lead` | Campos custom visibles |
| Newsletter opt-in | Activo | Checkbox visible | Integracion posterior no confirmada |
| Chat | Activo | Widget flotante | Experiencia externa de BEWE |
| Planes / suscripciones | Inferido | Flags publicas | No estan bien expuestos en la web |
| Packs / descuentos | Inferido | Flags publicas | Probablemente usados para elegibilidad |
| Compra online | No confirmada | `waysToPay = ["direct"]` | No se observa checkout claro |
| Panel interno | No confirmado | No accesible sin credenciales | Seguramente vive dentro de BEWE |

## 1. Marketing / web publica

- Hero principal con branding y CTA de reserva
- bloques de valor:
  - Entrenamientos de fuerza
  - Clases personalizadas
  - Clases grupales
- bloque de servicios recomendados
- descripcion del centro
- testimonios
- contacto
- horarios
- mapa
- enlaces sociales en footer

## 2. Agenda publica de clases

### Lo que se ve

- calendario semanal
- detalle por clase
- instructor
- hora de inicio y fin
- capacidad
- plazas ocupadas
- modal de detalle por sesion

### Comportamiento observado

- permite ver disponibilidad siendo anonimo
- al abrir una clase, el CTA principal es `Iniciar sesión`
- la agenda publica muestra plazas restantes, por ejemplo `Quedan 8 plazas, 2 apuntados de 10`

### Clases observadas el 2026-03-12 para la semana 2026-03-09 a 2026-03-15

- total visible en la respuesta publica: 7 sesiones
- tipos de clase:
  - `Grupo Dinamico`
  - `Grupos Premium`
- capacidades:
  - 10 plazas
  - 4 plazas
- instructores detectados:
  - `Daniel Areces Galvez`
  - `Gabriel Rodríguez Mozos`
  - `Pablo Garcia de Rute`

### Reglas inferidas desde la respuesta publica

En todas las sesiones observadas aparecian estas banderas:

- `allowWaitlist = true`
- `allowBooking = true`
- `blockBySubsOrPack = true`
- `blockBySubsOrPackReasons = ["no-subscription", "no-pack"]`

Interpretacion:

- el sistema soporta reserva de clases
- soporta lista de espera
- un usuario sin suscripcion o pack no puede completar la reserva

## 3. Acceso de clientes

### Login

Visible en la home:

- email
- contraseña
- boton de acceso
- recuperacion de contraseña

### Registro

Visible desde el widget de acceso:

- nombre
- apellidos
- email
- contraseña
- telefono
- aceptacion de terminos
- reCAPTCHA

Configuracion publica asociada:

- `verifyRegisterEmail = true`

Interpretacion:

- el alta de usuario probablemente exige verificacion por email

### Flujo de onboarding confirmado manualmente

Flujo validado por un registro real:

1. el usuario introduce nombre, apellidos, email y telefono
2. el sistema completa el alta inicial
3. llegan dos correos practicamente al mismo tiempo:
   - email de bienvenida
   - email con codigo de verificacion
4. la interfaz muestra un campo para introducir el codigo
5. al pegar el codigo, la cuenta queda verificada
6. el usuario puede iniciar sesion

Hallazgos:

- el flujo de verificacion por codigo funciona
- el timing del envio de emails es correcto
- la activacion de cuenta no parece depender de enlace magico, sino de OTP o codigo corto
- el onboarding inicial esta mejor resuelto que otras partes de la experiencia publica

### Zona autenticada confirmada

Tras iniciar sesion, se muestra una capa de socio embebida en la misma home. No existe una separacion limpia tipo portal aparte.

Modulos visibles en el panel del socio:

- Mi tarjeta vinculada
- Vincular tarjeta
- Perfil
- Contratos por firmar
- Suscripciones activas
- Bonos activos
- Reservas realizadas
- Historial de pagos
- Cerrar sesión

Hallazgo estructural:

- la experiencia autenticada reutiliza la misma home publica como contenedor
- el panel de socio aparece encima o antes del contenido comercial, pero sin una separacion fuerte de informacion

## 4. Captacion / contacto

Hay un formulario de lead separado del widget de acceso.

Campos observados:

- Nombre
- Apellidos
- Email
- Telefono
- Franja horaria a la que asistiras al centro
- Edad
- aceptacion legal
- suscripcion a boletin/promociones

Datos tecnicos relevantes:

- los campos extra vienen de `fieldsLead`
- uno de ellos aparece internamente como `old`, lo que sugiere naming tecnico pobre

## 5. Chat

Se carga un chatbot flotante de BEWE con mensaje inicial parecido a:

- `Hola! ¿Cómo puedo ayudarte?`

Interpretacion:

- existe una capa minima de soporte o captacion conversacional
- no hay evidencia publica de una experiencia propia de mensajeria de marca

## 6. Mapa y localizacion

- mapa incrustado
- direccion fisica del centro
- horarios semanales expuestos en la landing

## Funcionalidades Inferidas pero No Expuestas del Todo

La API publica del centro sugiere que el sistema actual soporta mas cosas de las que la web enseña bien:

- suscripciones activas como concepto de producto
- descuentos/packs
- politicas de cancelacion
- restricciones por elegibilidad del usuario
- perfiles de cliente
- historial o gestion de reservas desde zona autenticada

### Confirmacion de estados reales en una cuenta nueva

Con una cuenta nueva y sin compras ni reservas:

- tarjetas guardadas: ninguna
- suscripciones activas: ninguna
- bonos activos: ninguno
- reservas realizadas: ninguna
- historial de pagos: vacio
- contratos por firmar: ninguno

Estados vacios observados en la UI:

- `No tienes suscripciones activas.`
- `No tienes bonos activos.`
- `Todavía no tienes ninguna reserva`
- `Tu historial de pagos está vacío`
- `No tienes contratos pendientes para firmar.`

Interpretacion:

- la zona de socio esta implementada de verdad, no es solo placeholder
- el sistema trabaja con un modelo de cliente autenticado que puede tener tarjetas, suscripciones, bonos, reservas, pagos y documentos
- los estados vacios son parte oficial del producto

Banderas publicas relevantes:

- `sections.classes = true`
- `sections.treatments = false`
- `sections.subscriptions = true`
- `sections.discounts = true`
- `clientCanCancelAppointment = true`
- `minimumCancelTime = 120`
- `denyAccessToNewClients = false`
- `isMultiSede = false`
- `isMulticenter = false`
- `waysToPay = ["direct"]`

## Funcionalidades Rotas o Mal Configuradas

## 1. Reserva de servicios

El CTA `Ver todo` en el bloque de servicios abre un modal con el mensaje:

`El centro aún no tiene ningún tratamiento disponible para reservar online :(`

Ademas, la configuracion publica devuelve:

- `sections.treatments = false`
- `treatmentsCount = 0`

Interpretacion:

- la web promociona servicios, pero el modulo de reserva de servicios no esta configurado
- hoy solo parece existir con sentido la reserva de clases, no de tratamientos/servicios

## 2. Enlaces de footer

Se detectaron URLs incorrectas o placeholders:

- Facebook: `https://facebook.com/https://www.facebook.com/`
- Instagram: `https://instagram.com/https://www.instagram.com/`
- Email: `mailto:`
- WhatsApp: `https://wa.me/`
- Waze: `https://waze.com/ul`

Interpretacion:

- el footer no esta terminado
- transmite poca confianza
- pierde conversion y credibilidad

## 3. Errores de integracion

En consola aparecen repetidamente:

- errores `Unauthorized user` al consultar `/users/me` siendo anonimo
- errores de `TypeError` por lecturas de `null`
- errores o warnings de i18n
- errores asociados al widget de `services`

Interpretacion:

- los widgets cargan mas logica de la necesaria para un visitante anonimo
- la integracion actual es fragil
- puede afectar rendimiento, mantenibilidad y confianza del usuario

## 3.b Bug grave en reserva tras login

Hallazgo confirmado:

- al abrir el detalle de una clase estando autenticado, el CTA sigue mostrando `Iniciar sesión`
- al pulsarlo, vuelve a mostrarse el formulario de login dentro de la pagina

Interpretacion:

- el widget o subflujo de detalle de clase no reconoce correctamente la sesion iniciada
- puede haber un problema de sincronizacion entre widgets embebidos
- este es uno de los fallos mas graves detectados, porque rompe el flujo central de negocio

## 4. UX demasiado mezclada

En la misma home conviven:

- landing comercial
- login
- registro
- agenda de clases
- formulario de lead
- chat

Interpretacion:

- no hay separacion limpia entre adquisicion, operacion y soporte
- la sensacion es de sistema remendado, no de producto

## 5. Problemas de pulido

- copy inconsistente
- acentos ausentes o mal renderizados
- naming interno visible en formularios
- metadata SEO generica
- formularios con atributos HTML pobres
- accesibilidad mejorable

## Modelo de Dominio Recomendado para Replicar

Si se rehace el producto, estas son las entidades minimas que merece la pena modelar:

- Gym
- Location
- Coach
- Member
- MembershipPlan
- CreditPack
- ClassType
- ClassSession
- Reservation
- WaitlistEntry
- CancellationPolicy
- Lead
- UserCustomField
- Notification
- Payment
- CheckIn

## Mapa de Flujos Actuales

## 1. Flujo anonimo de descubrimiento

1. entra en la home
2. ve propuesta de valor
3. consulta agenda publica
4. intenta profundizar
5. se le empuja a login o a contacto

Friccion:

- no queda claro que puede hacer sin cuenta
- no se explica bien la diferencia entre reservar una clase y pedir informacion

## 2. Flujo anonimo de interes comercial

1. llega a la home
2. pulsa `¡Déjanos tu mensaje!`
3. rellena lead form
4. deja consentimiento legal y opcionalmente newsletter

Friccion:

- el formulario no parece propio de la marca
- hay campos pobres o poco pulidos

## 3. Flujo de miembro existente

1. entra en la home
2. inicia sesion
3. previsiblemente gestiona reservas desde widget autenticado

Friccion:

- login incrustado en home, no en una zona de cliente limpia
- no se ve una promesa clara de valor al usuario recurrente

## Stack Actual Inferido

Stack observado hoy:

- frontend publico: Duda
- widgets operativos: BEWE
- agenda / usuarios / lead fields: API publica de BEWE
- mapa: Mapbox
- captcha: Google reCAPTCHA
- chat: BEWE chatbot

En autenticacion y pagos se ha confirmado ademas:

- sesion basada en bearer token para llamadas autenticadas
- cookie HttpOnly adicional en respuestas de API
- vinculacion de tarjeta mediante Stripe embebido
- flujo de vinculacion con tokenizacion previa
- presencia de protecciones adicionales tipo hCaptcha en el flujo de tarjeta

No hay evidencia fuerte de:

- SPA propia
- panel administrativo propio
- app movil nativa de marca blanca en uso real para WellStudio

## Riesgos de Negocio del Sistema Actual

- dependencia alta de tercero para la operativa critica
- UX no diferenciada
- conversion debilitada por CTA y modulos rotos
- dificil evolucion del producto sin pelearse con widgets embebidos
- poca sensacion de marca propia
- informacion comercial y operativa demasiado mezclada

## Oportunidad de Producto para un Reemplazo

La propuesta no deberia ser "hacer la misma web". Deberia ser construir una plataforma WellStudio que unifique:

- captacion
- informacion comercial
- reserva de clases
- gestion de bonos y suscripciones
- area privada del socio
- panel interno del centro

## MVP recomendado para superar lo actual

### Area publica

- home limpia y clara
- horarios de clases
- detalles de planes y bonos
- informacion de entrenadores
- formulario comercial bien resuelto
- FAQ de reservas, cancelacion y acceso

### Area cliente

- registro y login
- dashboard del socio
- reserva y cancelacion de clases
- lista de espera
- planes y bonos activos
- historial de reservas
- notificaciones y recordatorios

### Area interna del gimnasio

- gestion de clases y aforo
- gestion de socios
- check-in
- incidencias de reserva
- leads y seguimiento comercial
- reporting basico

## Funcionalidades que Merece la Pena Mejorar respecto a la Solucion Actual

- separar claramente marketing y operativa
- explicar mejor las reglas de reserva
- permitir compra online de bonos/suscripciones si el gimnasio lo quiere
- branding consistente y premium
- experiencia movil cuidada
- menos dependencias visibles
- mejor rendimiento
- mejor SEO
- mejor trazabilidad de conversion

## APIs y Endpoints Publicos Observados

### Centro por siteName

`GET https://api.bewe.co/v1/centers/site-name/5d598b64?from=o_widget`

Utilidad:

- resolver el `centerId`
- obtener nombre, contacto, configuracion y direccion

### Configuracion publica del centro

`GET https://api.bewe.co/v1/centers/698a6190ffefb486a6ac6996?treatments=true&withColors=true&from=o_widget`

Utilidad:

- secciones activas
- politicas
- configuracion publica del negocio

### Agenda de clases

`GET https://api.bewe.co/v1/classes/698a6190ffefb486a6ac6996?...`

Utilidad:

- sesiones
- capacidad
- ocupacion
- instructor
- banderas de reserva y waitlist

### Campos extra de leads

`GET https://api.bewe.co/v1/users/fieldsLead/698a6190ffefb486a6ac6996?online=true&from=o_widget`

Utilidad:

- descubrir el formulario comercial real

### Usuario autenticado

`GET https://api.bewe.co/v1/users/me?idCenter=698a6190ffefb486a6ac6996&from=o_widget`

Utilidad:

- comprobar si hay sesion autenticada
- devuelve `401` en estado anonimo

### Login autenticado

`POST https://api.bewe.co/v1/users/login?from=o_widget`

Utilidad:

- autenticar al usuario
- devolver un bearer token
- devolver una entidad `user`
- devolver una entidad `client` asociada

Inferencia de modelo:

- el sistema distingue entre `user` e `idClient`
- la mayoria de operaciones de pagos parecen colgar del `client`

### Tarjetas guardadas

`GET https://api.bewe.co/v1/payments/client/{clientId}/card/list?center={centerId}&from=o_widget`

Utilidad:

- recuperar tarjetas guardadas del cliente

Hallazgo:

- cuenta nueva devuelve lista vacia

### Suscripciones del usuario

`GET https://api.bewe.co/v1/users/subscriptions/{centerId}?from=o_widget`

Utilidad:

- recuperar suscripciones activas del usuario

Hallazgo:

- cuenta nueva devuelve lista vacia

### Bonos / descuentos del usuario

`GET https://api.bewe.co/v1/users/me/discounts?center={centerId}&from=o_widget`

Utilidad:

- recuperar packs o fidelidades

Hallazgo:

- devuelve `fidelities: []` y `packs: []` para una cuenta nueva

### Reservas del usuario

`GET https://api.bewe.co/v1/users/bookings?center={centerId}&waitlist=true&waitCancel=true&from=o_widget`

Utilidad:

- recuperar reservas y estados relacionados

Hallazgo:

- cuenta nueva devuelve lista vacia

### Clases reservadas con video

`GET https://api.bewe.co/v1/classes/booked?idCenter={centerId}&onlyWithVideo=1&from=o_widget`

Utilidad:

- recuperar clases reservadas con video asociado

Hallazgo:

- cuenta nueva devuelve lista vacia

### Tickets / historial de pagos

`GET https://api.bewe.co/v1/payments/client/{clientId}/ticket/list?from=o_widget`

Utilidad:

- recuperar pagos o tickets del cliente

Hallazgo:

- cuenta nueva devuelve lista vacia

### Documentos / contratos

`GET https://api.bewe.co/v1/agreements/documents?id_center={centerId}&id_user={userId}&from=o_widget`

Utilidad:

- recuperar contratos o documentos pendientes

Hallazgo:

- cuenta nueva devuelve objeto vacio

### Catalogo de suscripciones del centro

`GET https://api.bewe.co/v1/centers/{centerId}/subscriptions?from=o_widget`

Utilidad:

- recuperar suscripciones que el centro puede ofrecer

Hallazgo:

- en el estado actual devuelve lista vacia
- por tanto, existe CTA de compra de suscripcion pero no parece haber catalogo disponible

### Vinculacion de tarjeta

`POST https://api.bewe.co/v1/payments/client/{clientId}/card/tokenizationOrder?from=o_widget`

Utilidad:

- iniciar la tokenizacion para guardar tarjeta

Hallazgo:

- el flujo levanta Stripe Elements
- pide titular de tarjeta
- valida numero de tarjeta en embebido seguro
- genera una orden de tokenizacion antes del guardado final

## Lo que Aun No Se Puede Confirmar sin Credenciales

- panel interno del gimnasio
- experiencia real de socio autenticado
- compra y consumo de bonos/suscripciones
- historico de reservas
- cancelacion real end-to-end
- check-in o control de asistencia
- automatizaciones internas y reporting

## Recomendaciones para la Siguiente Fase

## 1. Convertir este documento en PRD

Siguiente entregable sugerido:

- objetivos del producto
- perfiles de usuario
- funcionalidades MVP
- backlog priorizado
- arquitectura propuesta

## 2. Profundizar en los flujos autenticados

Si se consigue acceso de pruebas o una demo:

- reservas reales
- cancelaciones
- perfil del socio
- planes/bonos
- mensajes/recordatorios

## 3. Preparar propuesta comercial

Enfoque sugerido:

- no vender "otra web"
- vender una plataforma propia de WellStudio
- justificar con:
  - mejor conversion
  - mejor experiencia de socios
  - menos dependencia de widgets
  - mas control operativo
  - mejor marca

## Hipotesis de Trabajo

Hipotesis principal:

WellStudio esta usando una solucion SaaS de terceros suficientemente funcional para operar, pero insuficiente para diferenciarse y ofrecer una experiencia premium.

Eso deja espacio para una propuesta de reemplazo centrada en:

- claridad
- marca
- conversion
- fidelizacion
- operacion diaria mejor resuelta
