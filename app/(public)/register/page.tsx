import Link from 'next/link'

import { AuthShell } from '@/modules/auth/ui/auth-shell'
import { RegisterForm } from '@/modules/auth/ui/register-form'

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Nuevo acceso"
      title="Empieza tu experiencia boutique"
      description="Crea tu acceso para reservar sesiones, recibir tu verificación por correo y entrar en una experiencia WellStudio más limpia y más profesional."
      footer={
        <p>
          ¿Ya tienes tu acceso?{' '}
          <Link
            href="/login"
            className="rounded-full font-medium text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:text-[var(--wellstudio-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
          >
            Inicia sesión
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
