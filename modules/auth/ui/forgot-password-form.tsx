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
import {
  AUTH_FORM_DESCRIPTION_CLASS,
  AUTH_FORM_EYEBROW_CLASS,
  AUTH_FORM_TITLE_CLASS,
} from '@/modules/auth/ui/auth-form-classes'
import { resolvePublicAppUrl } from '@/modules/auth/lib/public-app-url'
import { resolveEmailRateLimitErrorMessage } from '@/modules/auth/lib/supabase-auth-error-message'
import { createSupabaseBrowserClient } from '@/modules/auth/lib/supabase-browser-client'

const SUPPORT_EMAIL = 'wellstudiofit@gmail.com'
const SUPPORT_WHATSAPP_URL =
  'https://wa.me/34614882404?text=Hola%20WellStudio,%20necesito%20ayuda%20para%20recuperar%20mi%20acceso.'

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
        redirectTo: resolvePublicAppUrl('/reset-password?flow=recovery'),
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
      <Card className="overflow-visible border-transparent bg-transparent py-2 shadow-none ring-0">
        <CardHeader className="gap-3 px-0 pb-2 pt-1">
          <p className={AUTH_FORM_EYEBROW_CLASS}>
            Revisa tu correo
          </p>
          <CardTitle className={AUTH_FORM_TITLE_CLASS}>
            Enlace enviado
          </CardTitle>
          <CardDescription className={AUTH_FORM_DESCRIPTION_CLASS}>
            Si existe una cuenta con este email, recibirás un enlace para definir una nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0 pb-0">
          <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-4 py-4 text-sm leading-7 text-[var(--wellstudio-blue-deep)]">
            Hemos preparado la recuperación para{' '}
            <span className="font-semibold text-[var(--wellstudio-ink)]">
              {requestedEmail}
            </span>
            . Revisa también spam o promociones si no lo ves enseguida.
          </div>
          <div className="text-sm leading-7 text-muted-foreground">
            <p className="font-medium text-[var(--wellstudio-ink)]">Si el correo no llega</p>
            <p>
              Vuelve a intentarlo en unos minutos o pide ayuda al equipo para revisar tu acceso contigo.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
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
    <Card className="overflow-visible border-transparent bg-transparent py-2 shadow-none ring-0">
      <CardHeader className="gap-3 px-0 pb-2 pt-1">
        <p className={AUTH_FORM_EYEBROW_CLASS}>
          Recuperar acceso
        </p>
        <CardTitle className={AUTH_FORM_TITLE_CLASS}>
          Restablece tu contraseña
        </CardTitle>
        <CardDescription className={AUTH_FORM_DESCRIPTION_CLASS}>
          Introduce tu email y te enviaremos un enlace para crear una nueva contraseña.
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

          <section
            aria-labelledby="forgot-password-help"
            className="border-t border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,var(--border))] pt-4 text-sm leading-7 text-muted-foreground"
          >
            <p
              id="forgot-password-help"
              className="font-medium text-[var(--wellstudio-ink)]"
            >
              Si prefieres ayuda humana
            </p>
            <p className="mt-1">
              También podemos revisar tu acceso contigo por una vía más directa.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
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
          </section>

          <div className="flex flex-col gap-3 pt-1">
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="shadow-[0_14px_36px_rgba(79,137,197,0.2)]"
            >
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Enviando enlace…
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
