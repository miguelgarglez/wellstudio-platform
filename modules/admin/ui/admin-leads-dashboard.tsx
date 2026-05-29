'use client'

import { useActionState, useMemo, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  Search,
  Send,
  UserRound,
} from 'lucide-react'

import {
  updateAdminLeadStatusAction,
  type UpdateAdminLeadStatusActionState,
} from '@/app/(admin)/admin/leads/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { AdminOperationToast } from '@/modules/admin/ui/admin-operation-toast'
import type {
  AdminLeadListItem,
  AdminLeadOverview,
  AdminLeadStatusFilter,
} from '@/modules/leads/server/admin-leads-overview'
import { cn } from '@/lib/utils'

type AdminLeadsDashboardProps = {
  overview: AdminLeadOverview
  updatedState: 'new' | 'contacted' | 'lost' | null
}

const statusFilters: Array<{
  value: AdminLeadStatusFilter
  label: string
}> = [
  {
    value: 'all',
    label: 'Todas',
  },
  {
    value: 'new',
    label: 'Nuevas',
  },
  {
    value: 'contacted',
    label: 'Contactadas',
  },
  {
    value: 'lost',
    label: 'Perdidas',
  },
]

const leadStatusActions: Array<{
  status: 'NEW' | 'CONTACTED' | 'LOST'
  label: string
  description: string
}> = [
  {
    status: 'CONTACTED',
    label: 'Marcar contactada',
    description: 'Ya hubo contacto operativo con esta solicitud.',
  },
  {
    status: 'LOST',
    label: 'Marcar perdida',
    description: 'La solicitud deja de estar activa para seguimiento.',
  },
  {
    status: 'NEW',
    label: 'Reabrir como nueva',
    description: 'Vuelve al estado de entrada si necesita atención.',
  },
]

export function AdminLeadsDashboard({
  overview,
  updatedState,
}: AdminLeadsDashboardProps) {
  const router = useRouter()
  const [selectedLead, setSelectedLead] = useState<AdminLeadListItem | null>(null)
  const returnTo = useMemo(
    () => buildLeadsHref({
      query: overview.query,
      status: overview.statusFilter,
    }),
    [overview.query, overview.statusFilter],
  )
  const toastState = updatedState ? (`lead-${updatedState}` as const) : null

  function handleSearch(formData: FormData) {
    const query = String(formData.get('q') ?? '')
    router.push(buildLeadsHref({
      query,
      status: overview.statusFilter,
    }))
  }

  return (
    <section className="relative space-y-4">
      <AdminOperationToast state={toastState} variant="inline" />

      <div className="rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] bg-[color:color-mix(in_srgb,var(--card)_88%,white)] p-4 shadow-[0_18px_42px_rgba(18,20,24,0.06)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                Inbox operativo
              </p>
              <h2 className="mt-1 text-2xl font-medium text-[var(--wellstudio-ink)]">
                Solicitudes recientes
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
                Busca, revisa el contexto y actualiza el estado sin convertir esta vista en un CRM completo.
              </p>
            </div>
          </div>

          <AdminLeadSearchForm
            key={`${overview.statusFilter}:${overview.query}`}
            initialQuery={overview.query}
            onSearch={handleSearch}
          />
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((filter) => {
            const isActive = overview.statusFilter === filter.value

            return (
              <Link
                key={filter.value}
                href={buildLeadsHref({
                  query: overview.query,
                  status: filter.value,
                })}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                  isActive
                    ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_32%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] text-[var(--wellstudio-ink)] shadow-[0_8px_18px_rgba(20,24,30,0.06)]'
                    : 'border-[color:color-mix(in_srgb,var(--border)_82%,white)] bg-white/66 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] hover:bg-white',
                )}
              >
                {filter.label}
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-[var(--wellstudio-blue-deep)]">
                  {overview.counts[filter.value]}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] bg-white/82 shadow-[0_18px_42px_rgba(18,20,24,0.06)]">
        {overview.leads.length > 0 ? (
          <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_70%,white)]">
            {overview.leads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => setSelectedLead(lead)}
                className="group grid w-full gap-3 px-4 py-4 text-left transition-[background-color] duration-200 hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] sm:grid-cols-[minmax(0,1.35fr)_minmax(12rem,0.9fr)_minmax(8rem,0.55fr)_auto] sm:items-center sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-medium text-[var(--wellstudio-ink)]">
                      {lead.displayName}
                    </p>
                    <LeadStatusBadge lead={lead} />
                  </div>
                  <p className="mt-1 truncate text-sm text-[color:color-mix(in_srgb,var(--foreground)_66%,white)]">
                    {lead.phoneLabel}
                  </p>
                </div>

                <div className="min-w-0 space-y-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
                  <p className="truncate">{lead.emailLabel}</p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)]">
                    {lead.sourceLabel}
                  </p>
                </div>

                <div className="space-y-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
                  <p>{lead.createdAtLabel}</p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-[color:color-mix(in_srgb,var(--foreground)_52%,white)]">
                    {lead.attributionLabel ?? 'Sin UTM'}
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-white/72 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-0.5">
                  Abrir
                  <Send className="size-3.5" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <AdminLeadsEmptyState query={overview.query} />
        )}
      </div>

      <LeadDetailSheet
        lead={selectedLead}
        returnTo={returnTo}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedLead(null)
          }
        }}
      />
    </section>
  )
}

