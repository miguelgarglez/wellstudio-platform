'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { createSupabaseBrowserClient } from '@/modules/auth/lib/supabase-browser-client'

type ResetPasswordFormProps = {
  flow?: string
}

type ResetState = 'checking' | 'ready' | 'invalid'

export function ResetPasswordForm({ flow }: ResetPasswordFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const [state, setState] = useState<ResetState>(flow === 'recovery' ? 'checking' : 'invalid')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (flow !== 'recovery') {
      return
    }

    let isMounted = true
    let timeoutId: number | undefined

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return
      }

      if (event === 'PASSWORD_RECOVERY') {
        setState('ready')
        return
      }

      if (event === 'SIGNED_IN' && session) {
        setState('ready')
      }
    })

    async function resolveRecoveryState() {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error) {
        setState('invalid')
        return
      }

      if (data.session) {
        setState('ready')
        return
      }

      timeoutId = window.setTimeout(async () => {
        const { data: retryData } = await supabase.auth.getSession()

        if (!isMounted) {
          return
        }

        setState(retryData.session ? 'ready' : 'invalid')
      }, 350)
    }

    void resolveRecoveryState()

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (typeof timeoutId === 'number') {
        window.clearTimeout(timeoutId)
      }
    }
  }, [flow, supabase])

  function handleSubmit(formData: FormData) {
    setErrorMessage(null)

    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Revísalas y vuelve a intentarlo.')
      passwordInputRef.current?.focus()
      return
    }

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setErrorMessage(
          'No hemos podido actualizar tu contraseña. Solicita un nuevo enlace e inténtalo de nuevo.',
        )
        passwordInputRef.current?.focus()
        return
      }

      router.push('/app')
      router.refresh()
    })
  }

  if (state === 'checking') {
    return (
      <Card
        size="sm"
        className="border-white/70 bg-white/82 py-5 shadow-[0_18px_60px_rgba(47,75,103,0.12)] ring-1 ring-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,transparent)] backdrop-blur"
      >
        <CardHeader className="gap-2 px-5 sm:px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
            Recuperación en curso
          </p>
          <CardTitle className="font-display text-balance text-4xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)]">
            Validando tu enlace
          </CardTitle>
          <CardDescription className="text-[0.95rem] leading-7 text-muted-foreground">
            Estamos comprobando que este acceso sigue siendo válido antes de dejarte crear una nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)] px-4 py-4 text-sm text-muted-foreground">
            <Spinner />
            Verificando acceso de recuperación…
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state === 'invalid') {
    return (
      <Card
        size="sm"
        className="border-white/70 bg-white/82 py-5 shadow-[0_18px_60px_rgba(47,75,103,0.12)] ring-1 ring-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,transparent)] backdrop-blur"
      >
        <CardHeader className="gap-2 px-5 sm:px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
            Enlace no válido
          </p>
          <CardTitle className="font-display text-balance text-4xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)]">
            Solicita uno nuevo
          </CardTitle>
          <CardDescription className="text-[0.95rem] leading-7 text-muted-foreground">
            Este enlace ha caducado, ya fue usado o no corresponde a una recuperación activa.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-5 sm:px-6">
          <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--destructive)_28%,var(--border))] bg-[color:color-mix(in_srgb,var(--destructive)_10%,white)] px-4 py-4 text-sm leading-7 text-[var(--wellstudio-ink)]">
            Vuelve a pedir un nuevo email de recuperación para continuar con seguridad.
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/forgot-password"
              className={buttonVariants({ size: 'lg' })}
            >
              Pedir un nuevo enlace
            </Link>
            <Link
              href="/login"
              className="w-fit rounded-full text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
            >
              Volver a iniciar sesión
            </Link>
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
          Nueva contraseña
        </p>
        <CardTitle className="font-display text-balance text-4xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)]">
          Crea tu nuevo acceso
        </CardTitle>
        <CardDescription className="text-[0.95rem] leading-7 text-muted-foreground">
          Elige una contraseña nueva para entrar de nuevo en tu cuenta con normalidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 sm:px-6">
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit(new FormData(event.currentTarget))
          }}
        >
          <FieldGroup>
            <Field data-invalid={errorMessage ? true : undefined}>
              <FieldLabel htmlFor="reset-password">Nueva contraseña</FieldLabel>
              <FieldContent>
                <Input
                  ref={passwordInputRef}
                  id="reset-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Crea una contraseña segura…"
                  required
                />
                <FieldDescription>
                  Usa una contraseña segura que te resulte fácil de recordar.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field data-invalid={errorMessage ? true : undefined}>
              <FieldLabel htmlFor="reset-password-confirmation">Repite la contraseña</FieldLabel>
              <FieldContent>
                <Input
                  id="reset-password-confirmation"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repite la contraseña…"
                  required
                />
              </FieldContent>
              <FieldError>{errorMessage}</FieldError>
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Guardando contraseña
                </>
              ) : (
                'Guardar nueva contraseña'
              )}
            </Button>
            <Link
              href="/login"
              className="w-fit rounded-full text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
            >
              Cancelar y volver a login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
