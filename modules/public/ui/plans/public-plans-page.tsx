import Link from 'next/link'
import { ArrowRight, CalendarRange, Check, CircleHelp, Repeat2, Ticket } from 'lucide-react'

import type {
  PublicCreditPack,
  PublicMembershipPlan,
  PublicProductCatalog,
} from '@/modules/public/server/public-product-catalog'
import { PublicContentShell } from '@/modules/public/ui/public-content-shell'

export function PublicPlansPage({ catalog }: { catalog: PublicProductCatalog }) {
  return (
    <PublicContentShell>
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <header className="grid gap-8 border-b border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,var(--border))] pb-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.55fr)] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Planes y bonos</p>
            <h1 className="mt-4 max-w-4xl text-balance font-display text-[3.45rem] uppercase leading-[0.9] tracking-[0.025em] text-[var(--wellstudio-ink)] sm:text-[5rem] lg:text-[6.3rem]">
              Entrena con el ritmo que necesitas
            </h1>
          </div>
          <div className="max-w-md lg:justify-self-end">
            <p className="text-base leading-8 text-muted-foreground">
              Elige continuidad con un plan o flexibilidad con un bono. Te ayudamos a confirmar la opción adecuada antes de activarla.
            </p>
            {catalog.productCount ? (
              <p className="mt-4 text-sm font-medium text-[var(--wellstudio-blue-deep)]">
                {catalog.productCount} {catalog.productCount === 1 ? 'opción pública' : 'opciones públicas'} disponibles
              </p>
            ) : null}
          </div>
        </header>

        {catalog.productCount ? (
          <>
            <ProductSection
              eyebrow="Continuidad"
              title="Planes"
              description="Una frecuencia estable para convertir el entrenamiento en rutina."
              icon={Repeat2}
            >
              {catalog.plans.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {catalog.plans.map((plan) => <MembershipPlanCard key={plan.id} plan={plan} />)}
                </div>
              ) : (
                <InlineEmptyState>Ahora mismo no hay planes recurrentes publicados.</InlineEmptyState>
              )}
            </ProductSection>

            <section className="mt-12 overflow-hidden rounded-[2rem] bg-[var(--wellstudio-ink)] px-5 py-7 text-white shadow-[0_28px_80px_rgba(17,19,22,0.14)] sm:px-8 sm:py-9 lg:px-10">
              <header className="grid gap-4 border-b border-white/12 pb-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.6fr)] lg:items-end">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-soft)]">Flexibilidad</p>
                  <h2 className="mt-3 font-display text-5xl uppercase leading-none sm:text-6xl">Bonos de sesiones</h2>
                </div>
                <p className="text-sm leading-7 text-white/62">Reservas disponibles para consumir a tu ritmo, con vigencia visible desde el principio.</p>
              </header>
              {catalog.creditPacks.length ? (
                <div className="mt-3 divide-y divide-white/12">
                  {catalog.creditPacks.map((pack) => <CreditPackRow key={pack.id} pack={pack} />)}
                </div>
              ) : (
                <p className="mt-7 rounded-[1.25rem] border border-dashed border-white/18 px-5 py-6 text-sm text-white/62">Ahora mismo no hay bonos publicados.</p>
              )}
            </section>
          </>
        ) : (
          <CatalogEmptyState />
        )}

        <section className="mt-12 grid gap-6 border-t border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,var(--border))] pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Dos formas de empezar</p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">Flexibilidad o continuidad</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Compra un bono puntual desde tu cuenta o habla con el equipo para elegir y activar un plan recurrente.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/app/account" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--wellstudio-blue)] px-6 text-sm font-medium text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[var(--wellstudio-blue-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)] focus-visible:ring-offset-2">
              Comprar un bono <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/#contacto" className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-white/55 px-6 text-sm font-medium transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)]">
              Consultar un plan
            </Link>
          </div>
        </section>
      </div>
    </PublicContentShell>
  )
}

