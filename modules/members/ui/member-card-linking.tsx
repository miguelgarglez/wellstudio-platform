'use client'

import { useActionState } from 'react'
import { CreditCard, LoaderCircle, ShieldCheck } from 'lucide-react'

import {
  startCardSetupCheckoutAction,
  type StartCardSetupCheckoutActionState,
} from '@/app/(member)/app/account/actions'
import { Button } from '@/components/ui/button'

export function MemberCardLinking({
  hasLinkedCard,
  cardLabel,
}: {
  hasLinkedCard: boolean
  cardLabel: string | null
}) {
  const [state, action, pending] = useActionState<StartCardSetupCheckoutActionState, FormData>(
    startCardSetupCheckoutAction,
    null,
  )

  return (
    <div className="space-y-4">
      <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,var(--border))] bg-[color:color-mix(in_srgb,var(--card)_74%,white)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
              Método de pago
            </p>
            <p className="mt-2 text-base font-medium text-[var(--wellstudio-ink)]">
              {hasLinkedCard ? cardLabel : 'Sin tarjeta vinculada'}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {hasLinkedCard
                ? 'Puedes sustituir la tarjeta principal con una nueva vinculación segura. WellStudio nunca ve el número completo ni el CVC.'
                : 'Vincula una tarjeta para tener un método de pago listo en tu cuenta. El flujo es alojado y WellStudio solo guarda la referencia del proveedor.'}
            </p>
          </div>
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
            <CreditCard className="size-4" aria-hidden="true" />
          </span>
        </div>

        {state?.success === false ? (
          <p
            role="alert"
            className="mt-4 rounded-[1.15rem] border border-destructive/18 bg-destructive/6 px-4 py-3 text-sm leading-6 text-destructive"
          >
            {state.message}
          </p>
        ) : null}

        <form action={action} className="mt-5">
          <Button type="submit" className="rounded-full" disabled={pending}>
            {pending ? (
              <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <ShieldCheck aria-hidden="true" />
            )}
            {pending
              ? 'Preparando vinculación…'
              : hasLinkedCard
                ? 'Actualizar tarjeta'
                : 'Vincular tarjeta'}
          </Button>
        </form>
      </div>
    </div>
  )
}
