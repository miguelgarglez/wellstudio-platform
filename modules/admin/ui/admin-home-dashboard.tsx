import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  ClipboardList,
  Inbox,
  ShieldPlus,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'

import type { AdminHomeOverview } from '@/modules/admin/server/admin-home-overview'
import { cn } from '@/lib/utils'

export function AdminHomeDashboard({ overview }: { overview: AdminHomeOverview }) {
  const attentionItems = [
    {
      label: 'Solicitudes nuevas',
      value: overview.signals.newLeadCount,
      detail: 'Pendientes de primer contacto',
      href: '/admin/leads?status=new',
      icon: Inbox,
      tone: 'blue',
    },
    {
      label: 'Socios sin cobertura',
      value: overview.signals.uncoveredMemberCount,
      detail: 'Activos sin membership ni créditos vigentes',
      href: '/admin/members?status=active',
      icon: UsersRound,
      tone: overview.signals.uncoveredMemberCount > 0 ? 'warm' : 'neutral',
    },
    {
      label: 'Reglas en fallback',
      value: overview.signals.legacyRuleCount,
      detail: 'Planes activos aún sin regla explícita',
      href: '/admin/rules',
      icon: ClipboardList,
      tone: overview.signals.legacyRuleCount > 0 ? 'warm' : 'neutral',
    },
    {
      label: 'Excepciones vigentes',
      value: overview.signals.activeExceptionCount,
      detail: 'Cambios individuales activos ahora',
      href: '/admin/overrides',
      icon: ShieldPlus,
      tone: 'neutral',
    },
  ] as const

  return (
    <section className="space-y-4" aria-label="Resumen operativo">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <section className="overflow-hidden rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] bg-[color:color-mix(in_srgb,var(--card)_90%,white)] shadow-[0_18px_42px_rgba(18,20,24,0.06)]">
          <div className="flex flex-col gap-4 border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Jornada</p>
              <h2 className="mt-1 text-2xl font-medium text-[var(--wellstudio-ink)]">Clases de hoy</h2>
              <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_64%,white)]">{overview.dateLabel}</p>
            </div>
            <Link href="/admin/sessions" className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--wellstudio-blue-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
              Abrir agenda <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-3 border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)]">
            <SummaryMetric label="Sesiones" value={overview.sessionSummary.sessionCount} />
            <SummaryMetric label="Reservas" value={`${overview.sessionSummary.reservedCount}/${overview.sessionSummary.capacity}`} />
            <SummaryMetric label="Ocupación" value={`${overview.sessionSummary.occupancyPercent}%`} />
          </div>

          {overview.sessions.length > 0 ? (
            <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_68%,white)]">
              {overview.sessions.map((session) => (
                <Link key={session.id} href={`/admin/sessions?session=${encodeURIComponent(session.id)}`} className="group grid gap-3 px-4 py-4 transition-colors duration-200 hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] sm:grid-cols-[5rem_minmax(0,1fr)_8rem_auto] sm:items-center sm:px-5">
                  <p className="font-display text-2xl tracking-[0.04em] text-[var(--wellstudio-ink)]">{session.timeLabel}</p>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--wellstudio-ink)]">{session.name}</p>
                    <p className="mt-0.5 truncate text-sm text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">{session.coachLabel} · {session.statusLabel}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]"><span>Aforo</span><span>{session.occupancyLabel}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)]"><span className="block h-full rounded-full bg-[var(--wellstudio-blue)]" style={{ width: `${session.occupancyPercent}%` }} /></div>
                  </div>
                  <ArrowRight className="hidden size-4 text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]"><CalendarDays className="size-5" aria-hidden="true" /></span>
              <p className="mt-4 font-medium text-[var(--wellstudio-ink)]">No hay sesiones programadas hoy</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">La agenda está despejada. Puedes revisar próximas fechas o crear una sesión.</p>
            </div>
          )}
        </section>

        <section className="rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] bg-white/82 p-4 shadow-[0_18px_42px_rgba(18,20,24,0.06)] sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]"><CircleAlert className="size-4.5" aria-hidden="true" /></span>
            <div><p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Atención</p><h2 className="mt-1 text-xl font-medium text-[var(--wellstudio-ink)]">Qué revisar ahora</h2></div>
          </div>
          <div className="mt-5 divide-y divide-[color:color-mix(in_srgb,var(--border)_70%,white)]">
            {attentionItems.map((item) => <AttentionLink key={item.label} {...item} />)}
          </div>
          {overview.signals.blockedMemberCount > 0 ? (
            <Link href="/admin/members?status=blocked" className="mt-4 flex items-center justify-between gap-3 rounded-[1.15rem] border border-[color:color-mix(in_srgb,#c7665b_18%,white)] bg-[color:color-mix(in_srgb,#c7665b_7%,white)] px-3.5 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
              <span className="flex items-center gap-2 text-[var(--wellstudio-ink)]"><CircleAlert className="size-4 text-[#b9544d]" aria-hidden="true" />{overview.signals.blockedMemberCount} {overview.signals.blockedMemberCount === 1 ? 'socio bloqueado' : 'socios bloqueados'}</span>
              <ArrowRight className="size-4 text-[#b9544d]" aria-hidden="true" />
            </Link>
          ) : null}
        </section>
      </div>

      <section className="rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] bg-white/82 shadow-[0_18px_42px_rgba(18,20,24,0.06)]">
        <div className="flex items-center justify-between gap-3 border-b border-[color:color-mix(in_srgb,var(--border)_70%,white)] px-4 py-4 sm:px-5">
          <div><p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Comercial</p><h2 className="mt-1 text-xl font-medium text-[var(--wellstudio-ink)]">Primer contacto pendiente</h2></div>
          <Link href="/admin/leads?status=new" className="text-sm font-medium text-[var(--wellstudio-blue-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">Ver solicitudes</Link>
        </div>
        {overview.pendingLeads.length > 0 ? (
          <div className="grid divide-y divide-[color:color-mix(in_srgb,var(--border)_68%,white)] md:grid-cols-2 md:divide-x md:divide-y-0">
            {overview.pendingLeads.map((lead) => (
              <Link key={lead.id} href={`/admin/leads?status=new&lead=${encodeURIComponent(lead.id)}`} className="group flex items-center gap-3 px-4 py-4 transition-colors duration-200 hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] sm:px-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]"><UserRoundCheck className="size-4.5" aria-hidden="true" /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-medium text-[var(--wellstudio-ink)]">{lead.displayName}</p><p className="mt-0.5 truncate text-sm text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">{lead.phoneLabel} · {lead.ageLabel}</p></div>
                <ArrowRight className="size-4 text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-5 py-7 text-sm text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">No hay solicitudes nuevas pendientes de primer contacto.</p>
        )}
      </section>
    </section>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="border-r border-[color:color-mix(in_srgb,var(--border)_68%,white)] px-3 py-3.5 last:border-r-0 sm:px-5"><p className="text-[10px] uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)] sm:text-xs">{label}</p><p className="mt-1 text-lg font-medium text-[var(--wellstudio-ink)] sm:text-xl">{value}</p></div>
}

function AttentionLink({ label, value, detail, href, icon: Icon, tone }: { label: string; value: number; detail: string; href: string; icon: typeof Inbox; tone: 'blue' | 'warm' | 'neutral' }) {
  return (
    <Link href={href} className="group flex items-center gap-3 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', tone === 'warm' ? 'bg-[#fff1e6] text-[#a85d25]' : tone === 'blue' ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] text-[var(--wellstudio-blue-deep)]' : 'bg-[color:color-mix(in_srgb,var(--foreground)_6%,white)] text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]')}><Icon className="size-4" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-2"><p className="font-medium text-[var(--wellstudio-ink)]">{label}</p><span className="text-lg font-medium text-[var(--wellstudio-ink)]">{value}</span></div><p className="mt-0.5 text-xs leading-5 text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">{detail}</p></div>
      <ArrowRight className="size-4 shrink-0 text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

export function AdminHomeDashboardSkeleton() {
  return <div className="grid animate-pulse gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]" aria-hidden="true"><div className="h-[34rem] rounded-[1.65rem] bg-white/68" /><div className="h-[34rem] rounded-[1.65rem] bg-white/68" /><div className="h-40 rounded-[1.65rem] bg-white/68 2xl:col-span-2" /></div>
}
