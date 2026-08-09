# Reporting operativo admin V1

Fecha: 2026-08-09
Estado: implementado

## Objetivo

`/admin/reports` ofrece una lectura descriptiva y auditable de actividad, ocupacion y captacion. No es un dashboard financiero ni un sistema de BI: prioriza cifras accionables con ventanas y denominadores visibles.

## Ventanas

- `7d`, `28d` y `90d`; `28d` es el valor por defecto.
- cada ventana empieza a las `00:00` de `Europe/Madrid` del primer dia incluido y termina en el instante actual.
- se usan dias de calendario local, no bloques fijos de 24 horas, para respetar los cambios de horario de verano.
- sesiones incluidas: iniciadas dentro de la ventana y con estado `PUBLISHED`, `CLOSED` o `COMPLETED`; se excluyen borradores, canceladas y futuras.
- leads incluidos: creados dentro de la ventana. Su conversion se atribuye a la cohorte de creacion, aunque la conversion ocurra despues.

## Definiciones

- **Actividad**: numero de sesiones incluidas y registros de reserva asociados.
- **Ocupacion registrada**: reservas no canceladas divididas por la suma de capacidad. No representa una fotografia historica exacta al inicio de cada clase, porque V1 no persiste ese snapshot.
- **Cancelaciones**: registros `CANCELED` divididos por todos los registros de reserva de las sesiones incluidas.
- **Asistencia cerrada**: asistencias divididas por `ATTENDED + NO_SHOW`. Reservas pendientes y canceladas no entran en el denominador.
- **Conversion de solicitudes**: leads creados en la ventana con `convertedMemberId` dividido por todos los leads creados en la ventana.
- **Origen de captacion**: `utmSource`, con fallback a `source` y finalmente `No indicado`.
- **Calidad de datos**: sesiones cuyo fin ya paso y siguen sin `COMPLETED`, mas reservas no canceladas con asistencia pendiente en sesiones finalizadas.

Todos los porcentajes usan cero cuando el denominador esta vacio y quedan acotados entre `0` y `100`.

## Limites deliberados

- no hay comparacion con el periodo anterior ni lectura de tendencia.
- no se muestran ingresos, MRR ni ticket medio hasta validar la fuente financiera real y aislar datos sandbox.
- no hay exportacion, dashboards configurables ni filtros por coach.
- las barras son una ayuda visual CSS; la cifra y el contexto textual siguen siendo la fuente accesible.

## Verificacion

- unit tests protegen ventanas, DST, formulas, ordenaciones y denominadores vacios.
- el E2E usa fixtures reversibles recientes y antiguos para comprobar `7d` frente a `28d`.
- el E2E valida desktop, mobile, navegacion, ausencia de overflow y adjunta capturas de ambos estados.
