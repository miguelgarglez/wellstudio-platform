'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Archive, ArrowLeft, ChevronRight, CircleUserRound, Layers3, Plus, RotateCcw, Settings2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

import {
  changeAdminCatalogStatusAction,
  saveAdminClassTypeAction,
  saveAdminCoachAction,
  type AdminCatalogActionState,
} from '@/app/(admin)/admin/sessions/catalog/actions'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { AdminClassCatalogOverview } from '@/modules/admin/server/admin-class-catalog-overview'
import { AdminOperationToast } from '@/modules/admin/ui/admin-operation-toast'

type CatalogTab = 'classes' | 'coaches'
type ClassTypeItem = AdminClassCatalogOverview['classTypes'][number]
type CoachItem = AdminClassCatalogOverview['coaches'][number]

export function AdminClassCatalogDashboard({
  overview,
  tab,
  updated,
  notice,
}: {
  overview: AdminClassCatalogOverview
  tab: CatalogTab
  updated: string | null
  notice: string | null
}) {
  const [classType, setClassType] = useState<ClassTypeItem | null | undefined>(undefined)
  const [coach, setCoach] = useState<CoachItem | null | undefined>(undefined)
  const toastState = isToastState(updated) ? updated : null

  return (
    <div className="relative">
      <AdminOperationToast state={toastState} instanceKey={notice} />
      <div className="overflow-hidden rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-[color:color-mix(in_srgb,var(--card)_84%,white)] shadow-[0_18px_48px_rgba(18,20,24,0.065)]">
        <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
              <Settings2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-medium text-[var(--wellstudio-ink)]">Recursos de Agenda</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {overview.counts.activeClassTypes} tipos activos · {overview.counts.activeCoaches} coaches activos
              </p>
            </div>
          </div>
          <Link href="/admin/sessions" className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft aria-hidden="true" />
            Volver a Agenda
          </Link>
        </div>

        <nav aria-label="Secciones del catálogo" className="grid grid-cols-2 border-b border-border/70 bg-muted/20 p-2">
          <CatalogTabLink href="/admin/sessions/catalog?tab=classes" active={tab === 'classes'}>
            Tipos de clase
          </CatalogTabLink>
          <CatalogTabLink href="/admin/sessions/catalog?tab=coaches" active={tab === 'coaches'}>
            Coaches
          </CatalogTabLink>
        </nav>

        {tab === 'classes' ? (
          <CatalogSection
            eyebrow="Programación"
            title="Tipos de clase"
            description="Define duración, aforo y comportamiento por defecto. Las sesiones ya creadas conservan sus propios datos."
            actionLabel="Nuevo tipo"
            onCreate={() => setClassType(null)}
          >
            {overview.classTypes.length ? overview.classTypes.map((item) => (
              <ClassTypeRow key={item.id} item={item} onEdit={() => setClassType(item)} />
            )) : <EmptyCatalog copy="Crea el primer tipo de clase para poder programar la Agenda." />}
          </CatalogSection>
        ) : (
          <CatalogSection
            eyebrow="Equipo"
            title="Coaches"
            description="Gestiona quién puede asignarse a una sesión sin borrar el historial de clases impartidas."
            actionLabel="Nuevo coach"
            onCreate={() => setCoach(null)}
          >
            {overview.coaches.length ? overview.coaches.map((item) => (
              <CoachRow key={item.id} item={item} onEdit={() => setCoach(item)} />
            )) : <EmptyCatalog copy="Añade el primer coach para asignarlo a nuevas sesiones." />}
          </CatalogSection>
        )}
      </div>

      <Sheet open={classType !== undefined} onOpenChange={(open) => { if (!open) setClassType(undefined) }}>
        {classType !== undefined ? <ClassTypeSheet item={classType} /> : null}
      </Sheet>
      <Sheet open={coach !== undefined} onOpenChange={(open) => { if (!open) setCoach(undefined) }}>
        {coach !== undefined ? <CoachSheet item={coach} /> : null}
      </Sheet>
    </div>
  )
}

