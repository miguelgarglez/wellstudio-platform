import { AuthShell } from '@/modules/auth/ui/auth-shell'
import { authPageContent } from '@/modules/auth/ui/auth-page-content'
import { LoginForm } from '@/modules/auth/ui/login-form'
import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

type LoginPageProps = {
  searchParams?: Promise<{
    authStatus?: string
    authError?: string
    email?: string
    redirectTo?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const infoMessage =
    resolvedSearchParams?.authStatus === 'confirmed'
      ? 'Tu correo ya está confirmado. Si no te hemos abierto la sesión automáticamente, entra con tu contraseña y continúa.'
      : resolvedSearchParams?.authError === 'verification_failed'
      ? 'No hemos podido verificar tu enlace de acceso. Solicita un nuevo registro o vuelve a iniciar sesión.'
      : undefined
  const redirectTo = resolvedSearchParams?.redirectTo || '/app'

  return (
    <AuthShell
      panel={authPageContent.login.panel}
      footer={<PublicSiteFooter />}
    >
      <LoginForm
        initialEmail={resolvedSearchParams?.email}
        redirectTo={redirectTo}
        infoMessage={infoMessage}
      />
    </AuthShell>
  )
}
