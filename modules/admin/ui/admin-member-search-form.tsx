'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

type AdminMemberSearchFormProps = {
  query: string
  selectedMemberId: string | null
}

export function AdminMemberSearchForm({
  query,
  selectedMemberId,
}: AdminMemberSearchFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submittedHref, setSubmittedHref] = useState<string | null>(null)
  const currentHref = buildOverridesHref({ query, selectedMemberId })
  const isSearching = isPending || (submittedHref !== null && submittedHref !== currentHref)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextQuery = String(formData.get('q') ?? '').trim()
    const nextMemberId = String(formData.get('member') ?? '').trim()
    const nextHref = buildOverridesHref({
      query: nextQuery,
      selectedMemberId: nextMemberId || null,
    })

    setSubmittedHref(nextHref)

    startTransition(() => {
      router.push(nextHref)
    })

    window.setTimeout(() => {
      setSubmittedHref(null)
    }, 1200)
  }

  return (
    <form onSubmit={handleSubmit} className="px-2 pb-2 pt-3">
      <div className="space-y-3">
        {selectedMemberId ? (
          <input type="hidden" name="member" value={selectedMemberId} />
        ) : null}
        <Input
          name="q"
          defaultValue={query}
          placeholder="Busca por nombre o email…"
          autoComplete="off"
          spellCheck={false}
          aria-label="Buscar socio"
          className="bg-white"
        />
        <SearchSubmitButton pending={isSearching} />
      </div>
    </form>
  )
}

function buildOverridesHref(input: {
  query: string
  selectedMemberId: string | null
}) {
  const params = new URLSearchParams()
  const nextQuery = input.query.trim()

  if (nextQuery) {
    params.set('q', nextQuery)
  }

  if (input.selectedMemberId) {
    params.set('member', input.selectedMemberId)
  }

  const queryString = params.toString()

  return queryString ? `/admin/overrides?${queryString}` : '/admin/overrides'
}

function SearchSubmitButton({ pending }: { pending: boolean }) {
  return (
    <>
      <Button
        type="submit"
        className="w-full rounded-full transition-[opacity,box-shadow,transform] duration-150"
        disabled={pending}
      >
        {pending ? (
          <>
            <Spinner data-icon="inline-start" />
            Buscando…
          </>
        ) : (
          'Buscar socio'
        )}
      </Button>
      <p className="sr-only" aria-live="polite">
        {pending ? 'Buscando socios' : ''}
      </p>
    </>
  )
}
