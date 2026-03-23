import { CalendarDays } from 'lucide-react'

import { MemberPortalSectionShell } from '@/modules/members/ui/member-portal-section-shell'

export default function MemberReservationsPage() {
  return (
    <MemberPortalSectionShell
      eyebrow="Reservas"
      title="Centro operativo"
      description="Aquí vivirá la agenda privada del socio, con próximas reservas, disponibilidad y acciones reales de reservar o cancelar."
    >
      <div className="rounded-[1.5rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-5 py-8 sm:px-6">
        <div className="flex max-w-2xl items-start gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-[1rem] bg-white text-[var(--wellstudio-blue-deep)] shadow-[0_14px_30px_rgba(16,18,24,0.08)]">
            <CalendarDays className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-3">
            <p className="text-lg font-medium text-[var(--wellstudio-ink)]">
              Esta sección será el corazón operativo del portal.
            </p>
            <p className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
              En MIG-76 entraremos a construir la estructura de agenda, próximas
              reservas, estados vacíos y framing para las acciones futuras de
              reservar, cancelar o entrar en waitlist.
            </p>
          </div>
        </div>
      </div>
    </MemberPortalSectionShell>
  )
}
