import { describe, expect, it, vi } from 'vitest'

import {
  REQUIRED_CONFIRMATION_FLAG,
  buildDeletePlan,
  isE2eScenarioEmail,
  main,
  parseOptions,
  type DeleteSandboxUserIo,
  type LocalIdentitySnapshot,
} from '../../../scripts/auth/delete-sandbox-user.mjs'

const emptySnapshot = {
  users: [],
  members: [],
  auditLogsCount: 0,
  coachesCount: 0,
  convertedLeadsCount: 0,
  revokesCount: 0,
  grantsCount: 0,
}

describe('parseOptions', () => {
  it('ignores the pnpm argument separator', () => {
    expect(parseOptions(['--', 'you@wellstudio.test'])).toMatchObject({
      email: 'you@wellstudio.test',
      apply: false,
      confirm: false,
    })
  })

  it('keeps apply, confirmation and e2e protection as separate flags', () => {
    expect(
      parseOptions([
        'Miguel.Garglez@gmail.com',
        '--apply',
        REQUIRED_CONFIRMATION_FLAG,
        '--include-e2e-scenario',
        '--detach-grants',
      ]),
    ).toEqual({
      email: 'miguel.garglez@gmail.com',
      apply: true,
      confirm: true,
      includeE2eScenario: true,
      detachGrants: true,
    })
  })
})

describe('isE2eScenarioEmail', () => {
  it('protects the dedicated e2e sandbox accounts', () => {
    expect(isE2eScenarioEmail('e2e.member.sandbox@wellstudio.test')).toBe(true)
    expect(isE2eScenarioEmail('e2e.admin.sandbox@wellstudio.test')).toBe(true)
    expect(isE2eScenarioEmail('miguel.garglez@gmail.com')).toBe(false)
  })
})

describe('buildDeletePlan', () => {
  it('refuses to delete a user who granted booking overrides unless explicitly detached', () => {
    const plan = buildDeletePlan({
      email: 'staff@wellstudio.test',
      authUsers: [{ id: 'auth-1' }],
      localSnapshot: {
        ...emptySnapshot,
        users: [{ id: 'user-1' }],
        members: [{ id: 'member-1' }],
        grantsCount: 2,
      },
      detachGrants: false,
    })

    expect(plan.ok).toBe(false)
    expect(plan.reason).toMatch(/--detach-grants/)
  })

  it('plans auth + local deletion and nullable FK detaches', () => {
    const plan = buildDeletePlan({
      email: 'miguel.garglez@gmail.com',
      authUsers: [{ id: 'auth-new' }],
      localSnapshot: {
        users: [{ id: 'user-1' }],
        members: [{ id: 'member-1' }],
        auditLogsCount: 1,
        coachesCount: 0,
        convertedLeadsCount: 1,
        revokesCount: 0,
        grantsCount: 0,
      },
      detachGrants: false,
    })

    expect(plan).toMatchObject({
      ok: true,
      nothingToDelete: false,
      authUserIds: ['auth-new'],
      localUserIds: ['user-1'],
      memberIds: ['member-1'],
      detach: {
        auditLogs: 1,
        convertedLeads: 1,
        grantedOverrides: 0,
      },
    })
  })
})

describe('main sandbox guards', () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://ighrofdvwpqoyozjisyr.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    SUPABASE_SANDBOX_PROJECT_REF: 'ighrofdvwpqoyozjisyr',
    E2E_AUTH_SANDBOX: 'true',
    DATABASE_URL: 'postgres://sandbox',
  }

  it('does not delete e2e scenario accounts without the extra flag', async () => {
    await expect(main(['e2e.member.sandbox@wellstudio.test'], env, createIo())).rejects.toThrow(
      /include-e2e-scenario/,
    )
  })

  it('dry-runs without touching Auth or Postgres', async () => {
    const io = createIo({
      authUsers: [{ id: 'auth-1', email: 'you@wellstudio.test' }],
      localSnapshot: {
        ...emptySnapshot,
        users: [{ id: 'user-1' }],
        members: [{ id: 'member-1' }],
      },
    })

    const plan = await main(['you@wellstudio.test'], env, io)

    expect(plan.ok).toBe(true)
    expect(io.deleteLocalIdentity).not.toHaveBeenCalled()
    expect(io.deleteAuthUsers).not.toHaveBeenCalled()
  })

  it('requires the confirmation flag before applying', async () => {
    const io = createIo({
      authUsers: [{ id: 'auth-1' }],
      localSnapshot: {
        ...emptySnapshot,
        users: [{ id: 'user-1' }],
      },
    })

    await expect(main(['you@wellstudio.test', '--apply'], env, io)).rejects.toThrow(
      REQUIRED_CONFIRMATION_FLAG,
    )
    expect(io.deleteLocalIdentity).not.toHaveBeenCalled()
  })

  it('deletes local identity before Auth when apply is confirmed', async () => {
    const io = createIo({
      authUsers: [{ id: 'auth-1' }],
      localSnapshot: {
        ...emptySnapshot,
        users: [{ id: 'user-1' }],
        members: [{ id: 'member-1' }],
      },
    })

    await main(['you@wellstudio.test', '--apply', REQUIRED_CONFIRMATION_FLAG], env, io)

    expect(io.deleteLocalIdentity).toHaveBeenCalledOnce()
    expect(io.deleteAuthUsers).toHaveBeenCalledWith(expect.anything(), ['auth-1'])
  })
})

function createIo(overrides: {
  authUsers?: Array<{ id: string; email?: string }>
  localSnapshot?: LocalIdentitySnapshot
} = {}): DeleteSandboxUserIo {
  return {
    createSupabaseAdmin: vi.fn(() => ({})),
    listUsersByEmail: vi.fn(async () => overrides.authUsers ?? []),
    loadLocalIdentity: vi.fn(async () => overrides.localSnapshot ?? emptySnapshot),
    deleteLocalIdentity: vi.fn(async () => undefined),
    deleteAuthUsers: vi.fn(async () => undefined),
    log: vi.fn(),
  }
}
