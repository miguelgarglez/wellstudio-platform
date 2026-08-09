import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  History,
  PackageCheck,
  ReceiptText,
  UserRound,
  Webhook,
} from 'lucide-react'

import { AdminPaymentsSearchForm } from '@/modules/admin/ui/admin-payments-search-form'
import { AdminResponsiveDetailFrame } from '@/modules/admin/ui/admin-responsive-detail-frame'
import type {
  AdminPaymentStatusFilter,
  AdminPaymentsOverview,
} from '@/modules/admin/server/admin-payments-overview'
import { cn } from '@/lib/utils'

type StatusTone = 'blue' | 'success' | 'warning' | 'danger' | 'neutral'

const STATUS_FILTERS: Array<{ value: AdminPaymentStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'En curso' },
  { value: 'succeeded', label: 'Cobrados' },
  { value: 'failed', label: 'Fallidos' },
  { value: 'canceled', label: 'Cancelados' },
  { value: 'refunded', label: 'Reembolsados' },
]

export function AdminPaymentsDashboard({ overview }: { overview: AdminPaymentsOverview }) {
  const closeHref = buildPaymentsHref(overview.filters)

  return (
    <section className="space-y-4" aria-label="Monitor de cobros">
      <div className="grid gap-3 sm:grid-cols-3">
        <HealthCard
          label="Requieren atención"
          value={overview.summary.failedCount}
          detail="Cobros fallidos"
          href={buildPaymentsHref(overview.filters, { status: 'failed' })}
          icon={CircleAlert}
          tone={overview.summary.failedCount > 0 ? 'danger' : 'neutral'}
        />
        <HealthCard
          label="En curso"
          value={overview.summary.activeCount}
          detail="Pendientes o con acción"
          href={buildPaymentsHref(overview.filters, { status: 'pending' })}
          icon={Clock3}
          tone="blue"
        />
        <HealthCard
          label="Últimas 24 horas"
          value={overview.summary.succeededRecentCount}
          detail="Cobros confirmados"
          href={buildPaymentsHref(overview.filters, { status: 'succeeded' })}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(20rem,0.76fr)_minmax(0,1.24fr)] lg:items-start">
        <section className="min-w-0 overflow-hidden rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white shadow-[0_16px_36px_rgba(18,20,24,0.055)]">
          <div className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]">
                <CreditCard className="size-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.23em] text-[var(--wellstudio-blue-deep)]">
                  Bandeja operativa
                </p>
                <h2 className="mt-1 text-xl font-medium text-[var(--wellstudio-ink)]">
                  Pagos recientes
                </h2>
                <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_64%,white)]">
                  Últimos 50 cobros según los filtros activos.
                </p>
              </div>
            </div>

            <AdminPaymentsSearchForm
              query={overview.filters.query}
              status={overview.filters.status}
            />

            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Filtrar cobros por estado">
              {STATUS_FILTERS.map((filter) => (
                <FilterLink
                  key={filter.value}
                  href={buildPaymentsHref(overview.filters, { status: filter.value })}
                  label={filter.label}
                  active={overview.filters.status === filter.value}
                />
              ))}
            </div>
          </div>

          {overview.payments.length > 0 ? (
            <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_68%,white)]">
              {overview.payments.map((payment) => {
                const isSelected = overview.selectedPayment?.id === payment.id
                return (
                  <Link
                    key={payment.id}
                    href={buildPaymentsHref(overview.filters, { payment: payment.id })}
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
                          {payment.memberName}
                        </p>
                        <p className="mt-1 truncate text-sm text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">
                          {payment.productLabel}
                        </p>
                      </div>
                      <StatusBadge label={payment.statusLabel} tone={payment.statusTone} />
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--wellstudio-blue-deep)]">
                          {payment.amountLabel}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[color:color-mix(in_srgb,var(--foreground)_54%,white)]">
                          {payment.ageLabel} · {payment.eventHealthLabel}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyPayments />
          )}
        </section>

        <AdminResponsiveDetailFrame
          isOpen={Boolean(overview.selectedPayment)}
          closeHref={closeHref}
          labelledBy="admin-payment-detail-title"
          className="lg:min-h-[42rem]"
        >
          {overview.selectedPayment ? (
            <PaymentDetail payment={overview.selectedPayment} />
          ) : (
            <EmptyPaymentDetail />
          )}
        </AdminResponsiveDetailFrame>
      </div>
    </section>
  )
}

