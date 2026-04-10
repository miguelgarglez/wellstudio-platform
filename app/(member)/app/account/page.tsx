import { Suspense } from 'react'
import { CreditCard, Mail, ShieldCheck } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from '@/modules/auth/ui/logout-button'
import { getAuthenticatedMemberShellSummary } from '@/modules/members/server/member-shell-summary'
import { MemberPortalSectionShell } from '@/modules/members/ui/member-portal-section-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function MemberAccountPage() {
  return (
    <MemberPortalSectionShell
      eyebrow="Cuenta"
      title="Sesión y cuenta"
      description="Cuenta reunirá la capa comercial del portal. En esta primera versión ya sirve como destino estable para sesión, email y próximas acciones de cuenta."
    >
      <Suspense fallback={<MemberAccountPanelSkeleton />}>
        <MemberAccountPanels />
      </Suspense>
    </MemberPortalSectionShell>
  )
}

async function MemberAccountPanels() {
  const summary = await getAuthenticatedMemberShellSummary()

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.75fr)]">
      <Card className="overflow-visible rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0">
        <CardHeader className="px-5 py-5 sm:px-6">
          <CardTitle className="text-lg text-[var(--wellstudio-ink)]">
            Datos básicos de sesión
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] px-4 py-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
                  Email de acceso
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--wellstudio-ink)]">
                  {summary.email}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] px-4 py-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
                  Estado actual
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--wellstudio-ink)]">
                  {summary.memberStatusLabel}
                </p>
                <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                  Roles activos: {summary.rolesLabel}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0">
        <CardHeader className="px-5 py-5 sm:px-6">
          <CardTitle className="text-lg text-[var(--wellstudio-ink)]">
            Próximas acciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="rounded-[1.25rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-4 py-4">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 size-4 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
                  Aquí aparecerán tarjeta, pagos, bonos y suscripciones.
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                  Esta sección ya existe como destino estable para mobile y será la
                  base del trabajo comercial en MIG-77.
                </p>
              </div>
            </div>
          </div>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  )
}

function MemberAccountPanelSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.75fr)]">
      <Card className="overflow-visible rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0">
        <CardHeader className="px-5 py-5 sm:px-6">
          <Skeleton className="h-7 w-52 rounded-full" />
        </CardHeader>
        <CardContent className="grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] px-4 py-4">
            <div className="flex items-start gap-3">
              <Skeleton className="mt-0.5 size-4 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="h-5 w-40 rounded-full" />
              </div>
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] px-4 py-4">
            <div className="flex items-start gap-3">
              <Skeleton className="mt-0.5 size-4 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0">
        <CardHeader className="px-5 py-5 sm:px-6">
          <Skeleton className="h-7 w-40 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="rounded-[1.25rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-4 py-4">
            <div className="flex items-start gap-3">
              <Skeleton className="mt-0.5 size-4 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-full max-w-xs rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-11/12 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-full" />
        </CardContent>
      </Card>
    </div>
  )
}
