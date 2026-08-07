'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BadgeEuro,
  CalendarCheck,
  CalendarDays,
  CircleUserRound,
  Clock3,
  Coins,
  CreditCard,
  ExternalLink,
  Mail,
  MessageSquareText,
  Phone,
  Search,
  ShieldCheck,
  TicketCheck,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import type {
  AdminMemberDetail,
  AdminMemberListItem,
  AdminMemberStatusFilter,
  AdminMembersOverview,
} from '@/modules/admin/server/admin-members-overview'
import { AdminResponsiveDetailFrame } from '@/modules/admin/ui/admin-responsive-detail-frame'
import { cn } from '@/lib/utils'

const statusFilters: Array<{ value: AdminMemberStatusFilter; label: string }> = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'blocked', label: 'Bloqueados' },
  { value: 'all', label: 'Todos' },
]

export function AdminMembersDashboard({ overview }: { overview: AdminMembersOverview }) {
  const router = useRouter()
  const baseHref = buildMembersHref({
    query: overview.query,
    status: overview.statusFilter,
  })

  function handleSearch(query: string) {
    router.push(buildMembersHref({ query, status: overview.statusFilter }))
  }

  return (
    <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.55fr)] lg:items-start">
      <div className="min-w-0 overflow-hidden rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] bg-[color:color-mix(in_srgb,var(--card)_90%,white)] shadow-[0_18px_42px_rgba(18,20,24,0.06)]">
        <div className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
              <UsersRound className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Directorio operativo</p>
              <h2 className="mt-1 text-2xl font-medium text-[var(--wellstudio-ink)]">Socios</h2>
              <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
                Busca por identidad o contacto. Abrir una ficha no modifica datos.
              </p>
            </div>
          </div>

          <MemberSearchForm
            key={`${overview.statusFilter}:${overview.query}`}
            initialQuery={overview.query}
            onSearch={handleSearch}
          />

          <div className="mt-4 grid grid-cols-2 gap-2" aria-label="Filtrar socios por estado">
            {statusFilters.map((filter) => (
              <Link
                key={filter.value}
                href={buildMembersHref({ query: overview.query, status: filter.value })}
                aria-current={overview.statusFilter === filter.value ? 'page' : undefined}
                className={cn(
                  'inline-flex min-w-0 items-center justify-between gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                  overview.statusFilter === filter.value
                    ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_32%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] text-[var(--wellstudio-ink)] shadow-[0_8px_18px_rgba(20,24,30,0.06)]'
                    : 'border-[color:color-mix(in_srgb,var(--border)_82%,white)] bg-white/66 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)] hover:bg-white',
                )}
              >
                {filter.label}
                <span className="rounded-full bg-white/72 px-1.5 py-0.5 text-[11px] text-[var(--wellstudio-blue-deep)]">
                  {overview.counts[filter.value]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_66%,white)]">
          {overview.members.length > 0 ? (
            overview.members.map((member) => (
              <MemberListRow
                key={member.id}
                member={member}
                href={buildMembersHref({
                  query: overview.query,
                  status: overview.statusFilter,
                  memberId: member.id,
                })}
                isSelected={overview.selectedMemberId === member.id}
              />
            ))
          ) : (
            <MembersEmptyState query={overview.query} />
          )}
        </div>

        {overview.isResultLimitReached ? (
          <p className="border-t border-[color:color-mix(in_srgb,var(--border)_66%,white)] px-4 py-3 text-xs leading-5 text-muted-foreground sm:px-5">
            Mostrando los primeros 30 resultados. Acota la búsqueda para localizar otros socios.
          </p>
        ) : null}
      </div>

      <AdminResponsiveDetailFrame
        isOpen={Boolean(overview.selectedMember)}
        closeHref={baseHref}
        labelledBy="admin-member-detail-title"
        className="lg:min-h-[46rem]"
      >
        {overview.selectedMember ? (
          <MemberDetail member={overview.selectedMember} />
        ) : (
          <MemberDetailEmptyState />
        )}
      </AdminResponsiveDetailFrame>
    </section>
  )
}

function MemberSearchForm({
  initialQuery,
  onSearch,
}: {
  initialQuery: string
  onSearch: (query: string) => void
}) {
  const [query, setQuery] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(() => onSearch(query))
      }}
    >
      <label className="sr-only" htmlFor="admin-members-search">Buscar socio</label>
      <Input
        id="admin-members-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Nombre, email o teléfono..."
        className="h-11 min-w-0 rounded-full bg-white/86"
      />
      <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full" disabled={isPending}>
        {isPending ? <Spinner /> : <Search className="size-4" aria-hidden="true" />}
        <span className="sr-only">{isPending ? 'Buscando socios' : 'Buscar socio'}</span>
      </Button>
    </form>
  )
}

