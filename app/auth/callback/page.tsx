import { AuthShell } from '@/modules/auth/ui/auth-shell'
import { AuthCallbackCard } from '@/modules/auth/ui/auth-callback-card'

type AuthCallbackPageProps = {
  searchParams?: Promise<{
    email?: string
    next?: string
  }>
}

export default async function AuthCallbackPage({
  searchParams,
}: AuthCallbackPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  return (
    <AuthShell
      eyebrow="Confirmación de acceso"
      title="Estamos activando tu cuenta"
      description="Terminamos la verificación de tu correo y cerramos la entrada a tu espacio privado sin pedirte pasos innecesarios."
    >
      <AuthCallbackCard
        email={resolvedSearchParams?.email}
        nextPath={resolvedSearchParams?.next || '/app'}
      />
    </AuthShell>
  )
}
