# PRD Inicial: Plataforma WellStudio

Fecha: 2026-03-12
Basado en: [reverse-engineering-wellstudio.md](/Users/miguelgarglez/Developer/wellstudio-analysis/reverse-engineering-wellstudio.md)
Estado: borrador inicial

## 1. Vision del Producto

Construir una plataforma digital propia para WellStudio que sustituya la experiencia actual fragmentada de landing + widgets externos por un sistema coherente, premium y facil de operar.

La plataforma debe cubrir tres necesidades:

- captar nuevos clientes con una web comercial clara
- permitir a socios gestionar reservas de forma sencilla
- dar al equipo del gimnasio herramientas internas para operar clases, socios y leads

## 2. Problema

La solucion actual presenta varios problemas:

- la experiencia depende de un tercero y no transmite producto propio
- la web mezcla marketing, login, agenda, registro y contacto en una sola home
- no se explica bien como funcionan reservas, planes, bonos y restricciones
- hay modulos mal configurados o rotos
- el branding y el nivel de pulido no encajan con un centro boutique
- la capacidad de evolucion del producto esta limitada por widgets incrustados

## 3. Oportunidad

WellStudio puede beneficiarse de una plataforma propia que:

- mejore conversion de visitas a leads y socios
- mejore la experiencia de reserva y la percepcion de marca
- reduzca friccion para usuarios recurrentes
- centralice la operativa diaria del centro
- permita diferenciarse frente a otros gimnasios que usan soluciones genericas

## 4. Objetivos del Producto

## Objetivos de negocio

- aumentar conversion de visitante a lead
- aumentar conversion de lead a cliente
- aumentar retencion de socios mediante una experiencia de reserva mas clara
- reforzar la marca premium de WellStudio
- reducir dependencia visible de herramientas de terceros

## Objetivos de usuario

- consultar horarios y disponibilidad rapidamente
- entender que clases puede reservar y con que plan
- reservar o cancelar sin friccion
- ver el estado de su cuenta, plan o bonos
- contactar con el centro sin confusion

## Objetivos operativos

- gestionar clases, aforo y entrenadores
- gestionar socios y estados de membresia
- hacer seguimiento de leads
- resolver incidencias de reservas
- disponer de reporting basico

## 5. No Objetivos de la V1

Estos puntos no deberian bloquear el MVP:

- app movil nativa iOS/Android
- sistema completo de facturacion avanzada
- integraciones complejas con terceros no criticos
- multi-centro
- marketplace o ecommerce amplio
- programa de loyalty complejo
- chat en tiempo real propio

## 6. Perfiles de Usuario

## 1. Visitante anonimo

Persona interesada en conocer el centro, los entrenamientos y como apuntarse.

Necesidades:

- entender la propuesta de valor
- ver clases y horarios
- conocer precios, bonos o planes
- dejar sus datos o iniciar alta

## 2. Lead

Persona que aun no es socia pero ya ha dejado sus datos o quiere probar el servicio.

Necesidades:

- recibir seguimiento rapido
- entender que opcion le conviene
- completar alta sin friccion

## 3. Socio

Cliente ya registrado con acceso a reservas y posiblemente con plan o bono activo.

Necesidades:

- reservar clases
- cancelar dentro de plazo
- apuntarse a waitlist
- consultar historial
- ver estado de plan, bono o creditos

## 4. Coach / staff

Entrenador o personal del centro que necesita ver ocupacion, asistencia e incidencias.

Necesidades:

- ver sesiones del dia
- revisar aforo
- marcar asistencia o check-in
- detectar cancelaciones y plazas libres

## 5. Manager / owner

Responsable de negocio que necesita control comercial y operativo.

Necesidades:

- editar clases y capacidad
- gestionar socios
- revisar leads
- consultar metricas basicas

## 7. Propuesta de Valor

## Para clientes

- una experiencia clara, premium y movil
- reserva simple y entendible
- mas transparencia sobre planes y elegibilidad
- area privada util de verdad

## Para WellStudio

- producto de marca propia
- mayor control sobre UX y conversion
- posibilidad de evolucionar modulos internos
- mejor presentacion comercial frente a clientes potenciales

## 8. Alcance Funcional V1

## A. Area publica

### 1. Home comercial

Debe incluir:

- hero con propuesta de valor y CTA claros
- bloques de servicios y metodologia
- entrenadores
- testimonios
- ubicacion y horarios
- FAQ
- CTA a reserva y CTA a contacto

### 2. Pagina de clases

Debe permitir:

- ver agenda semanal
- filtrar por tipo de clase o coach
- ver plazas libres
- abrir detalle de sesion
- entender si la clase es reservable o no

### 3. Pagina de planes y bonos

Debe explicar:

- tipos de membresia
- bonos o creditos
- reglas de elegibilidad
- condiciones de cancelacion basicas

