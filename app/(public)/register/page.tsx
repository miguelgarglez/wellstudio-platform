import { AuthShell } from '@/modules/auth/ui/auth-shell'
import { authPageContent } from '@/modules/auth/ui/auth-page-content'
import { RegisterForm } from '@/modules/auth/ui/register-form'
import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

export default function RegisterPage() {
  return (
    <AuthShell
      panel={authPageContent.register.panel}
      footer={<PublicSiteFooter />}
    >
      <RegisterForm />
    </AuthShell>
  )
}
