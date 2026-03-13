# WellStudio Flow Inventory

Fecha: 2026-03-13
Estado: base de trabajo para MVP

## Objetivo

Definir los flujos funcionales clave de WellStudio V1 para:

- alinear producto y desarrollo
- convertirlos en epics e issues
- evitar lagunas al implementar
- servir como base de testing y criterios de aceptacion

## Convencion

Cada flujo incluye:

- actor
- objetivo
- precondiciones
- happy path
- errores y bloqueos
- postcondiciones
- nivel de certeza

## 1. Registro y verificacion

Actor:

- visitante

Objetivo:

- crear una cuenta de socio y verificar email

Precondiciones:

- email no registrado
- formulario accesible

Happy path:

1. el usuario abre `registro`
2. rellena nombre, apellidos, email y telefono
3. acepta condiciones
4. el sistema crea la cuenta en estado pendiente
5. el sistema envia email de bienvenida
6. el sistema envia codigo de verificacion
7. el usuario introduce el codigo
8. el sistema verifica el email
9. el usuario puede iniciar sesion o entra directamente

Errores y bloqueos:

- email ya existente
- codigo incorrecto
- codigo expirado
- demasiados intentos
- fallo de envio de email

Postcondiciones:

- `user` creado
- `member` creado
- email marcado como verificado
- evento de analytics registrado

Nivel de certeza:

- confirmado en sistema actual

## 2. Login

Actor:

- socio existente

Objetivo:

- acceder al area privada

Precondiciones:

- cuenta existente
- credenciales validas

Happy path:

1. el usuario abre `login`
2. introduce email y password
3. el sistema valida credenciales
4. el sistema crea sesion
5. el usuario entra en `/app`

Errores y bloqueos:

- credenciales invalidas
- cuenta no verificada
- cuenta bloqueada
- rate limit

Postcondiciones:

- sesion activa
- contexto de usuario disponible

Nivel de certeza:

- confirmado en sistema actual

## 3. Recuperacion de contraseña

Actor:

- socio existente

Objetivo:

- recuperar acceso

Precondiciones:

- email registrado

Happy path:

1. el usuario solicita recuperar password
2. el sistema envia email con codigo o enlace
3. el usuario valida el desafio
4. el usuario define nueva password
5. el sistema invalida tokens previos sensibles si aplica

Errores y bloqueos:

- email inexistente sin filtrar existencia de cuenta
- token expirado
- token invalido

Postcondiciones:

- password actualizada
- login posible

Nivel de certeza:

- inferido con alta confianza

## 4. Ver agenda publica

Actor:

- visitante o socio

Objetivo:

- consultar clases disponibles

Precondiciones:

- sesiones publicadas

Happy path:

1. el usuario abre agenda
2. el sistema muestra sesiones por fecha
3. cada sesion muestra hora, coach, aforo y disponibilidad
4. el usuario puede abrir detalle

Errores y bloqueos:

- sin clases para la fecha
- agenda no cargada

Postcondiciones:

- ninguna de dominio

Nivel de certeza:

- confirmado en sistema actual

## 5. Ver detalle de clase

Actor:

- visitante o socio

Objetivo:

- ver informacion suficiente antes de reservar

Precondiciones:

- sesion existente y visible

Happy path:

1. el usuario abre una sesion
2. el sistema muestra informacion ampliada
3. el sistema muestra CTA contextual

Errores y bloqueos:

- sesion no encontrada
- bug de estado de autenticacion

Postcondiciones:

- ninguna de dominio

Nivel de certeza:

- confirmado, con bug importante detectado en sistema actual

## 6. Reserva de clase

Actor:

- socio autenticado

Objetivo:

- reservar plaza en una sesion

Precondiciones:

- sesion reservable
- usuario autenticado
- usuario elegible por suscripcion, bono o creditos

Happy path:

1. el usuario abre detalle de clase
2. el sistema valida sesion y elegibilidad
3. el usuario confirma reserva
4. el sistema crea `reservation`
5. el sistema descuenta credito o marca consumo segun regla
6. el sistema actualiza plazas
7. el sistema muestra confirmacion

Errores y bloqueos:

- sin sesion activa
- sin elegibilidad
- aforo agotado
- ya reservado
- conflicto por concurrencia

Postcondiciones:

- reserva creada
- disponibilidad recalculada
- evento de notificacion emitido

Nivel de certeza:

- confirmado a nivel de concepto, pendiente de validar end-to-end

## 7. Bloqueo por elegibilidad

Actor:

- socio autenticado

Objetivo:

- impedir reserva cuando el usuario no cumple reglas

Precondiciones:

- intento de reserva

Happy path:

1. el sistema calcula elegibilidad
2. el sistema detecta que el usuario no puede reservar
3. el sistema devuelve mensaje claro
4. el sistema redirige a contratar o comprar si aplica

Errores y bloqueos:

- reglas ambiguas
- datos desactualizados de membresia

Postcondiciones:

- no se crea reserva
- se registra intento bloqueado

Nivel de certeza:

- confirmado como concepto actual

## 8. Lista de espera

Actor:

- socio autenticado

Objetivo:

- apuntarse si no hay plazas

Precondiciones:

- sesion llena
- lista de espera habilitada

Happy path:

1. el usuario intenta reservar una sesion llena
2. el sistema ofrece entrar en waitlist
3. el usuario confirma
4. el sistema crea `waitlist_entry`
5. si se libera plaza, se notifica o promueve segun politica

Errores y bloqueos:

