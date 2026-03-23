import { UserRound } from 'lucide-react'

import { MemberPortalSectionShell } from '@/modules/members/ui/member-portal-section-shell'

export default function MemberProfilePage() {
  return (
    <MemberPortalSectionShell
      eyebrow="Perfil"
      title="Tus datos"
      description="Perfil será la base para mostrar y editar información personal del socio sin mezclarla con reservas o cuenta comercial."
    >
      <div className="rounded-[1.5rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-5 py-8 sm:px-6">
        <div className="flex max-w-2xl items-start gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-[1rem] bg-white text-[var(--wellstudio-blue-deep)] shadow-[0_14px_30px_rgba(16,18,24,0.08)]">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-3">
            <p className="text-lg font-medium text-[var(--wellstudio-ink)]">
              La estructura de perfil ya está separada del resto del portal.
            </p>
            <p className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
              En el siguiente slice de esta sección conectaremos los datos
              personales reales del socio y la futura edición sin contaminar la
              home ni la parte comercial.
            </p>
          </div>
        </div>
      </div>
    </MemberPortalSectionShell>
  )
}
