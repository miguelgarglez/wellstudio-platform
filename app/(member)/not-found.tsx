import { NotFoundPanel } from '@/components/ui/not-found-panel'

export default function MemberNotFoundPage() {
  return (
    <NotFoundPanel
      shellClassName="min-h-[52vh] px-0 py-4 sm:px-0 sm:py-6"
      panelClassName="max-w-4xl"
      title="No encontramos esta sección"
      description="La ruta que has abierto no existe o ya no está disponible dentro del portal de socios."
      note="Tu cuenta y tus reservas siguen intactas. Vuelve al portal para continuar desde el punto correcto."
      actions={[
        { href: '/app', label: 'Volver al portal' },
        { href: '/', label: 'Ir al inicio', variant: 'outline' },
      ]}
    />
  )
}
