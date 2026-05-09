import { AuthShell } from '@/modules/auth/ui/auth-shell'
import { authPageContent } from '@/modules/auth/ui/auth-page-content'
import { ResetPasswordForm } from '@/modules/auth/ui/reset-password-form'
import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    flow?: string
  }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  return (
    <AuthShell
      panel={authPageContent.resetPassword.panel}
      footer={<PublicSiteFooter />}
    >
      <ResetPasswordForm flow={resolvedSearchParams?.flow} />
    </AuthShell>
  )
}
