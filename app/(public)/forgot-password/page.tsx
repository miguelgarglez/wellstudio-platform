import { AuthShell } from '@/modules/auth/ui/auth-shell'
import { ForgotPasswordForm } from '@/modules/auth/ui/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Recuperar acceso"
      title="Vuelve a entrar con calma"
      description="Te enviaremos un enlace de recuperación para que puedas definir una contraseña nueva sin perder tu acceso a reservas, planes y seguimiento."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
