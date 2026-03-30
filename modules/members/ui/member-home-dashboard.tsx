import Link from 'next/link'
import { CalendarDays, CreditCard, type LucideIcon, MoveUpRight, ShieldAlert, ShieldCheck, Ticket } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type {
  MemberHomeAlert,
  MemberHomeOverview,
  UpcomingReservationItem,
  WaitlistSnapshotItem,
} from '@/modules/members/server/member-home-overview'
import { MemberInfoPopover } from '@/modules/members/ui/member-info-popover'

type MemberHomeDashboardProps = {
  overview: MemberHomeOverview
}

export function MemberHomeDashboard({ overview }: MemberHomeDashboardProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.32fr)_minmax(320px,0.88fr)] lg:gap-5">
      <Card className="order-1 overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white py-0 shadow-none">
          <CardContent className="px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--wellstudio-blue-deep)]">
                  Inicio
                </p>
                <div className="flex flex-col gap-3">
                  <h1 className="font-display text-4xl uppercase tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-5xl xl:text-6xl">
                    {overview.introTitle}
                  </h1>
                  <p className="max-w-3xl text-base leading-8 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] sm:text-lg">
                    {overview.introDescription}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Pill>{overview.summary.memberStatusLabel}</Pill>
                <Pill>{overview.activitySummaryLabel}</Pill>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/app/reservations"
                  className={cn(buttonVariants({ variant: 'default' }), 'w-full sm:w-auto')}
                >
                  Ir a Reservas
                  <MoveUpRight data-icon="inline-end" />
                </Link>
                <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
                  {overview.summary.displayName} · {overview.summary.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="order-3 overflow-visible rounded-[2rem] bg-white py-0 shadow-none lg:order-2">
          <CardHeader className="px-7 pb-3 pt-7 sm:px-8">
            <CardTitle className="text-lg text-[var(--wellstudio-ink)]">
              Snapshot comercial
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-7 pb-7 pt-3 sm:px-8">
            <SnapshotTile
              icon={ShieldCheck}
              eyebrow="Plan actual"
              title={overview.commercial.currentPlanName ?? 'Sin plan activo'}
              description={
                overview.commercial.currentPlanWindowLabel ??
                (overview.commercial.pendingPlanName
                  ? `${overview.commercial.pendingPlanName} está pendiente de activación. En cuanto pase a activa, la verás aquí como plan principal.`
                  : 'Todavía no detectamos una membresía activa en tu cuenta.')
              }
            />
            <Separator className="bg-[color:color-mix(in_srgb,var(--border)_78%,white)]" />
            <SnapshotTile
              icon={Ticket}
              eyebrow="Créditos"
              title={overview.commercial.creditsLabel}
              description={
                overview.commercial.creditsPackNames.length > 0
                  ? `Packs detectados: ${overview.commercial.creditsPackNames.join(', ')}`
                  : 'Cuando actives bonos o packs, aparecerán aquí con su saldo disponible.'
              }
            />
            <Separator className="bg-[color:color-mix(in_srgb,var(--border)_78%,white)]" />
            <SnapshotTile
              icon={CreditCard}
              eyebrow="Tarjeta"
              title={overview.commercial.linkedCardLabel}
              description={
                overview.commercial.hasLinkedCard
                  ? 'Tu método de pago ya está enlazado al área privada.'
                  : 'La vinculación de tarjeta se mostrará aquí cuando entre la capa comercial completa.'
              }
            />
          </CardContent>
        </Card>
      <Card className="order-2 overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none lg:order-3">
        <CardHeader className="flex flex-col gap-4 border-b border-[color:color-mix(in_srgb,var(--border)_70%,white)] px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
              Próximas reservas
            </p>
            <CardTitle className="text-2xl text-[var(--wellstudio-ink)]">
              Tu actividad reservada
            </CardTitle>
          </div>
          {overview.upcomingReservations.length > 0 ? (
            <Link
              href="/app/reservations"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full sm:w-auto')}
            >
              Ver Reservas
              <MoveUpRight data-icon="inline-end" />
            </Link>
          ) : null}
        </CardHeader>
        <CardContent className="px-6 py-6 sm:px-7">
          {overview.upcomingReservations.length > 0 ? (
            <div className="grid gap-3">
              {overview.upcomingReservations.map((reservation) => (
                <SessionActivityCard
                  key={reservation.id}
                  item={reservation}
                  eyebrow="Reserva confirmada"
                />
              ))}
            </div>
          ) : (
            <EmptyStateCard
              icon={CalendarDays}
              title="Aún no tienes reservas próximas"
              description="Tu home ya está preparada para devolverte contexto rápido. En cuanto empieces a reservar, aquí verás tus siguientes sesiones sin tener que entrar en la agenda completa."
            />
          )}
        </CardContent>
      </Card>

      {overview.waitlists.length > 0 ? (
        <Card className="order-4 overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none lg:col-span-1">
          <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_70%,white)] px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                Waitlist activa
              </p>
              <CardTitle className="text-xl text-[var(--wellstudio-ink)]">
                Sigues dentro del movimiento de la agenda
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 py-6 sm:px-7">
            {overview.waitlists.map((waitlist) => (
              <SessionActivityCard
                key={waitlist.id}
                item={waitlist}
                eyebrow={waitlist.positionLabel ?? 'En seguimiento'}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="order-4 flex flex-col gap-3 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--border)_70%,white)] bg-[color:color-mix(in_srgb,var(--card)_72%,white)] px-6 py-6 lg:order-4 lg:self-start lg:px-7">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
            Alertas
          </p>
          <h2 className="text-lg font-medium text-[var(--wellstudio-ink)]">
            Estado relevante ahora
          </h2>
        </div>
        <div className="flex flex-col gap-1">
          {overview.alerts.length > 0 ? (
            overview.alerts.map((alert, index) => (
              <div key={alert.kind} className="flex flex-col gap-1">
                {index > 0 ? (
                  <Separator className="bg-[color:color-mix(in_srgb,var(--border)_78%,white)]" />
                ) : null}
                <AlertCard alert={alert} />
              </div>
            ))
          ) : (
            <div className="flex items-center gap-3 py-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
                <ShieldCheck className="size-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
                  Todo en orden por ahora
                </p>
                <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                  No detectamos señales críticas en tu cuenta.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function SessionActivityCard({
  item,
  eyebrow,
}: {
  item: UpcomingReservationItem | WaitlistSnapshotItem
  eyebrow: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-white px-5 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
            {eyebrow}
          </p>
          <div className="flex flex-col gap-1.5">
            <p className="text-lg font-medium text-[var(--wellstudio-ink)]">
              {item.className}
            </p>
            <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              {item.dateLabel} · {item.timeLabel}
            </p>
          </div>
        </div>
        <Pill>{item.availabilityLabel}</Pill>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
        {item.coachName ? <span>Coach: {item.coachName}</span> : null}
        {item.locationLabel ? <span>· {item.locationLabel}</span> : null}
      </div>
    </div>
  )
}

function SnapshotTile({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4 py-4">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
              {eyebrow}
            </p>
            <p className="text-base font-medium text-[var(--wellstudio-ink)]">{title}</p>
          </div>
          <MemberInfoPopover label={eyebrow} description={description} />
        </div>
      </div>
    </div>
  )
}

function AlertCard({ alert }: { alert: MemberHomeAlert }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
        <ShieldAlert className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-medium text-[var(--wellstudio-ink)]">{alert.title}</p>
          <MemberInfoPopover label={alert.title} description={alert.description} />
        </div>
      </div>
    </div>
  )
}

function EmptyStateCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.55rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)] px-5 py-8">
      <div className="max-w-2xl flex flex-col gap-4">
        <span className="inline-flex size-12 items-center justify-center rounded-[1rem] bg-white text-[var(--wellstudio-blue-deep)] shadow-[0_12px_28px_rgba(15,18,22,0.08)]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-3">
          <p className="text-xl font-medium text-[var(--wellstudio-ink)]">{title}</p>
          <p className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-white/72 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
      {children}
    </span>
  )
}
