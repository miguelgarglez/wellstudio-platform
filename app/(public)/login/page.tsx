import { resolveLoginInfoMessage } from '@/modules/auth/lib/login-info-message'
import { resolveSafeInternalPath } from '@/modules/auth/lib/safe-internal-path'
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
  const infoMessage = resolveLoginInfoMessage({
    authStatus: resolvedSearchParams?.authStatus,
    authError: resolvedSearchParams?.authError,
  })
  const redirectTo = resolveSafeInternalPath(
    resolvedSearchParams?.redirectTo,
    '/auth/after-login',
  )

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
