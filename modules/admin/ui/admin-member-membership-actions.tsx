'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { CalendarRange, CircleAlert, Plus, XCircle } from 'lucide-react'

import {
  assignManualMembershipAction,
  endManualMembershipAction,
  type AdminMembershipActionState,
} from '@/app/(admin)/admin/members/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import type {
  AdminMemberDetail,
  AdminMembershipPlanOption,
} from '@/modules/admin/server/admin-members-overview'
import { cn } from '@/lib/utils'

type MembershipItem = AdminMemberDetail['memberships'][number]

export function AdminAssignMembershipAction({
  member,
  plans,
  returnTo,
}: {
  member: AdminMemberDetail
  plans: AdminMembershipPlanOption[]
  returnTo: string
}) {
  const [open, setOpen] = useState(false)
  const hasActiveMembership = member.memberships.some((membership) => membership.status === 'ACTIVE')

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        type="button"
        size="sm"
        className="rounded-full"
        disabled={plans.length === 0 || hasActiveMembership}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" aria-hidden="true" />
        Asignar membership
      </Button>
      {hasActiveMembership ? (
        <p className="max-w-52 text-right text-[11px] leading-4 text-muted-foreground">Finaliza la cobertura activa para sustituirla.</p>
      ) : null}
      <AssignMembershipDialog
        key={`${member.id}:${open ? 'open' : 'closed'}`}
        open={open}
        onOpenChange={setOpen}
        member={member}
        plans={plans}
        returnTo={returnTo}
      />
    </div>
  )
}

export function AdminEndMembershipAction({
  memberId,
  membership,
  returnTo,
}: {
  memberId: string
  membership: MembershipItem
  returnTo: string
}) {
  const [open, setOpen] = useState(false)

  if (!membership.canEndManually) return null

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-full px-2.5 text-destructive hover:bg-destructive/7 hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <XCircle className="size-3.5" aria-hidden="true" />
        Finalizar
      </Button>
      <EndMembershipDialog
        key={`${membership.id}:${open ? 'open' : 'closed'}`}
        open={open}
        onOpenChange={setOpen}
        memberId={memberId}
        membership={membership}
        returnTo={returnTo}
      />
    </>
  )
}