### 4. Captacion

Debe incluir:

- formulario de contacto
- formulario de alta/interes
- posibilidad de solicitar prueba o llamada
- tracking de origen de lead

## B. Area cliente

### 1. Autenticacion

- registro
- login
- recuperacion de contraseña
- verificacion de email

### 2. Dashboard del socio

Debe mostrar:

- proximas reservas
- waitlists activas
- plan o bono actual
- creditos restantes si aplica
- avisos relevantes

### 3. Reservas

Debe permitir:

- reservar una clase
- cancelar si esta dentro de politica
- ver si queda aforo
- apuntarse a waitlist
- salir de waitlist

### 4. Historial

Debe mostrar:

- clases pasadas
- cancelaciones
- estado de reservas

### 5. Perfil

Debe permitir:

- editar datos basicos
- ver consentimiento y preferencias
- ver informacion de facturacion basica si se implementa compra online

## C. Area interna

### 1. Gestion de clases

- crear tipos de clase
- programar sesiones
- asignar coach
- definir aforo
- definir reglas de reserva y cancelacion

### 2. Gestion de socios

- ver listado de socios
- ver estado de cuenta
- revisar reservas futuras
- asignar o modificar planes/bonos

### 3. Gestion de leads

- listado de leads
- estado del lead
- notas internas
- fuente del lead

### 4. Operativa diaria

- vista del dia
- asistencia / check-in
- plazas libres
- incidencias

### 5. Reporting basico

- ocupacion por clase
- conversion a lead
- conversion a socio
- cancelaciones

## 9. Historias de Usuario Clave

## Visitante

- Como visitante, quiero ver las clases de la semana para saber si WellStudio encaja con mi horario.
- Como visitante, quiero entender que plan necesito para reservar para no frustrarme al intentar apuntarme.
- Como visitante, quiero dejar mis datos facilmente para que el centro me contacte.

## Socio

- Como socio, quiero ver mis proximas clases al entrar para confirmar que estoy apuntado.
- Como socio, quiero cancelar una clase dentro de plazo para liberar mi plaza.
- Como socio, quiero apuntarme a una waitlist para entrar si se libera hueco.
- Como socio, quiero ver mi plan o creditos para saber si puedo reservar mas sesiones.

## Staff

- Como staff, quiero ver el aforo de las clases del dia para organizar la operativa.
- Como staff, quiero revisar rapidamente que socios tienen reserva o waitlist.

## Manager

- Como manager, quiero ver leads nuevos y su origen para medir conversion.
- Como manager, quiero editar horarios y aforo sin depender de un proveedor externo.

## 10. Reglas de Negocio Iniciales

Estas reglas salen del analisis actual y pueden ajustarse con validacion con el gimnasio.

- una clase tiene capacidad maxima
- una clase puede admitir waitlist
- un usuario puede reservar solo si cumple elegibilidad
- la elegibilidad puede depender de membresia, pack o creditos
- la cancelacion solo es valida hasta X horas antes de la clase
- el sistema debe informar claramente por que una reserva no es posible
- una misma clase puede estar asociada a un coach y a un tipo de clase
- un lead puede convertirse en socio

## 11. Suposiciones Iniciales

- WellStudio sigue operando principalmente con clases grupales y premium de aforo reducido
- el modelo comercial gira alrededor de planes, bonos o suscripciones
- el centro valora una imagen premium y un producto cuidado
- el equipo necesita una herramienta simple, no un ERP complejo
- la V1 puede ser web responsive y no necesita app nativa

## 12. Requisitos Funcionales

## RF-1 Agenda publica

El sistema debe exponer una agenda publica con sesiones futuras, horario, coach, capacidad y plazas libres.

## RF-2 Registro y acceso

El sistema debe permitir registro, login, recuperacion de contraseña y verificacion de email.

## RF-3 Reserva de clases

El sistema debe permitir reservar clases si el usuario cumple las reglas de elegibilidad.

## RF-4 Cancelacion

El sistema debe permitir cancelar dentro de la ventana permitida y debe bloquear cancelaciones fuera de plazo.

## RF-5 Waitlist

El sistema debe permitir entrar y salir de lista de espera.

## RF-6 Dashboard del socio

El sistema debe mostrar reservas futuras, plan actual y avisos relevantes.

## RF-7 Gestion de clases

El equipo del centro debe poder crear, editar y cancelar sesiones.

## RF-8 Gestion de leads

El sistema debe almacenar formularios comerciales y permitir seguimiento interno.

## RF-9 Gestion de socios

El equipo debe poder consultar y editar el estado basico de los socios.

## RF-10 Reporting basico

El sistema debe mostrar metricas basicas de ocupacion, leads y actividad.

## 13. Requisitos No Funcionales

