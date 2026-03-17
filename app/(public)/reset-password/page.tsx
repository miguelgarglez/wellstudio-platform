import { AuthShell } from '@/modules/auth/ui/auth-shell'
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
      eyebrow="Nueva contraseña"
      title="Recupera tu acceso privado"
      description="Verifica tu enlace, define una nueva contraseña y vuelve a entrar en tu cuenta con un flujo claro y seguro."
      footer={<PublicSiteFooter />}
    >
      <ResetPasswordForm flow={resolvedSearchParams?.flow} />
    </AuthShell>
  )
}
