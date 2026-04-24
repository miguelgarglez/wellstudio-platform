import Link from 'next/link'
import { AlertTriangle, Search, ShieldPlus, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  AdminBookingOverrideItem,
  AdminMemberMembershipSummary,
  AdminMemberOverrideOverview,
} from '@/modules/admin/server/admin-member-overrides-overview'
import { AdminMemberOverrideActions } from '@/modules/admin/ui/admin-member-override-actions'
import { revokeMemberOverrideAction } from '@/app/(admin)/admin/overrides/actions'
import { cn } from '@/lib/utils'

type AdminMemberOverridesDashboardProps = {
  overview: AdminMemberOverrideOverview
  updatedState: 'extra' | 'session' | 'revoked' | 'revoke-error' | null
}

export function AdminMemberOverridesDashboard({
  overview,
  updatedState,
}: AdminMemberOverridesDashboardProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(340px,390px)]">
      <section
        aria-labelledby="admin-member-search"
        className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--card)_86%,white)] p-3 shadow-[0_16px_36px_rgba(18,20,24,0.055)] xl:sticky xl:top-4 xl:max-h-[calc(100vh-8.4rem)] xl:overflow-y-auto"
      >
        <div className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-2 pb-3 pt-2">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
            Socios
          </p>
          <div className="mt-2 flex items-start gap-2.5">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
              <Search className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="admin-member-search" className="text-lg font-medium text-[var(--wellstudio-ink)]">
                Buscar socio
              </h2>
              <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
                Busca, selecciona y conserva el contexto visible mientras operas.
              </p>
            </div>
          </div>
        </div>

        <form action="/admin/overrides" className="px-2 pb-2 pt-3">
          <div className="space-y-3">
            <Input
              name="q"
              defaultValue={overview.query}
              placeholder="Busca por nombre o email…"
              autoComplete="off"
              spellCheck={false}
              aria-label="Buscar socio"
              className="bg-white"
            />
            <Button type="submit" className="w-full rounded-full">
              Buscar socio
            </Button>
          </div>
        </form>

        <div className="pt-2">
          {overview.query.length === 0 ? (
            <EmptySearchState
              title="Empieza con una búsqueda"
              description="Usa nombre o email para abrir el contexto comercial y el historial de overrides del socio."
            />
          ) : overview.searchResults.length === 0 ? (
            <EmptySearchState
              title="Sin resultados"
              description="No hemos encontrado ningún socio para esta búsqueda. Ajusta el texto y vuelve a intentarlo."
            />
          ) : (
            <nav aria-label="Resultados de búsqueda de socios">
              <ul className="space-y-1.5 px-0.5">
                {overview.searchResults.map((member) => {
                  const isSelected = overview.selectedMemberId === member.id

                  return (
                    <li key={member.id}>
                      <Link
                        href={buildOverridesHref({
                          query: overview.query,
                          memberId: member.id,
                        })}
                        className={cn(
                          'block rounded-[1.05rem] border px-3 py-3 transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                          isSelected
                            ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] shadow-[0_12px_30px_rgba(20,24,30,0.08)]'
                            : 'border-transparent bg-transparent hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] hover:bg-white',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
                              {member.displayName}
                            </p>
                            <p className="truncate text-xs text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]" translate="no">
                              {member.email}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
                              {member.statusLabel}
                            </p>
                            <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">
                              {member.activeMembershipCount === 1
                                ? '1 activa'
                                : `${member.activeMembershipCount} activas`}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}
        </div>
      </section>

      <section
        aria-labelledby="admin-member-override-detail"
        className="min-w-0 rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white p-4 shadow-[0_16px_36px_rgba(18,20,24,0.055)] sm:p-5"
      >
        <div
          key={overview.selectedMember?.id ?? 'empty'}
          className="wellstudio-admin-panel-animate space-y-4"
        >
          {overview.selectedMember ? (
            <>
              <header className="space-y-4 border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
                      Socio seleccionado
                    </p>
                    <div className="space-y-2">
                      <h2 id="admin-member-override-detail" className="text-2xl font-medium text-[var(--wellstudio-ink)]">
                        {overview.selectedMember.displayName}
                      </h2>
                      <p className="truncate text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]" translate="no">
                        {overview.selectedMember.email}
                      </p>
                    </div>
                  </div>
                  <StatusBadge tone="member">
                    {overview.selectedMember.statusLabel}
                  </StatusBadge>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailPill
                    label="Memberships activas"
                    value={
                      overview.selectedMember.activeMembershipCount === 1
                        ? '1 activa'
                        : `${overview.selectedMember.activeMembershipCount} activas`
                    }
                  />
                  <DetailPill
                    label="Overrides visibles"
                    value={
                      overview.selectedMember.overrides.length === 1
                        ? '1 registro'
                        : `${overview.selectedMember.overrides.length} registros`
                    }
                  />
                  <DetailPill
                    label="Sesiones elegibles"
                    value={
                      overview.selectedMember.sessionCandidates.length === 1
                        ? '1 candidata'
                        : `${overview.selectedMember.sessionCandidates.length} candidatas`
                    }
                  />
                </div>
              </header>

              <div className="space-y-4">
                <section className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
                        <ShieldPlus className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-medium text-[var(--wellstudio-ink)]">
                        Memberships activas
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                        Selecciona la membership operable. El inspector derecho ejecuta las acciones.
                      </p>
                    </div>
                  </div>

                  {overview.selectedMember.activeMemberships.length > 0 ? (
                    <div className="grid gap-2">
                      {overview.selectedMember.activeMemberships.map((membership) => (
                        <MembershipLinkCard
                          key={membership.id}
                          query={overview.query}
                          memberId={overview.selectedMemberId!}
                          membership={membership}
                          selectedMembershipId={overview.selectedMembershipId}
                          selectedSessionId={overview.selectedSessionId}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyInset
                      title="Sin memberships activas"
                      description="Este socio no tiene memberships activas operables. Puedes consultar el historial, pero no conceder overrides nuevos."
                    />
                  )}
                </section>

                <section className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
                        <AlertTriangle className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-medium text-[var(--wellstudio-ink)]">
                        Historial de overrides
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                        Vigencia, actor, razón y revocación. V1 concede y revoca, no edita.
                      </p>
                    </div>
                  </div>

                  {overview.selectedMember.overrides.length > 0 ? (
                    <div className="space-y-2">
                      {overview.selectedMember.overrides.map((override) => (
                        <OverrideHistoryCard
                          key={override.id}
                          item={override}
                          query={overview.query}
                          memberId={overview.selectedMemberId!}
                          membershipId={overview.selectedMembershipId}
                          sessionId={overview.selectedSessionId}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyInset
                      title="Sin overrides previos"
                      description="Todavía no hay concesiones ni revocaciones registradas para las memberships activas de este socio."
                    />
                  )}
                </section>
              </div>
            </>
          ) : (
            <div className="flex min-h-[28rem] items-center justify-center rounded-[1.35rem] border border-dashed border-[color:color-mix(in_srgb,var(--border)_84%,white)] bg-[color:color-mix(in_srgb,var(--card)_72%,white)] px-6 py-10 text-center">
              <div className="max-w-md space-y-4">
                <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <div className="space-y-2">
                  <h2 id="admin-member-override-detail" className="text-xl font-medium text-[var(--wellstudio-ink)]">
                    Selecciona un socio para operar
                  </h2>
                  <p className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                    El panel derecho mostrará memberships activas, historial de overrides y las acciones para conceder allowance extra o session access.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside
        aria-label="Acciones de override"
        className="min-w-0 lg:col-start-2 2xl:col-auto 2xl:sticky 2xl:top-4 2xl:max-h-[calc(100vh-8.4rem)] 2xl:overflow-y-auto"
      >
        {overview.selectedMember ? (
          overview.selectedMember.activeMemberships.length > 0 ? (
            <AdminMemberOverrideActions
              query={overview.query}
              memberId={overview.selectedMember.id}
              memberships={overview.selectedMember.activeMemberships}
              selectedMembershipId={overview.selectedMembershipId}
              selectedSessionId={overview.selectedSessionId}
              sessionCandidates={overview.selectedMember.sessionCandidates}
              updatedState={updatedState}
            />
          ) : (
            <ActionRailEmpty
              title="Sin acciones disponibles"
              description="Solo se pueden conceder overrides sobre memberships activas. Mantén el historial visible, pero no muestres formularios que no se pueden ejecutar."
            />
          )
        ) : (
          <ActionRailEmpty
            title="Inspector de acciones"
            description="Selecciona un socio para ver acciones de allowance extra, session access y revocación."
          />
        )}
      </aside>
    </div>
  )
}

export function AdminMemberOverridesDashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(340px,390px)]">
      <div className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--card)_86%,white)] p-3 shadow-[0_16px_36px_rgba(18,20,24,0.055)]">
        <div className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] px-2 pb-3 pt-2">
          <Skeleton className="h-3 w-20 rounded-full" />
          <div className="mt-3 flex items-start gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
            </div>
          </div>
        </div>
        <div className="space-y-3 px-2 pb-2 pt-3">
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
        <div className="space-y-1.5 px-0.5 pt-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-[1.05rem] px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-4 w-40 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="h-3 w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.55rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white p-4 shadow-[0_16px_36px_rgba(18,20,24,0.055)] sm:p-5">
        <div className="space-y-4">
          <div className="space-y-4 border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-8 w-48 rounded-full" />
                <Skeleton className="h-4 w-56 rounded-full" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] px-4 py-4">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="mt-2 h-5 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, sectionIndex) => (
              <div key={sectionIndex} className="space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-40 rounded-full" />
                    <Skeleton className="h-4 w-full rounded-full" />
                  </div>
                </div>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] px-4 py-3">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="mt-2 h-4 w-48 rounded-full" />
                    <Skeleton className="mt-2 h-4 w-56 rounded-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:col-start-2 2xl:col-auto">
        <Skeleton className="h-16 w-full rounded-[1.25rem]" />
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-[1.45rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-white p-4 shadow-[0_16px_36px_rgba(18,20,24,0.055)]">
            <div className="flex items-start gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-36 rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Skeleton className="h-16 w-full rounded-[1rem]" />
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-20 w-full rounded-[1rem]" />
              <Skeleton className="h-11 w-48 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MembershipLinkCard({
  query,
  memberId,
  membership,
  selectedMembershipId,
  selectedSessionId,
}: {
  query: string
  memberId: string
  membership: AdminMemberMembershipSummary
  selectedMembershipId: string | null
  selectedSessionId: string | null
}) {
  const isSelected = membership.id === selectedMembershipId

  return (
    <Link
      href={buildOverridesHref({
        query,
        memberId,
        membershipId: membership.id,
        sessionId: selectedSessionId,
      })}
      className={cn(
        'block rounded-[1.15rem] border px-4 py-3 transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        isSelected
          ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] shadow-[0_12px_30px_rgba(20,24,30,0.08)]'
          : 'border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-[color:color-mix(in_srgb,var(--card)_74%,white)] hover:bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-medium text-[var(--wellstudio-ink)]">{membership.planName}</p>
          <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
            {membership.windowLabel}
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
            {membership.policySummaryLabel}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <StatusBadge tone={membership.extraAllowanceEnabled ? 'ready' : 'blocked'}>
            {membership.statusLabel}
          </StatusBadge>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
        {membership.extraAllowanceHint}
      </p>
    </Link>
  )
}

function OverrideHistoryCard({
  item,
  query,
  memberId,
  membershipId,
  sessionId,
}: {
  item: AdminBookingOverrideItem
  query: string
  memberId: string
  membershipId: string | null
  sessionId: string | null
}) {
  return (
    <article className="rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-[color:color-mix(in_srgb,var(--card)_74%,white)] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={item.typeTone}>{item.typeLabel}</StatusBadge>
            <StatusBadge tone={item.statusTone}>{item.statusLabel}</StatusBadge>
          </div>
          <p className="text-sm font-medium text-[var(--wellstudio-ink)]">{item.summaryLabel}</p>
          <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
            {item.reason}
          </p>
        </div>
        <div className="max-w-[14rem] text-right text-xs uppercase tracking-[0.18em] text-[color:color-mix(in_srgb,var(--foreground)_60%,white)]">
          <p>{item.membershipPlanName}</p>
          <p className="mt-1">{item.windowLabel}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 border-t border-[color:color-mix(in_srgb,var(--border)_72%,white)] pt-3 text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] sm:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
            Concedido por
          </p>
          <p className="mt-1">{item.grantedByLabel}</p>
          <p>{item.grantedAtLabel}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
            Revocación
          </p>
          <p className="mt-1">{item.revokedByLabel ?? 'No revocado'}</p>
          <p>{item.revokedAtLabel ?? 'Vigente mientras no se revoque o expire'}</p>
        </div>
      </div>

      {item.canRevoke ? (
        <details className="mt-3 rounded-[1rem] border border-[color:color-mix(in_srgb,var(--destructive)_16%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_5%,white)] px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-medium text-[var(--wellstudio-ink)]">
            Revocar override
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              La revocación no borra historial. Solo marca `revokedAt` y deja trazabilidad del actor.
            </p>
            <form action={revokeMemberOverrideAction}>
              <input type="hidden" name="query" value={query} />
              <input type="hidden" name="memberId" value={memberId} />
              <input type="hidden" name="membershipId" value={membershipId ?? ''} />
              <input type="hidden" name="sessionId" value={sessionId ?? ''} />
              <input type="hidden" name="overrideId" value={item.id} />
              <Button
                type="submit"
                variant="ghost"
                className="rounded-full border border-[color:color-mix(in_srgb,var(--destructive)_16%,white)] bg-white text-[var(--wellstudio-ink)] hover:bg-white/90"
              >
                Confirmar revocación
              </Button>
            </form>
          </div>
        </details>
      ) : null}
    </article>
  )
}

function ActionRailEmpty({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.45rem] border border-dashed border-[color:color-mix(in_srgb,var(--border)_82%,white)] bg-[color:color-mix(in_srgb,var(--card)_78%,white)] px-5 py-6">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
        Acciones
      </p>
      <h2 className="mt-3 text-lg font-medium text-[var(--wellstudio-ink)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
        {description}
      </p>
    </div>
  )
}

function EmptySearchState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-sm font-medium text-[var(--wellstudio-ink)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
        {description}
      </p>
    </div>
  )
}

function EmptyInset({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-[color:color-mix(in_srgb,var(--border)_82%,white)] px-4 py-6">
      <p className="text-sm font-medium text-[var(--wellstudio-ink)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
        {description}
      </p>
    </div>
  )
}

function StatusBadge({
  children,
  tone,
}: {
  children: string
  tone: 'extra' | 'session' | 'active' | 'revoked' | 'expired' | 'member' | 'ready' | 'blocked'
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]',
        tone === 'extra' &&
          'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]',
        tone === 'session' &&
          'border-[color:color-mix(in_srgb,#3f7d57_22%,white)] bg-[color:color-mix(in_srgb,#3f7d57_10%,white)] text-[#2f6245]',
        tone === 'active' &&
          'border-[color:color-mix(in_srgb,#3f7d57_22%,white)] bg-[color:color-mix(in_srgb,#3f7d57_10%,white)] text-[#2f6245]',
        tone === 'revoked' &&
          'border-[color:color-mix(in_srgb,var(--destructive)_20%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_8%,white)] text-destructive',
        tone === 'expired' &&
          'border-[color:color-mix(in_srgb,var(--border)_82%,white)] bg-[color:color-mix(in_srgb,var(--card)_76%,white)] text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]',
        tone === 'member' &&
          'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] text-[var(--wellstudio-blue-deep)]',
        tone === 'ready' &&
          'border-[color:color-mix(in_srgb,#3f7d57_22%,white)] bg-[color:color-mix(in_srgb,#3f7d57_10%,white)] text-[#2f6245]',
        tone === 'blocked' &&
          'border-[color:color-mix(in_srgb,var(--destructive)_20%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_8%,white)] text-destructive',
      )}
    >
      {children}
    </span>
  )
}

function DetailPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--wellstudio-ink)]">{value}</p>
    </div>
  )
}

function buildOverridesHref(input: {
  query: string
  memberId: string
  membershipId?: string | null
  sessionId?: string | null
}) {
  const params = new URLSearchParams()

  if (input.query) {
    params.set('q', input.query)
  }

  params.set('member', input.memberId)

  if (input.membershipId) {
    params.set('membership', input.membershipId)
  }

  if (input.sessionId) {
    params.set('session', input.sessionId)
  }

  return `/admin/overrides?${params.toString()}`
}
