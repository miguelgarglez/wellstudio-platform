'use client'

import Link from 'next/link'
import { useMemo, useRef, useState, useTransition } from 'react'

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
import { resolveEmailRateLimitErrorMessage } from '@/modules/auth/lib/supabase-auth-error-message'
import { createSupabaseBrowserClient } from '@/modules/auth/lib/supabase-browser-client'

const SUPPORT_EMAIL = 'wellstudiofit@gmail.com'
const SUPPORT_WHATSAPP_URL =
  'https://wa.me/34614882404?text=Hola%20WellStudio,%20necesito%20ayuda%20para%20recuperar%20mi%20acceso.'

function resolveRecoveryRedirectUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  if (!baseUrl) {
    return undefined
  }

  return new URL('/reset-password?flow=recovery', baseUrl).toString()
}

export function ForgotPasswordForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requestedEmail, setRequestedEmail] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setErrorMessage(null)

    const email = String(formData.get('email') || '').trim()

    startTransition(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resolveRecoveryRedirectUrl(),
      })

      if (error) {
        setErrorMessage(
          resolveEmailRateLimitErrorMessage(error) ||
            'No hemos podido enviar el enlace ahora mismo. Inténtalo de nuevo en unos minutos o contacta con el equipo.',
        )
        emailInputRef.current?.focus()
        return
      }

      setRequestedEmail(email)
    })
  }

  if (requestedEmail) {
    return (
      <Card className="border-white/70 bg-white/82 py-5 shadow-[0_18px_60px_rgba(47,75,103,0.12)] ring-1 ring-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,transparent)] backdrop-blur">
        <CardHeader className="gap-2 px-5 sm:px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
            Revisa tu correo
          </p>
          <CardTitle className="font-display text-balance text-4xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)]">
            Enlace enviado
          </CardTitle>
          <CardDescription className="text-[0.95rem] leading-7 text-muted-foreground">
            Si existe una cuenta con este email, recibirás un enlace para definir una nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 px-5 sm:px-6">
          <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-4 py-4 text-sm leading-7 text-[var(--wellstudio-blue-deep)]">
            Hemos preparado la recuperación para{' '}
            <span className="font-semibold text-[var(--wellstudio-ink)]">
              {requestedEmail}
            </span>
            . Revisa también spam o promociones si no lo ves enseguida.
          </div>
          <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)] px-4 py-4 text-sm leading-7 text-muted-foreground">
            <p className="font-medium text-[var(--wellstudio-ink)]">Si el correo no llega</p>
            <p>
              Vuelve a intentarlo en unos minutos o pide ayuda al equipo para revisar tu acceso contigo.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-full font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
              >
                Hablar por WhatsApp
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Ayuda%20recuperar%20acceso%20WellStudio`}
                className="rounded-full font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
              >
                Escribir por email
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className={buttonVariants({ size: 'lg' })}
            >
              Volver a iniciar sesión
            </Link>
            <button
              type="button"
              className="w-fit rounded-full text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
              onClick={() => setRequestedEmail(null)}
            >
              Enviar otro enlace
            </button>
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
          Recuperar acceso
        </p>
        <CardTitle className="font-display text-balance text-4xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)]">
          Restablece tu contraseña
        </CardTitle>
        <CardDescription className="text-[0.95rem] leading-7 text-muted-foreground">
          Introduce tu email y te enviaremos un enlace para crear una nueva contraseña.
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
              <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  ref={emailInputRef}
                  id="forgot-password-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  spellCheck={false}
                  placeholder="tu@email.com…"
                  required
                />
                <FieldDescription>
                  Si existe una cuenta asociada, enviaremos el enlace al momento.
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
                  Enviando enlace
                </>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </Button>
            <Link
              href="/login"
              className="w-fit rounded-full text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
