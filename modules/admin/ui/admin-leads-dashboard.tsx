'use client'

import { useActionState, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDown,
  ArrowRight,
  CircleDot,
  Clock3,
  Mail,
  MessageSquareText,
  Phone,
  Search,
  Send,
  UserRound,
} from 'lucide-react'

import {
  addAdminLeadNoteAction,
  loadAdminLeadActivitiesAction,
  updateAdminLeadStatusAction,
  type AdminLeadActionState,
} from '@/app/(admin)/admin/leads/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { AdminOperationToast } from '@/modules/admin/ui/admin-operation-toast'
import type {
  AdminLeadDetail,
  AdminLeadListItem,
  AdminLeadOverview,
  AdminLeadStatusFilter,
  AdminLeadTimelineItem,
} from '@/modules/leads/server/admin-leads-overview'
import type { AdminLeadOperableStatus } from '@/modules/leads/server/admin-lead-operations'
import { cn } from '@/lib/utils'

type UpdatedState = 'note' | 'new' | 'contacted' | 'qualified' | 'lost' | null

type AdminLeadsDashboardProps = {
  overview: AdminLeadOverview
  updatedState: UpdatedState
  noticeId: string | null
}

const statusFilters: Array<{ value: AdminLeadStatusFilter; label: string }> = [
  { value: 'new', label: 'Nuevas' },
  { value: 'contacted', label: 'Contactadas' },
  { value: 'qualified', label: 'Interesadas' },
  { value: 'lost', label: 'Perdidas' },
  { value: 'all', label: 'Todas' },
]

const statusOptions: Record<AdminLeadOperableStatus, { label: string; description: string }> = {
  NEW: {
    label: 'Nueva',
    description: 'Vuelve a la bandeja de solicitudes pendientes de atender.',
  },
  CONTACTED: {
    label: 'Contactada',
    description: 'El equipo ya ha hablado o intentado contactar con esta persona.',
  },
  QUALIFIED: {
    label: 'Interesada',
    description: 'Existe interés real y conviene continuar el seguimiento.',
  },
  LOST: {
    label: 'Perdida',
    description: 'Se cierra el seguimiento ordinario conservando su historial.',
  },
}

const generalQuickNotes = [
  'No contesta',
  'Solicita precios',
  'Quiere probar una clase',
  'Contactar más tarde',
]

const lostQuickNotes = [
  'No está interesada',
  'No se consigue contactar',
  'Teléfono incorrecto',
  'Eligió otro centro',
]

export function AdminLeadsDashboard({ overview, updatedState, noticeId }: AdminLeadsDashboardProps) {
  const router = useRouter()
  const selectedLead = overview.selectedLead
  const baseHref = buildLeadsHref({
    query: overview.query,
    status: overview.statusFilter,
  })
  const detailHref = selectedLead
    ? buildLeadsHref({
        query: overview.query,
        status: overview.statusFilter,
        leadId: selectedLead.id,
      })
    : baseHref

  function handleSearch(formData: FormData) {
    router.push(buildLeadsHref({
      query: String(formData.get('q') ?? ''),
      status: overview.statusFilter,
    }))
  }

  return (
    <section className="relative space-y-4">
      <AdminOperationToast
        state={updatedState ? (`lead-${updatedState}` as const) : null}
        variant="inline"
        instanceKey={noticeId}
      />

      <div className="rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] bg-[color:color-mix(in_srgb,var(--card)_88%,white)] p-4 shadow-[0_18px_42px_rgba(18,20,24,0.06)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Inbox operativo</p>
              <h2 className="mt-1 text-2xl font-medium text-[var(--wellstudio-ink)]">Solicitudes recientes</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
                Contacta, conserva notas y deja cada cambio trazado sin convertir esta vista en un CRM.
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
                href={buildLeadsHref({ query: overview.query, status: filter.value })}
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
              <Link
                key={lead.id}
                href={buildLeadsHref({
                  query: overview.query,
                  status: overview.statusFilter,
                  leadId: lead.id,
                })}
                className="group grid gap-3 px-4 py-4 text-left transition-[background-color] duration-200 hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] sm:grid-cols-[minmax(0,1.35fr)_minmax(12rem,0.9fr)_minmax(8rem,0.55fr)_auto] sm:items-center sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-medium text-[var(--wellstudio-ink)]">{lead.displayName}</p>
                    <LeadStatusBadge lead={lead} />
                  </div>
                  <p className="mt-1 truncate text-sm text-[color:color-mix(in_srgb,var(--foreground)_66%,white)]">{lead.phoneLabel}</p>
                </div>
                <div className="min-w-0 space-y-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
                  <p className="truncate">{lead.emailLabel}</p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)]">{lead.sourceLabel}</p>
                </div>
                <div className="space-y-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
                  <p>{lead.createdAtLabel}</p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-[color:color-mix(in_srgb,var(--foreground)_52%,white)]">{lead.attributionLabel ?? 'Sin UTM'}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-white/72 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-0.5">
                  Abrir <Send className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <AdminLeadsEmptyState query={overview.query} />
        )}
      </div>

      <LeadDetailSheet
        key={`${selectedLead?.id ?? 'no-lead'}:${updatedState ?? 'idle'}`}
        lead={selectedLead}
        returnTo={detailHref}
        onClose={() => router.replace(baseHref, { scroll: false })}
      />
    </section>
  )
}

