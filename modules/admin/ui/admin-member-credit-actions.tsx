'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowDown, ArrowUp, Coins, PlusCircle, WalletCards } from 'lucide-react'

import {
  manageMemberCreditsAction,
  type AdminCreditActionState,
} from '@/app/(admin)/admin/members/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import type {
  AdminCreditPackOption,
  AdminMemberDetail,
} from '@/modules/admin/server/admin-members-overview'
import { cn } from '@/lib/utils'

type CreditAccount = AdminMemberDetail['credits'][number]
type CreditMode = 'adjust' | 'open'
type CreditDirection = 'ADD' | 'REMOVE'

export function AdminManageCreditsAction({
  member,
  creditPacks,
  returnTo,
}: {
  member: AdminMemberDetail
  creditPacks: AdminCreditPackOption[]
  returnTo: string
}) {
  const [open, setOpen] = useState(false)
  const operableAccounts = member.credits.filter((account) => account.canAdjustManually)
  const operablePackIds = new Set(operableAccounts.map((account) => account.creditPackId))
  const availablePacks = creditPacks.filter((pack) => !operablePackIds.has(pack.id))
  const disabled = operableAccounts.length === 0 && availablePacks.length === 0

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Coins className="size-4" aria-hidden="true" />
        Gestionar créditos
      </Button>
      <ManageCreditsDialog
        key={`${member.id}:${open ? 'open' : 'closed'}`}
        open={open}
        onOpenChange={setOpen}
        member={member}
        operableAccounts={operableAccounts}
        creditPacks={availablePacks}
        returnTo={returnTo}
      />
    </>
  )
}