function CatalogSection({ eyebrow, title, description, actionLabel, onCreate, children }: {
  eyebrow: string
  title: string
  description: string
  actionLabel: string
  onCreate: () => void
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">{eyebrow}</p>
          <h3 className="mt-1 text-xl font-medium text-[var(--wellstudio-ink)]">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Button onClick={onCreate} className="sm:w-auto"><Plus aria-hidden="true" />{actionLabel}</Button>
      </div>
      <div className="divide-y divide-border/65 border-t border-border/70">{children}</div>
    </section>
  )
}

function ClassTypeRow({ item, onEdit }: { item: ClassTypeItem; onEdit: () => void }) {
  return (
    <div role="group" aria-label={item.name} className="group grid min-w-0 gap-4 p-4 transition-colors hover:bg-white/55 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
      <button type="button" onClick={onEdit} className="min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[var(--wellstudio-ink)]">{item.name}</span>
          <StatusBadge active={item.status === 'ACTIVE'}>{item.status === 'ACTIVE' ? 'Activo' : item.status === 'DRAFT' ? 'Borrador' : 'Archivado'}</StatusBadge>
          {!item.isPublic ? <StatusBadge active={false}>Interno</StatusBadge> : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{item.category ?? 'Sin categoría'} · {item.durationMinutes} min · {item.capacityDefault} {item.capacityDefault === 1 ? 'plaza' : 'plazas'}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)]">{futureCopy(item.futureSessionCount)}</p>
      </button>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button type="button" variant="outline" onClick={onEdit}>Editar <ChevronRight aria-hidden="true" /></Button>
        <CatalogStatusControl entityType="class-type" entityId={item.id} name={item.name} active={item.status === 'ACTIVE'} futureSessionCount={item.futureSessionCount} />
      </div>
    </div>
  )
}

function CoachRow({ item, onEdit }: { item: CoachItem; onEdit: () => void }) {
  return (
    <div role="group" aria-label={item.displayName} className="group grid min-w-0 gap-4 p-4 transition-colors hover:bg-white/55 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
      <button type="button" onClick={onEdit} className="flex min-w-0 items-start gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/70 text-[var(--wellstudio-blue-deep)]"><CircleUserRound className="size-5" aria-hidden="true" /></span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2"><span className="font-medium text-[var(--wellstudio-ink)]">{item.displayName}</span><StatusBadge active={item.status === 'ACTIVE'}>{item.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</StatusBadge></span>
          <span className="mt-1 block text-sm text-muted-foreground">{[item.firstName, item.lastName].filter(Boolean).join(' ') || 'Sin nombre legal indicado'}</span>
          <span className="mt-2 block text-xs uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)]">{futureCopy(item.futureSessionCount)}</span>
        </span>
      </button>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button type="button" variant="outline" onClick={onEdit}>Editar <ChevronRight aria-hidden="true" /></Button>
        <CatalogStatusControl entityType="coach" entityId={item.id} name={item.displayName} active={item.status === 'ACTIVE'} futureSessionCount={item.futureSessionCount} />
      </div>
    </div>
  )
}

