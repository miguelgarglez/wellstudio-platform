'use client'

import { useActionState } from 'react'
import type { ComponentProps } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import {
  logoutCurrentSessionAction,
  type LogoutActionState,
} from '@/modules/auth/server/logout-action'

type LogoutButtonProps = {
  buttonClassName?: string
  variant?: ComponentProps<typeof Button>['variant']
}

export function LogoutButton({
  buttonClassName,
  variant = 'outline',
}: LogoutButtonProps) {
  const [state, formAction] = useActionState<LogoutActionState, FormData>(
    async () => logoutCurrentSessionAction(),
    null,
  )

  return (
    <form action={formAction} className="flex flex-col items-start gap-3">
      <LogoutSubmitButton buttonClassName={buttonClassName} variant={variant} />
      {state?.message ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}

function LogoutSubmitButton({
  buttonClassName,
  variant,
}: LogoutButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      className={cn(buttonClassName)}
    >
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          Cerrando sesión
        </>
      ) : (
        'Cerrar sesión'
      )}
    </Button>
  )
}
