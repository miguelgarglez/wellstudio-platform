'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Check, ChevronRight, Clock3, MapPin, Minus, Pencil, Plus, Settings2, ShieldAlert, UserCheck, UserX, Users, X } from 'lucide-react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
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
  completeAdminSessionAction,
  saveAdminSessionAction,
  updateAdminAttendanceAction,
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
  const groupedSessions = groupByDay(overview.sessions, overview.todayKey)
  const toastState = resolveSessionToastState(updated)

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
              Hoy, próximos 45 días y 14 días recientes
            </p>
            <h2 className="mt-1 text-xl font-medium text-[var(--wellstudio-ink)]">Operativa diaria</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {overview.counts.published} publicadas · {overview.counts.drafts} borradores · {overview.counts.closed} cerradas
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/admin/sessions/catalog" className={buttonVariants({ variant: 'outline' })}>
              <Settings2 aria-hidden="true" />
              Catálogo
            </Link>
            <Button className="sm:w-auto" onClick={() => setIsCreating(true)}>
              <Plus aria-hidden="true" />
              Nueva sesión
            </Button>
          </div>
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
        <CreateSessionSheet overview={overview} />
      </Sheet>
      <Sheet
        open={Boolean(overview.selectedSession)}
        onOpenChange={(open) => {
          if (!open) closeSelectedSession()
        }}
      >
        {overview.selectedSession ? (
          <SessionDetailSheet
            overview={overview}
            session={overview.selectedSession}
            onClose={closeSelectedSession}
          />
        ) : null}
      </Sheet>
    </div>
  )
}

