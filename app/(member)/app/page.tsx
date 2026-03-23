import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MemberPortalSectionShell } from '@/modules/members/ui/member-portal-section-shell'
import { getAuthenticatedMemberShellSummary } from '@/modules/members/server/member-shell-summary'

export default async function MemberAppPage() {
  const summary = await getAuthenticatedMemberShellSummary()

  return (
    <MemberPortalSectionShell
      eyebrow="Inicio"
      title="Bienvenido de nuevo"
      description="La shell privada ya está activa, con navegación estable y contexto real del socio. El dashboard operativo de reservas llegará en MIG-75."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <Card className="overflow-visible rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0">
          <CardHeader className="px-5 py-5 sm:px-6">
            <CardTitle className="text-lg text-[var(--wellstudio-ink)]">
              Zona privada lista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
            <p className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              Ya tienes una base navegable para moverte entre Inicio, Reservas,
              Perfil y Cuenta sin depender de una sola página aislada.
            </p>
            <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-[var(--muted)]/65 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                Siguiente paso
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
                El siguiente ticket convertirá esta portada en una home orientada a
                reservas, con próximas sesiones, estado comercial y CTA real hacia
                la agenda.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0">
          <CardHeader className="px-5 py-5 sm:px-6">
            <CardTitle className="text-lg text-[var(--wellstudio-ink)]">
              Contexto de sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                Socio
              </p>
              <p className="mt-2 text-base font-medium text-[var(--wellstudio-ink)]">
                {summary.displayName}
              </p>
              <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                {summary.email}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                  Estado
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--wellstudio-ink)]">
                  {summary.memberStatusLabel}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                  Roles
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--wellstudio-ink)]">
                  {summary.rolesLabel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MemberPortalSectionShell>
  )
}
