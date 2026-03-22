'use client'

import Link from 'next/link'
import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
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

export function RegisterForm() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const acceptedTermsRef = useRef<HTMLButtonElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setErrorMessage(null)
    setPendingConfirmationEmail(null)

    const firstName = String(formData.get('firstName') || '')
    const lastName = String(formData.get('lastName') || '')
    const phone = String(formData.get('phone') || '')
    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')
    const acceptedTerms = formData.get('acceptedTerms') === 'on'

    if (!acceptedTerms) {
      setErrorMessage('Debes aceptar las condiciones legales para crear tu cuenta.')
      acceptedTermsRef.current?.focus()
      return
    }

    startTransition(async () => {
      const emailRedirectTo = resolvePublicAppUrl()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        },
      })

      if (error) {
        setErrorMessage(
          resolveEmailRateLimitErrorMessage(error) ||
            'No hemos podido crear tu cuenta. Revisa los datos e inténtalo de nuevo.',
        )
        emailInputRef.current?.focus()
        return
      }

      if (data.session) {
        router.push('/app')
        router.refresh()
        return
      }

      setPendingConfirmationEmail(email)
    })
  }

  if (pendingConfirmationEmail) {
    return (
      <Card className="overflow-visible border-transparent bg-transparent py-2 shadow-none ring-0">
        <CardHeader className="gap-3 px-0 pb-2 pt-1">
          <p className={AUTH_FORM_EYEBROW_CLASS}>
            Revisa tu correo
          </p>
          <CardTitle className={AUTH_FORM_TITLE_CLASS}>
            Activa tu cuenta
          </CardTitle>
          <CardDescription className={AUTH_FORM_DESCRIPTION_CLASS}>
            Ya hemos preparado tu acceso. Solo te falta confirmar el correo para entrar en tu espacio privado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0 pb-0">
          <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,#7fd6a3_48%,var(--border))] bg-[color:color-mix(in_srgb,#7fd6a3_18%,white)] px-4 py-4 text-sm leading-7 text-[var(--wellstudio-blue-deep)]">
            Hemos enviado el enlace para activar tu cuenta a{' '}
            <span className="font-semibold text-[var(--wellstudio-ink)]">
              {pendingConfirmationEmail}
            </span>
            .
          </div>
          <div className="text-sm leading-7 text-muted-foreground">
            <p className="font-medium text-[var(--wellstudio-ink)]">Siguiente paso</p>
            <p>
              Abre el correo y confirma tu acceso. Si todo va bien, entrarás directamente en tu espacio privado.
              Si no lo ves enseguida, revisa spam o promociones.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div
              className={buttonVariants({ size: 'lg', variant: 'outline' })}
            >
              Esperando confirmación por correo
            </div>
            <button
              type="button"
              className="w-fit rounded-full text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
              onClick={() => setPendingConfirmationEmail(null)}
            >
              Cambiar el email o volver al formulario
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
          Nuevo socio
        </p>
        <CardTitle className={AUTH_FORM_TITLE_CLASS}>
          Crea tu cuenta
        </CardTitle>
        <CardDescription className={AUTH_FORM_DESCRIPTION_CLASS}>
          Completa tus datos para crear tu acceso privado en WellStudio.
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
          <section
            aria-labelledby="register-profile-section"
            className="space-y-4"
          >
            <p
              id="register-profile-section"
              className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)]"
            >
              Datos personales
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="register-first-name">Nombre</FieldLabel>
                <FieldContent>
                  <Input
                    id="register-first-name"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="Miguel…"
                    required
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="register-last-name">Apellidos</FieldLabel>
                <FieldContent>
                  <Input
                    id="register-last-name"
                    name="lastName"
                    autoComplete="family-name"
                    placeholder="García González…"
                    required
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="register-phone">Teléfono</FieldLabel>
              <FieldContent>
                <Input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+34 600 000 000…"
                  required
                />
                <FieldDescription>
                  Lo usamos para poder darte un trato más cercano y ayudarte también por WhatsApp si hace falta.
                </FieldDescription>
              </FieldContent>
            </Field>
          </section>

          <section
            aria-labelledby="register-access-section"
            className="space-y-4 border-t border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,var(--border))] pt-4"
          >
            <p
              id="register-access-section"
              className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)]"
            >
              Datos de acceso
            </p>

            <Field data-invalid={errorMessage ? true : undefined}>
              <FieldLabel htmlFor="register-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  ref={emailInputRef}
                  id="register-email"
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
              <FieldLabel htmlFor="register-password">Contraseña</FieldLabel>
              <FieldContent>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Crea una contraseña segura…"
                  required
                />
                <FieldDescription>
                  Tras registrarte, te enviaremos un correo de verificación para activar la cuenta.
                </FieldDescription>
              </FieldContent>
            </Field>
          </section>

          <section
            aria-labelledby="register-legal-section"
            className="space-y-4 border-t border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,var(--border))] pt-4"
          >
            <p
              id="register-legal-section"
              className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)]"
            >
              Consentimiento
            </p>

            <Field data-invalid={errorMessage ? true : undefined}>
              <FieldLabel className="items-start gap-3 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_2%,white)] p-3 transition-colors hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,var(--border))]">
                <Checkbox
                  ref={acceptedTermsRef}
                  id="acceptedTerms"
                  name="acceptedTerms"
                  className="mt-1"
                />
                <span className="flex flex-col gap-1">
                  <span className="block text-sm font-medium text-[var(--wellstudio-ink)]">
                    He leído la política de privacidad y las condiciones de uso vigentes.
                  </span>
                  <span className="block text-sm font-normal leading-7 text-muted-foreground">
                    Necesitamos este consentimiento para crear tu acceso privado. Puedes revisar la{' '}
                    <Link
                      href="/privacy-policy"
                      className="font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:text-[var(--wellstudio-blue)] hover:underline"
                    >
                      política de privacidad
                    </Link>{' '}
                    y las{' '}
                    <Link
                      href="/terms"
                      className="font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:text-[var(--wellstudio-blue)] hover:underline"
                    >
                      condiciones de uso
                    </Link>{' '}
                    antes de continuar.
                  </span>
                </span>
              </FieldLabel>
              <FieldError>{errorMessage}</FieldError>
            </Field>
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
                  Creando cuenta…
                </>
              ) : (
                'Crear acceso en WellStudio'
              )}
            </Button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>¿Ya tienes cuenta?</span>
              <Link
                href="/login"
                className="rounded-full font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
