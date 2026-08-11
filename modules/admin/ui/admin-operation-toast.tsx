'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AdminOperationToastState =
  | 'extra'
  | 'session'
  | 'revoked'
  | 'revoke-error'
  | 'policy-saved'
  | 'lead-new'
  | 'lead-contacted'
  | 'lead-qualified'
  | 'lead-lost'
  | 'lead-note'
  | 'lead-converted'
  | 'session-draft'
  | 'session-published'
  | 'session-updated'
  | 'session-updated-notified'
  | 'session-closed'
  | 'session-canceled'
  | 'session-canceled-notified'
  | 'attendance-attended'
  | 'attendance-no-show'
  | 'attendance-pending'
  | 'session-completed'
  | 'class-type-saved'
  | 'class-type-archived'
  | 'class-type-active'
  | 'coach-saved'
  | 'coach-archived'
  | 'coach-active'
  | 'member-active'
  | 'member-inactive'
  | 'member-blocked'
  | 'membership-assigned'
  | 'membership-ended'
  | 'credits-adjusted'
  | 'credit-account-opened'
  | 'member-note-added'
  | 'staff-reservation-booked'
  | 'staff-reservation-canceled'
  | 'staff-waitlist-joined'
  | 'staff-waitlist-left'
  | 'notification-retry'
  | null

type AdminOperationToastProps = {
  state: AdminOperationToastState
  variant?: 'fixed' | 'inline'
  instanceKey?: string | null
}

const subscribeToClient = () => () => undefined

const TOAST_COPY: Record<
  Exclude<AdminOperationToastState, null>,
  {
    tone: 'success' | 'error'
    title: string
    description: string
  }
