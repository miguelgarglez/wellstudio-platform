'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronRight, Clock3, MapPin, Plus, Users } from 'lucide-react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  cancelAdminSessionAction,
  changeAdminSessionStatusAction,
  saveAdminSessionAction,
  type AdminSessionActionState,
} from '@/app/(admin)/admin/sessions/actions'
import type { AdminSessionOverview } from '@/modules/admin/server/admin-sessions-overview'
import { AdminOperationToast } from '@/modules/admin/ui/admin-operation-toast'
import { cn } from '@/lib/utils'

type Props = {
  overview: AdminSessionOverview
  updated: string | null
  notice: string | null
}

type SessionItem = AdminSessionOverview['sessions'][number]

export function AdminSessionsDashboard({ overview, updated, notice }: Props) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const groupedSessions = groupByDay(overview.sessions)
  const toastState =
    updated === 'draft'
      ? 'session-draft'
      : updated === 'published'
        ? 'session-published'
        : updated === 'closed'
          ? 'session-closed'
          : updated === 'canceled'
            ? 'session-canceled'
            : null

  function closeSelectedSession() {
    router.replace('/admin/sessions', { scroll: false })
  }

  return (
    <div className="relative">
      <AdminOperationToast state={toastState} instanceKey={notice} />

      <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-[color:color-mix(in_srgb,var(--card)_84%,white)] shadow-[0_18px_48px_rgba(18,20,24,0.065)]">
        <div className="flex flex-col gap-4 border-b border-[color:color-mix(in_srgb,var(--border)_76%,white)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
              Próximos 45 días
            </p>
            <h2 className="mt-1 text-xl font-medium text-[var(--wellstudio-ink)]">Operativa diaria</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {overview.counts.published} publicadas · {overview.counts.drafts} borradores · {overview.counts.closed} cerradas
            </p>
          </div>
          <Button className="sm:w-auto" onClick={() => setIsCreating(true)}>
            <Plus aria-hidden="true" />
            Nueva sesión
          </Button>
        </div>

        {groupedSessions.length ? (
          <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_70%,white)]">
            {groupedSessions.map((group) => (
              <section key={group.key} className="grid gap-3 p-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-5">
                <div className="sm:sticky sm:top-5 sm:self-start">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
                    {group.weekday}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[var(--wellstudio-ink)]">{group.date}</p>
                </div>
                <div className="space-y-2.5">
                  {group.sessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid min-h-[24rem] place-items-center p-6 text-center">
            <div className="max-w-md">
              <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
                <CalendarDays aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-medium">La agenda está vacía</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Crea la primera sesión como borrador o publícala directamente para abrir reservas.
              </p>
            </div>
          </div>
        )}
      </div>

      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SessionEditorSheet overview={overview} session={null} />
      </Sheet>
      <Sheet
        open={Boolean(overview.selectedSession)}
        onOpenChange={(open) => {
          if (!open) closeSelectedSession()
        }}
      >
        {overview.selectedSession ? (
          <SessionEditorSheet overview={overview} session={overview.selectedSession} />
        ) : null}
      </Sheet>
    </div>
  )
}

function SessionRow({ session }: { session: SessionItem }) {
  const startsAt = new Date(session.startsAtIso)
  const endsAt = new Date(session.endsAtIso)
  return (
    <Link
      href={`/admin/sessions?session=${session.id}`}
      scroll={false}
      className="group grid min-w-0 gap-3 rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-white/68 p-3.5 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_30%,white)] hover:bg-white hover:shadow-[0_14px_34px_rgba(18,20,24,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
    >
      <div className="flex items-center gap-2 text-[var(--wellstudio-blue-deep)]">
        <Clock3 className="size-4" aria-hidden="true" />
        <span className="font-medium tabular-nums">
          {formatTime(startsAt)}–{formatTime(endsAt)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate font-medium text-[var(--wellstudio-ink)]">{session.classTypeName}</p>
          <StatusBadge status={session.status} />
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {session.coachName}{session.locationLabel ? ` · ${session.locationLabel}` : ''}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
          <Users className="size-4" aria-hidden="true" />
          {session.reservedCount}/{session.capacity}
          {session.waitlistCount ? ` · +${session.waitlistCount}` : ''}
        </span>
        <ChevronRight className="size-4 text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  )
}

function SessionEditorSheet({ overview, session }: { overview: AdminSessionOverview; session: SessionItem | null }) {
  const [saveState, saveAction] = useActionState(saveAdminSessionAction, null)
  const [statusState, statusAction] = useActionState(changeAdminSessionStatusAction, null)
  const canEdit = !session || ['DRAFT', 'PUBLISHED', 'CLOSED'].includes(session.status)
  const defaultClassType = session
    ? overview.classTypes.find((item) => item.id === session.classTypeId)
    : overview.classTypes[0]

  return (
    <SheetContent
      side="right"
      className="w-full gap-0 overflow-hidden border-[color:color-mix(in_srgb,var(--border)_80%,white)] bg-[color:color-mix(in_srgb,var(--background)_94%,white)] data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:lg:w-[min(52rem,calc(100vw-2rem))] data-[side=right]:lg:rounded-l-[1.65rem]"
    >
      <SheetHeader className="border-b border-border/70 p-5 pr-14 sm:p-6 sm:pr-14">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Operación admin</p>
        <div className="flex flex-wrap items-center gap-2">
          <SheetTitle className="text-2xl font-medium text-[var(--wellstudio-ink)]">
            {session ? session.classTypeName : 'Nueva sesión'}
          </SheetTitle>
          {session ? <StatusBadge status={session.status} /> : null}
        </div>
        <SheetDescription className="text-base leading-7">
          {session
            ? 'Edita el contexto operativo o cambia el estado de esta sesión con trazabilidad.'
            : 'Prepara una sesión interna como borrador o publícala directamente en la agenda del socio.'}
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        {session ? <SessionSummary session={session} /> : null}
        {canEdit ? (
          <form action={saveAction} className="mt-5 space-y-5">
            {session ? <input type="hidden" name="sessionId" value={session.id} /> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo de clase" error={saveState?.field === 'classTypeId' ? saveState.message : undefined}>
                <select
                  name="classTypeId"
                  defaultValue={session?.classTypeId ?? defaultClassType?.id ?? ''}
                  required
                  className={selectClassName}
                >
                  <option value="" disabled>Selecciona una clase</option>
                  {overview.classTypes.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} · {item.durationMinutes} min</option>
                  ))}
                </select>
              </Field>
              <Field label="Coach" error={saveState?.field === 'coachId' ? saveState.message : undefined}>
                <select name="coachId" defaultValue={session?.coachId ?? ''} className={selectClassName}>
                  <option value="">Sin coach asignado</option>
                  {overview.coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>{coach.displayName}</option>
                  ))}
                </select>
              </Field>
              <Field label="Inicio" error={saveState?.field === 'startsAt' ? saveState.message : undefined}>
                <Input name="startsAt" type="datetime-local" required defaultValue={session ? toLocalInput(session.startsAtIso) : nextRoundedHour()} />
              </Field>
              <Field label="Capacidad" error={saveState?.field === 'capacity' ? saveState.message : undefined}>
                <Input name="capacity" type="number" min={1} step={1} required defaultValue={session?.capacity ?? defaultClassType?.capacityDefault ?? 8} />
              </Field>
            </div>
            <Field label="Ubicación" error={saveState?.field === 'locationLabel' ? saveState.message : undefined}>
              <Input name="locationLabel" maxLength={120} placeholder="Ej. Sala principal" defaultValue={session?.locationLabel ?? ''} />
            </Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-border/70 bg-white/60 p-4">
              <input name="waitlistEnabled" type="checkbox" defaultChecked={session?.waitlistEnabled ?? defaultClassType?.waitlistEnabled ?? true} className="mt-1 size-4 accent-[var(--wellstudio-blue)]" />
              <span><span className="block font-medium">Habilitar lista de espera</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">Permite ordenar demanda cuando se completa la capacidad.</span></span>
            </label>
            {saveState && !saveState.field ? <ActionError state={saveState} /> : null}
            {session && session.status !== 'DRAFT' ? (
              <SubmitButton
                name="publish"
                value={session.status === 'PUBLISHED' ? 'true' : 'false'}
                className="w-full"
              >
                Guardar cambios
              </SubmitButton>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <SubmitButton name="publish" value="false" variant="outline">
                  Guardar borrador
                </SubmitButton>
                <SubmitButton name="publish" value="true">Guardar y publicar</SubmitButton>
              </div>
            )}
          </form>
        ) : (
          <div className="mt-5 rounded-[1.15rem] border border-border/70 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
            Esta sesión conserva su historial, pero ya no admite cambios operativos.
          </div>
        )}

        {session && canEdit ? (
          <div className="mt-7 border-t border-border/70 pt-6">
            <h3 className="font-medium text-[var(--wellstudio-ink)]">Estado de reservas</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Cierra temporalmente, vuelve a abrir o cancela con una razón auditable.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {session.status === 'DRAFT' ? <StatusForm actionName="publish" sessionId={session.id} action={statusAction}>Publicar</StatusForm> : null}
              {session.status === 'PUBLISHED' ? <StatusForm actionName="close" sessionId={session.id} action={statusAction}>Cerrar reservas</StatusForm> : null}
              {session.status === 'CLOSED' ? <StatusForm actionName="reopen" sessionId={session.id} action={statusAction}>Reabrir reservas</StatusForm> : null}
            </div>
            {statusState ? <ActionError state={statusState} /> : null}

            <CancelSessionDialog session={session} />
          </div>
        ) : null}
      </div>
    </SheetContent>
  )
}

