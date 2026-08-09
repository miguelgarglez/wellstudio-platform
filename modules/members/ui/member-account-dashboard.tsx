import type { ComponentProps, ReactNode } from 'react'
import {
  CreditCard,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LogoutButton } from '@/modules/auth/ui/logout-button'
import { MemberCardLinking } from '@/modules/members/ui/member-card-linking'
import { MemberCheckoutFeedback } from '@/modules/members/ui/member-checkout-feedback'
import { MemberCreditPackPurchase } from '@/modules/members/ui/member-credit-pack-purchase'
import type {
  MemberAccountAlert,
  MemberAccountOverview,
  MemberPaymentItem,
} from '@/modules/members/server/member-account-overview'
import { cn } from '@/lib/utils'

type MemberAccountDashboardProps = {
  overview: MemberAccountOverview
}

export function MemberAccountDashboard({ overview }: MemberAccountDashboardProps) {
  return (
    <>
      <MemberCheckoutFeedback notice={overview.checkoutNotice} />
      <MemberCheckoutFeedback notice={overview.cardLinkNotice} />
      <MemberAccountDashboardLayout
        summaryTiles={
          <>
            <SummaryTile
              icon={ShieldCheck}
              eyebrow={overview.highlights.plan.eyebrow}
              title={overview.highlights.plan.title}
              description={overview.highlights.plan.description}
            />
            <SummaryTile
              icon={Ticket}
              eyebrow={overview.highlights.credits.eyebrow}
              title={overview.highlights.credits.title}
              description={overview.highlights.credits.description}
            />
            <SummaryTile
              icon={CreditCard}
              eyebrow={overview.highlights.card.eyebrow}
              title={overview.highlights.card.title}
              description={overview.highlights.card.description}
            />
          </>
        }
        cardContent={
          <MemberCardLinking
            hasLinkedCard={overview.hasLinkedCard}
            cardLabel={overview.linkedCardLabel}
          />
        }
        purchaseContent={
          <MemberCreditPackPurchase
            packs={overview.purchasableCreditPacks}
            initiallySelectedId={overview.selectedCreditPackId}
          />
        }
        paymentsContent={
          overview.payments.length > 0 ? (
            <div className="space-y-3">
              {overview.payments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </div>
          ) : (
            <EmptyInsetCard
              title="Aún no hay pagos registrados"
              description="Cuando completes una compra, aquí tendrás un histórico corto para recuperar el contexto comercial sin salir del portal."
            />
          )
        }
        alertsContent={
          overview.alerts.length > 0 ? (
            <div className="space-y-3">
              {overview.alerts.map((alert) => (
                <AlertTile key={alert.kind} alert={alert} />
              ))}
            </div>
          ) : (
            <EmptyInsetCard
              title="Todo en orden por ahora"
              description="No detectamos señales comerciales que requieran atención inmediata dentro de tu cuenta."
            />
          )
        }
        securityContent={
          <>
            <SecurityTile
              icon={Mail}
              eyebrow="Email de acceso"
              title={overview.summary.email}
              detail={overview.summary.displayName}
              titleProps={{ translate: 'no' }}
            />
            <SecurityTile
              icon={Wallet}
              eyebrow="Estado actual"
              title={overview.summary.memberStatusLabel}
              detail={`Roles activos: ${overview.summary.rolesLabel}`}
            />
            <div className="pt-2">
              <LogoutButton />
            </div>
          </>
        }
      />
    </>
  )
}

export function MemberAccountDashboardSkeletonBody() {
  return (
    <MemberAccountDashboardLayout
      summaryTiles={
        <>
          {Array.from({ length: 3 }).map((_, index) => (
            <SummaryTileSkeleton key={index} />
          ))}
        </>
      }
      cardContent={<PaymentRowSkeleton />}
      purchaseContent={
        <div className="grid gap-3 md:grid-cols-2">
          <PaymentRowSkeleton />
          <PaymentRowSkeleton />
        </div>
      }
      paymentsContent={
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <PaymentRowSkeleton key={index} />
          ))}
        </div>
      }
      alertsContent={
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <AlertTileSkeleton key={index} />
          ))}
        </div>
      }
      securityContent={
        <>
          <SecurityTileSkeleton />
          <SecurityTileSkeleton />
          <div className="pt-2">
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        </>
      }
    />
  )
}

function MemberAccountDashboardLayout({
  summaryTiles,
  cardContent,
  purchaseContent,
  paymentsContent,
  alertsContent,
  securityContent,
}: {
  summaryTiles: ReactNode
  cardContent: ReactNode
  purchaseContent: ReactNode
  paymentsContent: ReactNode
  alertsContent: ReactNode
  securityContent: ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-3">{summaryTiles}</div>

      <SectionCard title="Tarjeta vinculada">{cardContent}</SectionCard>

      <SectionCard title="Comprar bonos">{purchaseContent}</SectionCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(300px,0.84fr)]">
        <SectionCard title="Pagos recientes">{paymentsContent}</SectionCard>

        <div className="grid gap-4">
          <SectionCard title="Alertas comerciales">{alertsContent}</SectionCard>
          <SectionCard title="Sesión y seguridad">{securityContent}</SectionCard>
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none">
      <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_74%,white)] px-6 py-6 sm:px-8">
        <CardTitle className="text-xl text-[var(--wellstudio-ink)]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-6 sm:px-8">{children}</CardContent>
    </Card>
  )
}

function SummaryTile({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <SummaryTileFrame
      icon={
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] text-[var(--wellstudio-blue-deep)] shadow-[0_10px_24px_rgba(18,20,24,0.06)]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      }
      eyebrow={eyebrow}
      title={title}
      description={description}
    />
  )
}