> = {
  extra: {
    tone: 'success',
    title: 'Reservas extra concedidas',
    description: 'La excepción ya está registrada y aparece en el historial del socio.',
  },
  session: {
    tone: 'success',
    title: 'Acceso puntual concedido',
    description: 'El socio ya puede acceder a esa sesión mediante una excepción auditable.',
  },
  revoked: {
    tone: 'success',
    title: 'Excepción revocada',
    description: 'La revocación queda persistida sin borrar la trazabilidad previa.',
  },
  'revoke-error': {
    tone: 'error',
    title: 'No hemos podido revocar la excepción',
    description: 'Recarga la vista y vuelve a intentarlo en unos segundos.',
  },
  'policy-saved': {
    tone: 'success',
    title: 'Regla guardada',
    description: 'La regla explícita ya está persistida y la vista se ha recargado con el estado actualizado.',
  },
  'lead-new': {
    tone: 'success',
    title: 'Solicitud reabierta',
    description: 'La solicitud vuelve a estar marcada como nueva para seguimiento operativo.',
  },
  'lead-contacted': {
    tone: 'success',
    title: 'Solicitud contactada',
    description: 'El estado se ha actualizado y queda visible en la bandeja de solicitudes.',
  },
  'lead-qualified': {
    tone: 'success',
    title: 'Solicitud marcada como interesada',
    description: 'El seguimiento continúa y el cambio ya aparece en su historial.',
  },
  'lead-lost': {
    tone: 'success',
    title: 'Solicitud perdida',
    description: 'La solicitud deja de estar activa para seguimiento ordinario.',
  },
  'lead-note': {
    tone: 'success',
    title: 'Nota añadida',
    description: 'El nuevo contexto ya forma parte del historial de la solicitud.',
  },
  'lead-converted': {
    tone: 'success',
    title: 'Solicitud convertida en socio',
    description: 'La identidad ha quedado vinculada sin perder el historial comercial.',
  },
  'session-draft': {
    tone: 'success',
    title: 'Borrador guardado',
    description: 'La sesión queda en agenda interna y todavía no es reservable.',
  },
  'session-published': {
    tone: 'success',
    title: 'Sesión publicada',
    description: 'La sesión ya está visible en la agenda del socio y admite reservas.',
  },
  'session-updated': {
    tone: 'success',
    title: 'Sesión actualizada',
    description: 'Los cambios ya están persistidos y la agenda muestra la versión actual.',
  },
  'session-updated-notified': {
    tone: 'success',
    title: 'Sesión actualizada y avisos preparados',
    description: 'La agenda ya muestra el cambio y cada socio afectado tiene una entrega transaccional trazable.',
  },
  'session-closed': {
    tone: 'success',
    title: 'Reservas cerradas',
    description: 'La sesión se conserva en agenda, pero ya no admite nuevas reservas.',
  },
  'session-canceled': {
    tone: 'success',
    title: 'Sesión cancelada',
    description: 'Reservas y waitlist se han cerrado, con devoluciones y auditoría aplicadas.',
  },
  'session-canceled-notified': {
    tone: 'success',
    title: 'Sesión cancelada y avisos preparados',
    description: 'Reservas y waitlist están cerradas; las comunicaciones quedan visibles en Entregas.',
  },
  'attendance-attended': {
    tone: 'success',
    title: 'Asistencia registrada',
    description: 'El socio figura como asistente y el cambio ha quedado auditado.',
  },
  'attendance-no-show': {
    tone: 'success',
    title: 'No-show registrado',
    description: 'La ausencia queda reflejada en la reserva y en la trazabilidad admin.',
  },
  'attendance-pending': {
    tone: 'success',
    title: 'Asistencia corregida',
    description: 'La reserva vuelve a quedar pendiente para que el equipo la revise.',
  },
  'session-completed': {
    tone: 'success',
    title: 'Sesión completada',
    description: 'El roster está resuelto y la sesión queda cerrada como histórico.',
  },
  'class-type-saved': {
    tone: 'success',
    title: 'Tipo de clase guardado',
    description: 'La configuración ya está disponible al programar nuevas sesiones.',
  },
  'class-type-archived': {
    tone: 'success',
    title: 'Tipo de clase archivado',
    description: 'Se conserva el histórico, pero ya no aparece al crear sesiones.',
  },
  'class-type-active': {
    tone: 'success',
    title: 'Tipo de clase reactivado',
    description: 'Vuelve a estar disponible en la operativa de Agenda.',
  },
  'coach-saved': {
    tone: 'success',
    title: 'Coach guardado',
    description: 'El perfil ya puede asignarse a nuevas sesiones.',
  },
  'coach-archived': {
    tone: 'success',
    title: 'Coach desactivado',
    description: 'Se conserva su histórico, pero ya no puede recibir nuevas asignaciones.',
  },
  'coach-active': {
    tone: 'success',
    title: 'Coach reactivado',
    description: 'Vuelve a estar disponible al programar sesiones.',
  },
  'member-active': {
    tone: 'success',
    title: 'Socio activado',
    description: 'La cuenta vuelve a admitir nuevas reservas y el cambio queda registrado.',
  },
  'member-inactive': {
    tone: 'success',
    title: 'Socio inactivado',
    description: 'Se bloquean nuevas reservas sin ocultar su historial ni impedir cancelaciones.',
  },
  'member-blocked': {
    tone: 'success',
    title: 'Socio bloqueado',
    description: 'No puede hacer nuevas reservas; sí puede consultar y cancelar lo existente.',
  },
  'membership-assigned': {
    tone: 'success',
    title: 'Membership asignada',
    description: 'El plan ya está activo y la operación queda registrada.',
  },
  'membership-ended': {
    tone: 'success',
    title: 'Membership finalizada',
    description: 'El plan deja de admitir nuevas reservas sin cancelar actividad ya confirmada.',
  },
  'credits-adjusted': {
    tone: 'success',
    title: 'Saldo de créditos actualizado',
    description: 'El movimiento y el saldo resultante ya constan en el historial del socio.',
  },
  'credit-account-opened': {
    tone: 'success',
    title: 'Cuenta de créditos abierta',
    description: 'Los créditos ya están disponibles sin crear un pago ficticio.',
  },
  'member-note-added': {
    tone: 'success',
    title: 'Nota interna añadida',
    description: 'El contexto ya aparece en la ficha y queda asociado al operador.',
  },
  'staff-reservation-booked': {
    tone: 'success',
    title: 'Reserva asistida confirmada',
    description: 'La plaza ya aparece en la agenda del socio (origen Staff).',
  },
  'staff-reservation-canceled': {
    tone: 'success',
    title: 'Reserva asistida cancelada',
    description: 'La plaza se ha liberado, el motivo queda registrado y la waitlist se ha reevaluado.',
  },
  'staff-waitlist-joined': {
    tone: 'success',
    title: 'Socio añadido a waitlist',
    description: 'La posición ya está registrada para una futura promoción automática.',
  },
  'staff-waitlist-left': {
    tone: 'success',
    title: 'Socio retirado de waitlist',
    description: 'La lista se ha reordenado y la operación queda asociada al operador.',
  },
  'notification-retry': {
    tone: 'success',
    title: 'Reintento programado',
    description: 'La entrega se está procesando de nuevo sin perder el historial anterior.',
  },
}