function CancelSessionDialog({ session }: { session: SessionItem }) {
  const [state, action] = useActionState(cancelAdminSessionAction, null)

  return (
    <AlertDialog>
      <div className="mt-5 flex flex-col gap-3 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--destructive)_18%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_4%,white)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-[var(--wellstudio-ink)]">Cancelar sesión</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Cancela reservas, devuelve créditos y expira la lista de espera.</p>
        </div>
        <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
          Revisar cancelación
        </AlertDialogTrigger>
      </div>
      <AlertDialogContent size="default" className="gap-5 p-5 sm:max-w-lg">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-xl">Cancelar {session.classTypeName}</AlertDialogTitle>
          <AlertDialogDescription className="text-left leading-6">
            La sesión seguirá en el historial. Las reservas activas se cancelarán, los créditos se devolverán y nadie será promocionado desde la waitlist.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="sessionId" value={session.id} />
          <Field label="Razón de cancelación" error={state?.message}>
            <textarea
              name="reason"
              required
              minLength={5}
              maxLength={500}
              rows={4}
              placeholder="Motivo operativo que quedará auditado…"
              className="w-full resize-none rounded-[1rem] border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </Field>
          <AlertDialogFooter className="mx-0 mb-0 rounded-[1rem] border border-border/70 bg-muted/35 p-3">
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <SubmitButton variant="destructive">Confirmar cancelación</SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SessionSummary({ session }: { session: SessionItem }) {
  return (
    <div className="grid gap-3 rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] p-4 sm:grid-cols-3">
      <Summary icon={Clock3} label="Horario" value={`${formatDateTime(new Date(session.startsAtIso))}–${formatTime(new Date(session.endsAtIso))}`} />
      <Summary icon={Users} label="Ocupación" value={`${session.reservedCount}/${session.capacity}${session.waitlistCount ? ` · +${session.waitlistCount} espera` : ''}`} />
      <Summary icon={MapPin} label="Contexto" value={`${session.coachName}${session.locationLabel ? ` · ${session.locationLabel}` : ''}`} />
    </div>
  )
}

function Summary({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="min-w-0"><span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]"><Icon className="size-4" aria-hidden="true" />{label}</span><p className="mt-2 text-sm font-medium leading-6">{value}</p></div>
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium">{label}</span>{children}{error ? <span className="mt-2 block text-sm text-destructive">{error}</span> : null}</label>
}

function SubmitButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending} {...props}>{pending ? 'Guardando…' : children}</Button>
}

