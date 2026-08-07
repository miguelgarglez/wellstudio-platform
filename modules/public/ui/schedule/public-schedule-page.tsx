import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock3, MapPin, UserRound, UsersRound } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { PublicScheduleSession, PublicSessionAvailability } from '@/modules/public/server/public-schedule'
import { PublicScheduleShell } from '@/modules/public/ui/schedule/public-schedule-shell'

type PublicSchedule = {
  fromIso: string
  untilIso: string
  sessionCount: number
  groups: Array<{
    key: string
    weekday: string
    dateLabel: string
    sessions: PublicScheduleSession[]
  }>
}

export function PublicSchedulePage({ schedule }: { schedule: PublicSchedule }) {
  return (
    <PublicScheduleShell>
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <header className="grid gap-8 border-b border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,var(--border))] pb-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.55fr)] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Agenda pública</p>
            <h1 className="mt-4 max-w-4xl text-balance font-display text-[3.5rem] uppercase leading-[0.9] tracking-[0.025em] text-[var(--wellstudio-ink)] sm:text-[5rem] lg:text-[6.4rem]">
              Encuentra tu próxima sesión
            </h1>
          </div>
          <div className="rounded-[1.5rem] border border-white/75 bg-white/62 p-5 shadow-[0_18px_48px_rgba(17,19,22,0.055)] backdrop-blur">
            <p className="text-sm leading-7 text-muted-foreground">
              Horarios reales publicados por el equipo para los próximos 30 días. La reserva se completa de forma segura desde el portal de socios.
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--wellstudio-blue-deep)]">
              <CalendarDays className="size-4" aria-hidden="true" />
              {schedule.sessionCount} {schedule.sessionCount === 1 ? 'sesión disponible' : 'sesiones disponibles'}
            </p>
          </div>
        </header>

        {schedule.groups.length ? (
          <div className="mt-10 space-y-5">
            {schedule.groups.map((group) => (
              <section
                key={group.key}
                aria-labelledby={`schedule-${group.key}`}
                className="grid gap-4 rounded-[1.65rem] border border-white/75 bg-white/70 p-4 shadow-[0_20px_55px_rgba(17,19,22,0.055)] backdrop-blur sm:p-5 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-6"
              >
                <header className="lg:sticky lg:top-28 lg:self-start">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">{group.weekday}</p>
                  <h2 id={`schedule-${group.key}`} className="mt-1 font-display text-3xl uppercase leading-none text-[var(--wellstudio-ink)]">
                    {group.dateLabel}
                  </h2>
                </header>
                <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_72%,white)]">
                  {group.sessions.map((session) => <PublicSessionRow key={session.id} session={session} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <PublicScheduleEmptyState />
        )}

        <section className="mt-10 overflow-hidden rounded-[1.8rem] bg-[var(--wellstudio-ink)] px-6 py-8 text-white shadow-[0_26px_70px_rgba(17,19,22,0.14)] sm:px-8 sm:py-10 lg:flex lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-soft)]">Tu plaza, desde el portal</p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">¿Ya entrenas con nosotros?</h2>
            <p className="mt-4 text-sm leading-7 text-white/68">Accede para consultar tu elegibilidad, reservar una plaza o entrar en lista de espera.</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Link href="/login?redirectTo=/app/reservations" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--wellstudio-blue)] px-6 text-sm font-medium transition hover:bg-[var(--wellstudio-blue-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
              Acceder y reservar <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-full border border-white/18 bg-white/6 px-6 text-sm font-medium transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
              Crear cuenta
            </Link>
          </div>
        </section>
      </div>
    </PublicScheduleShell>
  )
}

function PublicSessionRow({ session }: { session: PublicScheduleSession }) {
  const startsAt = new Date(session.startsAtIso)
  const endsAt = new Date(session.endsAtIso)

  return (
    <Link
      href={`/classes/${session.id}`}
      className="group grid min-w-0 gap-4 py-5 first:pt-1 last:pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)] sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center sm:rounded-[1rem] sm:px-3 sm:first:pt-3 sm:last:pb-3"
      aria-label={`${session.classTypeName}, ${formatTime(startsAt)}, ${session.availabilityLabel}`}
    >
      <div className="flex items-center gap-2 text-[var(--wellstudio-blue-deep)]">
        <Clock3 className="size-4" aria-hidden="true" />
        <span className="font-medium tabular-nums">{formatTime(startsAt)}–{formatTime(endsAt)}</span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-[var(--wellstudio-ink)]">{session.classTypeName}</h3>
          {session.category ? <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{session.category}</span> : null}
        </div>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><UserRound className="size-3.5" aria-hidden="true" />{session.coachName}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden="true" />{session.locationLabel}</span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <AvailabilityBadge availability={session.availability}>{session.availabilityLabel}</AvailabilityBadge>
        <ArrowRight className="size-4 text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </Link>
  )
}

export function AvailabilityBadge({ availability, children }: { availability: PublicSessionAvailability; children: React.ReactNode }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
      availability === 'available' && 'border-emerald-700/14 bg-emerald-50 text-emerald-800',
      availability === 'last-places' && 'border-amber-700/16 bg-amber-50 text-amber-900',
      availability === 'waitlist' && 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] text-[var(--wellstudio-blue-deep)]',
      availability === 'full' && 'border-border bg-muted/50 text-muted-foreground',
    )}>
      <UsersRound className="size-3.5" aria-hidden="true" />{children}
    </span>
  )
}

function PublicScheduleEmptyState() {
  return (
    <section className="mt-10 grid min-h-[24rem] place-items-center rounded-[1.7rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,var(--border))] bg-white/60 p-8 text-center">
      <div className="max-w-lg">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]"><CalendarDays aria-hidden="true" /></span>
        <h2 className="mt-5 font-display text-4xl uppercase">Estamos preparando los próximos horarios</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">El equipo todavía no ha publicado sesiones para esta ventana. Puedes contactarnos para conocer la próxima disponibilidad.</p>
        <Link href="/#contacto" className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[var(--wellstudio-blue)] px-5 text-sm font-medium text-[var(--wellstudio-blue-deep)] hover:bg-white">Contactar con el equipo</Link>
      </div>
    </section>
  )
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(date)
}
