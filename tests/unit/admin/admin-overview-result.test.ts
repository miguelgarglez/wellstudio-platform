import { describe, expect, it, vi } from 'vitest'

import { readAdminOverview } from '@/modules/admin/server/admin-overview-result'

describe('readAdminOverview', () => {
  it('returns the loaded overview when the query succeeds', async () => {
    await expect(readAdminOverview(async () => ({ sessions: 3 }))).resolves.toEqual({
      ok: true,
      data: { sessions: 3 },
    })
  })

  it('returns a typed failure instead of throwing when the query fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(readAdminOverview(async () => {
      throw new Error('db timeout')
    })).resolves.toEqual({ ok: false })

    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
