import { notFound, redirect } from 'next/navigation'
import { Check, LockKeyhole, Ticket, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { requireAuthenticatedContext } from '@/modules/auth/server/identity'
import { getSandboxCheckoutOverview } from '@/modules/payments/server/sandbox-checkout'

export default async function SandboxCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>
}) {
  const context = await requireAuthenticatedContext()
  const { payment: paymentId } = await searchParams
  if (!context.member || !paymentId) notFound()

  const checkout = await getSandboxCheckoutOverview({ paymentId, memberId: context.member.id })
  if (!checkout) notFound()
  if (checkout.status === 'SUCCEEDED') redirect(`/app/account?checkout=success&payment=${paymentId}`)

  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--wellstudio-blue)_16%,transparent),transparent_38%),var(--background)] sm:px-4 sm:py-10">
      <section className="flex max-h-dvh min-h-dvh w-full max-w-xl flex-col overflow-hidden border border-white/80 bg-white/90 shadow-[0_30px_100px_rgba(17,19,22,0.14)] backdrop-blur sm:max-h-[calc(100dvh-2rem)] sm:min-h-0 sm:rounded-[2rem]">
        <header className="border-b border-border/70 px-6 py-6 sm:px-8">
          <div className="flex items-center gap-3 text-[var(--wellstudio-blue-deep)]">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)]"><LockKeyhole className="size-4" aria-hidden="true" /></span>
            <p className="text-xs uppercase tracking-[0.22em]">Checkout de prueba</p>
          </div>
          <h1 className="mt-5 font-display text-5xl uppercase leading-none text-[var(--wellstudio-ink)]">Confirma tu bono</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Este entorno simula la confirmación del proveedor. No se solicita tarjeta ni se realiza ningún cobro real.</p>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] p-5">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">Bono seleccionado</p>
                <h2 className="mt-2 text-xl font-medium">{checkout.packName}</h2>
              </div>
              <Ticket className="size-5 shrink-0 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />
            </div>
            {checkout.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{checkout.description}</p> : null}
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border/70 pt-5 text-sm">
              <div><dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Incluye</dt><dd className="mt-1 font-medium">{checkout.creditsLabel}</dd></div>
              <div><dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Vigencia</dt><dd className="mt-1 font-medium">{checkout.validityLabel}</dd></div>
            </dl>
          </div>
          <div className="flex items-end justify-between border-t border-border/70 pt-5">
            <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p><p className="mt-1 text-sm text-muted-foreground">Pago único</p></div>
            <p className="font-display text-4xl uppercase">{checkout.amountLabel}</p>
          </div>
        </div>

        <footer className="grid shrink-0 gap-3 border-t border-border/70 bg-[color:color-mix(in_srgb,var(--card)_70%,white)] px-6 py-5 sm:grid-cols-[auto_1fr] sm:px-8">
          <form action="/checkout/sandbox/cancel" method="post">
            <input type="hidden" name="paymentId" value={checkout.paymentId} />
            <Button type="submit" variant="outline" className="w-full rounded-full sm:w-auto"><X aria-hidden="true" />Cancelar</Button>
          </form>
          <form action="/checkout/sandbox/confirm" method="post">
            <input type="hidden" name="paymentId" value={checkout.paymentId} />
            <Button type="submit" className="w-full rounded-full"><Check aria-hidden="true" />Confirmar pago de prueba</Button>
          </form>
        </footer>
      </section>
    </main>
  )
}
