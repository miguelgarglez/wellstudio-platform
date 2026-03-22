import { AuthShell } from '@/modules/auth/ui/auth-shell'
import { authPageContent } from '@/modules/auth/ui/auth-page-content'
import { ForgotPasswordForm } from '@/modules/auth/ui/forgot-password-form'
import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      panel={authPageContent.forgotPassword.panel}
      footer={<PublicSiteFooter />}
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
