'use client'

import type { ReactNode } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, ArrowRight, CheckCircle2, Send } from 'lucide-react'

import { createPublicLeadAction, type PublicLeadActionState } from '@/app/(public)/actions'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { LandingLeadAttribution } from '@/modules/public/ui/landing/public-landing-page'

const initialState: PublicLeadActionState = null

type PublicLeadFormProps = {
  leadAttribution?: LandingLeadAttribution
}

export function PublicLeadForm({ leadAttribution }: PublicLeadFormProps) {
  const [state, formAction] = useActionState<PublicLeadActionState, FormData>(
    createPublicLeadAction,
    initialState,
  )

  const fieldErrors = state?.success === false ? state.fieldErrors : {}

  return (
    <form
      action={formAction}
      className="relative overflow-hidden rounded-[2rem] border border-white/24 bg-white px-5 py-5 text-[var(--wellstudio-ink)] shadow-[0_24px_70px_rgba(8,10,12,0.18)] sm:px-6 sm:py-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_12%_20%,rgba(79,137,197,0.12),transparent_42%)]"
      />
      <input
        type="hidden"
        name="utmSource"
        value={leadAttribution?.utmSource ?? ''}
      />
      <input
        type="hidden"
        name="utmMedium"
        value={leadAttribution?.utmMedium ?? ''}
      />
      <input
        type="hidden"
        name="utmCampaign"
        value={leadAttribution?.utmCampaign ?? ''}
      />
      <div
        className="absolute left-[-100vw] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <Label htmlFor="public-lead-website">Website</Label>
        <Input
          id="public-lead-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="relative flex flex-col items-start gap-3 sm:flex-row">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] text-[var(--wellstudio-blue-deep)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
        >
          <Send className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
            Solicitar información
          </p>
          <h3 className="mt-2 text-[1.48rem] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-2xl sm:leading-[1.02]">
            Cuéntanos cómo contactarte
          </h3>
          <p className="mt-2 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
            Déjanos tu teléfono y te llamamos para orientarte antes de empezar.
          </p>
        </div>
      </div>

      <div className="relative mt-5 space-y-4">
        {state ? (
          <PublicLeadStatusNotice state={state} />
        ) : null}

        <FormField
          id="public-lead-name"
          label="Nombre"
          error={fieldErrors.name}
        >
          <Input
            id="public-lead-name"
            name="name"
            autoComplete="given-name"
            placeholder="Ej. Marta"
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? 'public-lead-name-error' : undefined}
            className="bg-white transition-[border-color,box-shadow,transform] duration-150 focus-visible:scale-[1.01] motion-reduce:transition-none motion-reduce:focus-visible:scale-100"
          />
        </FormField>

        <FormField
          id="public-lead-phone"
          label="Teléfono"
          error={fieldErrors.phone}
        >
          <Input
            id="public-lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Ej. 612 345 678"
            aria-invalid={fieldErrors.phone ? true : undefined}
            aria-describedby={fieldErrors.phone ? 'public-lead-phone-error' : undefined}
            className="bg-white transition-[border-color,box-shadow,transform] duration-150 focus-visible:scale-[1.01] motion-reduce:transition-none motion-reduce:focus-visible:scale-100"
          />
        </FormField>

        <FormField
          id="public-lead-email"
          label="Email opcional"
          error={fieldErrors.email}
        >
          <Input
            id="public-lead-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'public-lead-email-error' : undefined}
            className="bg-white transition-[border-color,box-shadow,transform] duration-150 focus-visible:scale-[1.01] motion-reduce:transition-none motion-reduce:focus-visible:scale-100"
          />
        </FormField>

        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)] px-4 py-4 text-sm leading-6 transition-[border-color,background-color,transform] duration-150 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100">
            <Checkbox
              id="public-lead-privacy"
              name="privacyAccepted"
              className="mt-1 size-5"
              aria-invalid={fieldErrors.privacyAccepted ? true : undefined}
              aria-describedby={
                fieldErrors.privacyAccepted ? 'public-lead-privacy-error' : undefined
              }
            />
            <span className="text-[color:color-mix(in_srgb,var(--foreground)_76%,white)]">
              Acepto la{' '}
              <a
                href="/privacy-policy"
                className="font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:underline"
              >
                política de privacidad
              </a>{' '}
              para que WellStudio pueda contactar conmigo sobre mi solicitud.
            </span>
          </label>
          {fieldErrors.privacyAccepted ? (
            <p
              id="public-lead-privacy-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {fieldErrors.privacyAccepted}
            </p>
          ) : null}
        </div>

        <SubmitButton />
      </div>
    </form>
  )
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-[var(--wellstudio-ink)]"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

function PublicLeadStatusNotice({ state }: { state: NonNullable<PublicLeadActionState> }) {
  const success = state.success
  const Icon = success ? CheckCircle2 : AlertCircle

  return (
    <div
      role={success ? 'status' : 'alert'}
      aria-live={success ? 'polite' : 'assertive'}
      className={cn(
        'rounded-[1.35rem] border px-4 py-4',
        success
          ? 'border-[color:color-mix(in_srgb,#5ba774_30%,white)] bg-[color:color-mix(in_srgb,#5ba774_10%,white)]'
          : 'border-[color:color-mix(in_srgb,var(--destructive)_30%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_8%,white)]',
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn('mt-0.5 size-4 shrink-0', success ? 'text-[#3f7d57]' : 'text-destructive')}
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">
            {success ? '¡Listo! Hemos recibido tu solicitud' : 'Revisa los datos'}
          </p>
          <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
            {state.message}
          </p>
        </div>
      </div>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      size="lg"
      className="group h-12 w-full rounded-full bg-[var(--wellstudio-blue)] text-base text-white shadow-[0_16px_34px_rgba(40,105,172,0.24)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[var(--wellstudio-blue-deep)] active:scale-[0.985] disabled:active:scale-100 motion-reduce:transition-none"
      disabled={pending}
    >
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          Enviando…
        </>
      ) : (
        <>
          Quiero que me llaméis
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </>
      )}
    </Button>
  )
}