function ProductSection({ eyebrow, title, description, icon: Icon, children }: {
  eyebrow: string
  title: string
  description: string
  icon: typeof Repeat2
  children: React.ReactNode
}) {
  return (
    <section className="mt-12" aria-labelledby={`product-section-${title.toLowerCase()}`}>
      <header className="mb-6 flex items-start gap-4">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]"><Icon className="size-5" aria-hidden="true" /></span>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">{eyebrow}</p>
          <h2 id={`product-section-${title.toLowerCase()}`} className="mt-1 font-display text-5xl uppercase leading-none">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

function MembershipPlanCard({ plan }: { plan: PublicMembershipPlan }) {
  return (
    <article className="group flex min-h-72 flex-col rounded-[1.65rem] border border-white/80 bg-white/72 p-6 shadow-[0_20px_58px_rgba(17,19,22,0.055)] backdrop-blur transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_26px_68px_rgba(17,19,22,0.09)] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">Plan recurrente</p>
          <h3 className="mt-2 text-xl font-medium text-[var(--wellstudio-ink)]">{plan.name}</h3>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="font-display text-4xl uppercase leading-none text-[var(--wellstudio-ink)]">{plan.priceLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">{plan.billingLabel}</p>
        </div>
      </div>
      <p className="mt-6 min-h-14 text-sm leading-7 text-muted-foreground">{plan.description ?? 'Una frecuencia estable para entrenar con seguimiento y continuidad.'}</p>
      <div className="mt-5 space-y-2 border-t border-border/70 pt-5 text-sm">
        <p className="flex items-center gap-2 font-medium"><Check className="size-4 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />{plan.bookingLabel}</p>
        {plan.supportingLabel ? <p className="flex items-center gap-2 text-muted-foreground"><Check className="size-4 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />{plan.supportingLabel}</p> : null}
      </div>
      <Link href="/#contacto" className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-[var(--wellstudio-blue-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)]">
        Consultar este plan <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </article>
  )
}

function CreditPackRow({ pack }: { pack: PublicCreditPack }) {
  return (
    <article className="group grid gap-5 py-7 first:pt-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <Ticket className="size-5 text-[var(--wellstudio-blue-soft)]" aria-hidden="true" />
          <h3 className="text-xl font-medium">{pack.name}</h3>
          <span className="rounded-full border border-white/14 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/74">{pack.creditsLabel}</span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">{pack.description ?? 'Flexibilidad para reservar sesiones sin una cuota recurrente.'}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-white/72"><CalendarRange className="size-4" aria-hidden="true" />{pack.validityLabel}</p>
      </div>
      <div className="flex items-center justify-between gap-5 sm:justify-end">
        <p className="font-display text-4xl uppercase leading-none">{pack.priceLabel}</p>
        <Link href={`/app/account?pack=${encodeURIComponent(pack.slug)}`} aria-label={`Comprar ${pack.name}`} className="inline-flex size-11 items-center justify-center rounded-full border border-white/16 bg-white/6 transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

function InlineEmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[1.5rem] border border-dashed border-border bg-white/45 px-6 py-8 text-sm text-muted-foreground">{children}</p>
}

function CatalogEmptyState() {
  return (
    <section className="mt-12 grid min-h-96 place-items-center rounded-[1.75rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_20%,var(--border))] bg-white/60 p-8 text-center">
      <div className="max-w-lg">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]"><CircleHelp aria-hidden="true" /></span>
        <h2 className="mt-5 font-display text-4xl uppercase">Estamos preparando las opciones disponibles</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">Todavía no hay planes o bonos publicados. El equipo puede orientarte directamente según tu frecuencia de entrenamiento.</p>
        <Link href="/#contacto" className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[var(--wellstudio-blue)] px-5 text-sm font-medium text-[var(--wellstudio-blue-deep)] hover:bg-white">Contactar con el equipo</Link>
      </div>
    </section>
  )
}