function SummaryTileSkeleton() {
  return (
    <SummaryTileFrame
      icon={<Skeleton className="size-11 rounded-full" />}
      eyebrow={<Skeleton className="h-3 w-24 rounded-full" />}
      title={<Skeleton className="h-5 w-32 rounded-full" />}
      description={
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-11/12 rounded-full" />
        </div>
      }
    />
  )
}

function SummaryTileFrame({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode
  eyebrow: ReactNode
  title: ReactNode
  description: ReactNode
}) {
  return (
    <Card className="overflow-visible rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none">
      <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start gap-4">
          {icon}
          <div className="min-w-0 space-y-2">
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
              {eyebrow}
            </div>
            <div className="text-lg font-medium text-[var(--wellstudio-ink)]">{title}</div>
            <div className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              {description}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentRow({ payment }: { payment: MemberPaymentItem }) {
  return (
    <PaymentRowFrame
      title={payment.title}
      detail={payment.detailLabel}
      date={payment.dateLabel}
      amount={payment.amountLabel}
      status={<StatusPill tone={payment.statusTone}>{payment.statusLabel}</StatusPill>}
    />
  )
}

function PaymentRowSkeleton() {
  return (
    <PaymentRowFrame
      title={<Skeleton className="h-4 w-36 rounded-full" />}
      detail={<Skeleton className="h-4 w-40 rounded-full" />}
      date={<Skeleton className="h-3 w-24 rounded-full" />}
      amount={<Skeleton className="h-4 w-16 rounded-full" />}
      status={<Skeleton className="h-7 w-20 rounded-full" />}
    />
  )
}

function PaymentRowFrame({
  title,
  detail,
  date,
  amount,
  status,
}: {
  title: ReactNode
  detail: ReactNode
  date: ReactNode
  amount: ReactNode
  status: ReactNode
}) {
  return (
    <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-[color:color-mix(in_srgb,var(--card)_72%,white)] px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-medium text-[var(--wellstudio-ink)]">{title}</div>
          <div className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
            {detail}
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-[color:color-mix(in_srgb,var(--foreground)_62%,white)]">
            {date}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="tabular-nums text-sm font-medium text-[var(--wellstudio-ink)]">{amount}</div>
          {status}
        </div>
      </div>
    </div>
  )
}

function AlertTile({ alert }: { alert: MemberAccountAlert }) {
  return (
    <AlertTileFrame
      icon={
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)] shadow-[0_10px_24px_rgba(18,20,24,0.07)]">
          <ShieldAlert className="size-4" aria-hidden="true" />
        </span>
      }
      title={alert.title}
      description={alert.description}
    />
  )
}

function AlertTileSkeleton() {
  return (
    <AlertTileFrame
      icon={<Skeleton className="size-10 rounded-full bg-white" />}
      title={<Skeleton className="h-4 w-36 rounded-full" />}
      description={
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-11/12 rounded-full" />
        </div>
      }
    />
  )
}

function AlertTileFrame({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: ReactNode
  description: ReactNode
}) {
  return (
    <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] px-4 py-4">
      <div className="flex items-start gap-3">
        {icon}
        <div className="min-w-0 space-y-1.5">
          <div className="text-sm font-medium text-[var(--wellstudio-ink)]">{title}</div>
          <div className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
            {description}
          </div>
        </div>
      </div>
    </div>
  )
}

function SecurityTile({
  icon: Icon,
  eyebrow,
  title,
  detail,
  titleProps,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  detail: string
  titleProps?: ComponentProps<'p'>
}) {
  return (
    <SecurityTileFrame
      icon={
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)] shadow-[0_10px_24px_rgba(18,20,24,0.07)]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      }
      eyebrow={eyebrow}
      title={
        <p
          className="break-words text-sm font-medium text-[var(--wellstudio-ink)]"
          {...titleProps}
        >
          {title}
        </p>
      }
      detail={detail}
    />
  )
}

function SecurityTileSkeleton() {
  return (
    <SecurityTileFrame
      icon={<Skeleton className="size-10 rounded-full bg-white" />}
      eyebrow={<Skeleton className="h-3 w-24 rounded-full" />}
      title={<Skeleton className="h-4 w-40 rounded-full" />}
      detail={<Skeleton className="h-4 w-32 rounded-full" />}
    />
  )
}

function SecurityTileFrame({
  icon,
  eyebrow,
  title,
  detail,
}: {
  icon: ReactNode
  eyebrow: ReactNode
  title: ReactNode
  detail: ReactNode
}) {
  return (
    <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-[color:color-mix(in_srgb,var(--card)_72%,white)] px-4 py-4">
      <div className="flex items-start gap-3">
        {icon}
        <div className="min-w-0 space-y-1">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
            {eyebrow}
          </div>
          <div className="text-sm font-medium text-[var(--wellstudio-ink)]">{title}</div>
          <div className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
            {detail}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyInsetCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_24%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_7%,white)] px-5 py-5">
      <p className="text-sm font-medium text-[var(--wellstudio-ink)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
        {description}
      </p>
    </div>
  )
}

function StatusPill({
  children,
  tone,
}: {
  children: string
  tone: 'allowed' | 'blocked' | 'neutral'
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.18em] uppercase',
        tone === 'allowed'
          ? 'bg-[color:color-mix(in_srgb,var(--success-400)_26%,white)] text-[color:color-mix(in_srgb,var(--wellstudio-blue-deep)_92%,black)]'
          : tone === 'blocked'
            ? 'bg-[color:color-mix(in_srgb,var(--danger-500)_18%,white)] text-[color:color-mix(in_srgb,var(--danger-500)_92%,black)]'
            : 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] text-[var(--wellstudio-blue-deep)]',
      )}
    >
      {children}
    </span>
  )
}