function AdminLeadSearchForm({
  initialQuery,
  onSearch,
}: {
  initialQuery: string
  onSearch: (formData: FormData) => void
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isSearching, startSearchTransition] = useTransition()

  return (
    <form
      action={(formData) => {
        startSearchTransition(() => onSearch(formData))
      }}
      className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-xl"
    >
      <label className="sr-only" htmlFor="admin-leads-search">
        Buscar solicitud
      </label>
      <Input
        id="admin-leads-search"
        name="q"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Nombre, teléfono o email..."
        className="h-12 rounded-full bg-white/86"
      />
      <Button type="submit" className="h-12 rounded-full px-6 sm:min-w-40">
        {isSearching ? (
          <>
            <Spinner data-icon="inline-start" />
            Buscando…
          </>
        ) : (
          <>
            <Search className="size-4" aria-hidden="true" />
            Buscar
          </>
        )}
      </Button>
    </form>
  )
}

export function AdminLeadsDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] bg-white/72 p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="size-11 rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)]" />
            <div className="space-y-3">
              <div className="h-3 w-36 rounded-full bg-[color:color-mix(in_srgb,var(--border)_72%,white)]" />
              <div className="h-7 w-64 rounded-full bg-[color:color-mix(in_srgb,var(--border)_64%,white)]" />
              <div className="h-4 w-80 max-w-full rounded-full bg-[color:color-mix(in_srgb,var(--border)_54%,white)]" />
            </div>
          </div>
          <div className="h-12 w-full rounded-full bg-white/80 xl:max-w-xl" />
        </div>
        <div className="mt-5 flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-28 rounded-full bg-[color:color-mix(in_srgb,var(--border)_58%,white)]"
            />
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] bg-white/72">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid gap-3 border-b border-[color:color-mix(in_srgb,var(--border)_62%,white)] px-5 py-4 sm:grid-cols-[minmax(0,1.35fr)_minmax(12rem,0.9fr)_minmax(8rem,0.55fr)_auto]"
          >
            <div className="space-y-2">
              <div className="h-4 w-44 rounded-full bg-[color:color-mix(in_srgb,var(--border)_70%,white)]" />
              <div className="h-3 w-32 rounded-full bg-[color:color-mix(in_srgb,var(--border)_54%,white)]" />
            </div>
            <div className="h-4 w-48 rounded-full bg-[color:color-mix(in_srgb,var(--border)_58%,white)]" />
            <div className="h-4 w-24 rounded-full bg-[color:color-mix(in_srgb,var(--border)_58%,white)]" />
            <div className="h-8 w-20 rounded-full bg-[color:color-mix(in_srgb,var(--border)_58%,white)]" />
          </div>
        ))}
      </div>
    </div>
  )
}

