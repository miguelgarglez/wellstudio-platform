'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { RotateCw, ShieldCheck } from 'lucide-react'

import {
  retryAdminNotificationAction,
  type AdminNotificationRetryActionState,
} from '@/app/(admin)/admin/notifications/actions'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export function AdminNotificationRetryDialog({
  jobId,
  expectedUpdatedAt,
  returnTo,
  recipient,
  attemptCount,
}: {
  jobId: string
  expectedUpdatedAt: string
  returnTo: string
  recipient: string
  attemptCount: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, action] = useActionState<AdminNotificationRetryActionState, FormData>(
    retryAdminNotificationAction,
    null,
  )

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        type="button"
        size="lg"
        className="w-full rounded-full sm:w-auto"
        onClick={() => setIsOpen(true)}
      >
        <RotateCw className="size-4" aria-hidden="true" />
        Reintentar ahora
      </Button>
      <AlertDialogContent className="overflow-hidden rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] bg-[color:color-mix(in_srgb,var(--card)_94%,white)] p-0 shadow-[0_28px_90px_rgba(18,20,24,0.26)] sm:max-w-[32rem]">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="jobId" value={jobId} />
          <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <AlertDialogHeader className="items-start gap-3 px-5 pt-5 text-left">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div className="space-y-2">
              <AlertDialogTitle className="text-xl text-[var(--wellstudio-ink)]">
                Reintentar esta entrega
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left text-sm leading-7">
                Se programará un nuevo intento sin borrar los {attemptCount} anteriores. El envío continuará fuera de esta pantalla.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <div className="mx-5 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
              Destinatario
            </p>
            <p className="mt-2 break-all text-sm font-medium text-[var(--wellstudio-ink)]">
              {recipient}
            </p>
          </div>

          {state?.message ? (
            <p role="alert" className="mx-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </p>
          ) : null}

          <AlertDialogFooter className="!mx-0 !mb-0 grid grid-cols-2 gap-3 bg-[color:color-mix(in_srgb,var(--card)_78%,white)] p-5 sm:grid-cols-[minmax(8.5rem,0.52fr)_minmax(0,1fr)]">
            <AlertDialogCancel size="lg" className="rounded-full px-5">
              Volver
            </AlertDialogCancel>
            <RetrySubmitButton />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RetrySubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" className="rounded-full px-5" disabled={pending}>
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          Programando…
        </>
      ) : (
        'Confirmar reintento'
      )}
    </Button>
  )
}
