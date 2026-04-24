import type { Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { Client } from 'pg'
import { createClient } from '@supabase/supabase-js'

import { normalizeEmail } from '@/modules/auth/lib/normalize-email'

import { AuthPage } from '../page-objects/auth-page'
import { getSandboxAdminCredentials, getSandboxCredentials, loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export async function loginAsSandboxMember(page: Page) {
  const authPage = new AuthPage(page)
  const { email, password } = getSandboxCredentials()

  await authPage.gotoLogin()
  await authPage.fillLoginForm(email, password)
  await authPage.submitLogin()
  await authPage.expectProtectedMemberShell()
}

export async function loginAsSandboxAdmin(page: Page) {
  const authPage = new AuthPage(page)
  const { email, password } = getSandboxAdminCredentials()

  await ensureSandboxAdminAccess(email, password)

  await page.goto('/admin')
  await authPage.fillLoginForm(email, password)
  await authPage.submitLogin()
  await page.waitForURL(/\/admin(?:\?.*)?$/, {
    timeout: 15_000,
  })
  await page.waitForLoadState('domcontentloaded')

  await page.goto('/admin')
  await authPage.expectAdminPoliciesVisible()
}

export async function ensureSandboxAdminAccess(email: string, password: string) {
  await ensureSandboxAdminAuthUser(email, password)
  await grantSandboxAdminRole(email)
}

async function ensureSandboxAdminAuthUser(email: string, password: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for sandbox admin setup')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const users = await listUsersByEmail(supabase, email)
  const existingUser = users[0] ?? null

  if (existingUser) {
    return
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      scenario: 'admin',
      source: 'wellstudio-playwright',
    },
  })

  if (error) {
    throw new Error(`Failed to create sandbox admin user: ${error.message}`)
  }
}

async function grantSandboxAdminRole(email: string) {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to promote the sandbox admin role')
  }

  const client = new Client({
    connectionString,
  })

  await client.connect()

  try {
    const userResult = await client.query<{ id: string }>(
      'select "id" from "User" where "normalizedEmail" = $1 limit 1',
      [normalizeEmail(email)],
    )

    const user = userResult.rows[0] ?? null

    if (!user) {
      throw new Error(`Sandbox admin user ${email} is missing a local identity`)
    }

    await client.query(
      'insert into "UserRole" ("id", "userId", "role", "createdAt") values ($1, $2, $3, now()) on conflict ("userId", "role") do nothing',
      [randomUUID(), user.id, 'ADMIN'],
    )
  } finally {
    await client.end()
  }
}

async function listUsersByEmail(supabase: AdminSupabaseClient, email: string) {
  const matches: Array<{ id: string }> = []

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      throw new Error(`Failed to list sandbox auth users: ${error.message}`)
    }

    const users = data?.users ?? []
    matches.push(
      ...users
        .filter((user) => user.email?.toLowerCase() === email.toLowerCase())
        .map((user) => ({ id: user.id })),
    )

    if (users.length < 200) {
      break
    }
  }

  return matches
}

type AdminSupabaseClient = {
  auth: {
    admin: {
      listUsers(input: {
        page: number
        perPage: number
      }): Promise<{
        data?: {
          users?: Array<{
            id: string
            email?: string | null
          }>
        }
        error?: {
          message: string
        } | null
      }>
    }
  }
}