function CatalogStatusControl({ entityType, entityId, name, active, futureSessionCount }: {
  entityType: 'class-type' | 'coach'
  entityId: string
  name: string
  active: boolean
  futureSessionCount: number
}) {
  const [state, action] = useActionState(changeAdminCatalogStatusAction, null)
  if (!active) {
    return (
      <form action={action} className="grid gap-1">
        <input type="hidden" name="entityType" value={entityType} /><input type="hidden" name="entityId" value={entityId} /><input type="hidden" name="action" value="activate" />
        <PendingButton variant="ghost"><RotateCcw aria-hidden="true" />Reactivar</PendingButton>
        {state ? <span className="text-xs text-destructive" role="alert">{state.message}</span> : null}
      </form>
    )
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon" />}><Archive aria-hidden="true" /><span className="sr-only">Archivar {name}</span></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-muted text-[var(--wellstudio-blue-deep)]"><Archive aria-hidden="true" /></span>
          <AlertDialogTitle>Archivar {name}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {futureSessionCount
              ? `Tiene ${futureSessionCount} ${futureSessionCount === 1 ? 'sesión futura' : 'sesiones futuras'}. Debes reasignarlas o cancelarlas antes de archivar.`
              : 'Dejará de estar disponible para nuevas sesiones. El histórico se conserva y podrás reactivarlo.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state ? <p role="alert" className="rounded-xl bg-destructive/8 p-3 text-sm text-destructive">{state.message}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <form action={action} className="w-full sm:w-auto">
            <input type="hidden" name="entityType" value={entityType} /><input type="hidden" name="entityId" value={entityId} /><input type="hidden" name="action" value="archive" />
            <PendingButton disabled={futureSessionCount > 0} className="w-full">Archivar</PendingButton>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ClassTypeSheet({ item }: { item: ClassTypeItem | null }) {
  const [state, action] = useActionState(saveAdminClassTypeAction, null)
  return (
    <CatalogSheet title={item ? `Editar ${item.name}` : 'Nuevo tipo de clase'} description="Configura los valores que Agenda propondrá al crear una sesión.">
      <form action={action} className="space-y-5">
        {item ? <input type="hidden" name="classTypeId" value={item.id} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" error={fieldError(state, 'name')}><Input name="name" required minLength={2} maxLength={80} defaultValue={item?.name ?? ''} placeholder="Ej. Fuerza funcional" /></Field>
          <Field label="Categoría" error={fieldError(state, 'category')}><Input name="category" maxLength={80} defaultValue={item?.category ?? ''} placeholder="Ej. Fuerza" /></Field>
          <Field label="Duración (min)" error={fieldError(state, 'durationMinutes')}><Input name="durationMinutes" type="number" min={10} max={240} required defaultValue={item?.durationMinutes ?? 50} /></Field>
          <Field label="Aforo por defecto" error={fieldError(state, 'capacityDefault')}><Input name="capacityDefault" type="number" min={1} max={100} required defaultValue={item?.capacityDefault ?? 8} /></Field>
        </div>
        <Field label="Descripción" error={fieldError(state, 'description')}><textarea name="description" maxLength={500} rows={5} defaultValue={item?.description ?? ''} className={textareaClassName} placeholder="Qué trabaja la clase y para quién está pensada." /></Field>
        <ToggleField name="waitlistEnabled" defaultChecked={item?.waitlistEnabled ?? true} title="Lista de espera" copy="Se propone activada al crear una sesión." />
        <ToggleField name="isPublic" defaultChecked={item?.isPublic ?? true} title="Visible públicamente" copy="Permite usar este tipo en superficies públicas del catálogo." />
        {state && !state.field ? <ActionError state={state} /> : null}
        <PendingButton className="w-full">{item ? 'Guardar cambios' : 'Crear tipo de clase'}</PendingButton>
      </form>
    </CatalogSheet>
  )
}

function CoachSheet({ item }: { item: CoachItem | null }) {
  const [state, action] = useActionState(saveAdminCoachAction, null)
  return (
    <CatalogSheet title={item ? `Editar ${item.displayName}` : 'Nuevo coach'} description="Crea un perfil operativo para asignarlo a las sesiones de Agenda.">
      <form action={action} className="space-y-5">
        {item ? <input type="hidden" name="coachId" value={item.id} /> : null}
        <Field label="Nombre visible" error={fieldError(state, 'displayName')}><Input name="displayName" required minLength={2} maxLength={80} defaultValue={item?.displayName ?? ''} placeholder="Ej. Marta García" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre"><Input name="firstName" maxLength={80} defaultValue={item?.firstName ?? ''} /></Field>
          <Field label="Apellidos"><Input name="lastName" maxLength={80} defaultValue={item?.lastName ?? ''} /></Field>
        </div>
        <Field label="Bio" error={fieldError(state, 'bio')}><textarea name="bio" maxLength={500} rows={6} defaultValue={item?.bio ?? ''} className={textareaClassName} placeholder="Especialidad o contexto útil para el equipo." /></Field>
        {state && !state.field ? <ActionError state={state} /> : null}
        <PendingButton className="w-full">{item ? 'Guardar cambios' : 'Crear coach'}</PendingButton>
      </form>
    </CatalogSheet>
  )
}

function CatalogSheet({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <SheetContent side="right" className="w-full gap-0 overflow-hidden border-border/80 bg-[color:color-mix(in_srgb,var(--background)_94%,white)] data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:lg:w-[min(44rem,calc(100vw-2rem))] data-[side=right]:lg:rounded-l-[1.65rem]">
      <SheetHeader className="border-b border-border/70 p-5 pr-14 sm:p-6 sm:pr-14">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Catálogo de Agenda</p>
        <SheetTitle className="text-2xl font-medium text-[var(--wellstudio-ink)]">{title}</SheetTitle>
        <SheetDescription className="text-base leading-7">{description}</SheetDescription>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </SheetContent>
  )
}

function CatalogTabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} scroll={false} aria-current={active ? 'page' : undefined} className={cn('rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-colors', active ? 'bg-white text-[var(--wellstudio-ink)] shadow-sm' : 'text-muted-foreground hover:bg-white/60 hover:text-foreground')}>{children}</Link>
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-medium">{label}{children}{error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}</label>
}

function ToggleField({ name, defaultChecked, title, copy }: { name: string; defaultChecked: boolean; title: string; copy: string }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-border/70 bg-white/60 p-4"><input name={name} type="checkbox" defaultChecked={defaultChecked} className="mt-1 size-4 accent-[var(--wellstudio-blue)]" /><span><span className="block font-medium">{title}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{copy}</span></span></label>
}

function PendingButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus()
  return <Button type="submit" {...props} disabled={props.disabled || pending}>{pending ? 'Guardando…' : children}</Button>
}

function ActionError({ state }: { state: NonNullable<AdminCatalogActionState> }) {
  return <p role="alert" className="rounded-[1rem] border border-destructive/20 bg-destructive/7 p-3 text-sm text-destructive">{state.message}</p>
}

function StatusBadge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={cn('rounded-full border px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]', active ? 'border-[#5ba774]/20 bg-[#5ba774]/9 text-[#3f7653]' : 'border-border/70 bg-muted/55 text-muted-foreground')}>{children}</span>
}

