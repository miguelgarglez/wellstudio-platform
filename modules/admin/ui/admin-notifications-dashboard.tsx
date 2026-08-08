import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  History,
  MailCheck,
  MailWarning,
  MapPin,
  RotateCw,
  UserRound,
} from 'lucide-react'

import { AdminNotificationRetryDialog } from '@/modules/admin/ui/admin-notification-retry-dialog'
import { AdminOperationToast } from '@/modules/admin/ui/admin-operation-toast'
import { AdminResponsiveDetailFrame } from '@/modules/admin/ui/admin-responsive-detail-frame'
import type {
  AdminNotificationDeliveryOverview,
  AdminNotificationEventFilter,
  AdminNotificationStatusFilter,
} from '@/modules/notifications/server/admin-notification-deliveries'
import { cn } from '@/lib/utils'

type AdminNotificationsDashboardProps = {
  overview: AdminNotificationDeliveryOverview
  updatedState: 'retry' | null
  noticeId: string | null
}

const STATUS_FILTERS: Array<{
  value: AdminNotificationStatusFilter
  label: string
}> = [
  { value: 'all', label: 'Todas' },
  { value: 'failed', label: 'Fallidas' },
  { value: 'pending', label: 'En curso' },
  { value: 'sent', label: 'Enviadas' },
]

const EVENT_FILTERS: Array<{
  value: AdminNotificationEventFilter
  label: string
}> = [
  { value: 'all', label: 'Todos los eventos' },
  { value: 'booking', label: 'Reservas' },
  { value: 'cancellation', label: 'Cancelaciones' },
  { value: 'promotion', label: 'Waitlist' },
  { value: 'session', label: 'Agenda' },
]

