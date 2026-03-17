import { AuthShell } from '@/modules/auth/ui/auth-shell'
import { RegisterForm } from '@/modules/auth/ui/register-form'
import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Nuevo acceso"
      title="Empieza tu experiencia boutique"
      description="Crea tu acceso para reservar sesiones, recibir tu verificación por correo y entrar en una experiencia WellStudio más limpia y más profesional."
      footer={<PublicSiteFooter />}
    >
      <RegisterForm />
    </AuthShell>
  )
}
