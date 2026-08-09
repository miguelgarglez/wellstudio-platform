import Link from 'next/link'
import {
  Activity,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  DoorOpen,
  UserRoundSearch,
  UsersRound,
} from 'lucide-react'

import type {
  AdminReportsOverview,
  AdminReportWindow,
} from '@/modules/admin/server/admin-reports-overview'
import { cn } from '@/lib/utils'

const WINDOW_OPTIONS: Array<{ value: AdminReportWindow; label: string }> = [
  { value: '7d', label: '7 días' },
  { value: '28d', label: '28 días' },
  { value: '90d', label: '90 días' },
]

export function AdminReportsDashboard({ overview }: { overview: AdminReportsOverview }) {
  return (
    <section className="space-y-4" aria-label="Informes operativos">
      <div className="flex flex-col gap-3 rounded-[1.45rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white px-4 py-4 shadow-[0_16px_36px_rgba(18,20,24,0.045)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]">
            <CalendarRange className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-[var(--wellstudio-ink)]">Ventana de análisis</p>
            <p className="mt-0.5 text-sm text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">
              {overview.filters.rangeLabel} · hasta este momento
            </p>
          </div>
        </div>
        <nav
          aria-label="Seleccionar ventana del informe"
          className="grid grid-cols-3 rounded-full border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-[var(--wellstudio-sand)] p-1"
        >
          {WINDOW_OPTIONS.map((option) => {
            const active = overview.filters.window === option.value
            return (
              <Link
                key={option.value}
                href={`/admin/reports?window=${option.value}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3 py-2 text-center text-xs font-medium transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:px-4 sm:text-sm',
                  active
                    ? 'bg-white text-[var(--wellstudio-ink)] shadow-[0_6px_18px_rgba(18,20,24,0.08)]'
                    : 'text-[color:color-mix(in_srgb,var(--foreground)_58%,white)] hover:text-[var(--wellstudio-ink)]',
                )}
              >
                {option.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Actividad"
          value={`${overview.summary.sessionCount}`}
          suffix="sesiones"
          detail={`${overview.summary.reservationCount} registros de reserva`}
        />
        <MetricCard
          icon={UsersRound}
          label="Ocupación registrada"
          value={`${overview.summary.occupancyPercent}%`}
          detail={`${overview.summary.retainedReservationCount} de ${overview.summary.totalCapacity} plazas`}
          progress={overview.summary.occupancyPercent}
        />
        <MetricCard
          icon={DoorOpen}
          label="Cancelaciones"
          value={`${overview.summary.cancellationPercent}%`}
          detail={`${overview.summary.canceledCount} de ${overview.summary.reservationCount} reservas`}
          tone={overview.summary.cancellationPercent > 20 ? 'warning' : 'neutral'}
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Asistencia cerrada"
          value={`${overview.summary.attendancePercent}%`}
          detail={`${overview.summary.attendedCount} asistencias · ${overview.summary.noShowCount} ausencias`}
          progress={overview.summary.attendancePercent}
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(20rem,0.72fr)] xl:items-start">
        <ReportPanel
          eyebrow="Oferta"
          title="Rendimiento por clase"
          description="Plazas retenidas frente a capacidad sumada de las sesiones iniciadas."
          icon={BarChart3}
        >
          {overview.classTypes.length > 0 ? (
            <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_68%,white)]">
              {overview.classTypes.map((classType) => (
                <div key={classType.id} className="py-4 first:pt-1 last:pb-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--wellstudio-ink)]">
                        {classType.name}
                      </p>
                      <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--foreground)_56%,white)]">
                        {classType.sessionCount} {classType.sessionCount === 1 ? 'sesión' : 'sesiones'} · {classType.retainedReservations}/{classType.capacity} plazas
                      </p>
                    </div>
                    <p className="shrink-0 text-lg font-medium tabular-nums text-[var(--wellstudio-blue-deep)]">
                      {classType.occupancyPercent}%
                    </p>
                  </div>
                  <ProgressBar value={classType.occupancyPercent} label={`Ocupación registrada de ${classType.name}`} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyReportState
              title="Sin sesiones en esta ventana"
              detail="Amplía el periodo o publica sesiones para empezar a leer ocupación por clase."
            />
          )}
        </ReportPanel>

        <div className="space-y-4">
          <ReportPanel
            eyebrow="Captación"
            title="Solicitudes de contacto"
            description="Conversión de la cohorte creada dentro de esta ventana."
            icon={UserRoundSearch}
          >
            <div className="grid grid-cols-2 gap-3">
              <CompactMetric label="Solicitudes" value={overview.summary.leadCount} />
              <CompactMetric
                label="Convertidas"
                value={`${overview.summary.leadConversionPercent}%`}
                detail={`${overview.summary.convertedLeadCount} solicitudes`}
              />
            </div>
            {overview.leadSources.length > 0 ? (
              <div className="mt-5 space-y-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
                  Origen declarado
                </p>
                {overview.leadSources.map((source) => (
                  <div key={source.label}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-[var(--wellstudio-ink)]">{source.label}</span>
                      <span className="shrink-0 tabular-nums text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]">
                        {source.count} · {source.sharePercent}%
                      </span>
                    </div>
                    <ProgressBar value={source.sharePercent} label={`Peso de ${source.label}`} compact />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-[1.1rem] border border-dashed border-[var(--border)] px-4 py-4 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">
                No se captaron solicitudes en esta ventana.
              </p>
            )}
          </ReportPanel>

          <DataQualityPanel quality={overview.dataQuality} />
        </div>
      </div>

      <p className="px-1 text-xs leading-5 text-[color:color-mix(in_srgb,var(--foreground)_52%,white)]">
        Las métricas son descriptivas: ocupación usa reservas no canceladas; cancelación usa todos los registros de reserva; asistencia solo usa resultados finalizados. No se muestran ingresos hasta disponer de una fuente financiera validada.
      </p>
    </section>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  detail,
  progress,
  tone = 'neutral',
}: {
  icon: typeof Activity
  label: string
  value: string
  suffix?: string
  detail: string
  progress?: number
  tone?: 'neutral' | 'warning'
}) {
  return (
    <article className={cn(
      'rounded-[1.45rem] border bg-white px-4 py-4 shadow-[0_14px_32px_rgba(18,20,24,0.045)] sm:px-5',
      tone === 'warning'
        ? 'border-amber-200/80'
        : 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)]',
    )}>
      <div className="flex items-center gap-2 text-[var(--wellstudio-blue-deep)]">
        <Icon className="size-4" aria-hidden="true" />
        <p className="text-xs uppercase tracking-[0.2em]">{label}</p>
      </div>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-medium tabular-nums text-[var(--wellstudio-ink)]">{value}</span>
        {suffix ? <span className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]">{suffix}</span> : null}
      </p>
      <p className="mt-1 text-xs leading-5 text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]">{detail}</p>
      {typeof progress === 'number' ? <ProgressBar value={progress} label={label} compact /> : null}
    </article>
  )
}

function ReportPanel({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  icon: typeof Activity
  children: React.ReactNode
}) {
  return (
    <section className="min-w-0 rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white px-4 py-5 shadow-[0_16px_36px_rgba(18,20,24,0.05)] sm:px-5">
      <header className="flex items-start gap-3 border-b border-[color:color-mix(in_srgb,var(--border)_70%,white)] pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-medium text-[var(--wellstudio-ink)]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">{description}</p>
        </div>
      </header>
      <div className="pt-4">{children}</div>
    </section>
  )
}

function DataQualityPanel({ quality }: { quality: AdminReportsOverview['dataQuality'] }) {
  const Icon = quality.hasIssues ? CircleAlert : CheckCircle2
  return (
    <section className={cn(
      'rounded-[1.45rem] border px-4 py-4 sm:px-5',
      quality.hasIssues
        ? 'border-amber-200/80 bg-amber-50/55'
        : 'border-emerald-200/70 bg-emerald-50/45',
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 size-5 shrink-0', quality.hasIssues ? 'text-amber-700' : 'text-emerald-700')} aria-hidden="true" />
        <div>
          <h2 className="font-medium text-[var(--wellstudio-ink)]">
            {quality.hasIssues ? 'Calidad de datos pendiente' : 'Datos operativos al día'}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_64%,white)]">
            {quality.hasIssues
              ? `${quality.staleSessionCount} sesiones pasadas sin completar · ${quality.pendingAttendanceCount} asistencias pendientes.`
              : 'No hay sesiones pasadas abiertas ni asistencias pendientes en la ventana.'}
          </p>
          {quality.hasIssues ? (
            <Link href="/admin/sessions" className="mt-3 inline-flex text-sm font-medium text-[var(--wellstudio-blue-deep)] underline decoration-[color:color-mix(in_srgb,var(--wellstudio-blue)_35%,transparent)] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
              Revisar agenda
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function CompactMetric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-[var(--wellstudio-sand)]/35 px-3.5 py-3.5">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">{label}</p>
      <p className="mt-2 text-2xl font-medium tabular-nums text-[var(--wellstudio-ink)]">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--foreground)_56%,white)]">{detail}</p> : null}
    </div>
  )
}

function ProgressBar({ value, label, compact = false }: { value: number; label: string; compact?: boolean }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn('mt-3 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)]', compact ? 'h-1.5' : 'h-2')}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--wellstudio-blue-deep),var(--wellstudio-blue))] transition-[width] duration-500 motion-reduce:transition-none"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function EmptyReportState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-[var(--border)] px-5 py-10 text-center">
      <p className="font-medium text-[var(--wellstudio-ink)]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">{detail}</p>
    </div>
  )
}

export function AdminReportsDashboardSkeleton() {
  return (
    <div className="space-y-4" aria-label="Cargando informes" aria-busy="true">
      <Skeleton className="h-[5.5rem] rounded-[1.45rem]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-[1.45rem]" />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(20rem,0.72fr)]">
        <Skeleton className="h-[34rem] rounded-[1.55rem]" />
        <div className="space-y-4">
          <Skeleton className="h-[25rem] rounded-[1.55rem]" />
          <Skeleton className="h-32 rounded-[1.45rem]" />
        </div>
      </div>
    </div>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div className={cn('animate-pulse bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] motion-reduce:animate-none', className)} />
}
