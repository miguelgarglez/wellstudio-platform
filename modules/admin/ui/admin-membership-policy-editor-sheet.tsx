'use client'

import { useState } from 'react'
import { ArrowRight, Settings2 } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { AdminMembershipPolicyPlanItem } from '@/modules/admin/server/admin-membership-policy-overview'
import { AdminMembershipPolicyForm } from '@/modules/admin/ui/admin-membership-policy-form'

type AdminMembershipPolicyEditorSheetProps = {
  plan: AdminMembershipPolicyPlanItem
}

export function AdminMembershipPolicyEditorSheet({
  plan,
}: AdminMembershipPolicyEditorSheetProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="group block w-full rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--card)_76%,white)] p-4 text-left shadow-[0_14px_30px_rgba(18,20,24,0.055)] transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_30%,white)] hover:bg-white hover:shadow-[0_20px_40px_rgba(18,20,24,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
              <Settings2 className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 space-y-1">
              <span className="block text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
                Operación segura
              </span>
              <span className="block text-lg font-medium text-[var(--wellstudio-ink)]">
                Editar regla de reserva
              </span>
              <span className="block max-w-2xl text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
                Abre un panel dedicado para cambiar la regla que aplicará el motor a este plan.
              </span>
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)] transition-colors duration-200 group-hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)]">
            Editar
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          className="w-full gap-0 overflow-hidden border-[color:color-mix(in_srgb,var(--border)_80%,white)] bg-[color:color-mix(in_srgb,var(--background)_94%,white)] data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:md:w-[min(48rem,calc(100vw-2rem))] data-[side=right]:md:rounded-l-[1.65rem]"
          side="right"
        >
          <SheetHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_76%,white)] p-5 pr-14 sm:p-6 sm:pr-14">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
              Operación admin
            </p>
            <SheetTitle className="text-2xl font-medium text-[var(--wellstudio-ink)]">
              Editar regla de reserva
            </SheetTitle>
            <SheetDescription className="max-w-2xl text-base leading-7">
              Ajusta la regla explícita que leerá el motor de reservas para este membership plan. No afecta a excepciones individuales ni a otros planes.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <div className="mb-5 rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-[var(--wellstudio-ink)]">{plan.name}</p>
                  <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_68%,white)]">
                    {plan.billingSummary}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
                    {plan.policySummaryLabel}
                  </p>
                </div>
                <span className="rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
                  {plan.statusLabel}
                </span>
              </div>
            </div>

            <AdminMembershipPolicyForm plan={plan} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
