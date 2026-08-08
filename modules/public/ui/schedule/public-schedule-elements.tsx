import Link from 'next/link'
import { ArrowRight, Clock3, MapPin, UserRound, UsersRound } from 'lucide-react'

import { cn } from '@/lib/utils'
import type {
  PublicScheduleSession,
  PublicSessionAvailability,
} from '@/modules/public/server/public-schedule'

export function PublicSessionRow({ session }: { session: PublicScheduleSession }) {
  const startsAt = new Date(session.startsAtIso)
  const endsAt = new Date(session.endsAtIso)

  return (
    <Link
      href={`/classes/${session.id}`}
      className="group grid min-w-0 gap-4 py-5 first:pt-1 last:pb-1 focus-visible:rounded-[1rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)] sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center sm:rounded-[1rem] sm:px-3 sm:first:pt-3 sm:last:pb-3"
      aria-label={`${session.classTypeName}, ${formatTime(startsAt)}, ${session.availabilityLabel}`}
    >
      <div className="flex items-center gap-2 text-[var(--wellstudio-blue-deep)]">
        <Clock3 className="size-4" aria-hidden="true" />
        <span className="font-medium tabular-nums">
          {formatTime(startsAt)}–{formatTime(endsAt)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-[var(--wellstudio-ink)]">{session.classTypeName}</h3>
          {session.category ? (
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {session.category}
            </span>
          ) : null}
        </div>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5" aria-hidden="true" />
            {session.coachName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden="true" />
            {session.locationLabel}
          </span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <AvailabilityBadge availability={session.availability}>
          {session.availabilityLabel}
        </AvailabilityBadge>
        <ArrowRight
          className="size-4 text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </div>
    </Link>
  )
}

export function AvailabilityBadge({
  availability,
  children,
}: {
  availability: PublicSessionAvailability
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
        availability === 'available' &&
          'border-emerald-700/14 bg-emerald-50 text-emerald-800',
        availability === 'last-places' &&
          'border-amber-700/16 bg-amber-50 text-amber-900',
        availability === 'waitlist' &&
          'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] text-[var(--wellstudio-blue-deep)]',
        availability === 'full' && 'border-border bg-muted/50 text-muted-foreground',
      )}
    >
      <UsersRound className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  )
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(date)
}