function StatusForm({ actionName, sessionId, action, children }: { actionName: string; sessionId: string; action: (formData: FormData) => void; children: React.ReactNode }) {
  return <form action={action}><input type="hidden" name="sessionId" value={sessionId} /><SubmitButton name="action" value={actionName} variant="outline">{children}</SubmitButton></form>
}

function ActionError({ state }: { state: NonNullable<AdminSessionActionState> }) {
  return <p role="alert" className="mt-3 rounded-[0.9rem] bg-destructive/8 px-3 py-2 text-sm text-destructive">{state.message}</p>
}

function StatusBadge({ status }: { status: SessionItem['status'] }) {
  const labels = { DRAFT: 'Borrador', PUBLISHED: 'Publicada', CLOSED: 'Cerrada', CANCELED: 'Cancelada', COMPLETED: 'Completada' }
  return <span className={cn('rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]', status === 'PUBLISHED' ? 'border-emerald-700/15 bg-emerald-50 text-emerald-800' : status === 'CANCELED' ? 'border-destructive/15 bg-destructive/5 text-destructive' : 'border-border bg-white/70 text-muted-foreground')}>{labels[status]}</span>
}

const selectClassName = 'h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'

function groupByDay(sessions: SessionItem[]) {
  const groups = new Map<string, SessionItem[]>()
  for (const session of sessions) {
    const key = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date(session.startsAtIso))
    groups.set(key, [...(groups.get(key) ?? []), session])
  }
  return Array.from(groups, ([key, items]) => {
    const date = new Date(items[0].startsAtIso)
    return {
      key,
      weekday: new Intl.DateTimeFormat('es-ES', { weekday: 'long', timeZone: 'Europe/Madrid' }).format(date),
      date: new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }).format(date),
      sessions: items,
    }
  })
}

function formatTime(date: Date) { return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(date) }
function formatDateTime(date: Date) { return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(date) }
function toLocalInput(iso: string) {
  const parts = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Madrid' }).formatToParts(new Date(iso))
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`
}
function nextRoundedHour() {
  const date = new Date(Date.now() + 86_400_000)
  date.setMinutes(0, 0, 0)
  return toLocalInput(date.toISOString())
}

export function AdminSessionsDashboardSkeleton() {
  return <div className="animate-pulse rounded-[1.5rem] border border-border/70 bg-card p-5"><div className="h-20 rounded-2xl bg-muted/70" /><div className="mt-5 grid gap-4 sm:grid-cols-[9rem_1fr]"><div className="h-14 rounded-xl bg-muted/60" /><div className="space-y-3"><div className="h-24 rounded-2xl bg-muted/60" /><div className="h-24 rounded-2xl bg-muted/60" /><div className="h-24 rounded-2xl bg-muted/60" /></div></div></div>
}
