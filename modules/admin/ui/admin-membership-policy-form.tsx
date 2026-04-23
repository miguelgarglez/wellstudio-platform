'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import type { AdminMembershipPolicyPlanItem } from '@/modules/admin/server/admin-membership-policy-overview'
import {
  updateMembershipBookingPolicyAction,
  type UpdateMembershipBookingPolicyActionState,
} from '@/app/(admin)/admin/actions'
import { cn } from '@/lib/utils'

type AdminMembershipPolicyFormProps = {
  plan: AdminMembershipPolicyPlanItem
  isSuccessVisible?: boolean
}

const policyOptions: Array<{
  value: AdminMembershipPolicyPlanItem['editMode']
  label: string
  description: string
}> = [
  {
    value: 'UNLIMITED',
    label: 'Unlimited',
    description: 'El plan no consume allowance periódica para reservar.',
  },
  {
    value: 'CALENDAR_WEEK',
    label: 'Allowance semanal',
    description: 'El socio consume una cuota semanal natural de lunes a domingo.',
  },
  {
    value: 'CALENDAR_MONTH',
    label: 'Allowance mensual',
    description: 'El socio consume una cuota mensual natural del día 1 al cierre.',
  },
]

export function AdminMembershipPolicyForm({
  plan,
  isSuccessVisible = false,
}: AdminMembershipPolicyFormProps) {
  const [state, formAction] = useActionState<UpdateMembershipBookingPolicyActionState, FormData>(
    updateMembershipBookingPolicyAction,
    null,
  )
  const [policyMode, setPolicyMode] = useState(plan.editMode)
  const [allowanceCount, setAllowanceCount] = useState(plan.allowanceCount)

  const isPeriodicPolicy = policyMode !== 'UNLIMITED'

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="planId" value={plan.id} />

      {isSuccessVisible ? (
        <StatusNotice
          tone="success"
          title="Política guardada"
          description="La política explícita ya está persistida y la vista se ha recargado con el estado actualizado."
        />
      ) : null}

      {state?.message ? (
        <StatusNotice
          tone="error"
          title="No hemos podido guardar la política"
          description={state.message}
        />
      ) : null}

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--wellstudio-ink)]">
          Régimen de reserva
        </legend>
        <div className="grid gap-3">
          {policyOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                'group relative block cursor-pointer rounded-[1.25rem] border px-4 py-4 transition-[border-color,background-color,box-shadow] duration-200 focus-within:ring-2 focus-within:ring-[var(--ring)]',
                policyMode === option.value
                  ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_32%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] shadow-[0_12px_28px_rgba(20,24,30,0.06)]'
                  : 'border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-[color:color-mix(in_srgb,var(--card)_72%,white)] hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,white)] hover:bg-white',
              )}
            >
              <input
                className="sr-only"
                type="radio"
                name="policyMode"
                value={option.value}
                checked={policyMode === option.value}
                onChange={() => setPolicyMode(option.value)}
              />
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 inline-flex size-4 rounded-full border transition-colors duration-200',
                    policyMode === option.value
                      ? 'border-[var(--wellstudio-blue)] bg-[var(--wellstudio-blue)] shadow-[inset_0_0_0_3px_white]'
                      : 'border-[color:color-mix(in_srgb,var(--border)_90%,white)] bg-white',
                  )}
                />
                <span className="min-w-0 space-y-1">
                  <span className="block text-sm font-medium text-[var(--wellstudio-ink)]">
                    {option.label}
                  </span>
                  <span className="block text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                    {option.description}
                  </span>
                </span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {isPeriodicPolicy ? (
        <div className="space-y-2">
          <Label htmlFor={`allowance-count-${plan.id}`}>Reservas disponibles por periodo</Label>
          <Input
            id={`allowance-count-${plan.id}`}
            name="allowanceCount"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={allowanceCount}
            onChange={(event) => setAllowanceCount(event.target.value)}
            aria-invalid={state?.fieldErrors?.allowanceCount ? true : undefined}
            aria-describedby={
              state?.fieldErrors?.allowanceCount
                ? `allowance-count-${plan.id}-error`
                : `allowance-count-${plan.id}-hint`
            }
            placeholder="Ej. 8…"
            className="max-w-48 bg-white"
          />
          <p
            id={`allowance-count-${plan.id}-hint`}
            className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]"
          >
            Usa un entero positivo. El motor aplicará semana natural o mes natural según el modo elegido.
          </p>
          {state?.fieldErrors?.allowanceCount ? (
            <p
              id={`allowance-count-${plan.id}-error`}
              className="text-sm text-destructive"
              role="alert"
            >
              {state.fieldErrors.allowanceCount}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
          Al guardar, el plan pasa a depender de una política explícita y deja de leerse solo por fallback legacy.
        </p>
      </div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" className="min-w-44 rounded-full px-6">
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          Guardando…
        </>
      ) : (
        'Guardar política'
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