function resolveSessionToastState(updated: string | null) {
  switch (updated) {
    case 'draft':
      return 'session-draft'
    case 'published':
      return 'session-published'
    case 'updated':
      return 'session-updated'
    case 'updated-notified':
      return 'session-updated-notified'
    case 'closed':
      return 'session-closed'
    case 'canceled':
      return 'session-canceled'
    case 'canceled-notified':
      return 'session-canceled-notified'
    case 'attended':
      return 'attendance-attended'
    case 'no-show':
      return 'attendance-no-show'
    case 'pending':
      return 'attendance-pending'
    case 'completed':
      return 'session-completed'
    default:
      return null
  }
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

function CreateSessionSheet({ overview }: { overview: AdminSessionOverview }) {
  return (
    <SheetContent
      side="right"
      className="w-full gap-0 overflow-hidden border-[color:color-mix(in_srgb,var(--border)_80%,white)] bg-[color:color-mix(in_srgb,var(--background)_94%,white)] data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:lg:w-[min(42rem,calc(100vw-2rem))] data-[side=right]:lg:rounded-l-[1.65rem]"
    >
      <SessionSheetHeader title="Nueva sesión">
        Prepara una sesión interna como borrador o publícala directamente en la agenda del socio.
      </SessionSheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        <SessionForm overview={overview} session={null} />
      </div>
    </SheetContent>
  )
}

function SessionDetailSheet({ overview, session, onClose }: { overview: AdminSessionOverview; session: SessionItem; onClose: () => void }) {
  const [statusState, statusAction] = useActionState(changeAdminSessionStatusAction, null)
  const [isEditing, setIsEditing] = useState(false)

  return (
    <>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden border-[color:color-mix(in_srgb,var(--border)_80%,white)] bg-[color:color-mix(in_srgb,var(--background)_94%,white)] data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:lg:w-[min(52rem,calc(100vw-2rem))] data-[side=right]:lg:rounded-l-[1.65rem]"
      >
        <SessionSheetHeader title={session.classTypeName} badge={<StatusBadge status={session.status} />}>
          Revisa ocupación, asistencia y estado antes de actuar.
        </SessionSheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <SessionSummary session={session} />
          {session.isEditable ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="group mt-5 flex w-full items-center justify-between gap-4 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-white/70 p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_38%,white)] hover:bg-white hover:shadow-[0_14px_34px_rgba(18,20,24,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
                  <Pencil className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium text-[var(--wellstudio-ink)]">Editar datos de sesión</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">Horario, coach, capacidad, ubicación y lista de espera.</span>
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          ) : (
            <div className="mt-5 rounded-[1.15rem] border border-border/70 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
              Esta sesión conserva su historial, pero ya no admite cambios.
            </div>
          )}
          <AttendanceRoster session={session} />
          {session.isEditable ? (
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
      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <EditSessionSheet
          overview={overview}
          session={session}
          onBack={() => setIsEditing(false)}
          onClose={onClose}
        />
      </Sheet>
    </>
  )
}

function EditSessionSheet({ overview, session, onBack, onClose }: { overview: AdminSessionOverview; session: SessionItem; onBack: () => void; onClose: () => void }) {
  return (
    <SheetContent
      side="right"
      showCloseButton={false}
      className="w-full gap-0 overflow-hidden border-[color:color-mix(in_srgb,var(--border)_80%,white)] bg-[color:color-mix(in_srgb,var(--background)_94%,white)] data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:lg:w-[min(44rem,calc(100vw-2rem))] data-[side=right]:lg:rounded-l-[1.65rem]"
    >
      <SheetHeader className="border-b border-border/70 p-5 sm:p-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="icon-sm" onClick={onBack} aria-label="Volver al detalle de sesión">
            <ArrowLeft aria-hidden="true" />
          </Button>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Operación admin</p>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar operación">
            <X aria-hidden="true" />
          </Button>
        </div>
        <SheetTitle className="text-2xl font-medium text-[var(--wellstudio-ink)]">Editar {session.classTypeName}</SheetTitle>
        <SheetDescription className="text-base leading-7">Los cambios se validan contra la versión actual antes de reemplazar datos de agenda.</SheetDescription>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        <SessionForm overview={overview} session={session} />
      </div>
    </SheetContent>
  )
}

function SessionSheetHeader({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <SheetHeader className="border-b border-border/70 p-5 pr-14 sm:p-6 sm:pr-14">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Operación admin</p>
      <div className="flex flex-wrap items-center gap-2">
        <SheetTitle className="text-2xl font-medium text-[var(--wellstudio-ink)]">{title}</SheetTitle>
        {badge}
      </div>
      <SheetDescription className="text-base leading-7">{children}</SheetDescription>
    </SheetHeader>
  )
}

function SessionForm({ overview, session }: { overview: AdminSessionOverview; session: SessionItem | null }) {
  const [saveState, saveAction] = useActionState(saveAdminSessionAction, null)
  const defaultClassType = session
    ? overview.classTypes.find((item) => item.id === session.classTypeId)
    : overview.classTypes[0]
  const hasDemand = Boolean(session && (session.reservedCount > 0 || session.waitlistCount > 0))

  return (
    <form action={saveAction} className="space-y-5">
      {session ? <><input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="expectedUpdatedAt" value={session.updatedAtIso} /></> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo de clase" error={saveState?.field === 'classTypeId' ? saveState.message : undefined}>
          <select name="classTypeId" defaultValue={session?.classTypeId ?? defaultClassType?.id ?? ''} required className={selectClassName}>
            <option value="" disabled>Selecciona una clase</option>
            {overview.classTypes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.durationMinutes} min</option>)}
          </select>
        </Field>
        <Field label="Coach" error={saveState?.field === 'coachId' ? saveState.message : undefined}>
          <select name="coachId" defaultValue={session?.coachId ?? ''} className={selectClassName}>
            <option value="">Sin coach asignado</option>
            {overview.coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.displayName}</option>)}
          </select>
        </Field>
        <Field label="Inicio" error={saveState?.field === 'startsAt' ? saveState.message : undefined}>
          <Input name="startsAt" type="datetime-local" required defaultValue={session ? toLocalInput(session.startsAtIso) : nextRoundedHour()} />
        </Field>
        <Field label="Capacidad" error={saveState?.field === 'capacity' ? saveState.message : undefined}>
          <Input name="capacity" type="number" min={Math.max(1, session?.reservedCount ?? 1)} step={1} required defaultValue={session?.capacity ?? defaultClassType?.capacityDefault ?? 8} />
        </Field>
      </div>
      <Field label="Ubicación" error={saveState?.field === 'locationLabel' ? saveState.message : undefined}>
        <Input name="locationLabel" maxLength={120} placeholder="Ej. Sala principal" defaultValue={session?.locationLabel ?? ''} />
      </Field>
      <label className="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-border/70 bg-white/60 p-4">
        <input name="waitlistEnabled" type="checkbox" defaultChecked={session?.waitlistEnabled ?? defaultClassType?.waitlistEnabled ?? true} className="mt-1 size-4 accent-[var(--wellstudio-blue)]" />
        <span><span className="block font-medium">Habilitar lista de espera</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">Permite ordenar demanda cuando se completa la capacidad.</span></span>
      </label>
      {hasDemand ? (
        <div className="rounded-[1.1rem] border border-amber-700/15 bg-amber-50/70 p-4">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-800" aria-hidden="true" />
            <div>
              <p className="font-medium text-amber-950">Esta sesión ya tiene demanda</p>
              <p className="mt-1 text-sm leading-6 text-amber-950/70">Cambiar clase, coach u horario afecta a {session!.reservedCount} reserva{session!.reservedCount === 1 ? '' : 's'} y {session!.waitlistCount} persona{session!.waitlistCount === 1 ? '' : 's'} en espera. Al guardar, WellStudio preparará {session!.reservedCount + session!.waitlistCount} aviso{session!.reservedCount + session!.waitlistCount === 1 ? '' : 's'} transaccional{session!.reservedCount + session!.waitlistCount === 1 ? '' : 'es'}.</p>
            </div>
          </div>
          <Field label="Motivo del cambio" error={saveState?.field === 'impactReason' ? saveState.message : undefined}>
            <textarea name="impactReason" maxLength={500} rows={3} className="mt-3 w-full resize-y rounded-2xl border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" placeholder="Ej. Cambio de coach comunicado por teléfono" />
          </Field>
          <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm leading-6 text-amber-950/80">
            <input name="acknowledgeMemberImpact" type="checkbox" className="mt-1 size-4 accent-amber-800" />
            <span>He revisado el impacto y confirmo el envío de los avisos a las personas afectadas.</span>
          </label>
        </div>
      ) : null}
      {saveState && (!saveState.field || saveState.field === 'status') ? <ActionError state={saveState} /> : null}
      {session ? (
        <SubmitButton name="publish" value={session.status === 'PUBLISHED' ? 'true' : 'false'} className="w-full">Guardar cambios</SubmitButton>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <SubmitButton name="publish" value="false" variant="outline">Guardar borrador</SubmitButton>
          <SubmitButton name="publish" value="true">Guardar y publicar</SubmitButton>
        </div>
      )}
    </form>
  )
}