function AdminLeadSearchForm({ initialQuery, onSearch }: { initialQuery: string; onSearch: (formData: FormData) => void }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isSearching, startSearchTransition] = useTransition()

  return (
    <form action={(formData) => startSearchTransition(() => onSearch(formData))} className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-xl">
      <label className="sr-only" htmlFor="admin-leads-search">Buscar solicitud</label>
      <Input id="admin-leads-search" name="q" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Nombre, teléfono o email..." className="h-12 rounded-full bg-white/86" />
      <Button type="submit" className="h-12 rounded-full px-6 sm:min-w-40" disabled={isSearching}>
        {isSearching ? <><Spinner data-icon="inline-start" />Buscando…</> : <><Search className="size-4" aria-hidden="true" />Buscar</>}
      </Button>
    </form>
  )
}

function LeadDetailSheet({
  lead,
  returnTo,
  onClose,
}: {
  lead: AdminLeadDetail | null
  returnTo: string
  onClose: () => void
}) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)

  return (
    <>
      <Sheet open={Boolean(lead)} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="overflow-y-auto rounded-none border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-[color:color-mix(in_srgb,var(--card)_94%,white)] p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[46rem] data-[side=right]:xl:max-w-[54rem]">
          {lead ? (
            <>
              <SheetHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_76%,white)] p-5 pr-14 sm:p-6 sm:pr-14">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Solicitud de contacto</p>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-2xl text-[var(--wellstudio-ink)]">{lead.displayName}</SheetTitle>
                    <SheetDescription className="mt-2">Seguimiento operativo y trazabilidad del equipo.</SheetDescription>
                  </div>
                  <LeadStatusBadge lead={lead} />
                </div>
              </SheetHeader>

              <div className="space-y-6 p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <LeadDetailCard icon={Phone} label="Teléfono" value={lead.phoneLabel} href={lead.phoneLabel !== 'Sin teléfono' ? `tel:${lead.phoneLabel.replace(/\s/g, '')}` : undefined} />
                  <LeadDetailCard icon={Mail} label="Email" value={lead.emailLabel} href={lead.emailLabel !== 'Sin email' ? `mailto:${lead.emailLabel}` : undefined} />
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">Estado actual</p>
                    <p className="mt-1 text-lg font-medium text-[var(--wellstudio-ink)]">{lead.statusLabel}</p>
                  </div>
                  <Button type="button" variant="outline" className="h-12 rounded-full px-5" onClick={() => setNoteDialogOpen(true)} disabled={lead.status === 'CONVERTED'}>
                    <MessageSquareText className="size-4" aria-hidden="true" />Añadir nota
                  </Button>
                  <Button type="button" className="h-12 rounded-full px-5" onClick={() => setStatusDialogOpen(true)} disabled={lead.allowedTransitions.length === 0}>
                    <CircleDot className="size-4" aria-hidden="true" />Cambiar estado
                  </Button>
                </div>

                <LeadTimeline lead={lead} />

                <details className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-white/62 p-4">
                  <summary className="cursor-pointer text-xs font-medium uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">Contexto de captación</summary>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <DetailRow label="Origen" value={lead.sourceLabel} />
                    <DetailRow label="Fecha" value={lead.createdAtLabel} />
                    <DetailRow label="UTM" value={lead.attributionLabel ?? 'No indicado'} />
                    <DetailRow label="ID" value={lead.id} />
                  </dl>
                </details>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {lead ? (
        <>
          <AddLeadNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} lead={lead} returnTo={returnTo} />
          <ChangeLeadStatusDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen} lead={lead} returnTo={returnTo} />
        </>
      ) : null}
    </>
  )
}

