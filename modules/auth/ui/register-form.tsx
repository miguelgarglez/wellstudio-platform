'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
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
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { createSupabaseBrowserClient } from '@/modules/auth/lib/supabase-browser-client'

export function RegisterForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const acceptedTermsRef = useRef<HTMLButtonElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setErrorMessage(null)
    setSuccessMessage(null)

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        },
      })

      if (error) {
        setErrorMessage('No hemos podido crear tu cuenta. Revisa los datos e inténtalo de nuevo.')
        emailInputRef.current?.focus()
        return
      }

      setSuccessMessage(
        'Cuenta creada. Te hemos enviado un correo para verificar tu acceso antes de iniciar sesión.',
      )
    })
  }

  return (
    <Card
      className="border-white/70 bg-white/82 py-5 shadow-[0_18px_60px_rgba(47,75,103,0.12)] ring-1 ring-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,transparent)] backdrop-blur"
    >
        <CardHeader className="gap-2 px-5 sm:px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
            Nuevo socio
          </p>
          <CardTitle className="font-display text-balance text-4xl uppercase tracking-[0.04em] text-[var(--wellstudio-ink)]">
            Crea tu cuenta
          </CardTitle>
        <CardDescription className="text-[0.95rem] leading-7 text-muted-foreground">
          Prepara tu acceso privado para reservar clases, gestionar tus planes y seguir tu progreso.
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
          <FieldGroup className="gap-4">
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
              </FieldContent>
            </Field>

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

            <Field data-invalid={errorMessage ? true : undefined}>
              <FieldLabel className="rounded-2xl border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)] p-4">
                <Checkbox
                  ref={acceptedTermsRef}
                  id="acceptedTerms"
                  name="acceptedTerms"
                  className="mt-0.5"
                />
                <span className="flex flex-col gap-1">
                  <span className="block text-sm font-medium text-[var(--wellstudio-ink)]">
                    Acepto las condiciones legales y la política de privacidad.
                  </span>
                  <span className="block text-sm font-normal text-muted-foreground">
                    Necesitamos este consentimiento para crear tu acceso privado.
                  </span>
                </span>
              </FieldLabel>
              <FieldError>{errorMessage}</FieldError>
            </Field>
          </FieldGroup>

          {successMessage ? (
            <div
              aria-live="polite"
              className="rounded-2xl border border-[color:color-mix(in_srgb,#7fd6a3_48%,var(--border))] bg-[color:color-mix(in_srgb,#7fd6a3_18%,white)] px-4 py-3 text-sm leading-7 text-[var(--wellstudio-blue-deep)]"
            >
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Creando cuenta
                </>
              ) : (
                'Crear acceso en WellStudio'
              )}
            </Button>
            <Link
              href="/login"
              className="w-fit rounded-full text-sm font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
