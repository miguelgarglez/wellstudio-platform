'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { ReservationMutationResult } from '@/modules/reservations/server/member-reservation-mutations'

type ReservationServerAction = (
  previousState: ReservationMutationResult | null,
  formData: FormData,
) => Promise<ReservationMutationResult>

type ReservationConfirmationActionProps = {
  action: ReservationServerAction
  fields: Record<string, string>
  triggerLabel: string
  dialogTitle: string
  dialogDescription: string
  confirmLabel: string
  pendingLabel: string
  triggerVariant?: React.ComponentProps<typeof Button>['variant']
  confirmVariant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  triggerClassName?: string
}

export function ReservationConfirmationAction({
  action,
  fields,
  triggerLabel,
  dialogTitle,
  dialogDescription,
  confirmLabel,
  pendingLabel,
  triggerVariant = 'outline',
  confirmVariant = 'default',
  size = 'sm',
  triggerClassName,
}: ReservationConfirmationActionProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<ReservationMutationResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = formRef.current

    if (!form) {
      return
    }

    const formData = new FormData(form)
    setState(null)

    startTransition(async () => {
      const nextState = await action(null, formData)
      setState(nextState)

      if (nextState.success) {
        setIsOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        type="button"
        variant={triggerVariant}
        size={size}
        className={cn(triggerClassName)}
        onClick={() => setIsOpen(true)}
      >
        {triggerLabel}
      </Button>

      <AlertDialogContent size="sm" className="rounded-[1.3rem]">
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {Object.entries(fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}

          <AlertDialogHeader className="items-start text-left">
            <AlertDialogTitle className="text-[1.1rem] text-[var(--wellstudio-ink)]">
              {dialogTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left leading-7">
              {dialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {state && !state.success ? (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          ) : null}

          <AlertDialogFooter className="gap-2 bg-transparent">
            <AlertDialogCancel disabled={isPending}>Volver</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              variant={confirmVariant}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {pendingLabel}
                </>
              ) : (
                confirmLabel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
