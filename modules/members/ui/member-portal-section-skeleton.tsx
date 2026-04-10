import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type MemberPortalSectionSkeletonProps = {
  eyebrow: string
  content: ReactNode
}

export function MemberPortalSectionSkeleton({
  eyebrow,
  content,
}: MemberPortalSectionSkeletonProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--wellstudio-blue-deep)]">
          {eyebrow}
        </p>
        <div className="space-y-3">
          <Skeleton className="h-11 w-full max-w-[18rem] rounded-[1rem] sm:h-14 sm:max-w-[22rem] lg:max-w-[26rem]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full max-w-3xl rounded-full" />
            <Skeleton className="h-4 w-full max-w-[34rem] rounded-full" />
            <Skeleton className="h-4 w-3/4 max-w-[26rem] rounded-full" />
          </div>
        </div>
      </header>

      <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue-deep)_10%,white)] bg-[color:color-mix(in_srgb,var(--card)_82%,white)] py-0 shadow-none">
        <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-6 py-6 sm:px-8">
          <CardTitle className="text-lg text-[var(--wellstudio-ink)]">
            Espacio en preparación
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_66%,white)]">
            Esta sección ya está integrada en la shell privada y preparada para recibir
            comportamiento real en los siguientes tickets.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-6 sm:px-8 sm:py-8">{content}</CardContent>
      </Card>
    </section>
  )
}

export function MemberProfileSectionSkeleton() {
  return (
    <MemberPortalSectionSkeleton
      eyebrow="Perfil"
      content={
        <div className="rounded-[1.5rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-5 py-8 sm:px-6">
          <div className="flex max-w-2xl items-start gap-4">
            <Skeleton className="size-12 shrink-0 rounded-[1rem] bg-white" />
            <div className="w-full space-y-3">
              <Skeleton className="h-6 w-full max-w-xl rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
            </div>
          </div>
        </div>
      }
    />
  )
}

export function MemberAccountSectionSkeleton() {
  return (
    <MemberPortalSectionSkeleton
      eyebrow="Cuenta"
      content={
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.75fr)]">
          <Card className="overflow-visible rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0">
            <CardHeader className="px-5 py-5 sm:px-6">
              <Skeleton className="h-7 w-52 rounded-full" />
            </CardHeader>
            <CardContent className="grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
              <AccountDataTileSkeleton />
              <AccountDataTileSkeleton />
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
      }
    />
  )
}

function AccountDataTileSkeleton() {
  return (
    <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] px-4 py-4">
      <div className="flex items-start gap-3">
        <Skeleton className="mt-0.5 size-4 rounded-full" />
        <div className="w-full space-y-2">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-full" />
        </div>
      </div>
    </div>
  )
}