function ManageCreditsDialog({
  open,
  onOpenChange,
  member,
  operableAccounts,
  creditPacks,
  returnTo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: AdminMemberDetail
  operableAccounts: CreditAccount[]
  creditPacks: AdminCreditPackOption[]
  returnTo: string
}) {
  const [state, action] = useActionState<AdminCreditActionState, FormData>(
    manageMemberCreditsAction,
    null,
  )
  const [mode, setMode] = useState<CreditMode>(operableAccounts.length > 0 ? 'adjust' : 'open')
  const [selectedAccountId, setSelectedAccountId] = useState(operableAccounts[0]?.id ?? '')
  const [selectedPackId, setSelectedPackId] = useState(creditPacks[0]?.id ?? '')
  const [direction, setDirection] = useState<CreditDirection>('ADD')
  const [amount, setAmount] = useState(String(creditPacks[0]?.creditsTotal ?? 1))

  function selectMode(nextMode: CreditMode) {
    setMode(nextMode)
    setAmount(nextMode === 'open' ? String(selectedPack(creditPacks, selectedPackId)?.creditsTotal ?? 1) : '1')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,54rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden max-sm:!left-0 max-sm:!top-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:!w-[100dvw] max-sm:!max-w-[100dvw] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0 sm:max-w-3xl">
        <DialogHeader>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
            Créditos · Operación auditada
          </p>
          <DialogTitle className="text-2xl">Gestionar créditos de {member.displayName}</DialogTitle>
          <DialogDescription>
            Ajusta un saldo existente o abre una cuenta interna. Esta operación no crea ningún cobro.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex min-h-0 flex-col overflow-hidden">
          <input type="hidden" name="memberId" value={member.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="operation" value={mode} />

          <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-1 rounded-full border border-border/70 bg-white/70 p-1" aria-label="Tipo de operación">
              <ModeButton
                active={mode === 'adjust'}
                disabled={operableAccounts.length === 0}
                onClick={() => selectMode('adjust')}
                icon={WalletCards}
              >
                Ajustar saldo
              </ModeButton>
              <ModeButton
                active={mode === 'open'}
                disabled={creditPacks.length === 0}
                onClick={() => selectMode('open')}
                icon={PlusCircle}
              >
                Abrir cuenta
              </ModeButton>
            </div>

            {mode === 'adjust' ? (
              <AdjustCreditFields
                accounts={operableAccounts}
                selectedAccountId={selectedAccountId}
                onSelectAccount={setSelectedAccountId}
                direction={direction}
                onDirectionChange={setDirection}
                amount={amount}
                onAmountChange={setAmount}
                state={state}
              />
            ) : (
              <OpenCreditAccountFields
                packs={creditPacks}
                selectedPackId={selectedPackId}
                onSelectPack={(pack) => {
                  setSelectedPackId(pack.id)
                  setAmount(String(pack.creditsTotal))
                }}
                amount={amount}
                onAmountChange={setAmount}
                state={state}
              />
            )}

            <div>
              <label htmlFor="credit-operation-reason" className="text-sm font-medium text-[var(--wellstudio-ink)]">
                Motivo
              </label>
              <textarea
                id="credit-operation-reason"
                name="reason"
                required
                minLength={5}
                maxLength={240}
                rows={3}
                placeholder="Ej. cortesía autorizada o corrección de una incidencia…"
                className="mt-2 w-full resize-none rounded-[1.1rem] border border-input bg-white/86 px-4 py-3 text-sm leading-6 outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
              />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                El delta, el saldo resultante, el motivo y el operador quedarán registrados.
              </p>
              {state?.field === 'reason' ? <FieldError>{state.message}</FieldError> : null}
            </div>

            <div className="rounded-[1rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] p-3.5 text-sm leading-6 text-[var(--wellstudio-ink)]">
              <strong className="font-medium">Sin movimiento de dinero.</strong>{' '}
              El ledger cambia, pero no se crea un pago ni una compra ficticia.
            </div>

            {state?.message && !state.field ? <FieldError>{state.message}</FieldError> : null}
          </div>

          <DialogFooter className="mt-4 shrink-0 flex-col border-t border-border/70 pt-4 sm:flex-row">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <CreditSubmitButton mode={mode} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AdjustCreditFields({
  accounts,
  selectedAccountId,
  onSelectAccount,
  direction,
  onDirectionChange,
  amount,
  onAmountChange,
  state,
}: {
  accounts: CreditAccount[]
  selectedAccountId: string
  onSelectAccount: (id: string) => void
  direction: CreditDirection
  onDirectionChange: (direction: CreditDirection) => void
  amount: string
  onAmountChange: (amount: string) => void
  state: AdminCreditActionState
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,1.12fr)_minmax(15rem,0.88fr)] sm:items-start">
      <fieldset>
        <legend className="text-sm font-medium text-[var(--wellstudio-ink)]">Cuenta vigente</legend>
        <div className="mt-2 grid gap-2">
          {accounts.map((account) => {
            const selected = selectedAccountId === account.id
            return (
              <label key={account.id} className={optionCardClassName(selected)}>
                <input
                  type="radio"
                  name="creditAccountId"
                  value={account.id}
                  checked={selected}
                  onChange={() => onSelectAccount(account.id)}
                  className="sr-only"
                />
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <strong className="block font-medium text-[var(--wellstudio-ink)]">{account.packName}</strong>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{account.windowLabel}</span>
                  </span>
                  <span className="text-right">
                    <strong className="block text-2xl font-medium text-[var(--wellstudio-ink)]">{account.balance}</strong>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">saldo</span>
                  </span>
                </span>
                <span className="mt-3 block text-xs leading-5 text-muted-foreground">{account.lastMovementLabel}</span>
              </label>
            )
          })}
        </div>
        {state?.field === 'creditAccountId' ? <FieldError>{state.message}</FieldError> : null}
      </fieldset>

      <div className="space-y-4 rounded-[1.15rem] border border-border/70 bg-white/58 p-4">
        <fieldset>
          <legend className="text-sm font-medium text-[var(--wellstudio-ink)]">Movimiento</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <DirectionButton active={direction === 'ADD'} onClick={() => onDirectionChange('ADD')} icon={ArrowUp}>
              Añadir
            </DirectionButton>
            <DirectionButton active={direction === 'REMOVE'} onClick={() => onDirectionChange('REMOVE')} icon={ArrowDown}>
              Retirar
            </DirectionButton>
          </div>
          <input type="hidden" name="direction" value={direction} />
          {state?.field === 'direction' ? <FieldError>{state.message}</FieldError> : null}
        </fieldset>

        <AmountField value={amount} onChange={onAmountChange} error={state?.field === 'amount' ? state.message : null} />
      </div>
    </div>
  )
}

function OpenCreditAccountFields({
  packs,
  selectedPackId,
  onSelectPack,
  amount,
  onAmountChange,
  state,
}: {
  packs: AdminCreditPackOption[]
  selectedPackId: string
  onSelectPack: (pack: AdminCreditPackOption) => void
  amount: string
  onAmountChange: (amount: string) => void
  state: AdminCreditActionState
}) {
  return (
    <>
      <fieldset>
        <legend className="text-sm font-medium text-[var(--wellstudio-ink)]">Bono de referencia</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {packs.map((pack) => {
            const selected = selectedPackId === pack.id
            return (
              <label key={pack.id} className={optionCardClassName(selected)}>
                <input
                  type="radio"
                  name="creditPackId"
                  value={pack.id}
                  checked={selected}
                  onChange={() => onSelectPack(pack)}
                  className="sr-only"
                />
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <strong className="block font-medium text-[var(--wellstudio-ink)]">{pack.name}</strong>
                    <span className="mt-1 block text-sm text-muted-foreground">{pack.creditsTotal} créditos · {pack.expiryLabel}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-border/70 bg-white/80 px-2.5 py-1 text-xs text-[var(--wellstudio-blue-deep)]">
                    {pack.priceLabel}
                  </span>
                </span>
                {pack.description ? <span className="mt-3 block text-xs leading-5 text-muted-foreground">{pack.description}</span> : null}
              </label>
            )
          })}
        </div>
        {state?.field === 'creditPackId' ? <FieldError>{state.message}</FieldError> : null}
      </fieldset>

      <AmountField
        value={amount}
        onChange={onAmountChange}
        label="Créditos iniciales"
        helper="Puedes conceder una cantidad distinta al tamaño comercial del bono; quedará identificada como apertura manual."
        error={state?.field === 'amount' ? state.message : null}
      />
    </>
  )
}

function AmountField({
  value,
  onChange,
  label = 'Cantidad',
  helper = 'Usa un entero positivo. El saldo nunca puede quedar por debajo de cero.',
  error,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  helper?: string
  error: string | null
}) {
  return (
    <div>
      <label htmlFor="credit-operation-amount" className="text-sm font-medium text-[var(--wellstudio-ink)]">{label}</label>
      <input
        id="credit-operation-amount"
        name="amount"
        type="number"
        required
        min={1}
        max={1000}
        step={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-full border border-input bg-white/86 px-4 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 sm:max-w-48"
      />
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  )
}

function ModeButton({
  active,
  disabled,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  icon: typeof WalletCards
  children: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-[background-color,color,box-shadow] disabled:cursor-not-allowed disabled:opacity-40',
        active
          ? 'bg-[var(--wellstudio-blue)] text-white shadow-[0_8px_18px_rgba(61,128,194,0.22)]'
          : 'text-muted-foreground hover:bg-white',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </button>
  )
}

function DirectionButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof ArrowUp
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] border px-4 text-sm font-medium transition-[border-color,background-color,box-shadow]',
        active
          ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_42%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-ink)] shadow-[0_8px_18px_rgba(20,24,30,0.05)]'
          : 'border-border/70 bg-white/70 text-muted-foreground hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_24%,white)]',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </button>
  )
}

function CreditSubmitButton({ mode }: { mode: CreditMode }) {
  const { pending } = useFormStatus()
  const label = mode === 'open' ? 'Abrir cuenta de créditos' : 'Registrar ajuste'
  return (
    <Button type="submit" className="rounded-full" disabled={pending}>
      {pending ? <><Spinner data-icon="inline-start" />Guardando…</> : label}
    </Button>
  )
}

function FieldError({ children }: { children: string }) {
  return <p role="alert" className="mt-2 text-sm leading-5 text-destructive">{children}</p>
}

function optionCardClassName(selected: boolean) {
  return cn(
    'cursor-pointer rounded-[1.15rem] border p-4 transition-[border-color,background-color,box-shadow] duration-200',
    selected
      ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_52%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_7%,white)] shadow-[0_10px_24px_rgba(20,24,30,0.06)]'
      : 'border-border/70 bg-white/72 hover:border-[color:color-mix(in_srgb,var(--wellstudio-blue)_28%,white)]',
  )
}

function selectedPack(packs: AdminCreditPackOption[], id: string) {
  return packs.find((pack) => pack.id === id)
}