function MemberListRow({
  member,
  href,
  isSelected,
}: {
  member: AdminMemberListItem
  href: string
  isSelected: boolean
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={isSelected ? 'true' : undefined}
      className={cn(
        'group block px-4 py-4 transition-[background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] sm:px-5',
        isSelected
          ? 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] shadow-[inset_3px_0_0_color-mix(in_srgb,var(--wellstudio-blue)_72%,white)]'
          : 'hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-[var(--wellstudio-ink)]">{member.displayName}</p>
          <p className="mt-1 truncate text-sm text-[color:color-mix(in_srgb,var(--foreground)_66%,white)]">{member.email}</p>
        </div>
        <MemberStatusBadge status={member.status} label={member.statusLabel} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">
        <span>{member.activeMembershipCount} membresía{member.activeMembershipCount === 1 ? '' : 's'} activa{member.activeMembershipCount === 1 ? '' : 's'}</span>
        <span>{member.upcomingReservationCount} próxima{member.upcomingReservationCount === 1 ? '' : 's'}</span>
        <ArrowRight className="ml-auto size-3.5 text-[var(--wellstudio-blue-deep)] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  )
}

function MemberDetail({ member }: { member: AdminMemberDetail }) {
  return (
    <div className="space-y-6">
      <header className="border-b border-[color:color-mix(in_srgb,var(--border)_72%,white)] pb-5">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-[1rem] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] font-display text-xl tracking-[0.08em] text-[var(--wellstudio-blue-deep)]">
            {member.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Ficha de socio</p>
                <h2 id="admin-member-detail-title" className="mt-1 truncate text-2xl font-medium text-[var(--wellstudio-ink)] sm:text-3xl">
                  {member.displayName}
                </h2>
              </div>
              <MemberStatusBadge status={member.status} label={member.statusLabel} />
            </div>
            <p className="mt-2 break-all text-sm text-[color:color-mix(in_srgb,var(--foreground)_66%,white)]">{member.email}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {member.phone ? (
            <a href={`tel:${member.phone.replace(/\s/g, '')}`} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-full' })}><Phone className="size-4" aria-hidden="true" />Llamar</a>
          ) : null}
          <a href={`mailto:${member.email}`} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-full' })}><Mail className="size-4" aria-hidden="true" />Email</a>
          <Link href={`/admin/overrides?member=${encodeURIComponent(member.id)}`} className={buttonVariants({ size: 'sm', className: 'rounded-full' })}>
            <TicketCheck className="size-4" aria-hidden="true" />Operar excepciones
          </Link>
        </div>
      </header>

      <section aria-labelledby="member-account-heading">
        <SectionHeading icon={CircleUserRound} eyebrow="Identidad y acceso" title="Cuenta" id="member-account-heading" />
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailFact label="Teléfono" value={member.phone ?? 'Sin teléfono'} />
          <DetailFact label="Alta" value={member.joinedAtLabel} />
          <DetailFact label="Nacimiento" value={member.birthDateLabel} />
          <DetailFact label="Cuenta" value={member.accountStatusLabel} />
          <DetailFact label="Email" value={member.emailVerifiedLabel} />
          <DetailFact label="Último acceso" value={member.lastLoginLabel} />
        </dl>
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)]">
          {member.provenanceLabel} · {member.rolesLabel}
        </p>
      </section>

      <section className="border-t border-[color:color-mix(in_srgb,var(--border)_72%,white)] pt-5" aria-labelledby="member-coverage-heading">
        <SectionHeading icon={ShieldCheck} eyebrow="Cobertura comercial" title="Membresías y créditos" id="member-coverage-heading" />
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <div className="space-y-3">
            {member.memberships.length > 0 ? member.memberships.map((membership) => (
              <article key={membership.id} className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_4%,white)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--wellstudio-ink)]">{membership.planName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{membership.windowLabel}</p>
                  </div>
                  <SmallStatus label={membership.statusLabel} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[color:color-mix(in_srgb,var(--foreground)_64%,white)]">
                  <span>{membership.renewalLabel}</span><span>{membership.providerLabel}</span>
                  <span>{membership.usageCount} usos</span><span>{membership.overrideCount} excepciones</span>
                </div>
              </article>
            )) : <InlineEmpty icon={CreditCard} text="Sin membresías registradas" />}
          </div>
          <div className="space-y-3">
            {member.credits.length > 0 ? member.credits.map((credit) => (
              <article key={credit.id} className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-white/74 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-medium text-[var(--wellstudio-ink)]">{credit.packName}</p><p className="mt-1 text-sm text-muted-foreground">{credit.windowLabel}</p></div>
                  <span className="text-right"><strong className="block text-xl font-medium text-[var(--wellstudio-ink)]">{credit.balance}</strong><span className="text-xs text-muted-foreground">de {credit.total}</span></span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)]">{credit.statusLabel}</p>
              </article>
            )) : <InlineEmpty icon={Coins} text="Sin cuentas de créditos" />}
          </div>
        </div>
      </section>

      <section className="border-t border-[color:color-mix(in_srgb,var(--border)_72%,white)] pt-5" aria-labelledby="member-activity-heading">
        <SectionHeading icon={CalendarCheck} eyebrow="Actividad" title="Reservas y lista de espera" id="member-activity-heading" />
        <div className="mt-3 space-y-3">
          {member.reservations.length > 0 ? member.reservations.map((reservation) => (
            <Link key={reservation.id} href={`/admin/sessions?session=${encodeURIComponent(reservation.sessionId)}`} className="group flex items-start gap-3 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-white/72 p-3.5 transition-colors hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]"><CalendarDays className="size-4" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium text-[var(--wellstudio-ink)]">{reservation.className}</p><SmallStatus label={reservation.statusLabel} /></div><p className="mt-1 text-sm text-muted-foreground">{reservation.scheduleLabel}</p><p className="mt-1 truncate text-xs text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]">{reservation.contextLabel} · {reservation.sourceLabel}</p></div>
              <ExternalLink className="mt-1 size-3.5 shrink-0 text-[var(--wellstudio-blue-deep)] opacity-65 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </Link>
          )) : <InlineEmpty icon={CalendarDays} text="Sin reservas recientes" />}

          {member.activeWaitlist.map((entry) => (
            <Link key={entry.id} href={`/admin/sessions?session=${encodeURIComponent(entry.sessionId)}`} className="flex items-start gap-3 rounded-[1.15rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_22%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_3%,white)] p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />
              <div className="min-w-0"><p className="font-medium text-[var(--wellstudio-ink)]">{entry.className} · {entry.statusLabel}</p><p className="mt-1 text-sm text-muted-foreground">{entry.scheduleLabel} · {entry.positionLabel}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-5 border-t border-[color:color-mix(in_srgb,var(--border)_72%,white)] pt-5 xl:grid-cols-2">
        <section aria-labelledby="member-payments-heading">
          <SectionHeading icon={BadgeEuro} eyebrow="Comercial" title="Pagos recientes" id="member-payments-heading" />
          <div className="mt-3 space-y-2">
            {member.payments.length > 0 ? member.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 rounded-[1rem] border border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-white/70 p-3">
                <div><p className="font-medium text-[var(--wellstudio-ink)]">{payment.typeLabel}</p><p className="mt-1 text-xs text-muted-foreground">{payment.dateLabel} · {payment.statusLabel}</p></div>
                <strong className="shrink-0 font-medium text-[var(--wellstudio-ink)]">{payment.amountLabel}</strong>
              </div>
            )) : <InlineEmpty icon={BadgeEuro} text="Sin pagos registrados" />}
          </div>
        </section>

        <section aria-labelledby="member-notes-heading">
          <SectionHeading icon={MessageSquareText} eyebrow="Contexto interno" title="Notas recientes" id="member-notes-heading" />
          <div className="mt-3 space-y-2">
            {member.notes.length > 0 ? member.notes.map((note) => (
              <article key={note.id} className="rounded-[1rem] border border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-white/70 p-3">
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--wellstudio-ink)]">{note.body}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">{note.createdAtLabel} · {note.visibilityLabel}</p>
              </article>
            )) : <InlineEmpty icon={MessageSquareText} text="Sin notas internas" />}
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionHeading({ icon: Icon, eyebrow, title, id }: { icon: typeof UsersRound; eyebrow: string; title: string; id: string }) {
  return <div className="flex items-center gap-3"><span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]"><Icon className="size-4" aria-hidden="true" /></span><div><p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">{eyebrow}</p><h3 id={id} className="mt-0.5 text-xl font-medium text-[var(--wellstudio-ink)]">{title}</h3></div></div>
}

function DetailFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[1rem] border border-[color:color-mix(in_srgb,var(--border)_72%,white)] bg-white/72 p-3"><dt className="text-xs uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)]">{label}</dt><dd className="mt-1 break-words text-sm font-medium leading-6 text-[var(--wellstudio-ink)]">{value}</dd></div>
}

function InlineEmpty({ icon: Icon, text }: { icon: typeof CreditCard; text: string }) {
  return <div className="flex items-center gap-3 rounded-[1rem] border border-dashed border-[color:color-mix(in_srgb,var(--border)_76%,white)] p-4 text-sm text-muted-foreground"><Icon className="size-4 shrink-0 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />{text}</div>
}

function SmallStatus({ label }: { label: string }) {
  return <span className="inline-flex shrink-0 rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] bg-white/74 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--wellstudio-blue-deep)]">{label}</span>
}

function MemberStatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={cn('inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.15em]', status === 'ACTIVE' && 'border-[color:color-mix(in_srgb,#5ba774_28%,white)] bg-[color:color-mix(in_srgb,#5ba774_10%,white)] text-[#3f7d57]', status === 'BLOCKED' && 'border-[color:color-mix(in_srgb,var(--destructive)_24%,white)] bg-[color:color-mix(in_srgb,var(--destructive)_8%,white)] text-destructive', status !== 'ACTIVE' && status !== 'BLOCKED' && 'border-[color:color-mix(in_srgb,var(--border)_78%,white)] bg-white/78 text-[color:color-mix(in_srgb,var(--foreground)_58%,white)]')}>{label}</span>
}