function AttendanceRoster({ session }: { session: SessionItem }) {
  const [completeState, completeAction] = useActionState(completeAdminSessionAction, null)
  const canComplete = session.hasEnded && session.attendance.pending === 0 && ['PUBLISHED', 'CLOSED'].includes(session.status)

  return (
    <section className="mt-6 border-t border-border/70 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">Operativa de sala</p>
          <h3 className="mt-1 text-lg font-medium text-[var(--wellstudio-ink)]">Asistencia</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {session.isAttendanceOpen
              ? 'Registra check-in o no-show. Las correcciones quedan auditadas.'
              : 'El check-in se habilita dos horas antes del inicio.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <AttendanceCount label="Pendientes" value={session.attendance.pending} tone="pending" />
          <AttendanceCount label="Asistieron" value={session.attendance.attended} tone="attended" />
          <AttendanceCount label="No vinieron" value={session.attendance.noShow} tone="no-show" />
        </div>
      </div>

      {session.roster.length ? (
        <div className="mt-4 divide-y divide-border/70 overflow-hidden rounded-[1.15rem] border border-border/70 bg-white/65">
          {session.roster.map((reservation) => (
            <AttendanceRow
              key={reservation.reservationId}
              reservation={reservation}
              enabled={session.isAttendanceOpen}
              allowPending={session.status !== 'COMPLETED'}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.15rem] border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Esta sesión no tiene reservas activas en el roster.
        </div>
      )}

      {session.hasEnded && ['PUBLISHED', 'CLOSED'].includes(session.status) ? (
        <form action={completeAction} className="mt-4 rounded-[1.1rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] p-4">
          <input type="hidden" name="sessionId" value={session.id} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Finalizar sesión</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {session.attendance.pending
                  ? `Resuelve ${session.attendance.pending} asistencia${session.attendance.pending === 1 ? '' : 's'} pendiente${session.attendance.pending === 1 ? '' : 's'} antes de completar.`
                  : 'Todo el roster está resuelto. Puedes cerrar la sesión como completada.'}
              </p>
            </div>
            <SubmitButton disabled={!canComplete} className="shrink-0">Completar sesión</SubmitButton>
          </div>
          {completeState ? <ActionError state={completeState} /> : null}
        </form>
      ) : null}
    </section>
  )
}

function AttendanceRow({
  reservation,
  enabled,
  allowPending,
}: {
  reservation: SessionItem['roster'][number]
  enabled: boolean
  allowPending: boolean
}) {
  const [state, action] = useActionState(updateAdminAttendanceAction, null)
  return (
    <div
      role="group"
      aria-label={`Asistencia de ${reservation.memberName}, ${reservation.memberEmail}`}
      className="grid gap-3 p-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-[var(--wellstudio-ink)]">{reservation.memberName}</p>
          <AttendanceBadge status={reservation.attendanceStatus} />
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground" translate="no">{reservation.memberEmail}</p>
        {state ? <ActionError state={state} /> : null}
      </div>
      <form action={action} className="grid grid-cols-3 gap-1 rounded-[0.95rem] border border-border/70 bg-muted/35 p-1">
        <input type="hidden" name="reservationId" value={reservation.reservationId} />
        <input type="hidden" name="expectedStatus" value={reservation.attendanceStatus} />
        <AttendanceButton value="PENDING" label="Pendiente" active={reservation.attendanceStatus === 'PENDING'} disabled={!enabled || !allowPending} icon={Minus} />
        <AttendanceButton value="ATTENDED" label="Asistió" active={reservation.attendanceStatus === 'ATTENDED'} disabled={!enabled} icon={UserCheck} />
        <AttendanceButton value="NO_SHOW" label="No vino" active={reservation.attendanceStatus === 'NO_SHOW'} disabled={!enabled} icon={UserX} />
      </form>
    </div>
  )
}

function AttendanceButton({ value, label, active, disabled, icon: Icon }: { value: string; label: string; active: boolean; disabled: boolean; icon: typeof Check }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      name="attendanceStatus"
      value={value}
      variant="ghost"
      size="sm"
      disabled={disabled || pending || active}
      aria-pressed={active}
      className={cn('min-w-0 gap-1 px-2 text-[11px] sm:text-xs', active ? 'bg-white text-[var(--wellstudio-ink)] shadow-sm' : 'text-muted-foreground')}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{pending ? 'Guardando…' : label}</span>
    </Button>
  )
}

function AttendanceCount({ label, value, tone }: { label: string; value: number; tone: 'pending' | 'attended' | 'no-show' }) {
  return <span className={cn('rounded-full border px-2.5 py-1', tone === 'attended' ? 'border-emerald-700/15 bg-emerald-50 text-emerald-800' : tone === 'no-show' ? 'border-amber-700/15 bg-amber-50 text-amber-800' : 'border-border bg-white text-muted-foreground')}>{label} · {value}</span>
}

function AttendanceBadge({ status }: { status: SessionItem['roster'][number]['attendanceStatus'] }) {
  const label = status === 'ATTENDED' ? 'Asistió' : status === 'NO_SHOW' ? 'No vino' : 'Pendiente'
  return <span className="rounded-full border border-border bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
}

function CancelSessionDialog({ session }: { session: SessionItem }) {
  const [state, action] = useActionState(cancelAdminSessionAction, null)

  return (
    <AlertDialog>
      <div className="mt-5 flex flex-col gap-3 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--destructive)_18%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_4%,white)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-[var(--wellstudio-ink)]">Cancelar sesión</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Cancela reservas, devuelve créditos, expira la lista de espera y avisa a las personas afectadas.</p>
        </div>
        <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
          Revisar cancelación
        </AlertDialogTrigger>
      </div>
      <AlertDialogContent size="default" className="gap-5 p-5 sm:max-w-lg">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-xl">Cancelar {session.classTypeName}</AlertDialogTitle>
          <AlertDialogDescription className="text-left leading-6">
            La sesión seguirá en el historial. Las reservas activas se cancelarán, los créditos se devolverán, la waitlist se cerrará y se prepararán {session.reservedCount + session.waitlistCount} aviso{session.reservedCount + session.waitlistCount === 1 ? '' : 's'} trazable{session.reservedCount + session.waitlistCount === 1 ? '' : 's'}.
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
              placeholder="Motivo que quedará en la auditoría…"
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

function SubmitButton({ children, disabled, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus()
  return <Button type="submit" {...props} disabled={pending || disabled}>{pending ? 'Guardando…' : children}</Button>
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

function groupByDay(sessions: SessionItem[], todayKey: string) {
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
  }).sort((left, right) => {
    const leftIsCurrentOrFuture = left.key >= todayKey
    const rightIsCurrentOrFuture = right.key >= todayKey
    if (leftIsCurrentOrFuture !== rightIsCurrentOrFuture) return leftIsCurrentOrFuture ? -1 : 1
    return leftIsCurrentOrFuture
      ? left.key.localeCompare(right.key)
      : right.key.localeCompare(left.key)
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
