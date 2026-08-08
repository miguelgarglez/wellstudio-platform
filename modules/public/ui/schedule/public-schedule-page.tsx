import Link from 'next/link'
import { ArrowRight, CalendarDays } from 'lucide-react'

import type { PublicScheduleFilters } from '@/modules/public/lib/public-schedule-filters'
import type { PublicScheduleSession } from '@/modules/public/server/public-schedule'
import { PublicContentShell } from '@/modules/public/ui/public-content-shell'
import { PublicScheduleExplorer } from '@/modules/public/ui/schedule/public-schedule-explorer'

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

export function PublicSchedulePage({
  schedule,
  initialFilters,
}: {
  schedule: PublicSchedule
  initialFilters: PublicScheduleFilters
}) {
  return (
    <PublicContentShell>
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
          <PublicScheduleExplorer groups={schedule.groups} initialFilters={initialFilters} />
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
    </PublicContentShell>
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
