import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export function MemberHomeDashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.32fr)_minmax(320px,0.88fr)] lg:gap-5">
      <Card className="order-1 overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white py-0 shadow-none">
        <CardContent className="px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--wellstudio-blue-deep)]">
                Inicio
              </p>
              <div className="flex flex-col gap-3">
                <h1 className="font-display text-4xl uppercase tracking-[0.03em] text-[var(--wellstudio-ink)] sm:text-5xl xl:text-6xl">
                  Bienvenido de nuevo
                </h1>
                <p className="max-w-3xl text-base leading-8 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] sm:text-lg">
                  Tu home privada ya prioriza lo importante: próximas sesiones, waitlists activas y el estado comercial básico para que recuperes contexto rápido.
                </p>
              </div>
            </div>

            <MemberHomeHeroMetaSkeleton />
          </div>
        </CardContent>
      </Card>

      <MemberHomeDashboardBodySkeleton />
    </div>
  )
}

export function MemberHomeHeroMetaSkeleton() {
  return (
    <>
      <MemberHomeSummaryPillsSkeleton />
      <MemberHomeFooterMetaSkeleton />
    </>
  )
}

export function MemberHomeSummaryPillsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-9 w-28 rounded-full" />
      <Skeleton className="h-9 w-40 rounded-full" />
    </div>
  )
}

export function MemberHomeFooterMetaSkeleton() {
  return (
    <Skeleton className="h-4 w-full max-w-xs rounded-full" />
  )
}

export function MemberHomeDashboardBodySkeleton() {
  return (
    <>
      <Card className="order-3 overflow-visible rounded-[2rem] bg-white py-0 shadow-none lg:order-2">
        <CardHeader className="px-7 pb-3 pt-7 sm:px-8">
          <Skeleton className="h-7 w-40 rounded-full" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-7 pb-7 pt-3 sm:px-8">
          <SnapshotSkeleton />
          <Separator className="bg-[color:color-mix(in_srgb,var(--border)_78%,white)]" />
          <SnapshotSkeleton />
          <Separator className="bg-[color:color-mix(in_srgb,var(--border)_78%,white)]" />
          <SnapshotSkeleton />
        </CardContent>
      </Card>

      <Card className="order-2 overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none lg:order-3">
        <CardHeader className="flex flex-col gap-4 border-b border-[color:color-mix(in_srgb,var(--border)_70%,white)] px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-8 w-52 rounded-full" />
          </div>
          <Skeleton className="hidden h-11 w-36 rounded-full sm:block" />
        </CardHeader>
        <CardContent className="grid gap-3 px-6 py-6 sm:px-7">
          <ActivityCardSkeleton />
        </CardContent>
      </Card>

      <Card className="order-4 overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none lg:col-span-1">
        <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_70%,white)] px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-7 w-64 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 px-6 py-6 sm:px-7">
          <ActivityCardSkeleton compact />
        </CardContent>
      </Card>

      <section className="order-5 flex flex-col gap-3 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--border)_70%,white)] bg-[color:color-mix(in_srgb,var(--card)_72%,white)] px-6 py-6 lg:self-start lg:px-7">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-6 w-44 rounded-full" />
        </div>
        <div className="space-y-3">
          <AlertSkeleton />
          <Separator className="bg-[color:color-mix(in_srgb,var(--border)_78%,white)]" />
          <AlertSkeleton />
        </div>
      </section>
    </>
  )
}

function SnapshotSkeleton() {
  return (
    <div className="flex items-start gap-3 py-1">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
      </div>
    </div>
  )
}

function ActivityCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-white px-5 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-5 w-48 rounded-full" />
          <Skeleton className="h-4 w-44 rounded-full" />
        </div>
        <Skeleton className="h-4 w-28 rounded-full" />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className={`h-4 rounded-full ${compact ? 'w-32' : 'w-40'}`} />
      </div>
    </div>
  )
}

function AlertSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-56 rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
      </div>
    </div>
  )
}
