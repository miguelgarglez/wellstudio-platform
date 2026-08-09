'use client'

import { useActionState, useState } from 'react'
import { ArrowRight, CalendarRange, LoaderCircle, ShieldCheck, Ticket } from 'lucide-react'

import {
  startCreditPackCheckoutAction,
  type StartCreditPackCheckoutActionState,
} from '@/app/(member)/app/account/actions'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { MemberPurchasableCreditPack } from '@/modules/members/server/member-account-overview'

export function MemberCreditPackPurchase({
  packs,
  initiallySelectedId,
}: {
  packs: MemberPurchasableCreditPack[]
  initiallySelectedId: string | null
}) {
  const [selectedId, setSelectedId] = useState(initiallySelectedId)
  const [open, setOpen] = useState(Boolean(initiallySelectedId))
  const selectedPack = packs.find((pack) => pack.id === selectedId) ?? null

  if (packs.length === 0) {
    return (
      <p className="rounded-[1.35rem] border border-dashed border-border px-5 py-7 text-sm leading-7 text-muted-foreground">
        Ahora mismo no hay bonos publicados para compra online.
      </p>
    )
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {packs.map((pack) => (
          <button
            key={pack.id}
            type="button"
            className="group flex min-w-0 cursor-pointer items-center justify-between gap-5 rounded-[1.45rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,var(--border))] bg-[color:color-mix(in_srgb,var(--card)_74%,white)] p-5 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_30%,var(--border))] hover:bg-white hover:shadow-[0_18px_42px_rgba(18,20,24,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)] motion-reduce:transform-none"
            onClick={() => {
              setSelectedId(pack.id)
              setOpen(true)
            }}
          >
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">{pack.creditsLabel}</span>
              <span className="mt-2 block truncate text-base font-medium text-[var(--wellstudio-ink)]">{pack.name}</span>
              <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><CalendarRange className="size-3.5" aria-hidden="true" />{pack.validityLabel}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-display text-3xl uppercase leading-none">{pack.priceLabel}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--wellstudio-blue-deep)]">Comprar <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
            </span>
          </button>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        {selectedPack ? <CreditPackCheckoutSheet pack={selectedPack} onClose={() => setOpen(false)} /> : null}
      </Sheet>
    </>
  )
}

function CreditPackCheckoutSheet({ pack, onClose }: { pack: MemberPurchasableCreditPack; onClose: () => void }) {
  const [state, action, pending] = useActionState<StartCreditPackCheckoutActionState, FormData>(
    startCreditPackCheckoutAction,
    null,
  )

  return (
    <SheetContent side="right" className="w-full gap-0 overflow-hidden rounded-none border-border/80 bg-[color:color-mix(in_srgb,var(--background)_95%,white)] p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[34rem]">
      <SheetHeader className="border-b border-border/70 px-5 py-6 pr-14 sm:px-7 sm:py-7 sm:pr-14">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">Compra puntual</p>
        <SheetTitle className="text-2xl tracking-[-0.035em]">{pack.name}</SheetTitle>
        <SheetDescription>Revisa el bono antes de continuar al checkout seguro.</SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
        <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,var(--border))] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] p-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">Incluye</p>
              <p className="mt-2 text-xl font-medium">{pack.creditsLabel}</p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)] shadow-sm"><Ticket className="size-4" aria-hidden="true" /></span>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{pack.description ?? 'Reservas para consumir con flexibilidad desde tu cuenta.'}</p>
          <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-5">
            <span className="text-sm text-muted-foreground">{pack.validityLabel}</span>
            <span className="font-display text-4xl uppercase">{pack.priceLabel}</span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-white/70 p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--wellstudio-blue-deep)]" aria-hidden="true" />
          <p className="text-sm leading-6 text-muted-foreground">El precio se valida en el servidor. Los créditos solo se activan cuando el proveedor confirma el pago.</p>
        </div>

        {state?.success === false ? (
          <p role="alert" className="rounded-[1.15rem] border border-destructive/18 bg-destructive/6 px-4 py-3 text-sm leading-6 text-destructive">{state.message}</p>
        ) : null}
      </div>

      <SheetFooter className="grid gap-3 border-t border-border/70 bg-white/78 px-5 py-5 sm:grid-cols-[auto_1fr] sm:px-7">
        <Button type="button" variant="outline" className="rounded-full" onClick={onClose} disabled={pending}>Volver</Button>
        <form action={action}>
          <input type="hidden" name="creditPackId" value={pack.id} />
          <Button type="submit" className="w-full rounded-full" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
            {pending ? 'Preparando checkout…' : `Continuar · ${pack.priceLabel}`}
          </Button>
        </form>
      </SheetFooter>
    </SheetContent>
  )
}