function AssignMembershipDialog({
  open,
  onOpenChange,
  member,
  plans,
  returnTo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: AdminMemberDetail
  plans: AdminMembershipPlanOption[]
  returnTo: string
}) {
  const [state, action] = useActionState<AdminMembershipActionState, FormData>(
    assignManualMembershipAction,
    null,
  )
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? '')
  const [startsOn, setStartsOn] = useState(todayInMadrid())
  const [endsOn, setEndsOn] = useState(addCalendarMonth(todayInMadrid()))
  const [openEnded, setOpenEnded] = useState(false)
  const hasActive = member.memberships.some((membership) => membership.status === 'ACTIVE')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,52rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden max-sm:inset-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0 sm:max-w-3xl">
        <DialogHeader>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
            Cobertura comercial · Gestión interna
          </p>
          <DialogTitle className="text-2xl">Asignar membership a {member.displayName}</DialogTitle>
          <DialogDescription>
            Registra una cobertura gestionada por el centro. No crea un cobro ni una suscripción externa.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex min-h-0 flex-col overflow-hidden">
          <input type="hidden" name="memberId" value={member.id} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
            {hasActive ? (
            <div className="flex gap-3 rounded-[1rem] border border-[color:color-mix(in_srgb,#d69b45_26%,white)] bg-[color:color-mix(in_srgb,#d69b45_7%,white)] p-3.5 text-sm leading-6 text-[var(--wellstudio-ink)]">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#9a681f]" aria-hidden="true" />
              <p>
                Ya existe una membership activa. Finalízala antes de asignar una nueva cobertura manual.
              </p>
            </div>
            ) : null}

          <fieldset>
            <legend className="text-sm font-medium text-[var(--wellstudio-ink)]">Plan activo</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {plans.map((plan) => {
                const selected = selectedPlanId === plan.id
                return (
                  <label
                    key={plan.id}
                    className={cn(
                      'cursor-pointer rounded-[1.15rem] border p-4 transition-[border-color,background-color,box-shadow] duration-200',
                      selected
                        ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_52%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_7%,white)] shadow-[0_10px_24px_rgba(20,24,30,0.06)]'
                        : 'border-border/70 bg-white/72 hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)]',
                    )}
                  >
                    <input
                      type="radio"
                      name="planId"
                      value={plan.id}
                      checked={selected}
                      onChange={() => setSelectedPlanId(plan.id)}
                      className="sr-only"
                    />
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <strong className="block font-medium text-[var(--wellstudio-ink)]">{plan.name}</strong>
                        <span className="mt-1 block text-sm text-muted-foreground">{plan.priceLabel} · {plan.billingLabel}</span>
                      </span>
                      <span className="shrink-0 rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] bg-white/75 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--wellstudio-blue-deep)]">
                        {plan.policyLabel}
                      </span>
                    </span>
                    {plan.description ? <span className="mt-3 block text-xs leading-5 text-muted-foreground">{plan.description}</span> : null}
                  </label>
                )
              })}
            </div>
            {state?.field === 'planId' ? <FieldError>{state.message}</FieldError> : null}
          </fieldset>

          <div className="grid gap-4 rounded-[1.15rem] border border-border/70 bg-white/68 p-4 sm:grid-cols-2">
            <div>
              <label htmlFor="membership-starts-on" className="text-sm font-medium text-[var(--wellstudio-ink)]">Inicio</label>
              <input
                id="membership-starts-on"
                name="startsOn"
                type="date"
                required
                max={todayInMadrid()}
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                className={fieldClassName}
              />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Usa hoy o una fecha pasada si necesitas regularizar el alta.</p>
              {state?.field === 'startsOn' ? <FieldError>{state.message}</FieldError> : null}
            </div>
            <div>
              <label htmlFor="membership-ends-on" className="text-sm font-medium text-[var(--wellstudio-ink)]">Último día</label>
              <input
                id="membership-ends-on"
                name="endsOn"
                type="date"
                required={!openEnded}
                disabled={openEnded}
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                className={cn(fieldClassName, openEnded && 'cursor-not-allowed opacity-50')}
              />
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="openEnded"
                  checked={openEnded}
                  onChange={(event) => setOpenEnded(event.target.checked)}
                  className="size-4 rounded border-input accent-[var(--wellstudio-blue)]"
                />
                Sin fecha de fin
              </label>
              {state?.field === 'endsOn' ? <FieldError>{state.message}</FieldError> : null}
            </div>
          </div>

          <ReasonField
            id="membership-assignment-reason"
            label="Motivo de asignación"
            placeholder="Ej. alta abonada en recepción o cortesía autorizada…"
            error={state?.field === 'reason' ? state.message : null}
          />

            {state?.message && !state.field ? <FieldError>{state.message}</FieldError> : null}
          </div>

          <DialogFooter className="mt-4 shrink-0 border-t border-border/70 pt-4">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <SubmitButton label="Asignar membership" pendingLabel="Asignando…" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EndMembershipDialog({
  open,
  onOpenChange,
  memberId,
  membership,
  returnTo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
  membership: MembershipItem
  returnTo: string
}) {
  const [state, action] = useActionState<AdminMembershipActionState, FormData>(
    endManualMembershipAction,
    null,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-sm:inset-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0 sm:max-w-xl">
        <DialogHeader>
          <span className="mb-2 inline-flex size-11 items-center justify-center rounded-full bg-destructive/8 text-destructive">
            <CalendarRange className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="text-2xl">Finalizar {membership.planName}</DialogTitle>
          <DialogDescription>
            La cobertura dejará de admitir nuevas reservas. Las reservas ya confirmadas se conservan y podrán cancelarse con normalidad.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-5">
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="membershipId" value={membership.id} />
          <input type="hidden" name="expectedStatus" value={membership.status} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="rounded-[1.1rem] border border-destructive/15 bg-destructive/4 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-destructive">Membership afectada</p>
            <p className="mt-2 font-medium text-[var(--wellstudio-ink)]">{membership.planName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{membership.windowLabel} · {membership.statusLabel}</p>
          </div>

          <ReasonField
            id={`membership-end-reason-${membership.id}`}
            label="Motivo de finalización"
            placeholder="Ej. baja solicitada por el socio…"
            error={state?.field === 'reason' ? state.message : null}
          />

          {state?.message && !state.field ? <FieldError>{state.message}</FieldError> : null}

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Volver</Button>
            <SubmitButton label="Finalizar membership" pendingLabel="Finalizando…" destructive />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ReasonField({
  id,
  label,
  placeholder,
  error,
}: {
  id: string
  label: string
  placeholder: string
  error: string | null
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-[var(--wellstudio-ink)]">{label}</label>
      <textarea
        id={id}
        name="reason"
        required
        minLength={5}
        maxLength={240}
        rows={3}
        placeholder={placeholder}
        className="mt-2 w-full resize-none rounded-[1.1rem] border border-input bg-white/86 px-4 py-3 text-sm leading-6 outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
      />
      <p className="mt-2 text-xs leading-5 text-muted-foreground">El motivo y el operador quedarán registrados en auditoría.</p>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  )
}

function SubmitButton({
  label,
  pendingLabel,
  destructive = false,
}: {
  label: string
  pendingLabel: string
  destructive?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={destructive ? 'destructive' : 'default'} className="rounded-full" disabled={pending}>
      {pending ? <><Spinner data-icon="inline-start" />{pendingLabel}</> : label}
    </Button>
  )
}

function FieldError({ children }: { children: string }) {
  return <p role="alert" className="mt-2 text-sm leading-5 text-destructive">{children}</p>
}

function todayInMadrid() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function addCalendarMonth(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const candidate = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, 0)).getUTCDate()
  return [
    candidate.getUTCFullYear(),
    String(candidate.getUTCMonth() + 1).padStart(2, '0'),
    String(Math.min(day, lastDay)).padStart(2, '0'),
  ].join('-')
}

const fieldClassName = 'mt-2 h-11 w-full rounded-full border border-input bg-white/86 px-4 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35'
