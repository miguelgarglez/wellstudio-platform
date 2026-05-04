import type { ReactNode } from 'react'
import Link from 'next/link'
import { Layers3, ShieldCheck, Sparkles } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import type { AdminMembershipPolicyOverview } from '@/modules/admin/server/admin-membership-policy-overview'
import { AdminMembershipPolicyEditorSheet } from '@/modules/admin/ui/admin-membership-policy-editor-sheet'
import { AdminOperationToast } from '@/modules/admin/ui/admin-operation-toast'
import { AdminResponsiveDetailFrame } from '@/modules/admin/ui/admin-responsive-detail-frame'
import { cn } from '@/lib/utils'

type AdminMembershipPoliciesDashboardProps = {
  overview: AdminMembershipPolicyOverview
  isSaveSuccessVisible?: boolean
}

export function AdminMembershipPoliciesDashboard({
  overview,
  isSaveSuccessVisible = false,
}: AdminMembershipPoliciesDashboardProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
      <AdminOperationToast
        key={isSaveSuccessVisible ? 'policy-saved' : 'idle'}
        state={isSaveSuccessVisible ? 'policy-saved' : null}
      />

      <section
        aria-labelledby="admin-membership-plan-list"
        className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--card)_86%,white)] p-3 shadow-[0_16px_36px_rgba(18,20,24,0.055)] xl:sticky xl:top-4 xl:max-h-[calc(100vh-8.4rem)] xl:overflow-y-auto"
      >
        <div className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-2 pb-3 pt-2">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
            Membership plans
          </p>
          <div className="mt-2 flex items-start gap-2.5">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
              <Layers3 className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="admin-membership-plan-list" className="text-lg font-medium text-[var(--wellstudio-ink)]">
                Política efectiva por plan
              </h2>
              <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
                Selecciona un plan y edita la política explícita que lee el motor.
              </p>
            </div>
          </div>
        </div>

        <nav aria-label="Planes de membresía" className="pt-2">
          <ul className="space-y-1.5">
            {overview.plans.map((plan) => {
              const isSelected = overview.selectedPlanId === plan.id

              return (
                <li key={plan.id}>
                  <Link
                    href={`/admin?plan=${encodeURIComponent(plan.id)}`}
                    className={cn(
                      'block rounded-[1.05rem] border px-3 py-3 transition-[background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                      isSelected
                        ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_32%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] shadow-[0_12px_30px_rgba(20,24,30,0.08)]'
                        : 'border-transparent bg-transparent hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] hover:bg-white',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium text-[var(--wellstudio-ink)]">{plan.name}</p>
                        <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
                          {plan.policySummaryLabel}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
                          {plan.billingSummary}
                        </p>
                      </div>
                      <div className="shrink-0 space-y-2 text-right">
                        <PolicySourceBadge tone={plan.policySourceTone}>
                          {plan.policySourceLabel}
                        </PolicySourceBadge>
                        <p className="text-xs uppercase tracking-[0.18em] text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">
                          {plan.statusLabel}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </section>

      <AdminResponsiveDetailFrame
        isOpen={Boolean(overview.selectedPlan)}
        closeHref="/admin"
        labelledBy="admin-membership-plan-detail"
        className="pb-7 sm:pb-8"
        mobileFeedback={
          <AdminOperationToast
            key={`mobile-${isSaveSuccessVisible ? 'policy-saved' : 'idle'}`}
            state={isSaveSuccessVisible ? 'policy-saved' : null}
            variant="inline"
          />
        }
      >
        <div key={overview.selectedPlan?.id ?? 'empty'} className="wellstudio-admin-panel-animate space-y-4">
          {overview.selectedPlan ? (
            <>
              <header className="space-y-4 border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                      Plan seleccionado
                    </p>
                    <div className="space-y-2">
                      <h2 id="admin-membership-plan-detail" className="text-2xl font-medium text-[var(--wellstudio-ink)]">
                        {overview.selectedPlan.name}
                      </h2>
                      <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                        {overview.selectedPlan.description || 'Sin descripción operativa registrada para este plan.'}
                      </p>
                    </div>
                  </div>
                  <PolicySourceBadge tone={overview.selectedPlan.policySourceTone}>
                    {overview.selectedPlan.policySourceLabel}
                  </PolicySourceBadge>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailPill label="Facturación" value={overview.selectedPlan.billingSummary} />
                  <DetailPill label="Estado" value={overview.selectedPlan.statusLabel} />
                  <DetailPill label="Política efectiva" value={overview.selectedPlan.policySummaryLabel} />
                </div>
              </header>

              <div className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)] shadow-[0_10px_22px_rgba(18,20,24,0.06)]">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
                      Estado operativo actual
                    </p>
                    <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                      Esta vista muestra la política efectiva. La edición se abre aparte para evitar formularios permanentes dentro del panel de lectura.
                    </p>
                  </div>
                </div>
              </div>

              <AdminMembershipPolicyEditorSheet
                key={overview.selectedPlan.id}
                plan={overview.selectedPlan}
              />
            </>
          ) : (
            <div className="flex min-h-[28rem] items-center justify-center rounded-[1.35rem] border border-dashed border-[color:color-mix(in_srgb,var(--border)_84%,white)] bg-[color:color-mix(in_srgb,var(--card)_72%,white)] px-6 py-10 text-center">
              <div className="max-w-md space-y-4">
                <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <div className="space-y-2">
                  <h2 id="admin-membership-plan-detail" className="text-xl font-medium text-[var(--wellstudio-ink)]">
                    Selecciona un plan para editar
                  </h2>
                  <p className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                    El panel derecho mostrará el fallback efectivo, el contexto comercial del plan y la acción enfocada para persistir una política explícita.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminResponsiveDetailFrame>
    </div>
  )
}

export function AdminMembershipPoliciesDashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
      <div className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--card)_86%,white)] p-3 shadow-[0_16px_36px_rgba(18,20,24,0.055)]">
        <div className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-2 pb-3 pt-2">
          <Skeleton className="h-3 w-28 rounded-full" />
          <div className="mt-3 flex items-start gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
            </div>
          </div>
        </div>
        <div className="space-y-1.5 pt-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[1.05rem] border border-transparent px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-28 rounded-full" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-3 w-24 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-28 rounded-full" />
                  <Skeleton className="h-3 w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white p-4 pb-7 shadow-[0_16px_36px_rgba(18,20,24,0.055)] sm:p-5 sm:pb-8">
        <div className="space-y-4">
          <div className="space-y-4 border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-8 w-56 rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-10/12 rounded-full" />
              </div>
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] px-4 py-4">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="mt-2 h-5 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] px-4 py-3">
            <div className="flex items-start gap-3">
              <Skeleton className="size-9 rounded-full bg-white" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-56 rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-11/12 rounded-full" />
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--card)_76%,white)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Skeleton className="size-11 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-32 rounded-full" />
                  <Skeleton className="h-6 w-48 rounded-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-9/12 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PolicySourceBadge({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'explicit' | 'legacy'
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]',
        tone === 'explicit'
          ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]'
          : 'border-[color:color-mix(in_srgb,var(--border)_88%,white)] bg-[color:color-mix(in_srgb,var(--card)_76%,white)] text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]',
      )}
    >
      {children}
    </span>
  )
}

function DetailPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-[color:color-mix(in_srgb,var(--card)_74%,white)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--wellstudio-ink)]">{value}</p>
    </div>
  )
}
