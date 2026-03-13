# Plantilla de Entrega Comercial de Software

Fecha: 2026-03-13
Objetivo: servir como plantilla base para entregar software a un cliente de forma profesional, previsible y sostenible.

## 1. Principio de partida

Cuando un proyecto se entrega como oportunidad comercial, no basta con definir:

- stack
- funcionalidades
- precio de desarrollo

Tambien hay que cerrar desde el principio:

- quien opera la infraestructura
- quien paga proveedores externos
- que mantenimiento esta incluido
- que tiempos de respuesta existen
- que cambios son soporte y cuales son evolutivos
- como se hacen backups, despliegues y recuperacion
- que pasa si la relacion comercial termina

La regla base es:

- no vender solo una aplicacion
- vender una solucion operable y mantenible

## 2. Decision comercial que hay que tomar siempre

Antes de cerrar el proyecto, hay que elegir uno de estos modelos:

### Modelo A: entrega de software y traspaso

Vosotros:

- desarrollais
- desplegais
- documentais
- entregais

El cliente o su proveedor:

- opera el sistema
- paga la infraestructura
- asume mantenimiento posterior o lo contrata aparte

### Modelo B: entrega + mantenimiento recurrente

Vosotros:

- desarrollais
- desplegais
- operais la plataforma
- dais soporte
- aplicais mantenimiento correctivo

El cliente:

- paga setup inicial
- paga cuota mensual
- paga evolutivos aparte

### Modelo C: software como servicio gestionado

Vosotros:

- reteneis el control operativo del sistema
- gestionais infra, proveedores y despliegues
- dais soporte y mantenimiento continuo

El cliente:

- paga alta inicial o migracion
- paga cuota mensual o anual
- no recibe necesariamente control total de la plataforma

## 3. Mi recomendacion para proyectos como WellStudio

Para un gimnasio boutique o negocio pequeno:

- el modelo mas sensato suele ser `entrega + mantenimiento recurrente`

Por que:

- os deja margen recurrente
- evita que el cliente os llame solo cuando algo rompe sin contrato
- os permite estandarizar operacion y soporte
- protege mejor el proyecto a largo plazo

## 4. Checklist comercial obligatoria antes de entregar

## Propiedad y acceso

- quien sera titular del dominio
- quien sera titular del hosting
- quien sera titular de la base de datos
- quien sera titular de Stripe u otros pagos
- quien sera titular del proveedor de auth
- quien custodia credenciales y secretos
- quien tiene acceso admin tecnico

## Infraestructura

- donde se despliega
- cuantos entornos existen
- quien paga cada proveedor
- que costes fijos mensuales se esperan
- si hay backups y retencion
- si hay monitorizacion y alertas
- si hay plan de recuperacion basico

## Soporte y mantenimiento

- que incluye la cuota mensual
- que no incluye la cuota mensual
- horario de soporte
- canal de soporte
- tiempo de respuesta objetivo
- tiempo de resolucion objetivo
- tratamiento de incidencias criticas

## Seguridad y cumplimiento

- donde viven los datos personales
- que proveedores procesan datos
- que medidas basicas de seguridad existen
- quien gestiona altas y bajas de usuarios internos
- como se auditan cambios sensibles
- como se gestionan rotaciones de credenciales

## Producto y cambios

- que se considera bug
- que se considera mejora
- que se considera nueva funcionalidad
- como se priorizan cambios
- como se cotizan evolutivos

## Fin de relacion

- como se entrega la base de datos
- como se entrega el codigo
- como se entregan credenciales y accesos
- cuanto soporte de transicion se incluye
- que pasa con la infraestructura gestionada por vosotros

## 5. Costes que siempre hay que contemplar

No basta con pensar en "hosting".

## Costes tecnicos

- hosting de app
- base de datos
- Redis o colas
- storage
- emails transaccionales
- auth managed
- monitorizacion
- backups
- dominio y DNS

## Costes operativos

- tiempo de soporte
- tiempo de despliegues
- actualizaciones de dependencias
- resolucion de incidencias
- ajustes menores de configuracion
- gestion de usuarios internos

## Costes de producto

- pequeños cambios UX
- nuevas reglas de negocio
- integraciones nuevas
- reporting adicional
- soporte a promociones o campañas

## 6. Paquetes de mantenimiento recomendados

Una forma sana de vender esto es separar:

- desarrollo inicial
- mantenimiento
- evolutivos

### Paquete Basico

