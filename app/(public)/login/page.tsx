import Link from 'next/link'

import { AuthShell } from '@/modules/auth/ui/auth-shell'
import { LoginForm } from '@/modules/auth/ui/login-form'

type LoginPageProps = {
  searchParams?: Promise<{
    authError?: string
    redirectTo?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const infoMessage =
    resolvedSearchParams?.authError === 'verification_failed'
      ? 'No hemos podido verificar tu enlace de acceso. Solicita un nuevo registro o vuelve a iniciar sesión.'
      : undefined
  const redirectTo = resolvedSearchParams?.redirectTo || '/app'

  return (
    <AuthShell
      eyebrow="Socios WellStudio"
      title="Entrena con acceso privado"
      description="Gestiona tus reservas, revisa tus planes y mantén tu rutina al día desde una experiencia más clara, directa y alineada con la marca WellStudio."
      footer={
        <p>
          ¿Aún no tienes acceso?{' '}
          <Link
            href="/register"
            className="rounded-full font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
          >
            Crea tu cuenta
          </Link>
        </p>
      }
    >
      <LoginForm
        redirectTo={redirectTo}
        infoMessage={infoMessage}
      />
    </AuthShell>
  )
}
