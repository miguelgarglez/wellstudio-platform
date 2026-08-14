import type { NotFoundAction } from '@/components/ui/not-found-panel'

export const UNHANDLED_ERROR_COPY = {
  code: '500',
  asideEyebrow: 'Incidencia',
  eyebrow: 'Error no esperado',
  title: 'No hemos podido cargar esta página',
  description:
    'Ha ocurrido un problema interno al preparar esta vista. Tu sesión no se ha perdido: puedes reintentar o volver a una zona conocida de WellStudio.',
  note: 'Si persiste, el equipo puede localizarlo con el código de incidencia. No hace falta recargar en bucle.',
} as const

export function getUnhandledErrorActions(): NotFoundAction[] {
  return [
    { href: '/', label: 'Ir al inicio' },
    { href: '/#contacto', label: 'Contactar con el equipo', variant: 'outline' },
  ]
}
