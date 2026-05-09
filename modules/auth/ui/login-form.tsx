'use client'

import Link from 'next/link'
import { useMemo, useRef, useState, useTransition } from 'react'

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
import {
  AUTH_FORM_DESCRIPTION_CLASS,
  AUTH_FORM_EYEBROW_CLASS,
  AUTH_FORM_TITLE_CLASS,
} from '@/modules/auth/ui/auth-form-classes'
import { createSupabaseBrowserClient } from '@/modules/auth/lib/supabase-browser-client'

type LoginFormProps = {
  initialEmail?: string
  infoMessage?: string
  redirectTo: string
}

export function LoginForm({
  initialEmail,
  redirectTo,
  infoMessage,
}: LoginFormProps) {
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
        setErrorMessage(
          'No hemos podido iniciar tu sesión. Revisa tus credenciales o recupera el acceso con nuestro equipo.',
        )
        emailInputRef.current?.focus()
        return
      }

      window.location.assign(redirectTo)
    })
  }

  return (
    <Card className="overflow-visible border-transparent bg-transparent py-2 shadow-none ring-0">
      <CardHeader className="gap-3 px-0 pb-2 pt-1">
        <p className={AUTH_FORM_EYEBROW_CLASS}>
          Acceso socios
        </p>
        <CardTitle className={AUTH_FORM_TITLE_CLASS}>
          Inicia sesión
        </CardTitle>
        <CardDescription className={AUTH_FORM_DESCRIPTION_CLASS}>
          Introduce tu email y contraseña para entrar en tu área privada.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit(new FormData(event.currentTarget))
          }}
        >
          {infoMessage ? (
            <div
              aria-live="polite"
              className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] px-4 py-3 text-sm leading-7 text-[var(--wellstudio-blue-deep)]"
            >
              {infoMessage}
            </div>
          ) : null}

          <FieldGroup className="gap-4">
            <Field data-invalid={errorMessage ? true : undefined}>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  ref={emailInputRef}
                  id="login-email"
                  name="email"
                  type="email"
                  defaultValue={initialEmail}
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
                <FieldDescription className="mt-1.5">
                  Tu acceso privado para gestionar reservas y datos personales.
                </FieldDescription>
              </FieldContent>
              <FieldError>{errorMessage}</FieldError>
            </Field>
          </FieldGroup>

          <section
            aria-labelledby="login-support"
            className="border-t border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,var(--border))] pt-3 text-sm leading-7 text-muted-foreground"
          >
            <p
              id="login-support"
              className="font-medium text-[var(--wellstudio-ink)]"
            >
              Si no recuerdas tu acceso
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-2">
              <Link
                href="/forgot-password"
                className="rounded-full font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
              >
                Recuperar acceso por email
              </Link>
            </div>
          </section>

          <div className="flex flex-col gap-3 pt-1">
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="shadow-[0_14px_36px_rgba(79,137,197,0.24)]"
            >
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Entrando…
                </>
              ) : (
                'Entrar en WellStudio'
              )}
            </Button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>¿Todavía no tienes acceso?</span>
              <Link
                href="/register"
                className="rounded-full font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