Incluye:

- hosting y despliegue
- monitorizacion basica
- backups basicos
- correccion de bugs criticos
- soporte por email o canal acordado

No incluye:

- nuevas funcionalidades
- rediseños
- cambios complejos de negocio
- nuevas integraciones

### Paquete Estandar

Incluye:

- todo lo del paquete basico
- ventana de soporte definida
- cambios menores mensuales
- revision de errores y logs
- mantenimiento preventivo ligero

### Paquete Premium

Incluye:

- todo lo anterior
- prioridad alta
- bolsa mensual de horas
- despliegues supervisados
- reporting mensual tecnico y funcional

## 7. Definicion minima de SLA

Aunque no sea un SLA enterprise, conviene dejar algo por escrito.

Ejemplo simple:

- incidencia critica: sistema caido o reservas imposibles
- respuesta objetivo: dentro de horario en `2 a 4 horas`
- incidencia media: errores parciales o panel degradado
- respuesta objetivo: `1 dia laborable`
- incidencia baja: ajustes menores o bugs no bloqueantes
- respuesta objetivo: `2 a 5 dias laborables`

Importante:

- definir horario de soporte
- definir que ocurre fuera de horario
- definir que no se garantiza disponibilidad absoluta

## 8. Arquitectura pensando en mantenimiento

La arquitectura correcta para un proyecto comercial pequeno no es la mas barata por servidor, sino la que minimiza:

- horas de soporte
- fragilidad
- incertidumbre de despliegue
- dependencia de una sola persona

Para eso conviene:

- una arquitectura simple
- pocos servicios externos
- separacion clara por modulos
- proveedores conocidos y estables
- observabilidad minima
- procedimientos repetibles

## 9. Estandar de entrega tecnica

Al entregar software deberia existir, como minimo:

- documento de arquitectura
- README de desarrollo
- README de despliegue
- variables de entorno documentadas
- diagrama de modulos
- inventario de proveedores externos
- inventario de accesos y propietarios
- plan de backup basico
- plan de restauracion basico
- procedimiento de alta y baja de usuarios internos

## 10. Inventario de terceros

Siempre documentar:

- proveedor
- para que se usa
- cuenta propietaria
- coste mensual estimado
- riesgo si falla
- alternativa o plan de salida

Ejemplo:

- hosting web
- base de datos
- auth
- pagos
- email
- storage
- analytics
- monitorizacion

## 11. Riesgos comerciales tipicos

Los mas comunes en este tipo de proyectos:

- vender una cuota mensual sin definir alcance
- incluir cambios ilimitados en "mantenimiento"
- no separar soporte de evolutivos
- desplegar en cuentas personales sin acuerdo claro
- no aclarar titularidad de codigo e infraestructura
- no presupuestar incidencias reales
- dejar seguridad, backups y pagos fuera de contrato

## 12. Plantilla de decision antes de cerrar un proyecto

Antes de firmar o comprometer entrega, deberiais rellenar algo asi:

### Producto

- alcance de V1:
- exclusiones:
- roadmap deseado:

### Stack

- frontend:
- backend:
- base de datos:
- auth:
- pagos:
- email:

### Infra

- proveedor de despliegue:
- proveedor de base de datos:
- proveedor de auth:
- coste mensual estimado:
- entornos incluidos:

### Operacion

- quien despliega:
- quien monitoriza:
- quien recibe alertas:
- quien responde incidencias:
- horario de soporte:

### Comercial

- fee de setup:
- cuota mensual:
- horas incluidas:
- coste de evolutivos:
- permanencia o periodo minimo:

### Legal y propiedad

- titular del codigo:
- titular de la infraestructura:
- titular de las cuentas de terceros:
- clausula de salida:

## 13. Recomendacion practica para WellStudio

Si esto termina convirtiendose en un proyecto comercial real, yo lo plantearia asi:

- desarrollo inicial claramente presupuestado
- infraestructura y terceros identificados desde el principio
- mantenimiento mensual con alcance definido
- evolutivos fuera de mantenimiento
- arquitectura simple y mantenible
- cuentas profesionales, no personales, para proveedores criticos

## 14. Regla final

En software comercial pequeno, el riesgo no suele estar en programar la V1.

El riesgo suele estar en:

- mantenerla sin proceso
- soportarla sin limites
- operarla sin acuerdos

Por eso, una buena entrega comercial necesita tanto una buena arquitectura como un buen marco operativo.
