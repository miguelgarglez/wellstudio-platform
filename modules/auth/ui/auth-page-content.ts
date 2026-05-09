export type AuthShellVariant = 'entry' | 'recovery'

export type AuthSupportingPoint = {
  value: string
  label: string
}

export type AuthShellPanelContent = {
  eyebrow: string
  title: string
  description: string
  contextNote?: string
  supportingPoints: AuthSupportingPoint[]
  variant: AuthShellVariant
}

const entrySupportingPoints: AuthSupportingPoint[] = [
  {
    value: '1:1',
    label: 'Seguimiento cercano y técnica cuidada desde el primer día.',
  },
  {
    value: '4 max',
    label: 'Grupos reducidos para corregir, progresar y sostener la rutina.',
  },
  {
    value: 'Madrid',
    label: 'Centro boutique con trato directo y una experiencia más personal.',
  },
]

const recoverySupportingPoints: AuthSupportingPoint[] = [
  {
    value: 'Seguro',
    label: 'Recuperación guiada sin perder acceso a reservas ni seguimiento.',
  },
  {
    value: 'Claro',
    label: 'Una sola tarea por pantalla y ayudas secundarias fáciles de encontrar.',
  },
  {
    value: 'Humano',
    label: 'Si algo falla, el equipo sigue disponible por email o WhatsApp.',
  },
]

export const authPageContent = {
  login: {
    panel: {
      eyebrow: 'Socios WellStudio',
      title: 'Entrena con acceso privado',
      description:
        'Tu área privada concentra reservas, planes y seguimiento en un acceso claro y directo.',
      supportingPoints: entrySupportingPoints,
      variant: 'entry',
    } satisfies AuthShellPanelContent,
  },
  register: {
    panel: {
      eyebrow: 'Nuevo acceso',
      title: 'Empieza tu experiencia boutique',
      description:
        'Preparamos tu acceso privado para empezar con orden, seguimiento y una entrada cuidada.',
      supportingPoints: entrySupportingPoints,
      variant: 'entry',
    } satisfies AuthShellPanelContent,
  },
  forgotPassword: {
    panel: {
      eyebrow: 'Recuperar acceso',
      title: 'Vuelve a entrar con calma',
      description:
        'Recupera tu acceso con un flujo sereno, directo y fácil de seguir.',
      supportingPoints: recoverySupportingPoints,
      variant: 'recovery',
    } satisfies AuthShellPanelContent,
  },
  resetPassword: {
    panel: {
      eyebrow: 'Nueva contraseña',
      title: 'Recupera tu acceso privado',
      description:
        'Validamos el enlace y te devolvemos el acceso con un cambio de contraseña claro y seguro.',
      supportingPoints: recoverySupportingPoints,
      variant: 'recovery',
    } satisfies AuthShellPanelContent,
  },
}