function MembersEmptyState({ query }: { query: string }) {
  return <div className="flex min-h-72 items-center justify-center px-5 py-10 text-center"><div className="max-w-sm"><span className="mx-auto inline-flex size-11 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]">{query ? <Search className="size-5" aria-hidden="true" /> : <UsersRound className="size-5" aria-hidden="true" />}</span><h3 className="mt-4 text-lg font-medium text-[var(--wellstudio-ink)]">{query ? 'No encontramos ese socio' : 'No hay socios en este estado'}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{query ? 'Prueba con otro nombre, email o teléfono.' : 'Cambia de filtro para revisar el resto del directorio.'}</p></div></div>
}

function MemberDetailEmptyState() {
  return <div className="flex min-h-[42rem] items-center justify-center rounded-[1.2rem] border border-dashed border-[color:color-mix(in_srgb,var(--border)_76%,white)] px-6 text-center"><div className="max-w-md"><span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]"><UserRoundCheck className="size-5" aria-hidden="true" /></span><h2 id="admin-member-detail-title" className="mt-4 text-2xl font-medium text-[var(--wellstudio-ink)]">Selecciona un socio</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Aquí aparecerán su cuenta, membresías, créditos y actividad reciente. La ficha es informativa y enlaza con los flujos operativos existentes.</p></div></div>
}

export function AdminMembersDashboardSkeleton() {
  return <div className="grid gap-4 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.55fr)]"><div className="overflow-hidden rounded-[1.65rem] border border-border/60 bg-white/72"><div className="space-y-4 border-b border-border/60 p-5"><div className="flex gap-3"><div className="size-11 rounded-full bg-border/60" /><div className="space-y-2"><div className="h-3 w-32 rounded-full bg-border/70" /><div className="h-7 w-24 rounded-full bg-border/60" /></div></div><div className="h-11 rounded-full bg-border/50" /><div className="flex gap-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-8 w-20 rounded-full bg-border/50" />)}</div></div>{Array.from({ length: 7 }).map((_, index) => <div key={index} className="space-y-3 border-b border-border/50 p-5"><div className="h-4 w-40 rounded-full bg-border/60" /><div className="h-3 w-52 max-w-full rounded-full bg-border/50" /><div className="h-3 w-32 rounded-full bg-border/40" /></div>)}</div><div className="hidden min-h-[46rem] rounded-[1.65rem] border border-border/60 bg-white/72 p-5 lg:block"><div className="flex gap-4"><div className="size-12 rounded-2xl bg-border/60" /><div className="space-y-3"><div className="h-3 w-28 rounded-full bg-border/60" /><div className="h-8 w-56 rounded-full bg-border/60" /></div></div><div className="mt-8 grid gap-3 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-20 rounded-2xl bg-border/45" />)}</div></div></div>
}

function buildMembersHref(input: { query: string; status: AdminMemberStatusFilter; memberId?: string }) {
  const params = new URLSearchParams()
  if (input.query.trim()) params.set('q', input.query.trim())
  if (input.status !== 'active') params.set('status', input.status)
  if (input.memberId) params.set('member', input.memberId)
  const query = params.toString()
  return query ? `/admin/members?${query}` : '/admin/members'
}
