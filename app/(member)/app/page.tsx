import { LogoutButton } from '@/modules/auth/ui/logout-button'

export default function MemberAppPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(107,167,228,0.12),_transparent_36%),linear-gradient(180deg,#0d1014_0%,#171c24_100%)] px-6 py-8 text-white">
      <section className="mx-auto flex max-w-5xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-[0_32px_120px_rgba(7,10,14,0.3)] backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-soft)]">
              Área privada
            </p>
            <h1 className="font-display text-4xl uppercase tracking-[0.04em] text-white">
              Member App
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/74 sm:text-base">
              Este shell ya está detrás de auth real. El siguiente bloque funcional
              crecerá aquí sobre reservas, suscripciones y seguimiento del socio.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--wellstudio-blue-soft)]">
              Estado
            </h2>
            <p className="mt-4 text-lg font-medium text-white">
              Sesión protegida activa
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--wellstudio-blue-soft)]">
              Cobertura auth
            </h2>
            <p className="mt-4 text-lg font-medium text-white">
              Login real + logout sandbox
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--wellstudio-blue-soft)]">
              Siguiente capa
            </h2>
            <p className="mt-4 text-lg font-medium text-white">
              Dashboard del socio y agenda
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
