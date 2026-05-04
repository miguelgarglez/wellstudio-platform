'use client'

import type { ReactNode } from 'react'
import { useActionState, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  LockKeyhole,
  TicketPlus,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import type {
  AdminMemberMembershipSummary,
  AdminSessionAccessCandidate,
} from '@/modules/admin/server/admin-member-overrides-overview'
import {
  grantExtraAllowanceOverrideAction,
  grantSessionAccessOverrideAction,
  type GrantExtraAllowanceActionState,
  type GrantSessionAccessActionState,
} from '@/app/(admin)/admin/overrides/actions'
import { cn } from '@/lib/utils'

type AdminMemberOverrideActionsProps = {
  query: string
  memberId: string
  memberships: AdminMemberMembershipSummary[]
  selectedMembershipId: string | null
  selectedSessionId: string | null
  sessionCandidates: AdminSessionAccessCandidate[]
}

type OperationMode = 'extra' | 'session'
type SessionStep = 'form' | 'choose-session'

export function AdminMemberOverrideActions({
  query,
  memberId,
  memberships,
  selectedMembershipId,
  selectedSessionId,
  sessionCandidates,
}: AdminMemberOverrideActionsProps) {
  const router = useRouter()
  const [isRouting, startRoutingTransition] = useTransition()
  const [extraState, extraFormAction] = useActionState<GrantExtraAllowanceActionState, FormData>(
    grantExtraAllowanceOverrideAction,
    null,
  )
  const [sessionState, sessionFormAction] = useActionState<GrantSessionAccessActionState, FormData>(
    grantSessionAccessOverrideAction,
    null,
  )

  const selectedMembership =
    memberships.find((membership) => membership.id === selectedMembershipId) ?? null
  const selectedSession =
    sessionCandidates.find((session) => session.id === selectedSessionId) ?? null
  const canGrantExtra = Boolean(selectedMembership?.extraAllowanceEnabled)
  const defaultMode: OperationMode = selectedSession || !canGrantExtra ? 'session' : 'extra'
  const operationKey = `${selectedMembershipId ?? 'none'}:${selectedSessionId ?? 'none'}`
  const [operationState, setOperationState] = useState<{
    key: string
    mode: OperationMode
    sessionStep: SessionStep
  }>({
    key: operationKey,
    mode: defaultMode,
    sessionStep: 'form',
  })
  const mode = operationState.key === operationKey ? operationState.mode : defaultMode
  const sessionStep =
    operationState.key === operationKey ? operationState.sessionStep : 'form'

  function updateOperationState(nextState: {
    mode?: OperationMode
    sessionStep?: SessionStep
  }) {
    setOperationState({
      key: operationKey,
      mode: nextState.mode ?? mode,
      sessionStep: nextState.sessionStep ?? sessionStep,
    })
  }

  function closeOperationSheet() {
    startRoutingTransition(() => {
      router.push(buildOverridesHref({ query, memberId }))
    })
  }

  function closeAllSheets() {
    startRoutingTransition(() => {
      router.push(buildOverridesListHref(query))
    })
  }

  function chooseSession(sessionId: string) {
    updateOperationState({ mode: 'session', sessionStep: 'form' })
    startRoutingTransition(() => {
      router.push(
        buildOverridesHref({
          query,
          memberId,
          membershipId: selectedMembershipId,
          sessionId,
        }),
      )
    })
  }

  return (
    <Sheet open={Boolean(selectedMembership)} onOpenChange={(open) => {
      if (!open) {
        closeOperationSheet()
      }
    }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:md:w-[min(48rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-none border-l border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--card)_90%,white)] p-0 shadow-[0_24px_80px_rgba(18,20,24,0.2)] md:rounded-l-[1.6rem]"
      >
        {selectedMembership ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-white/72 px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={closeOperationSheet}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Volver
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={closeAllSheets}
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Cerrar operación</span>
              </Button>
            </div>
            <SheetHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-white/72 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                Operación admin
              </p>
              <SheetTitle className="text-xl text-[var(--wellstudio-ink)]">
                Operar excepción
              </SheetTitle>
              <SheetDescription className="leading-6">
                Concede una excepción auditada sobre la membership activa seleccionada.
              </SheetDescription>
              <MembershipContext membership={selectedMembership} />
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-white/52 px-5 py-3">
                <OperationSegmentedControl
                  mode={mode}
                  canGrantExtra={canGrantExtra}
                  onModeChange={(nextMode) => {
                    updateOperationState({ mode: nextMode, sessionStep: 'form' })
                  }}
                />
              </div>

              {mode === 'extra' ? (
                <ExtraAllowanceOperation
                  query={query}
                  memberId={memberId}
                  selectedMembership={selectedMembership}
                  canGrantExtra={canGrantExtra}
                  extraState={extraState}
                  extraFormAction={extraFormAction}
                  onCancel={closeOperationSheet}
                />
              ) : (
                <SessionAccessOperation
                  query={query}
                  memberId={memberId}
                  selectedMembership={selectedMembership}
                  selectedSession={selectedSession}
                  sessionCandidates={sessionCandidates}
                  sessionState={sessionState}
                  sessionFormAction={sessionFormAction}
                  sessionStep={sessionStep}
                  isRouting={isRouting}
                  onCancel={closeOperationSheet}
                  onChooseSession={chooseSession}
                  onOpenSessionPicker={() => updateOperationState({ sessionStep: 'choose-session' })}
                  onBackToForm={() => updateOperationState({ sessionStep: 'form' })}
                />
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function MembershipContext({ membership }: { membership: AdminMemberMembershipSummary }) {
  return (
    <div className="mt-3 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
            {membership.planName}
          </p>
          <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
            {membership.windowLabel}
          </p>
        </div>
        <span className="rounded-full border border-[color:color-mix(in_srgb,#5ba774_24%,white)] bg-[color:color-mix(in_srgb,#5ba774_10%,white)] px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-[#3f7d57]">
          {membership.statusLabel}
        </span>
      </div>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
        {membership.policySummaryLabel}
      </p>
    </div>
  )
}

function OperationSegmentedControl({
  mode,
  canGrantExtra,
  onModeChange,
}: {
  mode: OperationMode
  canGrantExtra: boolean
  onModeChange: (mode: OperationMode) => void
}) {
  return (
    <div className="grid grid-cols-2 rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white/68 p-1">
      <SegmentButton
        active={mode === 'extra'}
        disabled={!canGrantExtra}
        label="Reservas extra"
        onClick={() => onModeChange('extra')}
      />
      <SegmentButton
        active={mode === 'session'}
        label="Acceso puntual"
        onClick={() => onModeChange('session')}
      />
    </div>
  )
}

function SegmentButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98]',
        active
          ? 'bg-[var(--wellstudio-blue)] text-white shadow-[0_8px_20px_rgba(32,93,157,0.16)]'
          : 'text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_7%,white)]',
        disabled ? 'cursor-not-allowed opacity-42 hover:bg-transparent' : undefined,
      )}
    >
      {label}
    </button>
  )
}

function ExtraAllowanceOperation({
  query,
  memberId,
  selectedMembership,
  canGrantExtra,
  extraState,
  extraFormAction,
  onCancel,
}: {
  query: string
  memberId: string
  selectedMembership: AdminMemberMembershipSummary
  canGrantExtra: boolean
  extraState: GrantExtraAllowanceActionState
  extraFormAction: (payload: FormData) => void
  onCancel: () => void
}) {
  return (
    <form action={extraFormAction} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="query" value={query} />
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="membershipId" value={selectedMembership.id} />

      <div className="wellstudio-admin-sheet-panel min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-4">
          <OperationHeader
            icon={<TicketPlus className="size-4" aria-hidden="true" />}
            title="Reservas extra"
            description="Añade reservas al periodo vigente de esta membership. La razón queda auditada."
          />

          {!canGrantExtra ? (
            <StatusNotice
              tone="error"
              title="No disponible para esta membership"
              description="Solo se pueden conceder reservas extra sobre políticas semanales o mensuales."
            />
          ) : null}

          {extraState?.message ? (
            <StatusNotice
              tone="error"
              title="No hemos podido conceder reservas extra"
              description={extraState.message}
            />
          ) : null}

          <SelectionSummary
            label="Membership activa"
            value={selectedMembership.planName}
            detail={selectedMembership.extraAllowanceHint}
            tone={canGrantExtra ? 'ready' : 'blocked'}
          />

          <div className="space-y-2">
            <Label htmlFor="extra-bookings-input">Reservas extra</Label>
            <Input
              id="extra-bookings-input"
              name="extraBookings"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              placeholder="Ej. 1…"
              disabled={!canGrantExtra}
              aria-invalid={extraState?.fieldErrors?.extraBookings ? true : undefined}
              aria-describedby={
                extraState?.fieldErrors?.extraBookings
                  ? 'extra-bookings-error'
                  : 'extra-bookings-hint'
              }
              className="max-w-36 bg-white"
            />
            <p
              id="extra-bookings-hint"
              className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]"
            >
              Usa un entero positivo.
            </p>
            {extraState?.fieldErrors?.extraBookings ? (
              <p id="extra-bookings-error" className="text-sm text-destructive" role="alert">
                {extraState.fieldErrors.extraBookings}
              </p>
            ) : null}
          </div>

          <ReasonField
            id="extra-reason-input"
            errorId="extra-reason-error"
            hintId="extra-reason-hint"
            error={extraState?.fieldErrors?.reason}
            placeholder="Ej. compensación puntual por incidencia en la sesión anterior…"
            hint="Esta razón se audita tal cual en el historial de excepciones."
            disabled={!canGrantExtra}
          />
        </div>
      </div>

      <SheetActionFooter
        onCancel={onCancel}
        submitLabel="Conceder reservas extra"
        pendingLabel="Concediendo…"
        disabled={!canGrantExtra}
      />
    </form>
  )
}

