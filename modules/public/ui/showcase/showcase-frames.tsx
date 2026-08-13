import { cn } from '@/lib/utils'

type ShowcaseFrameProps = {
  variant: 'public' | 'member' | 'staff' | 'payments'
  className?: string
}

export function ShowcaseFrame({ variant, className }: ShowcaseFrameProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.6rem] border border-white/14 bg-[color:color-mix(in_srgb,var(--wellstudio-ink)_92%,#1a2430)] shadow-[0_28px_80px_rgba(0,0,0,0.45)]',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/25" />
        <span className="size-2.5 rounded-full bg-white/18" />
        <span className="size-2.5 rounded-full bg-white/12" />
        <span className="ml-3 text-[0.65rem] uppercase tracking-[0.18em] text-white/45">
          {chromeLabel(variant)}
        </span>
      </div>
      <div className="p-4 sm:p-5">{renderBody(variant)}</div>
    </div>
  )
}

function chromeLabel(variant: ShowcaseFrameProps['variant']) {
  switch (variant) {
    case 'public':
      return 'wellstudio · agenda'
    case 'member':
      return 'app · reservas'
    case 'staff':
      return 'admin · hoy'
    case 'payments':
      return 'cuenta · bonos'
  }
}

function renderBody(variant: ShowcaseFrameProps['variant']) {
  if (variant === 'public') {
    return (
      <div className="space-y-3">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--wellstudio-blue-soft)]">
          Esta semana
        </p>
        {[
          ['Fuerza Premium', '07:30 · 3/4'],
          ['Dinámico', '18:00 · 6/10'],
          ['Fuerza Premium', '19:15 · 2/4'],
        ].map(([title, meta]) => (
          <div
            key={`${title}-${meta}`}
            className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.04] px-3.5 py-3"
          >
            <span className="text-sm font-medium text-white">{title}</span>
            <span className="text-xs text-white/55">{meta}</span>
          </div>
        ))}
        <div className="rounded-[1rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,transparent)] px-3.5 py-3">
          <p className="text-xs font-medium text-[var(--wellstudio-blue-soft)]">Lead capturado</p>
          <p className="mt-1 text-sm text-white/80">Te llamamos para orientarte</p>
        </div>
      </div>
    )
  }

  if (variant === 'member') {
    return (
      <div className="space-y-3">
        <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-3.5 py-3">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/45">Tu cobertura</p>
          <p className="mt-1 text-lg font-medium text-white">Plan mensual · activa</p>
        </div>
        <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-3.5 py-3">
          <p className="text-sm text-white">Fuerza Premium · mañana 07:30</p>
          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-[var(--wellstudio-blue)] px-3 py-1 text-xs font-medium text-[var(--wellstudio-ink)]">
              Reservada
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
              Cancelar
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'staff') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            ['8', 'Sesiones'],
            ['41', 'Reservas'],
            ['2', 'Leads'],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 py-3 text-center"
            >
              <p className="font-display text-2xl text-white">{value}</p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-white/45">
                {label}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-3.5 py-3">
          <p className="text-sm font-medium text-white">Reserva asistida</p>
          <p className="mt-1 text-xs leading-5 text-white/60">
            Misma elegibilidad que el socio. Sin atajos silenciosos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-3.5 py-3">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/45">Saldo</p>
        <p className="mt-1 font-display text-3xl text-white">6 créditos</p>
      </div>
      <div className="rounded-[1rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,transparent)] px-3.5 py-3">
        <p className="text-sm font-medium text-white">Bono 6 sesiones</p>
        <p className="mt-1 text-xs text-white/65">Checkout Stripe · activación automática</p>
      </div>
    </div>
  )
}
