'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { createSupabaseBrowserClient } from '@/modules/auth/lib/supabase-browser-client'

export function LogoutButton() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleLogout() {
    setErrorMessage(null)

    startTransition(async () => {
      const { error } = await supabase.auth.signOut()

      if (error) {
        setErrorMessage('No hemos podido cerrar tu sesión. Inténtalo de nuevo.')
        return
      }

      router.replace('/login')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={handleLogout}
      >
        {isPending ? (
          <>
            <Spinner data-icon="inline-start" />
            Cerrando sesión
          </>
        ) : (
          'Cerrar sesión'
        )}
      </Button>
      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