function SessionAccessOperation({
  query,
  memberId,
  selectedMembership,
  selectedSession,
  sessionCandidates,
  sessionState,
  sessionFormAction,
  sessionStep,
  isRouting,
  onCancel,
  onChooseSession,
  onOpenSessionPicker,
  onBackToForm,
}: {
  query: string
  memberId: string
  selectedMembership: AdminMemberMembershipSummary
  selectedSession: AdminSessionAccessCandidate | null
  sessionCandidates: AdminSessionAccessCandidate[]
  sessionState: GrantSessionAccessActionState
  sessionFormAction: (payload: FormData) => void
  sessionStep: SessionStep
  isRouting: boolean
  onCancel: () => void
  onChooseSession: (sessionId: string) => void
  onOpenSessionPicker: () => void
  onBackToForm: () => void
}) {
  if (sessionStep === 'choose-session') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="wellstudio-admin-sheet-panel min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--wellstudio-blue-deep)] transition-colors hover:text-[var(--wellstudio-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              onClick={onBackToForm}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver al formulario
            </button>

            <OperationHeader
              icon={<CalendarClock className="size-4" aria-hidden="true" />}
              title="Elegir sesión futura"
              description="Selecciona una sesión publicada. Volverás automáticamente al formulario de acceso puntual."
            />

            <div className="space-y-2">
              {sessionCandidates.length > 0 ? (
                sessionCandidates.map((session) => (
                  <SessionCandidateButton
                    key={session.id}
                    session={session}
                    isSelected={selectedSession?.id === session.id}
                    disabled={isRouting}
                    onChoose={() => onChooseSession(session.id)}
                  />
                ))
              ) : (
                <div className="rounded-[1.15rem] border border-dashed border-[color:color-mix(in_srgb,var(--border)_82%,white)] px-3 py-4 text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
                  No hay sesiones futuras publicadas disponibles ahora mismo.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-white/78 px-5 py-4">
          <Button type="button" variant="outline" className="w-full rounded-full" onClick={onBackToForm}>
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form action={sessionFormAction} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="query" value={query} />
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="membershipId" value={selectedMembership.id} />
      <input type="hidden" name="sessionId" value={selectedSession?.id ?? ''} />

      <div className="wellstudio-admin-sheet-panel min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-4">
          <OperationHeader
            icon={<LockKeyhole className="size-4" aria-hidden="true" />}
            title="Acceso puntual"
            description="Autoriza una sesión concreta para este socio. La excepción queda auditada."
          />

          {sessionState?.message ? (
            <StatusNotice
              tone="error"
              title="No hemos podido conceder acceso puntual"
              description={sessionState.message}
            />
          ) : null}

          {selectedSession ? (
            <>
              <SelectionSummary
                label="Sesión futura publicada"
                value={selectedSession.className}
                detail={`${selectedSession.dateLabel} · ${selectedSession.timeLabel} · ${selectedSession.locationLabel}`}
                tone="ready"
              />

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                onClick={onOpenSessionPicker}
              >
                Cambiar sesión
              </Button>

              <ReasonField
                id="session-reason-input"
                errorId="session-reason-error"
                hintId="session-reason-hint"
                error={sessionState?.fieldErrors?.reason}
                placeholder="Ej. acceso manual por ajuste comercial o invitación puntual…"
                hint="Usa una razón concreta. El historial conservará actor, vigencia y revocación si se produce."
              />
            </>
          ) : (
            <SessionRequiredCallout onChooseSession={onOpenSessionPicker} />
          )}
        </div>
      </div>

      <SheetActionFooter
        onCancel={onCancel}
        submitLabel={selectedSession ? 'Conceder acceso puntual' : 'Elegir sesión'}
        pendingLabel="Concediendo…"
        disabled={!selectedSession}
        fallbackAction={selectedSession ? undefined : onOpenSessionPicker}
      />
    </form>
  )
}

function SessionRequiredCallout({
  onChooseSession,
}: {
  onChooseSession: () => void
}) {
  return (
    <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)] shadow-[0_8px_20px_rgba(32,93,157,0.08)]">
          <CalendarClock className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
              Sesión requerida
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--wellstudio-ink)]">
              Elige una sesión antes de escribir la razón
            </p>
            <p className="mt-1 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              El acceso puntual autoriza una clase concreta. Primero selecciona la sesión futura publicada.
            </p>
          </div>
          <Button
            type="button"
            className="w-full rounded-full shadow-[0_10px_24px_rgba(32,93,157,0.16)]"
            onClick={onChooseSession}
          >
            Elegir sesión
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function SessionCandidateButton({
  session,
  isSelected,
  disabled,
  onChoose,
}: {
  session: AdminSessionAccessCandidate
  isSelected: boolean
  disabled: boolean
  onChoose: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChoose}
      className={cn(
        'group/session block w-full rounded-[1.15rem] border px-3 py-3 text-left transition-[border-color,background-color,box-shadow,transform,opacity] duration-180 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.99]',
        isSelected
          ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_30%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)]'
          : 'border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-white/70 hover:bg-white hover:shadow-[0_10px_24px_rgba(18,20,24,0.055)]',
        disabled ? 'opacity-70' : undefined,
      )}
    >
      <span className="grid gap-3 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] sm:items-center">
        <span className="rounded-[0.9rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] px-3 py-2">
          <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
            {session.dateLabel}
          </span>
          <span className="mt-1 block text-sm font-medium leading-5 text-[var(--wellstudio-ink)]">
            {session.timeLabel}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-base font-medium leading-6 text-[var(--wellstudio-ink)]">
            {session.className}
          </span>
          <span className="mt-1 block text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
            {session.locationLabel}
          </span>
        </span>
        <ArrowRight
          className="hidden size-4 shrink-0 text-[var(--wellstudio-blue-deep)] opacity-60 transition-transform group-hover/session:translate-x-0.5 sm:block"
          aria-hidden="true"
        />
      </span>
    </button>
  )
}

function OperationHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-medium text-[var(--wellstudio-ink)]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
          {description}
        </p>
      </div>
    </div>
  )
}

function ReasonField({
  id,
  errorId,
  hintId,
  error,
  placeholder,
  hint,
  disabled,
}: {
  id: string
  errorId: string
  hintId: string
  error?: string
  placeholder: string
  hint: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Razón operativa</Label>
      <textarea
        id={id}
        name="reason"
        rows={5}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hintId}
        className="min-h-32 w-full rounded-[1.15rem] border border-input bg-white px-4 py-3 text-sm text-[var(--foreground)] shadow-xs outline-none transition-[color,box-shadow,opacity] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-55"
      />
      <p
        id={hintId}
        className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]"
      >
        {hint}
      </p>
      {error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function SheetActionFooter({
  onCancel,
  submitLabel,
  pendingLabel,
  disabled,
  fallbackAction,
}: {
  onCancel: () => void
  submitLabel: string
  pendingLabel: string
  disabled: boolean
  fallbackAction?: () => void
}) {
  const { pending } = useFormStatus()

  if (fallbackAction) {
    return (
      <div className="grid gap-2 border-t border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-white/78 px-5 py-4 sm:grid-cols-[minmax(7.5rem,0.42fr)_minmax(0,1fr)]">
        <Button type="button" variant="outline" size="lg" className="rounded-full px-5" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" size="lg" className="rounded-full px-6" onClick={fallbackAction}>
          {submitLabel}
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-2 border-t border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-white/78 px-5 py-4 sm:grid-cols-[minmax(7.5rem,0.42fr)_minmax(0,1fr)]">
      <Button type="button" variant="outline" size="lg" className="rounded-full px-5" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" size="lg" disabled={disabled || pending} className="rounded-full px-6">
        {pending ? (
          <>
            <Spinner data-icon="inline-start" />
            {pendingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  )
}

function SelectionSummary({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: 'ready' | 'blocked' | 'neutral'
}) {
  return (
    <div
      className={cn(
        'rounded-[1.15rem] border px-3 py-3',
        tone === 'ready'
          ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)]'
          : tone === 'blocked'
            ? 'border-[color:color-mix(in_srgb,var(--destructive)_18%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_7%,white)]'
            : 'border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-white/74',
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--wellstudio-ink)]">{value}</p>
      <p className="mt-1 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
        {detail}
      </p>
    </div>
  )
}

function StatusNotice({
  tone,
  title,
  description,
}: {
  tone: 'success' | 'error'
  title: string
  description: string
}) {
  const Icon = tone === 'success' ? CheckCircle2 : LockKeyhole

  return (
    <div
      aria-live="polite"
      className={cn(
        'rounded-[1.25rem] border px-4 py-4',
        tone === 'success'
          ? 'border-[color:color-mix(in_srgb,#5ba774_28%,white)] bg-[color:color-mix(in_srgb,#5ba774_10%,white)]'
          : 'border-[color:color-mix(in_srgb,var(--destructive)_22%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_7%,white)]',
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            'mt-0.5 size-4 shrink-0',
            tone === 'success' ? 'text-[#3f7d57]' : 'text-destructive',
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-[var(--wellstudio-ink)]">{title}</p>
          <p className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

function buildOverridesHref(input: {
  query: string
  memberId: string
  membershipId?: string | null
  sessionId?: string | null
}) {
  const params = new URLSearchParams()

  if (input.query) {
    params.set('q', input.query)
  }

  params.set('member', input.memberId)

  if (input.membershipId) {
    params.set('membership', input.membershipId)
  }

  if (input.sessionId) {
    params.set('session', input.sessionId)
  }

  return `/admin/overrides?${params.toString()}`
}

function buildOverridesListHref(query: string) {
  if (!query) {
    return '/admin/overrides'
  }

  const params = new URLSearchParams()
  params.set('q', query)

  return `/admin/overrides?${params.toString()}`
}
