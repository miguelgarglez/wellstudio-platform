'use client'

import { useActionState, useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CircleAlert,
  Clock3,
  ListOrdered,
  ShieldAlert,
  TicketCheck,
  UserRoundCheck,
} from 'lucide-react'

import {
  manageAdminMemberBookingAction,
  type AdminMemberBookingActionState,
} from '@/app/(admin)/admin/members/actions'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import type { AdminMemberDetail } from '@/modules/admin/server/admin-members-overview'
import { cn } from '@/lib/utils'

type UpcomingReservation = NonNullable<AdminMemberDetail['bookingWorkspace']>['upcomingReservations'][number]

export function AdminMemberBookingActions({
  member,
  returnTo,
}: {
  member: AdminMemberDetail
  returnTo: string
}) {
  const [open, setOpen] = useState(false)
  const [reservationToCancel, setReservationToCancel] = useState<UpcomingReservation | null>(null)
  const [cancelState, cancelAction] = useActionState<AdminMemberBookingActionState, FormData>(
    manageAdminMemberBookingAction,
    null,
  )
  const workspace = member.bookingWorkspace

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="rounded-full"
        onClick={() => setOpen(true)}
        disabled={!workspace}
      >
        <CalendarClock className="size-4" aria-hidden="true" />
        Gestionar agenda
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:max-w-none sm:data-[side=right]:w-[min(100vw,52rem)] sm:data-[side=right]:max-w-[52rem]">
          <SheetHeader className="border-b border-border/70 bg-white/94 px-5 py-5 sm:px-7">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
              Operación asistida
            </p>
            <SheetTitle className="font-display text-3xl uppercase tracking-[0.03em] sm:text-4xl">
              Agenda de {member.displayName}
            </SheetTitle>
            <SheetDescription className="max-w-xl">
              Reserva o gestiona una waitlist con las mismas reglas del socio. Las acciones quedan asociadas a tu usuario.
            </SheetDescription>
          </SheetHeader>

          {workspace ? (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
              <BookingState member={member} />

              <section className="mt-6" aria-labelledby="staff-current-bookings">
                <SectionHeading
                  id="staff-current-bookings"
                  icon={CalendarCheck}
                  title="Actividad en curso"
                  description="Cancela una plaza futura o retira al socio de una waitlist activa."
                />
                <div className="mt-3 space-y-3">
                  {workspace.upcomingReservations.map((reservation) => (
                    <article
                      key={reservation.id}
                      className="rounded-[1.2rem] border border-border/75 bg-white p-4 shadow-[0_12px_26px_rgba(20,24,30,0.04)]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
                          <UserRoundCheck className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className="font-medium text-[var(--wellstudio-ink)]">{reservation.className}</h4>
                            <StatusPill>Reserva confirmada</StatusPill>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {reservation.dateLabel} · {reservation.timeLabel}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {[reservation.coachName, reservation.locationLabel].filter(Boolean).join(' · ') || 'Sin contexto adicional'}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 rounded-full border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive"
                            onClick={() => setReservationToCancel(reservation)}
                          >
                            Cancelar en nombre del socio
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {workspace.activeWaitlists.map((entry) => (
                    <article key={entry.id} className="rounded-[1.2rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_24%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_3%,white)] p-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)]">
                          <ListOrdered className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className="font-medium text-[var(--wellstudio-ink)]">{entry.className}</h4>
                            <StatusPill>{entry.positionLabel ?? 'Waitlist activa'}</StatusPill>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{entry.dateLabel} · {entry.timeLabel}</p>
                          <StaffOperationForm
                            operation="leave-waitlist"
                            memberId={member.id}
                            returnTo={returnTo}
                            waitlistEntryId={entry.id}
                            label="Retirar de waitlist"
                            variant="outline"
                            className="mt-3"
                          />
                        </div>
                      </div>
                    </article>
                  ))}

                  {workspace.upcomingReservations.length === 0 && workspace.activeWaitlists.length === 0 ? (
                    <InlineEmpty text="El socio no tiene reservas futuras ni waitlists activas." />
                  ) : null}
                </div>
              </section>

              <section className="mt-7 border-t border-border/70 pt-6" aria-labelledby="staff-booking-candidates">
                <SectionHeading
                  id="staff-booking-candidates"
                  icon={CalendarClock}
                  title="Próximas sesiones"
                  description="Solo aparecen sesiones publicadas. La acción refleja aforo y elegibilidad actuales."
                />

                <div className="mt-4 space-y-5">
                  {workspace.schedulePreview.map((day) => {
                    const sessions = day.sessions.filter(
                      (session) => session.primaryAction.kind !== 'already-booked' && session.primaryAction.kind !== 'already-waitlisted',
                    )
                    if (sessions.length === 0) return null

                    return (
                      <div key={day.id}>
                        <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
                          {day.dateLabel}
                        </h4>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          {sessions.map((session) => (
                            <SessionCandidate
                              key={session.id}
                              session={session}
                              memberId={member.id}
                              returnTo={returnTo}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {workspace.schedulePreview.length === 0 ? (
                    <InlineEmpty text="No hay sesiones publicadas en los próximos días." />
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(reservationToCancel)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setReservationToCancel(null)
        }}
      >
        <AlertDialogContent className="overflow-hidden border border-destructive/16 bg-[#fbf8f2] p-0 sm:max-w-lg">
          <form action={cancelAction}>
            <div className="p-5 sm:p-6">
              <AlertDialogHeader className="place-items-start text-left">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-destructive/8 text-destructive">
                  <ShieldAlert className="size-5" aria-hidden="true" />
                </span>
                <AlertDialogTitle className="mt-3 text-2xl">Cancelar una reserva asistida</AlertDialogTitle>
                <AlertDialogDescription className="mt-2 text-left leading-6">
                  Puedes superar la ventana del socio porque actúas como centro. Se liberará la plaza, se devolverán créditos si aplica y se reevaluará la waitlist.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {reservationToCancel ? (
                <div className="mt-4 rounded-[1.15rem] border border-destructive/14 bg-white/74 p-4">
                  <p className="font-medium text-[var(--wellstudio-ink)]">{reservationToCancel.className}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {reservationToCancel.dateLabel} · {reservationToCancel.timeLabel}
                  </p>
                </div>
              ) : null}

              <input type="hidden" name="operation" value="cancel" />
              <input type="hidden" name="memberId" value={member.id} />
              <input type="hidden" name="reservationId" value={reservationToCancel?.id ?? ''} />
              <input type="hidden" name="returnTo" value={returnTo} />

              <div className="mt-4">
                <label htmlFor="staff-cancellation-reason" className="text-sm font-medium text-[var(--wellstudio-ink)]">
                  Motivo
                </label>
                <textarea
                  id="staff-cancellation-reason"
                  name="reason"
                  required
                  minLength={5}
                  maxLength={240}
                  rows={4}
                  placeholder="Ej. incidencia comunicada por teléfono…"
                  className="mt-2 w-full resize-none rounded-[1.1rem] border border-input bg-white px-4 py-3 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
                />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">El motivo y tu identidad quedan en auditoría.</p>
                {cancelState?.message ? (
                  <p role="alert" className="mt-2 text-sm text-destructive">{cancelState.message}</p>
                ) : null}
              </div>
            </div>

            <AlertDialogFooter className="m-0 rounded-none border-t border-border/70 bg-white/72 px-5 py-4 sm:px-6">
              <AlertDialogCancel>Volver</AlertDialogCancel>
              <CancelSubmitButton />
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function BookingState({ member }: { member: AdminMemberDetail }) {
  const state = member.bookingWorkspace?.bookingState
  if (!state) return null

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-[1.2rem] border p-4',
      state.canBook
        ? 'border-[color:color-mix(in_srgb,#5ba774_22%,white)] bg-[color:color-mix(in_srgb,#5ba774_7%,white)]'
        : 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)]',
    )}>
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white/86 text-[var(--wellstudio-blue-deep)]">
        {state.canBook ? <CalendarCheck className="size-4" aria-hidden="true" /> : <CircleAlert className="size-4" aria-hidden="true" />}
      </span>
      <div>
        <p className="font-medium text-[var(--wellstudio-ink)]">{state.advisoryLabel}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{state.description}</p>
      </div>
    </div>
  )
}

function SessionCandidate({
  session,
  memberId,
  returnTo,
}: {
  session: NonNullable<AdminMemberDetail['bookingWorkspace']>['schedulePreview'][number]['sessions'][number]
  memberId: string
  returnTo: string
}) {
  const action = session.primaryAction
  const isActionable = action.kind === 'book' || action.kind === 'join-waitlist'

  return (
    <article className={cn(
      'flex min-h-48 flex-col rounded-[1.2rem] border p-4',
      isActionable
        ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-white shadow-[0_12px_28px_rgba(20,24,30,0.04)]'
        : 'border-border/70 bg-white/55',
    )}>
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]">
          <Clock3 className="size-4" aria-hidden="true" />
        </span>
        <StatusPill>{session.availabilityLabel}</StatusPill>
      </div>
      <h5 className="mt-3 font-medium text-[var(--wellstudio-ink)]">{session.className}</h5>
      <p className="mt-1 text-sm text-muted-foreground">{session.timeLabel}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {[session.coachName, session.locationLabel].filter(Boolean).join(' · ') || session.framingLabel}
      </p>
      <div className="mt-auto pt-4">
        {isActionable ? (
          <StaffOperationForm
            operation={action.kind === 'book' ? 'reserve' : 'join-waitlist'}
            memberId={memberId}
            returnTo={returnTo}
            classSessionId={session.id}
            label={action.kind === 'book' ? 'Reservar para el socio' : 'Añadir a waitlist'}
          />
        ) : (
          <div>
            <p className="text-xs leading-5 text-muted-foreground">{action.description ?? action.label}</p>
            <Link
              href={`/admin/overrides?member=${encodeURIComponent(memberId)}&session=${encodeURIComponent(session.id)}`}
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-3 w-full rounded-full' })}
            >
              <TicketCheck className="size-3.5" aria-hidden="true" />
              Revisar excepción
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}

function StaffOperationForm({
  operation,
  memberId,
  returnTo,
  classSessionId,
  waitlistEntryId,
  label,
  variant = 'default',
  className,
}: {
  operation: 'reserve' | 'join-waitlist' | 'leave-waitlist'
  memberId: string
  returnTo: string
  classSessionId?: string
  waitlistEntryId?: string
  label: string
  variant?: 'default' | 'outline'
  className?: string
}) {
  const [state, action] = useActionState<AdminMemberBookingActionState, FormData>(
    manageAdminMemberBookingAction,
    null,
  )

  return (
    <form action={action} className={className}>
      <input type="hidden" name="operation" value={operation} />
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {classSessionId ? <input type="hidden" name="classSessionId" value={classSessionId} /> : null}
      {waitlistEntryId ? <input type="hidden" name="waitlistEntryId" value={waitlistEntryId} /> : null}
      <StaffSubmitButton label={label} variant={variant} />
      {state?.message ? <p role="alert" className="mt-2 text-xs leading-5 text-destructive">{state.message}</p> : null}
    </form>
  )
}

function StaffSubmitButton({ label, variant }: { label: string; variant: 'default' | 'outline' }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="sm" variant={variant} className="w-full rounded-full" disabled={pending}>
      {pending ? <><Spinner data-icon="inline-start" />Procesando…</> : <>{label}<ArrowRight className="size-3.5" aria-hidden="true" /></>}
    </Button>
  )
}

function CancelSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="destructive" disabled={pending} data-slot="alert-dialog-action">
      {pending ? <><Spinner data-icon="inline-start" />Cancelando…</> : 'Confirmar cancelación'}
    </Button>
  )
}

function SectionHeading({
  id,
  icon: Icon,
  title,
  description,
}: {
  id: string
  icon: typeof CalendarCheck
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <h3 id={id} className="text-lg font-medium text-[var(--wellstudio-ink)]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_15%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--wellstudio-blue-deep)]">
      {children}
    </span>
  )
}

function InlineEmpty({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[1.1rem] border border-dashed border-border/75 p-4 text-sm text-muted-foreground">
      <CalendarClock className="size-4 shrink-0 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />
      {text}
    </div>
  )
}