export function AdminOperationToast({
  state,
  variant = 'fixed',
  instanceKey,
}: AdminOperationToastProps) {
  if (!state) {
    return null
  }

  return (
    <VisibleAdminOperationToast
      key={`${state}:${instanceKey ?? 'default'}`}
      state={state}
      variant={variant}
    />
  )
}

function VisibleAdminOperationToast({
  state,
  variant,
}: {
  state: Exclude<AdminOperationToastState, null>
  variant: NonNullable<AdminOperationToastProps['variant']>
}) {
  const [isVisible, setIsVisible] = useState(true)
  const isClient = useSyncExternalStore(subscribeToClient, () => true, () => false)
  const portalTarget = isClient ? document.body : null

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsVisible(false)
    }, 8000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [state])

  if (!isVisible || !portalTarget) {
    return null
  }

  const copy = TOAST_COPY[state]
  const Icon = copy.tone === 'success' ? CheckCircle2 : AlertCircle

  return createPortal(
    <div
      role={copy.tone === 'error' ? 'alert' : 'status'}
      aria-live={copy.tone === 'error' ? 'assertive' : 'polite'}
      className={cn(
        variant === 'fixed'
          ? 'pointer-events-none fixed inset-x-3 top-3 z-[100] flex justify-center sm:inset-x-auto sm:right-4 sm:top-4 sm:block'
          : 'pointer-events-none absolute inset-x-3 top-3 z-20 flex justify-center',
      )}
    >
      <div
        className={cn(
          'wellstudio-admin-toast pointer-events-auto w-full max-w-[24rem] rounded-[1.2rem] border bg-white/96 p-3.5 shadow-[0_18px_52px_rgba(18,20,24,0.16)] backdrop-blur-xl',
          copy.tone === 'success'
            ? 'border-[color:color-mix(in_srgb,#5ba774_34%,white)]'
            : 'border-[color:color-mix(in_srgb,var(--destructive)_34%,white)]',
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full',
              copy.tone === 'success'
                ? 'bg-[color:color-mix(in_srgb,#5ba774_14%,white)] text-[#3f7d57]'
                : 'bg-[color:color-mix(in_srgb,var(--destructive)_10%,white)] text-destructive',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--wellstudio-ink)]">{copy.title}</p>
            <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              {copy.description}
            </p>
            {shouldRenderOverrideHistoryLink(state, copy.tone) ? (
              <a
                href="#admin-override-history"
                className="mt-2 inline-flex text-xs font-medium uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:underline"
              >
                Ver historial
              </a>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="-mr-1 -mt-1 shrink-0 rounded-full"
            onClick={() => setIsVisible(false)}
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Cerrar notificación</span>
          </Button>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}

function shouldRenderOverrideHistoryLink(
  state: Exclude<AdminOperationToastState, null>,
  tone: 'success' | 'error',
) {
  return tone === 'success' && ['extra', 'session', 'revoked'].includes(state)
}
