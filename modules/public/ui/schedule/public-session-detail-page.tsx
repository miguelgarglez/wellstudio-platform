import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, MapPin, ShieldCheck, UserRound, UsersRound } from 'lucide-react'

import type { PublicScheduleSession } from '@/modules/public/server/public-schedule'
import { AvailabilityBadge } from '@/modules/public/ui/schedule/public-schedule-elements'
import { PublicContentShell } from '@/modules/public/ui/public-content-shell'

export function PublicSessionDetailPage({ session }: { session: PublicScheduleSession }) {
  const startsAt = new Date(session.startsAtIso)
  const endsAt = new Date(session.endsAtIso)

  return (
    <PublicContentShell>
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-18">
        <Link href="/classes" className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)]">
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver a la agenda
        </Link>

        <article className="mt-6 overflow-hidden rounded-[2rem] border border-white/75 bg-white/72 shadow-[0_28px_90px_rgba(17,19,22,0.09)] backdrop-blur">
          <header className="grid gap-8 border-b border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,var(--border))] px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">{session.category ?? 'Sesión WellStudio'}</p>
                <AvailabilityBadge availability={session.availability}>{session.availabilityLabel}</AvailabilityBadge>
              </div>
              <h1 className="mt-5 text-balance font-display text-[3.7rem] uppercase leading-[0.9] tracking-[0.025em] text-[var(--wellstudio-ink)] sm:text-[5rem] lg:text-[6rem]">{session.classTypeName}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                {session.description ?? 'Una sesión guiada con la metodología WellStudio, seguimiento profesional y un grupo reducido.'}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--wellstudio-ink)] p-5 text-white shadow-[0_20px_55px_rgba(17,19,22,0.16)] sm:min-w-64">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-soft)]">Fecha y hora</p>
              <p className="mt-3 font-display text-3xl uppercase leading-none">{formatDate(startsAt)}</p>
              <p className="mt-3 text-lg font-medium tabular-nums">{formatTime(startsAt)}–{formatTime(endsAt)}</p>
            </div>
          </header>

          <div className="grid gap-8 px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section aria-labelledby="session-context-title">
              <h2 id="session-context-title" className="font-display text-3xl uppercase">Todo lo necesario antes de reservar</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DetailItem icon={CalendarDays} label="Día" value={formatLongDate(startsAt)} />
                <DetailItem icon={Clock3} label="Duración" value={`${session.durationMinutes} minutos`} />
                <DetailItem icon={UserRound} label="Coach" value={session.coachName} />
                <DetailItem icon={MapPin} label="Ubicación" value={session.locationLabel} />
                <DetailItem icon={UsersRound} label="Formato" value={`Grupo de hasta ${session.capacity} personas`} />
                <DetailItem icon={ShieldCheck} label="Disponibilidad" value={availabilityExplanation(session)} />
              </div>

              <div className="mt-7 rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] p-5">
                <p className="font-medium text-[var(--wellstudio-ink)]">Disponibilidad en tiempo real</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">Las plazas se confirman dentro del portal, donde comprobamos tu plan o créditos antes de reservar. Esta página pública no bloquea plazas.</p>
              </div>
            </section>

            <aside className="self-start rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] bg-white p-5 shadow-[0_16px_44px_rgba(17,19,22,0.06)] lg:sticky lg:top-28">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">Siguiente paso</p>
              <h2 className="mt-3 text-xl font-medium text-[var(--wellstudio-ink)]">Reserva desde tu cuenta</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">Accede para comprobar tu plan o créditos y completar la reserva o la lista de espera.</p>
              <Link href="/login?redirectTo=/app/reservations" className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--wellstudio-blue)] px-5 text-sm font-medium text-white transition hover:bg-[var(--wellstudio-blue-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)] focus-visible:ring-offset-2">
                Acceder y reservar <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/register" className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full border border-border px-5 text-sm font-medium hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)]">
                Crear cuenta
              </Link>
              <Link href="/#contacto" className="mt-4 block text-center text-sm text-muted-foreground underline-offset-4 hover:text-[var(--wellstudio-blue-deep)] hover:underline">Tengo una duda antes de empezar</Link>
            </aside>
          </div>
        </article>
      </div>
    </PublicContentShell>
  )
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-white/72 p-4">
      <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]"><Icon className="size-4" aria-hidden="true" />{label}</span>
      <p className="mt-3 text-sm font-medium leading-6 text-[var(--wellstudio-ink)]">{value}</p>
    </div>
  )
}

function availabilityExplanation(session: PublicScheduleSession) {
  if (session.availability === 'waitlist') return 'Completa; admite lista de espera'
  if (session.availability === 'full') return 'Completa; sin lista de espera'
  return session.availabilityLabel
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }).format(date)
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' }).format(date)
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(date)
}
