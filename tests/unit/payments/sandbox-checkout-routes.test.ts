import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST as cancelCheckout } from '@/app/checkout/sandbox/cancel/route'
import { POST as cancelCard } from '@/app/checkout/sandbox/card/cancel/route'
import { POST as confirmCard } from '@/app/checkout/sandbox/card/confirm/route'
import { POST as confirmCheckout } from '@/app/checkout/sandbox/confirm/route'

const { requireContext, cancel, completeCheckout, completeCard } = vi.hoisted(() => ({
  requireContext: vi.fn(),
  cancel: vi.fn(),
  completeCheckout: vi.fn(),
  completeCard: vi.fn(),
}))

vi.mock('@/modules/auth/server/identity', () => ({
  requireAuthenticatedContext: requireContext,
}))
vi.mock('@/modules/payments/server/sandbox-checkout', () => ({
  cancelSandboxCheckout: cancel,
  completeSandboxCheckout: completeCheckout,
  completeSandboxCardSetup: completeCard,
}))
vi.mock('@/modules/notifications/server/notification-outbox', () => ({
  dispatchNotificationJobSafely: vi.fn(),
}))

const routes = [
  { path: 'cancel', handler: cancelCheckout, parameter: 'checkout', outcome: 'canceled', mutation: cancel },
  { path: 'confirm', handler: confirmCheckout, parameter: 'checkout', outcome: 'success', mutation: completeCheckout },
  { path: 'card/cancel', handler: cancelCard, parameter: 'card', outcome: 'canceled', mutation: cancel },
  { path: 'card/confirm', handler: confirmCard, parameter: 'card', outcome: 'success', mutation: completeCard },
]

function requestFor(path: string, paymentId = 'payment&next=external') {
  return new Request(`http://0.0.0.0:3001/checkout/sandbox/${path}`, {
    method: 'POST',
    headers: {
      host: 'localhost:3001',
      'x-forwarded-host': 'untrusted.invalid',
    },
    body: new URLSearchParams({ paymentId }),
  })
}

describe('sandbox checkout redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireContext.mockResolvedValue({ member: { id: 'member-1' } })
    completeCheckout.mockResolvedValue({ success: true, notificationJobIds: [] })
    completeCard.mockResolvedValue({ success: true })
  })

  it.each(routes)('$path stays on the browser origin after the member mutation', async (route) => {
    const response = await route.handler(requestFor(route.path))

    expect(route.mutation).toHaveBeenCalledWith({
      memberId: 'member-1',
      paymentId: 'payment&next=external',
    })
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      `/app/account?${route.parameter}=${route.outcome}&payment=payment%26next%3Dexternal`,
    )
    expect(new URL(response.headers.get('location')!, 'https://demo.example')).toMatchObject({
      origin: 'https://demo.example',
      pathname: '/app/account',
    })
  })

  const confirmations = routes.filter((route) => route.outcome === 'success')

  it.each(confirmations)('$path keeps a rejected completion on the same origin', async (route) => {
    route.mutation.mockResolvedValue({ success: false })

    const response = await route.handler(requestFor(route.path))

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      `/app/account?${route.parameter}=failed&payment=payment%26next%3Dexternal`,
    )
  })

  it.each(confirmations)('$path redirects missing payment IDs without a mutation', async (route) => {
    const response = await route.handler(requestFor(route.path, ''))

    expect(route.mutation).not.toHaveBeenCalled()
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(`/app/account?${route.parameter}=failed`)
  })

  it.each(confirmations)('$path redirects missing members without a mutation', async (route) => {
    requireContext.mockResolvedValue({ member: null })

    const response = await route.handler(requestFor(route.path))

    expect(route.mutation).not.toHaveBeenCalled()
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(`/app/account?${route.parameter}=failed`)
  })
})