function LeadDetailSheet({
  lead,
  returnTo,
  onOpenChange,
}: {
  lead: AdminLeadListItem | null
  returnTo: string
  onOpenChange: (isOpen: boolean) => void
}) {
  const isOperable = lead ? ['NEW', 'CONTACTED', 'LOST'].includes(lead.status) : false

  return (
    <Sheet open={Boolean(lead)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto rounded-none border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-[color:color-mix(in_srgb,var(--card)_92%,white)] p-0 sm:max-w-[42rem] xl:max-w-[48rem]"
      >
        {lead ? (
          <>
            <SheetHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_76%,white)] p-6 pr-14">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                Solicitud de contacto
              </p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SheetTitle className="text-2xl text-[var(--wellstudio-ink)]">
                    {lead.displayName}
                  </SheetTitle>
                  <SheetDescription className="mt-2">
                    Detalle operativo para contactar y mantener el estado actualizado.
                  </SheetDescription>
                </div>
                <LeadStatusBadge lead={lead} />
              </div>
            </SheetHeader>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-3 lg:grid-cols-2">
                <LeadDetailCard
                  icon={Phone}
                  label="Teléfono"
                  value={lead.phoneLabel}
                />
                <LeadDetailCard
                  icon={Mail}
                  label="Email"
                  value={lead.emailLabel}
                />
              </div>

              <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-white/72 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
                  Contexto
                </p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <DetailRow label="Origen" value={lead.sourceLabel} />
                  <DetailRow label="Fecha" value={lead.createdAtLabel} />
                  <DetailRow label="UTM" value={lead.attributionLabel ?? 'No indicado'} />
                  <DetailRow label="ID" value={lead.id} />
                </dl>
              </div>

              <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)]">
                    {isOperable ? (
                      <CheckCircle2 className="size-5" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="size-5" aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium text-[var(--wellstudio-ink)]">
                      {isOperable ? 'Estado operable' : 'Estado protegido'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
                      {isOperable
                        ? 'Puedes mover esta solicitud entre nueva, contactada y perdida.'
                        : 'Este estado pertenece a un flujo posterior y no se modifica desde esta V1.'}
                    </p>
                  </div>
                </div>
              </div>

              {isOperable ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
                    Acciones
                  </p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {leadStatusActions
                      .filter((action) => action.status !== lead.status)
                      .map((action) => (
                        <LeadStatusActionForm
                          key={action.status}
                          action={action}
                          leadId={lead.id}
                          returnTo={returnTo}
                        />
                      ))}
                  </div>
                </div>
              ) : null}
            </div>

            <SheetFooter className="border-t border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-white/72 p-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function LeadStatusActionForm({
  action,
  leadId,
  returnTo,
}: {
  action: (typeof leadStatusActions)[number]
  leadId: string
  returnTo: string
}) {
  const [state, formAction] = useActionState<UpdateAdminLeadStatusActionState, FormData>(
    updateAdminLeadStatusAction,
    null,
  )

  return (
    <form
      action={formAction}
      className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-white/76 p-4 transition-[border-color,box-shadow] duration-200 hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_22%,white)] hover:shadow-[0_12px_28px_rgba(18,20,24,0.06)]"
    >
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="status" value={action.status} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="flex h-full flex-col gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[var(--wellstudio-ink)]">{action.label}</p>
          <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
            {action.description}
          </p>
          {state?.message ? (
            <p className="mt-2 text-sm text-destructive">{state.message}</p>
          ) : null}
        </div>
        <LeadStatusSubmitButton label={action.label} />
      </div>
    </form>
  )
}

function LeadStatusSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="outline"
      className="mt-auto w-full rounded-full bg-white px-4"
      disabled={pending}
    >
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          Guardando…
        </>
      ) : (
        label
      )}
    </Button>
  )
}

function LeadDetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-white/78 p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
            {label}
          </p>
          <p className="mt-1 break-all text-base font-medium leading-6 text-[var(--wellstudio-ink)]">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-[var(--wellstudio-ink)]">{value}</dd>
    </div>
  )
}

function LeadStatusBadge({ lead }: { lead: AdminLeadListItem }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em]',
        lead.statusTone === 'new'
          ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]'
          : undefined,
        lead.statusTone === 'contacted'
          ? 'border-[color:color-mix(in_srgb,#5ba774_28%,white)] bg-[color:color-mix(in_srgb,#5ba774_10%,white)] text-[#3f7d57]'
          : undefined,
        lead.statusTone === 'lost'
          ? 'border-[color:color-mix(in_srgb,var(--destructive)_24%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_8%,white)] text-destructive'
          : undefined,
        lead.statusTone === 'readonly'
          ? 'border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-white/78 text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]'
          : undefined,
      )}
    >
      {lead.statusLabel}
    </span>
  )
}

function AdminLeadsEmptyState({ query }: { query: string }) {
  return (
    <div className="flex min-h-[22rem] items-center justify-center px-5 py-12 text-center">
      <div className="max-w-md">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
          {query ? (
            <Search className="size-5" aria-hidden="true" />
          ) : (
            <UserRound className="size-5" aria-hidden="true" />
          )}
        </span>
        <h3 className="mt-4 text-xl font-medium text-[var(--wellstudio-ink)]">
          {query ? 'Sin resultados para esa búsqueda' : 'Aún no hay solicitudes'}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
          {query
            ? 'Prueba con otro nombre, teléfono o email. La búsqueda no cambia ningún estado.'
            : 'Cuando entre un lead desde la web, aparecerá aquí para que el equipo pueda contactarlo.'}
        </p>
      </div>
    </div>
  )
}

function buildLeadsHref(input: {
  query: string
  status: AdminLeadStatusFilter
}) {
  const params = new URLSearchParams()

  if (input.query.trim()) {
    params.set('q', input.query.trim())
  }

  if (input.status !== 'all') {
    params.set('status', input.status)
  }

  const queryString = params.toString()

  return queryString ? `/admin/leads?${queryString}` : '/admin/leads'
}