function EmptyCatalog({ copy }: { copy: string }) {
  return <div className="grid min-h-64 place-items-center p-6 text-center"><div><Layers3 className="mx-auto size-8 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" /><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{copy}</p></div></div>
}

function fieldError(state: AdminCatalogActionState, field: string) { return state?.field === field ? state.message : undefined }
function futureCopy(count: number) { return count ? `${count} ${count === 1 ? 'sesión futura' : 'sesiones futuras'}` : 'Sin sesiones futuras' }
function isToastState(value: string | null): value is 'class-type-saved' | 'class-type-archived' | 'class-type-active' | 'coach-saved' | 'coach-archived' | 'coach-active' {
  return ['class-type-saved', 'class-type-archived', 'class-type-active', 'coach-saved', 'coach-archived', 'coach-active'].includes(value ?? '')
}

const textareaClassName = 'w-full resize-y rounded-[1.15rem] border border-input bg-white px-4 py-3 text-sm leading-6 outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function AdminClassCatalogDashboardSkeleton() {
  return <div className="animate-pulse overflow-hidden rounded-[1.5rem] border border-border/70 bg-card"><div className="h-24 border-b border-border/60 p-5"><div className="h-14 rounded-2xl bg-muted/65" /></div><div className="grid grid-cols-2 gap-2 border-b border-border/60 p-2"><div className="h-10 rounded-xl bg-muted/70" /><div className="h-10 rounded-xl bg-muted/45" /></div><div className="space-y-3 p-5"><div className="h-20 rounded-2xl bg-muted/60" /><div className="h-20 rounded-2xl bg-muted/60" /><div className="h-20 rounded-2xl bg-muted/60" /></div></div>
}
