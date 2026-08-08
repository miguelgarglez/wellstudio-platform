'use client'

import { useActionState, useEffect, useEffectEvent, useState } from 'react'
import { CalendarDays, LockKeyhole, PencilLine, Phone, UserRound } from 'lucide-react'

import {
  updateMemberProfileAction,
  type UpdateMemberProfileActionState,
} from '@/app/(member)/app/profile/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OperationToast } from '@/components/ui/operation-toast'
import { Spinner } from '@/components/ui/spinner'
import type { MemberProfileOverview } from '@/modules/members/server/member-profile-overview'

type EditableProfile = MemberProfileOverview['editable']

export function MemberProfileEditor({
  profile,
  email,
}: {
  profile: EditableProfile
  email: string
}) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState<{ id: number; description: string } | null>(null)

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={<Button type="button" variant="outline" size="sm" className="rounded-full" />}
        >
          <PencilLine className="size-4" aria-hidden="true" />
          Editar datos
        </DialogTrigger>
        {open ? (
          <ProfileEditForm
            profile={profile}
            email={email}
            onSaved={(description) => {
              setOpen(false)
              setConfirmation({ id: Date.now(), description })
            }}
          />
        ) : null}
      </Dialog>

      {confirmation ? (
        <OperationToast
          key={confirmation.id}
          title="Perfil actualizado"
          description={confirmation.description}
        />
      ) : null}
    </>
  )
}

function ProfileEditForm({
  profile,
  email,
  onSaved,
}: {
  profile: EditableProfile
  email: string
  onSaved: (description: string) => void
}) {
  const [state, action, pending] = useActionState<UpdateMemberProfileActionState, FormData>(
    updateMemberProfileAction,
    null,
  )
  const fieldErrors = state?.success === false ? state.fieldErrors ?? {} : {}
  const handleSaved = useEffectEvent(onSaved)

  useEffect(() => {
    if (state?.success) handleSaved(state.message)
  }, [state])

  return (
    <DialogContent className="max-h-[calc(100dvh-1rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
      <DialogHeader className="border-b border-border/70 px-5 py-5 sm:px-7 sm:py-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
          Datos personales
        </p>
        <DialogTitle className="text-2xl tracking-[-0.035em]">Editar tu perfil</DialogTitle>
        <DialogDescription>
          Mantén actualizados los datos que utiliza el estudio para identificarte y contactarte.
        </DialogDescription>
      </DialogHeader>

      <form action={action} className="flex min-h-0 flex-col overflow-hidden">
        <input type="hidden" name="expectedUpdatedAt" value={profile.updatedAtIso} />
        <div className="min-h-0 space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {state?.success === false ? (
            <div
              role="alert"
              className="rounded-[1.1rem] border border-destructive/18 bg-destructive/6 px-4 py-3 text-sm leading-6 text-destructive"
            >
              {state.message}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileInput
              id="member-profile-first-name"
              name="firstName"
              label="Nombre"
              icon={<UserRound className="size-4" aria-hidden="true" />}
              defaultValue={profile.firstName}
              autoComplete="given-name"
              error={fieldErrors.firstName}
              required
            />
            <ProfileInput
              id="member-profile-last-name"
              name="lastName"
              label="Apellidos"
              icon={<UserRound className="size-4" aria-hidden="true" />}
              defaultValue={profile.lastName}
              autoComplete="family-name"
              error={fieldErrors.lastName}
              required
            />
            <ProfileInput
              id="member-profile-phone"
              name="phone"
              label="Teléfono"
              icon={<Phone className="size-4" aria-hidden="true" />}
              defaultValue={profile.phone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Ej. 612 345 678"
              error={fieldErrors.phone}
              required
            />
            <ProfileInput
              id="member-profile-birth-date"
              name="birthDate"
              label="Fecha de nacimiento"
              icon={<CalendarDays className="size-4" aria-hidden="true" />}
              defaultValue={profile.birthDate}
              type="date"
              min="1900-01-01"
              error={fieldErrors.birthDate}
            />
          </div>

          <div className="flex items-start gap-3 rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_12%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_5%,white)] px-4 py-4">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)]">
              <LockKeyhole className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--wellstudio-blue-deep)]">
                Email de acceso
              </p>
              <p className="mt-1 break-all text-sm font-medium" translate="no">{email}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Cambiar el email requiere verificar la nueva dirección y se gestionará en un flujo separado.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/70 bg-white px-5 py-4 sm:px-7">
          <DialogClose
            render={<Button type="button" variant="outline" disabled={pending} />}
          >
            Cancelar
          </DialogClose>
          <Button type="submit" disabled={pending} className="min-w-36">
            {pending ? <Spinner /> : <PencilLine className="size-4" aria-hidden="true" />}
            {pending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function ProfileInput({
  id,
  label,
  icon,
  error,
  ...props
}: React.ComponentProps<typeof Input> & {
  id: string
  label: string
  icon: React.ReactNode
  error?: string
}) {
  const errorId = `${id}-error`

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{icon}{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
