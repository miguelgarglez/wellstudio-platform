import { NotFoundPanel } from '@/components/ui/not-found-panel'

export default function NotFoundPage() {
  return (
    <NotFoundPanel
      shellClassName="wellstudio-landing-shell"
      title="Esta página no está disponible"
      description="Puede que el enlace esté incompleto o que la página haya cambiado. Te dejamos accesos rápidos para seguir en WellStudio sin perder tiempo."
      note="El entrenamiento sigue en marcha. Vuelve a una zona conocida o escríbenos si esperabas encontrar algo aquí."
      actions={[
        { href: '/', label: 'Ir al inicio' },
        { href: '/#contacto', label: 'Contactar con el equipo', variant: 'outline' },
        { href: '/login', label: 'Acceso de socios', variant: 'outline' },
      ]}
    />
  )
}
