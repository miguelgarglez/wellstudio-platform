import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export function MemberReservationsDashboardSkeleton() {
  return (
    <section className="space-y-5 lg:space-y-6">
      <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white py-0 shadow-none">
        <CardContent className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <Skeleton className="h-3 w-24 rounded-full" />
              <div className="flex flex-col gap-2.5 sm:gap-3 xl:max-w-4xl">
                <Skeleton className="h-10 w-full max-w-[24rem] rounded-[1rem] sm:h-14 sm:max-w-[29rem]" />
                <Skeleton className="h-10 w-full max-w-[18rem] rounded-[1rem] sm:h-14 sm:max-w-[21rem]" />
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-4 w-full max-w-3xl rounded-full" />
                  <Skeleton className="h-4 w-full max-w-[40rem] rounded-full" />
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="hidden h-9 w-36 rounded-full sm:block" />
            </div>

            <div className="sm:hidden">
              <Skeleton className="h-4 w-32 rounded-full" />
            </div>

            <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <Skeleton className="h-4 w-full max-w-[32rem] rounded-full" />
              <Skeleton className="h-11 w-40 rounded-full" />
            </div>

            <div className="hidden rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-5 py-4 sm:block sm:px-6">
              <div className="flex items-start gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full bg-white/90" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-52 rounded-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-11/12 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(320px,0.92fr)] xl:gap-5">
        <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none">
          <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="h-8 w-56 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 py-6 sm:px-7">
            <ReservationCardSkeleton />
          </CardContent>
        </Card>

        <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none">
          <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-8 w-52 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 py-6 sm:px-7">
            <ReservationCardSkeleton actionButtonWidth="w-24" />
          </CardContent>
        </Card>
      </div>

      <Card
        id="agenda-futura"
        className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none"
      >
        <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-8 w-72 rounded-full" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full max-w-3xl rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 px-6 py-6 sm:px-7">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-36 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-full" />
            </div>
            <div className="grid gap-3">
              <ScheduleSessionSkeleton />
              <ScheduleSessionSkeleton actionButtonWidth="w-28" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none">
        <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-8 w-72 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6 sm:px-7">
          <div className="grid gap-2">
            <HistoryRowSkeleton />
            <Separator className="bg-[color:color-mix(in_srgb,var(--border)_74%,white)]" />
            <HistoryRowSkeleton />
            <Separator className="bg-[color:color-mix(in_srgb,var(--border)_74%,white)]" />
            <HistoryRowSkeleton />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function ReservationCardSkeleton({
  actionButtonWidth = 'w-32',
}: {
  actionButtonWidth?: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-white px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-5 w-52 rounded-full" />
          <Skeleton className="h-4 w-40 rounded-full" />
          <div className="flex flex-wrap gap-2 pt-1">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-4 w-36 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 lg:items-end">
          <Skeleton className={`h-10 rounded-full ${actionButtonWidth}`} />
          <Skeleton className="h-4 w-32 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function ScheduleSessionSkeleton({
  actionButtonWidth = 'w-24',
}: {
  actionButtonWidth?: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-white px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-56 rounded-full" />
          <Skeleton className="h-4 w-44 rounded-full" />
          <div className="flex flex-wrap gap-2 pt-1">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 lg:items-end">
          <Skeleton className={`h-10 rounded-full ${actionButtonWidth}`} />
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function HistoryRowSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48 rounded-full" />
        <Skeleton className="h-4 w-40 rounded-full" />
      </div>
      <div className="space-y-2 sm:text-right">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
    </div>
  )
}
