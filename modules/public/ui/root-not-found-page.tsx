import { NotFoundPanel } from '@/components/ui/not-found-panel'
import { resolveAuthContext } from '@/modules/auth/server/identity'
import { getRootNotFoundActions } from '@/modules/public/ui/root-not-found-actions'

export async function RootNotFoundPage() {
  const authContext = await resolveAuthContext()

  return (
    <NotFoundPanel
      shellClassName="wellstudio-landing-shell"
      title="Esta página no está disponible"
      description="Puede que el enlace esté incompleto o que la página haya cambiado. Te dejamos accesos rápidos para seguir en WellStudio sin perder tiempo."
      note="El entrenamiento sigue en marcha. Vuelve a una zona conocida o escríbenos si esperabas encontrar algo aquí."
      actions={getRootNotFoundActions(authContext.isAuthenticated)}
    />
  )
}
