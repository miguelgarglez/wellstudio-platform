'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { RotateCcw, ShieldAlert } from 'lucide-react'

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
import { revokeMemberOverrideAction } from '@/app/(admin)/admin/overrides/actions'
import { cn } from '@/lib/utils'

type AdminRevokeOverrideDialogProps = {
  query: string
  memberId: string
  membershipId: string | null
  sessionId: string | null
  overrideId: string
  overrideLabel: string
  triggerClassName?: string
}

export function AdminRevokeOverrideDialog({
  query,
  memberId,
  membershipId,
  sessionId,
  overrideId,
  overrideLabel,
  triggerClassName,
}: AdminRevokeOverrideDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        type="button"
        variant="ghost"
        className={cn(
          'rounded-full border border-[color:color-mix(in_srgb,var(--destructive)_16%,white)] bg-white text-[var(--wellstudio-ink)] hover:bg-white/90',
          triggerClassName,
        )}
        onClick={() => setIsOpen(true)}
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Revocar excepción
      </Button>
      <AlertDialogContent
        size="default"
        className="overflow-hidden rounded-[1.45rem] border border-[color:color-mix(in_srgb,var(--destructive)_20%,white)] bg-[color:color-mix(in_srgb,var(--card)_92%,white)] p-0 shadow-[0_24px_80px_rgba(18,20,24,0.24)] sm:max-w-[31rem]"
      >
        <form action={revokeMemberOverrideAction} className="flex flex-col gap-4">
          <input type="hidden" name="query" value={query} />
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="membershipId" value={membershipId ?? ''} />
          <input type="hidden" name="sessionId" value={sessionId ?? ''} />
          <input type="hidden" name="overrideId" value={overrideId} />

          <AlertDialogHeader className="items-start gap-3 px-5 pt-5 text-left">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--destructive)_10%,white)] text-destructive">
              <ShieldAlert className="size-5" aria-hidden="true" />
            </span>
            <div className="space-y-2">
              <AlertDialogTitle className="text-xl text-[var(--wellstudio-ink)]">
                Revocar excepción
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left text-sm leading-7">
                Esta acción no borra el historial. Marca la excepción como revocada y conserva la trazabilidad del operador.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <div className="mx-5 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--destructive)_16%,white)] bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-destructive">
              Excepción afectada
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-[var(--wellstudio-ink)]">
              {overrideLabel}
            </p>
          </div>

          <AlertDialogFooter className="!mx-0 !mb-0 grid grid-cols-2 gap-3 bg-[color:color-mix(in_srgb,var(--card)_78%,white)] p-5 sm:grid-cols-[minmax(8.5rem,0.52fr)_minmax(0,1fr)]">
            <AlertDialogCancel size="lg" className="rounded-full px-5">
              Volver
            </AlertDialogCancel>
            <RevokeSubmitButton />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RevokeSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="destructive" size="lg" className="rounded-full px-5" disabled={pending}>
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          Revocando…
        </>
      ) : (
        'Confirmar revocación'
      )}
    </Button>
  )
}