- waitlist cerrada
- usuario ya en waitlist
- promocion fallida

Postcondiciones:

- entrada en waitlist creada o promovida

Nivel de certeza:

- inferido con alta confianza

## 9. Cancelacion de reserva

Actor:

- socio autenticado

Objetivo:

- cancelar dentro de politica valida

Precondiciones:

- reserva existente
- usuario autorizado

Happy path:

1. el usuario abre sus reservas
2. el sistema muestra si la cancelacion sigue permitida
3. el usuario confirma cancelacion
4. el sistema cancela reserva
5. el sistema devuelve credito o ajusta consumo segun regla
6. el sistema dispara logica de waitlist si aplica

Errores y bloqueos:

- fuera de ventana de cancelacion
- reserva ya cancelada
- politica no devuelve credito

Postcondiciones:

- reserva cancelada
- aforo actualizado
- waitlist reevaluada

Nivel de certeza:

- confirmado como capacidad del sistema actual, pendiente de validar flujo completo

## 10. Vinculacion de tarjeta

Actor:

- socio autenticado

Objetivo:

- guardar metodo de pago para compras futuras

Precondiciones:

- sesion activa

Happy path:

1. el usuario abre `Mi tarjeta vinculada`
2. el sistema inicia flow de tokenizacion
3. el usuario introduce nombre y datos de tarjeta
4. el proveedor procesa el metodo de pago
5. el sistema guarda referencia segura

Errores y bloqueos:

- tarjeta rechazada
- tokenizacion fallida
- challenge no superado

Postcondiciones:

- tarjeta o referencia de pago disponible

Nivel de certeza:

- confirmado en sistema actual

## 11. Compra de suscripcion o bono

Actor:

- socio autenticado

Objetivo:

- adquirir elegibilidad para reservar

Precondiciones:

- catalogo online disponible
- metodo de pago valido

Happy path:

1. el usuario abre planes o bonos
2. el sistema muestra catalogo
3. el usuario selecciona producto
4. el sistema inicia pago
5. el pago se confirma
6. el sistema activa suscripcion o asigna creditos

Errores y bloqueos:

- catalogo no publicado
- pago fallido
- webhook no procesado

Postcondiciones:

- membresia o creditos activos
- elegibilidad actualizada

Nivel de certeza:

- confirmado como concepto, pendiente de validar por falta de catalogo activo

## 12. Gestion de perfil

Actor:

- socio autenticado

Objetivo:

- revisar o editar datos basicos

Precondiciones:

- sesion activa

Happy path:

1. el usuario abre perfil
2. el sistema muestra nombre, apellidos, email y telefono
3. el usuario edita campos permitidos
4. el sistema valida y persiste cambios

Errores y bloqueos:

- validacion de formato
- intento de editar campo no permitido

Postcondiciones:

- perfil actualizado

Nivel de certeza:

- confirmado en sistema actual

## 13. Historial de reservas y pagos

Actor:

- socio autenticado

Objetivo:

- ver actividad propia

Precondiciones:

- sesion activa

Happy path:

1. el usuario abre seccion de reservas o pagos
2. el sistema lista items con estados
3. el usuario abre detalle si aplica

Errores y bloqueos:

- sin datos
- carga parcial

Postcondiciones:

- ninguna de dominio

Nivel de certeza:

- confirmado como modulo; contenido real pendiente de validar

## 14. Captacion de lead

Actor:

- visitante

Objetivo:

- dejar datos para contacto comercial

Precondiciones:

- formulario visible

Happy path:

1. el usuario rellena formulario
2. el sistema valida campos
3. el sistema crea lead
4. el sistema confirma envio
5. staff recibe aviso si aplica

Errores y bloqueos:

- campos invalidos
- captcha
- fallo de envio

Postcondiciones:

- lead creado

Nivel de certeza:

- confirmado como concepto actual

## 15. Admin gestiona clases

Actor:

- staff o admin

Objetivo:

- crear, editar, cancelar o cerrar sesiones

Precondiciones:

- rol autorizado

Happy path:

1. el admin abre panel
2. crea o edita una sesion
3. el sistema valida aforo, horario, coach y reglas
4. la sesion queda publicada o actualizada

Errores y bloqueos:

- conflicto de horarios
- coach no disponible
- datos invalidos

Postcondiciones:

- sesion actualizada
- audit log generado

Nivel de certeza:

- inferido con alta confianza

## 16. Admin gestiona socios y reservas

Actor:

- staff o admin

Objetivo:

- consultar socios, revisar reservas y ayudar operativamente

Precondiciones:

- rol autorizado

Happy path:

1. el admin busca un socio
2. ve estado de membresias, creditos y reservas
3. puede realizar acciones permitidas

Errores y bloqueos:

- permisos insuficientes
- accion no permitida por politica

Postcondiciones:

- cambios auditados

Nivel de certeza:

- inferido con alta confianza

## Decisiones pendientes antes de implementar reservas y pagos

- regla exacta de elegibilidad por producto
- momento exacto de consumo de credito
- politica exacta de devolucion de credito al cancelar
- politicas de waitlist
- tipos de producto iniciales: suscripcion, bono o ambos en MVP
- roles exactos del panel interno

## Recomendacion de arranque

Implementar por este orden:

1. registro y login
2. member profile
3. lectura de agenda y detalle de clase
4. catalogo de planes o bonos
5. reserva con bloqueo por elegibilidad
6. cancelacion y waitlist
7. pagos
8. panel admin minimo
