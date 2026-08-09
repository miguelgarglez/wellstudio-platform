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

- implementado en `/classes` con sesiones futuras `PUBLISHED` cuyo tipo esta `ACTIVE` y marcado como publico
- la primera slice agrupa una ventana acotada de 30 dias por fecha de Madrid y muestra disponibilidad derivada del aforo real
- la agenda permite combinar filtros instantaneos por tipo de clase y coach; al ser una ventana acotada, filtra el read model ya cargado y conserva el contexto valido en la URL sin una nueva navegacion App Router
- la agenda publica es de lectura: reservar o entrar en waitlist exige acceder al portal de socios

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

- implementado en `/classes/[sessionId]`; una sesion pasada, borrador, cerrada o privada responde como no disponible
- el detalle expone solo informacion segura de clase, coach, horario, ubicacion, capacidad y disponibilidad; nunca roster ni identidad de socios

## 6. Reserva de clase

Actor:

- socio autenticado

Objetivo:

- reservar plaza en una sesion

Precondiciones:

- sesion reservable
- usuario autenticado
- usuario elegible por suscripcion, cuota periodica disponible, override admin activo o creditos

Happy path:

1. el usuario abre detalle de clase
2. el sistema valida sesion y elegibilidad
3. el usuario confirma reserva
4. el sistema crea `reservation`
5. el sistema marca consumo de membership, override manual o descuenta credito segun regla efectiva
6. el sistema actualiza plazas
7. el sistema muestra confirmacion

Errores y bloqueos:

- sin sesion activa
- sin elegibilidad
- allowance de membresia agotado para la semana o mes natural
- aforo agotado
- ya reservado
- conflicto por concurrencia

Postcondiciones:

- reserva creada
- disponibilidad recalculada
- job `RESERVATION_BOOKED` persistido atomicamente
- confirmacion por email intentada despues del commit; un fallo queda pendiente de reintento sin invalidar la reserva

Nivel de certeza:

- implementado y cubierto end-to-end para reserva directa

### Confirmacion de cancelacion

Cuando el socio cancela dentro de la ventana permitida, la misma transaccion que libera la plaza y devuelve el entitlement crea un job `RESERVATION_CANCELED`. El email se entrega despues del commit y conserva clase, fecha, horario, coach, espacio y referencia de reserva como snapshot auditable.

Si la cancelacion libera una plaza con waitlist activa, la misma transaccion promociona por orden a la primera entrada elegible, crea su reserva `SYSTEM`, marca la entrada como `PROMOTED` y persiste un job `WAITLIST_PROMOTED`. El email confirma una plaza efectiva, no una oferta pendiente de aceptar. Entrar o salir de waitlist no genera email en esta slice.

Cada ejecucion diaria calcula la agenda del dia siguiente en `Europe/Madrid` y crea un unico job `RESERVATION_REMINDER` por reserva `BOOKED` sobre sesiones `PUBLISHED` o `CLOSED`. Antes del envio, el dispatcher revalida la reserva y suprime con estado `CANCELED` cualquier recordatorio obsoleto, sin registrar un intento de proveedor. El comportamiento esta cubierto frente a cambios DST, reejecuciones y cancelaciones posteriores a la programacion.

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
3. el sistema distingue entre falta total de entitlement y quota periodica agotada cuando aplique
4. el sistema redirige a contratar o comprar si aplica

Errores y bloqueos:

- reglas ambiguas
- datos desactualizados de membresia
- override expirado o revocado

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
5. si se libera plaza, el sistema promociona automaticamente por orden a la primera entrada elegible
6. la promocion crea una reserva efectiva y un job `WAITLIST_PROMOTED` en la misma transaccion
7. el email se intenta despues del commit sin bloquear ni revertir la promocion

Errores y bloqueos:

- waitlist cerrada
- usuario ya en waitlist
- promocion fallida

Postcondiciones:

- entrada en waitlist creada o promovida

Nivel de certeza:

- implementado y cubierto end-to-end para entrada, salida y promocion por cancelacion

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
5. el sistema devuelve credito o deja de contar el consumo de allowance segun regla y ventana
6. el sistema dispara logica de waitlist si aplica

Errores y bloqueos:

- fuera de ventana de cancelacion
- reserva ya cancelada
- politica no devuelve credito
- override ya expirado o allowance ya reevaluado

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

Estado actual de catalogo:

- `/plans` permite comparar planes y bonos `ACTIVE` y publicos sin autenticacion
- muestra precio, periodicidad, regla efectiva de reservas, creditos y vigencia sin exponer configuracion interna
- los CTA publicos derivan a contacto o agenda
- `Cuenta` permite al socio autenticado comprar bonos de creditos publicos mediante checkout alojado
- la compra online de memberships recurrentes permanece diferida

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
5. el proveedor confirma el pago mediante webhook firmado
6. el sistema asigna creditos y encola una confirmacion de compra en una transaccion idempotente
7. tras el commit intenta enviar un email que confirma bono, reservas, importe y vigencia, enlaza a `Cuenta` y aclara que no sustituye una factura fiscal
8. si el redirect llega antes que el webhook, la cuenta muestra procesamiento y observa el estado hasta reflejar el saldo confirmado

Errores y bloqueos:

- catalogo no publicado
- pago fallido
- webhook no procesado
- email fallido: no revierte los creditos y queda recuperable en el monitor de entregas
- confirmacion lenta: el estado sigue pendiente y permite comprobar de nuevo sin asumir exito

Postcondiciones:

- creditos activos para el flujo implementado
- elegibilidad actualizada
- una entrega `CREDIT_PACK_PURCHASED` trazable por pago

