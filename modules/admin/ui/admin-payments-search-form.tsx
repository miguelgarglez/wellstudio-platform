'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import type { AdminPaymentStatusFilter } from '@/modules/admin/server/admin-payments-overview'

type AdminPaymentsSearchFormProps = {
  query: string
  status: AdminPaymentStatusFilter
}

export function AdminPaymentsSearchForm({
  query,
  status,
}: AdminPaymentsSearchFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submittedHref, setSubmittedHref] = useState<string | null>(null)
  const currentHref = buildPaymentsHref({ query, status })
  const isSearching = isPending || (submittedHref !== null && submittedHref !== currentHref)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextHref = buildPaymentsHref({
      query: String(formData.get('q') ?? ''),
      status,
    })

    setSubmittedHref(nextHref)
    startTransition(() => router.push(nextHref))
    window.setTimeout(() => setSubmittedHref(null), 1200)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label htmlFor="admin-payments-search" className="sr-only">
        Buscar cobro por socio o email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="admin-payments-search"
          name="q"
          defaultValue={query}
          placeholder="Nombre o email del socio…"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 bg-white"
        />
        <Button
          type="submit"
          disabled={isSearching}
          className="shrink-0 rounded-full px-5 sm:w-auto"
        >
          {isSearching ? (
            <>
              <Spinner data-icon="inline-start" />
              Buscando…
            </>
          ) : (
            'Buscar'
          )}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {isSearching ? 'Buscando cobros' : ''}
      </p>
    </form>
  )
}

function buildPaymentsHref(input: {
  query: string
  status: AdminPaymentStatusFilter
}) {
  const params = new URLSearchParams()
  const query = input.query.trim()
  if (query) params.set('q', query)
  if (input.status !== 'all') params.set('status', input.status)
  const queryString = params.toString()
  return queryString ? `/admin/payments?${queryString}` : '/admin/payments'
}
