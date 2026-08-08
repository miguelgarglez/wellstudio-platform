import type { ComponentProps, ReactNode } from 'react'
import { CalendarDays, IdCard, Mail, Phone, ShieldCheck, type LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { MemberProfileOverview } from '@/modules/members/server/member-profile-overview'
import { cn } from '@/lib/utils'
import { MemberProfileEditor } from '@/modules/members/ui/member-profile-editor'

type MemberProfileDashboardProps = {
  overview: MemberProfileOverview
}

export function MemberProfileDashboard({ overview }: MemberProfileDashboardProps) {
  return (
    <MemberProfileDashboardLayout
      personalAction={<MemberProfileEditor profile={overview.editable} email={overview.email} />}
      personalFields={
        <>
          <ProfileField
            icon={IdCard}
            label="Nombre completo"
            value={overview.fullName}
            emphasize
          />
          <ProfileField
            icon={Mail}
            label="Email de acceso"
            value={overview.email}
            valueProps={{ translate: 'no' }}
          />
          <ProfileField icon={Phone} label="Teléfono" value={overview.phoneLabel} />
          <ProfileField
            icon={CalendarDays}
            label="Fecha de nacimiento"
            value={overview.birthDateLabel}
          />
        </>
      }
      profileStateContent={
        <ProfileStateInset
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
          eyebrow="Estado actual"
          title={overview.statusLabel}
          detail={`Alta registrada ${overview.joinedAtLabel}`}
        />
      }
      consentContent={
        overview.consents.length > 0 ? (
          <div className="space-y-3">
            {overview.consents.map((consent) => (
              <ConsentRow
                key={consent.id}
                label={consent.label}
                detail={consent.detailLabel}
                status={
                  <StatusPill tone={consent.statusLabel === 'Aceptado' ? 'allowed' : 'neutral'}>
                    {consent.statusLabel}
                  </StatusPill>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyInsetCard
            title="Aún no hay consentimientos registrados"
            description="Cuando se consoliden más flujos de cuenta, aquí quedará visible el estado legal y comercial asociado al perfil."
          />
        )
      }
    />
  )
}

export function MemberProfileDashboardSkeletonBody() {
  return (
    <MemberProfileDashboardLayout
      personalAction={<Skeleton className="h-9 w-28 rounded-full" />}
      personalFields={
        <>
          {Array.from({ length: 4 }).map((_, index) => (
            <ProfileFieldSkeleton key={index} />
          ))}
        </>
      }
      profileStateContent={
        <ProfileStateInset
          icon={<Skeleton className="size-10 rounded-full bg-white" />}
          eyebrow={<Skeleton className="h-3 w-24 rounded-full" />}
          title={<Skeleton className="h-5 w-40 rounded-full" />}
          detail={<Skeleton className="h-4 w-28 rounded-full" />}
        />
      }
      consentContent={
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ConsentRowSkeleton key={index} />
          ))}
        </div>
      }
    />
  )
}

function MemberProfileDashboardLayout({
  personalAction,
  personalFields,
  profileStateContent,
  consentContent,
}: {
  personalAction: ReactNode
  personalFields: ReactNode
  profileStateContent: ReactNode
  consentContent: ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)]">
      <SectionCard title="Datos personales" action={personalAction}>
        <div className="grid gap-4 sm:grid-cols-2">{personalFields}</div>
      </SectionCard>

      <div className="grid min-w-0 gap-4">
        <SectionCard title="Estado de perfil">{profileStateContent}</SectionCard>
        <SectionCard title="Consentimientos">{consentContent}</SectionCard>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="min-w-0 overflow-visible rounded-[2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-white py-0 shadow-none">
      <CardHeader className="border-b border-[color:color-mix(in_srgb,var(--border)_74%,white)] px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl text-[var(--wellstudio-ink)]">{title}</CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-6 sm:px-8">{children}</CardContent>
    </Card>
  )
}

function ProfileField({
  icon: Icon,
  label,
  value,
  emphasize = false,
  valueProps,
}: {
  icon: LucideIcon
  label: string
  value: string
  emphasize?: boolean
  valueProps?: ComponentProps<'p'>
}) {
  return (
    <ProfileFieldFrame
      icon={
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)] shadow-[0_10px_24px_rgba(18,20,24,0.07)]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      }
      label={label}
      value={
        <p
          className={cn(
            'break-words text-sm text-[color:color-mix(in_srgb,var(--foreground)_76%,white)]',
            emphasize && 'text-base font-medium text-[var(--wellstudio-ink)]',
          )}
          {...valueProps}
        >
          {value}
        </p>
      }
    />
  )
}

function ProfileFieldSkeleton() {
  return (
    <ProfileFieldFrame
      icon={<Skeleton className="size-10 rounded-full bg-white" />}
      label={<Skeleton className="h-3 w-28 rounded-full" />}
      value={<Skeleton className="h-5 w-36 rounded-full" />}
    />
  )
}

function ProfileFieldFrame({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: ReactNode
  value: ReactNode
}) {
  return (
    <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-[color:color-mix(in_srgb,var(--card)_72%,white)] px-4 py-4">
      <div className="flex items-start gap-3">
        {icon}
        <div className="min-w-0 space-y-1">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
            {label}
          </div>
          {value}
        </div>
      </div>
    </div>
  )
}

function ProfileStateInset({
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
    <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_14%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_6%,white)] px-4 py-4">
      <div className="flex items-start gap-3">
        {icon}
        <div className="min-w-0 space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
            {eyebrow}
          </div>
          <div className="text-lg font-medium text-[var(--wellstudio-ink)]">{title}</div>
          <div className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
            {detail}
          </div>
        </div>
      </div>
    </div>
  )
}

function ConsentRow({
  label,
  detail,
  status,
}: {
  label: ReactNode
  detail: ReactNode
  status: ReactNode
}) {
  return (
    <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--border)_76%,white)] bg-[color:color-mix(in_srgb,var(--card)_72%,white)] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-medium text-[var(--wellstudio-ink)]">{label}</div>
          <div className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
            {detail}
          </div>
        </div>
        {status}
      </div>
    </div>
  )
}

function ConsentRowSkeleton() {
  return (
    <ConsentRow
      label={<Skeleton className="h-4 w-28 rounded-full" />}
      detail={<Skeleton className="h-4 w-36 rounded-full" />}
      status={<Skeleton className="h-7 w-24 rounded-full" />}
    />
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
  tone: 'allowed' | 'neutral'
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium tracking-[0.18em] uppercase',
        tone === 'allowed'
          ? 'bg-[color:color-mix(in_srgb,var(--success-400)_26%,white)] text-[color:color-mix(in_srgb,var(--wellstudio-blue-deep)_92%,black)]'
          : 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] text-[var(--wellstudio-blue-deep)]',
      )}
    >
      {children}
    </span>
  )
}