function AddLeadNoteDialog({ open, onOpenChange, lead, returnTo }: { open: boolean; onOpenChange: (open: boolean) => void; lead: AdminLeadDetail; returnTo: string }) {
  const [state, formAction] = useActionState<AdminLeadActionState, FormData>(addAdminLeadNoteAction, null)
  const [note, setNote] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">Seguimiento · {lead.displayName}</p>
          <DialogTitle className="text-2xl">Añadir nota</DialogTitle>
          <DialogDescription>Conserva contexto útil para el próximo contacto. No incluyas información médica ni datos sensibles.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="leadId" value={lead.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <QuickNoteChips values={generalQuickNotes} onSelect={setNote} />
          <LeadNoteField value={note} onChange={setNote} error={state?.field === 'note' ? state.message : null} />
          {state?.message && state.field !== 'note' ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <PendingButton label="Guardar nota" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ChangeLeadStatusDialog({ open, onOpenChange, lead, returnTo }: { open: boolean; onOpenChange: (open: boolean) => void; lead: AdminLeadDetail; returnTo: string }) {
  const [state, formAction] = useActionState<AdminLeadActionState, FormData>(updateAdminLeadStatusAction, null)
  const [status, setStatus] = useState<AdminLeadOperableStatus | null>(lead.allowedTransitions[0] ?? null)
  const [note, setNote] = useState('')
  const requiresNote = status === 'LOST'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">Estado actual · {lead.statusLabel}</p>
          <DialogTitle className="text-2xl">Cambiar estado</DialogTitle>
          <DialogDescription>El cambio y su nota se registrarán como un único evento auditable.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="leadId" value={lead.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="sr-only">Nuevo estado</legend>
            {lead.allowedTransitions.map((target) => (
              <label key={target} className={cn('cursor-pointer rounded-[1.15rem] border p-4 transition-[border-color,background-color,box-shadow] duration-150', status === target ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_42%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] shadow-[0_10px_24px_rgba(18,20,24,0.05)]' : 'border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-white/72 hover:bg-white')}>
                <input type="radio" name="status" value={target} checked={status === target} onChange={() => { setStatus(target); setNote('') }} className="sr-only" />
                <span className="font-medium text-[var(--wellstudio-ink)]">{statusOptions[target].label}</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">{statusOptions[target].description}</span>
              </label>
            ))}
          </fieldset>
          {state?.field === 'status' ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
          <QuickNoteChips values={requiresNote ? lostQuickNotes : generalQuickNotes} onSelect={setNote} />
          <LeadNoteField value={note} onChange={setNote} required={requiresNote} label={requiresNote ? 'Motivo de pérdida' : 'Nota opcional'} error={state?.field === 'note' ? state.message : null} />
          {state?.message && !state.field ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <PendingButton label={status ? `Marcar como ${statusOptions[status].label.toLowerCase()}` : 'Guardar estado'} disabled={!status} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function QuickNoteChips({ values, onSelect }: { values: string[]; onSelect: (value: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">Atajos de texto</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => <Button key={value} type="button" variant="outline" size="sm" className="rounded-full bg-white" onClick={() => onSelect(value)}>{value}</Button>)}
      </div>
    </div>
  )
}

function LeadNoteField({ value, onChange, required = true, label = 'Nota', error }: { value: string; onChange: (value: string) => void; required?: boolean; label?: string; error: string | null }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor="admin-lead-note" className="text-sm font-medium">{label}</label>
        <span className="text-xs tabular-nums text-muted-foreground">{value.length} / 1000</span>
      </div>
      <textarea id="admin-lead-note" name="note" value={value} onChange={(event) => onChange(event.target.value)} required={required} maxLength={1000} rows={5} aria-invalid={Boolean(error)} aria-describedby={error ? 'admin-lead-note-error' : undefined} className="w-full resize-y rounded-[1.15rem] border border-input bg-white px-4 py-3 text-sm leading-6 outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20" placeholder="Escribe el contexto que ayudará al siguiente contacto…" />
      {error ? <p id="admin-lead-note-error" role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

function PendingButton({ label, disabled = false }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return <Button type="submit" className="rounded-full" disabled={pending || disabled}>{pending ? <><Spinner data-icon="inline-start" />Guardando…</> : label}</Button>
}

function LeadTimeline({ lead }: { lead: AdminLeadDetail }) {
  const [items, setItems] = useState(lead.activityPage.items)
  const [nextCursor, setNextCursor] = useState(lead.activityPage.nextCursor)
  const [isLoading, startLoading] = useTransition()

  function loadMore() {
    if (!nextCursor) return
    startLoading(async () => {
      const page = await loadAdminLeadActivitiesAction({ leadId: lead.id, cursor: nextCursor })
      setItems((current) => [...current, ...page.items])
      setNextCursor(page.nextCursor)
    })
  }

  return (
    <section aria-labelledby="lead-timeline-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">Trazabilidad</p>
          <h3 id="lead-timeline-title" className="mt-1 text-xl font-medium text-[var(--wellstudio-ink)]">Historial</h3>
        </div>
        <span className="text-xs text-muted-foreground">Más reciente primero</span>
      </div>
      <ol className="mt-4 space-y-3">
        {items.map((item) => <TimelineItem key={item.id} item={item} />)}
      </ol>
      {nextCursor ? <Button type="button" variant="outline" className="mt-4 w-full rounded-full" onClick={loadMore} disabled={isLoading}>{isLoading ? <><Spinner data-icon="inline-start" />Cargando…</> : <><ArrowDown className="size-4" aria-hidden="true" />Ver anteriores</>}</Button> : null}
    </section>
  )
}

function TimelineItem({ item }: { item: AdminLeadTimelineItem }) {
  return (
    <li className={cn('rounded-[1.2rem] border bg-white/72 p-4', item.tone === 'lost' ? 'border-[color:color-mix(in_srgb,var(--destructive)_18%,white)]' : 'border-[color:color-mix(in_srgb,var(--border)_72%,white)]')}>
      <div className="flex items-start gap-3">
        <span className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-full', item.kind === 'note' ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]' : item.tone === 'lost' ? 'bg-[color:color-mix(in_srgb,var(--destructive)_9%,white)] text-destructive' : 'bg-[color:color-mix(in_srgb,#5ba774_11%,white)] text-[#3f7d57]')}>
          {item.kind === 'note' ? <MessageSquareText className="size-4" aria-hidden="true" /> : item.kind === 'created' ? <Clock3 className="size-4" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <p className="font-medium text-[var(--wellstudio-ink)]">{item.title}</p>
            <time className="shrink-0 text-xs text-muted-foreground">{item.createdAtLabel}</time>
          </div>
          {item.note ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">{item.note}</p> : null}
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--wellstudio-blue-deep)]">{item.actorLabel}</p>
        </div>
      </div>
    </li>
  )
}

function LeadDetailCard({ icon: Icon, label, value, href }: { icon: typeof Phone; label: string; value: string; href?: string }) {
  const content = <><span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">{label}</p><p className="mt-1 break-all text-base font-medium leading-6 text-[var(--wellstudio-ink)]">{value}</p></div></>
  const className = "flex items-start gap-3 rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-white/78 p-4"
  return href ? <a href={href} className={cn(className, 'transition-colors hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)]')}>{content}</a> : <div className={className}>{content}</div>
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">{label}</dt><dd className="mt-1 break-words text-[var(--wellstudio-ink)]">{value}</dd></div>
}

function LeadStatusBadge({ lead }: { lead: AdminLeadListItem }) {
  return <span className={cn('inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em]', lead.statusTone === 'new' && 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]', lead.statusTone === 'contacted' && 'border-[color:color-mix(in_srgb,#5ba774_28%,white)] bg-[color:color-mix(in_srgb,#5ba774_10%,white)] text-[#3f7d57]', lead.statusTone === 'qualified' && 'border-[color:color-mix(in_srgb,#c28a3d_30%,white)] bg-[color:color-mix(in_srgb,#c28a3d_10%,white)] text-[#8b642d]', lead.statusTone === 'lost' && 'border-[color:color-mix(in_srgb,var(--destructive)_24%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_8%,white)] text-destructive', lead.statusTone === 'readonly' && 'border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-white/78 text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]')}>{lead.statusLabel}</span>
}

function AdminLeadsEmptyState({ query }: { query: string }) {
  return <div className="flex min-h-[22rem] items-center justify-center px-5 py-12 text-center"><div className="max-w-md"><span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">{query ? <Search className="size-5" aria-hidden="true" /> : <UserRound className="size-5" aria-hidden="true" />}</span><h3 className="mt-4 text-xl font-medium text-[var(--wellstudio-ink)]">{query ? 'Sin resultados para esa búsqueda' : 'No hay solicitudes en esta bandeja'}</h3><p className="mt-2 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">{query ? 'Prueba con otro nombre, teléfono o email. La búsqueda no cambia ningún estado.' : 'Cuando haya solicitudes con este estado, aparecerán aquí para su seguimiento.'}</p></div></div>
}

export function AdminLeadsDashboardSkeleton() {
  return <div className="space-y-4"><div className="rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] bg-white/72 p-5"><div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div className="flex items-start gap-3"><div className="size-11 rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)]" /><div className="space-y-3"><div className="h-3 w-36 rounded-full bg-border/70" /><div className="h-7 w-64 rounded-full bg-border/60" /><div className="h-4 w-80 max-w-full rounded-full bg-border/50" /></div></div><div className="h-12 w-full rounded-full bg-white/80 xl:max-w-xl" /></div><div className="mt-5 flex gap-2">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-9 w-28 rounded-full bg-border/60" />)}</div></div><div className="overflow-hidden rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] bg-white/72">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="grid gap-3 border-b border-border/60 px-5 py-4 sm:grid-cols-[minmax(0,1.35fr)_minmax(12rem,0.9fr)_minmax(8rem,0.55fr)_auto]"><div className="h-4 w-44 rounded-full bg-border/70" /><div className="h-4 w-48 rounded-full bg-border/60" /><div className="h-4 w-24 rounded-full bg-border/60" /><div className="h-8 w-20 rounded-full bg-border/60" /></div>)}</div></div>
}

function buildLeadsHref(input: { query: string; status: AdminLeadStatusFilter; leadId?: string }) {
  const params = new URLSearchParams()
  if (input.query.trim()) params.set('q', input.query.trim())
  if (input.status !== 'new') params.set('status', input.status)
  if (input.leadId) params.set('lead', input.leadId)
  const queryString = params.toString()
  return queryString ? `/admin/leads?${queryString}` : '/admin/leads'
}
