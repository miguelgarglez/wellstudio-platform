import { NotFoundPanel } from '@/components/ui/not-found-panel'

export default function AdminNotFoundPage() {
  return (
    <NotFoundPanel
      shellClassName="min-h-[56vh] justify-center px-0 py-5 sm:px-0"
      panelClassName="max-w-4xl"
      title="Recurso no disponible"
      description="Esta URL no corresponde a una sección activa. Si necesitas ayuda, vuelve al panel principal."
      note="No se ha modificado ningún dato del panel. Puedes volver al área admin y seguir gestionando desde allí."
      actions={[
        { href: '/admin', label: 'Ir al panel admin' },
        { href: '/', label: 'Inicio público', variant: 'outline' },
      ]}
    />
  )
}