- diseno responsive con foco en movil
- rendimiento alto en agenda y area cliente
- accesibilidad correcta en formularios y navegacion
- SEO decente en area publica
- trazabilidad de eventos clave
- arquitectura mantenible y escalable
- seguridad adecuada para datos personales y autenticacion

## 14. Arquitectura de Producto Recomendada

## Frontend

Dos superficies principales:

- web publica de marketing
- aplicacion web autenticada para socios y staff

Puede resolverse como:

- una sola aplicacion con rutas publicas y privadas
- o marketing site + app web en subruta o subdominio

Recomendacion inicial:

- una sola codebase con separacion clara de rutas

## Backend

Servicios o modulos minimos:

- autenticacion
- miembros y perfiles
- clases y agenda
- reservas
- waitlist
- planes / bonos / creditos
- leads
- admin
- notificaciones

## Base de datos

Entidades minimas:

- users
- members
- coaches
- class_types
- class_sessions
- reservations
- waitlist_entries
- membership_plans
- member_memberships
- credit_packs
- member_credits
- leads
- audit_logs

## Integraciones

Para V1:

- email transaccional
- captcha
- analytics

Opcionales despues:

- pagos online
- WhatsApp / SMS
- calendario externo

## 15. Pantallas Minimas de V1

## Publicas

- Home
- Clases
- Planes y bonos
- Contacto
- Login
- Registro

## Privadas cliente

- Dashboard
- Agenda privada / reservas
- Historial
- Perfil

## Internas staff/admin

- Dashboard operativo
- Calendario de clases
- Socios
- Leads
- Configuracion basica

## 16. MVP vs Fases Posteriores

## MVP

- web publica
- agenda publica
- autenticacion
- dashboard del socio
- reservas y cancelaciones
- waitlist
- gestion de clases
- gestion de socios basica
- gestion de leads basica

## Fase 2

- pagos online
- planes y bonos autogestionados por el usuario
- notificaciones avanzadas
- reporting mas completo
- promociones y automatizaciones

## Fase 3

- app movil nativa o PWA avanzada
- integraciones con hardware / check-in
- programa de fidelizacion
- automatizaciones comerciales avanzadas

## 17. Riesgos

- descubrir tarde reglas de negocio internas del gimnasio
- complejidad de membresias, bonos o creditos
- necesidad de migrar datos desde el sistema actual
- dependencia de acceso limitado a la operativa real durante discovery
- scope creep si se intenta sustituir toda la operativa en una sola fase

## 18. Preguntas Abiertas

Estas preguntas habria que resolverlas con WellStudio antes de cerrar alcance:

- que tipos exactos de plan, bono o suscripcion existen hoy
- si quieren o no compra online en V1
- quien necesita acceso interno y con que permisos
- si gestionan asistencia / check-in
- si quieren mantener captacion por formulario o moverla a onboarding directo
- si hay promociones, pruebas o sesiones de valoracion
- si quieren conservar historico del sistema actual
- si desean una sola plataforma o separar marketing y operativa

## 19. KPIs Iniciales

## Negocio

- tasa de conversion visita -> lead
- tasa de conversion lead -> socio
- numero de reservas por semana
- porcentaje de ocupacion media por clase

## Producto

- tiempo medio hasta reserva
- porcentaje de usuarios que completan registro
- ratio de intentos de reserva bloqueados por elegibilidad
- ratio de cancelaciones
- ratio de acceso movil vs desktop

## Operacion

- tiempo medio de gestion de lead
- numero de incidencias manuales por reservas
- plazas liberadas y cubiertas via waitlist

## 20. Roadmap Sugerido

## Fase 0 Discovery

- entrevistas con WellStudio
- validacion de reglas de negocio
- revision de la operativa real
- confirmacion de MVP

## Fase 1 Diseno

- arquitectura de informacion
- flujos UX
- sistema visual
- prototipo navegable

## Fase 2 Build MVP

- frontend publico
- frontend privado
- backend principal
- admin basico

## Fase 3 Piloto

- pruebas internas
- carga de datos inicial
- feedback con equipo y algunos socios

## Fase 4 Lanzamiento

- salida controlada
- soporte de incidencias
- medicion de uso

## 21. Recomendacion de Posicionamiento Comercial

No presentar la propuesta como:

- una web nueva
- una copia del sistema actual

Presentarla como:

- la plataforma digital propia de WellStudio
- una experiencia premium para socios y equipo
- una base para crecer sin depender visualmente de terceros

## 22. Siguiente Entregable Recomendado

El siguiente documento deberia ser uno de estos dos:

- un backlog funcional priorizado con epics y stories
- un documento tecnico de arquitectura y modelo de datos

Recomendacion:

hacer primero el backlog funcional, porque ayuda a estimar alcance, tiempos y presupuesto antes de entrar en detalle tecnico profundo