export function AdminNotificationsDashboard({
  overview,
  updatedState,
  noticeId,
}: AdminNotificationsDashboardProps) {
  const closeHref = buildNotificationsHref(overview.filters)
  const selectedJobHref = overview.selectedJob
    ? buildNotificationsHref(overview.filters, { delivery: overview.selectedJob.id })
    : closeHref

  return (
    <section className="space-y-4" aria-label="Monitor de entregas">
      <AdminOperationToast
        state={updatedState === 'retry' ? 'notification-retry' : null}
        instanceKey={noticeId}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <HealthCard
          label="Requieren atención"
          value={overview.summary.failedCount}
          detail="Entregas fallidas"
          href={buildNotificationsHref(overview.filters, { status: 'failed' })}
          icon={MailWarning}
          tone={overview.summary.failedCount > 0 ? 'danger' : 'neutral'}
        />
        <HealthCard
          label="En curso"
          value={overview.summary.activeCount}
          detail="Pendientes o procesando"
          href={buildNotificationsHref(overview.filters, { status: 'pending' })}
          icon={Clock3}
          tone="blue"
        />
        <HealthCard
          label="Últimas 24 horas"
          value={overview.summary.sentRecentCount}
          detail="Entregas completadas"
          href={buildNotificationsHref(overview.filters, { status: 'sent' })}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)] lg:items-start">
        <section className="min-w-0 overflow-hidden rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white shadow-[0_16px_36px_rgba(18,20,24,0.055)]">
          <div className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]">
                <MailCheck className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.23em] text-[var(--wellstudio-blue-deep)]">
                  Bandeja operativa
                </p>
                <h2 className="mt-1 text-xl font-medium text-[var(--wellstudio-ink)]">
                  Emails transaccionales
                </h2>
                <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_64%,white)]">
                  Últimas 40 entregas según los filtros activos.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Filtrar por estado">
              {STATUS_FILTERS.map((filter) => (
                <FilterLink
                  key={filter.value}
                  href={buildNotificationsHref(overview.filters, {
                    status: filter.value,
                  })}
                  label={filter.label}
                  active={overview.filters.status === filter.value}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Filtrar por evento">
              {EVENT_FILTERS.map((filter) => (
                <FilterLink
                  key={filter.value}
                  href={buildNotificationsHref(overview.filters, {
                    event: filter.value,
                  })}
                  label={filter.label}
                  active={overview.filters.event === filter.value}
                  compact
                />
              ))}
            </div>
          </div>

          {overview.jobs.length > 0 ? (
            <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_68%,white)]">
              {overview.jobs.map((job) => {
                const isSelected = overview.selectedJob?.id === job.id

                return (
                  <Link
                    key={job.id}
                    href={buildNotificationsHref(overview.filters, {
                      delivery: job.id,
                    })}
                    aria-current={isSelected ? 'true' : undefined}
                    className={cn(
                      'group block px-4 py-4 transition-[background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] sm:px-5',
                      isSelected
                        ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] shadow-[inset_3px_0_0_var(--wellstudio-blue)]'
                        : 'hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--wellstudio-ink)]">
                          {job.eventLabel}
                        </p>
                        <p className="mt-1 truncate text-sm text-[color:color-mix(in_srgb,var(--foreground)_64%,white)]">
                          {job.recipient}
                        </p>
                      </div>
                      <StatusBadge label={job.statusLabel} tone={job.statusTone} />
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[var(--wellstudio-blue-deep)]">
                          {job.className}
                        </p>
                        <p className="mt-0.5 text-xs text-[color:color-mix(in_srgb,var(--foreground)_54%,white)]">
                          {job.ageLabel} · {job.attemptCount} {job.attemptCount === 1 ? 'intento' : 'intentos'}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] text-[var(--wellstudio-blue-deep)]">
                <MailCheck className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-4 font-medium text-[var(--wellstudio-ink)]">
                No hay entregas con estos filtros
              </p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">
                Prueba otro estado o tipo de evento. No se ha eliminado ningún registro.
              </p>
              <Link
                href="/admin/notifications"
                className="mt-4 text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Limpiar filtros
              </Link>
            </div>
          )}
        </section>

        <AdminResponsiveDetailFrame
          isOpen={Boolean(overview.selectedJob)}
          closeHref={closeHref}
          labelledBy="admin-notification-detail-title"
          mobileFeedback={
            <AdminOperationToast
              state={updatedState === 'retry' ? 'notification-retry' : null}
              variant="inline"
              instanceKey={noticeId}
            />
          }
          className="lg:min-h-[42rem]"
        >
          {overview.selectedJob ? (
            <NotificationDetail job={overview.selectedJob} returnTo={selectedJobHref} />
          ) : (
            <NotificationEmptyDetail />
          )}
        </AdminResponsiveDetailFrame>
      </div>
    </section>
  )
}

function NotificationDetail({
  job,
  returnTo,
}: {
  job: NonNullable<AdminNotificationDeliveryOverview['selectedJob']>
  returnTo: string
}) {
  return (
    <div className="space-y-5">
      <header className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
              Entrega seleccionada
            </p>
            <h2 id="admin-notification-detail-title" className="mt-2 text-2xl font-medium text-[var(--wellstudio-ink)]">
              {job.eventLabel}
            </h2>
            <p className="mt-1 break-all text-sm text-[color:color-mix(in_srgb,var(--foreground)_64%,white)]">
              {job.recipient}
            </p>
          </div>
          <StatusBadge label={job.statusLabel} tone={job.statusTone} />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]">
          <span>Creada {job.createdAtLabel}</span>
          <span>{job.attemptCount} {job.attemptCount === 1 ? 'intento' : 'intentos'}</span>
          <span>Ref. {job.referenceId}</span>
        </div>
      </header>

      {job.status === 'FAILED' ? (
        <section className="rounded-[1.25rem] border border-red-200 bg-red-50/70 px-4 py-4">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-700" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-medium text-red-950">La última entrega ha fallado</p>
              <p className="mt-1 break-words text-sm leading-6 text-red-900/75">
                {job.lastError ?? 'El proveedor no devolvió un detalle adicional.'}
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-red-200/70 pt-4">
            <AdminNotificationRetryDialog
              jobId={job.id}
              expectedUpdatedAt={job.updatedAt}
              returnTo={returnTo}
              recipient={job.recipient}
              attemptCount={job.attemptCount}
            />
          </div>
        </section>
      ) : (
        <section className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] px-4 py-4">
          <p className="font-medium text-[var(--wellstudio-ink)]">
            {job.status === 'SENT' ? 'Entrega completada' : 'No requiere intervención'}
          </p>
          <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_66%,white)]">
            {job.status === 'SENT'
              ? `El proveedor confirmó el envío${job.sentAtLabel ? ` el ${job.sentAtLabel}` : ''}.`
              : 'El dispatcher ya tiene esta entrega pendiente o en procesamiento.'}
          </p>
        </section>
      )}

      <section>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] text-[var(--wellstudio-blue-deep)]">
            <UserRound className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">Contexto</p>
            <h3 className="mt-1 text-lg font-medium text-[var(--wellstudio-ink)]">{job.contextTitle}</h3>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ContextCard label="Socio" value={job.memberName} />
          <ContextCard label="Clase" value={job.className} />
          <ContextCard label="Sesión" value={job.sessionLabel} />
          <ContextCard label="Coach" value={job.coachName} />
          <ContextCard label="Situación" value={job.audienceLabel} />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-3 py-2.5 text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
          <MapPin className="size-4 shrink-0 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />
          {job.locationLabel}
        </div>
      </section>

      <section className="border-t border-[color:color-mix(in_srgb,var(--border)_72%,white)] pt-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] text-[var(--wellstudio-blue-deep)]">
            <History className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">Trazabilidad</p>
            <h3 className="mt-1 text-lg font-medium text-[var(--wellstudio-ink)]">Historial de intentos</h3>
          </div>
        </div>
        {job.attempts.length > 0 ? (
          <ol className="mt-4 space-y-2">
            {job.attempts.map((attempt) => (
              <li key={attempt.id} className="rounded-[1rem] border border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
                      Intento {attempt.attemptNumber} · {attempt.statusLabel}
                    </p>
                    <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--foreground)_56%,white)]">
                      {attempt.attemptedAtLabel} · {attempt.providerLabel}
                    </p>
                  </div>
                  <StatusBadge
                    label={attempt.statusLabel}
                    tone={attempt.status === 'SENT' ? 'success' : 'danger'}
                  />
                </div>
                {attempt.error ? (
                  <p className="mt-2 break-words text-xs leading-5 text-red-800/80">{attempt.error}</p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">
            Todavía no se ha registrado ningún intento de proveedor.
          </p>
        )}
      </section>
    </div>
  )
}

