'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2, LockKeyhole, TicketPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  updatedState: 'extra' | 'session' | 'revoked' | 'revoke-error' | null
}

export function AdminMemberOverrideActions({
  query,
  memberId,
  memberships,
  selectedMembershipId,
  selectedSessionId,
  sessionCandidates,
  updatedState,
}: AdminMemberOverrideActionsProps) {
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

  return (
    <div className="space-y-4">
      {updatedState === 'extra' ? (
        <StatusNotice
          tone="success"
          title="Override concedido"
          description="La membership ya dispone de allowance extra en el periodo natural vigente."
        />
      ) : null}

      {updatedState === 'session' ? (
        <StatusNotice
          tone="success"
          title="Session access concedido"
          description="El socio ya puede consumir esta sesión concreta mediante override manual."
        />
      ) : null}

      {updatedState === 'revoked' ? (
        <StatusNotice
          tone="success"
          title="Override revocado"
          description="La revocación ya está persistida y el historial refleja el cambio."
        />
      ) : null}

      {updatedState === 'revoke-error' ? (
        <StatusNotice
          tone="error"
          title="No hemos podido revocar el override"
          description="Recarga la vista y vuelve a intentarlo en unos segundos."
        />
      ) : null}

      <section className="rounded-[1.8rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white p-4 shadow-[0_20px_45px_rgba(18,20,24,0.06)] sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
            <TicketPlus className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-medium text-[var(--wellstudio-ink)]">
              Allowance extra
            </h2>
            <p className="mt-1 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              Concede reservas adicionales dentro del periodo natural vigente de la membership seleccionada.
            </p>
          </div>
        </div>

        <form action={extraFormAction} className="mt-5 space-y-4">
          <input type="hidden" name="query" value={query} />
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="membershipId" value={selectedMembership?.id ?? ''} />

          {extraState?.message ? (
            <StatusNotice
              tone="error"
              title="No hemos podido conceder el allowance extra"
              description={extraState.message}
            />
          ) : null}

          <SelectionSummary
            label="Membership activa"
            value={selectedMembership?.planName ?? 'Selecciona una membership activa'}
            detail={selectedMembership?.extraAllowanceHint ?? 'Sin membership seleccionada aún.'}
            tone={
              selectedMembership
                ? selectedMembership.extraAllowanceEnabled
                  ? 'ready'
                  : 'blocked'
                : 'neutral'
            }
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
              Usa un entero positivo. El dominio seguirá rechazando memberships sin política periódica.
            </p>
            {extraState?.fieldErrors?.extraBookings ? (
              <p id="extra-bookings-error" className="text-sm text-destructive" role="alert">
                {extraState.fieldErrors.extraBookings}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="extra-reason-input">Razón operativa</Label>
            <textarea
              id="extra-reason-input"
              name="reason"
              rows={3}
              placeholder="Ej. compensación puntual por incidencia en la sesión anterior…"
              aria-invalid={extraState?.fieldErrors?.reason ? true : undefined}
              aria-describedby={
                extraState?.fieldErrors?.reason ? 'extra-reason-error' : 'extra-reason-hint'
              }
              className="min-h-24 w-full rounded-[1.15rem] border border-input bg-white px-4 py-3 text-sm text-[var(--foreground)] shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <p
              id="extra-reason-hint"
              className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]"
            >
              Esta razón se audita tal cual en el historial del override.
            </p>
            {extraState?.fieldErrors?.reason ? (
              <p id="extra-reason-error" className="text-sm text-destructive" role="alert">
                {extraState.fieldErrors.reason}
              </p>
            ) : null}
          </div>

          <GrantSubmitButton
            label="Conceder allowance extra"
            pendingLabel="Concediendo…"
            disabled={!selectedMembership || !selectedMembership.extraAllowanceEnabled}
          />
        </form>
      </section>

      <section className="rounded-[1.8rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white p-4 shadow-[0_20px_45px_rgba(18,20,24,0.06)] sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
            <LockKeyhole className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-medium text-[var(--wellstudio-ink)]">
              Session access
            </h2>
            <p className="mt-1 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              Desbloquea una sesión futura publicada concreta sin alterar la política base del plan.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--wellstudio-ink)]">Sesión seleccionada</p>
            <SelectionSummary
              label="Sesión futura publicada"
              value={selectedSession?.label ?? 'Selecciona una sesión del listado inferior'}
              detail={selectedSession?.detailLabel ?? 'Sin sesión seleccionada aún.'}
              tone={selectedSession ? 'ready' : 'neutral'}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
              Sesiones candidatas
            </p>
            <div className="space-y-2">
              {sessionCandidates.length > 0 ? (
                sessionCandidates.map((session) => {
                  const isSelected = session.id === selectedSessionId

                  return (
                    <Link
                      key={session.id}
                      href={buildOverridesHref({
                        query,
                        memberId,
                        membershipId: selectedMembershipId,
                        sessionId: session.id,
                      })}
                      className={cn(
                        'block rounded-[1.15rem] border px-3 py-3 text-sm transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                        isSelected
                          ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] shadow-[0_12px_30px_rgba(18,20,24,0.06)]'
                          : 'border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-[color:color-mix(in_srgb,var(--card)_74%,white)] hover:bg-white',
                      )}
                    >
                      <p className="font-medium text-[var(--wellstudio-ink)]">{session.label}</p>
                      <p className="mt-1 text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
                        {session.detailLabel}
                      </p>
                    </Link>
                  )
                })
              ) : (
                <div className="rounded-[1.15rem] border border-dashed border-[color:color-mix(in_srgb,var(--border)_82%,white)] px-3 py-4 text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
                  No hay sesiones futuras publicadas disponibles para conceder session access ahora mismo.
                </div>
              )}
            </div>
          </div>
        </div>

        <form action={sessionFormAction} className="mt-5 space-y-4">
          <input type="hidden" name="query" value={query} />
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="membershipId" value={selectedMembership?.id ?? ''} />
          <input type="hidden" name="sessionId" value={selectedSession?.id ?? ''} />

          {sessionState?.message ? (
            <StatusNotice
              tone="error"
              title="No hemos podido conceder el session access"
              description={sessionState.message}
            />
          ) : null}

          <SelectionSummary
            label="Membership activa"
            value={selectedMembership?.planName ?? 'Selecciona una membership activa'}
            detail={
              selectedMembership?.extraAllowanceHint ??
              'El override seguirá dependiendo de una membership activa del socio.'
            }
            tone={selectedMembership ? 'ready' : 'neutral'}
          />

          <div className="space-y-2">
            <Label htmlFor="session-reason-input">Razón operativa</Label>
            <textarea
              id="session-reason-input"
              name="reason"
              rows={3}
              placeholder="Ej. acceso manual por ajuste comercial o invitación puntual…"
              aria-invalid={sessionState?.fieldErrors?.reason ? true : undefined}
              aria-describedby={
                sessionState?.fieldErrors?.reason ? 'session-reason-error' : 'session-reason-hint'
              }
              className="min-h-24 w-full rounded-[1.15rem] border border-input bg-white px-4 py-3 text-sm text-[var(--foreground)] shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <p
              id="session-reason-hint"
              className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]"
            >
              Usa una razón concreta. El historial conservará actor, vigencia y revocación si se produce.
            </p>
            {sessionState?.fieldErrors?.reason ? (
              <p id="session-reason-error" className="text-sm text-destructive" role="alert">
                {sessionState.fieldErrors.reason}
              </p>
            ) : null}
          </div>

          <GrantSubmitButton
            label="Conceder acceso a sesión"
            pendingLabel="Concediendo…"
            disabled={!selectedMembership || !selectedSession}
          />
        </form>
      </section>
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
            : 'border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-[color:color-mix(in_srgb,var(--card)_74%,white)]',
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

function GrantSubmitButton({
  label,
  pendingLabel,
  disabled,
}: {
  label: string
  pendingLabel: string
  disabled: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled || pending}
      className="min-w-52 rounded-full px-6"
    >
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
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
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div
      aria-live="polite"
      className={cn(
        'rounded-[1.25rem] border px-4 py-4',
        tone === 'success'
          ? 'border-[color:color-mix(in_srgb,#5ba774_28%,white)] bg-[color:color-mix(in_srgb,#5ba774_10%,white)]'
          : 'border-[color:color-mix(in_srgb,var(--destructive)_28%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_10%,white)]',
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
