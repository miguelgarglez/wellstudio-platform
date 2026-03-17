'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { createSupabaseBrowserClient } from '@/modules/auth/lib/supabase-browser-client'

type AuthCallbackCardProps = {
  email?: string
  nextPath: string
}

type CallbackState = 'checking' | 'fallback'

function resolveSafeNextPath(nextPath: string | undefined) {
  if (!nextPath || !nextPath.startsWith('/')) {
    return '/app'
  }

  return nextPath
}

export function AuthCallbackCard({
  email,
  nextPath,
}: AuthCallbackCardProps) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [state, setState] = useState<CallbackState>('checking')
  const safeNextPath = resolveSafeNextPath(nextPath)

  useEffect(() => {
    let isMounted = true
    let fallbackTimeoutId: number | undefined

    const redirectToApp = () => {
      router.replace(safeNextPath)
      router.refresh()
    }

    const redirectToLoginFallback = () => {
      const loginUrl = new URL('/login', window.location.origin)
      loginUrl.searchParams.set('redirectTo', safeNextPath)
      loginUrl.searchParams.set('authStatus', 'confirmed')

      if (email) {
        loginUrl.searchParams.set('email', email)
      }

      router.replace(`${loginUrl.pathname}${loginUrl.search}`)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return
      }

      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        redirectToApp()
      }
    })

    async function resolveCallbackState() {
      const { data } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (data.session) {
        redirectToApp()
        return
      }

      fallbackTimeoutId = window.setTimeout(async () => {
        const { data: retryData } = await supabase.auth.getSession()

        if (!isMounted) {
          return
        }

        if (retryData.session) {
          redirectToApp()
          return
        }

        setState('fallback')
        redirectToLoginFallback()
      }, 1200)
    }

    void resolveCallbackState()

    return () => {
      isMounted = false
      subscription.unsubscribe()

      if (typeof fallbackTimeoutId === 'number') {
        window.clearTimeout(fallbackTimeoutId)
      }
    }
  }, [email, router, safeNextPath, supabase])

  if (state === 'fallback') {
    return (
      <Card
        size="sm"
        className="border-white/70 bg-white/82 py-5 shadow-[0_18px_60px_rgba(47,75,103,0.12)] ring-1 ring-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,transparent)] backdrop-blur"
      >
        <CardHeader className="gap-2 px-5 sm:px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
            Confirmación completada
          </p>
          <CardTitle className="font-display text-balance text-4xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)]">
            Redirigiendo tu acceso
          </CardTitle>
          <CardDescription className="text-[0.95rem] leading-7 text-muted-foreground">
            Tu correo ya está verificado. Si no podemos abrir tu sesión automáticamente, te llevaremos al login con todo preparado.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)] px-4 py-4 text-sm text-muted-foreground">
            <Spinner />
            Preparando el acceso…
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      size="sm"
      className="border-white/70 bg-white/82 py-5 shadow-[0_18px_60px_rgba(47,75,103,0.12)] ring-1 ring-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,transparent)] backdrop-blur"
    >
      <CardHeader className="gap-2 px-5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
          Confirmando tu acceso
        </p>
        <CardTitle className="font-display text-balance text-4xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)]">
          Activando tu sesión
        </CardTitle>
        <CardDescription className="text-[0.95rem] leading-7 text-muted-foreground">
          Estamos cerrando la verificación de tu correo y abriendo tu cuenta para que entres directamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 sm:px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)] px-4 py-4 text-sm text-muted-foreground">
          <Spinner />
          Verificando correo y preparando tu acceso…
        </div>
      </CardContent>
    </Card>
  )
}