function NotificationEmptyDetail() {
  return (
    <div className="flex min-h-[36rem] flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]">
        <MailCheck className="size-6" aria-hidden="true" />
      </span>
      <h2 id="admin-notification-detail-title" className="mt-5 text-xl font-medium text-[var(--wellstudio-ink)]">
        Selecciona una entrega
      </h2>
      <p className="mt-2 max-w-md text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_64%,white)]">
        Aquí verás el contexto seguro del email, cada intento y la acción de recuperación cuando realmente haga falta.
      </p>
      <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
        <RotateCw className="size-3.5" aria-hidden="true" />
        Solo los fallos son operables
      </div>
    </div>
  )
}

function ContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-3.5 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">{label}</p>
      <p className="mt-1.5 text-sm font-medium leading-6 text-[var(--wellstudio-ink)]">{value}</p>
    </div>
  )
}

function HealthCard({
  label,
  value,
  detail,
  href,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  detail: string
  href: string
  icon: typeof MailWarning
  tone: 'danger' | 'blue' | 'success' | 'neutral'
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] bg-white/86 px-4 py-4 shadow-[0_12px_30px_rgba(18,20,24,0.045)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(18,20,24,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] motion-reduce:hover:translate-y-0"
    >
      <span className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full',
        tone === 'danger' && 'bg-red-50 text-red-700',
        tone === 'blue' && 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]',
        tone === 'success' && 'bg-emerald-50 text-emerald-700',
        tone === 'neutral' && 'bg-[color:color-mix(in_srgb,var(--foreground)_6%,white)] text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]',
      )}>
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium text-[var(--wellstudio-ink)]">{label}</p>
          <span className="text-2xl font-medium text-[var(--wellstudio-ink)]">{value}</span>
        </div>
        <p className="mt-0.5 text-xs text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]">{detail}</p>
      </div>
    </Link>
  )
}

function FilterLink({
  href,
  label,
  active,
  compact = false,
}: {
  href: string
  label: string
  active: boolean
  compact?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        active
          ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_36%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] text-[var(--wellstudio-ink)]'
          : 'border-[color:color-mix(in_srgb,var(--border)_80%,white)] bg-white text-[color:color-mix(in_srgb,var(--foreground)_66%,white)] hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_25%,white)]',
        compact && 'px-2.5 text-[11px]',
      )}
    >
      {label}
    </Link>
  )
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: 'danger' | 'success' | 'blue' | 'neutral'
}) {
  return (
    <span className={cn(
      'inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]',
      tone === 'danger' && 'border-red-200 bg-red-50 text-red-700',
      tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
      tone === 'blue' && 'border-blue-200 bg-blue-50 text-blue-700',
      tone === 'neutral' && 'border-[var(--border)] bg-[var(--muted)] text-[color:color-mix(in_srgb,var(--foreground)_64%,white)]',
    )}>
      {label}
    </span>
  )
}

function buildNotificationsHref(
  current: {
    status: AdminNotificationStatusFilter
    event: AdminNotificationEventFilter
  },
  changes: {
    status?: AdminNotificationStatusFilter
    event?: AdminNotificationEventFilter
    delivery?: string | null
  } = {},
) {
  const params = new URLSearchParams()
  const status = changes.status ?? current.status
  const event = changes.event ?? current.event

  if (status !== 'all') params.set('status', status)
  if (event !== 'all') params.set('event', event)
  if (changes.delivery) params.set('delivery', changes.delivery)

  const query = params.toString()
  return query ? `/admin/notifications?${query}` : '/admin/notifications'
}

export function AdminNotificationsDashboardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid animate-pulse gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-[1.35rem] bg-white/68" />
        <div className="h-24 rounded-[1.35rem] bg-white/68" />
        <div className="h-24 rounded-[1.35rem] bg-white/68" />
      </div>
      <div className="grid animate-pulse gap-4 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]">
        <div className="h-[42rem] rounded-[1.55rem] bg-white/68" />
        <div className="hidden h-[42rem] rounded-[1.55rem] bg-white/68 lg:block" />
      </div>
    </div>
  )
}