function PaymentDetail({
  payment,
}: {
  payment: NonNullable<AdminPaymentsOverview['selectedPayment']>
}) {
  return (
    <div className="space-y-5">
      <header className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
              Cobro seleccionado
            </p>
            <h2 id="admin-payment-detail-title" className="mt-2 text-2xl font-medium text-[var(--wellstudio-ink)]">
              {payment.productLabel}
            </h2>
            <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_64%,white)]">
              {payment.amountLabel} · {payment.paymentTypeLabel}
            </p>
          </div>
          <StatusBadge label={payment.statusLabel} tone={payment.statusTone} />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]">
          <span>Creado {payment.createdAtLabel}</span>
          <span>{payment.providerLabel}</span>
          <span>Ref. {payment.idLabel}</span>
        </div>
      </header>

      {payment.status === 'FAILED' ? (
        <section className="rounded-[1.25rem] border border-red-200 bg-red-50/70 px-4 py-4">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-700" aria-hidden="true" />
            <div>
              <p className="font-medium text-red-950">Este cobro requiere revisión</p>
              <p className="mt-1 text-sm leading-6 text-red-900/75">
                {payment.failureLabel ?? 'El pago no llegó a completarse.'}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <InfoCard icon={UserRound} label="Socio" value={payment.memberName} detail={payment.memberEmail} />
        <InfoCard icon={Webhook} label="Procesamiento" value={payment.eventHealthLabel} detail={payment.memberStatusLabel} tone={payment.eventHealthTone} />
      </section>

      <section>
        <SectionHeading icon={PackageCheck} title="Conceptos" detail="Snapshot comercial registrado en el cobro." />
        <div className="mt-3 space-y-2">
          {payment.items.length > 0 ? payment.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-4 py-3.5">
              <div className="min-w-0">
                <p className="font-medium text-[var(--wellstudio-ink)]">{item.name}</p>
                <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]">
                  {item.typeLabel} · {item.quantityLabel}{item.entitlementLabel ? ` · ${item.entitlementLabel}` : ''}
                </p>
              </div>
              <p className="shrink-0 font-medium text-[var(--wellstudio-ink)]">{item.amountLabel}</p>
            </div>
          )) : (
            <p className="rounded-[1.15rem] border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">
              Este cobro no tiene conceptos asociados.
            </p>
          )}
        </div>
      </section>

      <section>
        <SectionHeading icon={History} title="Eventos de pago" detail="Recepción y procesamiento del webhook, sin exponer payloads." />
        <div className="mt-3 space-y-2">
          {payment.events.length > 0 ? payment.events.map((event) => (
            <div key={event.id} className="rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--wellstudio-ink)]">{event.typeLabel}</p>
                  <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--foreground)_56%,white)]">
                    {event.createdAtLabel} · Ref. {event.providerEventIdLabel}
                  </p>
                </div>
                <StatusBadge label={event.statusLabel} tone={event.statusTone} />
              </div>
            </div>
          )) : (
            <p className="rounded-[1.15rem] border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">
              Todavía no hay eventos asociados a este cobro.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[1.2rem] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">Referencias seguras</p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <Reference label="Checkout" value={payment.checkoutSessionIdLabel} />
          <Reference label="Payment intent" value={payment.paymentIntentIdLabel} />
        </dl>
      </section>
    </div>
  )
}

function Reference({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-[color:color-mix(in_srgb,var(--foreground)_54%,white)]">{label}</dt>
      <dd className="mt-1 truncate font-medium text-[var(--wellstudio-ink)]" translate="no">{value ?? 'No disponible'}</dd>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, detail, tone = 'blue' }: { icon: typeof CreditCard; label: string; value: string; detail: string; tone?: StatusTone }) {
  return (
    <div className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--border)_72%,white)] p-4">
      <div className="flex items-start gap-3">
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', toneClasses(tone).icon)}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">{label}</p>
          <p className="mt-1 truncate font-medium text-[var(--wellstudio-ink)]">{value}</p>
          <p className="mt-1 break-all text-xs leading-5 text-[color:color-mix(in_srgb,var(--foreground)_56%,white)]">{detail}</p>
        </div>
      </div>
    </div>
  )
}

function SectionHeading({ icon: Icon, title, detail }: { icon: typeof CreditCard; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] text-[var(--wellstudio-blue-deep)]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-medium text-[var(--wellstudio-ink)]">{title}</h3>
        <p className="mt-0.5 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">{detail}</p>
      </div>
    </div>
  )
}

