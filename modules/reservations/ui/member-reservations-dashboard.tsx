import Link from 'next/link'
import {
  BadgeAlert,
  CalendarDays,
  CircleAlert,
  Clock3,
  MapPin,
  MoveUpRight,
  ShieldCheck,
  ShieldX,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

import { buttonVariants } from '@/components/ui/button-variants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { ReservationMutationResult } from '@/modules/reservations/server/member-reservation-mutations'
import type {
  MemberReservationsOverview,
  ReservationActionTone,
  ReservationHistoryRow,
  SchedulePreviewSession,
  UpcomingReservationRow,
  WaitlistReservationRow,
} from '@/modules/reservations/server/member-reservations-overview'
import { ReservationConfirmationAction } from '@/modules/reservations/ui/reservation-confirmation-action'

type ReservationServerAction = (
  previousState: ReservationMutationResult | null,
  formData: FormData,
) => Promise<ReservationMutationResult>

type MemberReservationsDashboardProps = {
  overview: MemberReservationsOverview
  actions: {
    reserve: ReservationServerAction
    cancel: ReservationServerAction
    joinWaitlist: ReservationServerAction
    leaveWaitlist: ReservationServerAction
  }
}

export function MemberReservationsDashboard({
  overview,
  actions,
}: MemberReservationsDashboardProps) {
  return (
    <section className="space-y-5 lg:space-y-6">
      <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white py-0 shadow-none">
        <CardContent className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--wellstudio-blue-deep)]">
                Reservas
              </p>
              <div className="flex flex-col gap-2.5 sm:gap-3 xl:max-w-4xl">
                <h1 className="font-display text-[2.15rem] uppercase leading-[0.92] tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-5xl sm:leading-none lg:text-[3.4rem]">
                  {overview.introTitle}
                </h1>
                <p className="max-w-3xl text-[0.98rem] leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] sm:text-lg sm:leading-8">
                  {overview.introDescription}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {overview.summaryLabels.map((label, index) => (
                <InfoPill
                  key={label}
                  className={cn(index > 0 ? 'hidden sm:inline-flex' : undefined)}
                >
                  {label}
                </InfoPill>
              ))}
            </div>

            <div className="sm:hidden">
              <Link
                href="#agenda-futura"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Ver agenda futura
                <MoveUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
                Desde esta pantalla ya puedes reservar, cancelar dentro de ventana y
                gestionar tu waitlist sin salir del portal privado.
              </p>
              <Link
                href="#agenda-futura"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full sm:w-auto',
                )}
              >
                Ver agenda futura
                <MoveUpRight data-icon="inline-end" />
              </Link>
            </div>

            {!overview.bookingState.canBook ? (
              <div className="hidden rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-5 py-4 sm:block sm:px-6">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)]">
                    <CircleAlert className="size-4" aria-hidden="true" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
                      {overview.bookingState.advisoryLabel}
                    </p>
                    <p className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
                      {overview.bookingState.description}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(320px,0.92fr)] xl:gap-5">
        <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none">
          <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                Próximas reservas
              </p>
              <CardTitle className="text-[1.95rem] leading-none text-[var(--wellstudio-ink)]">
                Tu actividad confirmada
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-6 sm:px-7">
            {overview.upcomingReservations.length > 0 ? (
              <div className="grid gap-3">
                {overview.upcomingReservations.map((reservation) => (
                  <UpcomingReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    cancelAction={actions.cancel}
                  />
                ))}
              </div>
            ) : (
              <EmptyReservationState />
            )}
          </CardContent>
        </Card>

        {overview.activeWaitlists.length > 0 ? (
          <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none">
            <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-6 py-6 sm:px-7">
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                  Waitlist activa
                </p>
                <CardTitle className="text-2xl text-[var(--wellstudio-ink)]">
                  Tu waitlist en curso
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 px-6 py-6 sm:px-7">
              {overview.activeWaitlists.map((waitlist) => (
                <WaitlistCard
                  key={waitlist.id}
                  waitlist={waitlist}
                  leaveWaitlistAction={actions.leaveWaitlist}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card
        id="agenda-futura"
        className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none"
      >
        <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-6 py-6 sm:px-7">
          {!overview.bookingState.canBook ? (
            <div className="mb-4 rounded-[1.4rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-4 py-3 sm:hidden">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)]">
                  <CircleAlert className="size-4" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
                    {overview.bookingState.advisoryLabel}
                  </p>
                  <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
                    {overview.bookingState.description}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
              Agenda futura
            </p>
            <CardTitle className="text-[1.95rem] leading-none text-[var(--wellstudio-ink)]">
              Sesiones publicadas para organizarte
            </CardTitle>
          </div>
          <p className="max-w-3xl pt-2 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
            Aquí ves plazas reales y el siguiente gesto disponible en cada sesión:
            reservar, entrar en waitlist o detectar el bloqueo antes de intentarlo.
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 px-6 py-6 sm:px-7">
          {overview.schedulePreview.length > 0 ? (
            overview.schedulePreview.map((day) => (
              <div key={day.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
                    {day.dateLabel}
                  </p>
                  <span className="text-xs text-[color:color-mix(in_srgb,var(--foreground)_66%,white)]">
                    {day.sessions.length}{' '}
                    {day.sessions.length === 1 ? 'sesión publicada' : 'sesiones publicadas'}
                  </span>
                </div>
                <div className="grid gap-3">
                  {day.sessions.map((session) => (
                    <ScheduleSessionCard
                      key={session.id}
                      session={session}
                      reserveAction={actions.reserve}
                      joinWaitlistAction={actions.joinWaitlist}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[color:color-mix(in_srgb,var(--border)_78%,white)] px-5 py-6 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              Todavía no hay sesiones publicadas en la agenda próxima.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none">
        <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
              Historial reciente
            </p>
            <CardTitle className="text-[1.95rem] leading-none text-[var(--wellstudio-ink)]">
              Seguimiento de tus últimas sesiones
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6 sm:px-7">
          {overview.recentHistory.length > 0 ? (
            <div className="grid gap-2">
              {overview.recentHistory.map((entry, index) => (
                <div key={entry.id} className="space-y-2">
                  {index > 0 ? (
                    <Separator className="bg-[color:color-mix(in_srgb,var(--border)_74%,white)]" />
                  ) : null}
                  <HistoryRow entry={entry} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[color:color-mix(in_srgb,var(--border)_78%,white)] px-5 py-6 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              Cuando completes tus primeras sesiones, aquí verás el registro reciente
              de asistencias, cancelaciones y no-shows.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function UpcomingReservationCard({
  reservation,
  cancelAction,
}: {
  reservation: UpcomingReservationRow
  cancelAction: ReservationServerAction
}) {
  return (
    <div className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-white px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
            Reserva confirmada
          </p>
          <div className="space-y-1.5">
            <p className="text-xl font-medium text-[var(--wellstudio-ink)]">
              {reservation.className}
            </p>
            <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              {reservation.dateLabel} · {reservation.timeLabel}
            </p>
          </div>
        </div>
        <InfoPill>{reservation.availabilityLabel}</InfoPill>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] sm:grid-cols-2">
        <MetaLine
          icon={UserRound}
          label={reservation.coachName ? `Coach · ${reservation.coachName}` : 'Coach pendiente'}
        />
        <MetaLine
          icon={MapPin}
          label={reservation.locationLabel ?? 'Ubicación por confirmar'}
        />
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-[color:color-mix(in_srgb,var(--card)_68%,white)] px-4 py-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full',
              reservation.cancellationTone === 'allowed'
                ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] text-[var(--wellstudio-blue-deep)]'
                : 'bg-[color:color-mix(in_srgb,var(--wellstudio-ink)_10%,white)] text-[var(--wellstudio-ink)]',
            )}
          >
            <Clock3 className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
              {reservation.cancellationLabel}
            </p>
            <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
              Ventana activa de cancelación para esta sesión.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
          {reservation.canCancel
            ? 'Si cancelas ahora, la plaza se liberará y la waitlist se reevaluará.'
            : 'La cancelación ya está fuera de ventana.'}
        </p>
        {reservation.canCancel ? (
          <ReservationConfirmationAction
            action={cancelAction}
            fields={{ reservationId: reservation.id }}
            triggerLabel="Cancelar reserva"
            dialogTitle="Cancelar esta reserva"
            dialogDescription={reservation.confirmCopy}
            confirmLabel="Cancelar"
            pendingLabel="Cancelando"
            confirmVariant="destructive"
            triggerClassName="w-full sm:w-auto"
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="w-full sm:w-auto"
          >
            Cancelación cerrada
          </Button>
        )}
      </div>
    </div>
  )
}

function WaitlistCard({
  waitlist,
  leaveWaitlistAction,
}: {
  waitlist: WaitlistReservationRow
  leaveWaitlistAction: ReservationServerAction
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-white px-5 py-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
              {waitlist.positionLabel ?? 'Waitlist activa'}
            </p>
            <div className="space-y-1.5">
              <p className="text-lg font-medium text-[var(--wellstudio-ink)]">
                {waitlist.className}
              </p>
              <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                {waitlist.dateLabel} · {waitlist.timeLabel}
              </p>
            </div>
          </div>
          <InfoPill>{waitlist.availabilityLabel}</InfoPill>
        </div>
        <div className="grid gap-2 text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
          <MetaLine
            icon={UserRound}
            label={waitlist.coachName ? `Coach · ${waitlist.coachName}` : 'Coach pendiente'}
          />
          {waitlist.locationLabel ? (
            <MetaLine icon={MapPin} label={waitlist.locationLabel} />
          ) : null}
        </div>
        {waitlist.canLeave ? (
          <div className="flex justify-end">
            <ReservationConfirmationAction
              action={leaveWaitlistAction}
              fields={{ waitlistEntryId: waitlist.id }}
              triggerLabel="Salir de waitlist"
              dialogTitle="Salir de esta waitlist"
              dialogDescription={waitlist.confirmCopy}
              confirmLabel="Salir"
              pendingLabel="Saliendo"
              triggerVariant="outline"
              confirmVariant="destructive"
              triggerClassName="w-full sm:w-auto"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ScheduleSessionCard({
  session,
  reserveAction,
  joinWaitlistAction,
}: {
  session: SchedulePreviewSession
  reserveAction: ReservationServerAction
  joinWaitlistAction: ReservationServerAction
}) {
  return (
    <div className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-white px-5 py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-lg font-medium text-[var(--wellstudio-ink)]">
            {session.className}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
            <span>{session.timeLabel}</span>
            {session.coachName ? <span>Coach · {session.coachName}</span> : null}
            {session.locationLabel ? <span>{session.locationLabel}</span> : null}
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <InfoPill>{session.availabilityLabel}</InfoPill>
          <span className="text-xs uppercase tracking-[0.18em] text-[color:color-mix(in_srgb,var(--foreground)_66%,white)]">
            {session.framingLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
          {session.primaryAction.description ?? 'La sesión refleja ya su estado operativo actual.'}
        </p>
        <ScheduleActionButton
          session={session}
          reserveAction={reserveAction}
          joinWaitlistAction={joinWaitlistAction}
        />
      </div>
    </div>
  )
}

function ScheduleActionButton({
  session,
  reserveAction,
  joinWaitlistAction,
}: {
  session: SchedulePreviewSession
  reserveAction: ReservationServerAction
  joinWaitlistAction: ReservationServerAction
}) {
  switch (session.primaryAction.kind) {
    case 'book':
      return (
        <ReservationConfirmationAction
          action={reserveAction}
          fields={{ classSessionId: session.id }}
          triggerLabel="Reservar"
          dialogTitle="Confirmar reserva"
          dialogDescription={`Reservarás tu plaza para ${session.className} en el tramo ${session.timeLabel}.`}
          confirmLabel="Confirmar reserva"
          pendingLabel="Reservando"
          triggerClassName="w-full sm:w-auto"
        />
      )
    case 'join-waitlist':
      return (
        <ReservationConfirmationAction
          action={joinWaitlistAction}
          fields={{ classSessionId: session.id }}
          triggerLabel="Entrar en waitlist"
          dialogTitle="Entrar en la waitlist"
          dialogDescription={`Te unirás a la waitlist de ${session.className}. Si se libera una plaza y sigues siendo elegible, el sistema intentará promocionarte.`}
          confirmLabel="Entrar en waitlist"
          pendingLabel="Entrando"
          triggerVariant="outline"
          triggerClassName="w-full sm:w-auto"
        />
      )
    case 'already-booked':
    case 'already-waitlisted':
      return (
        <Button type="button" variant="outline" size="sm" disabled className="w-full sm:w-auto">
          {session.primaryAction.label}
        </Button>
      )
    case 'blocked':
    default:
      return (
        <Button type="button" variant="outline" size="sm" disabled className="w-full sm:w-auto">
          <BadgeAlert data-icon="inline-start" />
          {session.primaryAction.label}
        </Button>
      )
  }
}

function HistoryRow({ entry }: { entry: ReservationHistoryRow }) {
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5">
        <p className="text-base font-medium text-[var(--wellstudio-ink)]">{entry.className}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
          <span>
            {entry.dateLabel} · {entry.timeLabel}
          </span>
          {entry.coachName ? <span>Coach · {entry.coachName}</span> : null}
          {entry.locationLabel ? <span>{entry.locationLabel}</span> : null}
        </div>
      </div>
      <StatusTag tone={entry.statusTone}>{entry.statusLabel}</StatusTag>
    </div>
  )
}

function EmptyReservationState() {
  return (
    <div className="rounded-[1.65rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] px-5 py-6">
      <div className="flex flex-col gap-4">
        <span className="inline-flex size-12 items-center justify-center rounded-[1rem] bg-white text-[var(--wellstudio-blue-deep)]">
          <CalendarDays className="size-5" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <p className="text-2xl font-medium text-[var(--wellstudio-ink)]">
            Aún no tienes reservas próximas
          </p>
          <p className="max-w-2xl text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
            Cuando empieces a moverte por la agenda, aquí verás primero tus sesiones
            confirmadas y su ventana de cancelación. Mientras tanto, puedes bajar a la
            agenda publicada para orientarte.
          </p>
        </div>
        <div>
          <Link
            href="#agenda-futura"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full sm:w-auto')}
          >
            Ir a agenda publicada
            <MoveUpRight data-icon="inline-end" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function MetaLine({
  icon: Icon,
  label,
}: {
  icon: LucideIcon
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

function InfoPill({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]',
        className,
      )}
    >
      {children}
    </span>
  )
}

function StatusTag({
  children,
  tone,
}: {
  children: string
  tone: ReservationActionTone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]',
        tone === 'allowed'
          ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] text-[var(--wellstudio-blue-deep)]'
          : tone === 'blocked'
            ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-ink)_10%,white)] text-[var(--wellstudio-ink)]'
            : 'bg-[color:color-mix(in_srgb,var(--card)_35%,white)] text-[color:color-mix(in_srgb,var(--foreground)_82%,white)]',
      )}
    >
      {tone === 'allowed' ? (
        <ShieldCheck className="size-3.5" aria-hidden="true" />
      ) : tone === 'blocked' ? (
        <ShieldX className="size-3.5" aria-hidden="true" />
      ) : (
        <Sparkles className="size-3.5" aria-hidden="true" />
      )}
      {children}
    </span>
  )
}
