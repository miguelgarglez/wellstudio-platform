'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
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

type LoginFormProps = {
  infoMessage?: string
  redirectTo: string
}

export function LoginForm({ redirectTo, infoMessage }: LoginFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setErrorMessage(null)

    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMessage('No hemos podido iniciar tu sesión. Revisa tus credenciales e inténtalo de nuevo.')
        emailInputRef.current?.focus()
        return
      }

      router.push(redirectTo)
      router.refresh()
    })
  }

  return (
    <Card
      size="sm"
      className="border-white/70 bg-white/82 py-5 shadow-[0_18px_60px_rgba(47,75,103,0.12)] ring-1 ring-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,transparent)] backdrop-blur"
    >
        <CardHeader className="gap-2 px-5 sm:px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
            Acceso socios
          </p>
          <CardTitle className="font-display text-balance text-4xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)]">
            Inicia sesión
          </CardTitle>
        <CardDescription className="text-[0.95rem] leading-7 text-muted-foreground">
          Accede a tus reservas, planes, pagos e historial de entrenamiento.
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
          {infoMessage ? (
            <div
              aria-live="polite"
              className="rounded-2xl border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-4 py-3 text-sm leading-7 text-[var(--wellstudio-blue-deep)]"
            >
              {infoMessage}
            </div>
          ) : null}

          <FieldGroup>
            <Field data-invalid={errorMessage ? true : undefined}>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  ref={emailInputRef}
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  spellCheck={false}
                  placeholder="tu@email.com…"
                  required
                />
              </FieldContent>
            </Field>

            <Field data-invalid={errorMessage ? true : undefined}>
              <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
              <FieldContent>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Tu contraseña…"
                  required
                />
                <FieldDescription>
                  Tu acceso privado para gestionar reservas y datos personales.
                </FieldDescription>
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
                  Entrando
                </>
              ) : (
                'Entrar en WellStudio'
              )}
            </Button>
            <Link
              href="/register"
              className="w-fit rounded-full text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
            >
              Aún no tengo cuenta
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
