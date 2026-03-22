import { AuthShell } from '@/modules/auth/ui/auth-shell'
import type { AuthShellPanelContent } from '@/modules/auth/ui/auth-page-content'
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
  const panel: AuthShellPanelContent = {
    eyebrow: 'Confirmación de acceso',
    title: 'Estamos activando tu cuenta',
    description:
      'Terminamos la verificación de tu correo y cerramos la entrada a tu espacio privado sin pedirte pasos innecesarios.',
    contextNote:
      'Pantalla transitoria de confirmación: misma experiencia pública, menos ruido y foco total en terminar el acceso.',
    supportingPoints: [
      {
        value: 'Seguro',
        label: 'Comprobamos la sesión antes de dejarte entrar en el área privada.',
      },
      {
        value: 'Breve',
        label: 'Es un paso de transición pensado para durar solo unos segundos.',
      },
      {
        value: 'Claro',
        label: 'Si algo falla, el siguiente estado debe explicarte qué hacer después.',
      },
    ],
    variant: 'recovery',
  }

  return (
    <AuthShell panel={panel}>
      <AuthCallbackCard
        email={resolvedSearchParams?.email}
        nextPath={resolvedSearchParams?.next || '/app'}
      />
    </AuthShell>
  )
}