Nivel de certeza:

- catalogo informativo y compra puntual de bonos implementados y validados; memberships recurrentes pendientes

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

- implementado en `/admin/sessions` para agenda, creacion/edicion, publicacion, cierre/reapertura y cancelacion auditable
- la edicion vive en una superficie enfocada y usa `updatedAt` como version optimista; capacidad, ubicacion y waitlist se validan como cambios operativos seguros
- cambiar clase, coach u horario con reservas o espera exige confirmacion y razon auditable; la misma transaccion crea un aviso `SESSION_RESCHEDULED` por reserva y entrada activa de waitlist
- la cancelacion administrativa crea primero un aviso `SESSION_CANCELED` por socio afectado y, en la misma transaccion, cancela reservas activas, devuelve creditos consumidos y expira la waitlist
- los avisos se intentan despues del commit, muestran feedback inmediato al operador y quedan trazables en `/admin/notifications`; un fallo de correo no revierte el cambio de agenda
- `/admin/sessions/catalog` permite crear y editar tipos de clase y coaches, archivarlos de forma reversible y conservar su historico
- no se puede archivar un tipo de clase ni desactivar un coach mientras tenga sesiones futuras operables; primero deben reasignarse o cancelarse

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
3. puede cambiar su estado basico con un motivo operativo
4. puede asignar o finalizar una membership interna con vigencia y motivo
5. puede ajustar creditos existentes o abrir una cuenta interna sin registrar un pago ficticio
6. puede realizar las demas acciones permitidas desde sus superficies de dominio

Errores y bloqueos:

- permisos insuficientes
- accion no permitida por politica

Postcondiciones:

- cambios auditados

Nivel de certeza:

- inferido con alta confianza

Estado V1 implementado:

- `/admin/members` ofrece un directorio acotado con búsqueda por nombre, email o teléfono y filtros de estado
- `/admin/notifications` muestra la salud de emails transaccionales, detalle seguro e intentos; solo los fallos pueden reintentarse y cada operacion queda auditada
- la ficha de socio agrega identidad, cuenta, memberships, créditos, reservas, waitlist, pagos y notas sin habilitar mutaciones comerciales ambiguas
- el admin puede añadir notas internas append-only al dossier; la UI recuerda que no deben almacenarse datos médicos o sensibles y cada alta conserva autor, fecha y auditoría
- una solicitud interesada puede vincularse a un socio existente; el flujo muestra coincidencias de identidad, exige confirmación y conserva el historial comercial sin crear usuarios fuera del boundary de Auth
- el admin puede activar, inactivar o bloquear al socio; la transición exige motivo, estado esperado y genera auditoría con actor y estados anterior/nuevo
- un socio inactivo o bloqueado conserva acceso e historial y puede cancelar actividad existente, pero no puede reservar ni entrar en waitlist hasta volver a `active`
- el admin puede asignar una membership interna de inicio inmediato o retroactivo sobre un plan activo; no se genera `Payment`, autorrenovacion ni contrato externo
- el admin puede finalizar una membership interna activa o pendiente sin cancelar reservas ya confirmadas; las memberships con proveedor externo se bloquean para evitar drift contractual
- una segunda membership activa y las activaciones futuras se rechazan de forma explicita
- el admin puede añadir o retirar creditos mediante un movimiento `MANUAL_ADJUSTMENT`; el saldo no puede quedar negativo y cada delta conserva motivo, actor y saldo resultante
- si no existe una cuenta operable, puede abrirse una cuenta interna sobre un bono activo sin crear `Payment`; no se duplica una cuenta vigente del mismo bono ni se reabren cuentas expiradas o canceladas
- desde la ficha se enlaza con Excepciones y con la sesión concreta de Agenda conservando un único contexto operativo
- `/admin/overrides` permite buscar socios por nombre o email
- opera solo sobre memberships activas
- permite conceder `extra_allowance` para la ventana vigente de una politica periodica
- permite conceder `session_access` sobre sesiones futuras publicadas
- permite revocar overrides vigentes sin borrar historial
- las acciones delegan en servicios de dominio y dejan trazabilidad auditable
- `/admin/sessions` muestra el roster y permite registrar asistencia o no-show desde dos horas antes
- `/admin` agrega la jornada y las señales operativas presentes sin duplicar acciones: sesiones de hoy, solicitudes nuevas, socios sin cobertura vigente, reglas legacy y excepciones activas
- `/admin/rules` conserva la configuracion de reglas por plan; `/admin?plan=...` se mantiene como compatibilidad y redirige al deep link nuevo
- cada correccion usa estado esperado para detectar concurrencia y genera `AuditLog`
- una sesion terminada solo puede completarse cuando no quedan asistencias pendientes

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

## Flujo de edicion de perfil del socio

1. el socio abre `/app/profile` y revisa sus datos actuales
2. abre un dialogo enfocado sin abandonar el contexto del perfil
3. puede editar nombre, apellidos, telefono y fecha de nacimiento; el email permanece bloqueado y explicado
4. el servidor valida y normaliza los datos dentro del modulo `members`
5. la escritura compara `Member.updatedAt` para evitar lost updates
6. si hay cambios, persiste el perfil y crea `MEMBER_PROFILE_UPDATED` con solo `changedFields`
7. el dialogo se cierra, aparece una confirmacion y la ficha muestra los valores actualizados

Estados de fallo:

- errores de campo se muestran inline sin cerrar el dialogo
- un perfil obsoleto no se sobrescribe; se pide recargar y reintentar
- guardar valores equivalentes normalizados es un no-op y no genera auditoria