function HealthCard({ label, value, detail, href, icon: Icon, tone }: { label: string; value: number; detail: string; href: string; icon: typeof CreditCard; tone: StatusTone }) {
  const styles = toneClasses(tone)
  return (
    <Link href={href} className={cn('group rounded-[1.35rem] border p-4 shadow-[0_12px_28px_rgba(18,20,24,0.045)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(18,20,24,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]', styles.surface)}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn('flex size-9 items-center justify-center rounded-full', styles.icon)}><Icon className="size-4" aria-hidden="true" /></span>
        <ArrowRight className="size-4 opacity-45 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">{label}</p>
      <p className="mt-1 text-2xl font-medium text-[var(--wellstudio-ink)]">{value}</p>
      <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">{detail}</p>
    </Link>
  )
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]', active ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_40%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] text-[var(--wellstudio-ink)]' : 'border-[var(--border)] bg-white text-[color:color-mix(in_srgb,var(--foreground)_66%,white)] hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)]')}>
      {label}
    </Link>
  )
}

function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return <span className={cn('inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]', toneClasses(tone).badge)}>{label}</span>
}

function toneClasses(tone: StatusTone) {
  if (tone === 'success') return { surface: 'border-emerald-200/80 bg-emerald-50/45', icon: 'bg-emerald-100 text-emerald-800', badge: 'border-emerald-200 bg-emerald-50 text-emerald-800' }
  if (tone === 'danger') return { surface: 'border-red-200/80 bg-red-50/45', icon: 'bg-red-100 text-red-800', badge: 'border-red-200 bg-red-50 text-red-800' }
  if (tone === 'warning') return { surface: 'border-amber-200/80 bg-amber-50/45', icon: 'bg-amber-100 text-amber-800', badge: 'border-amber-200 bg-amber-50 text-amber-800' }
  if (tone === 'neutral') return { surface: 'border-[var(--border)] bg-white', icon: 'bg-neutral-100 text-neutral-700', badge: 'border-neutral-200 bg-neutral-50 text-neutral-700' }
  return { surface: 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)]', icon: 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_11%,white)] text-[var(--wellstudio-blue-deep)]', badge: 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_7%,white)] text-[var(--wellstudio-blue-deep)]' }
}

function EmptyPayments() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <ReceiptText className="size-6 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />
      <p className="mt-4 font-medium text-[var(--wellstudio-ink)]">No hay cobros con estos filtros</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">Prueba otro estado o una búsqueda distinta. No se ha ocultado ni modificado ningún pago.</p>
      <Link href="/admin/payments" className="mt-4 text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:underline">Limpiar filtros</Link>
    </div>
  )
}

function EmptyPaymentDetail() {
  return (
    <div className="flex min-h-[36rem] flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[var(--border)] px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] text-[var(--wellstudio-blue-deep)]"><ReceiptText className="size-5" aria-hidden="true" /></span>
      <h2 id="admin-payment-detail-title" className="mt-4 text-xl font-medium text-[var(--wellstudio-ink)]">Selecciona un cobro</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">Aquí verás su contexto comercial, referencias seguras y la secuencia de eventos procesados.</p>
    </div>
  )
}

export function AdminPaymentsDashboardSkeleton() {
  return (
    <section className="space-y-4" aria-label="Cargando monitor de cobros">
      <div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-[1.35rem] border border-[var(--border)] bg-white/72" />)}</div>
      <div className="grid gap-4 lg:grid-cols-[minmax(20rem,0.76fr)_minmax(0,1.24fr)]">
        <div className="h-[42rem] animate-pulse rounded-[1.55rem] border border-[var(--border)] bg-white/72" />
        <div className="hidden h-[42rem] animate-pulse rounded-[1.55rem] border border-[var(--border)] bg-white/72 lg:block" />
      </div>
    </section>
  )
}

function buildPaymentsHref(filters: { query: string; status: AdminPaymentStatusFilter }, overrides: { status?: AdminPaymentStatusFilter; payment?: string | null } = {}) {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  const status = overrides.status ?? filters.status
  if (status !== 'all') params.set('status', status)
  if (overrides.payment) params.set('payment', overrides.payment)
  const query = params.toString()
  return query ? `/admin/payments?${query}` : '/admin/payments'
}
